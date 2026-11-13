/**
 * Moteur de Taxe sur la Valeur Ajoutée (TVA) — Prorata & Régularisation Quinquennale
 * 
 * RÈGLES FORMELLES CIDTA (art. 38 & 38 bis) :
 * 1. Prorata de déduction pour assujettis partiels :
 *    P = CA avec droit à déduction / (CA avec droit + CA sans droit).
 *    TVA déductible sur frais généraux = TVA brute * P.
 * 2. Régularisation quinquennale des immobilisations :
 *    Surveillance sur 5 ans. En cas de cession non soumise avant l'expiration des 5 ans,
 *    reversement de 1/5ème de la taxe déduite par année ou fraction d'année restante.
 * 3. Crédit de TVA et remboursement.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal.js';

export interface TvaProrataInput {
  fiscalYear: number;
  taxableRevenue: string;           // CA ouvrant droit à déduction (TTC ou HT selon doctrine)
  exemptRevenueWithoutRight: string;// CA sans droit à déduction
  commonExpensesTva: string;        // TVA brute payée sur frais généraux / dépenses mixtes
}

export interface TvaProrataEvaluation {
  fiscalYear: number;
  taxableRevenue: string;
  exemptRevenue: string;
  totalTurnover: string;
  prorataRate: string;              // Taux de prorata P (ex: '0.8000')
  prorataPercentage: string;        // P en pourcentage (ex: '80.00 %')
  deductibleTva: string;            // TVA déductible = T * P
  nonDeductibleTva: string;         // TVA non déductible = T * (1 - P) (charge)
}

export interface QuinquennialAdjustmentInput {
  assetId: string;
  label: string;
  acquisitionYear: number;
  initialDeductedTva: string;       // Montant de TVA initialement déduit à l'acquisition
  disposalYear: number;             // Année de cession ou de changement d'affectation
  isDisposalExempt: boolean;        // Cession non soumise à TVA ou transfert à secteur exonéré
}

export interface QuinquennialAdjustmentEvaluation {
  assetId: string;
  label: string;
  acquisitionYear: number;
  disposalYear: number;
  elapsedYearsCount: number;        // Années d'utilisation (inclusif)
  remainingYearsCount: number;      // Années restantes soumises à reversement (max 5)
  initialDeductedTva: string;
  reversalRatio: string;            // Fraction de reversement (ex: '2/5' ou '0.40')
  reversalTvaAmount: string;        // Montant de TVA à reverser au Trésor
  isAdjustmentRequired: boolean;
}

export class TvaEngine {
  /**
   * Calcule le prorata de déduction annuel pour un assujetti partiel
   */
  public static computeAnnualProrata(input: TvaProrataInput): TvaProrataEvaluation {
    const taxable = new EngineDecimal(input.taxableRevenue);
    const exempt = new EngineDecimal(input.exemptRevenueWithoutRight);
    const commonTva = new EngineDecimal(input.commonExpensesTva);

    const totalRev = taxable.plus(exempt);
    if (totalRev.isZero()) {
      return {
        fiscalYear: input.fiscalYear,
        taxableRevenue: taxable.toFixed(2),
        exemptRevenue: exempt.toFixed(2),
        totalTurnover: '0.00',
        prorataRate: '0.000000',
        prorataPercentage: '0.00 %',
        deductibleTva: '0.00',
        nonDeductibleTva: commonTva.toFixed(2),
      };
    }

    // Prorata P = Taxable / Total
    const p = EngineMath.divide(taxable, totalRev, 'ERROR')!;
    const pBounded = p.greaterThan(1) ? new EngineDecimal('1') : (p.isNegative() ? new EngineDecimal('0') : p);

    const deductible = commonTva.times(pBounded).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const nonDeductible = commonTva.minus(deductible).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    const percentage = pBounded.times(new EngineDecimal('100')).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    return {
      fiscalYear: input.fiscalYear,
      taxableRevenue: taxable.toFixed(2),
      exemptRevenue: exempt.toFixed(2),
      totalTurnover: totalRev.toFixed(2),
      prorataRate: pBounded.toFixed(6),
      prorataPercentage: `${percentage.toFixed(2)} %`,
      deductibleTva: deductible.toFixed(2),
      nonDeductibleTva: nonDeductible.toFixed(2),
    };
  }

  /**
   * Calcule la régularisation quinquennale lors de la cession d'une immobilisation (art. 38 bis)
   */
  public static computeQuinquennialAdjustment(
    input: QuinquennialAdjustmentInput
  ): QuinquennialAdjustmentEvaluation {
    const initialTva = new EngineDecimal(input.initialDeductedTva);
    const totalSurveillanceYears = 5;

    // Calcul du nombre d'années écoulées (l'année d'acquisition compte pour 1 année entière)
    const elapsed = input.disposalYear - input.acquisitionYear + 1;

    let remaining = 0;
    let isRequired = false;
    let reversalAmount = new EngineDecimal('0');
    let ratioStr = '0/5';

    if (input.isDisposalExempt && elapsed > 0 && elapsed <= totalSurveillanceYears) {
      // Les années restantes sont celles qui n'ont pas encore été couvertes
      remaining = totalSurveillanceYears - elapsed;
      if (remaining > 0) {
        isRequired = true;
        ratioStr = `${remaining}/${totalSurveillanceYears}`;
        const ratioDec = new EngineDecimal(remaining).dividedBy(new EngineDecimal(totalSurveillanceYears));
        reversalAmount = initialTva.times(ratioDec).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      }
    }

    return {
      assetId: input.assetId,
      label: input.label,
      acquisitionYear: input.acquisitionYear,
      disposalYear: input.disposalYear,
      elapsedYearsCount: Math.max(0, elapsed),
      remainingYearsCount: remaining,
      initialDeductedTva: initialTva.toFixed(2),
      reversalRatio: ratioStr,
      reversalTvaAmount: reversalAmount.toFixed(2),
      isAdjustmentRequired: isRequired,
    };
  }
}

