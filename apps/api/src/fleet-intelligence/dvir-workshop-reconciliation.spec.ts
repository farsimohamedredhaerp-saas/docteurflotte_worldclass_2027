import { Test, TestingModule } from '@nestjs/testing';
import { DvirService } from './services/dvir.service';
import { DvirController } from './controllers/dvir.controller';
import { AlgerianRegulatoryGateService } from './services/regulatory-gate.service';
import { SubstitutionOptimizerService } from './services/substitution-optimizer.service';
import { FinancialArbitrageService } from './services/financial-arbitrage.service';
import { RegulatoryMissionOrderService } from './services/regulatory-mission-order.service';
import { DispatchDecisionController } from './controllers/dispatch-decision.controller';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { DatabaseService } from '../database/database.service';
import {
  DVIRInspectionType,
  DVIRItemStatus,
  DVIRSubmissionDto,
  DispatchStatus,
  DispatchAssetCategory,
  LicenseCategoryDZ,
  ClimateZoneDZ,
  IndustrySector,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
  WorkOrderStatus,
} from '@docteurflotte/contracts';

describe('DVIR Mobile & Workshop Reconciliation E2E Tests (Axe B)', () => {
  let dvirService: DvirService;
  let dvirController: DvirController;
  let dispatchController: DispatchDecisionController;
  let workOrdersService: WorkOrdersService;
  let mockDatabaseService: any;
  let mockClient: any;

  const TENANT_ID = 'tenant-logistics-dz';
  const PRIMARY_ASSET_ID = 'ast-mercedes-actros-3340';
  const BACKUP_ASSET_ID = 'ast-renault-k480-backup';

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(),
    };

    mockDatabaseService = {
      withTenantContext: jest.fn(async (tId, cb) => cb(mockClient)),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DvirController, DispatchDecisionController],
      providers: [
        DvirService,
        AlgerianRegulatoryGateService,
        SubstitutionOptimizerService,
        FinancialArbitrageService,
        RegulatoryMissionOrderService,
        WorkOrdersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    dvirService = module.get<DvirService>(DvirService);
    dvirController = module.get<DvirController>(DvirController);
    dispatchController = module.get<DispatchDecisionController>(DispatchDecisionController);
    workOrdersService = module.get<WorkOrdersService>(WorkOrdersService);

    dvirService.clearStore();
  });

  const sampleMission: MissionRequestDto = {
    missionId: 'msn-alger-ghardaia-01',
    tenantId: TENANT_ID,
    originWilayaCode: 16,
    originName: 'Zone Industrielle Rouiba (Alger)',
    originLat: 36.73,
    originLon: 3.28,
    destinationWilayaCode: 47,
    destinationName: 'Base Logistique Vallée du M\'Zab (Ghardaïa)',
    transitWilayaCodes: [9, 17],
    targetClimateZone: ClimateZoneDZ.HIGH_PLATEAUS,
    industrySector: IndustrySector.LOGISTICS,
    requiredPayloadTons: 20.0,
    routeDistanceKm: 600,
    estimatedDrivingHours: 8.5,
    plannedDepartureUtc: '2026-11-01T08:00:00.000Z',
    requiresHazmatAdr: false,
    requiresReeferColdChain: false,
    requiresPtoHydraulics: false,
    requestedVehicleId: PRIMARY_ASSET_ID,
    requestedDriverId: 'drv-mourad-01',
  };

  const sampleDriver: DriverStateDto = {
    driverId: 'drv-mourad-01',
    fullName: 'Mourad Belkacem',
    phoneDz: '0550123456',
    licenseCategories: [LicenseCategoryDZ.B, LicenseCategoryDZ.C1, LicenseCategoryDZ.C2, LicenseCategoryDZ.E],
    hasBrevetProfessionnel: true,
    hasAdrHazmatCert: true,
    currentWilayaCode: 16,
    continuousDrivingHours: 0,
    dailyDrivingHoursToday: 0,
    restHoursLast24h: 12,
    safetyScore: 92,
    isAvailable: true,
  };

  const createVehicleState = (vehicleId: string, hasCriticalFailure: boolean = false): VehicleStateDto => ({
    vehicleId,
    registrationPlate: vehicleId === PRIMARY_ASSET_ID ? '16-10492-00' : '16-20984-00',
    makeModel: vehicleId === PRIMARY_ASSET_ID ? 'Mercedes-Benz Actros 3340' : 'Renault Trucks K 480 (Secours)',
    category: DispatchAssetCategory.TRACTOR_TRAILER,
    maxPayloadTons: 26.0,
    grossVehicleWeightTons: 40.0,
    fuelType: 'DIESEL',
    refConsumptionL100Km: 32.0,
    hasWorkingReefer: false,
    hasWorkingPto: false,
    currentWilayaCode: 16,
    currentLat: 36.75,
    currentLon: 3.05,
    currentOdometerKm: 285400,
    currentEngineHours: 4200,
    annualTargetKm: 120000,
    ytdDrivenKm: 85000,
    vehicleHealthIndex: 88,
    batterySohPct: 88.0,
    coolingEwmaResidualC: 1.0,
    dispatchStatus: DispatchStatus.AVAILABLE,
    documents: [
      { docType: 'CONTROLE_TECHNIQUE_ENACTA' as any, docNumber: `ENACTA-${vehicleId}`, issuedAt: '2026-06-01', expiresAt: '2026-11-25' },
      { docType: 'ASSURANCE_RC_CATNAT' as any, docNumber: `SAA-${vehicleId}`, issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
      { docType: 'VIGNETTE_AUTOMOBILE' as any, docNumber: `VIG-${vehicleId}`, issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
      { docType: 'AUTORISATION_CIRCULATION_MARCHANDISES' as any, docNumber: `DIR-TR-${vehicleId}`, issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
      { docType: 'CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE' as any, docNumber: `TACHO-${vehicleId}`, issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
    ],
    subsystemRuls: [
      { taskCode: 'ENG_OIL', taskName: 'Vidange', subsystem: 'Moteur', wearRatioPct: 15, rulKm: 19000, rulEngineHours: 550, rulDays: 95, isCriticalSafety: false },
    ],
    activeDtcs: [],
    hasCriticalDvirFailure: hasCriticalFailure,
    latestDvirInspectionId: hasCriticalFailure ? 'dvir-crit-01' : undefined,
  });

  describe('Cycle Complet : Constat Mobile ➔ Verrou TOPSIS ➔ Clôture Atelier ➔ Requalification Dispatch', () => {
    it('doit dérouler avec succès l’intégralité du cycle de réconciliation atelier', async () => {
      // 1. Constat DVIR mobile : défaillance critique signalée sur le véhicule principal
      const dvirSubmission: DVIRSubmissionDto = {
        assetId: PRIMARY_ASSET_ID,
        driverId: 'drv-mourad-01',
        driverName: 'Mourad Belkacem',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        odometerKm: 285400,
        items: [
          {
            code: 'BRAKES',
            category: 'TIRES_BRAKES',
            label: 'Circuit de freinage pneumatique',
            status: DVIRItemStatus.FAIL_CRITICAL,
            comment: 'Chute de pression brutale < 7.5 bar et fuite audible sous sécheur APS',
          },
        ],
        submittedAt: '2026-11-01T08:00:00.000Z',
      };

      const report = dvirService.submitReport(dvirSubmission, TENANT_ID);
      expect(report.hasCriticalFailures).toBe(true);
      expect(report.isCompliant).toBe(false);
      expect(report.generatedWorkOrderId).toBeDefined();

      const generatedWoId = report.generatedWorkOrderId!;
      expect(dvirService.hasActiveCriticalDvirBlock(PRIMARY_ASSET_ID, TENANT_ID)).toBe(true);

      // 2. Tentative de dispatching : le véhicule principal est bloqué par DVIR, substitution TOPSIS
      const candidatePrimary = createVehicleState(PRIMARY_ASSET_ID, true);
      const candidateBackup = createVehicleState(BACKUP_ASSET_ID, false);

      const initialDecision = dispatchController.evaluateAndAssign({
        mission: sampleMission,
        fleetVehicles: [candidatePrimary, candidateBackup],
        fleetDrivers: [sampleDriver],
      });

      expect(initialDecision.violationsDetected.length).toBeGreaterThan(0);
      const dvirViolation = initialDecision.violationsDetected.find((v) => v.code === 'DVIR_CRITICAL_FAILURE_BLOCK');
      expect(dvirViolation).toBeDefined();
      expect(dvirViolation?.severity).toBe('HARD_BLOCK');

      expect(initialDecision.decisionOutcome).toBe('SUBSTITUTED_AUTOMATICALLY');
      expect(initialDecision.assignedVehicleId).toBe(BACKUP_ASSET_ID);
      expect(initialDecision.assignedDriverId).toBe('drv-mourad-01');

      // 3. Réparation en atelier et clôture de l'Ordre de Travail
      mockClient.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: generatedWoId,
              tenant_id: TENANT_ID,
              asset_id: PRIMARY_ASSET_ID,
              name: 'Mercedes-Benz Actros 3340',
              code: 'DZ-ACTROS-16',
              title: 'Réparation Sécheur Air APS',
              status: WorkOrderStatus.SCHEDULED,
              maintenance_interval_value: 20000,
              current_meter_value: 285400,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ economic_rates: { hourlyLaborRate: 2000 } }], // 2000 DZD/h
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: generatedWoId,
              tenant_id: TENANT_ID,
              asset_id: PRIMARY_ASSET_ID,
              title: 'Réparation Sécheur Air APS',
              status: WorkOrderStatus.COMPLETED,
              actual_labor_hours: 2.5,
              hourly_rate_applied: 2000,
              labor_cost: 5000, // 2.5h * 2000 DZD
              parts_cost: 18500, // Cartouche + vanne décharge
              total_cost: 23500, // 5000 + 18500 DZD
              downtime_hours: 3.0,
              completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE assets SET status = OPERATIONAL
        .mockResolvedValueOnce({ rows: [] }); // UPDATE decision_recommendations

      const completedWo = await workOrdersService.completeWorkOrder(TENANT_ID, generatedWoId, {
        actualLaborHours: 2.5,
        partsCost: 18500,
        downtimeHours: 3.0,
        completionNotes: 'Remplacement cartouche dessiccateur APS et vanne de régulation. Pression nominale 11.8 bar certifiée.',
      });

      expect(completedWo.status).toBe(WorkOrderStatus.COMPLETED);
      expect(completedWo.totalCost).toBe(23500);

      // 4. Vérification de la levée automatique de consignation DVIR
      expect(dvirService.hasActiveCriticalDvirBlock(PRIMARY_ASSET_ID, TENANT_ID)).toBe(false);

      const assetReports = dvirService.getReportsByAsset(PRIMARY_ASSET_ID, TENANT_ID);
      expect(assetReports[0].hasCriticalFailures).toBe(false);
      expect(assetReports[0].isCompliant).toBe(true);
      expect(assetReports[0].resolvedAt).toBeDefined();
      expect(assetReports[0].resolvedByWorkOrderId).toBe(generatedWoId);

      // 5. Requalification TOPSIS Dispatching : le véhicule réparé redevient 100% nominal et conforme
      const repairedPrimary = createVehicleState(PRIMARY_ASSET_ID, false);
      const subsequentDecision = dispatchController.evaluateAndAssign({
        mission: sampleMission,
        fleetVehicles: [repairedPrimary, candidateBackup],
        fleetDrivers: [sampleDriver],
      });

      expect(['APPROVED_AS_REQUESTED', 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT']).toContain(subsequentDecision.decisionOutcome);
      expect(subsequentDecision.assignedVehicleId).toBe(PRIMARY_ASSET_ID);
      expect(subsequentDecision.violationsDetected).toHaveLength(0);
      expect(subsequentDecision.assignedDriverId).toBe('drv-mourad-01');
    });

    it('garantit l’isolation stricte multi-tenant : une clôture sur tenant A ne lève pas le verrou sur tenant B', async () => {
      const TENANT_B = 'tenant-btp-sud';
      const SHARED_CODE_ASSET = 'ast-shared-code-01';

      // Tenant A et Tenant B enregistrent un blocage DVIR
      dvirService.submitReport(
        {
          assetId: SHARED_CODE_ASSET,
          driverId: 'drv-a',
          driverName: 'Chauffeur A',
          inspectionType: DVIRInspectionType.PRE_TRIP,
          items: [{ code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneu', status: DVIRItemStatus.FAIL_CRITICAL }],
          submittedAt: '2026-11-01T09:00:00Z',
        },
        TENANT_ID,
      );

      dvirService.submitReport(
        {
          assetId: SHARED_CODE_ASSET,
          driverId: 'drv-b',
          driverName: 'Chauffeur B',
          inspectionType: DVIRInspectionType.PRE_TRIP,
          items: [{ code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneu', status: DVIRItemStatus.FAIL_CRITICAL }],
          submittedAt: '2026-11-01T09:00:00Z',
        },
        TENANT_B,
      );

      expect(dvirService.hasActiveCriticalDvirBlock(SHARED_CODE_ASSET, TENANT_ID)).toBe(true);
      expect(dvirService.hasActiveCriticalDvirBlock(SHARED_CODE_ASSET, TENANT_B)).toBe(true);

      // Levée de consignation effectuée EXCLUSIVEMENT sur Tenant A
      const resolveResult = dvirService.resolveDvirBlock(SHARED_CODE_ASSET, 'ot-a-99', TENANT_ID);
      expect(resolveResult.resolved).toBe(true);

      // Tenant A est déconsigné
      expect(dvirService.hasActiveCriticalDvirBlock(SHARED_CODE_ASSET, TENANT_ID)).toBe(false);
      // Tenant B RESTE strictement consigné et protégé
      expect(dvirService.hasActiveCriticalDvirBlock(SHARED_CODE_ASSET, TENANT_B)).toBe(true);
    });
  });
});
