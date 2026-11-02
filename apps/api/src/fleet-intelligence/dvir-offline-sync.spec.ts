import { Test, TestingModule } from '@nestjs/testing';
import { DvirService } from './services/dvir.service';
import { DvirController } from './controllers/dvir.controller';
import { AlgerianRegulatoryGateService } from './services/regulatory-gate.service';
import { SubstitutionOptimizerService } from './services/substitution-optimizer.service';
import { FinancialArbitrageService } from './services/financial-arbitrage.service';
import { RegulatoryMissionOrderService } from './services/regulatory-mission-order.service';
import { DispatchDecisionController } from './controllers/dispatch-decision.controller';
import {
  DVIRInspectionType,
  DVIRItemStatus,
  DVIRSubmissionDto,
  DVIRSyncBatchDto,
  DispatchStatus,
  DispatchAssetCategory,
  LicenseCategoryDZ,
  ClimateZoneDZ,
  IndustrySector,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
} from '@docteurflotte/contracts';

describe('DVIR Mobile Offline-First & Store-and-Forward Sync Tests', () => {
  let dvirService: DvirService;
  let dvirController: DvirController;
  let dispatchController: DispatchDecisionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DvirController, DispatchDecisionController],
      providers: [
        DvirService,
        AlgerianRegulatoryGateService,
        SubstitutionOptimizerService,
        FinancialArbitrageService,
        RegulatoryMissionOrderService,
      ],
    }).compile();

    dvirService = module.get<DvirService>(DvirService);
    dvirController = module.get<DvirController>(DvirController);
    dispatchController = module.get<DispatchDecisionController>(DispatchDecisionController);

    dvirService.clearStore();
  });

  describe('1. Soumission unitaire & Détection de défaillance critique', () => {
    it('doit valider une inspection conforme sans ordre de travail', () => {
      const submission: DVIRSubmissionDto = {
        assetId: 'ast-kangoo-01',
        driverId: 'drv-mourad-01',
        driverName: 'Mourad Belkacem',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        odometerKm: 120500,
        items: [
          { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneus', status: DVIRItemStatus.PASS },
          { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Freins', status: DVIRItemStatus.PASS },
          { code: 'OIL', category: 'MECHANICAL', label: 'Huile', status: DVIRItemStatus.PASS },
        ],
        submittedAt: '2026-11-01T07:00:00.000Z',
      };

      const report = dvirController.submitReport(submission, { tenantId: 'tenant-algeria-logistics' });

      expect(report.isCompliant).toBe(true);
      expect(report.hasCriticalFailures).toBe(false);
      expect(report.generatedWorkOrderId).toBeUndefined();
      expect(report.assetId).toBe('ast-kangoo-01');
    });

    it('doit bloquer immédiatement le véhicule en cas de défaillance critique et générer un OT atelier', () => {
      const criticalSubmission: DVIRSubmissionDto = {
        assetId: 'ast-man-02',
        driverId: 'drv-karim-02',
        driverName: 'Karim Ziani',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        odometerKm: 345000,
        items: [
          { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneu AVG hernie profonde', status: DVIRItemStatus.FAIL_CRITICAL, comment: 'Flanc déchiré suite chantier' },
          { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Freins', status: DVIRItemStatus.PASS },
        ],
        submittedAt: '2026-11-01T07:30:00.000Z',
      };

      const report = dvirController.submitReport(criticalSubmission, { tenantId: 'tenant-algeria-logistics' });

      expect(report.isCompliant).toBe(false);
      expect(report.hasCriticalFailures).toBe(true);
      expect(report.generatedWorkOrderId).toBeDefined();
      expect(report.generatedWorkOrderId).toContain('ot-dvir-ast-man-02');

      // Vérifier le statut via l'endpoint de consultation
      const statusCheck = dvirController.getAssetDvirStatus('ast-man-02', { tenantId: 'tenant-algeria-logistics' });
      expect(statusCheck.isBlockedByDvir).toBe(true);
      expect(statusCheck.latestReport?.hasCriticalFailures).toBe(true);
    });

    it('doit persister fidèlement la signature tactile du chauffeur et les photos de preuves compressées (Axe A)', () => {
      const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAACWAQMAAAB6Q004...==';
      const mockPhotoProof = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...==';

      const signedSubmission: DVIRSubmissionDto = {
        assetId: 'ast-actros-04',
        driverId: 'drv-hassan-04',
        driverName: 'Hassan Mansouri',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        odometerKm: 278000,
        signatureDataUrl: mockSignature,
        items: [
          {
            code: 'BRAKES',
            category: 'TIRES_BRAKES',
            label: 'Plaquettes de frein avant',
            status: DVIRItemStatus.FAIL_CRITICAL,
            comment: 'Garniture ferraillée constatée visuellement',
            photoUrl: mockPhotoProof,
          },
          { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneus', status: DVIRItemStatus.PASS },
        ],
        submittedAt: '2026-11-01T08:15:00.000Z',
      };

      const report = dvirController.submitReport(signedSubmission, { tenantId: 'tenant-signature-test' });

      // Vérification de la persistance de la signature
      expect(report.signatureDataUrl).toBe(mockSignature);
      expect(report.items[0].photoUrl).toBe(mockPhotoProof);

      // Vérification dans l'historique de consultation
      const fetchedReports = dvirController.getReports('ast-actros-04', { tenantId: 'tenant-signature-test' });
      expect(fetchedReports.length).toBeGreaterThanOrEqual(1);
      expect(fetchedReports[0].signatureDataUrl).toBe(mockSignature);
      expect(fetchedReports[0].items[0].photoUrl).toBe(mockPhotoProof);
    });
  });

  describe('2. Synchronisation différée par lot (Store-and-Forward / Zones Blanches)', () => {
    it('doit réordonner chronologiquement les fiches arrivant dans le désordre réseau', () => {
      // Scénario : Le camion traverse le corridor Ouargla -> In Salah -> Tamanrasset (zones blanches)
      // 3 inspections sont prises sur l'appareil à T1 (08h00), T2 (12h00), T3 (17h00).
      // En raison des sauts de réseau 4G, le serveur les reçoit dans le désordre : [T3, T1, T2]
      const batchPayload: DVIRSyncBatchDto = {
        syncDeviceId: 'PWA-TABLET-HOGGAR-01',
        syncTimestampUtc: '2026-11-01T18:00:00.000Z',
        reports: [
          {
            assetId: 'ast-shacman-03',
            driverId: 'drv-tamanrasset-01',
            driverName: 'Djamel Bensalem',
            inspectionType: DVIRInspectionType.POST_TRIP,
            odometerKm: 210800,
            items: [
              { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneus', status: DVIRItemStatus.PASS },
              { code: 'LIGHTS', category: 'LIGHTING', label: 'Feux', status: DVIRItemStatus.PASS },
            ],
            submittedAt: '2026-11-01T17:00:00.000Z', // T3 (Retour dépôt)
          },
          {
            assetId: 'ast-shacman-03',
            driverId: 'drv-tamanrasset-01',
            driverName: 'Djamel Bensalem',
            inspectionType: DVIRInspectionType.PRE_TRIP,
            odometerKm: 210000,
            items: [
              { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneus', status: DVIRItemStatus.PASS },
            ],
            submittedAt: '2026-11-01T08:00:00.000Z', // T1 (Départ matin)
          },
          {
            assetId: 'ast-shacman-03',
            driverId: 'drv-tamanrasset-01',
            driverName: 'Djamel Bensalem',
            inspectionType: DVIRInspectionType.PRE_TRIP,
            odometerKm: 210450,
            items: [
              { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Fuite pneumatique cuve', status: DVIRItemStatus.FAIL_CRITICAL },
            ],
            submittedAt: '2026-11-01T12:00:00.000Z', // T2 (Arrêt midi avec incident)
          },
        ],
      };

      const syncResult = dvirController.syncOfflineBatch(batchPayload, { tenantId: 'tenant-sahara-freight' });

      expect(syncResult.totalReceived).toBe(3);
      expect(syncResult.syncedCount).toBe(3);
      expect(syncResult.criticalFailuresCount).toBe(1);
      expect(syncResult.generatedWorkOrderIds.length).toBe(1);

      // Vérifier que les rapports ont été ingérés dans l'ordre chronologique de l'appareil
      const processed = syncResult.processedReports;
      expect(processed[0].submittedAt).toBe('2026-11-01T08:00:00.000Z');
      expect(processed[1].submittedAt).toBe('2026-11-01T12:00:00.000Z');
      expect(processed[2].submittedAt).toBe('2026-11-01T17:00:00.000Z');
    });

    it('doit garantir l’idempotence lors d’un rejeu de lot de synchronisation (zéro doublon d’OT)', () => {
      const submission: DVIRSubmissionDto = {
        assetId: 'ast-actros-04',
        driverId: 'drv-bilal-04',
        driverName: 'Bilal Cherif',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        odometerKm: 154000,
        items: [
          { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pression pneu', status: DVIRItemStatus.FAIL_CRITICAL },
        ],
        submittedAt: '2026-11-01T09:15:00.000Z',
      };

      // 1er envoi
      const batch1: DVIRSyncBatchDto = { reports: [submission] };
      const res1 = dvirController.syncOfflineBatch(batch1, { tenantId: 'tenant-idempotence' });
      expect(res1.syncedCount).toBe(1);
      expect(res1.generatedWorkOrderIds.length).toBe(1);
      const firstOtId = res1.generatedWorkOrderIds[0];

      // 2e envoi identique (rejeu réseau après timeout)
      const res2 = dvirController.syncOfflineBatch(batch1, { tenantId: 'tenant-idempotence' });
      expect(res2.syncedCount).toBe(1);
      // Le rapport existant est retourné sans régénérer un nouvel OT différent
      expect(res2.processedReports[0].generatedWorkOrderId).toBe(firstOtId);

      // Vérifier le total dans le registre
      const allReports = dvirController.getReports('tenant-idempotence', { tenantId: 'tenant-idempotence' });
      expect(allReports.length).toBe(1);
    });

    it('doit maintenir une étanchéité multi-tenant absolue entre tenants distincts', () => {
      const reportTenantA: DVIRSubmissionDto = {
        assetId: 'ast-vul-16',
        driverId: 'drv-a',
        driverName: 'Chauffeur A',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        items: [{ code: 'OIL', category: 'MECHANICAL', label: 'Huile', status: DVIRItemStatus.PASS }],
        submittedAt: '2026-11-01T10:00:00.000Z',
      };

      const reportTenantB: DVIRSubmissionDto = {
        assetId: 'ast-vul-31',
        driverId: 'drv-b',
        driverName: 'Chauffeur B',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        items: [{ code: 'OIL', category: 'MECHANICAL', label: 'Huile', status: DVIRItemStatus.PASS }],
        submittedAt: '2026-11-01T10:05:00.000Z',
      };

      dvirController.syncOfflineBatch({ reports: [reportTenantA] }, { tenantId: 'tenant-alger' });
      dvirController.syncOfflineBatch({ reports: [reportTenantB] }, { tenantId: 'tenant-oran' });

      const reportsAlger = dvirController.getReports('tenant-alger', { tenantId: 'tenant-alger' });
      const reportsOran = dvirController.getReports('tenant-oran', { tenantId: 'tenant-oran' });

      expect(reportsAlger.length).toBe(1);
      expect(reportsAlger[0].assetId).toBe('ast-vul-16');

      expect(reportsOran.length).toBe(1);
      expect(reportsOran[0].assetId).toBe('ast-vul-31');
    });
  });

  describe('3. Cycle Complet E2E : Couplage DVIR Hors-Ligne & Moteur de Dispatching TOPSIS', () => {
    it('doit bloquer le véhicule recalé par un DVIR synchronisé et assigner automatiquement un véhicule de secours', () => {
      // Étape 1 : Le véhicule ast-t480-primary subit une inspection DVIR avec défaillance critique
      const criticalDvir: DVIRSubmissionDto = {
        assetId: 'ast-t480-primary',
        driverId: 'drv-primary',
        driverName: 'Mourad Belkacem',
        inspectionType: DVIRInspectionType.PRE_TRIP,
        odometerKm: 185000,
        items: [
          { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Fuite flexible de frein', status: DVIRItemStatus.FAIL_CRITICAL },
        ],
        submittedAt: '2026-11-01T06:00:00.000Z',
      };

      dvirController.syncOfflineBatch({ reports: [criticalDvir] }, { tenantId: 'tenant-transport-dz' });
      const isBlocked = dvirService.hasActiveCriticalDvirBlock('ast-t480-primary', 'tenant-transport-dz');
      expect(isBlocked).toBe(true);

      // Étape 2 : Demande de dispatching d'une mission lourde de fret industriel Alger (16) -> Ouargla (30)
      const mission: MissionRequestDto = {
        missionId: 'msn-alger-ouargla-01',
        tenantId: 'tenant-transport-dz',
        originWilayaCode: 16,
        originName: 'Zone Industrielle Rouiba (Alger)',
        originLat: 36.73,
        originLon: 3.28,
        destinationWilayaCode: 30,
        destinationName: 'Base Logistique Hassi Messaoud (Ouargla)',
        transitWilayaCodes: [9, 17],
        targetClimateZone: ClimateZoneDZ.SAHARA_SOUTH,
        industrySector: IndustrySector.LOGISTICS,
        requiredPayloadTons: 22.0,
        routeDistanceKm: 850,
        estimatedDrivingHours: 11.5,
        plannedDepartureUtc: '2026-11-01T07:00:00.000Z',
        requiresHazmatAdr: false,
        requiresReeferColdChain: false,
        requiresPtoHydraulics: false,
        requestedVehicleId: 'ast-t480-primary', // Véhicule demandé initialement
        requestedDriverId: 'drv-primary',
      };

      // Flotte disponible avec le véhicule bloqué par DVIR et un véhicule de substitution sain
      const fleetVehicles: VehicleStateDto[] = [
        {
          vehicleId: 'ast-t480-primary',
          registrationPlate: '16-10492-00',
          makeModel: 'Renault Trucks T 480',
          category: DispatchAssetCategory.TRACTOR_TRAILER,
          maxPayloadTons: 26.0,
          grossVehicleWeightTons: 40.0,
          fuelType: 'DIESEL',
          refConsumptionL100Km: 32.5,
          hasWorkingReefer: false,
          hasWorkingPto: false,
          currentWilayaCode: 16,
          currentLat: 36.75,
          currentLon: 3.05,
          currentOdometerKm: 185000,
          currentEngineHours: 4200,
          annualTargetKm: 120000,
          ytdDrivenKm: 98000,
          vehicleHealthIndex: 82,
          batterySohPct: 85.0,
          coolingEwmaResidualC: 1.2,
          dispatchStatus: DispatchStatus.AVAILABLE,
          documents: [
            { docType: 'CONTROLE_TECHNIQUE_ENACTA' as any, docNumber: 'ENACTA-2026-01', issuedAt: '2026-06-01', expiresAt: '2026-11-25' },
            { docType: 'ASSURANCE_RC_CATNAT' as any, docNumber: 'SAA-2026-99', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
            { docType: 'VIGNETTE_AUTOMOBILE' as any, docNumber: 'VIG-2026', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
            { docType: 'AUTORISATION_CIRCULATION_MARCHANDISES' as any, docNumber: 'DIR-TR-16', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
            { docType: 'CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE' as any, docNumber: 'TACHO-01', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
          ],
          subsystemRuls: [
            { taskCode: 'ENG_OIL', taskName: 'Vidange', subsystem: 'Moteur', wearRatioPct: 20, rulKm: 18000, rulEngineHours: 500, rulDays: 90, isCriticalSafety: false },
          ],
          activeDtcs: [],
          hasCriticalDvirFailure: true, // Injecté depuis le résultat du DVIR
          latestDvirInspectionId: 'dvir-crit-01',
        },
        {
          vehicleId: 'ast-actros-backup',
          registrationPlate: '16-20984-00',
          makeModel: 'Mercedes-Benz Actros 1845 (Secours)',
          category: DispatchAssetCategory.TRACTOR_TRAILER,
          maxPayloadTons: 26.0,
          grossVehicleWeightTons: 40.0,
          fuelType: 'DIESEL',
          refConsumptionL100Km: 31.0,
          hasWorkingReefer: false,
          hasWorkingPto: false,
          currentWilayaCode: 16,
          currentLat: 36.73,
          currentLon: 3.28,
          currentOdometerKm: 140000,
          currentEngineHours: 3100,
          annualTargetKm: 120000,
          ytdDrivenKm: 75000,
          vehicleHealthIndex: 88,
          batterySohPct: 90.0,
          coolingEwmaResidualC: 0.8,
          dispatchStatus: DispatchStatus.AVAILABLE,
          documents: [
            { docType: 'CONTROLE_TECHNIQUE_ENACTA' as any, docNumber: 'ENACTA-2026-02', issuedAt: '2026-06-01', expiresAt: '2026-11-25' },
            { docType: 'ASSURANCE_RC_CATNAT' as any, docNumber: 'SAA-2026-100', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
            { docType: 'VIGNETTE_AUTOMOBILE' as any, docNumber: 'VIG-2026-2', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
            { docType: 'AUTORISATION_CIRCULATION_MARCHANDISES' as any, docNumber: 'DIR-TR-16-2', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
            { docType: 'CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE' as any, docNumber: 'TACHO-02', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
          ],
          subsystemRuls: [
            { taskCode: 'ENG_OIL', taskName: 'Vidange', subsystem: 'Moteur', wearRatioPct: 15, rulKm: 22000, rulEngineHours: 600, rulDays: 120, isCriticalSafety: false },
          ],
          activeDtcs: [],
          hasCriticalDvirFailure: false,
        },
      ];

      const fleetDrivers: DriverStateDto[] = [
        {
          driverId: 'drv-primary',
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
        },
      ];

      // Étape 3 : Exécution de l'arbitrage automatique de dispatching
      const decision = dispatchController.evaluateAndAssign({
        mission,
        fleetVehicles,
        fleetDrivers,
      });

      // Assertions :
      // 1. Le véhicule initial ast-t480-primary est refusé pour violation DVIR_CRITICAL_FAILURE_BLOCK
      expect(decision.violationsDetected.length).toBeGreaterThan(0);
      const dvirViolation = decision.violationsDetected.find((v) => v.code === 'DVIR_CRITICAL_FAILURE_BLOCK');
      expect(dvirViolation).toBeDefined();
      expect(dvirViolation?.severity).toBe('HARD_BLOCK');

      // 2. Décision = Substitution automatique
      expect(decision.decisionOutcome).toBe('SUBSTITUTED_AUTOMATICALLY');

      // 3. Actif attribué = ast-actros-backup
      expect(decision.assignedVehicleId).toBe('ast-actros-backup');
      expect(decision.assignedRegistrationPlate).toBe('16-20984-00');
      expect(decision.assignedDriverId).toBe('drv-primary');

      // 4. Ordre de travail généré pour le véhicule en panne
      expect(decision.generatedWorkOrders.length).toBeGreaterThan(0);
    });
  });
});
