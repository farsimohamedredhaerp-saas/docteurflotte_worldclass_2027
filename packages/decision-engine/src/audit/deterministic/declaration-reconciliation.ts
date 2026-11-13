/**
 * AUD-04 : Cadrage Déclaratif Déterministe (Rapprochement G50 & Fait Générateur)
 * 
 * Spécifications formelles :
 * 1. Montants réellement déposés saisis ou importés (declaration_filed, sans connexion externe Jibayatic).
 * 2. Base attendue ajustée du fait générateur (débit pour livraisons, encaissement pour services/BTPH).
 * 3. Tolérance en paramètre (ex: tolérance 100 DA).
 * 4. Règle de décision :
 *    - Écart > Tolérance -> Alerte d audit
 *    - Écart <= Tolérance -> Conforme (rien)
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export type TaxType = 'TVA' | 'TAP' | 'IBS_ACOMPTE' | 'IRG_SALAIRES';

export interface FiledTaxDeclaration {
  declarationId: string;
  taxType: TaxType;
  period: string; // ex: '2026-M03'
  filedDate: string; // YYYY-MM-DD
  filedBaseAmount: DecimalValue | string;
  filedTaxAmount: DecimalValue | string;
  receiptNumber?: string;
}

export interface ExpectedTaxBase {
  taxType: TaxType;
  period: string;
  expectedBaseAmount: DecimalValue | string;
  expectedTaxAmount: DecimalValue | string;
  chargeableEventNature: 'DELIVERY_DEBIT' | 'COLLECTION_CASH' | 'PAYROLL_DATE';
}

export interface CadrageDiscrepancy {
  taxType: TaxType;
  period: string;
  filedAmount: string;
  expectedAmount: string;
  discrepancyAmount: string; // |Filed - Expected|
  toleranceApplied: string;
  isOverTolerance: boolean;
  severity: Severity;
  explanationFr: string;
}

export interface CadrageReconciliationResult {
  isFullyReconciled: boolean;
  totalPeriodsAudited: number;
  discrepanciesCount: number;
  discrepancies: CadrageDiscrepancy[];
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class DeclarationReconciliationAuditor {
  /**
   * Compare les déclarations réellement déposées avec les bases attendues du grand livre
   */
  public static reconcile(
    filedDeclarations: FiledTaxDeclaration[],
    expectedBases: ExpectedTaxBase[],
    toleranceAmountInput: DecimalValue | string = '100.00',
    packVersion = 'DZ_AUDIT_2026_V1'
  ): CadrageReconciliationResult {
    const startTime = Date.now();
    const tolerance = EngineMath.from(toleranceAmountInput);

    // Indexer les déclarations déposées par clé : taxType|period
    const filedMap = new Map<string, FiledTaxDeclaration>();
    for (const f of filedDeclarations) {
      filedMap.set(`${f.taxType}|${f.period}`, f);
    }

    const discrepancies: CadrageDiscrepancy[] = [];

    for (const exp of expectedBases) {
      const key = `${exp.taxType}|${exp.period}`;
      const filed = filedMap.get(key);

      if (!filed) {
        discrepancies.push({
          taxType: exp.taxType,
          period: exp.period,
          filedAmount: '0.00',
          expectedAmount: EngineMath.from(exp.expectedTaxAmount).toFixed(2),
          discrepancyAmount: EngineMath.from(exp.expectedTaxAmount).toFixed(2),
          toleranceApplied: tolerance.toFixed(2),
          isOverTolerance: true,
          severity: Severity.BLOQUANT,
          explanationFr: `Déclaration ${exp.taxType} pour la période ${exp.period} manquante. Montant attendu : ${EngineMath.from(exp.expectedTaxAmount).toFixed(2)} DA.`,
        });
        continue;
      }

      const filedTax = EngineMath.from(filed.filedTaxAmount);
      const expectedTax = EngineMath.from(exp.expectedTaxAmount);
      const diff = filedTax.minus(expectedTax).abs();

      const isOver = diff.greaterThan(tolerance);

      if (isOver) {
        discrepancies.push({
          taxType: exp.taxType,
          period: exp.period,
          filedAmount: filedTax.toFixed(2),
          expectedAmount: expectedTax.toFixed(2),
          discrepancyAmount: diff.toFixed(2),
          toleranceApplied: tolerance.toFixed(2),
          isOverTolerance: true,
          severity: Severity.MAJEUR,
          explanationFr: `Écart de cadrage constaté sur ${exp.taxType} (${exp.period}) : ${diff.toFixed(2)} DA (déposé: ${filedTax.toFixed(2)} DA vs attendu: ${expectedTax.toFixed(2)} DA, tolérance admise: ${tolerance.toFixed(2)} DA).`,
        });
      }
    }

    const hasErrors = discrepancies.length > 0;
    const outcome = hasErrors ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      isFullyReconciled: !hasErrors,
      totalPeriodsAudited: expectedBases.length,
      discrepanciesCount: discrepancies.length,
      discrepancies,
      trace: {
        ruleCode: 'AUDIT_04_DECLARATION_CADRAGE',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          periodsAudited: expectedBases.length,
          tolerance: tolerance.toFixed(2),
          discrepanciesCount: discrepancies.length,
        },
        parametersRead: {
          tolerance: tolerance.toFixed(2),
        },
        legalRef: 'Obligations déclaratives G50 / Code des Procédures Fiscales (CPF)',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: hasErrors,
        notes: hasErrors
          ? `${discrepancies.length} écart(s) de cadrage fiscal excédant la tolérance de ${tolerance.toFixed(2)} DA.`
          : 'Cadrage fiscal parfait entre grand livre et déclarations souscrites.',
      },
      summaryFr: hasErrors
        ? `Alerte cadrage déclaratif : ${discrepancies.length} anomalie(s) détectée(s) entre le grand livre et les déclarations déposées.`
        : `Cadrage fiscal validé sur ${expectedBases.length} période(s) (tolérance de ${tolerance.toFixed(2)} DA respectée).`,
    };
  }
}

