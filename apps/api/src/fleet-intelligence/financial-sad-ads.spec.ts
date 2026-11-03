import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
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
  let module: TestingModule;
  let regGate: AlgerianRegulatoryGateService;
  let optimizer: SubstitutionOptimizerService;
  let arbitrageService: FinancialArbitrageService;
  let missionOrderService: RegulatoryMissionOrderService;

  // 1. Horloge figée déterministe (Heure d'Alger UTC+1, 30 Octobre 2026 08:00)
  const NOW = new Date('2026-10-30T08:00:00+01:00');

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
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

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  // Calculateur de date relative invariant dans le temps
  const inDays = (n: number) =>
    new Date(NOW.getTime() + n * 86_400_000).toISOString().slice(0, 10);

  // Factory pure de Mission : Convoi Alger (Rouïba) -> Hassi Messaoud (Bassin Pétrolier)
  const createMission = (overrides: Partial<MissionRequestDto> = {}): MissionRequestDto => ({
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
    plannedDepartureUtc: NOW.toISOString(),
    routeDistanceKm: 850,
    estimatedDrivingHours: 12,
    requiredPayloadTons: 24,
    targetClimateZone: ClimateZoneDZ.SAHARA_SOUTH,
    requiresReeferColdChain: false,
    requiresHazmatAdr: false,
    requiresPtoHydraulics: false,
    ...overrides,
  });

  // Factory pure de Véhicule : Camion Lourd SNVI (Plaque réaliste 00123-216-16, code 2 = transport de marchandises)
  const createVehicle = (overrides: Partial<VehicleStateDto> = {}): VehicleStateDto => ({
    vehicleId: 'veh-snvi-01',
    tenantId: 'tenant-dz-sonatrach-logistics',
    registrationPlate: '00123-216-16',
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
        issuedAt: inDays(-90),
        expiresAt: inDays(90),
      },
      {
        docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT,
        docNumber: 'SAA-POL-2026-99',
        issuedAt: inDays(-180),
        expiresAt: inDays(185),
      },
      {
        docType: DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
        docNumber: 'VIG-DGI-2026-16',
        issuedAt: inDays(-180),
        expiresAt: inDays(185),
      },
      {
        docType: DocumentTypeDZ.AUTORISATION_CIRCULATION_MARCHANDISES,
        docNumber: 'DIR-TRANSPORTS-16-044',
        issuedAt: inDays(-180),
        expiresAt: inDays(185),
      },
      {
        docType: DocumentTypeDZ.CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE,
        docNumber: 'CHRONO-CAL-2026',
        issuedAt: inDays(-180),
        expiresAt: inDays(185),
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

  // Factory pure de Conducteur
  const createDriver = (overrides: Partial<DriverStateDto> = {}): DriverStateDto => ({
    driverId: 'drv-mourad-01',
    tenantId: 'tenant-dz-sonatrach-logistics',
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

    // Test paramétré sur toutes les bornes du calendrier d'alerte ENACTA
    it.each([
      { offsetDays: 45, expectedAlert: 'OK', expectedBlocked: false },
      { offsetDays: 31, expectedAlert: 'OK', expectedBlocked: false },
      { offsetDays: 30, expectedAlert: 'ALERT_J30', expectedBlocked: false },
      { offsetDays: 16, expectedAlert: 'ALERT_J30', expectedBlocked: false },
      { offsetDays: 15, expectedAlert: 'ALERT_J15', expectedBlocked: false },
      { offsetDays: 8, expectedAlert: 'ALERT_J15', expectedBlocked: false },
      { offsetDays: 7, expectedAlert: 'ALERT_J7', expectedBlocked: false },
      { offsetDays: 1, expectedAlert: 'ALERT_J7', expectedBlocked: false },
      { offsetDays: 0, expectedAlert: 'EXPIRED', expectedBlocked: true },
      { offsetDays: -1, expectedAlert: 'EXPIRED', expectedBlocked: true },
    ])(
      'devrait classifier correctement l alerte ENACTA à J+$offsetDays ($expectedAlert)',
      ({ offsetDays, expectedAlert, expectedBlocked }) => {
        const vehicle = createVehicle({
          documents: [
            {
              docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
              docNumber: 'ENACTA-TEST',
              issuedAt: inDays(-120),
              expiresAt: inDays(offsetDays),
            },
          ],
        });

        const alertStatus = regGate.evaluateEnactaAlertStatus(vehicle, NOW.toISOString());
        expect(alertStatus.alertLevel).toBe(expectedAlert);
        expect(alertStatus.isBlocked).toBe(expectedBlocked);
        expect(Math.abs(alertStatus.daysUntilExpiry)).toBe(Math.abs(offsetDays));
      },
    );

    it('devrait bloquer le dispatch si le contrôle ENACTA expire avant la fin sécurisée de mission (+72h marge)', () => {
      // Mission : départ NOW, 12h conduite + 72h marge = fin sécurisée dans 3.5 jours (inDays(3.5))
      // ENACTA expirant à inDays(2) -> expire AVANT la fin sécurisée -> BLOCKED_REGULATORY prouvé
      const expiringVehicle = createVehicle({
        documents: [
          {
            docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
            docNumber: 'ENACTA-EXPIRING-SOON',
            issuedAt: inDays(-120),
            expiresAt: inDays(2), // Expire dans 2 jours (avant la fin de mission dans 3.5 jours)
          },
          {
            docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT,
            docNumber: 'SAA-99',
            issuedAt: inDays(-90),
            expiresAt: inDays(90),
          },
          {
            docType: DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
            docNumber: 'VIG-16',
            issuedAt: inDays(-90),
            expiresAt: inDays(90),
          },
          {
            docType: DocumentTypeDZ.AUTORISATION_CIRCULATION_MARCHANDISES,
            docNumber: 'ACM-16',
            issuedAt: inDays(-90),
            expiresAt: inDays(90),
          },
          {
            docType: DocumentTypeDZ.CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE,
            docNumber: 'CHRONO-16',
            issuedAt: inDays(-90),
            expiresAt: inDays(90),
          },
        ],
      });

      const mission = createMission();
      const violations = regGate.evaluateVehicleRegulatoryCompliance(expiringVehicle, mission);

      expect(violations).toContainEqual(
        expect.objectContaining({
          code: expect.stringContaining('ENACTA'),
          severity: 'HARD_BLOCK',
        }),
      );
    });

    it('devrait bloquer un chauffeur professionnel dépourvu du Brevet Professionnel (BPC Décret 16-235)', () => {
      const driverWithoutBpc = createDriver({ hasBrevetProfessionnel: false });
      const heavyVehicle = createVehicle();

      const violations = regGate.evaluateDriverCompliance(
        driverWithoutBpc,
        heavyVehicle,
        createMission(),
      );
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_BREVET_PROFESSIONNEL',
          severity: 'HARD_BLOCK',
        }),
      );
    });

    it('devrait bloquer un chauffeur sur mission ADR s il n a pas le certificat matières dangereuses', () => {
      const driverNoAdr = createDriver({ hasAdrHazmatCert: false });
      const hazmatMission = createMission({ requiresHazmatAdr: true });
      const heavyVehicle = createVehicle();

      const violations = regGate.evaluateDriverCompliance(driverNoAdr, heavyVehicle, hazmatMission);
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_DRIVER_ADR_CERT',
          severity: 'HARD_BLOCK',
        }),
      );
    });

    it('devrait bloquer un chauffeur si le permis ne correspond pas au PTAC du véhicule', () => {
      // Camion lourd de 32T (exige permis C2) avec chauffeur n ayant que le permis C1 (max 19T)
      const driverC1Only = createDriver({ licenseCategories: [LicenseCategoryDZ.B, LicenseCategoryDZ.C1] });
      const heavyVehicle32T = createVehicle({ grossVehicleWeightTons: 32.0 });

      const violations = regGate.evaluateDriverCompliance(driverC1Only, heavyVehicle32T, createMission());
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'DRIVER_LICENSE_MISMATCH',
          severity: 'HARD_BLOCK',
        }),
      );
    });

    it('devrait bloquer un chauffeur dépassant le temps de conduite continu légal (4h30)', () => {
      const exhaustedDriver = createDriver({ continuousDrivingHours: 4.8 });
      const heavyVehicle = createVehicle();

      const violations = regGate.evaluateDriverCompliance(
        exhaustedDriver,
        heavyVehicle,
        createMission(),
      );
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'DRIVER_CONTINUOUS_DRIVING_EXCEEDED',
          severity: 'HARD_BLOCK',
        }),
      );
    });

    it('devrait bloquer un véhicule en mission chaîne du froid si le groupe frigorifique est absent ou en panne', () => {
      const reeferMission = createMission({ requiresReeferColdChain: true });
      const brokenReeferVehicle = createVehicle({ hasWorkingReefer: false });

      const violations = regGate.evaluatePredictiveAndTechnicalReadiness(brokenReeferVehicle, reeferMission);
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_WORKING_REEFER',
          severity: 'HARD_BLOCK',
        }),
      );
    });

    it('devrait détecter la restriction de tonnage dans le Grand Alger et avancer l heure de départ (ETD)', () => {
      const heavyVehicle = createVehicle({ grossVehicleWeightTons: 32 }); // > 5.5T
      const missionInRushHour = createMission({
        plannedDepartureUtc: '2026-10-30T07:30:00Z', // Pleine heure de pointe à Alger (06h30 - 09h30)
      });

      const wilayaCheck = regGate.evaluateWilayaRestrictions(heavyVehicle, missionInRushHour);
      expect(wilayaCheck.avoidPolygons.length).toBeGreaterThan(0);
      expect(wilayaCheck.advisoryNotes.some((note) => note.includes('Alger') && note.includes('Rocade'))).toBe(true);
      expect(wilayaCheck.recommendedEtdUtc).not.toBe(missionInRushHour.plannedDepartureUtc);
    });
  });

  describe('2. Tâche 4.2 : Moteur d Arbitrage Économique en Dinars (Coût d Action vs Risque d Inaction)', () => {
    it('devrait calculer la probabilité de panne P_panne(d_mission) en fonction du VHI et du résidu thermique', () => {
      const pHealthy = computeFailureProbability(85, 850, ClimateZoneDZType.TELL_URBAN, 1.0, 90);
      expect(pHealthy).toBeLessThanOrEqual(0.15);

      const pDegradedSahara = computeFailureProbability(
        55,
        850,
        ClimateZoneDZType.SAHARA_SOUTH,
        9.5,
        70,
      );
      expect(pDegradedSahara).toBeGreaterThan(0.50);
    });

    it('devrait appliquer le barème de remorquage lourd croissant selon la sévérité géographique', () => {
      expect(REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.SAHARA_SOUTH]).toBe(150000);
      expect(REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.HIGH_PLATEAUS]).toBe(65000);
      expect(REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.TELL_URBAN]).toBe(35000);
      expect(REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.SAHARA_SOUTH]).toBeGreaterThan(
        REGIONAL_TOWING_RATES_DZD[ClimateZoneDZType.HIGH_PLATEAUS],
      );
    });

    it('devrait calculer l espérance mathématique de perte en DZD et l économie nette (SAD -> ADS)', () => {
      const atRiskVehicle = createVehicle({
        vehicleHealthIndex: 58,
        coolingEwmaResidualC: 9.2,
      });

      const decision = arbitrageService.evaluateArbitrage(atRiskVehicle, createMission(), {
        hourlyLaborRateDzd: 1500,
        clientPenaltyPerHourDzd: 15000,
      });

      expect(decision.inactionRisk.failureProbability).toBeGreaterThan(0.50);
      expect(decision.inactionRisk.totalInactionRiskDzd).toBeGreaterThan(200000);
      expect(decision.preventiveAction.totalPreventiveActionCostDzd).toBeLessThan(35000);
      expect(decision.netExpectedSavingsDzd).toBeGreaterThan(150000);
      expect(decision.roiRatio).toBeGreaterThan(5.0);
      expect(decision.decisionRecommendation).toBe('PROCEED_PREVENTIVE_MAINTENANCE');

      expect(decision.executiveSummaryFr).toContain('Arbitrage Économique DZD');
      expect(decision.executiveSummaryFr).toContain('DZD');
      expect(decision.executiveSummaryAr).toContain('القرار الاقتصادي بالدينار الجزائري');
    });

    it('devrait recommander MONITOR_NO_ACTION si le ratio ROI est inférieur à 1.0', () => {
      // Véhicule parfaitement sain (VHI 98, résidu 0), risque minime < coût d intervention
      const pristineVehicle = createVehicle({
        vehicleHealthIndex: 98,
        coolingEwmaResidualC: 0.1,
      });

      const decision = arbitrageService.evaluateArbitrage(pristineVehicle, createMission({ routeDistanceKm: 100 }), {
        hourlyLaborRateDzd: 5000,
      });

      expect(decision.roiRatio).toBeLessThan(1.0);
      expect(decision.decisionRecommendation).toBe('AUTHORIZE_MISSION_WITH_MONITORING');
    });

    it('devrait concorder exactement entre le service NestJS et la fonction pure evaluateFinancialArbitrageDzd', () => {
      const testVehicle = createVehicle({ vehicleHealthIndex: 72 });
      const mission = createMission();

      const serviceDecision = arbitrageService.evaluateArbitrage(testVehicle, mission);
      const pureDecision = evaluateFinancialArbitrageDzd(
        {
          missionDistanceKm: mission.routeDistanceKm,
          climateZone: ClimateZoneDZType.SAHARA_SOUTH,
          vehicleCategory: testVehicle.category,
          vehicleHealthIndex: testVehicle.vehicleHealthIndex,
          coolingResidualC: testVehicle.coolingEwmaResidualC,
          batterySohPct: testVehicle.batterySohPct,
          oilDegradationRatio: 0.5,
          brakeWearRatio: 0.4,
        },
        testVehicle.vehicleId,
        mission.missionId,
      );

      expect(serviceDecision.netExpectedSavingsDzd).toBe(pureDecision.netExpectedSavingsDzd);
      expect(serviceDecision.roiRatio).toBe(pureDecision.roiRatio);
    });

    it('devrait vérifier que le catalogue de défaillances prédictives est complet et cohérent', () => {
      const failureModes = Object.values(PREDICTIVE_FAILURE_MODES_CATALOG);
      expect(failureModes.length).toBeGreaterThan(0);
      for (const mode of failureModes) {
        expect(mode.code).toBeDefined();
        expect(mode.costPartsDzd).toBeGreaterThan(0);
        expect(mode.laborHours).toBeGreaterThan(0);
        expect(mode.downtimeDays).toBeGreaterThan(0);
      }
    });

    it('devrait utiliser les prix officiels Naftal en vigueur en Algérie', () => {
      expect(NAFTAL_FUEL_PRICES_DZD.GASOIL).toBe(31.00);
      expect(NAFTAL_FUEL_PRICES_DZD.ESSENCE_SANS_PLOMB).toBe(47.00);
      expect(NAFTAL_FUEL_PRICES_DZD.SIRGHAZ_GPL).toBe(12.00);
    });
  });

  describe('3. Tâche 4.3 : Verrouillage du Dispatch & Ordre de Mission (OM) Réglementaire Asymétrique Ed25519', () => {
    it('devrait verrouiller en BLOCKED_SAFETY un véhicule avec VHI < 50 ou surchauffe critique', () => {
      const unsafeVehicle = createVehicle({
        vehicleHealthIndex: 49.9, // Borne stricte < 50
        coolingEwmaResidualC: 12.0,
      });

      const dispatchStatus = missionOrderService.evaluateDispatchStatus(unsafeVehicle, createMission());
      expect(dispatchStatus.status).toBe(DispatchStatus.BLOCKED_SAFETY);
    });

    it('devrait donner priorité à BLOCKED_REGULATORY si des violations légales et de sécurité coexistent', () => {
      const doublyViolatingVehicle = createVehicle({
        vehicleHealthIndex: 30.0, // BLOCKED_SAFETY
        documents: [],            // BLOCKED_REGULATORY
      });

      const dispatchStatus = missionOrderService.evaluateDispatchStatus(doublyViolatingVehicle, createMission());
      expect(dispatchStatus.status).toBe(DispatchStatus.BLOCKED_REGULATORY);
    });

    it('devrait refuser formellement d émettre un Ordre de Mission si le véhicule est bloqué', () => {
      const nonCompliantVehicle = createVehicle({ documents: [] });
      const readyDriver = createDriver();

      expect(() =>
        missionOrderService.issueRegulatoryMissionOrder({
          mission: createMission(),
          vehicle: nonCompliantVehicle,
          driver: readyDriver,
        }),
      ).toThrow(/Impossible d émettre un Ordre de Mission/);
    });

    it('devrait refuser formellement d émettre un Ordre de Mission si le conducteur est non conforme', () => {
      const readyVehicle = createVehicle();
      const nonCompliantDriver = createDriver({ hasBrevetProfessionnel: false });

      expect(() =>
        missionOrderService.issueRegulatoryMissionOrder({
          mission: createMission(),
          vehicle: readyVehicle,
          driver: nonCompliantDriver,
        }),
      ).toThrow(/Le conducteur Mourad Benali n est pas conforme/);
    });

    it('devrait générer un Ordre de Mission avec signature asymétrique Ed25519 vérifiable hors-ligne', () => {
      const readyVehicle = createVehicle();
      const readyDriver = createDriver();

      const om = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission(),
        vehicle: readyVehicle,
        driver: readyDriver,
      });

      expect(om.orderNumber).toMatch(/^OM-\d{4}-\d{6}$/);
      expect(om.vehicle.registrationPlate).toBe('00123-216-16');
      expect(om.driver.fullName).toBe('Mourad Benali');
      expect(om.offlineSignatureToken).toBeDefined();
      expect(om.offlineSignatureToken.length).toBe(128); // Signature Ed25519 (64 octets = 128 hex chars)
      expect(om.qrVerificationPayload).toContain('DZOM|');

      // Vérification asymétrique réussie
      const resultValid = missionOrderService.verifyMissionOrderOfflineToken(
        om.qrVerificationPayload,
        om.offlineSignatureToken,
      );
      expect(resultValid.isValid).toBe(true);
      expect(resultValid.status).toBe('VALID');
      expect(resultValid.decodedOrder?.registrationPlate).toBe('00123-216-16');
      expect(resultValid.decodedOrder?.jti).toBeDefined();
      expect(resultValid.decodedOrder?.kid).toBeDefined();
    });

    it('devrait détecter l expiration temporelle naturelle par avance d horloge système', () => {
      const om = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission(),
        vehicle: createVehicle(),
        driver: createDriver(),
      });

      // Avance du temps de 15 jours dans le futur (au-delà de la validité de l OM)
      jest.setSystemTime(new Date(NOW.getTime() + 15 * 86_400_000));

      const resultExpired = missionOrderService.verifyMissionOrderOfflineToken(
        om.qrVerificationPayload,
        om.offlineSignatureToken,
      );
      expect(resultExpired.isValid).toBe(false);
      expect(resultExpired.status).toBe('EXPIRED');
    });

    it('devrait rejeter en TAMPERED un Ordre de Mission dont le QR a été altéré (ex: fausse plaque)', () => {
      const om = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission(),
        vehicle: createVehicle(),
        driver: createDriver(),
      });

      // Falsification du payload QR (altération de la plaque en conservant la signature d origine)
      const tamperedQrPayload = om.qrVerificationPayload.replace('00123-216-16', '99999-216-16');

      const resultTampered = missionOrderService.verifyMissionOrderOfflineToken(
        tamperedQrPayload,
        om.offlineSignatureToken,
      );
      expect(resultTampered.isValid).toBe(false);
      expect(resultTampered.status).toBe('TAMPERED');
    });

    it('devrait rejeter en TAMPERED un jeton falsifié ou signé par une mauvaise clé', () => {
      const om = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission(),
        vehicle: createVehicle(),
        driver: createDriver(),
      });

      // Token hexadécimal invalide
      const forgedToken = 'f'.repeat(128);
      const resultForged = missionOrderService.verifyMissionOrderOfflineToken(
        om.qrVerificationPayload,
        forgedToken,
      );
      expect(resultForged.isValid).toBe(false);
      expect(resultForged.status).toBe('TAMPERED');

      // Vérification avec une clé publique étrangère (simulation ancienne/autre autorité)
      const foreignPair = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      const resultForeign = missionOrderService.verifyMissionOrderOfflineToken(
        om.qrVerificationPayload,
        om.offlineSignatureToken,
        foreignPair.publicKey,
      );
      expect(resultForeign.isValid).toBe(false);
      expect(resultForeign.status).toBe('TAMPERED');
    });

    it('devrait supporter l injection dynamique des coordonnées de l entreprise par tenant', () => {
      const omSonatrach = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission({ tenantId: 'tenant-sonatrach' }),
        vehicle: createVehicle(),
        driver: createDriver(),
        companyInfo: {
          legalName: 'SONATRACH SPA - DIRECTION LOGISTIQUE',
          nif: '000016001234567',
          nis: '00001600123',
          rcNumber: '16/00-9876543B01',
          aiNumber: '16009876543',
          headquartersWilayaCode: 16,
          headquartersWilayaName: 'Alger',
        },
      });

      const omNaftal = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission({ tenantId: 'tenant-naftal' }),
        vehicle: createVehicle(),
        driver: createDriver(),
        companyInfo: {
          legalName: 'NAFTAL SPA - CARBURANTS & LUBRIFIANTS',
          nif: '000016009999999',
          nis: '00001600999',
          rcNumber: '16/00-1111111B02',
          aiNumber: '16001111111',
          headquartersWilayaCode: 16,
          headquartersWilayaName: 'Alger',
        },
      });

      expect(omSonatrach.companyInfo.nif).toBe('000016001234567');
      expect(omNaftal.companyInfo.nif).toBe('000016009999999');
      expect(omSonatrach.companyInfo.legalName).toContain('SONATRACH');
      expect(omNaftal.companyInfo.legalName).toContain('NAFTAL');
    });

    it('devrait garantir l unicité des numéros d Ordre de Mission consécutifs', () => {
      const om1 = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission(),
        vehicle: createVehicle(),
        driver: createDriver(),
      });
      const om2 = missionOrderService.issueRegulatoryMissionOrder({
        mission: createMission(),
        vehicle: createVehicle(),
        driver: createDriver(),
      });

      expect(om1.orderNumber).not.toBe(om2.orderNumber);
    });
  });

  describe('4. Tâche 4.4 : Algorithme Multicritère TOPSIS de Substitution de Véhicule', () => {
    it('devrait éliminer les véhicules non conformes (I_Legal=0, I_Capacite=0, I_RUL=0)', () => {
      const missionPayload25T = createMission({ requiredPayloadTons: 25 });

      const smallVan = createVehicle({
        vehicleId: 'veh-van-01',
        registrationPlate: '00444-216-16',
        category: AssetCategory.VAN,
        maxPayloadTons: 1.5, // I_Capacite = 0
      });

      const expiredTruck = createVehicle({
        vehicleId: 'veh-expired-01',
        registrationPlate: '00555-216-16',
        documents: [], // I_Legal = 0
      });

      const exhaustedRulTruck = createVehicle({
        vehicleId: 'veh-low-rul-01',
        registrationPlate: '00666-216-16',
        subsystemRuls: [
          {
            taskCode: 'BRAKE_PADS_FRONT',
            taskName: 'Plaquettes freins AV',
            subsystem: 'Freinage',
            wearRatioPct: 95,
            rulKm: 200, // < 850 km requis pour la mission -> I_RUL = 0
            rulEngineHours: 5,
            rulDays: 1,
            isCriticalSafety: true,
          },
        ],
      });

      const validTruck = createVehicle({
        vehicleId: 'veh-valid-01',
        registrationPlate: '00888-216-16',
        maxPayloadTons: 28,
        vehicleHealthIndex: 90,
      });

      const driver = createDriver();

      const substitutions = optimizer.findOptimalSubstitutions(
        missionPayload25T,
        [smallVan, expiredTruck, exhaustedRulTruck, validTruck],
        [driver],
      );

      expect(substitutions.length).toBe(1);
      expect(substitutions[0].vehicleId).toBe('veh-valid-01');
      expect(substitutions[0].auditJustification).toContain('100% Conforme');
    });

    it('devrait respecter strictement l isolation multi-tenant (rejet des véhicules et chauffeurs d un autre tenant)', () => {
      const mission = createMission({ tenantId: 'tenant-sonatrach' });

      const foreignVehicle = createVehicle({
        vehicleId: 'veh-foreign-tenant',
        tenantId: 'tenant-autre-entreprise',
        vehicleHealthIndex: 99,
      });

      const foreignDriver = createDriver({
        driverId: 'drv-foreign-tenant',
        tenantId: 'tenant-autre-entreprise',
      });

      const sonatrachVehicle = createVehicle({
        vehicleId: 'veh-sonatrach-valid',
        tenantId: 'tenant-sonatrach',
        vehicleHealthIndex: 85,
      });

      const sonatrachDriver = createDriver({
        driverId: 'drv-sonatrach-valid',
        tenantId: 'tenant-sonatrach',
      });

      const substitutions = optimizer.findOptimalSubstitutions(
        mission,
        [foreignVehicle, sonatrachVehicle],
        [foreignDriver, sonatrachDriver],
      );

      expect(substitutions.length).toBe(1);
      expect(substitutions[0].vehicleId).toBe('veh-sonatrach-valid');
      expect(substitutions[0].driverId).toBe('drv-sonatrach-valid');
    });

    it('devrait retourner un tableau vide si aucun véhicule n est disponible ou si la flotte est vide', () => {
      const mission = createMission();
      expect(optimizer.findOptimalSubstitutions(mission, [], [createDriver()])).toEqual([]);

      const busyVehicle = createVehicle({ dispatchStatus: DispatchStatus.IN_MISSION });
      expect(optimizer.findOptimalSubstitutions(mission, [busyVehicle], [createDriver()])).toEqual([]);
    });

    it('devrait classer les candidats valides selon les poids multicritères (VHI, TCO Naftal, Approche, Équilibrage)', () => {
      const truckA = createVehicle({
        vehicleId: 'veh-candidate-A',
        registrationPlate: '01001-216-16',
        vehicleHealthIndex: 95,
        refConsumptionL100Km: 32.0,
        currentLat: 36.73, // Sur place (0 km d approche)
        currentLon: 3.28,
      });

      const truckB = createVehicle({
        vehicleId: 'veh-candidate-B',
        registrationPlate: '01002-216-16',
        vehicleHealthIndex: 78,
        refConsumptionL100Km: 40.0,
        currentLat: 36.45, // À ~40 km d approche
        currentLon: 3.05,
      });

      const driver = createDriver();

      const substitutions = optimizer.findOptimalSubstitutions(
        createMission(),
        [truckB, truckA],
        [driver],
      );

      expect(substitutions.length).toBe(2);
      expect(substitutions[0].vehicleId).toBe('veh-candidate-A');
      expect(substitutions[0].totalScore100).toBeGreaterThan(substitutions[1].totalScore100);
      expect(substitutions[0].estimatedFuelCostDzd).toBeLessThan(substitutions[1].estimatedFuelCostDzd);
      expect(substitutions[0].totalScore100).toBeLessThanOrEqual(100.0);
      expect(substitutions[1].totalScore100).toBeGreaterThanOrEqual(0.0);
    });
  });
});
