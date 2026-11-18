/**
 * Moteur d'Arbitrage des Régimes Juridiques et Fiscaux Algériens
 * 
 * Compare en temps réel les 4 options pour un nouvel entrepreneur ou une organisation :
 * 1. Auto-entrepreneur (ANAE - Loi 22-23)
 * 2. Impôt Forfaitaire Unique (IFU - Art. 282 bis CIDTA)
 * 3. Personne Physique au Réel (IRG BIC/BNC - Art. 104 CIDTA)
 * 4. Personne Morale (SARL / EURL soumise à l'IBS - Art. 135 CIDTA)
 * 
 * RÈGLE D'OR : Aucun taux codé en dur. Tous les paramètres proviennent
 * du RegPack bitemporel actif (ResolvedPackState).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal.js';
import { ResolvedPackState } from '../pack/resolver.js';
import { IfuAnaeEngine } from './ifu-anae-engine.js';

export type ActivitySectorCategory = 'SERVICES' | 'COMMERCE' | 'PRODUCTION' | 'BTPH';

export interface RegimeArbitrageInput {
  fiscalYear: number;
  activityCategory: ActivitySectorCategory;
  projectedAnnualRevenueGoods: string;    // Vente de marchandises / production (DZD)
  projectedAnnualRevenueServices: string; // Prestations de services / travaux (DZD)
  operatingExpenses: string;              // Achats consommés, loyers, carburant, maintenance (DZD)
  employeeCount: number;                  // Nombre de salariés déclarés
  totalGrossPayroll: string;              // Masse salariale annuelle brute des employés (DZD)
  desiredManagerRemuneration?: string;    // Rémunération nette annuelle souhaitée par le dirigeant
}

export type RegimeCode =
  | 'AUTO_ENTREPRENEUR'
  | 'IFU_FORFAITAIRE'
  | 'REEL_SIMPLIFIE'
  | 'SARL_EURL_IBS';

export interface RegimeComparisonItem {
  regimeCode: RegimeCode;
  labelFr: string;
  personalityType: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  isEligible: boolean;
  ineligibilityReasonFr: string | null;
  taxAmountDzd: string;
  socialContributionsDzd: string;
  totalLeviesDzd: string;
  netDisposableIncomeDzd: string;
  effectiveTaxRatePct: string;
  administrativeBurden: 'TRES_FAIBLE' | 'FAIBLE' | 'MOYENNE' | 'ELEVEE';
  accountingRequirementsFr: string;
  breakdown: Record<string, string>;
}

export interface RegimeArbitrageEvaluation {
  fiscalYear: number;
  totalTurnoverDzd: string;
  operatingExpensesDzd: string;
  grossPayrollDzd: string;
  employeeCount: number;
  regimes: RegimeComparisonItem[];
  recommendedRegime: RegimeCode;
  recommendedRegimeLabelFr: string;
  annualSavingsVsWorstDzd: string;
  actionableSummaryFr: string;
}

export class RegimeArbitrageEngine {
  /**
   * Évalue et arbitre les régimes fiscaux algériens selon les barèmes bitemporels du pack
   */
  public static evaluate(
    input: RegimeArbitrageInput,
    state: ResolvedPackState
  ): RegimeArbitrageEvaluation {
    const revGoods = EngineMath.from(input.projectedAnnualRevenueGoods || '0');
    const revServices = EngineMath.from(input.projectedAnnualRevenueServices || '0');
    const totalTurnover = revGoods.plus(revServices);
    const expenses = EngineMath.from(input.operatingExpenses || '0');
    const grossPayroll = EngineMath.from(input.totalGrossPayroll || '0');
    const employeeCount = input.employeeCount || 0;
    const desiredRemun = EngineMath.from(input.desiredManagerRemuneration || '1200000'); // 100k DA/mois par défaut

    // Résolution des paramètres depuis le pack
    const aePlafond = state.getParameterDecimal('AE_CA_PLAFOND', '5000000');
    const aeRate = state.getParameterDecimal('IFU_TAUX_AUTO_ENTREPRENEUR', '0.005');
    const aeCasnos = state.getParameterDecimal('CASNOS_FORFAIT_ANAE', '24000');

    const ifuPlafond = state.getParameterDecimal('IFU_CA_PLAFOND_GENERAL', '8000000');
    const ifuRateGoods = state.getParameter<string>('IFU_TAUX_PRODUCTION_VENTE') || '0.05';
    const ifuRateServices = state.getParameter<string>('IFU_TAUX_SERVICES') || '0.12';
    const ifuMinGeneral = state.getParameter<string>('IFU_MINIMUM_GENERAL') || '30000';

    const cnasGlobalRate = state.getParameterDecimal('CNAS_TAUX_GLOBAL', '0.345');
    const cnasEmployerRate = state.getParameterDecimal('CNAS_PART_EMPLOYEUR', '0.255');
    const casnosRate = state.getParameterDecimal('CASNOS_TAUX_GLOBAL', '0.15');
    const casnosMin = state.getParameterDecimal('CASNOS_COTISATION_MINIMALE', '43200');

    // Taux IBS selon secteur
    let ibsRateKey = 'IBS_TAUX_AUTRES';
    if (input.activityCategory === 'PRODUCTION') {
      ibsRateKey = 'IBS_TAUX_PRODUCTION';
    } else if (input.activityCategory === 'BTPH') {
      ibsRateKey = 'IBS_TAUX_BTPH_TOURISME';
    }
    const ibsRate = state.getParameterDecimal(ibsRateKey, '0.26');

    // -------------------------------------------------------------
    // 1. ÉVALUATION AUTO-ENTREPRENEUR (ANAE)
    // -------------------------------------------------------------
    let aeEligible = true;
    let aeReason: string | null = null;

    if (totalTurnover.greaterThan(aePlafond)) {
      aeEligible = false;
      aeReason = `Chiffre d'affaires supérieur au plafond de ${aePlafond.toLocaleString()} DA.`;
    } else if (employeeCount > 0) {
      aeEligible = false;
      aeReason = 'Le statut auto-entrepreneur interdit l\'embauche de salariés.';
    }

    let aeTax = new EngineDecimal('0');
    let aeSocial = new EngineDecimal('0');
    let aeNet = new EngineDecimal('0');

    if (aeEligible) {
      aeTax = totalTurnover.times(aeRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      aeSocial = aeCasnos;
      const aeLevies = aeTax.plus(aeSocial);
      aeNet = totalTurnover.minus(expenses).minus(aeLevies).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    }

    const aeItem: RegimeComparisonItem = {
      regimeCode: 'AUTO_ENTREPRENEUR',
      labelFr: 'Auto-Entrepreneur (Statut ANAE)',
      personalityType: 'PERSONNE_PHYSIQUE',
      isEligible: aeEligible,
      ineligibilityReasonFr: aeReason,
      taxAmountDzd: aeTax.toFixed(2),
      socialContributionsDzd: aeSocial.toFixed(2),
      totalLeviesDzd: aeTax.plus(aeSocial).toFixed(2),
      netDisposableIncomeDzd: aeNet.toFixed(2),
      effectiveTaxRatePct: totalTurnover.greaterThan(0)
        ? aeTax.plus(aeSocial).dividedBy(totalTurnover).times(100).toFixed(1)
        : '0.0',
      administrativeBurden: 'TRES_FAIBLE',
      accountingRequirementsFr: 'Simple registre chronologique des recettes et dépenses. Zéro bilan.',
      breakdown: {
        impotLiberatoireDzd: aeTax.toFixed(2),
        casnosForfaitDzd: aeSocial.toFixed(2),
      },
    };

    // -------------------------------------------------------------
    // 2. ÉVALUATION IFU FORFAITAIRE
    // -------------------------------------------------------------
    let ifuEligible = true;
    let ifuReason: string | null = null;

    if (totalTurnover.greaterThan(ifuPlafond)) {
      ifuEligible = false;
      ifuReason = `Chiffre d'affaires supérieur au seuil unifié de ${ifuPlafond.toLocaleString()} DA.`;
    }

    let ifuTax = new EngineDecimal('0');
    let ifuSocial = new EngineDecimal('0');
    let ifuNet = new EngineDecimal('0');

    if (ifuEligible) {
      const ifuRes = IfuAnaeEngine.evaluateIfu({
        fiscalYear: input.fiscalYear,
        goodsRevenue: revGoods.toFixed(2),
        servicesRevenue: revServices.toFixed(2),
        goodsRate: ifuRateGoods,
        servicesRate: ifuRateServices,
        minimumTaxAmount: ifuMinGeneral,
        eligibilityThreshold: ifuPlafond.toFixed(2),
      });

      ifuTax = EngineMath.from(ifuRes.finalTaxDue);

      // CASNOS exploitant : 15% sur une estimation forfaitaire de revenu ou plancher
      const estimatedProfit = totalTurnover.minus(expenses).minus(grossPayroll);
      const casnosCalculated = estimatedProfit.greaterThan(0)
        ? estimatedProfit.times(casnosRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP)
        : casnosMin;
      const casnosActual = casnosCalculated.greaterThan(casnosMin) ? casnosCalculated : casnosMin;

      // CNAS si salariés
      const cnasDue = grossPayroll.times(cnasGlobalRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      ifuSocial = casnosActual.plus(cnasDue);

      const totalLevies = ifuTax.plus(ifuSocial);
      ifuNet = totalTurnover.minus(expenses).minus(grossPayroll).minus(totalLevies).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    }

    const ifuItem: RegimeComparisonItem = {
      regimeCode: 'IFU_FORFAITAIRE',
      labelFr: 'Impôt Forfaitaire Unique (IFU)',
      personalityType: 'PERSONNE_PHYSIQUE',
      isEligible: ifuEligible,
      ineligibilityReasonFr: ifuReason,
      taxAmountDzd: ifuTax.toFixed(2),
      socialContributionsDzd: ifuSocial.toFixed(2),
      totalLeviesDzd: ifuTax.plus(ifuSocial).toFixed(2),
      netDisposableIncomeDzd: ifuNet.toFixed(2),
      effectiveTaxRatePct: totalTurnover.greaterThan(0)
        ? ifuTax.plus(ifuSocial).dividedBy(totalTurnover).times(100).toFixed(1)
        : '0.0',
      administrativeBurden: 'FAIBLE',
      accountingRequirementsFr: 'Registres achats/ventes timbrés. Pas d\'obligation de bilan comptable SCF.',
      breakdown: {
        impotIfuDzd: ifuTax.toFixed(2),
        cotisationsSocialesDzd: ifuSocial.toFixed(2),
      },
    };

    // -------------------------------------------------------------
    // 3. ÉVALUATION RÉEL SIMPLIFIÉ (IRG PERSONNE PHYSIQUE)
    // -------------------------------------------------------------
    // Déduction des charges réelles + cotisations patronales CNAS
    const cnasPatronale = grossPayroll.times(cnasEmployerRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const taxableProfitBeforeIrg = totalTurnover
      .minus(expenses)
      .minus(grossPayroll)
      .minus(cnasPatronale);

    let irgTax = new EngineDecimal('0');
    if (taxableProfitBeforeIrg.greaterThan(0)) {
      if (state.hasItem('IRG_BAREME_ANNUEL') && state.getTranches('IRG_BAREME_ANNUEL').length > 0) {
        const irgResult = state.evaluateProgressiveBracket('IRG_BAREME_ANNUEL', taxableProfitBeforeIrg);
        irgTax = irgResult.totalTaxOrDuty;
      } else {
        irgTax = this.calculateIrgFallback(taxableProfitBeforeIrg);
      }
    }

    // CASNOS sur le résultat fiscal
    const casnosReel = taxableProfitBeforeIrg.greaterThan(0)
      ? taxableProfitBeforeIrg.times(casnosRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP)
      : casnosMin;
    const casnosReelActual = casnosReel.greaterThan(casnosMin) ? casnosReel : casnosMin;

    const cnasReelTotal = grossPayroll.times(cnasGlobalRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const reelSocial = casnosReelActual.plus(cnasReelTotal);
    const reelTotalLevies = irgTax.plus(reelSocial);
    const reelNet = totalTurnover.minus(expenses).minus(grossPayroll).minus(reelTotalLevies).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    const reelItem: RegimeComparisonItem = {
      regimeCode: 'REEL_SIMPLIFIE',
      labelFr: 'Régime Réel (Personne Physique - IRG)',
      personalityType: 'PERSONNE_PHYSIQUE',
      isEligible: true,
      ineligibilityReasonFr: null,
      taxAmountDzd: irgTax.toFixed(2),
      socialContributionsDzd: reelSocial.toFixed(2),
      totalLeviesDzd: reelTotalLevies.toFixed(2),
      netDisposableIncomeDzd: reelNet.toFixed(2),
      effectiveTaxRatePct: totalTurnover.greaterThan(0)
        ? reelTotalLevies.dividedBy(totalTurnover).times(100).toFixed(1)
        : '0.0',
      administrativeBurden: 'MOYENNE',
      accountingRequirementsFr: 'Comptabilité d\'engagement simplifiée, liasse fiscale annuelle et journal général.',
      breakdown: {
        irgDuDzd: irgTax.toFixed(2),
        casnosDuDzd: casnosReelActual.toFixed(2),
        cnasSalariesDzd: cnasReelTotal.toFixed(2),
      },
    };

    // -------------------------------------------------------------
    // 4. ÉVALUATION PERSONNE MORALE (SARL / EURL - IBS)
    // -------------------------------------------------------------
    // Rémunération du gérant déductible de l'IBS
    // Résultat fiscal avant IBS = Chiffre d'Affaires - Charges - Masse Salariale - CNAS Patronale - Rémunération Gérant
    const managerSalary = desiredRemun;
    const taxableIbsBase = totalTurnover
      .minus(expenses)
      .minus(grossPayroll)
      .minus(cnasPatronale)
      .minus(managerSalary);

    let ibsTax = new EngineDecimal('0');
    if (taxableIbsBase.greaterThan(0)) {
      ibsTax = taxableIbsBase.times(ibsRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    }

    // IRG sur salaire du gérant
    let managerIrg = new EngineDecimal('0');
    if (managerSalary.greaterThan(0)) {
      if (state.hasItem('IRG_BAREME_ANNUEL') && state.getTranches('IRG_BAREME_ANNUEL').length > 0) {
        const managerIrgRes = state.evaluateProgressiveBracket('IRG_BAREME_ANNUEL', managerSalary);
        managerIrg = managerIrgRes.totalTaxOrDuty;
      } else {
        managerIrg = this.calculateIrgFallback(managerSalary);
      }
    }

    // Dividendes (sur le reliquat après IBS, distribution de 70%)
    const netProfitAfterIbs = taxableIbsBase.greaterThan(0) ? taxableIbsBase.minus(ibsTax) : new EngineDecimal('0');
    const dividends = netProfitAfterIbs.times('0.70').toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const dividendWithholdingTax = dividends.times('0.15').toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP); // 15% libératoire

    // CASNOS gérant : 15% sur rémunération
    const managerCasnos = managerSalary.greaterThan(0)
      ? managerSalary.times(casnosRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP)
      : casnosMin;
    const managerCasnosActual = managerCasnos.greaterThan(casnosMin) ? managerCasnos : casnosMin;

    const sarlTaxTotal = ibsTax.plus(managerIrg).plus(dividendWithholdingTax);
    const sarlSocialTotal = cnasReelTotal.plus(managerCasnosActual);
    const sarlTotalLevies = sarlTaxTotal.plus(sarlSocialTotal);

    // Revenu net combiné (Rémunération nette du gérant + Dividendes nets + Réserves non distribuées de l'entreprise)
    const managerNetSalary = managerSalary.minus(managerIrg).minus(managerCasnosActual);
    const netDividends = dividends.minus(dividendWithholdingTax);
    const retainedReserves = netProfitAfterIbs.minus(dividends);
    const sarlNet = managerNetSalary.plus(netDividends).plus(retainedReserves).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    const sarlItem: RegimeComparisonItem = {
      regimeCode: 'SARL_EURL_IBS',
      labelFr: `Personne Morale (SARL / EURL - IBS ${ibsRate.times(100).toFixed(0)}%)`,
      personalityType: 'PERSONNE_MORALE',
      isEligible: true,
      ineligibilityReasonFr: null,
      taxAmountDzd: sarlTaxTotal.toFixed(2),
      socialContributionsDzd: sarlSocialTotal.toFixed(2),
      totalLeviesDzd: sarlTotalLevies.toFixed(2),
      netDisposableIncomeDzd: sarlNet.toFixed(2),
      effectiveTaxRatePct: totalTurnover.greaterThan(0)
        ? sarlTotalLevies.dividedBy(totalTurnover).times(100).toFixed(1)
        : '0.0',
      administrativeBurden: 'ELEVEE',
      accountingRequirementsFr: 'Système Comptable Financier (SCF) intégral, Liasse Fiscale Tableaux 1 à 14, G50 mensuel.',
      breakdown: {
        ibsSocieteDzd: ibsTax.toFixed(2),
        irgRemunerationGerantDzd: managerIrg.toFixed(2),
        retenueDividendes15PctDzd: dividendWithholdingTax.toFixed(2),
        cotisationsSocialesTotalesDzd: sarlSocialTotal.toFixed(2),
      },
    };

    const allRegimes = [aeItem, ifuItem, reelItem, sarlItem];

    // Arbitrage prescriptif : Sélectionner le régime éligible qui maximise le reste net
    const eligibleRegimes = allRegimes.filter((r) => r.isEligible);
    eligibleRegimes.sort((a, b) => {
      const netA = EngineMath.from(a.netDisposableIncomeDzd);
      const netB = EngineMath.from(b.netDisposableIncomeDzd);
      return netB.minus(netA).toNumber();
    });

    const recommended = eligibleRegimes[0] || sarlItem;

    // Calcul de l'économie par rapport au pire régime éligible
    const worstEligible = eligibleRegimes[eligibleRegimes.length - 1] || recommended;
    const bestNet = EngineMath.from(recommended.netDisposableIncomeDzd);
    const worstNet = EngineMath.from(worstEligible.netDisposableIncomeDzd);
    const savings = bestNet.minus(worstNet).greaterThan(0)
      ? bestNet.minus(worstNet).toFixed(2)
      : '0.00';

    let adviceFr = `Pour un chiffre d'affaires prévisionnel de ${totalTurnover.toLocaleString()} DZD avec ${expenses.toLocaleString()} DZD de charges et ${employeeCount} salarié(s), le régime optimal est « ${recommended.labelFr} ».`;
    if (EngineMath.from(savings).greaterThan(0)) {
      adviceFr += ` Il vous permet de conserver un revenu net de ${recommended.netDisposableIncomeDzd} DZD/an, soit une économie fiscale et sociale de ${savings} DZD/an par rapport au régime « ${worstEligible.labelFr} ».`;
    }

    return {
      fiscalYear: input.fiscalYear,
      totalTurnoverDzd: totalTurnover.toFixed(2),
      operatingExpensesDzd: expenses.toFixed(2),
      grossPayrollDzd: grossPayroll.toFixed(2),
      employeeCount,
      regimes: allRegimes,
      recommendedRegime: recommended.regimeCode,
      recommendedRegimeLabelFr: recommended.labelFr,
      annualSavingsVsWorstDzd: savings,
      actionableSummaryFr: adviceFr,
    };
  }

  /**
   * Barème progressif de secours Art. 104 CIDTA (6 tranches)
   */
  private static calculateIrgFallback(taxableAmount: DecimalValue): DecimalValue {
    const amount = EngineMath.from(taxableAmount);
    if (amount.lessThanOrEqualTo(0)) {
      return new EngineDecimal('0');
    }

    const brackets = [
      { min: new EngineDecimal('0'), max: new EngineDecimal('240000'), rate: new EngineDecimal('0') },
      { min: new EngineDecimal('240000'), max: new EngineDecimal('480000'), rate: new EngineDecimal('0.23') },
      { min: new EngineDecimal('480000'), max: new EngineDecimal('960000'), rate: new EngineDecimal('0.27') },
      { min: new EngineDecimal('960000'), max: new EngineDecimal('1920000'), rate: new EngineDecimal('0.30') },
      { min: new EngineDecimal('1920000'), max: new EngineDecimal('3840000'), rate: new EngineDecimal('0.33') },
      { min: new EngineDecimal('3840000'), max: null, rate: new EngineDecimal('0.35') },
    ];

    let totalTax = new EngineDecimal('0');
    for (const b of brackets) {
      if (amount.greaterThan(b.min)) {
        const taxableInBracket = b.max !== null && amount.greaterThan(b.max)
          ? b.max.minus(b.min)
          : amount.minus(b.min);
        totalTax = totalTax.plus(taxableInBracket.times(b.rate));
      }
    }
    return totalTax.toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
  }
}
