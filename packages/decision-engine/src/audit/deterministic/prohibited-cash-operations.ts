/**
 * AUD-07 : Interdictions Réglementaires de Règlements en Espèces par Nature d'Opération
 * 
 * RÈGLE FONDAMENTALE : Les interdictions sont des DONNÉES (définies dans le pack),
 * jamais codées en dur dans la logique de contrôle.
 * 
 * Exemples en données réglementaires :
 * - REAL_ESTATE_ACQUISITION : Acquisition de biens immobiliers (art. 207 LF 2025).
 * - BANK_COMMERCIAL_DEPOSIT : Versements directs d espèces sur comptes commerciaux tiers (Banque d Algérie).
 * - CUSTOMS_TAX_PAYMENT : Règlements des droits de douane et taxes portuaires.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export interface ProhibitedCashRule {
  operationNatureCode: string; // ex: 'REAL_ESTATE_ACQUISITION'
  labelFr: string;
  isAbsoluteProhibition: boolean; // Interdiction totale quel que soit le montant
  maxThresholdDzd?: DecimalValue | string; // Seuil maximal si tolérance partielle
  legalReference: string;
  severity: Severity;
}

export interface CashTransactionItem {
  transactionId: string;
  date: string;
  operationNatureCode: string;
  amountTtc: DecimalValue | string;
  paymentMethod: string; // ex: 'CASH', 'ESPECES'
  partnerName?: string;
  descriptionFr?: string;
}

export interface ProhibitedCashViolation {
  transactionId: string;
  date: string;
  operationNatureCode: string;
  amountTtc: string;
  violationReasonFr: string;
  legalReference: string;
  severity: Severity;
}

export interface ProhibitedCashAuditResult {
  hasProhibitedCashOperations: boolean;
  totalTransactionsAudited: number;
  violationsCount: number;
  violations: ProhibitedCashViolation[];
  totalProhibitedCashAmount: string;
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class ProhibitedCashOperationsAuditor {
  /**
   * Vérifie qu'aucune opération en espèces ne viole les interdictions sectorielles du pack
   */
  public static audit(
    transactions: CashTransactionItem[],
    rules: ProhibitedCashRule[],
    packVersion = 'DZ_AUDIT_2026_V1'
  ): ProhibitedCashAuditResult {
    const startTime = Date.now();
    const rulesMap = new Map<string, ProhibitedCashRule>();
    for (const r of rules) {
      rulesMap.set(r.operationNatureCode, r);
    }

    const violations: ProhibitedCashViolation[] = [];
    let totalProhibited = new EngineDecimal('0');

    // Filtrer les opérations réglées en espèces
    const cashTxList = transactions.filter((t) => {
      const pm = (t.paymentMethod ?? '').toUpperCase().trim();
      return pm === 'CASH' || pm === 'ESPECES';
    });

    for (const tx of cashTxList) {
      const rule = rulesMap.get(tx.operationNatureCode);
      if (!rule) continue;

      const amt = EngineMath.from(tx.amountTtc);

      if (rule.isAbsoluteProhibition) {
        violations.push({
          transactionId: tx.transactionId,
          date: tx.date,
          operationNatureCode: tx.operationNatureCode,
          amountTtc: amt.toFixed(2),
          violationReasonFr: `Règlement en espèces formellement prohibé pour la nature d opération "${rule.labelFr}".`,
          legalReference: rule.legalReference,
          severity: rule.severity,
        });
        totalProhibited = totalProhibited.plus(amt);
      } else if (rule.maxThresholdDzd) {
        const limit = EngineMath.from(rule.maxThresholdDzd);
        if (amt.greaterThan(limit)) {
          violations.push({
            transactionId: tx.transactionId,
            date: tx.date,
            operationNatureCode: tx.operationNatureCode,
            amountTtc: amt.toFixed(2),
            violationReasonFr: `Règlement en espèces de ${amt.toFixed(2)} DA excédant le plafond autorisé de ${limit.toFixed(2)} DA pour "${rule.labelFr}".`,
            legalReference: rule.legalReference,
            severity: rule.severity,
          });
          totalProhibited = totalProhibited.plus(amt);
        }
      }
    }

    const hasViolations = violations.length > 0;
    const outcome = hasViolations ? 'BLOCKED' : 'COMPLIANT';

    return {
      hasProhibitedCashOperations: hasViolations,
      totalTransactionsAudited: cashTxList.length,
      violationsCount: violations.length,
      violations,
      totalProhibitedCashAmount: totalProhibited.toFixed(2),
      trace: {
        ruleCode: 'AUDIT_07_PROHIBITED_CASH_OPERATIONS',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          cashTransactionsCount: cashTxList.length,
          rulesAppliedCount: rules.length,
          violationsCount: violations.length,
        },
        parametersRead: {
          rules: rules.map((r) => r.operationNatureCode),
        },
        legalRef: 'Lois de finances et réglementation monétaire Banque d Algérie',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: hasViolations,
        notes: hasViolations
          ? `${violations.length} opération(s) en espèces formellement prohibée(s) (montant total: ${totalProhibited.toFixed(2)} DA).`
          : 'Aucune violation des interdictions de paiement en espèces constatée.',
      },
      summaryFr: hasViolations
        ? `Alerte bloquante : ${violations.length} opération(s) en espèces interdite(s) identifiée(s) (${totalProhibited.toFixed(2)} DA au total).`
        : `Contrôle des interdits d espèces conforme (${cashTxList.length} transaction(s) vérifiée(s)).`,
    };
  }
}

