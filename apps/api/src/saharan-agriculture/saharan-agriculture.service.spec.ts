import { Test, TestingModule } from '@nestjs/testing';
import { FarmPropertiesService } from './services/farm-properties.service';
import { IrrigationPivotsService } from './services/irrigation-pivots.service';
import { HarvestCampaignsService } from './services/harvest-campaigns.service';
import { DatabaseService } from '../database/database.service';
import {
  CropType,
  PivotStatus,
  AgriculturalTaskType,
  CreateFarmPropertyDto,
  CreateIrrigationPivotDto,
  RecordIrrigationTelemetryDto,
  RecordHarvestCampaignDto,
} from '@docteurflotte/contracts';

describe('SaharanAgricultureModule Services', () => {
  let farmService: FarmPropertiesService;
  let pivotService: IrrigationPivotsService;
  let harvestService: HarvestCampaignsService;
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
        FarmPropertiesService,
        IrrigationPivotsService,
        HarvestCampaignsService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    farmService = module.get<FarmPropertiesService>(FarmPropertiesService);
    pivotService = module.get<IrrigationPivotsService>(IrrigationPivotsService);
    harvestService = module.get<HarvestCampaignsService>(HarvestCampaignsService);
  });

  describe('FarmPropertiesService', () => {
    it('doit créer un domaine agricole saharien dans la Wilaya d’Adrar', async () => {
      mockDb.withTenantContext = jest.fn(async (tId, fn) => {
        const client = {
          query: jest.fn().mockResolvedValue({
            rows: [
              {
                id: 'farm-adrar-01',
                tenant_id: tId,
                code: 'DOM-ADR-01',
                name: 'Domaine Céréalier Oasis Verte Adrar',
                wilaya_code: 1,
                commune: 'Zaouiet Kounta',
                total_surface_hectares: 1200.0,
                ccls_code: 'CCLS-ADRAR-01',
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          }),
        };
        return fn(client);
      });

      const dto: CreateFarmPropertyDto = {
        code: 'DOM-ADR-01',
        name: 'Domaine Céréalier Oasis Verte Adrar',
        wilayaCode: 1,
        commune: 'Zaouiet Kounta',
        totalSurfaceHectares: 1200.0,
        cclsCode: 'CCLS-ADRAR-01',
      };

      const farm = await farmService.createFarm('tenant-1', dto);

      expect(farm.id).toBe('farm-adrar-01');
      expect(farm.code).toBe('DOM-ADR-01');
      expect(farm.wilayaCode).toBe(1);
      expect(farm.totalSurfaceHectares).toBe(1200);
    });

    it('doit rejeter la création si les champs obligatoires manquent', async () => {
      await expect(
        farmService.createFarm('tenant-1', {
          code: '',
          name: '',
          wilayaCode: 0,
          totalSurfaceHectares: 0,
        }),
      ).rejects.toThrow();
    });
  });

  describe('IrrigationPivotsService', () => {
    it('doit créer un pivot d’irrigation circulaire albien', async () => {
      mockDb.withTenantContext = jest.fn(async (tId, fn) => {
        const client = {
          query: jest.fn().mockResolvedValue({
            rows: [
              {
                id: 'pivot-uuid',
                tenant_id: tId,
                farm_id: 'farm-adrar-01',
                pivot_code: 'PIVOT-01',
                name: 'Pivot N°1 Blé Dur (80 Ha)',
                crop_type: 'BLE_DUR',
                surface_hectares: 80.0,
                borehole_depth_meters: 450.0,
                generator_asset_id: 'gen-cummins-250kva',
                pump_power_kw: 110.0,
                nominal_flow_m3_h: 180.0,
                nominal_fuel_burn_rate_l_h: 32.0,
                status: 'RUNNING',
                total_running_hours: 0.0,
                total_water_volume_m3: 0.0,
                total_fuel_consumed_liters: 0.0,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          }),
        };
        return fn(client);
      });

      const dto: CreateIrrigationPivotDto = {
        farmId: 'farm-adrar-01',
        pivotCode: 'PIVOT-01',
        name: 'Pivot N°1 Blé Dur (80 Ha)',
        cropType: CropType.BLE_DUR,
        surfaceHectares: 80,
        boreholeDepthMeters: 450,
        nominalFlowM3H: 180,
        nominalFuelBurnRateLH: 32,
      };

      const pivot = await pivotService.createPivot('tenant-1', dto);

      expect(pivot.id).toBe('pivot-uuid');
      expect(pivot.pivotCode).toBe('PIVOT-01');
      expect(pivot.nominalFuelBurnRateLH).toBe(32);
      expect(pivot.cropType).toBe(CropType.BLE_DUR);
    });

    it('doit enregistrer un relevé de fonctionnement et détecter une surconsommation anormale de gasoil', async () => {
      mockDb.withTenantContext = jest.fn(async (tId, fn) => {
        const client = {
          query: jest
            .fn()
            .mockImplementationOnce(() =>
              Promise.resolve({
                rows: [
                  {
                    id: 'pivot-uuid',
                    nominal_fuel_burn_rate_l_h: 30.0,
                    nominal_flow_m3_h: 180.0,
                  },
                ],
              }),
            )
            .mockImplementationOnce((sql, params) =>
              Promise.resolve({
                rows: [
                  {
                    id: 'log-uuid',
                    tenant_id: tId,
                    pivot_id: params[1],
                    recorded_at: new Date(),
                    hours_running_delta: params[2],
                    fuel_consumed_liters: params[3],
                    hourly_burn_rate_l_h: params[4],
                    water_flow_m3_h: params[5],
                    water_pressure_bar: params[6],
                    efficiency_ratio_l_per_m3: params[7],
                    ambient_temp_c: params[8],
                    is_burn_rate_abnormal: params[9],
                    created_at: new Date(),
                  },
                ],
              }),
            )
            .mockImplementationOnce(() => Promise.resolve({ rows: [] })),
        };
        return fn(client);
      });

      // 10 heures avec 480L consommés => 48 L/h (bien supérieur au nominal 30 L/h * 1.35 = 40.5 L/h)
      const dto: RecordIrrigationTelemetryDto = {
        pivotId: 'pivot-uuid',
        hoursRunningDelta: 10,
        fuelConsumedLiters: 480,
        waterFlowM3H: 180,
        waterPressureBar: 3.8,
        ambientTempC: 44.0,
      };

      const log = await pivotService.recordTelemetry('tenant-1', dto);

      expect(log.hourlyBurnRateLH).toBe(48);
      expect(log.isBurnRateAbnormal).toBe(true);
      expect(log.efficiencyRatioLPerM3).toBeCloseTo(480 / (180 * 10), 4);
    });
  });

  describe('HarvestCampaignsService', () => {
    it('doit enregistrer une campagne de moisson-battage avec rémunération à la tâche et scellé SHA-256', async () => {
      mockDb.withTenantContext = jest.fn(async (tId, fn) => {
        const client = {
          query: jest.fn().mockImplementation((sql, params) =>
            Promise.resolve({
              rows: [
                {
                  id: 'harvest-uuid',
                  tenant_id: tId,
                  farm_id: params[1],
                  asset_id: params[2],
                  driver_id: params[3],
                  campaign_year: params[4],
                  crop_type: params[5],
                  task_type: params[6],
                  start_date: new Date(params[7]),
                  end_date: params[8] ? new Date(params[8]) : null,
                  area_worked_hectares: params[9],
                  yield_quintals: params[10],
                  ccls_delivery_note_ref: params[11],
                  driver_rate_per_hectare_dzd: params[12],
                  driver_rate_per_quintal_dzd: params[13],
                  driver_payout_dzd: params[14],
                  fuel_consumed_liters: params[15],
                  fuel_cost_dzd: params[16],
                  total_cost_per_quintal_dzd: params[17],
                  sha256_proof: params[18],
                  created_at: new Date(),
                },
              ],
            }),
          ),
        };
        return fn(client);
      });

      const dto: RecordHarvestCampaignDto = {
        farmId: 'farm-adrar-01',
        assetId: 'asset-claas-tucano-01',
        driverId: 'drv-moissonneur-ahmed',
        campaignYear: 2026,
        cropType: CropType.BLE_DUR,
        taskType: AgriculturalTaskType.MOISSON_BATTAGE,
        startDate: '2026-05-15',
        areaWorkedHectares: 120, // 120 Ha
        yieldQuintals: 7200,      // 7200 Qx (60 Qx/Ha)
        cclsDeliveryNoteRef: 'BL-CCLS-ADRAR-2026-8812',
        driverRatePerHectareDzd: 1500, // 1500 DA/Ha
        driverRatePerQuintalDzd: 50,   // 50 DA/Qx
        fuelConsumedLiters: 2400,      // 2400 L gasoil
      };

      const harvest = await harvestService.recordHarvest('tenant-1', dto);

      // Rémunération chauffeur : 120 * 1500 + 7200 * 50 = 180 000 + 360 000 = 540 000 DA
      expect(harvest.driverPayoutDzd).toBe(540000);
      // Coût gasoil agricole : 2400 * 29 = 69 600 DA
      expect(harvest.fuelCostDzd).toBe(69600);
      // Coût par quintal : (540 000 + 69 600) / 7200 = 84.67 DA/Qx
      expect(harvest.totalCostPerQuintalDzd).toBeCloseTo(84.67, 1);
      expect(harvest.sha256Proof).toBeDefined();
      expect(harvest.sha256Proof).toHaveLength(64);
    });
  });
});

