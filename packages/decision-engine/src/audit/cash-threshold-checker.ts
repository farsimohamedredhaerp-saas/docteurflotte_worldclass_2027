/**
 * Contrôleur de Respect des Seuils de Paiement en Espèces
 * 
 * Bases légales :
 * - Article 169 du CIDTA (LF 2018) : Plafond de déductibilité des charges payées en espèces pour l'IBS.
 * - CTCA : Seuil de perte du droit à déduction de la TVA sur règlements en espèces (paramètre distinct).
 * - Article 207 de la LF 2025 : Interdiction absolue des paiements en espèces pour certaines transactions (ex: immobilier).
 * 
 * RÈGLE NON NÉGOCIABLE :
 * Zéro seuil en dur dans src (valeurs injectées via le pack réglementaire).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export interface CashPaymentInvoice {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  partnerName?: string;
  date: string; // YYYY-MM-DD
  amountHt: DecimalValue | string;
  vatAmount: DecimalValue | string;
  amountTtc: DecimalValue | string;
  paymentMethod: string; // ex: 'CASH', 'ESPECES'
  sectorCategory?: string; // ex: 'STANDARD', 'REAL_ESTATE'
}

export interface CashThresholdConfig {
  ibsDeductibilityThresholdTtc: DecimalValue | string; // Seuil légal de déductibilité IBS (ex: paramètre pack)
  tvaDeductibilityThresholdTtc?: DecimalValue | string; // Seuil TVA (paramètre distinct, statut UNVERIFIED)
  rejectionPolicy?: 'FULL_INVOICE' | 'EXCESS_ONLY'; // Rejet de la totalité ou de la fraction excédentaire
  prohibitedSectors?: string[]; // Secteurs avec interdiction totale du cash (ex: REAL_ESTATE)
}

export interface CashPaymentViolation {
  invoiceId: string;
  invoiceNumber: string;
  partnerId: string;
  date: string;
  amountTtc: string;
  amountHt: string;
  vatAmount: string;
  violationType: 'IBS_THRESHOLD_EXCEEDED' | 'TVA_THRESHOLD_EXCEEDED' | 'PROHIBITED_SECTOR_CASH';
  thresholdApplied: string;
  reintegratedAmountIbs: string;
  deniedVatAmount: string;
  legalReference: string;
  severity: Severity;
  explanationFr: string;
}

export interface CashThresholdCheckResult {
  hasViolations: boolean;
  totalCashInvoicesAnalyzed: number;
  totalViolations: number;
  violations: CashPaymentViolation[];
  totalReintegratedIbs: string;
  totalDeniedVat: string;
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class CashThresholdChecker {
  /**
   * Analyse la conformité d'une série de factures réglées en espèces
   */
  public static check(
    invoices: CashPaymentInvoice[],
    config: CashThresholdConfig,
    packVersion = 'DZ_AUDIT_2026_V1'
  ): CashThresholdCheckResult {
    const startTime = Date.now();
    const ibsThreshold = EngineMath.from(config.ibsDeductibilityThresholdTtc);
    const tvaThreshold = config.tvaDeductibilityThresholdTtc
      ? EngineMath.from(config.tvaDeductibilityThresholdTtc)
      : null;
    const policy = config.rejectionPolicy ?? 'FULL_INVOICE';
    const prohibitedSectors = config.prohibitedSectors ?? [];

    const violations: CashPaymentViolation[] = [];
    let totalReintegratedIbs = new EngineDecimal('0');
    let totalDeniedVat = new EngineDecimal('0');

    // Filtrer les factures payées en espèces
    const cashInvoices = invoices.filter((inv) => {
      const pm = (inv.paymentMethod ?? '').toUpperCase().trim();
      return pm === 'CASH' || pm === 'ESPECES';
    });

    for (const inv of cashInvoices) {
      const ttc = EngineMath.from(inv.amountTtc);
      const ht = EngineMath.from(inv.amountHt);
      const vat = EngineMath.from(inv.vatAmount);

      // 1. Contrôle des secteurs totalement interdits au cash (ex: Immobilier LF 2025 art. 207)
      if (inv.sectorCategory && prohibitedSectors.includes(inv.sectorCategory)) {
        violations.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          partnerId: inv.partnerId,
          date: inv.date,
          amountTtc: ttc.toFixed(2),
          amountHt: ht.toFixed(2),
          vatAmount: vat.toFixed(2),
          violationType: 'PROHIBITED_SECTOR_CASH',
          thresholdApplied: '0.00',
          reintegratedAmountIbs: ht.toFixed(2),
          deniedVatAmount: vat.toFixed(2),
          legalReference: 'Article 207 de la Loi de Finances 2025',
          severity: Severity.BLOQUANT,
          explanationFr: `Règlement en espèces formellement proscrit pour le secteur ${inv.sectorCategory} (art. 207 LF 2025).`,
        });
        totalReintegratedIbs = totalReintegratedIbs.plus(ht);
        totalDeniedVat = totalDeniedVat.plus(vat);
        continue;
      }

      // 2. Contrôle du seuil de déductibilité fiscale IBS (Art. 169 CIDTA)
      if (ttc.greaterThan(ibsThreshold)) {
        let reintegratedIbs = new EngineDecimal('0');
        if (policy === 'FULL_INVOICE') {
          reintegratedIbs = ht;
        } else {
          // EXCESS_ONLY
          const ratioHtTtc = ttc.isZero() ? new EngineDecimal('1') : ht.div(ttc);
          const excessTtc = ttc.minus(ibsThreshold);
          reintegratedIbs = excessTtc.times(ratioHtTtc);
        }

        violations.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          partnerId: inv.partnerId,
          date: inv.date,
          amountTtc: ttc.toFixed(2),
          amountHt: ht.toFixed(2),
          vatAmount: vat.toFixed(2),
          violationType: 'IBS_THRESHOLD_EXCEEDED',
          thresholdApplied: ibsThreshold.toFixed(2),
          reintegratedAmountIbs: reintegratedIbs.toFixed(2),
          deniedVatAmount: '0.00',
          legalReference: 'Article 169 du CIDTA (LF 2018)',
          severity: Severity.MAJEUR,
          explanationFr: `Facture de ${ttc.toFixed(2)} DA réglée en espèces excédant le seuil légal de ${ibsThreshold.toFixed(2)} DA TTC. Charge exclue de déductibilité fiscale.`,
        });
        totalReintegratedIbs = totalReintegratedIbs.plus(reintegratedIbs);
      }

      // 3. Contrôle du seuil de déduction de TVA (si configuré)
      if (tvaThreshold && ttc.greaterThan(tvaThreshold) && vat.greaterThan(new EngineDecimal('0'))) {
        violations.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          partnerId: inv.partnerId,
          date: inv.date,
          amountTtc: ttc.toFixed(2),
          amountHt: ht.toFixed(2),
          vatAmount: vat.toFixed(2),
          violationType: 'TVA_THRESHOLD_EXCEEDED',
          thresholdApplied: tvaThreshold.toFixed(2),
          reintegratedAmountIbs: '0.00',
          deniedVatAmount: vat.toFixed(2),
          legalReference: 'Code des Taxes sur le Chiffre d Affaires (CTCA)',
          severity: Severity.MAJEUR,
          explanationFr: `Règlement en espèces de ${ttc.toFixed(2)} DA dépassant le seuil de déduction TVA de ${tvaThreshold.toFixed(2)} DA. Perte du droit à déduction.`,
        });
        totalDeniedVat = totalDeniedVat.plus(vat);
      }
    }

    const hasViolations = violations.length > 0;
    const outcome = hasViolations ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      hasViolations,
      totalCashInvoicesAnalyzed: cashInvoices.length,
      totalViolations: violations.length,
      violations,
      totalReintegratedIbs: totalReintegratedIbs.toFixed(2),
      totalDeniedVat: totalDeniedVat.toFixed(2),
      trace: {
        ruleCode: 'AUDIT_CASH_PAYMENT_THRESHOLDS',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          totalCashInvoices: cashInvoices.length,
          ibsThreshold: ibsThreshold.toFixed(2),
          tvaThreshold: tvaThreshold ? tvaThreshold.toFixed(2) : null,
          policy,
        },
        parametersRead: {
          ibsThreshold: ibsThreshold.toFixed(2),
          tvaThreshold: tvaThreshold ? tvaThreshold.toFixed(2) : null,
        },
        legalRef: 'Article 169 du CIDTA, CTCA, et LF 2025 art. 207',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: hasViolations,
        notes: hasViolations
          ? `${violations.length} infraction(s) de règlement en espèces constatée(s).`
          : 'Tous les paiements en espèces respectent les seuils légaux en vigueur.',
      },
      summaryFr: hasViolations
        ? `${violations.length} paiement(s) en espèces non conforme(s) identifié(s) : réintégration IBS potentielle de ${totalReintegratedIbs.toFixed(2)} DA et perte de TVA déductible de ${totalDeniedVat.toFixed(2)} DA.`
        : `Paiements en espèces conformes (${cashInvoices.length} factures vérifiées).`,
    };
  }
}
