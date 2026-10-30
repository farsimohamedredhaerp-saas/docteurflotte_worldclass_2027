import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrdersService } from './work-orders.service';
import { DatabaseService } from '../database/database.service';
import {
  WorkOrderPriority,
  WorkOrderStatus,
} from '@docteurflotte/contracts';

describe('WorkOrdersService (Unit)', () => {
  let service: WorkOrdersService;
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
        WorkOrdersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
  });

  it('createWorkOrder crée un ordre de travail rattaché à un actif', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'asset-1', name: 'Scania R450', code: 'PL-16-001', current_meter_value: 100000 }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'wo-1',
            tenant_id: 'tenant-1',
            asset_id: 'asset-1',
            title: 'Vidange & filtres',
            priority: WorkOrderPriority.HIGH,
            status: WorkOrderStatus.SCHEDULED,
            estimated_labor_hours: 4,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

    const wo = await service.createWorkOrder('tenant-1', {
      assetId: 'asset-1',
      title: 'Vidange & filtres',
      priority: WorkOrderPriority.HIGH,
      estimatedLaborHours: 4,
    });

    expect(wo.id).toBe('wo-1');
    expect(wo.title).toBe('Vidange & filtres');
    expect(wo.status).toBe(WorkOrderStatus.SCHEDULED);
  });

  it('completeWorkOrder calcule les coûts réels selon le barème dynamique et réarme le plan', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'wo-1',
            tenant_id: 'tenant-1',
            asset_id: 'asset-1',
            name: 'Scania R450',
            code: 'PL-16-001',
            title: 'Vidange & filtres',
            status: WorkOrderStatus.SCHEDULED,
            maintenance_interval_value: 10000,
            current_meter_value: 110500,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ economic_rates: { hourlyLaborRate: 2000 } }], // Taux horaire dynamique du tenant = 2000 DZD
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'wo-1',
            tenant_id: 'tenant-1',
            asset_id: 'asset-1',
            title: 'Vidange & filtres',
            status: WorkOrderStatus.COMPLETED,
            actual_labor_hours: 5,
            hourly_rate_applied: 2000,
            labor_cost: 10000, // 5h * 2000
            parts_cost: 25000,
            total_cost: 35000, // 10000 + 25000
            downtime_hours: 6.5,
            completed_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE assets SET status = OPERATIONAL
      .mockResolvedValueOnce({ rows: [] }); // UPDATE decision_recommendations SET status = EXECUTED

    const wo = await service.completeWorkOrder('tenant-1', 'wo-1', {
      actualLaborHours: 5,
      partsCost: 25000,
      downtimeHours: 6.5,
      completionNotes: 'Vidange effectuée avec huile homologuée 10W40.',
    });

    expect(wo.status).toBe(WorkOrderStatus.COMPLETED);
    expect(wo.laborCost).toBe(10000);
    expect(wo.totalCost).toBe(35000);
    expect(wo.downtimeHours).toBe(6.5);
    expect(wo.mathematicalResetCertified).toBe(true);
    expect(wo.resetAlgorithmKey).toBe('OIL_ARRHENIUS');
    expect(wo.recalculatedVhi).toBe(95);
  });

  it('completeWorkOrder exécute la réinitialisation mathématique explicite du RUL et de la recommandation SAD', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'wo-2',
            tenant_id: 'tenant-1',
            asset_id: 'asset-actros',
            name: 'Mercedes Actros 3340',
            code: 'PL-16-01892',
            title: 'Remplacement radiateur et liquide refroidissement',
            status: WorkOrderStatus.SCHEDULED,
            maintenance_interval_value: 20000,
            current_meter_value: 342900,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ economic_rates: { hourlyLaborRate: 2500 } }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'wo-2',
            tenant_id: 'tenant-1',
            asset_id: 'asset-actros',
            title: 'Remplacement radiateur et liquide refroidissement',
            status: WorkOrderStatus.COMPLETED,
            actual_labor_hours: 4,
            hourly_rate_applied: 2500,
            labor_cost: 10000,
            partsCost: 45000,
            totalCost: 55000,
            downtime_hours: 4.0,
            completed_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE assets
      .mockResolvedValueOnce({ rows: [] }); // UPDATE decision_recommendations

    const wo = await service.completeWorkOrder('tenant-1', 'wo-2', {
      actualLaborHours: 4,
      partsCost: 45000,
      downtimeHours: 4.0,
      completionNotes: 'Radiateur BEHR neuf installé, résidu thermique recalibré à 0°C.',
      resetAlgorithmKey: 'COOLING_THERMAL',
      oemPartReference: 'A9405000703',
      recalculatedVhi: 98,
    });

    expect(wo.status).toBe(WorkOrderStatus.COMPLETED);
    expect(wo.mathematicalResetCertified).toBe(true);
    expect(wo.resetAlgorithmKey).toBe('COOLING_THERMAL');
    expect(wo.oemPartReference).toBe('A9405000703');
    expect(wo.recalculatedVhi).toBe(98);
  });
});
