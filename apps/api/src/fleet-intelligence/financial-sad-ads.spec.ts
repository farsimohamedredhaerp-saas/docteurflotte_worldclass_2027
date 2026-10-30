import { Test, TestingModule } from '@nestjs/testing';
import {
  ClimateZoneDZType,
  DAILY_DOWNTIME_COST_DZD,
  ENACTA_REGULATORY_MATRIX,
  EnactaVehicleCategory,
  NAFTAL_FUEL_PRICES_DZD,
  PREDICTIVE_FAILURE_MODES_CATALOG,
  REGIONAL_TOWING_RATES_DZD,
  computeFailureProbability,
  evaluateFinancialArbitrageDzd,
} from '@docteurflotte/contracts';
import { AlgerianRegulatoryGateService } from './services/regulatory-gate.service';
import { SubstitutionOptimizerService } from './services/substitution-optimizer.service';
import { FinancialArbitrageService } from './services/financial-arbitrage.service';
import { RegulatoryMissionOrderService } from './services/regulatory-mission-order.service';
import {
  AssetCategory,
  ClimateZoneDZ,
  DispatchStatus,
  DocumentTypeDZ,
  DriverStateDto,
  IndustrySector,
  LicenseCategoryDZ,
  MissionRequestDto,
  VehicleStateDto,
} from './dto/dispatch-decision.dto';

describe('EPIC 4 : Financial Arbitrage (SAD -> ADS), ENACTA & Multicriteria Substitution', () => {
  let regGate: AlgerianRegulatoryGateService;
  let optimizer: SubstitutionOptimizerService;
  let arbitrageService: FinancialArbitrageService;
  let missionOrderService: RegulatoryMissionOrderService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlgerianRegulatoryGateService,
        SubstitutionOptimizerService,
        FinancialArbitrageService,
        RegulatoryMissionOrderService,
      ],
    }).compile();

    regGate = module.get<AlgerianRegulatoryGateService>(AlgerianRegulatoryGateService);
    optimizer = module.get<SubstitutionOptimizerService>(SubstitutionOptimizerService);
    arbitrageService = module.get<FinancialArbitrageService>(FinancialArbitrageService);
    missionOrderService = module.get<RegulatoryMissionOrderService>(
      RegulatoryMissionOrderService,
    );
  });

  // Base Mission : Convoi Alger (Rouïba) -> Hassi Messaoud (Bassin Pétrolier)
  const baseMission: MissionRequestDto = {
    missionId: 'MIS-ALG-HMD-2026-01',
    tenantId: 'tenant-dz-sonatrach-logistics',
    industrySector: IndustrySector.TRANSPORT,
    requestedVehicleId: 'veh-snvi-01',
    requestedDriverId: 'drv-mourad-01',
    originName: 'Zone Industrielle Rouïba (Alger)',
    originWilayaCode: 16,
    originLat: 36.73,
    originLon: 3.28,
    destinationName: 'Base de Vie Irara (Hassi Messaoud)',
    destinationWilayaCode: 30,
    transitWilayaCodes: [9, 26, 17, 3], // Blida, Médéa, Djelfa, Laghouat
    plannedDepartureUtc: '2026-10-30T05:00:00Z',
    routeDistanceKm: 850,
    estimatedDrivingHours: 12,
    requiredPayloadTons: 24,
    targetClimateZone: ClimateZoneDZ.SAHARA_SOUTH,
    requiresReeferColdChain: false,
    requiresHazmatAdr: false,
    requiresPtoHydraulics: false,
  };

  const createVehicle = (overrides: Partial<VehicleStateDto> = {}): VehicleStateDto => ({
    vehicleId: 'veh-snvi-01',
    registrationPlate: '00123-116-16',
    makeModel: 'SNVI K 120 4x2',
    category: AssetCategory.HEAVY_TRUCK_RIGID,
    maxPayloadTons: 26,
    grossVehicleWeightTons: 32,
    fuelType: 'DIESEL',
    refConsumptionL100Km: 34.0,
    hasWorkingReefer: false,
    hasWorkingPto: false,
    currentWilayaCode: 16,
    currentLat: 36.73,
    currentLon: 3.28,
    currentOdometerKm: 165000,
    currentEngineHours: 3900,
    annualTargetKm: 100000,
    ytdDrivenKm: 52000,
    vehicleHealthIndex: 88,
    batterySohPct: 85,
    coolingEwmaResidualC: 1.5,
    dispatchStatus: DispatchStatus.AVAILABLE,
    documents: [
      {
        docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
        docNumber: 'ENACTA-ALGER-2026-789',
        issuedAt: '2026-07-01',
        expiresAt: '2026-12-31',
      },
      {
        docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT,
        docNumber: 'SAA-POL-2026-99',
        issuedAt: '2026-01-01',
        expiresAt: '2026-12-31',
      },
      {
        docType: DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
        docNumber: 'VIG-DGI-2026-16',
        issuedAt: '2026-01-01',
        expiresAt: '2026-12-31',
      },
      {
        docType: DocumentTypeDZ.AUTORISATION_CIRCULATION_MARCHANDISES,
        docNumber: 'DIR-TRANSPORTS-16-044',
        issuedAt: '2026-01-01',
        expiresAt: '2026-12-31',
      },
      {
        docType: DocumentTypeDZ.CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE,
        docNumber: 'CHRONO-CAL-2026',
        issuedAt: '2026-01-01',
        expiresAt: '2026-12-31',
      },
    ],
    subsystemRuls: [
      {
        taskCode: 'OIL_CHANGE_SYNTH',
        taskName: 'Vidange huile moteur Naftalia',
        subsystem: 'Moteur',
        wearRatioPct: 45,
        rulKm: 12000,
        rulEngineHours: 320,
        rulDays: 60,
        isCriticalSafety: true,
      },
      {
        taskCode: 'BRAKE_PADS_FRONT',
        taskName: 'Plaquettes freins AV',
        subsystem: 'Freinage',
        wearRatioPct: 40,
        rulKm: 15000,
        rulEngineHours: 400,
        rulDays: 90,
        isCriticalSafety: true,
      },
    ],
    activeDtcs: [],
    ...overrides,
  });

  const createDriver = (overrides: Partial<DriverStateDto> = {}): DriverStateDto => ({
    driverId: 'drv-mourad-01',
    fullName: 'Mourad Benali',
    phoneDz: '+213 555 12 34 56',
    licenseCategories: [LicenseCategoryDZ.B, LicenseCategoryDZ.C1, LicenseCategoryDZ.C2],
    hasBrevetProfessionnel: true,
    hasAdrHazmatCert: false,
    currentWilayaCode: 16,
    continuousDrivingHours: 1.5,
    dailyDrivingHoursToday: 3.0,
    restHoursLast24h: 12.0,
    safetyScore: 92,
    isAvailable: true,
    ...overrides,
  });

  describe('1. Tâche 4.1 : Matrice Réglementaire Algérienne Opposable (ENACTA, DGI, Wilayas)', () => {
    it('devrait valider la périodicité ENACTA semestrielle (6 mois) pour les Poids Lourds vs annuelle (12 mois) pour les VUL', () => {
      expect(ENACTA_REGULATORY_MATRIX[EnactaVehicleCategory.HEAVY_TRUCK_RIGID].periodicityMonths).toBe(6);
      expect(ENACTA_REGULATORY_MATRIX[EnactaVehicleCategory.TRACTOR_TRAILER].periodicityMonths).toBe(6);
      expect(ENACTA_REGULATORY_MATRIX[EnactaVehicleCategory.HAZMAT_TANKER].periodicityMonths).toBe(6);
      expect(ENACTA_REGULATORY_MATRIX[EnactaVehicleCategory.COMMERCIAL_VAN_VUL].periodicityMonths).toBe(12);
    });

    it('devrait déclencher les alertes préventives ENACTA au calendrier légal (J-30, J-15, J-7, J-0)', () => {
      const v = createVehicle({
        documents: [
          {
            docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
            docNumber: 'ENACTA-789',
            issuedAt: '2026-05-01',
            expiresAt: '2026-11-05', // Expire dans 6 jours par rapport au 2026-10-30
          },
        ],
      });

      const alertJ7 = regGate.evaluateEnactaAlertStatus(v, '2026-10-30T08:00:00Z');
      expect(alertJ7.alertLevel).toBe('ALERT_J7');
      expect(alertJ7.isBlocked).toBe(false);
      expect(alertJ7.daysUntilExpiry).toBe(6);
      expect(alertJ7.actionRequiredFr).toContain('Alerte J-7');
      expect(alertJ7.actionRequiredAr).toContain('تنبيه 7 أيام');

      const alertExpired = regGate.evaluateEnactaAlertStatus(v, '2026-11-10T08:00:00Z');
      expect(alertExpired.alertLevel).toBe('EXPIRED');
      expect(alertExpired.isBlocked).toBe(true);
      expect(alertExpired.daysUntilExpiry).toBeLessThanOrEqual(0);
      expect(alertExpired.actionRequiredFr).toContain('BLOCKED_REGULATORY');
    });

    it('devrait bloquer le dispatch si le contrôle ENACTA expire avant la fin de mission (+72h marge)', () => {
      const expiringVehicle = createVehicle({
        documents: [
          {
            docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
            docNumber: 'ENACTA-EXPIRING-SOON',
            issuedAt: '2026-05-01',
            expiresAt: '2026-10-31', // Expire le 31 octobre alors que la mission se termine le 30 + 72h = 2 novembre
          },
          {
            docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT,
            docNumber: 'SAA-99',
            issuedAt: '2026-01-01',
            expiresAt: '2026-12-31',
          },
          {
            docType: DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
            docNumber: 'VIG-16',
            issuedAt: '2026-01-01',
            expiresAt: '2026-12-31',
          },
        ],
      });

      const violations = regGate.evaluateVehicleRegulatoryCompliance(expiringVehicle, baseMission);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((violation) => violation.code.includes('ENACTA'))).toBe(true);
      expect(violations.some((violation) => violation.severity === 'HARD_BLOCK')).toBe(true);
    });

    it('devrait bloquer un chauffeur professionnel dépourvu du Brevet Professionnel (BPC Décret 16-235)', () => {
      const driverWithoutBpc = createDriver({ hasBrevetProfessionnel: false });
      const heavyVehicle = createVehicle();

      const violations = regGate.evaluateDriverCompliance(
        driverWithoutBpc,
        heavyVehicle,
        baseMission,
      );
      expect(violations.some((violation) => violation.code === 'MISSING_BREVET_PROFESSIONNEL')).toBe(true);
    });

    it('devrait bloquer un chauffeur dépassant le temps de conduite continu légal (4h30)', () => {
      const exhaustedDriver = createDriver({ continuousDrivingHours: 4.8 });
      const heavyVehicle = createVehicle();

      const violations = regGate.evaluateDriverCompliance(
        exhaustedDriver,
        heavyVehicle,
        baseMission,
      );
      expect(violations.some((violation) => violation.code === 'DRIVER_CONTINUOUS_DRIVING_EXCEEDED')).toBe(true);
    });

    it('devrait détecter la restriction de tonnage dans le Grand Alger et avancer l heure de départ (ETD)', () => {
      const heavyVehicle = createVehicle({ grossVehicleWeightTons: 32 }); // > 5.5T
      const missionInRushHour: MissionRequestDto = {
        ...baseMission,
        plannedDepartureUtc: '2026-10-30T07:30:00Z', // Pleine heure de pointe à Alger (06h30 - 09h30)
      };

      const wilayaCheck = regGate.evaluateWilayaRestrictions(heavyVehicle, missionInRushHour);
      expect(wilayaCheck.avoidPolygons.length).toBeGreaterThan(0);
      expect(wilayaCheck.advisoryNotes.some((note) => note.includes('Alger') && note.includes('Rocade'))).toBe(true);
      expect(wilayaCheck.recommendedEtdUtc).not.toBe(missionInRushHour.plannedDepartureUtc);
    });
  });

  describe('2. Tâche 4.2 : Moteur d Arbitrage Économique en Dinars (Coût d Action vs Risque d Inaction)', () => {
    it('devrait calculer la probabilité de panne P_panne(d_mission) en fonction du VHI et du résidu thermique', () => {
      // Cas sain : VHI 85, résidu thermique normal
      const pHealthy = computeFailureProbability(85, 850, ClimateZoneDZType.TELL_URBAN, 1.0, 90);
      expect(pHealthy).toBeLessThanOrEqual(0.15);

      // Cas dégradé saharien : VHI 55, résidu thermique anormal (+9.5°C)
      const pDegradedSahara = computeFailureProbability(
        55,
        850,
        ClimateZoneDZType.SAHARA_SOUTH,
        9.5,
        70,
      );
      expect(pDegradedSahara).toBeGreaterThan(0.50);
    });

    it('devrait appliquer le barème de remorquage lourd spécifique à la zone géographique (Grand Sud vs Tell)', () => {
      expect(REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.SAHARA_SOUTH]).toBe(150000);
      expect(REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.TELL_URBAN]).toBe(35000);
      expect(REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.HIGH_PLATEAUS]).toBe(65000);
    });

    it('devrait calculer l espérance mathématique de perte en DZD et l économie nette (SAD -> ADS)', () => {
      const atRiskVehicle = createVehicle({
        vehicleHealthIndex: 58,
        coolingEwmaResidualC: 9.2, // Alerte radiateur / culasse
      });

      const decision = arbitrageService.evaluateArbitrage(atRiskVehicle, baseMission, {
        hourlyLaborRateDzd: 1500,
        clientPenaltyPerHourDzd: 15000,
      });

      // Vérification des composantes financières
      expect(decision.inactionRisk.failureProbability).toBeGreaterThan(0.50);
      expect(decision.inactionRisk.totalInactionRiskDzd).toBeGreaterThan(200000);
      expect(decision.preventiveAction.totalPreventiveActionCostDzd).toBeLessThan(35000);
      expect(decision.netExpectedSavingsDzd).toBeGreaterThan(150000);
      expect(decision.roiRatio).toBeGreaterThan(5.0);
      expect(decision.decisionRecommendation).toBe('PROCEED_PREVENTIVE_MAINTENANCE');

      // Preuve explicable (XAI) bilingue FR/AR
      expect(decision.executiveSummaryFr).toContain('Arbitrage Économique DZD');
      expect(decision.executiveSummaryFr).toContain('DZD');
      expect(decision.executiveSummaryAr).toContain('القرار الاقتصادي بالدينار الجزائري');
      expect(decision.executiveSummaryAr).toContain('دج');
    });

    it('devrait utiliser les prix réels des carburants Naftal officiels JORADP sans constante inventée', () => {
      expect(NAFTAL_FUEL_PRICES_DZD.GASOIL).toBe(29.01);
      expect(NAFTAL_FUEL_PRICES_DZD.ESSENCE_SANS_PLOMB).toBe(45.97);
      expect(NAFTAL_FUEL_PRICES_DZD.SIRGHAZ_GPL).toBe(9.00);
    });
  });

  describe('3. Tâche 4.3 : Verrouillage du Dispatch & Ordre de Mission (OM) Réglementaire', () => {
    it('devrait verrouiller en BLOCKED_SAFETY un véhicule avec VHI < 50 ou surchauffe critique', () => {
      const unsafeVehicle = createVehicle({
        vehicleHealthIndex: 42, // < 50
        coolingEwmaResidualC: 12.0, // Surchauffe critique
      });

      const dispatchStatus = missionOrderService.evaluateDispatchStatus(unsafeVehicle, baseMission);
      expect(dispatchStatus.status).toBe(DispatchStatus.BLOCKED_SAFETY);
    });

    it('devrait verrouiller en BLOCKED_REGULATORY un véhicule avec ENACTA ou assurance invalide', () => {
      const nonCompliantVehicle = createVehicle({
        documents: [], // Aucun document
      });

      const dispatchStatus = missionOrderService.evaluateDispatchStatus(
        nonCompliantVehicle,
        baseMission,
      );
      expect(dispatchStatus.status).toBe(DispatchStatus.BLOCKED_REGULATORY);
    });

    it('devrait générer un Ordre de Mission officiel bilingue avec signature HMAC-SHA256 hors-ligne', () => {
      const readyVehicle = createVehicle();
      const readyDriver = createDriver();

      const om = missionOrderService.issueRegulatoryMissionOrder({
        mission: baseMission,
        vehicle: readyVehicle,
        driver: readyDriver,
      });

      expect(om.orderNumber).toMatch(/^OM-2026-\d{6}$/);
      expect(om.companyInfo.nif).toBe('001616012345678');
      expect(om.vehicle.registrationPlate).toBe('00123-116-16');
      expect(om.driver.fullName).toBe('Mourad Benali');
      expect(om.offlineSignatureToken).toBeDefined();
      expect(om.offlineSignatureToken.length).toBe(64); // SHA-256 hex string
      expect(om.qrVerificationPayload).toContain('DZOM|');
    });

    it('devrait vérifier et certifier l authenticité hors-ligne d un Ordre de Mission (Gendarmerie / DGSN)', () => {
      const readyVehicle = createVehicle();
      const readyDriver = createDriver();

      const om = missionOrderService.issueRegulatoryMissionOrder({
        mission: baseMission,
        vehicle: readyVehicle,
        driver: readyDriver,
      });

      // 1. Vérification avec token légitime -> VALID
      const resultValid = missionOrderService.verifyMissionOrderOfflineToken(
        om.qrVerificationPayload,
        om.offlineSignatureToken,
      );
      expect(resultValid.isValid).toBe(true);
      expect(resultValid.status).toBe('VALID');
      expect(resultValid.decodedOrder?.registrationPlate).toBe('00123-116-16');

      // 2. Vérification avec token falsifié -> TAMPERED
      const fakeToken = 'a'.repeat(64);
      const resultTampered = missionOrderService.verifyMissionOrderOfflineToken(
        om.qrVerificationPayload,
        fakeToken,
      );
      expect(resultTampered.isValid).toBe(false);
      expect(resultTampered.status).toBe('TAMPERED');

      // 3. Vérification avec payload expiré -> EXPIRED
      const expiredPayload = om.qrVerificationPayload.replace(/\d{4}-\d{2}-\d{2}/, '2025-01-01');
      const validSignatureForExpired = missionOrderService.signPayload(expiredPayload);
      const resultExpired = missionOrderService.verifyMissionOrderOfflineToken(
        expiredPayload,
        validSignatureForExpired,
      );
      expect(resultExpired.isValid).toBe(false);
      expect(resultExpired.status).toBe('EXPIRED');
    });
  });

  describe('4. Tâche 4.4 : Algorithme Multicritère TOPSIS de Substitution de Véhicule', () => {
    it('devrait éliminer les véhicules non conformes (I_Legal=0, I_Capacite=0, I_RUL=0)', () => {
      const missionPayload25T: MissionRequestDto = {
        ...baseMission,
        requiredPayloadTons: 25,
      };

      const smallVan = createVehicle({
        vehicleId: 'veh-van-01',
        registrationPlate: '00444-116-16',
        category: AssetCategory.VAN,
        maxPayloadTons: 1.5, // Insuffisant (< 25T) -> I_Capacite = 0
      });

      const expiredTruck = createVehicle({
        vehicleId: 'veh-expired-01',
        registrationPlate: '00555-116-16',
        documents: [], // I_Legal = 0
      });

      const validTruck = createVehicle({
        vehicleId: 'veh-valid-01',
        registrationPlate: '00888-116-16',
        maxPayloadTons: 28,
        vehicleHealthIndex: 90,
      });

      const driver = createDriver();

      const substitutions = optimizer.findOptimalSubstitutions(
        missionPayload25T,
        [smallVan, expiredTruck, validTruck],
        [driver],
      );

      expect(substitutions.length).toBe(1);
      expect(substitutions[0].vehicleId).toBe('veh-valid-01');
      expect(substitutions[0].auditJustification).toContain('100% Conforme');
    });

    it('devrait classer les candidats valides selon les poids multicritères (VHI, TCO Naftal, Approche, Équilibrage)', () => {
      const truckA = createVehicle({
        vehicleId: 'veh-candidate-A',
        registrationPlate: '01001-116-16',
        vehicleHealthIndex: 95,
        refConsumptionL100Km: 32.0,
        currentLat: 36.73, // Sur place (0 km d approche)
        currentLon: 3.28,
      });

      const truckB = createVehicle({
        vehicleId: 'veh-candidate-B',
        registrationPlate: '01002-116-16',
        vehicleHealthIndex: 78,
        refConsumptionL100Km: 40.0,
        currentLat: 36.45, // À ~40 km d approche
        currentLon: 3.05,
      });

      const driver = createDriver();

      const substitutions = optimizer.findOptimalSubstitutions(
        baseMission,
        [truckB, truckA],
        [driver],
      );

      expect(substitutions.length).toBe(2);
      expect(substitutions[0].vehicleId).toBe('veh-candidate-A');
      expect(substitutions[0].totalScore100).toBeGreaterThan(substitutions[1].totalScore100);
      expect(substitutions[0].estimatedFuelCostDzd).toBeLessThan(substitutions[1].estimatedFuelCostDzd);
    });
  });
});

