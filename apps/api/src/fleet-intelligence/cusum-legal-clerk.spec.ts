import * as crypto from 'crypto';
import {
  CusumLegalClerkService,
  FuelIncidentEvaluationInput,
} from './services/cusum-legal-clerk.service';
import { NAFTAL_FUEL_PRICES_DZD } from '@docteurflotte/contracts';

describe('Pilier 1 : Greffier Juridique CUSUM & Correction Topographique Valhalla (XAI & Pre-Computed Graph)', () => {
  let service: CusumLegalClerkService;
  const testSecret = 'docteurflotte-sovereign-cusum-secret-dz-2027'; // mock secret for tests

  beforeEach(() => {
    service = new CusumLegalClerkService();
  });

  describe('Tâche 1.1 : Détection Déterministe de Siphonnage Avéré sur la RN1 (Djelfa)', () => {
    const siphoningInput: FuelIncidentEvaluationInput = {
      eventId: 'EVT-CUSUM-TEST-DJELFA-01',
      vehicleId: 'veh-actros-00412',
      vehiclePlate: '00412-116-17',
      driverPseudonym: 'CHAUFFEUR_DZ_M982',
      timestamp: '2026-10-31T02:15:00Z',
      location: {
        latitude: 34.6728,
        longitude: 3.2514,
        wilayaCode: 17,
        wilayaName: 'Djelfa',
        roadName: 'RN1 Axe Nord-Sud (Pk 298)',
        roadGradePercent: 1.2, // Pente quasi-nulle sur le plateau des Hauts-Plateaux
      },
      telemetry: {
        speedKmh: 0,
        engineRpm: 0,
        ignitionOn: false,
        idleHoursToday: 0.5,
        durationStationarySeconds: 2400, // 40 minutes d'arrêt
      },
      fuelReading: {
        tankCapacityLiters: 450,
        rawLevelsLiters: [380.0, 375.0, 360.0, 341.5], // Chute de 38.5 Litres
        tankLengthMeters: 1.8,
        sensorOffsetRatio: 0.25,
      },
      context: {
        nearestNaftalStationKm: 28.4, // Loin de toute station
        hasLegitimateFuelReceipt: false,
        fuelUnitPriceDzd: NAFTAL_FUEL_PRICES_DZD.GASOIL, // 29.00 DZD
      },
    };

    it('doit construire un Pre-Computed Context Graph qualifié en SIPHONNAGE_AVÉRÉ avec indice de certitude >= 98%', () => {
      const graph = service.buildPreComputedGraph(siphoningInput);

      expect(graph.eventId).toBe('EVT-CUSUM-TEST-DJELFA-01');
      expect(graph.vehiclePlate).toBe('00412-116-17');
      expect(graph.environmentalEvidence.qualification).toBe('SIPHONNAGE_AVÉRÉ');
      expect(graph.environmentalEvidence.confidenceScore).toBeGreaterThanOrEqual(0.98);

      // Calculs mathématiques déterministes stricts
      expect(graph.fuelData.rawDropLiters).toBe(38.5);
      // Correction minime pour 1.2% de pente
      expect(graph.fuelData.slopeCorrectionLiters).toBeLessThan(6.0);
      expect(graph.fuelData.correctedNetDropLiters).toBeGreaterThan(32.0);
      expect(graph.fuelData.fuelPriceDzdPerLiter).toBe(NAFTAL_FUEL_PRICES_DZD.GASOIL);
      expect(graph.fuelData.directLossDzd).toBeCloseTo(graph.fuelData.correctedNetDropLiters * NAFTAL_FUEL_PRICES_DZD.GASOIL, 1);

      // Signature HMAC-SHA256 valide et reproductible
      const expectedPayload = `${graph.eventId}|${graph.vehiclePlate}|${graph.timestamp}|${graph.fuelData.rawDropLiters}|${graph.fuelData.correctedNetDropLiters}|${graph.fuelData.directLossDzd}|${graph.environmentalEvidence.qualification}`;
      const expectedHmac = crypto.createHmac('sha256', testSecret).update(expectedPayload).digest('hex');
      expect(graph.hmacSignature).toBe(expectedHmac);
    });

    it('doit rédiger un rapport juridique bilingue opposable (FR/AR) avec références légales algériennes (Art. 350 Code Pénal)', async () => {
      const report = await service.generateAuditReport(siphoningInput);

      expect(report.status).toBe('OPPOSABLE_DISCIPLINAIRE');
      expect(report.qualification).toBe('SIPHONNAGE_AVÉRÉ');
      expect(report.confidenceScore).toBeGreaterThanOrEqual(0.98);

      // Section Française
      expect(report.frenchReport.titre).toContain("PROCÈS-VERBAL DE CONSTAT D'ANOMALIE & DÉTOURNEMENT DE CARBURANT");
      expect(report.frenchReport.preambule).toContain('00412-116-17');
      expect(report.frenchReport.constatationsTechniques).toContain('Djelfa');
      expect(report.frenchReport.qualificationJuridique).toContain('Article 350 du Code Pénal algérien');
      expect(report.frenchReport.prejudiceFinancierDzd).toContain('31.00 DZD/L');
      expect(report.frenchReport.prejudiceFinancierDzd).toContain('DZD');
      expect(report.frenchReport.recommandationDecisionnelle).toContain('commission paritaire de discipline');

      // Section Arabe (محضر رسمي باللغة العربية)
      expect(report.arabicReport.titre).toContain('محضر معاينة وإثبات واقعة تفريغ غير مشروع للوقود');
      expect(report.arabicReport.preambule).toContain('00412-116-17');
      expect(report.arabicReport.constatationsTechniques).toContain('الجلفة');
      expect(report.arabicReport.qualificationJuridique).toContain('المادة 350 من قانون العقوبات الجزائري');
      expect(report.arabicReport.recommandationDecisionnelle).toContain('لجنة التأديب');
      expect(report.arabicReport.recommandationDecisionnelle).toContain('تجميد فوري لبطاقة التزود');

      // Sceau cryptographique global
      expect(report.hmacSignature).toHaveLength(64);
      expect(service.getReportById(report.reportId)).toBeDefined();
    });
  });

  describe('Tâche 1.2 : Élimination des Faux Positifs Topographiques (Gorges de la Chiffa / RN1)', () => {
    const steepSlopeInput: FuelIncidentEvaluationInput = {
      eventId: 'EVT-CUSUM-TEST-CHIFFA-02',
      vehicleId: 'veh-semi-00844',
      vehiclePlate: '00844-116-09',
      driverPseudonym: 'CHAUFFEUR_DZ_BLIDA',
      timestamp: '2026-10-31T08:30:00Z',
      location: {
        latitude: 36.3891,
        longitude: 2.7645,
        wilayaCode: 9,
        wilayaName: 'Blida',
        roadName: 'RN1 Traversée des Gorges de la Chiffa',
        roadGradePercent: 11.5, // Forte pente montagnarde de 11.5%
      },
      telemetry: {
        speedKmh: 0,
        engineRpm: 0,
        ignitionOn: false,
        durationStationarySeconds: 600, // Court arrêt de 10 minutes en montée
      },
      fuelReading: {
        tankCapacityLiters: 400,
        rawLevelsLiters: [300.0, 278.0], // Baisse apparente de 22.0 Litres
        tankLengthMeters: 1.6,
        sensorOffsetRatio: 0.25,
      },
      context: {
        nearestNaftalStationKm: 12.0,
        hasLegitimateFuelReceipt: false,
      },
    };

    it('doit classifier l incident en FAUSSE_ALERTE_PENTE_DÉVERS avec préjudice financier nul (0.00 DZD)', () => {
      const graph = service.buildPreComputedGraph(steepSlopeInput);

      expect(graph.environmentalEvidence.qualification).toBe('FAUSSE_ALERTE_PENTE_DÉVERS');
      expect(graph.environmentalEvidence.confidenceScore).toBeGreaterThanOrEqual(0.99);

      // Le modèle physique compense entièrement la fausse perte
      expect(graph.fuelData.rawDropLiters).toBe(22.0);
      expect(graph.fuelData.slopeCorrectionLiters).toBeGreaterThanOrEqual(14.0);
      expect(graph.fuelData.correctedNetDropLiters).toBe(0.0);
      expect(graph.fuelData.directLossDzd).toBe(0.0);
    });

    it('doit générer un procès-verbal de classement technique sans suite protégeant le chauffeur contre un conflit social', async () => {
      const report = await service.generateAuditReport(steepSlopeInput);

      expect(report.status).toBe('CLASSEMENT_SANS_SUITE');
      expect(report.qualification).toBe('FAUSSE_ALERTE_PENTE_DÉVERS');

      // Vérification du classement protecteur FR
      expect(report.frenchReport.titre).toContain('PROCÈS-VERBAL DE CLASSEMENT TECHNIQUE SANS SUITE');
      expect(report.frenchReport.prejudiceFinancierDzd).toContain('0.00 DZD');
      expect(report.frenchReport.recommandationDecisionnelle).toContain('Préservation intégrale du dossier du chauffeur');

      // Vérification du classement protecteur AR
      expect(report.arabicReport.titre).toContain('محضر معاينة تقنية وحفظ للملف بدون متابعة');
      expect(report.arabicReport.prejudiceFinancierDzd).toContain('0.00 دج');
      expect(report.arabicReport.recommandationDecisionnelle).toContain('حماية السائق من أي نزاع');
    });
  });

  describe('Tâche 1.3 : Gestion et Traçabilité du Registre des Rapports d Audit', () => {
    it('doit lister les rapports générés par ordre antéchronologique', async () => {
      const input1: FuelIncidentEvaluationInput = {
        vehicleId: 'v1',
        vehiclePlate: '00100-116-16',
        location: { latitude: 36.7, longitude: 3.0, wilayaCode: 16, wilayaName: 'Alger', roadName: 'Rocade Sud', roadGradePercent: 0.5 },
        telemetry: { speedKmh: 0, engineRpm: 0, ignitionOn: false, durationStationarySeconds: 300 },
        fuelReading: { tankCapacityLiters: 300, rawLevelsLiters: [200, 160] },
        context: { nearestNaftalStationKm: 5, hasLegitimateFuelReceipt: false },
      };

      const rep1 = await service.generateAuditReport(input1);
      const rep2 = await service.generateAuditReport({
        ...input1,
        vehiclePlate: '00200-116-31',
        location: { ...input1.location, wilayaCode: 31, wilayaName: 'Oran' },
      });

      const list = service.listReports();
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(service.getReportById(rep1.reportId)).toBeDefined();
      expect(service.getReportById(rep2.reportId)).toBeDefined();
    });
  });
});
