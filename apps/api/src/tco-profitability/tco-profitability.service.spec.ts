import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { CostCenterService } from './services/cost-center.service';
import { TcoAggregationService } from './services/tco-aggregation.service';
import { RepairVsReplaceSimulatorService } from './services/repair-vs-replace-simulator.service';

describe('Module D — TcoProfitabilityService (TCO & Rentabilité par Actif)', () => {
  let costCenterService: CostCenterService;
  let aggregationService: TcoAggregationService;
  let simulatorService: RepairVsReplaceSimulatorService;
  let db: { query: jest.Mock };

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const assetId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    db = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostCenterService,
        TcoAggregationService,
        RepairVsReplaceSimulatorService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    costCenterService = module.get<CostCenterService>(CostCenterService);
    aggregationService = module.get<TcoAggregationService>(TcoAggregationService);
    simulatorService = module.get<RepairVsReplaceSimulatorService>(RepairVsReplaceSimulatorService);
  });

  describe('CostCenterService', () => {
    it('doit affecter un centre de coût et des cibles budgétaires par actif', async () => {
      // 1. Asset check
      db.query.mockResolvedValueOnce({
        rows: [{ id: assetId, code: 'AST-MAN-01', tenant_id: tenantId }],
      });
      // 2. Upsert cost center
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cc-1',
            tenant_id: tenantId,
            asset_id: assetId,
            cost_center_code: 'LOG-SUD-01',
            allocated_business_unit: 'Pôle Logistique Hassi Messaoud',
            target_cost_per_km_dzd: '65.00',
            target_cost_per_hour_dzd: null,
            monthly_fixed_budget_dzd: '350000.00',
            created_at: new Date().toISOString(),
          },
        ],
      });

      const cc = await costCenterService.assignCostCenter(tenantId, {
        assetId,
        costCenterCode: 'LOG-SUD-01',
        allocatedBusinessUnit: 'Pôle Logistique Hassi Messaoud',
        targetCostPerKmDzd: 65,
        monthlyFixedBudgetDzd: 350000,
      });

      expect(cc.costCenterCode).toBe('LOG-SUD-01');
      expect(cc.targetCostPerKmDzd).toBe(65);
      expect(cc.monthlyFixedBudgetDzd).toBe(350000);
    });
  });

  describe('TcoAggregationService', () => {
    it('doit consolider l’ensemble des flux réels en DZD (carburant, pièces, MO, amendes, revenus)', async () => {
      // 1. Asset query
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: assetId,
            code: 'AST-MAN-01',
            name: 'MAN TGX 33.480',
            category: 'POIDS_LOURD',
            telemetry_tier: 'MODE_2_CAN_J1939',
            status: 'OPERATIONAL',
            tenant_id: tenantId,
          },
        ],
      });
      // 2. Distance KM
      db.query.mockResolvedValueOnce({ rows: [{ delta_km: '3500' }] });
      // 3. Engine hours & fuel
      db.query.mockResolvedValueOnce({ rows: [{ total_hours: '110', fuel_liters: '1150' }] });
      // 4. Naftal fuel cost (1150 L * 29 DA = 33 350 DA)
      db.query.mockResolvedValueOnce({ rows: [{ total_cost: '33350.00', total_liters: '1150.00' }] });
      // 5. Parts cost
      db.query.mockResolvedValueOnce({ rows: [{ total_parts_cost: '45000.00' }] });
      // 6. Work orders count
      db.query.mockResolvedValueOnce({ rows: [{ count: 2 }] });
      // 7. Fines
      db.query.mockResolvedValueOnce({ rows: [{ total_fines: '10000.00' }] });
      // 8. Insurance deductible
      db.query.mockResolvedValueOnce({ rows: [{ total_deductible: '0.00' }] });
      // 9. Rental invoices
      db.query.mockResolvedValueOnce({ rows: [{ total_rental: '120000.00' }] });
      // 10. Missions count
      db.query.mockResolvedValueOnce({ rows: [{ count: 3 }] });
      // 11. Cost center budget
      db.query.mockResolvedValueOnce({ rows: [{ monthly_fixed_budget_dzd: '250000.00' }] });

      const summary = await aggregationService.getAssetDirectCostsSummary(tenantId, assetId, 2026, 11);

      expect(summary.assetCode).toBe('AST-MAN-01');
      expect(summary.fuelCostNaftalDzd).toBe(33350);
      expect(summary.maintenancePartsCostDzd).toBe(45000);
      expect(summary.maintenanceLaborCostDzd).toBe(25000); // 2 * 12500
      expect(summary.finesAndPenaltiesDzd).toBe(10000);
      expect(summary.rentalRevenueDzd).toBe(120000);
      expect(summary.internalMissionRevenueDzd).toBe(135000); // 3 * 45000
      expect(summary.totalGeneratedRevenueDzd).toBe(255000);
      expect(summary.distanceKmRun).toBe(3500);
      expect(summary.actualCostPerKmDzd).toBeGreaterThan(0);
      expect(summary.isOverTargetBudget).toBe(false); // Coûts directs ~204 600 < 250 000
    });
  });

  describe('RepairVsReplaceSimulatorService', () => {
    it('doit recommander REPLACE_BY_NEW si l’actif a un VHI critique et des coûts projetés excessifs', async () => {
      // 1. Asset check (actif vieux de 10 ans)
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: assetId,
            code: 'AST-OLD-01',
            name: 'Renault Kerax 380',
            category: 'POIDS_LOURD',
            telemetry_tier: 'MODE_1_GNSS',
            commissioning_date: '2016-01-01',
            status: 'OPERATIONAL',
            tenant_id: tenantId,
          },
        ],
      });
      // 2. Odometer (650 000 km)
      db.query.mockResolvedValueOnce({ rows: [{ val: '650000' }] });
      // 3. Open work orders (3)
      db.query.mockResolvedValueOnce({ rows: [{ count: 3 }] });
      // 4. Open claims damage (750 000 DA)
      db.query.mockResolvedValueOnce({ rows: [{ damage: '750000.00' }] });
      // 5. Insert simulation
      db.query.mockResolvedValueOnce({ rows: [{ id: 'sim-1' }] });

      const sim = await simulatorService.simulateRepairVsReplace(tenantId, assetId, 24);

      expect(sim.recommendedDecision).toBe('REPLACE_BY_NEW');
      expect(sim.currentAgeYears).toBeGreaterThanOrEqual(9);
      expect(sim.vhiScore).toBeLessThan(45);
      expect(sim.netSavingsEstimateDzd).toBeGreaterThan(0);
      expect(sim.justificationDossier).toContain('VHI critique');
    });

    it('doit recommander REPAIR_AND_CONTINUE pour un actif récent en bonne santé mécanique', async () => {
      // 1. Asset check (actif de 2 ans)
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: assetId,
            code: 'AST-NEW-01',
            name: 'Shacman X3000',
            category: 'POIDS_LOURD',
            telemetry_tier: 'MODE_2_CAN_J1939',
            commissioning_date: '2024-06-01',
            status: 'OPERATIONAL',
            tenant_id: tenantId,
          },
        ],
      });
      // 2. Odometer (45 000 km)
      db.query.mockResolvedValueOnce({ rows: [{ val: '45000' }] });
      // 3. Open work orders (0)
      db.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // 4. Open claims damage (0)
      db.query.mockResolvedValueOnce({ rows: [{ damage: '0.00' }] });
      // 5. Insert simulation
      db.query.mockResolvedValueOnce({ rows: [{ id: 'sim-2' }] });

      const sim = await simulatorService.simulateRepairVsReplace(tenantId, assetId, 24);

      expect(sim.recommendedDecision).toBe('REPAIR_AND_CONTINUE');
      expect(sim.vhiScore).toBeGreaterThanOrEqual(75);
      expect(sim.justificationDossier).toContain('bon état mécanique');
    });
  });
});

