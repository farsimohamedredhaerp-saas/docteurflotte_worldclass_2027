import { describe, it, expect } from 'vitest';
import {
  AnalyticalAxesEngine,
  BudgetControlEngine,
  StandardCostVarianceEngine,
  BreakEvenEngine,
  NormativeWcrEngine,
  ManagementDashboardEngine,
  Severity,
  EvidenceLevel,
} from '../src';

describe('Phase 7 — Moteur de Gestion & Contrôle Budgétaire', () => {
  // =========================================================================
  // 1. COMPTABILITÉ ANALYTIQUE & VENTILATION MULTI-AXES
  // =========================================================================
  describe('1. Ventilation Analytique Multi-Axes (AnalyticalAxesEngine)', () => {
    it('doit ventiler une charge indirecte de 100 000.00 DA entre 3 centres sans perte de centime', () => {
      const shares = [
        { centerCode: 'ATELIER', weight: '40' },
        { centerCode: 'FLOTTE_NORD', weight: '35' },
        { centerCode: 'ADMINISTRATION', weight: '25' },
      ];

      const allocations = AnalyticalAxesEngine.allocateAmount('100000.00', shares);

      expect(allocations.length).toBe(3);
      expect(allocations[0].allocatedAmount).toBe('40000.00');
      expect(allocations[1].allocatedAmount).toBe('35000.00');
      expect(allocations[2].allocatedAmount).toBe('25000.00');

      // Vérification somme exacte
      const sum = allocations.reduce((acc, a) => acc + parseFloat(a.allocatedAmount), 0);
      expect(sum).toBe(100000.0);
    });

    it('doit ajuster le centime d arrondi sur la part prépondérante lors d une division par 3', () => {
      // 1 000.00 DA partagé en 3 parts égales (333.333...)
      const shares = [
        { centerCode: 'CHANTIER_A', weight: '1' },
        { centerCode: 'CHANTIER_B', weight: '1' },
        { centerCode: 'CHANTIER_C', weight: '1' },
      ];

      const allocations = AnalyticalAxesEngine.allocateAmount('1000.00', shares);

      expect(allocations.length).toBe(3);
      // Deux centres reçoivent 333.33 et un reçoit 333.34
      const amounts = allocations.map((a) => a.allocatedAmount);
      expect(amounts).toContain('333.34');
      expect(amounts.filter((a) => a === '333.33').length).toBe(2);

      const totalSum = allocations.reduce((acc, a) => acc + parseFloat(a.allocatedAmount), 0);
      expect(totalSum).toBe(1000.0);
    });

    it('doit exécuter un déversement secondaire en cascade des centres auxiliaires vers les principaux', () => {
      const primaryTotals = new Map<string, string>([
        ['ATELIER_CENTRAL', '120000.00'], // Centre auxiliaire
        ['FLOTTE_FRET', '500000.00'], // Centre principal
        ['FLOTTE_BTPH', '300000.00'], // Centre principal
      ]);

      const secondaryRules = [
        {
          sourceCenterCode: 'ATELIER_CENTRAL',
          targetShares: [
            { centerCode: 'FLOTTE_FRET', weight: '60' },
            { centerCode: 'FLOTTE_BTPH', weight: '40' },
          ],
        },
      ];

      const finalTotals = AnalyticalAxesEngine.processSecondaryReallocations(primaryTotals, secondaryRules);

      // Le centre auxiliaire doit être entièrement vidé à 0.00 DA
      expect(finalTotals.get('ATELIER_CENTRAL')).toBe('0.00');
      // Flotte Fret reçoit +72 000 DA (60%) -> 572 000.00 DA
      expect(finalTotals.get('FLOTTE_FRET')).toBe('572000.00');
      // Flotte BTPH reçoit +48 000 DA (40%) -> 348 000.00 DA
      expect(finalTotals.get('FLOTTE_BTPH')).toBe('348000.00');
    });
  });

  // =========================================================================
  // 2. CONTRÔLE ET SUIVI BUDGÉTAIRE
  // =========================================================================
  describe('2. Contrôle et Suivi Budgétaire (BudgetControlEngine)', () => {
    const budgetLines = [
      {
        id: 'BUD-01',
        centerCode: 'FLOTTE_NORD',
        lineItemCode: 'CARBURANT',
        labelFr: 'Carburant Gasoil',
        category: 'EXPENSE' as const,
        period: '2026-Q1',
        budgetedAmount: '500000.00',
        toleranceRatio: '0.04',
      },
      {
        id: 'BUD-02',
        centerCode: 'ATELIER',
        lineItemCode: 'PIECES_DETACHEES',
        labelFr: 'Pièces de rechange',
        category: 'EXPENSE' as const,
        period: '2026-Q1',
        budgetedAmount: '200000.00',
        toleranceRatio: '0.04',
        isHardCeiling: true,
      },
      {
        id: 'BUD-03',
        centerCode: 'DIRECTION_COMMERCIALE',
        lineItemCode: 'CA_FRET',
        labelFr: 'Chiffre d affaires Transport Fret',
        category: 'REVENUE' as const,
        period: '2026-Q1',
        budgetedAmount: '5000000.00',
        toleranceRatio: '0.04',
      },
    ];

    it('doit valider une exécution budgétaire respectueuse des enveloppes prévisionnelles', () => {
      const realizations = [
        {
          centerCode: 'FLOTTE_NORD',
          lineItemCode: 'CARBURANT',
          period: '2026-Q1',
          actualAmount: '420000.00',
          committedAmount: '30000.00', // Consommé total: 450 000 DA (90%)
        },
      ];

      const report = BudgetControlEngine.evaluate(budgetLines.slice(0, 1), realizations, '2026-Q1');

      expect(report.linesAnalyzed).toBe(1);
      expect(report.linesOverBudgetCount).toBe(0);
      expect(report.hasCriticalOverruns).toBe(false);
      const item = report.items[0];
      expect(item.status).toBe('WITHIN_BUDGET');
      expect(item.isFavorable).toBe(true);
      expect(item.realizationRatePercent).toBe('84.00');
      expect(item.consumptionRatePercent).toBe('90.00');
    });

    it('doit déclencher une alerte bloquante lors du dépassement d un plafond infranchissable (isHardCeiling)', () => {
      const realizations = [
        {
          centerCode: 'ATELIER',
          lineItemCode: 'PIECES_DETACHEES',
          period: '2026-Q1',
          actualAmount: '235000.00', // Dépassement de 35 000 DA (+17.5%)
          committedAmount: '0.00',
        },
      ];

      const report = BudgetControlEngine.evaluate([budgetLines[1]], realizations, '2026-Q1');

      expect(report.linesOverBudgetCount).toBe(1);
      expect(report.hasCriticalOverruns).toBe(true);
      const item = report.items[0];
      expect(item.status).toBe('OVER_BUDGET');
      expect(item.severity).toBe(Severity.BLOQUANT);
      expect(item.alertMessageFr).toContain('plafond infranchissable');
      expect(report.trace.outcome).toBe('BLOCKED');
    });

    it('doit signaler une sous-performance sur un objectif de chiffre d affaires', () => {
      const realizations = [
        {
          centerCode: 'DIRECTION_COMMERCIALE',
          lineItemCode: 'CA_FRET',
          period: '2026-Q1',
          actualAmount: '4000000.00', // 4M vs 5M budgétés (-20%)
        },
      ];

      const report = BudgetControlEngine.evaluate([budgetLines[2]], realizations, '2026-Q1');

      expect(report.linesOverBudgetCount).toBe(1); // Comptabilisé en écart défavorable
      const item = report.items[0];
      expect(item.isFavorable).toBe(false);
      expect(item.severity).toBe(Severity.MAJEUR);
      expect(item.alertMessageFr).toContain('Sous-performance commerciale');
    });
  });

  // =========================================================================
  // 3. ANALYSE DES ÉCARTS SUR COÛTS PRÉÉTABLIS (STANDARD COSTING)
  // =========================================================================
  describe('3. Écarts sur Coûts Préétablis (StandardCostVarianceEngine)', () => {
    it('doit décomposer l écart direct en sous-écarts Prix et Quantité avec additivité parfaite', () => {
      // Cas Carburant Gasoil Flotte :
      // Standard : 10 000 L à 29.00 DA/L = 290 000.00 DA
      // Réel : 11 000 L à 30.50 DA/L = 335 500.00 DA
      // Écart total : 335 500 - 290 000 = +45 500.00 DA (Surcoût défavorable)
      // Écart Prix : (30.50 - 29.00) * 11 000 = +16 500.00 DA
      // Écart Quantité : (11 000 - 10 000) * 29.00 = +29 000.00 DA
      // Additivité : 16 500 + 29 000 = 45 500 DA
      const { result, trace } = StandardCostVarianceEngine.analyzeDirectCost({
        costCenterCode: 'FLOTTE_SUD',
        costElementCode: 'GASOIL',
        labelFr: 'Gasoil Poids Lourds Ouargla',
        standardQuantity: '10000',
        standardUnitPrice: '29.00',
        actualQuantity: '11000',
        actualUnitPrice: '30.50',
      });

      expect(result.standardCost).toBe('290000.00');
      expect(result.actualCost).toBe('335500.00');
      expect(result.totalVariance).toBe('45500.00');
      expect(result.priceVariance).toBe('16500.00');
      expect(result.quantityVariance).toBe('29000.00');
      expect(result.isTotalFavorable).toBe(false);
      expect(result.isPriceFavorable).toBe(false);
      expect(result.isQuantityFavorable).toBe(false);
      expect(result.additivityCheckPass).toBe(true);
      expect(result.severity).toBe(Severity.MAJEUR); // Surcoût > 10%
      expect(trace.outcome).toBe('RISK_DETECTED');
    });

    it('doit analyser les charges indirectes d atelier à 3 sous-écarts (Budget, Activité, Rendement)', () => {
      // Atelier mécanique :
      // Activité normale An = 1 000 h, Activité réelle Ar = 900 h (sous-activité)
      // Coût standard Csu = 500 DA/h (dont Fixe Cfu = 200 DA/h et Variable Cvu = 300 DA/h)
      // Production réalisée équivalente Qp = 850 h
      // Coût réel constaté Cr = 480 000 DA
      const result = StandardCostVarianceEngine.analyzeIndirectCost({
        costCenterCode: 'ATELIER_MECANIQUE',
        labelFr: 'Centre d Entretien Flotte',
        normalActivityUnits: '1000',
        actualActivityUnits: '900',
        standardCostPerUnit: '500.00',
        fixedCostPerUnit: '200.00',
        variableCostPerUnit: '300.00',
        actualTotalCost: '480000.00',
        standardUnitsProduced: '850',
      });

      // Standard total = 850 * 500 = 425 000 DA
      expect(result.standardTotalCost).toBe('425000.00');
      // Écart total = 480 000 - 425 000 = +55 000 DA
      expect(result.totalVariance).toBe('55000.00');
      // Budget flexible(900h) = (900 * 300) + (1000 * 200) = 270k + 200k = 470 000 DA
      // 1. Écart sur budget = 480k - 470k = +10 000 DA
      expect(result.budgetVariance).toBe('10000.00');
      // 2. Écart sur activité (chômage) = (1000 - 900) * 200 = +20 000 DA
      expect(result.activityVariance).toBe('20000.00');
      // 3. Écart sur rendement = (900 - 850) * 500 = +25 000 DA
      expect(result.efficiencyVariance).toBe('25000.00');
      // Additivité : 10k + 20k + 25k = 55k DA
      expect(result.additivityCheckPass).toBe(true);
    });
  });

  // =========================================================================
  // 4. SEUIL DE RENTABILITÉ & POINT MORT (BREAK-EVEN ANALYSIS)
  // =========================================================================
  describe('4. Seuil de Rentabilité & Point Mort (BreakEvenEngine)', () => {
    it('doit calculer le seuil de rentabilité, point mort en jours et date calendaire pour une entreprise rentable', () => {
      // CA HT = 50 000 000 DA
      // Charges variables CV = 30 000 000 DA -> MCV = 20 000 000 DA (TMCV = 40.00%)
      // Charges fixes CF = 12 000 000 DA
      // Résultat = 20M - 12M = 8 000 000 DA (bénéficiaire)
      // Seuil de rentabilité SR = 12M / 0.40 = 30 000 000.00 DA
      // Point mort en jours = (30M / 50M) * 365 = 219 jours (environ 7 août 2026)
      // Marge de sécurité = 50M - 30M = 20 000 000 DA (Indice = 40.00%)
      // Levier opérationnel = 20M / 8M = 2.50
      const { result, trace } = BreakEvenEngine.calculate({
        revenueHt: '50000000.00',
        variableCosts: '30000000.00',
        fixedCosts: '12000000.00',
        operatingDaysInYear: 365,
        fiscalYear: 2026,
      });

      expect(result.grossMarginVariable).toBe('20000000.00');
      expect(result.variableMarginRatio).toBe('0.4000');
      expect(result.operatingResult).toBe('8000000.00');
      expect(result.breakEvenRevenueDzd).toBe('30000000.00');
      expect(result.breakEvenDays).toBe(219);
      expect(result.breakEvenCalendarDate).toBe('2026-08-07');
      expect(result.safetyMarginDzd).toBe('20000000.00');
      expect(result.safetyIndexRatio).toBe('0.4000');
      expect(result.operatingLeverage).toBe('2.50');
      expect(result.isProfitable).toBe(true);
      expect(result.hasReachableBreakEven).toBe(true);
      expect(trace.outcome).toBe('COMPLIANT');
    });

    it('doit bloquer avec sévérité maximale en cas de marge variable négative (activité structurellement déficitaire)', () => {
      // CA: 10 000 000 DA, Coûts variables: 11 000 000 DA -> MCV = -1 000 000 DA
      const { result } = BreakEvenEngine.calculate({
        revenueHt: '10000000.00',
        variableCosts: '11000000.00',
        fixedCosts: '2000000.00',
      });

      expect(result.hasReachableBreakEven).toBe(false);
      expect(result.isProfitable).toBe(false);
      expect(result.severity).toBe(Severity.BLOQUANT);
      expect(result.summaryFr).toContain('structurellement déficitaire');
    });
  });

  // =========================================================================
  // 5. BFR NORMATIF (MÉTHODE DES EXPERTS-COMPTABLES)
  // =========================================================================
  describe('5. BFR Normatif (NormativeWcrEngine)', () => {
    it('doit calculer le BFR en jours de CA et valoriser la trésorerie prévisionnelle saine', () => {
      // CA HT = 36 500 000 DA (soit 100 000 DA/jour)
      // Emplois :
      // - Clients : 60 jours, flux TTC 43 435 000 DA (CS = 1.19) -> 60 * 1.19 = 71.40 jours
      // - Stocks : 40 jours, flux achats 18 250 000 DA (CS = 0.50) -> 40 * 0.50 = 20.00 jours
      // Total Emplois = 91.40 jours
      // Ressources :
      // - Fournisseurs : 45 jours, flux 21 900 000 DA (CS = 0.60) -> 45 * 0.60 = 27.00 jours
      // - Dettes fiscales/sociales : 15 jours, flux 10 950 000 DA (CS = 0.30) -> 15 * 0.30 = 4.50 jours
      // Total Ressources = 31.50 jours
      // BFR net en jours = 91.40 - 31.50 = 59.90 jours
      // BFR en DA = 59.90 * 100 000 = 5 990 000.00 DA
      // FRNG = 7 000 000 DA -> Trésorerie nette prévisionnelle = +1 010 000.00 DA
      const { result, trace } = NormativeWcrEngine.calculate({
        annualRevenueHt: '36500000.00',
        workingCapitalFrng: '7000000.00',
        components: [
          {
            code: 'CLIENTS',
            labelFr: 'Créances clients TTC',
            nature: 'ASSET_USE',
            rotationDays: 60,
            annualFlowAmount: '43435000.00',
          },
          {
            code: 'STOCKS',
            labelFr: 'Stocks de matières et marchandises',
            nature: 'ASSET_USE',
            rotationDays: 40,
            annualFlowAmount: '18250000.00',
          },
          {
            code: 'FOURNISSEURS',
            labelFr: 'Dettes fournisseurs',
            nature: 'LIABILITY_RESOURCE',
            rotationDays: 45,
            annualFlowAmount: '21900000.00',
          },
          {
            code: 'DETTES_SOCIALES',
            labelFr: 'Dettes fiscales et organismes sociaux',
            nature: 'LIABILITY_RESOURCE',
            rotationDays: 15,
            annualFlowAmount: '10950000.00',
          },
        ],
      });

      expect(result.totalAssetUsesDays).toBe('91.40');
      expect(result.totalLiabilityResourcesDays).toBe('31.50');
      expect(result.netWcrDays).toBe('59.90');
      expect(result.netWcrDzd).toBe('5990000.00');
      expect(result.netForecastCashDzd).toBe('1010000.00');
      expect(result.isDeficitRisk).toBe(false);
      expect(result.severity).toBe(Severity.INFO);
      expect(trace.outcome).toBe('COMPLIANT');
    });

    it('doit alerter sur un risque de tension de trésorerie si le BFR excède le FRNG', () => {
      // Même BFR de 5 990 000 DA mais FRNG insuffisant de 4 000 000 DA
      // Trésorerie nette prévisionnelle = 4M - 5.99M = -1 990 000 DA (Déficit)
      const { result, trace } = NormativeWcrEngine.calculate({
        annualRevenueHt: '36500000.00',
        workingCapitalFrng: '4000000.00',
        components: [
          {
            code: 'CLIENTS',
            labelFr: 'Créances clients',
            nature: 'ASSET_USE',
            rotationDays: 60,
            annualFlowAmount: '43435000.00',
          },
        ],
      });

      expect(result.isDeficitRisk).toBe(true);
      expect(result.severity).toBe(Severity.MAJEUR);
      expect(result.netForecastCashDzd).toContain('-');
      expect(trace.outcome).toBe('RISK_DETECTED');
      expect(trace.humanReviewRequired).toBe(true);
    });
  });

  // =========================================================================
  // 6. COCKPIT DE GESTION CONSOLIDÉ
  // =========================================================================
  describe('6. Cockpit de Gestion Consolidé (ManagementDashboardEngine)', () => {
    it('doit consolider l ensemble des indicateurs et formuler des recommandations actionnables', () => {
      const breakEven = BreakEvenEngine.calculate({
        revenueHt: '50000000.00',
        variableCosts: '30000000.00',
        fixedCosts: '12000000.00',
      }).result;

      const wcr = NormativeWcrEngine.calculate({
        annualRevenueHt: '50000000.00',
        workingCapitalFrng: '10000000.00',
        components: [
          {
            code: 'CLIENTS',
            labelFr: 'Clients',
            nature: 'ASSET_USE',
            rotationDays: 45,
            annualFlowAmount: '59500000.00',
          },
        ],
      }).result;

      const dashboard = ManagementDashboardEngine.generate({
        companyId: 'ALGERIE_LOGISTICS_SPA',
        fiscalYear: 2026,
        period: '2026-ANNUAL',
        breakEvenResult: breakEven,
        wcrResult: wcr,
      });

      expect(dashboard.companyId).toBe('ALGERIE_LOGISTICS_SPA');
      expect(dashboard.fiscalYear).toBe(2026);
      expect(dashboard.keyMetrics.revenueHt).toBe('50000000.00');
      expect(dashboard.keyMetrics.operatingResult).toBe('8000000.00');
      expect(dashboard.keyMetrics.breakEvenRevenueDzd).toBe('30000000.00');
      expect(dashboard.healthStatus).toBe('EXCELLENT');
      expect(dashboard.summaryFr).toContain('EXCELLENT');
      expect(dashboard.trace.outcome).toBe('COMPLIANT');
    });
  });
});

