import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { DatabaseService } from '../database/database.service';
import { ActivityPack } from '@docteurflotte/contracts';

describe('TenantsService', () => {
  let service: TenantsService;
  let mockDatabaseService: any;

  beforeEach(async () => {
    mockDatabaseService = {
      withTenantContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('should complete initial setup inside tenant context', async () => {
    mockDatabaseService.withTenantContext.mockImplementation(
      async (tenantId: string, callback: (client: any) => Promise<any>) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({
              rowCount: 1,
              rows: [
                {
                  id: tenantId,
                  name: 'Flotte Express',
                  slug: 'flotte-express',
                  activity_pack: ActivityPack.CONSTRUCTION,
                  country_code: 'DZ',
                  currency: 'DZD',
                  data_origin: 'DEMO',
                  status: 'ACTIVE',
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
            })
            .mockResolvedValueOnce({
              rowCount: 1,
              rows: [
                {
                  id: 'settings-1',
                  tenant_id: tenantId,
                  activity_pack: ActivityPack.CONSTRUCTION,
                  measurement_system: 'METRIC',
                  currency: 'DZD',
                  alert_thresholds: { maintenanceWarningKm: 1000 },
                  is_setup_completed: true,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
            }),
        };
        return callback(mockClient);
      },
    );

    const result = await service.completeSetup('tenant-123', {
      activityPack: ActivityPack.CONSTRUCTION,
      measurementSystem: 'METRIC',
      currency: 'DZD',
      enableDemoData: true,
    });

    expect(result.success).toBe(true);
    expect(result.tenant.activityPack).toBe(ActivityPack.CONSTRUCTION);
    expect(result.settings.isSetupCompleted).toBe(true);
    expect(mockDatabaseService.withTenantContext).toHaveBeenCalledWith(
      'tenant-123',
      expect.any(Function),
    );
  });

  it('should update dynamic settings without any hardcoded constants', async () => {
    mockDatabaseService.withTenantContext.mockImplementation(
      async (tenantId: string, callback: (client: any) => Promise<any>) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({
              // SELECT existing settings
              rowCount: 1,
              rows: [
                {
                  id: 'settings-1',
                  tenant_id: tenantId,
                  activity_pack: ActivityPack.TRANSPORT,
                  measurement_system: 'METRIC',
                  currency: 'DZD',
                  branding: { timezone: 'Africa/Algiers', dateFormat: 'DD/MM/YYYY' },
                  alert_thresholds: { maintenanceWarningKm: 1000 },
                  economic_rates: { hourlyLaborRate: 1500 },
                  notification_preferences: { emailNotifications: true },
                  is_setup_completed: true,
                },
              ],
            })
            .mockResolvedValueOnce({
              // UPDATE settings
              rowCount: 1,
              rows: [
                {
                  id: 'settings-1',
                  tenant_id: tenantId,
                  activity_pack: ActivityPack.TRANSPORT,
                  measurement_system: 'METRIC',
                  currency: 'EUR',
                  branding: { timezone: 'Europe/Paris', dateFormat: 'YYYY-MM-DD' },
                  alert_thresholds: { maintenanceWarningKm: 2500, dailyKmExcessThreshold: 1000 },
                  economic_rates: { hourlyLaborRate: 2000, referenceFuelPricePerLiter: 32.5 },
                  notification_preferences: { emailNotifications: false, inAppAlerts: true },
                  is_setup_completed: true,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
            })
            .mockResolvedValueOnce({}), // UPDATE tenants currency
        };
        return callback(mockClient);
      },
    );

    const updated = await service.updateSettings('tenant-123', {
      currency: 'EUR',
      branding: { timezone: 'Europe/Paris', dateFormat: 'YYYY-MM-DD' },
      alertThresholds: { maintenanceWarningKm: 2500, dailyKmExcessThreshold: 1000 },
      economicRates: { hourlyLaborRate: 2000, referenceFuelPricePerLiter: 32.5 },
      notificationPreferences: { emailNotifications: false },
    });

    expect(updated).toBeDefined();
    expect(updated.currency).toBe('EUR');
    expect(updated.alertThresholds.maintenanceWarningKm).toBe(2500);
    expect(updated.economicRates.hourlyLaborRate).toBe(2000);
    expect(updated.economicRates.referenceFuelPricePerLiter).toBe(32.5);
  });

  it('should purge demo data and switch to USER_ENTRY', async () => {
    mockDatabaseService.withTenantContext.mockImplementation(
      async (tenantId: string, callback: (client: any) => Promise<any>) => {
        const mockClient = {
          query: jest.fn().mockResolvedValueOnce({ rowCount: 1 }),
        };
        return callback(mockClient);
      },
    );

    const res = await service.purgeDemoData('tenant-123');
    expect(res.success).toBe(true);
    expect(res.dataOrigin).toBe('USER_ENTRY');
  });
});
