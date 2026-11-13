/**
 * Moteur d'Impôt sur les Bénéfices des Sociétés (IBS) — Multi-activités & Déductions
 * 
 * RÈGLES FORMELLES CIDTA / LFC 2015 :
 * 1. Multi-activités :
 *    - Si comptabilité séparée : imposition de chaque segment d'activité à son taux propre.
 *      Les réintégrations et déductions spécifiques sont affectées directement à leur segment d'origine.
 *    - Sans comptabilité séparée : application obligatoire du taux le plus élevé (taux de repli)
 *      sur l'intégralité du résultat fiscal global.
 * 2. Acomptes provisionnels & Solde de liquidation :
 *    - 3 acomptes prévisionnels calculés sur l'exercice N-1.
 *    - Solde de liquidation = IBS Définitif - Total Acomptes versés.
 */

import { EngineDecimal, DecimalValue } from '../math/decimal.js';

export interface ActivitySegmentInput {
  segmentCode: string;
  label: string;
  taxRate: string;                  // Taux applicable au segment selon le pack
  accountingResult: string;         // Résultat comptable avant impôt du segment
  specificReintegrations?: string;  // Réintégrations extra-comptables affectées à ce segment
  specificDeductions?: string;      // Déductions fiscales affectées à ce segment
  revenue?: string;                 // Chiffre d'affaires du segment
}

export interface MultiActivityIbsInput {
  fiscalYear: number;
  hasSeparateAccounting: boolean;
  defaultFallbackRate: string;      // Taux le plus élevé issu du pack
  segments: ActivitySegmentInput[];
  commonReintegrations?: string;    // Réintégrations communes à répartir au prorata du CA
  commonDeductions?: string;        // Déductions communes à répartir au prorata du CA
  priorYearIbs?: string;            // IBS de l'exercice N-1 (pour calcul des 3 acomptes)
  advancesPaid?: string;            // Acomptes provisionnels déjà versés
}

export interface SegmentIbsResult {
  segmentCode: string;
  label: string;
  taxRate: string;
  accountingResult: string;
  allocatedReintegrations: string;
  allocatedDeductions: string;
  taxableResult: string;            // Résultat fiscal net
  ibsAmount: string;                // Montant d'IBS dû pour le segment
}

export interface MultiActivityIbsEvaluation {
  fiscalYear: number;
  hasSeparateAccounting: boolean;
  effectiveRateRule: string;
  totalTaxableResult: string;
  totalIbsDue: string;
  penaltyExcessIbs: string;         // Surcoût d'IBS dû à l'absence de comptabilité séparée
  segmentDetails: SegmentIbsResult[];
  firstAdvanceDue: string;          // 1er acompte (30% de N-1)
  secondAdvanceDue: string;         // 2ème acompte (30% de N-1)
  thirdAdvanceDue: string;          // 3ème acompte (30% de N-1)
  liquidationBalance: string;       // Solde de liquidation restant à payer (ou crédit d'impôt si négatif)
}

export class IbsEngine {
  /**
   * Évalue l'IBS en régime multi-activités selon la conformité de la comptabilité
   */
  public static evaluate(input: MultiActivityIbsInput): MultiActivityIbsEvaluation {
    if (input.segments.length === 0) {
      throw new Error(`Au moins un segment d'activité est requis pour le calcul de l'IBS.`);
    }

    // Calcul du CA total pour la clé de répartition des charges/produits communs
    let totalRevenue = new EngineDecimal('0');
    for (const seg of input.segments) {
      if (seg.revenue) {
        totalRevenue = totalRevenue.plus(new EngineDecimal(seg.revenue));
      }
    }

    const commonReint = new EngineDecimal(input.commonReintegrations || '0');
    const commonDed = new EngineDecimal(input.commonDeductions || '0');

    let totalSeparatedIbs = new EngineDecimal('0');
    let totalTaxableResultSum = new EngineDecimal('0');
    const segmentDetails: SegmentIbsResult[] = [];

    // 1. Calcul avec comptabilité séparée segment par segment
    for (const seg of input.segments) {
      const segAccRes = new EngineDecimal(seg.accountingResult);
      let segReint = new EngineDecimal(seg.specificReintegrations || '0');
      let segDed = new EngineDecimal(seg.specificDeductions || '0');

      // Répartition au prorata du CA si charges/produits communs
      if (totalRevenue.greaterThan(0) && seg.revenue) {
        const segRev = new EngineDecimal(seg.revenue);
        const ratio = segRev.dividedBy(totalRevenue);
        segReint = segReint.plus(commonReint.times(ratio));
        segDed = segDed.plus(commonDed.times(ratio));
      }

      // Résultat fiscal = Résultat comptable + Réintégrations - Déductions
      const taxableRes = segAccRes.plus(segReint).minus(segDed).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      totalTaxableResultSum = totalTaxableResultSum.plus(taxableRes);

      const rate = new EngineDecimal(seg.taxRate);
      let segIbs = new EngineDecimal('0');
      if (taxableRes.greaterThan(0)) {
        segIbs = taxableRes.times(rate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      }

      totalSeparatedIbs = totalSeparatedIbs.plus(segIbs);

      segmentDetails.push({
        segmentCode: seg.segmentCode,
        label: seg.label,
        taxRate: seg.taxRate,
        accountingResult: segAccRes.toFixed(2),
        allocatedReintegrations: segReint.toFixed(2),
        allocatedDeductions: segDed.toFixed(2),
        taxableResult: taxableRes.toFixed(2),
        ibsAmount: segIbs.toFixed(2),
      });
    }

    // 2. Application de la règle de sanction en l'absence de comptabilité séparée
    let totalIbsDue = totalSeparatedIbs;
    let penaltyExcessIbs = new EngineDecimal('0');
    let effectiveRateRule = 'COMPTABILITE_SEPAREE_CONFORME';

    if (!input.hasSeparateAccounting) {
      effectiveRateRule = 'SANCTION_TAUX_MAX_NON_SEPARE';
      const fallbackRate = new EngineDecimal(input.defaultFallbackRate);
      if (totalTaxableResultSum.greaterThan(0)) {
        totalIbsDue = totalTaxableResultSum.times(fallbackRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      } else {
        totalIbsDue = new EngineDecimal('0');
      }
      penaltyExcessIbs = totalIbsDue.minus(totalSeparatedIbs).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    }

    // 3. Calcul des acomptes provisionnels et solde de liquidation
    const priorYear = new EngineDecimal(input.priorYearIbs || '0');
    // Chaque acompte légal = 30% de l'IBS N-1 (ratio 3/10)
    const advanceRatio = new EngineDecimal('3').dividedBy(new EngineDecimal('10'));
    const advanceDue = priorYear.times(advanceRatio).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    const advancesPaid = new EngineDecimal(input.advancesPaid || '0');
    const liquidationBalance = totalIbsDue.minus(advancesPaid).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    return {
      fiscalYear: input.fiscalYear,
      hasSeparateAccounting: input.hasSeparateAccounting,
      effectiveRateRule,
      totalTaxableResult: totalTaxableResultSum.toFixed(2),
      totalIbsDue: totalIbsDue.toFixed(2),
      penaltyExcessIbs: penaltyExcessIbs.toFixed(2),
      segmentDetails,
      firstAdvanceDue: advanceDue.toFixed(2),
      secondAdvanceDue: advanceDue.toFixed(2),
      thirdAdvanceDue: advanceDue.toFixed(2),
      liquidationBalance: liquidationBalance.toFixed(2),
    };
  }
}
