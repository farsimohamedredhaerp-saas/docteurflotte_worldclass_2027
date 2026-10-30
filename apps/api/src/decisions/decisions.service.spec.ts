import { Test, TestingModule } from '@nestjs/testing';
import { DecisionsService } from './decisions.service';
import { DatabaseService } from '../database/database.service';
import {
  AssetCategory,
  DecisionStatus,
  DecisionUrgency,
  MeterType,
} from '@docteurflotte/contracts';

describe('DecisionsService (Unit)', () => {
  let service: DecisionsService;
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
        DecisionsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<DecisionsService>(DecisionsService);
  });

  it('evaluateTenantDecisions détecte le dépassement et persiste une proposition d arbitrage avec coût d inaction', async () => {
    // 1. SELECT tenant_settings
    mockClient.query.mockResolvedValueOnce({
      rows: [{ economic_rates: { hourlyLaborRate: 2000, inactionRiskMultiplier: 4 } }],
    });
    // 2. SELECT assets -> Actif ayant dépassé de 1 200 km
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'asset-1',
          tenant_id: 'tenant-1',
          name: 'Scania R450',
          code: 'PL-16-001-DZ',
          category: AssetCategory.HEAVY_TRUCK,
          current_meter_value: 151200,
          next_maintenance_meter_value: 150000,
          maintenance_interval_value: 10000,
          primary_meter_type: MeterType.ODOMETER_KM,
        },
      ],
    });
    // 3. SELECT existing recommendation -> aucune
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 4. INSERT INTO decision_recommendations
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    // 5. listDecisions (SELECT d.*)
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'dec-1',
          tenant_id: 'tenant-1',
          asset_id: 'asset-1',
          rule_id: 'RULE-DEC-001',
          rule_version: '1.2',
          urgency: DecisionUrgency.CRITICAL,
          title: 'Échéance critique dépassée',
          description: 'Seuil franchi',
          estimated_action_cost: 53000,
          cost_inaction_risk: 332000,
          net_expected_savings: 279000,
          confidence_score: 98,
          explanation_dossier: {},
          status: DecisionStatus.PENDING,
          created_at: new Date(),
          asset_name: 'Scania R450',
          asset_code: 'PL-16-001-DZ',
          asset_category: AssetCategory.HEAVY_TRUCK,
        },
      ],
    });

    const res = await service.evaluateTenantDecisions('tenant-1');

    expect(res.length).toBe(1);
    expect(res[0].ruleId).toBe('RULE-DEC-001');
    expect(res[0].estimatedActionCost).toBe(53000);
    expect(res[0].costInactionRisk).toBeGreaterThan(res[0].estimatedActionCost);
    expect(res[0].netExpectedSavings).toBe(279000);
  });

  it('approveDecision valide l arbitrage et génère automatiquement un ordre de travail budgété', async () => {
    // 1. SELECT decision
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'dec-1',
          tenant_id: 'tenant-1',
          asset_id: 'asset-1',
          status: DecisionStatus.PENDING,
          estimated_action_cost: 50000,
          net_expected_savings: 250000,
          urgency: 'danger',
          title: 'Révision critique Scania',
          rule_id: 'RULE-DEC-001',
          asset_name: 'Scania R450',
          asset_code: 'PL-16-001-DZ',
          asset_category: 'HEAVY_TRUCK',
          current_meter_value: 151200,
        },
      ],
    });
    // 2. INSERT INTO work_orders
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'wo-generated-1' }] });
    // 3. UPDATE decision_recommendations
    mockClient.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'dec-1',
          tenant_id: 'tenant-1',
          asset_id: 'asset-1',
          status: DecisionStatus.APPROVED,
          resolved_work_order_id: 'wo-generated-1',
          estimated_action_cost: 50000,
          cost_inaction_risk: 300000,
          net_expected_savings: 250000,
          confidence_score: 98,
          created_at: new Date(),
        },
      ],
    });

    const res = await service.approveDecision('tenant-1', 'dec-1', {
      assignedTo: 'Atelier Alger',
    });

    expect(res.workOrderId).toBe('wo-generated-1');
    expect(res.decision.status).toBe(DecisionStatus.APPROVED);
  });

  it('getBudgetVarianceReport calcule correctement les écarts budgétaires et l alerte de dépassement', async () => {
    // 1. SELECT currency
    mockClient.query.mockResolvedValueOnce({ rows: [{ currency: 'DZD' }] });
    // 2. SELECT maintenance_budgets (Budget alloué = 500 000 DZD)
    mockClient.query.mockResolvedValueOnce({
      rows: [{ total_budget: 500000, allocated_category: 'Poids Lourds' }],
    });
    // 3. SELECT work_orders actual costs (Dépenses réelles = 620 000 DZD)
    mockClient.query.mockResolvedValueOnce({
      rows: [{ total_actual: 620000, category: 'Poids Lourds' }],
    });

    const report = await service.getBudgetVarianceReport('tenant-1', 2026);

    expect(report.totalBudget).toBe(500000);
    expect(report.totalActual).toBe(620000);
    expect(report.varianceAmount).toBe(120000); // Dépassement de 120 000 DZD
    expect(report.variancePercentage).toBe(24); // +24%
    expect(report.isOverBudget).toBe(true);
  });
});
