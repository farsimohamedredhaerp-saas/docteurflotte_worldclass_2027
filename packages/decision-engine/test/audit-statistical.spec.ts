/**
 * Tests Unitaires & Propriétés : Pilier D2 — Audit Statistique & Machine Learning Léger
 * 
 * Couvre :
 * 1. AUD-06 : Benford Avancé (4 tests, prérequis d applicabilité, Z-score, Khi-deux, MAD Drake/Nigrini)
 *    - Jeu synthétique à graine fixe de 10 000 montants log-uniformes -> MAD 1er chiffre < 0.006
 *    - Injection de 15% de montants commençant par 8 -> alerte de non-conformité
 *    - Échantillon de 50 lignes pour le test à 2 chiffres -> NOT_APPLICABLE
 *    - Détection de suite séquentielle -> NOT_APPLICABLE
 * 2. AUD-02 : Reconstitution du Chiffre d Affaires (Négoce CAMV, Industrie intrants/énergie, Services)
 *    - Ventes déclarées sous le seuil de tolérance -> aucune alerte
 *    - Ventes minorées au-delà de la tolérance -> alerte avec explication
 *    - Traitement des pertes justifiées vs non justifiées
 * 3. Fournisseurs à examiner (numéros consécutifs espacés de semaines, montants ronds, score 0-100)
 * 4. Score de risque global multi-impôts (fourchette DZD par impôt, plafonds par famille, déterminisme strict)
 */

import { describe, it, expect } from 'vitest';
import {
  BenfordAdvancedAnalyzer,
  RevenueReconstructionEngine,
  SupplierRiskScorer,
  GlobalRiskScorer,
  AuditAlertInput,
  MerchandiseFamilyInput,
  ManufacturingIntrantInput,
  ServiceConsumableInput,
} from '../src/audit/statistical';
import { Severity, EvidenceLevel } from '../src/types/ontology';

describe('Pilier D2 — Audit Statistique & Score de Risque', () => {
  // =========================================================================
  // 1. BENFORD AVANCÉ & PRÉREQUIS D'APPLICABILITÉ
  // =========================================================================
  describe('1. AUD-06 Benford Avancé & Tests d Applicabilité', () => {
    // Générateur pseudo-aléatoire déterministe à graine fixe (LCG)
    function createLcg(seed = 123456789) {
      let state = seed;
      return function nextFloat() {
        // Paramètres LCG de Numerical Recipes
        state = (1664525 * state + 1013904223) % 4294967296;
        return state / 4294967296;
      };
    }

    it('doit valider la conformité étroite (MAD < 0.006) sur 10 000 montants log-uniformes synthétiques', () => {
      const rng = createLcg(42);
      const N = 10000;
      const amounts: number[] = [];

      // Génération de 10 000 montants suivant strictement une distribution log-uniforme
      // X = 10^(U * (log10(max) - log10(min)) + log10(min)) entre 100 DA et 1 000 000 DA
      const logMin = Math.log10(100);
      const logMax = Math.log10(1000000);

      for (let i = 0; i < N; i++) {
        const u = rng();
        const val = Math.pow(10, logMin + u * (logMax - logMin));
        amounts.push(Number(val.toFixed(2)));
      }

      const res = BenfordAdvancedAnalyzer.analyze(amounts, {
        testType: 'FIRST_DIGIT',
      });

      expect(res.isApplicable).toBe(true);
      expect(res.sampleSize).toBe(N);
      expect(parseFloat(res.mad)).toBeLessThan(0.006); // Exigence prompt : MAD du 1er chiffre < 0.006
      expect(res.conformityRating).toBe('CLOSE_CONFORMITY');
      expect(res.humanReviewRequired).toBe(false);
      expect(res.degreesOfFreedom).toBe(8);
    });

    it('doit déclencher une alerte de non-conformité lorsqu on injecte 15% de montants commençant par 8', () => {
      const rng = createLcg(99);
      const N = 5000;
      const amounts: number[] = [];

      const logMin = Math.log10(100);
      const logMax = Math.log10(1000000);

      // Générer une base log-uniforme
      for (let i = 0; i < N; i++) {
        const u = rng();
        const val = Math.pow(10, logMin + u * (logMax - logMin));
        amounts.push(Number(val.toFixed(2)));
      }

      // Injecter 15% de montants commençant systématiquement par 8 (ex: 85 000 DA)
      const injectCount = Math.round(N * 0.15); // 750 montants
      for (let i = 0; i < injectCount; i++) {
        amounts[i] = 85200.00 + (i % 100);
      }

      const res = BenfordAdvancedAnalyzer.analyze(amounts, {
        testType: 'FIRST_DIGIT',
      });

      expect(res.isApplicable).toBe(true);
      // La MAD doit dépasser le seuil marginal et déclencher le statut de non-conformité
      expect(res.conformityRating).toBe('NON_CONFORMITY_RISK');
      expect(res.humanReviewRequired).toBe(true);
      expect(res.suspectBins).toContain(8); // Le chiffre 8 doit être détecté comme suspect
    });

    it('doit renvoyer NOT_APPLICABLE pour un échantillon de 50 lignes sur le test à 2 chiffres', () => {
      const amounts = Array.from({ length: 50 }, (_, i) => 1000 + i * 250);

      const res = BenfordAdvancedAnalyzer.analyze(amounts, {
        testType: 'FIRST_TWO_DIGITS',
      });

      // Exigence prompt : échantillon de 50 lignes pour le test à 2 chiffres -> NOT_APPLICABLE
      expect(res.isApplicable).toBe(false);
      expect(res.conformityRating).toBe('NOT_APPLICABLE');
      expect(res.inapplicabilityReason).toContain('Taille d échantillon insuffisante');
      expect(res.inapplicabilityReason).toContain('50 observations');
      expect(res.humanReviewRequired).toBe(false);
    });

    it('doit renvoyer NOT_APPLICABLE si l étendue des données est inférieure à 2 ordres de grandeur', () => {
      // Montants tous compris entre 5 000 et 8 000 DA (étendue < 1 ordre de grandeur)
      const rng = createLcg(77);
      const amounts = Array.from({ length: 200 }, () => 5000 + rng() * 3000);

      const res = BenfordAdvancedAnalyzer.analyze(amounts, {
        testType: 'FIRST_DIGIT',
        minOrdersOfMagnitude: 2,
      });

      expect(res.isApplicable).toBe(false);
      expect(res.conformityRating).toBe('NOT_APPLICABLE');
      expect(res.inapplicabilityReason).toContain('Étendue des données insuffisante');
    });

    it('doit renvoyer NOT_APPLICABLE en cas de numérotation séquentielle continue détectée', () => {
      // Suite séquentielle continue (ex: 1001, 1002, 1003... incrément constant = 1)
      const amounts = Array.from({ length: 150 }, (_, i) => 1000 + i);

      const res = BenfordAdvancedAnalyzer.analyze(amounts, {
        testType: 'FIRST_DIGIT',
        minOrdersOfMagnitude: 0, // Ignorer l étendue pour tester le filtre séquentiel
      });

      expect(res.isApplicable).toBe(false);
      expect(res.isSequentialDetected).toBe(true);
      expect(res.inapplicabilityReason).toContain('suite séquentielle attribuée');
    });
  });

  // =========================================================================
  // 2. AUD-02 : RECONSTITUTION DU CHIFFRE D'AFFAIRES
  // =========================================================================
  describe('2. AUD-02 Reconstitution Déterministe du Chiffre d Affaires', () => {
    it('ne doit émettre aucune alerte si les ventes déclarées sont sous le seuil de tolérance', () => {
      // Achats 100, coefficient de vente 1.30 -> CA reconstitué = 130
      // Ventes déclarées = 128 (écart de 2, tolérance admise 4% = 5.2)
      const families: MerchandiseFamilyInput[] = [
        {
          familyCode: 'FAM_ALIM',
          familyName: 'Produits Alimentaires',
          initialStockDzd: '0.00',
          purchasesDzd: '1000000.00',
          finalStockDzd: '0.00',
          markupMultiplier: '1.30',
        },
      ];

      // CA reconstitué = 1 000 000 * 1.30 = 1 300 000 DA
      // CA déclaré = 1 280 000 DA (écart 20 000 DA < tolérance 50 000 DA)
      const report = RevenueReconstructionEngine.reconstructCommerce('1280000.00', families, {
        toleranceRatio: '0.04',
        toleranceAmountDzd: '50000.00',
      });

      expect(report.reconstructedRevenueDzd).toBe('1300000.00');
      expect(report.varianceAmountDzd).toBe('20000.00');
      expect(report.isUnderdeclaredIndice).toBe(false);
      expect(report.isWithinTolerance).toBe(true);
      expect(report.humanReviewRequired).toBe(false);
      expect(report.severity).toBe(Severity.INFO);
    });

    it('doit émettre une alerte explicative si les ventes déclarées sont minorées au-delà de la tolérance', () => {
      // Achats consommés 1 000 000 DA, coefficient 1.30 -> CA attendu 1 300 000 DA
      // Ventes déclarées = 800 000 DA (manque 500 000 DA)
      const families: MerchandiseFamilyInput[] = [
        {
          familyCode: 'FAM_ALIM',
          familyName: 'Produits Alimentaires',
          initialStockDzd: '0.00',
          purchasesDzd: '1000000.00',
          finalStockDzd: '0.00',
          markupMultiplier: '1.30',
        },
      ];

      const report = RevenueReconstructionEngine.reconstructCommerce('800000.00', families, {
        toleranceRatio: '0.04',
        toleranceAmountDzd: '50000.00',
      });

      expect(report.isUnderdeclaredIndice).toBe(true);
      expect(report.isWithinTolerance).toBe(false);
      expect(report.varianceAmountDzd).toBe('500000.00');
      expect(report.humanReviewRequired).toBe(true);
      expect(report.severity).toBe(Severity.MAJEUR);
      expect(report.explanationFr).toContain('Indice de discordance de chiffre d affaires négoce');
      expect(report.explanationFr).toContain('500000.00 DA');
    });

    it('doit déduire les pertes justifiées du CAMV et considérer les pertes non justifiées comme vendues', () => {
      const families: MerchandiseFamilyInput[] = [
        {
          familyCode: 'FAM_MAT',
          familyName: 'Matériaux BTP',
          initialStockDzd: '500000.00',
          purchasesDzd: '2000000.00',
          finalStockDzd: '500000.00',
          declaredLossesDzd: '200000.00',
          isLossJustified: true, // Justifiée par PV d huissier
          markupMultiplier: '1.20',
        },
        {
          familyCode: 'FAM_PEINT',
          familyName: 'Peintures',
          initialStockDzd: '0.00',
          purchasesDzd: '1000000.00',
          finalStockDzd: '0.00',
          declaredLossesDzd: '100000.00',
          isLossJustified: false, // Perte non justifiée
          markupMultiplier: '1.40',
        },
      ];

      // Famille 1 : CAMV = 500k + 2M - 500k - 200k(justifié) = 1 800 000 DA * 1.20 = 2 160 000 DA
      // Famille 2 : CAMV = 1M - 0(non justifié non déduit) = 1 000 000 DA * 1.40 = 1 400 000 DA
      // Total reconstitué = 2 160 000 + 1 400 000 = 3 560 000 DA
      const report = RevenueReconstructionEngine.reconstructCommerce('3560000.00', families);

      expect(report.reconstructedRevenueDzd).toBe('3560000.00');
      expect(report.familiesDetail![0].unjustifiedLossDzd).toBe('0.00');
      expect(report.familiesDetail![1].unjustifiedLossDzd).toBe('100000.00');
      expect(report.isWithinTolerance).toBe(true);
    });

    it('doit reconstituer la production industrielle par intrant directeur et détecter une anomalie d énergie', () => {
      const intrant: ManufacturingIntrantInput = {
        materialCode: 'BLÉ_DUR',
        materialName: 'Blé dur meunerie',
        initialQuantity: '100.00',
        purchasedQuantity: '900.00',
        finalQuantity: '0.00',
        normalScrapRate: '0.02', // 2% de déchet
        standardUnitConsumption: '1.25', // 1.25 kg de blé par kg de semoule
        averageSellingPriceDzd: '80.00', // 80 DA/kg de semoule
        consumedKwh: '50000.00', // Énergie consommée
        energyBench: {
          meanKwhPerUnit: '0.05', // 0.05 kWh/kg
          stdDevKwhPerUnit: '0.01',
          toleranceMultiplier: '2.0', // [0.03 - 0.07]
        },
      };

      // M_cons = 1000 kg. Q_produite = 1000 * 0.98 / 1.25 = 784 kg
      // CA théorique = 784 * 80 = 62 720.00 DA
      // Consommation électrique : 50 000 kWh / 784 kg = 63.77 kWh/kg (anormalement élevé vs plage 0.03-0.07)
      const report = RevenueReconstructionEngine.reconstructIndustry('62720.00', intrant);

      expect(report.reconstructedRevenueDzd).toBe('62720.00');
      expect(report.energyVarianceDetected).toBe(true);
      expect(report.energyExplanation).toContain('Anomalie d intensité énergétique constatée');
      expect(report.humanReviewRequired).toBe(true);
    });

    it('doit reconstituer l activité de services par consommables traceurs', () => {
      const tracer: ServiceConsumableInput = {
        tracerCode: 'SERINGUE_DISP',
        tracerName: 'Kits d injection médicale',
        consumedQuantity: '500', // 500 kits consommés
        standardDosePerService: '1', // 1 kit par consultation
        averageServicePriceDzd: '2500.00', // 2 500 DA la consultation
      };

      // CA théorique = 500 * 2500 = 1 250 000 DA
      // CA déclaré = 600 000 DA (discordance)
      const report = RevenueReconstructionEngine.reconstructServices('600000.00', tracer, {
        toleranceAmountDzd: '50000.00',
      });

      expect(report.reconstructedRevenueDzd).toBe('1250000.00');
      expect(report.isUnderdeclaredIndice).toBe(true);
      expect(report.humanReviewRequired).toBe(true);
      expect(report.explanationFr).toContain('500 actes');
    });
  });

  // =========================================================================
  // 3. FOURNISSEURS À EXAMINER
  // =========================================================================
  describe('3. Fournisseurs à Examiner (SupplierRiskScorer)', () => {
    it('doit classifier en FOURNISSEUR_A_EXAMINER un tiers avec factures consécutives espacées de semaines et montants ronds', () => {
      const invoices = [
        { id: '1', invoiceNumber: 'FA-101', issueDate: '2026-01-10', amountTtc: '50000.00' },
        { id: '2', invoiceNumber: 'FA-102', issueDate: '2026-02-15', amountTtc: '80000.00' }, // Consécutif N+1 après 36 jours
        { id: '3', invoiceNumber: 'FA-103', issueDate: '2026-03-25', amountTtc: '120000.00' }, // Consécutif N+1 après 38 jours
      ];

      const res = SupplierRiskScorer.evaluateSupplier({
        supplierId: 'SUPP_SUSPECT',
        supplierName: 'SARL Écran et Coquille',
        supplierNif: '', // NIF manquant
        invoices,
      });

      expect(res.riskScore).toBeGreaterThanOrEqual(40);
      expect(res.ratingLabel).toBe('FOURNISSEUR_A_EXAMINER');
      expect(res.humanReviewRequired).toBe(true);
      expect(res.contributions.some((c) => c.indicatorCode === 'IND_SEQUENCE' && c.isTriggered)).toBe(true);
      expect(res.contributions.some((c) => c.indicatorCode === 'IND_ROUND_AMOUNTS' && c.isTriggered)).toBe(true);
      expect(res.contributions.some((c) => c.indicatorCode === 'IND_IDENTIFIER' && c.isTriggered)).toBe(true);
    });

    it('doit classifier en FOURNISSEUR_CONFORME un tiers ordinaire avec numérotation standard et NIF valide', () => {
      const invoices = [
        { id: '1', invoiceNumber: 'FACT-2026-0045', issueDate: '2026-01-10', amountTtc: '45213.65' },
        { id: '2', invoiceNumber: 'FACT-2026-0189', issueDate: '2026-01-18', amountTtc: '12384.20' },
        { id: '3', invoiceNumber: 'FACT-2026-0512', issueDate: '2026-02-05', amountTtc: '89456.10' },
      ];

      const res = SupplierRiskScorer.evaluateSupplier({
        supplierId: 'SUPP_CLEAN',
        supplierName: 'SPA Distributeur National',
        supplierNif: '001616012345678', // NIF 15 chiffres conforme
        invoices,
      });

      expect(res.riskScore).toBeLessThan(40);
      expect(res.ratingLabel).toBe('FOURNISSEUR_CONFORME');
      expect(res.humanReviewRequired).toBe(false);
    });
  });

  // =========================================================================
  // 4. SCORE DE RISQUE GLOBAL & DÉTERMINISME
  // =========================================================================
  describe('4. Score de Risque Global Multi-Impôts (GlobalRiskScorer)', () => {
    it('doit calculer un score déterministe identique à chaque exécution', () => {
      const alerts: AuditAlertInput[] = [
        {
          alertId: 'ALT-1',
          ruleCode: 'SCF-01',
          familyCode: 'SCF',
          severity: Severity.BLOQUANT,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          taxCategory: 'GENERAL',
          taxExposure: { lowEstimateDzd: '0.00', highEstimateDzd: '0.00' },
          messageFr: 'Écriture déséquilibrée',
        },
        {
          alertId: 'ALT-2',
          ruleCode: 'DGI-IBS-01',
          familyCode: 'DGI_IBS',
          severity: Severity.MAJEUR,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          taxCategory: 'IBS',
          taxExposure: { lowEstimateDzd: '100000.00', highEstimateDzd: '150000.00' },
          messageFr: 'Amortissement excédentaire véhicule de tourisme',
        },
        {
          alertId: 'ALT-3',
          ruleCode: 'DGI-TVA-02',
          familyCode: 'DGI_TVA',
          severity: Severity.MAJEUR,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          taxCategory: 'TVA',
          taxExposure: { lowEstimateDzd: '45000.00', highEstimateDzd: '90000.00' },
          messageFr: 'Facture en espèces supérieure au seuil TVA',
        },
      ];

      // Exécution 1
      const res1 = GlobalRiskScorer.calculateScore(alerts);
      // Exécution 2
      const res2 = GlobalRiskScorer.calculateScore(alerts);

      // Déterminisme absolu
      expect(res1.overallRiskScore).toBe(res2.overallRiskScore);
      expect(res1.taxExposureTotal.lowEstimateDzd).toBe(res2.taxExposureTotal.lowEstimateDzd);
      expect(res1.taxExposureTotal.highEstimateDzd).toBe(res2.taxExposureTotal.highEstimateDzd);
      expect(res1.riskLevel).toBe(res2.riskLevel);
      expect(res1.humanReviewRequired).toBe(true);

      // Vérification des fourchettes par impôt
      const ibsBreakdown = res1.taxBreakdowns.find((b) => b.taxCategory === 'IBS');
      expect(ibsBreakdown?.lowEstimateDzd).toBe('100000.00');
      expect(ibsBreakdown?.highEstimateDzd).toBe('150000.00');

      const tvaBreakdown = res1.taxBreakdowns.find((b) => b.taxCategory === 'TVA');
      expect(tvaBreakdown?.lowEstimateDzd).toBe('45000.00');
      expect(tvaBreakdown?.highEstimateDzd).toBe('90000.00');

      expect(res1.taxExposureTotal.lowEstimateDzd).toBe('145000.00');
      expect(res1.taxExposureTotal.highEstimateDzd).toBe('240000.00');
    });

    it('doit appliquer les plafonds de points par famille pour éviter la saturation artificielle', () => {
      // 10 alertes majeures dans la famille DGI_TVA (10 * 10 = 100 points bruts, plafonné à 25)
      const alerts: AuditAlertInput[] = Array.from({ length: 10 }, (_, i) => ({
        alertId: `TVA-${i}`,
        ruleCode: 'DGI-TVA-SPLIT',
        familyCode: 'DGI_TVA',
        severity: Severity.MAJEUR,
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        taxCategory: 'TVA',
        messageFr: `Alerte TVA ${i}`,
      }));

      const res = GlobalRiskScorer.calculateScore(alerts, {
        familyCaps: { DGI_TVA: 25 },
      });

      const tvaContribution = res.familyContributions.find((c) => c.familyCode === 'DGI_TVA');
      expect(tvaContribution?.rawPoints).toBe(100);
      expect(tvaContribution?.cappedPoints).toBe(25);
      expect(res.overallRiskScore).toBe(25);
    });
  });
});

