import * as fs from 'fs';
import * as path from 'path';
import { CanJ1939DecoderService } from './services/can-j1939-decoder.service';
import { TelemetryNormalizerService } from './services/telemetry-normalizer.service';
import { TelemetryBurstBufferService } from './services/telemetry-burst-buffer.service';
import { ExternalFailoverFirewallService, PiiViolationError } from './services/external-failover-firewall.service';
import {
  CanonicalTelemetryEvent,
  EngineStateEnum,
  IngestionSource,
  TelematicsConnectivityStatus,
} from './dto/telemetry-ingestion.dto';

describe('EPIC 2 : Ingestion Télématique Résiliente Zones Blanches & TimescaleDB', () => {
  let canDecoder: CanJ1939DecoderService;
  let normalizer: TelemetryNormalizerService;
  let burstBuffer: TelemetryBurstBufferService;
  let firewall: ExternalFailoverFirewallService;

  beforeAll(() => {
    canDecoder = new CanJ1939DecoderService();
    normalizer = new TelemetryNormalizerService(canDecoder);
    burstBuffer = new TelemetryBurstBufferService();
    firewall = new ExternalFailoverFirewallService();
  });

  describe('Tâche 2.1 : DDL TimescaleDB, Continuous Aggregates & Hypertables', () => {
    it('doit posséder le script de migration DDL 04_telemetry_timescaledb_hypertables.sql avec toutes les clauses obligatoires', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../../../database/migrations/04_telemetry_timescaledb_hypertables.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, 'utf8');
      // Hypertable
      expect(sql).toContain("create_hypertable");
      expect(sql).toContain("chunk_time_interval => INTERVAL '7 days'");
      // RLS Fail-Closed
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('FORCE ROW LEVEL SECURITY');
      expect(sql).toContain('tenant_isolation_telemetry_events');
      // Continuous Aggregates
      expect(sql).toContain('telemetry_hourly_rollup');
      expect(sql).toContain('telemetry_daily_asset_summary');
      expect(sql).toContain("time_bucket('1 hour', time)");
      expect(sql).toContain("time_bucket('1 day', time)");
      // Compression
      expect(sql).toContain("timescaledb.compress_segmentby = 'tenant_id, vehicle_id'");
      expect(sql).toContain("INTERVAL '14 days'");
    });
  });

  describe('Tâche 2.2 : Décodage J1939 Haute Vitesse & Absorption de Rafales (Store-and-Forward)', () => {
    it('doit décoder la pression d huile moteur (PGN 65263 / SPN 100 EFL_P)', () => {
      // PGN 65263 = 0xFEEF. CAN ID standard : 0x18FEEF00
      // 8 octets. Byte 4 = raw oil pressure (résolution 4 kPa/bit). Ex: 90 * 4 = 360 kPa
      const rawHexFrames = {
        '18FEEF00': 'FFFFFF5AFFFFFFFF', // Byte 1=FF, Byte 2=FF, Byte 3=FF, Byte 4=0x5A (90 dec) -> 360 kPa
      };

      const result = canDecoder.decodeRawJ1939Frames(rawHexFrames);
      expect(result.metrics.oilPressureKpa).toBe(360.0);
    });

    it('doit décoder le taux de carburant L/h (PGN 65266 / SPN 183 LFE)', () => {
      // PGN 65266 = 0xFEF2. CAN ID : 0x18FEF200
      // Bytes 1-2 LE = Fuel rate (résolution 0.05 L/h). Ex: 490 * 0.05 = 24.5 L/h. 490 = 0x01EA -> EA 01
      const rawHexFrames = {
        '18FEF200': 'EA01FFFFFFFFFFFF',
      };

      const result = canDecoder.decodeRawJ1939Frames(rawHexFrames);
      expect(result.metrics.fuelRateLPerHour).toBe(24.5);
    });

    it('doit décoder le couple du ralentisseur Retarder (PGN 61440 / SPN 520 ERC1)', () => {
      // PGN 61440 = 0xF000. CAN ID : 0x18F00000
      // Byte 2 = Retarder torque (résolution 1%, offset -125%). Ex: 175 - 125 = 50% retarder -> 175 = 0xAF
      const rawHexFrames = {
        '18F00000': 'FFAFFFFFFFFFFFFF',
      };

      const result = canDecoder.decodeRawJ1939Frames(rawHexFrames);
      expect(result.metrics.retarderTorquePct).toBe(50);
    });

    it('doit enrichir les métriques depuis les identifiants AVL IO Teltonika', () => {
      const attrs = {
        io66: '24150', // 24.15V batterie
        io81: '85',    // 85 km/h
        io82: '420',   // 420 kPa pression huile
        io183: '280',  // 28.0 L/h
        io520: '75',   // 75% retarder
      };

      const decoded = canDecoder.enrichFromTeltonikaIo(attrs);
      expect(decoded.batteryMv).toBe(24150);
      expect(decoded.canSpeedKmh).toBe(85);
      expect(decoded.oilPressureKpa).toBe(420);
      expect(decoded.fuelRateLPerHour).toBe(28.0);
      expect(decoded.retarderTorquePct).toBe(75);
    });

    it('doit trier strictement chronologiquement par device_timestamp et dédoublonner une rafale Store-and-Forward', async () => {
      const baseTime = new Date('2026-10-28T14:00:00Z').getTime();

      // Simulation de 5 paquets reçus dans le désordre lors du rattrapage 4G
      const packets: CanonicalTelemetryEvent[] = [
        {
          time: new Date(baseTime + 180000).toISOString(), // T+3 min
          tenantId: '11111111-1111-1111-1111-111111111111',
          vehicleId: '22222222-2222-2222-2222-222222222222',
          deviceImei: '860123456789012',
          sourceProvider: IngestionSource.TRACCAR,
          latitude: 31.8,
          longitude: 5.4,
          altitudeM: 140,
          speedKmh: 82,
          headingDeg: 180,
          ignitionOn: true,
          engineState: EngineStateEnum.ON,
          odometerKm: 120005,
          engineHoursSec: 360000,
          engineRpm: 1450,
          engineLoadPct: 65,
          coolantTempC: 88,
          ambientTempC: 38,
          batteryMv: 24200,
          fuelLevelPct: 75,
          fuelUsedTotalL: 450,
          defLevelPct: 80,
          ptoEngaged: false,
          harshEvent: null,
          dtcCodes: [],
          extraIotSensors: {},
          needsFlespiFailover: false,
        },
        {
          time: new Date(baseTime).toISOString(), // T+0 (le plus vieux)
          tenantId: '11111111-1111-1111-1111-111111111111',
          vehicleId: '22222222-2222-2222-2222-222222222222',
          deviceImei: '860123456789012',
          sourceProvider: IngestionSource.TRACCAR,
          latitude: 31.7,
          longitude: 5.3,
          altitudeM: 140,
          speedKmh: 80,
          headingDeg: 180,
          ignitionOn: true,
          engineState: EngineStateEnum.ON,
          odometerKm: 120000,
          engineHoursSec: 359800,
          engineRpm: 1400,
          engineLoadPct: 60,
          coolantTempC: 86,
          ambientTempC: 38,
          batteryMv: 24200,
          fuelLevelPct: 76,
          fuelUsedTotalL: 448,
          defLevelPct: 80,
          ptoEngaged: false,
          harshEvent: null,
          dtcCodes: [],
          extraIotSensors: {},
          needsFlespiFailover: false,
        },
        {
          time: new Date(baseTime + 180000).toISOString(), // DOUBLON de T+3 min
          tenantId: '11111111-1111-1111-1111-111111111111',
          vehicleId: '22222222-2222-2222-2222-222222222222',
          deviceImei: '860123456789012',
          sourceProvider: IngestionSource.TRACCAR,
          latitude: 31.8,
          longitude: 5.4,
          altitudeM: 140,
          speedKmh: 82,
          headingDeg: 180,
          ignitionOn: true,
          engineState: EngineStateEnum.ON,
          odometerKm: 120005,
          engineHoursSec: 360000,
          engineRpm: 1450,
          engineLoadPct: 65,
          coolantTempC: 88,
          ambientTempC: 38,
          batteryMv: 24200,
          fuelLevelPct: 75,
          fuelUsedTotalL: 450,
          defLevelPct: 80,
          ptoEngaged: false,
          harshEvent: null,
          dtcCodes: [],
          extraIotSensors: {},
          needsFlespiFailover: false,
        },
        {
          time: new Date(baseTime + 300000).toISOString(), // T+5 min (le plus récent)
          tenantId: '11111111-1111-1111-1111-111111111111',
          vehicleId: '22222222-2222-2222-2222-222222222222',
          deviceImei: '860123456789012',
          sourceProvider: IngestionSource.TRACCAR,
          latitude: 31.9,
          longitude: 5.5,
          altitudeM: 140,
          speedKmh: 84,
          headingDeg: 180,
          ignitionOn: true,
          engineState: EngineStateEnum.ON,
          odometerKm: 120010,
          engineHoursSec: 360180,
          engineRpm: 1460,
          engineLoadPct: 68,
          coolantTempC: 89,
          ambientTempC: 38,
          batteryMv: 24200,
          fuelLevelPct: 74,
          fuelUsedTotalL: 452,
          defLevelPct: 80,
          ptoEngaged: false,
          harshEvent: null,
          dtcCodes: [],
          extraIotSensors: {},
          needsFlespiFailover: false,
        },
      ];

      const result = await burstBuffer.processStoreAndForwardBurst(packets);

      expect(result.totalReceived).toBe(4);
      expect(result.deduplicatedCount).toBe(3); // Doublon éliminé
      expect(result.oldestPacketTimestamp).toBe(new Date(baseTime).toISOString());
      expect(result.newestPacketTimestamp).toBe(new Date(baseTime + 300000).toISOString());
      expect(result.chronologicallySorted).toBe(true);
    });
  });

  describe('Tâche 2.3 : Coupe-feu d Anonymisation Flespi (Conformité Stricte Loi 18-07 ANPDP)', () => {
    it('doit autoriser uniquement le couple pseudonymisé (ident, payload) pour le failover', () => {
      const packet = {
        deviceImei: '860123456789012',
        rawHexPayload: '000F33A1FF8800',
        registrationPlate: '02410-117-22', // Devra être purgé
        driverName: 'Hamid Djemai',        // Devra être purgé
        tenantId: 'uuid-tenant-1234',      // Devra être purgé
      };

      const anonymized = firewall.sanitizeForExternalFailover(packet);

      expect(anonymized.ident).toBe('860123456789012');
      expect(anonymized.payload).toBe('000F33A1FF8800');
      // Aucun champ PII ne subsiste
      expect((anonymized as any).registrationPlate).toBeUndefined();
      expect((anonymized as any).driverName).toBeUndefined();
      expect((anonymized as any).tenantId).toBeUndefined();
    });

    it('doit rejeter toute tentative d injection de texte PII dans le payload brut hexadécimal', () => {
      // Tentative d injecter un matricule algérien dans la trame brute
      const piiText = '02410-117-22';
      const hexPii = Buffer.from(piiText, 'utf8').toString('hex');

      expect(() => {
        firewall.sanitizeForExternalFailover({
          deviceImei: '860123456789012',
          rawHexPayload: `00FFAA${hexPii}FFEE`,
        });
      }).toThrow(PiiViolationError);
    });

    it('doit rejeter les formats IMEI invalides ou suspects', () => {
      expect(() => {
        firewall.sanitizeForExternalFailover({
          deviceImei: '123', // Trop court
          rawHexPayload: '00FFAA',
        });
      }).toThrow(PiiViolationError);
    });
  });

  describe('Tâche 2.4 : Détection des Statuts de Connectivité & Coupure Électrique', () => {
    it('doit détecter TAMPER_SUSPECTED en cas de chute anormale de tension batterie externe (< 8V)', () => {
      const event: CanonicalTelemetryEvent = {
        time: new Date().toISOString(),
        tenantId: 't1',
        vehicleId: 'v1',
        deviceImei: '860000000000000',
        sourceProvider: IngestionSource.TRACCAR,
        latitude: 36.75,
        longitude: 3.05,
        altitudeM: 50,
        speedKmh: 45,
        headingDeg: 90,
        ignitionOn: true,
        engineState: EngineStateEnum.ON,
        odometerKm: 50000,
        engineHoursSec: 100000,
        engineRpm: 1800,
        engineLoadPct: 50,
        coolantTempC: 85,
        ambientTempC: 25,
        batteryMv: 6200, // Chute anormale à 6.2V sur circuit 24V alors que contact mis !
        fuelLevelPct: 80,
        fuelUsedTotalL: 200,
        defLevelPct: 90,
        ptoEngaged: false,
        harshEvent: null,
        dtcCodes: [],
        extraIotSensors: {},
        needsFlespiFailover: false,
      };

      const status = burstBuffer.evaluateConnectivityStatus(event);
      expect(status).toBe(TelematicsConnectivityStatus.TAMPER_SUSPECTED);
    });

    it('doit qualifier un véhicule de OFFLINE_DARK_ZONE dans le Grand Sud saharien avec mission en cours', () => {
      const tenMinutesAgo = new Date(Date.now() - 600000).toISOString();
      const event: CanonicalTelemetryEvent = {
        time: tenMinutesAgo,
        tenantId: 't1',
        vehicleId: 'v1',
        deviceImei: '860000000000000',
        sourceProvider: IngestionSource.TRACCAR,
        latitude: 22.8, // Grand Sud (Tamanrasset / In Guezzam)
        longitude: 5.5,
        altitudeM: 1400,
        speedKmh: 75,
        headingDeg: 180,
        ignitionOn: true,
        engineState: EngineStateEnum.ON,
        odometerKm: 250000,
        engineHoursSec: 500000,
        engineRpm: 1500,
        engineLoadPct: 60,
        coolantTempC: 92,
        ambientTempC: 44,
        batteryMv: 24300,
        fuelLevelPct: 60,
        fuelUsedTotalL: 1200,
        defLevelPct: 70,
        ptoEngaged: false,
        harshEvent: null,
        dtcCodes: [],
        extraIotSensors: {},
        needsFlespiFailover: false,
      };

      // Wilaya 11 (Tamanrasset) avec mission active
      const status = burstBuffer.evaluateConnectivityStatus(
        event,
        new Date(),
        '11',
        true // active mission
      );
      expect(status).toBe(TelematicsConnectivityStatus.OFFLINE_DARK_ZONE);
    });

    it('doit qualifier un véhicule de ONLINE si le ping est récent (< 120s) et en mouvement', () => {
      const event: CanonicalTelemetryEvent = {
        time: new Date(Date.now() - 30000).toISOString(), // Il y a 30 secondes
        tenantId: 't1',
        vehicleId: 'v1',
        deviceImei: '860000000000000',
        sourceProvider: IngestionSource.TRACCAR,
        latitude: 36.75,
        longitude: 3.05,
        altitudeM: 50,
        speedKmh: 80,
        headingDeg: 90,
        ignitionOn: true,
        engineState: EngineStateEnum.ON,
        odometerKm: 50000,
        engineHoursSec: 100000,
        engineRpm: 1800,
        engineLoadPct: 50,
        coolantTempC: 85,
        ambientTempC: 25,
        batteryMv: 24200,
        fuelLevelPct: 80,
        fuelUsedTotalL: 200,
        defLevelPct: 90,
        ptoEngaged: false,
        harshEvent: null,
        dtcCodes: [],
        extraIotSensors: {},
        needsFlespiFailover: false,
      };

      const status = burstBuffer.evaluateConnectivityStatus(event);
      expect(status).toBe(TelematicsConnectivityStatus.ONLINE);
    });

    it('doit qualifier un véhicule de IDLE si le ping est récent, vitesse nulle et moteur tournant', () => {
      const event: CanonicalTelemetryEvent = {
        time: new Date(Date.now() - 20000).toISOString(),
        tenantId: 't1',
        vehicleId: 'v1',
        deviceImei: '860000000000000',
        sourceProvider: IngestionSource.TRACCAR,
        latitude: 36.75,
        longitude: 3.05,
        altitudeM: 50,
        speedKmh: 0,
        headingDeg: 90,
        ignitionOn: true,
        engineState: EngineStateEnum.IDLE,
        odometerKm: 50000,
        engineHoursSec: 100000,
        engineRpm: 650, // Ralenti
        engineLoadPct: 15,
        coolantTempC: 85,
        ambientTempC: 25,
        batteryMv: 24200,
        fuelLevelPct: 80,
        fuelUsedTotalL: 200,
        defLevelPct: 90,
        ptoEngaged: false,
        harshEvent: null,
        dtcCodes: [],
        extraIotSensors: {},
        needsFlespiFailover: false,
      };

      const status = burstBuffer.evaluateConnectivityStatus(event);
      expect(status).toBe(TelematicsConnectivityStatus.IDLE);
    });
  });
});
