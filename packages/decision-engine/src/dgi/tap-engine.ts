/**
 * Moteur de Taxe sur l'Activité Professionnelle (TAP) — Règles Historiques & Prescription
 * 
 * RÈGLES FORMELLES :
 * - Abrogation définitive au 01/01/2024 (Loi de Finances 2024 art. 14).
 * - Tout exercice ou opération postérieur ou égal au 01/01/2024 donne une TAP de 0.00 DA.
 * - Pour les exercices antérieurs non prescrits (< 2024-01-01, délai de reprise quadriennal art. 39 CPF),
 *   application du taux historique et des réfactions sectorielles (BTPH, production).
 */

import { EngineDecimal, DecimalValue } from '../math/decimal.js';

export interface TapEvaluationInput {
  operationDate: string;           // YYYY-MM-DD
  turnoverHt: string;              // Chiffre d'affaires HT imposable
  historicalRate?: string;         // Taux historique issu du pack
  allowanceRate?: string;          // Réfaction sectorielle (ex: réfaction pour production/BTPH)
}

export interface TapEvaluationResult {
  operationDate: string;
  isAbrogated: boolean;            // Vrai si opération >= 2024-01-01
  taxableTurnover: string;
  appliedRate: string;
  allowanceApplied: string;
  tapAmount: string;
  legalNotice: string;
}

export class TapEngine {
  public static readonly ABROGATION_DATE = '2024-01-01';

  /**
   * Calcule la TAP applicable à une date d'opération
   */
  public static evaluate(input: TapEvaluationInput): TapEvaluationResult {
    const isAbrogated = input.operationDate >= this.ABROGATION_DATE;
    const turnover = new EngineDecimal(input.turnoverHt);

    if (isAbrogated) {
      return {
        operationDate: input.operationDate,
        isAbrogated: true,
        taxableTurnover: turnover.toFixed(2),
        appliedRate: '0.000000',
        allowanceApplied: '0.00 %',
        tapAmount: '0.00',
        legalNotice: 'TAP abrogée au 1er janvier 2024 (art. 14 Loi de Finances 2024). Montant strictement nul.',
      };
    }

    // Calcul historique pour exercices antérieurs non prescrits
    const baseRate = new EngineDecimal(input.historicalRate || '0');
    const allowance = new EngineDecimal(input.allowanceRate || '0');

    // Assiette après réfaction : CA * (1 - réfaction)
    const taxableBase = turnover.times(new EngineDecimal('1').minus(allowance)).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const tapAmount = taxableBase.times(baseRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const allowancePct = allowance.times(new EngineDecimal('100')).toFixed(2);

    return {
      operationDate: input.operationDate,
      isAbrogated: false,
      taxableTurnover: taxableBase.toFixed(2),
      appliedRate: baseRate.toFixed(6),
      allowanceApplied: `${allowancePct} %`,
      tapAmount: tapAmount.toFixed(2),
      legalNotice: 'Exercice antérieur au 01/01/2024 soumis à la TAP historique (délai de reprise quadriennal art. 39 CPF).',
    };
  }
}

