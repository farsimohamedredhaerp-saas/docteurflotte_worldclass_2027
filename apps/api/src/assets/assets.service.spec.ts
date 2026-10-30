import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { DatabaseService } from '../database/database.service';
import {
  AssetCategory,
  AssetStatus,
  MeterSource,
  MeterType,
} from '@docteurflotte/contracts';

describe('AssetsService (Unit)', () => {
  let service: AssetsService;
  let mockDatabaseService: any;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(),
    };

    mockDatabaseService = {
      withTenantContext: jest.fn(async (tenantId, cb) => cb(mockClient)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('createAsset crée un actif et calcule le seuil préventif initial', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ data_origin: 'USER_ENTRY' }] }) // SELECT data_origin
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'asset-1',
            tenant_id: 'tenant-1',
            name: 'Scania R450',
            code: 'PL-16-001-DZ',
            category: AssetCategory.HEAVY_TRUCK,
            status: AssetStatus.OPERATIONAL,
            primary_meter_type: MeterType.ODOMETER_KM,
            current_meter_value: 100000,
            maintenance_interval_value: 10000,
            next_maintenance_meter_value: 110000,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      }) // INSERT INTO assets
      .mockResolvedValueOnce({ rows: [] }); // INSERT INTO meter_readings

    const asset = await service.createAsset('tenant-1', {
      name: 'Scania R450',
      code: 'PL-16-001-DZ',
      category: AssetCategory.HEAVY_TRUCK,
      primaryMeterType: MeterType.ODOMETER_KM,
      initialMeterValue: 100000,
      maintenanceIntervalValue: 10000,
    });

    expect(asset.id).toBe('asset-1');
    expect(asset.currentMeterValue).toBe(100000);
    expect(asset.nextMaintenanceMeterValue).toBe(110000);
  });

  it('recordMeterReading rejette un recul anormal de compteur sous alerte', async () => {
    // Actif avec compteur actuel = 100000
    mockClient.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'asset-1',
            tenant_id: 'tenant-1',
            current_meter_value: 100000,
            primary_meter_type: MeterType.ODOMETER_KM,
            next_maintenance_meter_value: 110000,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ alert_thresholds: { odometerRollbackToleranceKm: 5 } }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'reading-1',
            tenant_id: 'tenant-1',
            asset_id: 'asset-1',
            meter_type: MeterType.ODOMETER_KM,
            value: 95000,
            source: MeterSource.MANUAL,
            recorded_at: new Date(),
            is_validated: false,
            validation_error: 'METER_ROLLBACK_DETECTED',
          },
        ],
      });

    // Relevé avec 95000 km (recul de 5000 km, supérieur à la tolérance de 5 km)
    const res = await service.recordMeterReading('tenant-1', 'asset-1', {
      meterType: MeterType.ODOMETER_KM,
      value: 95000,
    });

    expect(res.success).toBe(false);
    expect(res.rollbackDetected).toBe(true);
    expect(res.currentValue).toBe(100000); // Le compteur courant n'a pas été écrasé
  });

  it('recordMeterReading déclenche un ordre de travail préventif lors du franchissement du seuil', async () => {
    // Compteur à 109 000 km avec seuil d'entretien à 110 000 km
    mockClient.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'asset-1',
            tenant_id: 'tenant-1',
            current_meter_value: 109000,
            primary_meter_type: MeterType.ODOMETER_KM,
            next_maintenance_meter_value: 110000,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ alert_thresholds: { odometerRollbackToleranceKm: 0 } }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'reading-2',
            tenant_id: 'tenant-1',
            asset_id: 'asset-1',
            meter_type: MeterType.ODOMETER_KM,
            value: 110500,
            source: MeterSource.MANUAL,
            recorded_at: new Date(),
            is_validated: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE assets SET current_meter_value
      .mockResolvedValueOnce({ rows: [] }) // INSERT INTO work_orders
      .mockResolvedValueOnce({ rows: [] }); // UPDATE assets SET status = MAINTENANCE_REQUIRED

    // Nouveau relevé à 110 500 km (franchissement du seuil 110 000 km)
    const res = await service.recordMeterReading('tenant-1', 'asset-1', {
      meterType: MeterType.ODOMETER_KM,
      value: 110500,
    });

    expect(res.success).toBe(true);
    expect(res.rollbackDetected).toBe(false);
    expect(res.maintenanceTriggered).toBe(true);
    expect(res.currentValue).toBe(110500);
  });
});
