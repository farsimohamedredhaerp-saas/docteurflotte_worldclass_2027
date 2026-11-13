/**
 * Moteur de Contrôle et Suivi Budgétaire
 * 
 * Permet la comparaison systématique des prévisions budgétaires aux réalisations effectives
 * par centre de coût/profit, ligne de dépense ou de produit, et période calendaire :
 * - Calcul des écarts budgétaires (valeur absolue et pourcentage de réalisation).
 * - Prise en compte des engagements (commandes engagées non encore liquidées).
 * - Alertes automatiques de dépassement budgétaire avec seuil de tolérance configurable.
 * - Distinction stricte des impacts charges vs produits.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export type BudgetLineCategory = 'EXPENSE' | 'REVENUE' | 'INVESTMENT';

export interface BudgetLineDefinition {
  id: string;
  centerCode: string;
  lineItemCode: string;
  labelFr: string;
  category: BudgetLineCategory;
  period: string; // ex: '2026-Q1', '2026-M04', '2026-ANNUAL'
  budgetedAmount: DecimalValue | string;
  toleranceRatio?: DecimalValue | string; // ex: '0.10' pour tolérance de 10%
  isHardCeiling?: boolean; // Plafond infranchissable (bloquant)
}

export interface ActualRealization {
  centerCode: string;
  lineItemCode: string;
  period: string;
  actualAmount: DecimalValue | string;
  committedAmount?: DecimalValue | string; // Dépenses engagées
}

export interface BudgetVarianceItem {
  lineId: string;
  centerCode: string;
  lineItemCode: string;
  labelFr: string;
  category: BudgetLineCategory;
  period: string;
  budgetedAmount: string;
  actualAmount: string;
  committedAmount: string;
  totalConsumedAmount: string;
  varianceAmount: string; // Réalisé - Budgété
  realizationRatePercent: string;
  consumptionRatePercent: string;
  status: 'WITHIN_BUDGET' | 'APPROACHING_LIMIT' | 'OVER_BUDGET';
  isFavorable: boolean;
  severity: Severity;
  alertMessageFr?: string;
}

export interface BudgetControlReport {
  period: string;
  totalBudgeted: string;
  totalActual: string;
  totalCommitted: string;
  totalConsumed: string;
  netVariance: string;
  linesAnalyzed: number;
  linesOverBudgetCount: number;
  linesApproachingLimitCount: number;
  hasCriticalOverruns: boolean;
  items: BudgetVarianceItem[];
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class BudgetControlEngine {
  /**
   * Évalue le suivi budgétaire en confrontant le budget aux réalisations
   */
  public static evaluate(
    budgetLines: BudgetLineDefinition[],
    realizations: ActualRealization[],
    period: string,
    packVersion = 'DZ_MANAGEMENT_2026_V1'
  ): BudgetControlReport {
    const startTime = Date.now();
    // Indexer les réalisations par clé composite : centerCode|lineItemCode|period
    const actualsMap = new Map<string, { actual: DecimalValue; committed: DecimalValue }>();

    for (const r of realizations) {
      const key = `${r.centerCode}|${r.lineItemCode}|${r.period}`;
      actualsMap.set(key, {
        actual: EngineMath.from(r.actualAmount),
        committed: r.committedAmount ? EngineMath.from(r.committedAmount) : new EngineDecimal('0'),
      });
    }

    let sumBudgeted = new EngineDecimal('0');
    let sumActual = new EngineDecimal('0');
    let sumCommitted = new EngineDecimal('0');
    let sumConsumed = new EngineDecimal('0');

    const items: BudgetVarianceItem[] = [];
    let overBudgetCount = 0;
    let approachingLimitCount = 0;
    let hasCritical = false;

    // Filtrer les lignes correspondant à la période analysée
    const targetLines = budgetLines.filter((b) => b.period === period);

    for (const line of targetLines) {
      const budgeted = EngineMath.from(line.budgetedAmount);
      sumBudgeted = sumBudgeted.plus(budgeted);

      const key = `${line.centerCode}|${line.lineItemCode}|${line.period}`;
      const actualData = actualsMap.get(key) ?? {
        actual: new EngineDecimal('0'),
        committed: new EngineDecimal('0'),
      };

      const actual = actualData.actual;
      const committed = actualData.committed;
      const consumed = actual.plus(committed);

      sumActual = sumActual.plus(actual);
      sumCommitted = sumCommitted.plus(committed);
      sumConsumed = sumConsumed.plus(consumed);

      // Variance = actual - budgeted
      const variance = actual.minus(budgeted);

      // Taux de réalisation (actual / budgeted)
      const realizationRate = budgeted.isZero()
        ? new EngineDecimal('0')
        : EngineMath.divide(actual, budgeted, 'ERROR')!;

      // Taux de consommation globale (consumed / budgeted)
      const consumptionRate = budgeted.isZero()
        ? new EngineDecimal('0')
        : EngineMath.divide(consumed, budgeted, 'ERROR')!;

      const tolerance = line.toleranceRatio ? EngineMath.from(line.toleranceRatio) : new EngineDecimal('0.04');

      let status: 'WITHIN_BUDGET' | 'APPROACHING_LIMIT' | 'OVER_BUDGET' = 'WITHIN_BUDGET';
      let isFavorable = true;
      let severity = Severity.INFO;
      let alertMsg: string | undefined;

      if (line.category === 'EXPENSE' || line.category === 'INVESTMENT') {
        // Pour les charges : Réalisé > Budgété est défavorable (surcoût)
        isFavorable = actual.lessThanOrEqualTo(budgeted);

        if (consumed.greaterThan(budgeted)) {
          status = 'OVER_BUDGET';
          overBudgetCount++;
          const overrunPct = consumptionRate.minus(new EngineDecimal('1')).times(100).toFixed(1);

          if (line.isHardCeiling) {
            hasCritical = true;
            severity = Severity.BLOQUANT;
            alertMsg = `Dépassement de plafond infranchissable sur ${line.labelFr} (+${overrunPct}% par rapport au budget alloué).`;
          } else {
            severity = Severity.MAJEUR;
            alertMsg = `Dépassement budgétaire de ${variance.toFixed(2)} DA sur ${line.labelFr} (+${overrunPct}%).`;
          }
        } else if (consumed.greaterThan(budgeted.times(new EngineDecimal('1').minus(tolerance)))) {
          status = 'APPROACHING_LIMIT';
          approachingLimitCount++;
          severity = Severity.MINEUR;
          alertMsg = `Consommation budgétaire avancée (${consumptionRate.times(100).toFixed(1)}%) à l approche du plafond.`;
        }
      } else {
        // REVENUE : Réalisé < Budgété est défavorable (sous-performance)
        isFavorable = actual.greaterThanOrEqualTo(budgeted);

        if (actual.lessThan(budgeted.times(new EngineDecimal('1').minus(tolerance)))) {
          status = 'OVER_BUDGET'; // Sous-performance
          overBudgetCount++;
          severity = Severity.MAJEUR;
          const underPct = new EngineDecimal('1').minus(realizationRate).times(100).toFixed(1);
          alertMsg = `Sous-performance commerciale sur ${line.labelFr} : réalisé inférieur de ${underPct}% à l objectif.`;
        }
      }

      items.push({
        lineId: line.id,
        centerCode: line.centerCode,
        lineItemCode: line.lineItemCode,
        labelFr: line.labelFr,
        category: line.category,
        period: line.period,
        budgetedAmount: budgeted.toFixed(2),
        actualAmount: actual.toFixed(2),
        committedAmount: committed.toFixed(2),
        totalConsumedAmount: consumed.toFixed(2),
        varianceAmount: variance.toFixed(2),
        realizationRatePercent: realizationRate.times(100).toFixed(2),
        consumptionRatePercent: consumptionRate.times(100).toFixed(2),
        status,
        isFavorable,
        severity,
        alertMessageFr: alertMsg,
      });
    }

    const netVariance = sumActual.minus(sumBudgeted);
    const outcome = hasCritical ? 'BLOCKED' : overBudgetCount > 0 ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      period,
      totalBudgeted: sumBudgeted.toFixed(2),
      totalActual: sumActual.toFixed(2),
      totalCommitted: sumCommitted.toFixed(2),
      totalConsumed: sumConsumed.toFixed(2),
      netVariance: netVariance.toFixed(2),
      linesAnalyzed: targetLines.length,
      linesOverBudgetCount: overBudgetCount,
      linesApproachingLimitCount: approachingLimitCount,
      hasCriticalOverruns: hasCritical,
      items,
      trace: {
        ruleCode: 'BUDGET_CONTROL_EVALUATION',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          period,
          linesCount: targetLines.length,
          totalBudgeted: sumBudgeted.toFixed(2),
          totalActual: sumActual.toFixed(2),
        },
        parametersRead: {},
        legalRef: 'Normes de contrôle de gestion d entreprise / SCF',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: overBudgetCount > 0,
        notes: overBudgetCount > 0
          ? `${overBudgetCount} ligne(s) budgétaire(s) en dépassement ou sous-performance.`
          : 'Exécution budgétaire conforme aux prévisions.',
      },
      summaryFr: overBudgetCount > 0
        ? `Suivi budgétaire ${period} : ${overBudgetCount} ligne(s) en dépassement (écart net global : ${netVariance.toFixed(2)} DA).`
        : `Suivi budgétaire ${period} : enveloppe respectée (Consommé: ${sumConsumed.toFixed(2)} DA / Budget: ${sumBudgeted.toFixed(2)} DA).`,
    };
  }
}
