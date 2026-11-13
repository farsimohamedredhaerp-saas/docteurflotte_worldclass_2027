/**
 * Moteur des Régimes Forfaitaires — IFU & Auto-Entrepreneur (ANAE)
 * 
 * RÈGLES FORMELLES CIDTA & STATUT AUTO-ENTREPRENEUR :
 * - IFU : imposition sur le chiffre d'affaires annuel selon barèmes du pack (vente vs services).
 *   Application du minimum fiscal d'imposition.
 *   Surveillance du seuil d'éligibilité : dépassement entraîne la bascule obligatoire au réel.
 * - ANAE : imposition simplifiée sur déclaration de CA. Surveillance des plafonds d'exclusion.
 */

import { EngineDecimal, DecimalValue } from '../math/decimal.js';

export interface IfuEvaluationInput {
  fiscalYear: number;
  goodsRevenue: string;             // CA Vente de biens & production
  servicesRevenue: string;          // CA Prestations de services
  goodsRate: string;                // Taux vente issu du pack
  servicesRate: string;             // Taux services issu du pack
  minimumTaxAmount: string;         // Minimum légal annuel d'imposition
  eligibilityThreshold: string;     // Plafond de CA pour maintien à l'IFU
}

export interface IfuEvaluationResult {
  fiscalYear: number;
  totalTurnover: string;
  calculatedGoodsTax: string;
  calculatedServicesTax: string;
  totalCalculatedTax: string;
  minimumTaxApplied: boolean;
  finalTaxDue: string;
  isEligible: boolean;
  mustSwitchToReal: boolean;
  thresholdExceededBy: string;
}

export interface AnaeEvaluationInput {
  fiscalYear: number;
  declaredTurnover: string;         // Chiffre d'affaires déclaré
  activityCategory: 'SERVICES' | 'COMMERCE';
  flatTaxRate: string;              // Taux unique forfaitaire issu du pack
  minimumTaxAmount: string;         // Minimum légal d'imposition
  turnoverCeiling: string;          // Plafond d'éligibilité selon catégorie
}

export interface AnaeEvaluationResult {
  fiscalYear: number;
  declaredTurnover: string;
  calculatedTax: string;
  finalTaxDue: string;
  isEligible: boolean;
  mustSwitchToGeneralRegime: boolean;
  ceilingExceededBy: string;
}

export class IfuAnaeEngine {
  /**
   * Évalue la déclaration et l'éligibilité au régime IFU
   */
  public static evaluateIfu(input: IfuEvaluationInput): IfuEvaluationResult {
    const goodsRev = new EngineDecimal(input.goodsRevenue);
    const servRev = new EngineDecimal(input.servicesRevenue);
    const totalRev = goodsRev.plus(servRev);

    const gRate = new EngineDecimal(input.goodsRate);
    const sRate = new EngineDecimal(input.servicesRate);
    const minTax = new EngineDecimal(input.minimumTaxAmount);
    const threshold = new EngineDecimal(input.eligibilityThreshold);

    // Calcul par segment
    const goodsTax = goodsRev.times(gRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const servTax = servRev.times(sRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const totalCalc = goodsTax.plus(servTax).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    let finalDue = totalCalc;
    let minApplied = false;

    // Minimum d'imposition
    if (finalDue.lessThan(minTax)) {
      finalDue = minTax;
      minApplied = true;
    }

    // Contrôle d'éligibilité et de sortie
    const isEligible = totalRev.lessThanOrEqualTo(threshold);
    const mustSwitch = !isEligible;
    const excess = mustSwitch ? totalRev.minus(threshold).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP) : new EngineDecimal('0');

    return {
      fiscalYear: input.fiscalYear,
      totalTurnover: totalRev.toFixed(2),
      calculatedGoodsTax: goodsTax.toFixed(2),
      calculatedServicesTax: servTax.toFixed(2),
      totalCalculatedTax: totalCalc.toFixed(2),
      minimumTaxApplied: minApplied,
      finalTaxDue: finalDue.toFixed(2),
      isEligible,
      mustSwitchToReal: mustSwitch,
      thresholdExceededBy: excess.toFixed(2),
    };
  }

  /**
   * Évalue la déclaration et l'éligibilité au régime Auto-Entrepreneur (ANAE)
   */
  public static evaluateAnae(input: AnaeEvaluationInput): AnaeEvaluationResult {
    const turnover = new EngineDecimal(input.declaredTurnover);
    const rate = new EngineDecimal(input.flatTaxRate);
    const minTax = new EngineDecimal(input.minimumTaxAmount);
    const ceiling = new EngineDecimal(input.turnoverCeiling);

    let calcTax = turnover.times(rate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    let finalDue = calcTax;

    if (finalDue.lessThan(minTax)) {
      finalDue = minTax;
    }

    const isEligible = turnover.lessThanOrEqualTo(ceiling);
    const mustSwitch = !isEligible;
    const excess = mustSwitch ? turnover.minus(ceiling).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP) : new EngineDecimal('0');

    return {
      fiscalYear: input.fiscalYear,
      declaredTurnover: turnover.toFixed(2),
      calculatedTax: calcTax.toFixed(2),
      finalTaxDue: finalDue.toFixed(2),
      isEligible,
      mustSwitchToGeneralRegime: mustSwitch,
      ceilingExceededBy: excess.toFixed(2),
    };
  }
}

