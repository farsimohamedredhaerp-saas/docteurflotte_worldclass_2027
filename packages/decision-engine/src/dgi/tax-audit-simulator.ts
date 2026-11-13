/**
 * Simulateur de Contrôle Fiscal & Calcul de Redressement par Impôt
 * 
 * RÈGLES FORMELLES CIDTA (art. 193 bis, 194, 195) & CPF :
 * 1. Calcul rigoureusement PAR IMPÔT :
 *    - Pour chaque impôt vérifié (TVA, IBS, TAP...) :
 *      Droits simples + Majoration d'assiette + Pénalités de retard.
 *    - Interdiction absolue d'appliquer un pourcentage forfaitaire global
 *      sur la somme cumulée des impôts.
 * 2. Restitution sous forme de FOURCHETTE (3 hypothèses de qualification) :
 *    - Fourchette basse : Présomption de bonne foi.
 *    - Fourchette médiane : Manquement délibéré constaté.
 *    - Fourchette haute : Manœuvres délibérées et graves irrégularités.
 */

import { EngineDecimal, DecimalValue } from '../math/decimal.js';

export type TaxAuditSeverityBracket = 'GOOD_FAITH' | 'DELIBERATE_FAILURE' | 'SERIOUS_IRREGULARITIES';

export interface TaxPenaltyGrid {
  goodFaithBasePenaltyRate: string;         // Majoration assiette bonne foi
  deliberateFailureBasePenaltyRate: string; // Majoration assiette manquement délibéré
  seriousIrregularitiesPenaltyRate: string; // Majoration assiette manœuvres délibérées
  monthlyLatePenaltyRate?: string;          // Pénalité de retard mensuelle
}

export interface TaxAdjustmentItemInput {
  taxType: 'TVA' | 'IBS' | 'TAP' | 'OTHER';
  label: string;
  omittedTaxBaseHt: string;                 // Base imposable omise ou réintégrée (HT)
  applicableRate: string;                   // Taux d'impôt applicable
  lateMonthsCount?: number;                 // Nombre de mois de retard
}

export interface SingleTaxAdjustmentResult {
  taxType: string;
  label: string;
  omittedTaxBaseHt: string;
  applicableRate: string;
  principalTaxDue: string;                  // Droits simples rappelés
  basePenaltyAmount: string;                // Majoration d'assiette
  latePenaltyAmount: string;                // Pénalités d'intérêts de retard
  totalAdjustmentForTax: string;            // Droits + Pénalités
}

export interface AuditBracketScenario {
  bracket: TaxAuditSeverityBracket;
  bracketLabel: string;
  totalPrincipalTaxDue: string;
  totalBasePenalties: string;
  totalLatePenalties: string;
  grandTotalAdjustment: string;
  taxesBreakdown: SingleTaxAdjustmentResult[];
}

export interface TaxAuditSimulationReport {
  fiscalYear: number;
  totalOmittedTaxBaseHt: string;
  totalPrincipalTaxDue: string;
  lowBracket: AuditBracketScenario;    // Bonne foi
  mediumBracket: AuditBracketScenario; // Manquement délibéré
  highBracket: AuditBracketScenario;   // Manœuvres délibérées
  legalReferences: string[];
}

export class TaxAuditSimulator {
  /**
   * Simule un redressement fiscal par impôt avec fourchettes d'évaluation légale
   */
  public static simulate(
    fiscalYear: number,
    items: TaxAdjustmentItemInput[],
    penaltyGrid: TaxPenaltyGrid
  ): TaxAuditSimulationReport {
    if (items.length === 0) {
      throw new Error(`Au moins un chef de redressement est requis pour la simulation.`);
    }

    let sumOmittedBase = new EngineDecimal('0');
    let sumPrincipal = new EngineDecimal('0');

    for (const it of items) {
      const base = new EngineDecimal(it.omittedTaxBaseHt);
      const rate = new EngineDecimal(it.applicableRate);
      const principal = base.times(rate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

      sumOmittedBase = sumOmittedBase.plus(base);
      sumPrincipal = sumPrincipal.plus(principal);
    }

    // Calcul pour chaque tranche de sévérité
    const low = this.computeBracketScenario('GOOD_FAITH', 'Hypothèse Basse : Bonne foi démontrée', items, penaltyGrid);
    const med = this.computeBracketScenario('DELIBERATE_FAILURE', 'Hypothèse Médiane : Manquement délibéré', items, penaltyGrid);
    const high = this.computeBracketScenario('SERIOUS_IRREGULARITIES', 'Hypothèse Haute : Manœuvres et irrégularités caractérisées', items, penaltyGrid);

    return {
      fiscalYear,
      totalOmittedTaxBaseHt: sumOmittedBase.toFixed(2),
      totalPrincipalTaxDue: sumPrincipal.toFixed(2),
      lowBracket: low,
      mediumBracket: med,
      highBracket: high,
      legalReferences: [
        'Art. 193 bis CIDTA (Grille des pénalités d assiette et majorations)',
        'Art. 194 CIDTA (Intérêts de retard liquidés mensuellement)',
        'Art. 43 CPF (Procédure contradictoire et garanties du contribuable)',
      ],
    };
  }

  private static computeBracketScenario(
    bracket: TaxAuditSeverityBracket,
    bracketLabel: string,
    items: TaxAdjustmentItemInput[],
    penaltyGrid: TaxPenaltyGrid
  ): AuditBracketScenario {
    let penaltyRateStr = penaltyGrid.goodFaithBasePenaltyRate;
    if (bracket === 'DELIBERATE_FAILURE') {
      penaltyRateStr = penaltyGrid.deliberateFailureBasePenaltyRate;
    } else if (bracket === 'SERIOUS_IRREGULARITIES') {
      penaltyRateStr = penaltyGrid.seriousIrregularitiesPenaltyRate;
    }

    const basePenaltyRate = new EngineDecimal(penaltyRateStr);
    const lateRate = new EngineDecimal(penaltyGrid.monthlyLatePenaltyRate || '0');

    let sumPrincipal = new EngineDecimal('0');
    let sumBasePenalties = new EngineDecimal('0');
    let sumLatePenalties = new EngineDecimal('0');
    let sumTotal = new EngineDecimal('0');

    const breakdown: SingleTaxAdjustmentResult[] = [];

    for (const it of items) {
      const base = new EngineDecimal(it.omittedTaxBaseHt);
      const rate = new EngineDecimal(it.applicableRate);
      const principal = base.times(rate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

      // Pénalité d'assiette = Droits simples * taux de majoration du barème
      const basePenalty = principal.times(basePenaltyRate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

      // Pénalité de retard = Droits simples * taux mensuel * nombre de mois
      const months = it.lateMonthsCount || 0;
      const latePenalty = principal.times(lateRate).times(new EngineDecimal(months)).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

      const totalForTax = principal.plus(basePenalty).plus(latePenalty);

      sumPrincipal = sumPrincipal.plus(principal);
      sumBasePenalties = sumBasePenalties.plus(basePenalty);
      sumLatePenalties = sumLatePenalties.plus(latePenalty);
      sumTotal = sumTotal.plus(totalForTax);

      breakdown.push({
        taxType: it.taxType,
        label: it.label,
        omittedTaxBaseHt: base.toFixed(2),
        applicableRate: it.applicableRate,
        principalTaxDue: principal.toFixed(2),
        basePenaltyAmount: basePenalty.toFixed(2),
        latePenaltyAmount: latePenalty.toFixed(2),
        totalAdjustmentForTax: totalForTax.toFixed(2),
      });
    }

    return {
      bracket,
      bracketLabel,
      totalPrincipalTaxDue: sumPrincipal.toFixed(2),
      totalBasePenalties: sumBasePenalties.toFixed(2),
      totalLatePenalties: sumLatePenalties.toFixed(2),
      grandTotalAdjustment: sumTotal.toFixed(2),
      taxesBreakdown: breakdown,
    };
  }
}

