/**
 * Tests Unitaires & Intégration : Moteur Fiscal DGI (Phase 5)
 * 
 * Valide les exigences strictes de la Phase 5 :
 * 1. IBS Multi-activités :
 *    - Production (19%) + Négoce (26%) avec comptabilité séparée : 2M à 19% (380k) + 1M à 26% (260k) = 640k DA
 *    - Sans comptabilité séparée : 3M à 26% = 780k DA (surcoût = 140k DA)
 *    - Réintégration amende 50 000 DA au segment négoce (26%) : +13 000 DA d'IBS
 * 2. TVA Prorata :
 *    - CA taxable 8M + exonéré 2M -> prorata 80% ; TVA frais généraux 100k -> déductible 80k DA
 * 3. Régularisation quinquennale TVA :
 *    - Machine acquise en N avec 190k TVA déduite, cédée en N+2 non assujettie -> reversement 2/5 (76k DA)
 * 4. TAP :
 *    - Calcul pour les opérations antérieures au 01/01/2024, zéro absolu après
 * 5. IFU & ANAE :
 *    - Calculs forfaitaires, minima légaux, et détection du dépassement de seuil pour bascule au réel
 * 6. Simulation de contrôle fiscal & Redressement par impôt :
 *    - Omission 1M CA HT en 2024 (TVA 19% + IBS 26%)
 *    - TVA rappelée = 190k DA + pénalités par grille
 *    - IBS rappelé = 260k DA + pénalités par grille
 *    - Restitution en fourchette (Basse, Médiane, Haute), jamais de taux unique global
 */

import { describe, it, expect } from 'vitest';
import {
  IbsEngine,
  TvaEngine,
  TapEngine,
  IfuAnaeEngine,
  TaxAuditSimulator,
} from '../src/index.js';

describe('Moteur Fiscal DGI (Phase 5)', () => {
  // ===========================================================================
  // 1. IBS MULTI-ACTIVITÉS & RÉINTÉGRATIONS SPÉCIFIQUES
  // ===========================================================================
  describe('1. IBS Multi-activités & Réintégrations par segment', () => {
    it('calcule exactement : Production (19%) 2M -> 380k ; Négoce (26%) 1M -> 260k ; total = 640k DA avec compta séparée ; 780k DA sans compta séparée (surcoût = 140k DA)', () => {
      // Configuration conforme au cas doré :
      // Segment Production : taux 0.19, résultat comptable 2 000 000 DA
      // Segment Négoce : taux 0.26, résultat comptable 1 000 000 DA
      // Taux de repli sans comptabilité séparée : 0.26
      const segmentsInput = [
        {
          segmentCode: 'PROD',
          label: 'Fabrication de pièces métalliques',
          taxRate: '0.19',
          accountingResult: '2000000.00',
        },
        {
          segmentCode: 'NEGOCE',
          label: 'Commerce de gros',
          taxRate: '0.26',
          accountingResult: '1000000.00',
        },
      ];

      // A. Avec comptabilité séparée
      const resSeparated = IbsEngine.evaluate({
        fiscalYear: 2026,
        hasSeparateAccounting: true,
        defaultFallbackRate: '0.26',
        segments: segmentsInput,
      });

      expect(resSeparated.hasSeparateAccounting).toBe(true);
      expect(resSeparated.segmentDetails[0].ibsAmount).toBe('380000.00'); // 2M * 19% = 380k
      expect(resSeparated.segmentDetails[1].ibsAmount).toBe('260000.00'); // 1M * 26% = 260k
      expect(resSeparated.totalIbsDue).toBe('640000.00');                // 380k + 260k = 640k
      expect(resSeparated.penaltyExcessIbs).toBe('0.00');

      // B. Sans comptabilité séparée (Sanction LFC 2015 : taux de 26% sur le tout)
      const resUnseparated = IbsEngine.evaluate({
        fiscalYear: 2026,
        hasSeparateAccounting: false,
        defaultFallbackRate: '0.26',
        segments: segmentsInput,
      });

      expect(resUnseparated.hasSeparateAccounting).toBe(false);
      expect(resUnseparated.totalTaxableResult).toBe('3000000.00');
      expect(resUnseparated.totalIbsDue).toBe('780000.00'); // 3M * 26% = 780k
      expect(resUnseparated.penaltyExcessIbs).toBe('140000.00'); // 780k - 640k = 140k DA de surcoût !
    });

    it('affecte une réintégration extra-comptable (amende 50 000 DA) au segment négoce à 26% (+13 000 DA d IBS)', () => {
      // Amende fiscale de 50 000 DA imputée au segment négoce
      const res = IbsEngine.evaluate({
        fiscalYear: 2026,
        hasSeparateAccounting: true,
        defaultFallbackRate: '0.26',
        segments: [
          {
            segmentCode: 'PROD',
            label: 'Production',
            taxRate: '0.19',
            accountingResult: '2000000.00',
          },
          {
            segmentCode: 'NEGOCE',
            label: 'Négoce',
            taxRate: '0.26',
            accountingResult: '1000000.00',
            specificReintegrations: '50000.00', // Réintégration non déductible affectée au négoce
          },
        ],
      });

      // Segment Négoce : 1 000 000 + 50 000 = 1 050 000 DA à 26% = 273 000 DA
      // Delta IBS négoce = 273 000 - 260 000 = +13 000 DA (taxé exactement à 26%, pas au taux moyen !)
      expect(res.segmentDetails[1].taxableResult).toBe('1050000.00');
      expect(res.segmentDetails[1].ibsAmount).toBe('273000.00');
      expect(res.totalIbsDue).toBe('653000.00'); // 380 000 + 273 000 = 653 000 DA
    });

    it('calcule les acomptes prévisionnels (3 x 30% de N-1) et le solde de liquidation', () => {
      // IBS N-1 = 500 000 DA -> chaque acompte = 150 000 DA.
      // 2 acomptes versés (300 000 DA). IBS définitif = 400 000 DA -> solde = 100 000 DA.
      const res = IbsEngine.evaluate({
        fiscalYear: 2026,
        hasSeparateAccounting: true,
        defaultFallbackRate: '0.26',
        segments: [
          {
            segmentCode: 'SERVICES',
            label: 'Conseil',
            taxRate: '0.26',
            accountingResult: '1538461.54', // Donne ~400 000 DA d'IBS
          },
        ],
        priorYearIbs: '500000.00',
        advancesPaid: '300000.00',
      });

      expect(res.firstAdvanceDue).toBe('150000.00');
      expect(res.secondAdvanceDue).toBe('150000.00');
      expect(res.thirdAdvanceDue).toBe('150000.00');
      expect(res.totalIbsDue).toBe('400000.00');
      expect(res.liquidationBalance).toBe('100000.00'); // 400 000 - 300 000 = 100 000 DA
    });
  });

  // ===========================================================================
  // 2. TVA PRORATA DE DÉDUCTION & RÉGULARISATION QUINQUENNALE
  // ===========================================================================
  describe('2. TVA : Prorata de déduction & Régularisation quinquennale (art. 38 & 38 bis)', () => {
    it('calcule le prorata de déduction : CA taxable 8M, CA exonéré 2M -> 80% ; TVA 100k -> 80k déductible', () => {
      const prorata = TvaEngine.computeAnnualProrata({
        fiscalYear: 2026,
        taxableRevenue: '8000000.00',
        exemptRevenueWithoutRight: '2000000.00',
        commonExpensesTva: '100000.00',
      });

      // P = 8M / (8M + 2M) = 80%
      expect(prorata.prorataPercentage).toBe('80.00 %');
      expect(prorata.deductibleTva).toBe('80000.00');
      expect(prorata.nonDeductibleTva).toBe('20000.00');
    });

    it('calcule la régularisation quinquennale : machine acquise en N (190k TVA), cédée en N+2 non assujettie -> reversement de 2/5 (76 000 DA)', () => {
      // Acquisition en 2024 (N) avec 190 000 DA de TVA déduite.
      // Cession non soumise en 2026 (N+2).
      // Années écoulées : 2024, 2025, 2026 = 3 années.
      // Années restantes : 5 - 3 = 2 années (2/5).
      // Reversement = 190 000 * (2/5) = 76 000.00 DA.
      const adj = TvaEngine.computeQuinquennialAdjustment({
        assetId: 'IMM-MACH-001',
        label: 'Presse industrielle hydraulique',
        acquisitionYear: 2024,
        initialDeductedTva: '190000.00',
        disposalYear: 2026,
        isDisposalExempt: true,
      });

      expect(adj.isAdjustmentRequired).toBe(true);
      expect(adj.elapsedYearsCount).toBe(3);
      expect(adj.remainingYearsCount).toBe(2);
      expect(adj.reversalRatio).toBe('2/5');
      expect(adj.reversalTvaAmount).toBe('76000.00');
    });

    it('n exige aucun reversement quinquennal si la cession intervient après 5 ans', () => {
      // Acquisition 2020, cession 2026 (6 années écoulées > 5 ans)
      const adj = TvaEngine.computeQuinquennialAdjustment({
        assetId: 'IMM-OLD-002',
        label: 'Matériel ancien',
        acquisitionYear: 2020,
        initialDeductedTva: '190000.00',
        disposalYear: 2026,
        isDisposalExempt: true,
      });

      expect(adj.isAdjustmentRequired).toBe(false);
      expect(adj.remainingYearsCount).toBe(0);
      expect(adj.reversalTvaAmount).toBe('0.00');
    });
  });

  // ===========================================================================
  // 3. TAXE SUR L'ACTIVITÉ PROFESSIONNELLE (TAP) — HISTORIQUE VS ABROGATION
  // ===========================================================================
  describe('3. TAP : Règle d abrogation au 01/01/2024 vs historique', () => {
    it('applique un montant strictement nul à compter du 01/01/2024 (LF 2024 art. 14)', () => {
      const res2024 = TapEngine.evaluate({
        operationDate: '2024-05-15',
        turnoverHt: '1000000.00',
        historicalRate: '0.02',
      });

      expect(res2024.isAbrogated).toBe(true);
      expect(res2024.tapAmount).toBe('0.00');
      expect(res2024.legalNotice).toContain('abrogée au 1er janvier 2024');
    });

    it('calcule la TAP historique pour les exercices antérieurs non prescrits (ex: 2023 à 2%)', () => {
      const res2023 = TapEngine.evaluate({
        operationDate: '2023-11-20',
        turnoverHt: '1000000.00',
        historicalRate: '0.02',
      });

      expect(res2023.isAbrogated).toBe(false);
      expect(res2023.tapAmount).toBe('20000.00'); // 1M * 2% = 20 000 DA
    });
  });

  // ===========================================================================
  // 4. RÉGIMES FORFAITAIRES (IFU & ANAE)
  // ===========================================================================
  describe('4. Régimes forfaitaires IFU & Auto-Entrepreneur (ANAE)', () => {
    it('évalue l IFU mixte : Vente 5M à 5% (250k) + Services 2M à 12% (240k) = 490k DA, éligible (7M < 8M)', () => {
      const ifu = IfuAnaeEngine.evaluateIfu({
        fiscalYear: 2026,
        goodsRevenue: '5000000.00',
        servicesRevenue: '2000000.00',
        goodsRate: '0.05',
        servicesRate: '0.12',
        minimumTaxAmount: '30000.00',
        eligibilityThreshold: '8000000.00',
      });

      expect(ifu.isEligible).toBe(true);
      expect(ifu.mustSwitchToReal).toBe(false);
      expect(ifu.totalTurnover).toBe('7000000.00');
      expect(ifu.calculatedGoodsTax).toBe('250000.00');
      expect(ifu.calculatedServicesTax).toBe('240000.00');
      expect(ifu.finalTaxDue).toBe('490000.00');
      expect(ifu.minimumTaxApplied).toBe(false);
    });

    it('détecte le dépassement du plafond IFU (9M > 8M) et enclenche la bascule obligatoire au réel', () => {
      const ifu = IfuAnaeEngine.evaluateIfu({
        fiscalYear: 2026,
        goodsRevenue: '6000000.00',
        servicesRevenue: '3000000.00',
        goodsRate: '0.05',
        servicesRate: '0.12',
        minimumTaxAmount: '30000.00',
        eligibilityThreshold: '8000000.00',
      });

      expect(ifu.isEligible).toBe(false);
      expect(ifu.mustSwitchToReal).toBe(true);
      expect(ifu.thresholdExceededBy).toBe('1000000.00'); // 9M - 8M = 1M DA de dépassement
    });

    it('évalue l auto-entrepreneur (ANAE) : CA services 4M à 0.5% = 20k DA, éligible (4M < 5M)', () => {
      const anae = IfuAnaeEngine.evaluateAnae({
        fiscalYear: 2026,
        declaredTurnover: '4000000.00',
        activityCategory: 'SERVICES',
        flatTaxRate: '0.005',
        minimumTaxAmount: '10000.00',
        turnoverCeiling: '5000000.00',
      });

      expect(anae.isEligible).toBe(true);
      expect(anae.mustSwitchToGeneralRegime).toBe(false);
      expect(anae.finalTaxDue).toBe('20000.00'); // 4M * 0.5% = 20 000 DA
    });
  });

  // ===========================================================================
  // 5. SIMULATION DE CONTRÔLE FISCAL & REDRESSEMENT PAR IMPÔT
  // ===========================================================================
  describe('5. Simulateur de Contrôle Fiscal : Redressement par impôt & Fourchettes', () => {
    it('calcule le redressement par impôt pour omission de 1 000 000 DA de CA HT en 2024 (TVA 19% + IBS 26%) en fourchette', () => {
      // Données de travail certifiées :
      // Omission de 1 000 000 DA de CA HT en 2024
      // TVA applicable = 19% -> Droits simples = 190 000.00 DA
      // IBS applicable = 26% -> Droits simples = 260 000.00 DA
      // Total Droits simples = 450 000.00 DA
      // Grille des pénalités d'assiette :
      // - Bonne foi : 10%
      // - Manquement délibéré : 25%
      // - Manœuvres délibérées : 100%
      const report = TaxAuditSimulator.simulate(
        2024,
        [
          {
            taxType: 'TVA',
            label: 'Rappel de TVA sur recettes omises 2024',
            omittedTaxBaseHt: '1000000.00',
            applicableRate: '0.19',
          },
          {
            taxType: 'IBS',
            label: 'Rappel d IBS sur chiffre d affaires non déclaré 2024',
            omittedTaxBaseHt: '1000000.00',
            applicableRate: '0.26',
          },
        ],
        {
          goodFaithBasePenaltyRate: '0.10',
          deliberateFailureBasePenaltyRate: '0.25',
          seriousIrregularitiesPenaltyRate: '1.00',
          monthlyLatePenaltyRate: '0.00', // Hors intérêts de retard pour isoler la majoration d'assiette
        }
      );

      // Droits simples totaux rappelés
      expect(report.totalPrincipalTaxDue).toBe('450000.00');

      // 1. Fourchette Basse (Bonne foi : majoration 10%)
      // TVA = 190k + 19k = 209k DA
      // IBS = 260k + 26k = 286k DA
      // Total = 495 000.00 DA
      const low = report.lowBracket;
      expect(low.bracket).toBe('GOOD_FAITH');
      expect(low.taxesBreakdown[0].principalTaxDue).toBe('190000.00');
      expect(low.taxesBreakdown[0].basePenaltyAmount).toBe('19000.00');
      expect(low.taxesBreakdown[0].totalAdjustmentForTax).toBe('209000.00');

      expect(low.taxesBreakdown[1].principalTaxDue).toBe('260000.00');
      expect(low.taxesBreakdown[1].basePenaltyAmount).toBe('26000.00');
      expect(low.taxesBreakdown[1].totalAdjustmentForTax).toBe('286000.00');

      expect(low.grandTotalAdjustment).toBe('495000.00');

      // 2. Fourchette Médiane (Manquement délibéré : majoration 25%)
      // TVA = 190k + 47.5k = 237.5k DA
      // IBS = 260k + 65k = 325k DA
      // Total = 562 500.00 DA
      const med = report.mediumBracket;
      expect(med.bracket).toBe('DELIBERATE_FAILURE');
      expect(med.taxesBreakdown[0].basePenaltyAmount).toBe('47500.00');
      expect(med.taxesBreakdown[1].basePenaltyAmount).toBe('65000.00');
      expect(med.grandTotalAdjustment).toBe('562500.00');

      // 3. Fourchette Haute (Manœuvres délibérées : majoration 100%)
      // TVA = 190k + 190k = 380k DA
      // IBS = 260k + 260k = 520k DA
      // Total = 900 000.00 DA
      const high = report.highBracket;
      expect(high.bracket).toBe('SERIOUS_IRREGULARITIES');
      expect(high.taxesBreakdown[0].basePenaltyAmount).toBe('190000.00');
      expect(high.taxesBreakdown[1].basePenaltyAmount).toBe('260000.00');
      expect(high.grandTotalAdjustment).toBe('900000.00');

      // Preuve formelle : chaque impôt est calculé de manière étanche avec sa propre assiette et son propre taux
      expect(parseFloat(high.grandTotalAdjustment)).toBe(
        parseFloat(high.taxesBreakdown[0].totalAdjustmentForTax) + parseFloat(high.taxesBreakdown[1].totalAdjustmentForTax)
      );
    });
  });
});

