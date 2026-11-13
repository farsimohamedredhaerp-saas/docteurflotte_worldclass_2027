/**
 * Types et Modèles pour l'Application Client Data Plane (DocteurFlotte)
 */

import {
  AccountRole,
  BusinessEventType,
  FiscalRegime,
  Severity,
  EvidenceLevel,
  AuditAlertStatus,
} from '@docteurflotte/decision-engine';

export type ClientTab =
  | 'EXECUTIVE_DASHBOARD'
  | 'ACTIVITY_ENTRY'
  | 'LEDGER_EXPLORER'
  | 'AUDIT_COCKPIT'
  | 'STATISTICAL_AUDIT'
  | 'SCF_STATEMENTS'
  | 'TAX_DECLARATIONS';

export interface TenantProfile {
  tenantId: string;
  companyName: string;
  nif: string;
  nis: string;
  rc: string;
  wilaya: string;
  wilayaCode: string;
  fiscalYear: number;
  regime: FiscalRegime;
  activePackId: string;
  activePackName: string;
  legalTimezone: string;
}

export type PaymentChannel = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'TERM';

export interface EconomicActivityDraft {
  eventType: BusinessEventType;
  date: string;
  documentRef: string;
  thirdPartyName: string;
  thirdPartyNif?: string;
  amountHt: string;
  vatRatePercent: string;
  paymentChannel: PaymentChannel;
  sector: 'NEGOCE' | 'INDUSTRIE' | 'SERVICES' | 'BTPH';
  description: string;
}

export interface ClientLedgerLine {
  id: string;
  lineNumber: number;
  date: string;
  journal: string;
  accountCode: string;
  accountLabel: string;
  accountRole: AccountRole;
  label: string;
  debit: string;
  credit: string;
  pieceRef: string;
  prevHash: string;
  entryHash: string;
}

export interface ClientAuditAlert {
  id: string;
  ruleCode: string;
  title: string;
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  status: AuditAlertStatus;
  legalBasis: string;
  observation: string;
  financialExposureDzd: {
    min: string;
    max: string;
    taxType: 'IBS' | 'TVA' | 'TAP' | 'PENALTIES';
  };
  humanReviewRequired: boolean;
  reviewed: boolean;
  timestamp: string;
}

export interface G50MonthlySummary {
  period: string; // Ex: "10/2026"
  turnoverTaxable19: string;
  turnoverTaxable9: string;
  turnoverExempt: string;
  vatCollected19: string;
  vatCollected9: string;
  totalVatCollected: string;
  vatDeductibleGoods: string;
  vatDeductibleServices: string;
  vatDeductibleAssets: string;
  vatProrataApplied: string;
  totalVatDeductible: string;
  netVatPayable: string;
  vatCredit: string;
  tapAmount: string; // 0.00 DA post-2024
}

export interface IbsAnnualSummary {
  accountingResult: string;
  reintegrationsSector: string;
  deductions: string;
  taxableResult: string;
  applicableRatePercent: string;
  grossTax: string;
  advancesPaid: string;
  liquidationBalance: string;
  hasSeparateAccounting: boolean;
}

