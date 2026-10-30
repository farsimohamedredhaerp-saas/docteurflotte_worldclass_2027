import { Test, TestingModule } from '@nestjs/testing';
import { TelematicsService } from './telematics.service';
import { TraccarAdapterService } from './traccar-adapter.service';
import { DatabaseService } from '../database/database.service';
import {
  AssetStatus,
  DeviceStatus,
  MeterType,
} from '@docteurflotte/contracts';

describe('TelematicsService (Unit)', () => {
  let service: TelematicsService;
  let mockDatabaseService: any;
  let mockTraccarAdapter: any;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(),
    };

    mockDatabaseService = {
      withTenantContext: jest.fn(async (tenantId, cb) => cb(mockClient)),
    };

    mockTraccarAdapter = {
      checkHealth: jest.fn().mockResolvedValue({
        connected: true,
        serverUrl: 'http://localhost:5055',
        deviceCount: 0,
        activeBindingsCount: 0,
        lastSyncAt: new Date().toISOString(),
        queueSize: 0,
        errorRate: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelematicsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: TraccarAdapterService,
          useValue: mockTraccarAdapter,
        },
      ],
    }).compile();

    service = module.get<TelematicsService>(TelematicsService);
  });

  it('registerDevice enregistre un terminal GPS avec son uniqueId/IMEI', async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'dev-1',
          tenant_id: 'tenant-1',
          unique_id: '864200051234567',
          name: 'Tracker GPS Scania 01',
          model: 'Teltonika FMB920',
          status: DeviceStatus.ONLINE,
          created_at: new Date(),
        },
      ],
    });

    const res = await service.registerDevice('tenant-1', {
      uniqueId: '864200051234567',
      name: 'Tracker GPS Scania 01',
      model: 'Teltonika FMB920',
    });

    expect(res.id).toBe('dev-1');
    expect(res.uniqueId).toBe('864200051234567');
    expect(res.name).toBe('Tracker GPS Scania 01');
  });

  it('bindDeviceToAsset appaire un boîtier à un actif et désactive les liaisons antérieures', async () => {
    // 1. SELECT asset
    mockClient.query.mockResolvedValueOnce({
      rows: [{ id: 'asset-1', name: 'Scania R450', code: 'PL-16-001-DZ' }],
    });
    // 2. SELECT device
    mockClient.query.mockResolvedValueOnce({
      rows: [{ id: 'dev-1', name: 'Tracker GPS', unique_id: '864200051234567' }],
    });
    // 3. UPDATE anciens bindings
    mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
    // 4. INSERT nouveau binding
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'bind-1',
          tenant_id: 'tenant-1',
          asset_id: 'asset-1',
          device_id: 'dev-1',
          bound_at: new Date(),
          is_active: true,
          created_at: new Date(),
        },
      ],
    });

    const res = await service.bindDeviceToAsset('tenant-1', 'asset-1', 'dev-1');

    expect(res.id).toBe('bind-1');
    expect(res.assetName).toBe('Scania R450');
    expect(res.deviceName).toBe('Tracker GPS');
    expect(res.isActive).toBe(true);
  });

  it('ingestPosition dédoublonne strictement si traccar_position_id existe déjà (Idempotence)', async () => {
    // 1. SELECT position existante
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'pos-1',
          tenant_id: 'tenant-1',
          traccar_position_id: 'TRAC-999',
          device_id: 'dev-1',
          latitude: 36.75,
          longitude: 3.05,
          speed: 80,
          ignition: true,
          odometer_km: 152000,
          recorded_at: new Date(),
          created_at: new Date(),
        },
      ],
    });

    const res = await service.ingestPosition('tenant-1', {
      traccarPositionId: 'TRAC-999',
      uniqueId: '864200051234567',
      latitude: 36.75,
      longitude: 3.05,
      speed: 80,
      ignition: true,
      odometerKm: 152000,
      recordedAt: new Date().toISOString(),
    });

    expect(res.duplicate).toBe(true);
    expect(res.position.traccarPositionId).toBe('TRAC-999');
    // Aucune écriture supplémentaire
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });

  it('ingestPosition met à jour le compteur kilométrique et déclenche un OT préventif automatique au seuil', async () => {
    // 1. SELECT dupCheck -> aucun doublon
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 2. SELECT device existant
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'dev-1', name: 'GPS Tracker' }] });
    // 3. UPDATE device last_update
    mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
    // 4. SELECT binding actif -> relié à asset-1
    mockClient.query.mockResolvedValueOnce({ rows: [{ asset_id: 'asset-1' }] });
    // 5. INSERT telematics_positions
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'pos-new',
          tenant_id: 'tenant-1',
          traccar_position_id: 'TRAC-1000',
          device_id: 'dev-1',
          asset_id: 'asset-1',
          latitude: 36.752,
          longitude: 3.055,
          speed: 65,
          ignition: true,
          odometer_km: 160500,
          recorded_at: new Date(),
          created_at: new Date(),
        },
      ],
    });
    // 6. SELECT asset pour vérification compteur (seuil 160 000 km)
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'asset-1',
          name: 'Scania R450',
          code: 'PL-16-001-DZ',
          primary_meter_type: MeterType.ODOMETER_KM,
          current_meter_value: 159800,
          next_maintenance_meter_value: 160000,
          maintenance_interval_value: 10000,
        },
      ],
    });
    // 7. UPDATE asset status -> MAINTENANCE_REQUIRED
    mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
    // 8. INSERT work_orders préventif auto
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'wo-auto-1' }] });
    // 9. INSERT meter_readings
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'meter-read-1' }] });

    const res = await service.ingestPosition('tenant-1', {
      traccarPositionId: 'TRAC-1000',
      uniqueId: '864200051234567',
      latitude: 36.752,
      longitude: 3.055,
      speed: 65,
      ignition: true,
      odometerKm: 160500, // Dépasse le seuil de 160 000 km
      recordedAt: new Date().toISOString(),
    });

    expect(res.duplicate).toBe(false);
    expect(res.assetUpdated?.maintenanceTriggered).toBe(true);
    expect(res.assetUpdated?.newMeterValue).toBe(160500);
  });
});
