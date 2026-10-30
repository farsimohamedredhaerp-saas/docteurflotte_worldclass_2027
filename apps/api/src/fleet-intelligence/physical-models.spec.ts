import {
  calculateArrheniusOilDegradation,
  evaluateBatteryHealth,
  evaluateThermalResidual,
  calculateArchardBrakeWear,
  evaluateDpfAndInjectorHealth,
  detectFuelTheftCusum,
  calculateUnifiedVhi,
} from '@docteurflotte/contracts';
import { PhysicalPredictiveModelsService } from './services/physical-predictive-models.service';
import {
  CanonicalTelemetryEvent,
  EngineStateEnum,
  IngestionSource,
} from './dto/telemetry-ingestion.dto';

describe('EPIC 3 : Moteur de Maintenance Prédictive Physique & Anti-Fraude (6 Algorithmes)', () => {
  let service: PhysicalPredictiveModelsService;

  beforeAll(() => {
    service = new PhysicalPredictiveModelsService();
  });

  describe('Tâche 3.1 : Dégradation d Huile Moteur (Loi Cinétique d Arrhenius)', () => {
    it('doit calculer le facteur thermique unitaire à la température nominale de 90°C', () => {
      const res = calculateArrheniusOilDegradation({
        deltaTripKm: 1000,
        idleHours: 0,
        oilTempC: 90.0,
        engineLoadPct: 50.0,
        customAlphaDzOil: 1.0,
        nominalIntervalKm: 30000,
      });

      expect(res.thermalArrheniusFactor).toBe(1.0);
      expect(res.loadFactor).toBe(1.0);
      expect(res.effectiveWearKm).toBe(1000);
      expect(res.oilHealthScore).toBe(97); // 29 000 km restants / 30 000
    });

    it('doit accélérer exponentiellement la dégradation en cas de surchauffe thermique saharienne (> 110°C)', () => {
      const nominalRes = calculateArrheniusOilDegradation({
        deltaTripKm: 1000,
        idleHours: 0,
        oilTempC: 90.0,
        customAlphaDzOil: 1.0,
      });

      const hotRes = calculateArrheniusOilDegradation({
        deltaTripKm: 1000,
        idleHours: 0,
        oilTempC: 110.0, // Surchauffe sévère
        customAlphaDzOil: 1.0,
      });

      expect(hotRes.thermalArrheniusFactor).toBeGreaterThan(nominalRes.thermalArrheniusFactor);
      expect(hotRes.effectiveWearKm).toBeGreaterThan(nominalRes.effectiveWearKm * 1.5);
    });

    it('doit intégrer la sévérité du ralenti prolongé avec clim ou prise de force (40 km éq/h)', () => {
      const res = calculateArrheniusOilDegradation({
        deltaTripKm: 500,
        idleHours: 10, // 10h de ralenti PTO / clim saharienne
        ptoOrAcEngaged: true,
        oilTempC: 90.0,
        customAlphaDzOil: 1.0,
      });

      // 500 km + 10h * 40 km/h = 900 km éq
      expect(res.effectiveWearKm).toBe(900);
      expect(res.proof).toContain('40 km/h × 10h');
    });

    it('doit appliquer le coefficient de sévérité de la Wilaya d Ouargla (0.65)', () => {
      const res = calculateArrheniusOilDegradation({
        deltaTripKm: 1000,
        idleHours: 0,
        oilTempC: 90.0,
        engineLoadPct: 50.0,
        wilayaCodeOrName: 30, // Ouargla
      });

      expect(res.alphaDzOil).toBe(0.65);
      // 1000 / 0.65 = 1538 km éq
      expect(res.effectiveWearKm).toBe(1538);
    });
  });

  describe('Tâche 3.2 : Santé Batterie & Démarreur (Cranking Drop & SOH)', () => {
    it('doit valider une batterie 24V en parfait état au démarrage nominal', () => {
      const res = evaluateBatteryHealth({
        systemVoltage: 24,
        minCrankingVoltageV: 21.5,
        ambientTempC: 25,
        chargingVoltageV: 28.4,
      });

      expect(res.sohPercent).toBeGreaterThanOrEqual(85);
      expect(res.status).toBe('OPTIMAL');
      expect(res.alternatorStatus).toBe('HEALTHY');
      expect(res.predictedRulDays).toBe(365);
    });

    it('doit compenser la chute thermique lors d un démarrage hivernal à Sétif (-5°C)', () => {
      // 25 - (-5) = 30°C d écart -> compensation +30°C * 30 mV/°C = +0.9V en 24V
      const res = evaluateBatteryHealth({
        systemVoltage: 24,
        minCrankingVoltageV: 19.5,
        ambientTempC: -5,
        chargingVoltageV: 28.2,
      });

      expect(res.compensatedCrankVoltageV).toBe(20.4);
      expect(res.status).toBe('GOOD');
    });

    it('doit alerter en cas de chute critique de tension au lancement (V_crank < 17V en 24V)', () => {
      const res = evaluateBatteryHealth({
        systemVoltage: 24,
        minCrankingVoltageV: 16.2,
        ambientTempC: 25,
        chargingVoltageV: 27.5,
      });

      expect(res.status).toBe('CRITICAL_FAILURE_IMMINENT');
      expect(res.sohPercent).toBeLessThan(25);
      expect(res.predictedRulDays).toBeLessThanOrEqual(5);
    });

    it('doit diagnostiquer une sous-charge alternateur en roulage (< 27.2V en 24V)', () => {
      const res = evaluateBatteryHealth({
        systemVoltage: 24,
        minCrankingVoltageV: 20.0,
        ambientTempC: 25,
        chargingVoltageV: 25.8, // Alternateur défaillant ou courroie détendue
      });

      expect(res.alternatorStatus).toBe('UNDERCHARGING');
    });
  });

  describe('Tâche 3.3 : Modèle Thermique Résiduel (EWMA & Culasse)', () => {
    it('doit confirmer l équilibre thermique lorsque le liquide est à la température attendue', () => {
      const res = evaluateThermalResidual({
        measuredCoolantTempC: 88,
        engineLoadPct: 50,
        ambientTempC: 25,
        speedKmh: 80,
      });

      expect(res.diagnosis).toBe('NORMAL_THERMAL_EQUILIBRIUM');
      expect(res.thermalHealthScore).toBeGreaterThanOrEqual(95);
    });

    it('doit détecter un entartrage radiateur / défaillance visco-coupleur (résidu EWMA >= +7.5°C)', () => {
      const res = evaluateThermalResidual({
        measuredCoolantTempC: 95, // Résidu d'environ +9.2°C pour une charge modérée
        engineLoadPct: 40,
        ambientTempC: 25,
        speedKmh: 80,
      });

      expect(res.ewmaResidualC).toBeGreaterThanOrEqual(7.5);
      expect(res.ewmaResidualC).toBeLessThan(15.0);
      expect(res.diagnosis).toBe('RADIATOR_SCALING_OR_VISCO_COUPLING_FAILURE');
      expect(res.thermalHealthScore).toBeLessThan(75);
    });

    it('doit détecter un thermostat bloqué ouvert (résidu EWMA <= -12°C)', () => {
      const res = evaluateThermalResidual({
        measuredCoolantTempC: 68, // Moteur trop froid en roulage
        engineLoadPct: 50,
        ambientTempC: 25,
        speedKmh: 80,
      });

      expect(res.ewmaResidualC).toBeLessThanOrEqual(-12.0);
      expect(res.diagnosis).toBe('THERMOSTAT_STUCK_OPEN');
    });

    it('doit déclencher une alerte critique de risque joint de culasse (résidu EWMA >= +15°C)', () => {
      const res = evaluateThermalResidual({
        measuredCoolantTempC: 109,
        engineLoadPct: 40,
        ambientTempC: 25,
        speedKmh: 70,
      });

      expect(res.ewmaResidualC).toBeGreaterThanOrEqual(15.0);
      expect(res.diagnosis).toBe('CRITICAL_HEAD_GASKET_RISK');
    });
  });

  describe('Tâche 3.4 : Capteur Virtuel d Usure des Freins (Loi d Archard)', () => {
    it('doit calculer l usure Archard et intégrer l absorption du ralentisseur J1939', () => {
      // Camion 26 000 kg, freinage de 80 km/h à 0 km/h, avec ralentisseur 70%
      const resWithRetarder = calculateArchardBrakeWear({
        vehicleMassKg: 26000,
        initialSpeedKmh: 80,
        finalSpeedKmh: 0,
        retarderTorquePct: 70,
        currentPadThicknessMm: 20.0,
      });

      const resWithoutRetarder = calculateArchardBrakeWear({
        vehicleMassKg: 26000,
        initialSpeedKmh: 80,
        finalSpeedKmh: 0,
        retarderTorquePct: 0,
        currentPadThicknessMm: 20.0,
      });

      expect(resWithRetarder.retarderAbsorbedRatio).toBe(0.70);
      expect(resWithRetarder.totalMechanicalFrictionJoules).toBeLessThan(
        resWithoutRetarder.totalMechanicalFrictionJoules
      );
      expect(resWithRetarder.estimatedWearMm).toBeLessThan(resWithoutRetarder.estimatedWearMm);
      expect(resWithRetarder.brakeHealthScore).toBe(80);
    });

    it('doit intégrer l énergie potentielle dans les descentes de l Atlas tellien', () => {
      const resDownhill = calculateArchardBrakeWear({
        vehicleMassKg: 26000,
        initialSpeedKmh: 60,
        finalSpeedKmh: 60,
        downhillElevationDeltaM: 200, // Descente de 200m
        retarderTorquePct: 0,
      });

      expect(resDownhill.dissipatedPotentialJoules).toBeGreaterThan(0);
      expect(resDownhill.totalMechanicalFrictionJoules).toBeGreaterThan(40000000); // > 40 MJ
    });
  });

  describe('Tâche 3.5 : Colmatage FAP & Dérive Injecteurs', () => {
    it('doit détecter la dérive de débit injecteur (> +7%) liée au soufre ou à l eau dans le gasoil', () => {
      const res = evaluateDpfAndInjectorHealth({
        fuelRateLPerHour: 34.0, // Surconsommation nette par rapport au nominal
        engineRpm: 1400,
        engineLoadPct: 70,
        nominalSpecificConsumption: 28.5,
      });

      expect(res.injectorDriftPct).toBeGreaterThan(7.0);
      expect(res.status).toBe('INJECTOR_DRIFT_OR_DIRTY_FUEL');
      expect(res.dpfHealthScore).toBeLessThan(80);
    });

    it('doit alerter d un colmatage FAP sévère en cas de forte pression différentielle (> 35 kPa)', () => {
      const res = evaluateDpfAndInjectorHealth({
        fuelRateLPerHour: 22.0,
        engineRpm: 1400,
        engineLoadPct: 60,
        diffPressureKpa: 42.0,
      });

      expect(res.status).toBe('DPF_CLOGGED_RESTRICTED');
      expect(res.dpfHealthScore).toBe(20);
    });
  });

  describe('Tâche 3.6 : Détection de Fraude Carburant & CUSUM Page-Hinkley', () => {
    it('doit détecter un siphonnage à l arrêt (> 4% de perte contact coupé)', () => {
      const res = detectFuelTheftCusum({
        fuelTankCapacityLiters: 400,
        rawLevelsLiters: [300, 295, 275, 274, 273], // Perte nette de 27 L = 6.75%
        ignitionOn: false,
        vehicleSpeedKmh: 0,
      });

      expect(res.theftDetected).toBe(true);
      expect(res.theftType).toBe('STATIONARY_SIPHONING');
      expect(res.stolenVolumeLiters).toBe(27);
      expect(res.proof).toContain('Siphonnage à l\'arrêt');
    });

    it('doit détecter un piquage lent en mission (Slow Bleeding) via l algorithme séquentiel CUSUM', () => {
      // Baisse de jauge: 45 L, mais injecteurs CAN n ont consommé que 30 L (écart: 15 L > seuil 8L)
      const res = detectFuelTheftCusum({
        fuelTankCapacityLiters: 400,
        rawLevelsLiters: [300, 290, 275, 260, 255], // Delta jauge = 45L
        canConsumedLitersTotal: 30.0,
        ignitionOn: true,
        vehicleSpeedKmh: 75,
        previousCusumScore: 0.0,
      });

      expect(res.theftDetected).toBe(true);
      expect(res.theftType).toBe('SLOW_BLEEDING_IN_TRANSIT');
      expect(res.cusumCumulativeScore).toBeGreaterThanOrEqual(8.0);
      expect(res.proof).toContain('Piquage lent');
    });

    it('doit filtrer le ballottement (sloshing) sur piste sans fausse alerte', () => {
      // Oscillations brusques : 300L -> 280L -> 310L -> 295L -> 300L
      const res = detectFuelTheftCusum({
        fuelTankCapacityLiters: 400,
        rawLevelsLiters: [300, 280, 310, 295, 300],
        canConsumedLitersTotal: 2.0,
        ignitionOn: true,
        vehicleSpeedKmh: 45,
      });

      expect(res.theftDetected).toBe(false);
      expect(res.theftType).toBe('NONE');
      expect(res.filteredFuelLevelLiters).toBe(300); // Médiane mobile propre
    });
  });

  describe('Tâche 3.7 : Score Unifié VHI (Vehicle Health Index) & Rapport Complet', () => {
    it('doit calculer le score VHI composite selon la pondération officielle', () => {
      const vhi = calculateUnifiedVhi({
        oilHealthScore: 80,     // 25% = 20
        batteryHealthScore: 90, // 20% = 18
        thermalHealthScore: 85, // 20% = 17
        brakeHealthScore: 75,   // 15% = 11.25
        dpfHealthScore: 70,     // 10% = 7
        fuelSecurityScore: 90,  // 10% = 9
      });

      // 20 + 18 + 17 + 11.25 + 7 + 9 = 82.25 -> 82/100
      expect(vhi.vhiScore).toBe(82);
      expect(vhi.rating).toBe('GOOD');
      expect(vhi.proof).toContain('82/100 [GOOD]');
    });

    it('doit générer un rapport physique complet et traçable via PhysicalPredictiveModelsService', () => {
      const event: CanonicalTelemetryEvent = {
        time: new Date().toISOString(),
        tenantId: 'tenant-1234',
        vehicleId: 'vehicle-5678',
        deviceImei: '860123456789012',
        sourceProvider: IngestionSource.TRACCAR,
        latitude: 31.95,
        longitude: 5.53,
        altitudeM: 145,
        speedKmh: 82,
        headingDeg: 180,
        ignitionOn: true,
        engineState: EngineStateEnum.ON,
        odometerKm: 125400,
        engineHoursSec: 360000,
        engineRpm: 1450,
        engineLoadPct: 62,
        coolantTempC: 89,
        ambientTempC: 41,
        batteryMv: 28400,
        fuelLevelPct: 78,
        fuelUsedTotalL: 450,
        defLevelPct: 82,
        oilPressureKpa: 420,
        fuelRateLPerHour: 26.5,
        retarderTorquePct: 60,
        ptoEngaged: false,
        harshEvent: null,
        dtcCodes: [],
        extraIotSensors: {},
        needsFlespiFailover: false,
      };

      const report = service.evaluateFullVehiclePhysicalHealth(event, {
        wilayaCode: '30', // Ouargla
        vehicleMassKg: 26000,
        fuelTankCapacityLiters: 400,
      });

      expect(report.vehicleId).toBe('vehicle-5678');
      expect(report.vhiScore).toBeGreaterThanOrEqual(60);
      expect(report.oil.alphaDzOil).toBe(0.65);
      expect(['OPTIMAL', 'GOOD']).toContain(report.battery.status);
      expect(report.thermal.diagnosis).toBe('NORMAL_THERMAL_EQUILIBRIUM');
      expect(report.brakes.brakeHealthScore).toBeGreaterThan(0);
      expect(report.dpf.status).toBe('NORMAL');
      expect(report.fuelSecurity.theftDetected).toBe(false);
      expect(report.globalProof).toContain('/100');
    });
  });
});
