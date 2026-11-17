import { Test, TestingModule } from '@nestjs/testing';
import { ColdChainService } from './services/cold-chain.service';
import { DatabaseService } from '../database/database.service';
import {
  ReeferCargoType,
  ReeferPowerMode,
  ReeferTelemetryPayload,
  CreateReeferUnitDto,
  GenerateHaccpCertificateDto,
} from '@docteurflotte/contracts';

describe('ColdChainService', () => {
  let service: ColdChainService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      withTenantContext: jest.fn(async (tenantId: string, fn: any) => {
        const client = {
          query: jest.fn(),
        };
        return fn(client);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColdChainService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ColdChainService>(ColdChainService);
  });

  describe('evaluateReeferTelemetry', () => {
    it('doit déclarer un statut conforme lorsque la température est dans la plage HACCP (Lait Soummam)', () => {
      const payload: ReeferTelemetryPayload = {
        assetId: 'asset-reefer-01',
        cargoType: ReeferCargoType.DAIRY,
        setpointTempC: 3.0,
        supplyTempC: 2.0,
        returnTempC: 3.2,
        ambientTempC: 32.0,
        powerMode: ReeferPowerMode.DIESEL,
        doorOpen: false,
        auxiliaryFuelLevelLiters: 160,
      };

      const result = service.evaluateReeferTelemetry(payload);

      expect(result.isWithinSafeRange).toBe(true);
      expect(result.tempDeltaC).toBe(0.2);
      expect(result.financialRiskDzd).toBe(0);
      expect(result.excursionDurationMinutes).toBe(0);
      expect(result.auxiliaryFuelLevelPct).toBe(80); // 160 / 200 * 100
    });

    it('doit détecter une excursion thermique critique et chiffrer le risque financier en DZD (Viande Fraîche)', () => {
      const payload: ReeferTelemetryPayload = {
        assetId: 'asset-reefer-02',
        cargoType: ReeferCargoType.FRESH_MEAT,
        setpointTempC: 1.5,
        supplyTempC: 5.0,
        returnTempC: 6.8, // Hors de [0, 2.5]
        ambientTempC: 38.0,
        powerMode: ReeferPowerMode.DIESEL,
        doorOpen: true,
        auxiliaryFuelLevelLiters: 45,
      };

      const result = service.evaluateReeferTelemetry(payload);

      expect(result.isWithinSafeRange).toBe(false);
      expect(result.tempDeltaC).toBe(5.3);
      expect(result.financialRiskDzd).toBeGreaterThan(120000);
      expect(result.doorOpen).toBe(true);
      expect(result.auxiliaryFuelLevelPct).toBe(23); // 45 / 200 * 100
    });
  });

  describe('createReeferUnit', () => {
    it('doit rejeter si les paramètres obligatoires sont absents', async () => {
      await expect(
        service.createReeferUnit('tenant-1', {
          assetId: '',
          unitCode: '',
          makeModel: '',
        }),
      ).rejects.toThrow();
    });

    it('doit insérer avec succès une unité frigo bi-moteur dans reefer_units', async () => {
      mockDb.withTenantContext = jest.fn(async (tId, fn) => {
        const client = {
          query: jest.fn().mockResolvedValue({
            rows: [
              {
                id: 'reefer-unit-uuid',
                tenant_id: tId,
                asset_id: 'asset-shacman-chereau',
                unit_code: 'REEF-CHER-01',
                make_model: 'Thermo King SLXi 300',
                serial_number: 'TK-2026-9912',
                atp_certificate_number: 'ATP-DZ-2026-16-01',
                atp_expiry_date: new Date('2028-06-30'),
                auxiliary_tank_capacity_liters: 200.0,
                auxiliary_fuel_level_liters: 195.0,
                engine_hours_total: 120.5,
                electric_hours_total: 10.0,
                default_cargo_type: ReeferCargoType.DAIRY,
                target_setpoint_temp_c: 3.0,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          }),
        };
        return fn(client);
      });

      const dto: CreateReeferUnitDto = {
        assetId: 'asset-shacman-chereau',
        unitCode: 'REEF-CHER-01',
        makeModel: 'Thermo King SLXi 300',
        serialNumber: 'TK-2026-9912',
        atpCertificateNumber: 'ATP-DZ-2026-16-01',
        auxiliaryTankCapacityLiters: 200,
        auxiliaryFuelLevelLiters: 195,
      };

      const unit = await service.createReeferUnit('tenant-1', dto);

      expect(unit.id).toBe('reefer-unit-uuid');
      expect(unit.unitCode).toBe('REEF-CHER-01');
      expect(unit.auxiliaryTankCapacityLiters).toBe(200);
      expect(unit.auxiliaryFuelLevelLiters).toBe(195);
    });
  });

  describe('generateHaccpCertificate', () => {
    it('doit générer un certificat de traçabilité HACCP scellé par empreinte SHA-256 avec chiffrage carburant groupe', async () => {
      mockDb.withTenantContext = jest.fn(async (tId, fn) => {
        const client = {
          query: jest
            .fn()
            .mockImplementationOnce(() =>
              Promise.resolve({
                rows: [
                  {
                    return_temp_c: 3.1,
                    is_within_safe_range: true,
                    excursion_duration_minutes: 0,
                  },
                  {
                    return_temp_c: 3.4,
                    is_within_safe_range: true,
                    excursion_duration_minutes: 0,
                  },
                  {
                    return_temp_c: 2.9,
                    is_within_safe_range: true,
                    excursion_duration_minutes: 0,
                  },
                ],
              }),
            )
            .mockImplementationOnce((query, params) =>
              Promise.resolve({
                rows: [
                  {
                    id: 'cert-uuid',
                    tenant_id: tId,
                    certificate_ref: params[1],
                    reefer_unit_id: params[2],
                    asset_id: params[3],
                    mission_ref: params[4],
                    cargo_type: params[5],
                    cargo_description: params[6],
                    departure_wilaya: params[7],
                    arrival_wilaya: params[8],
                    departure_time: new Date(params[9]),
                    arrival_time: new Date(params[10]),
                    min_temp_recorded_c: params[11],
                    max_temp_recorded_c: params[12],
                    average_temp_c: params[13],
                    total_excursion_minutes: params[14],
                    compliance_status: params[15],
                    sanitary_verdict: params[16],
                    auxiliary_fuel_consumed_liters: params[17],
                    auxiliary_fuel_cost_dzd: params[18],
                    sha256_hash: params[19],
                    created_at: new Date(),
                  },
                ],
              }),
            ),
        };
        return fn(client);
      });

      const dto: GenerateHaccpCertificateDto = {
        reeferUnitId: 'reefer-unit-uuid',
        assetId: 'asset-chereau-01',
        missionRef: 'LIVRAISON-SOUMMAM-AKBOU-ORAN',
        cargoType: ReeferCargoType.DAIRY,
        departureWilaya: 6, // Béjaïa (Akbou)
        arrivalWilaya: 31,  // Oran
        departureTime: '2026-11-17T04:00:00Z',
        arrivalTime: '2026-11-17T12:00:00Z',
        auxiliaryFuelConsumedLiters: 17.6, // 8h * 2.2 L/h
      };

      const cert = await service.generateHaccpCertificate('tenant-1', dto);

      expect(cert.id).toBe('cert-uuid');
      expect(cert.complianceStatus).toBe('CONFORME_HACCP');
      expect(cert.minTempRecordedC).toBe(2.9);
      expect(cert.maxTempRecordedC).toBe(3.4);
      expect(cert.averageTempC).toBe(3.1);
      expect(cert.totalExcursionMinutes).toBe(0);
      expect(cert.auxiliaryFuelConsumedLiters).toBe(17.6);
      expect(cert.auxiliaryFuelCostDzd).toBe(510.4); // 17.6 L * 29 DA/L
      expect(cert.sha256Hash).toBeDefined();
      expect(cert.sha256Hash).toHaveLength(64);
    });
  });
});

