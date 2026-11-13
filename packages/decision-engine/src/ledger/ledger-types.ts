/**
 * Types & Contrats du Data Plane : Grand Livre, Événements & Clôtures
 * 
 * RÈGLE FONDAMENTALE : L'ontologie est du code, les valeurs sont des données.
 * Aucun numéro de compte SCF ni montant n'est codé ici.
 */

import { AccountRole, BusinessEventType } from '../types/ontology.js';
import { AstNode } from '../ast/ast-types.js';

export type JournalCode = 'VT' | 'AC' | 'BQ' | 'CA' | 'OD' | 'PA' | 'ST';

export type PaymentMode = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'BILL_OF_EXCHANGE' | 'OTHER';

export type AccountingPeriodStatus = 'OPEN' | 'SOFT_CLOSED' | 'CLOSED';

export type LedgerEntryStatus = 'VALIDATED' | 'REVERSED' | 'VOID';

export type LegalForm = 'SARL' | 'EURL' | 'SPA' | 'SNC' | 'INDIVIDUELLE' | 'AUTO_ENTREPRENEUR';

export type TaxRegime = 'REEL_NORMAL' | 'REEL_SIMPLIFIE' | 'IFU' | 'ANAE';

export interface EntityProfile {
  id: string;
  tenantId: string;
  legalName: string;
  legalForm: LegalForm;
  taxRegime: TaxRegime;
  activitySegments: Array<{ code: string; label: string; rate?: string }>;
  derogatoryOptions: Record<string, unknown>;
  fiscalYearEndMonth: number;
  fiscalYearEndDay: number;
  activePackCode?: string;
}

export interface AccountingPeriod {
  id: string;
  tenantId: string;
  fiscalYear: number;
  periodCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: AccountingPeriodStatus;
  packHash: string;
  closedAt?: string;
  closedBy?: string;
}

export interface PieceSequence {
  tenantId: string;
  fiscalYear: number;
  journalCode: string;
  lastNumber: number;
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  periodId: string;
  pieceNumber: string;
  lineNumber: number;
  localDate: string; // YYYY-MM-DD (Africa/Algiers)
  recordedAt: string; // ISO
  accountRole: AccountRole;
  accountNumber: string;
  label: string;
  debit: string | null;  // Formaté NUMERIC(20,2)
  credit: string | null; // Formaté NUMERIC(20,2)
  amountHt: string | null;
  vatAmount: string | null;
  paymentMode?: PaymentMode;
  collectionDate?: string;
  segmentCode?: string;
  tags: string[];
  prevHash: string;
  hash: string;
  status: LedgerEntryStatus;
  reversedEntryId?: string;
  eventId?: string;
  packHash: string;
}

export interface LedgerEntryDraft {
  accountRole: AccountRole;
  accountNumber?: string;
  label: string;
  debit: string | null;
  credit: string | null;
  amountHt?: string | null;
  vatAmount?: string | null;
  paymentMode?: PaymentMode;
  collectionDate?: string;
  segmentCode?: string;
  tags?: string[];
}

export interface BusinessEvent {
  id?: string;
  tenantId: string;
  eventId: string;
  eventType: BusinessEventType;
  occurredAt: string; // ISO timestamp
  localDate?: string; // Si non renseigné, déduit via Africa/Algiers
  payload: Record<string, unknown>;
}

export interface PostingSchemaRuleLine {
  role: AccountRole;
  side: 'DEBIT' | 'CREDIT';
  amountExpr: AstNode;
  amountHtExpr?: AstNode;
  vatAmountExpr?: AstNode;
  labelExpr?: AstNode;
  conditionExpr?: AstNode;
}

export interface PostingSchemaItem {
  eventType: BusinessEventType;
  journalCode: JournalCode;
  lines: PostingSchemaRuleLine[];
}

export type ChartOfAccounts = Record<AccountRole, string>;

export interface ChainVerificationResult {
  valid: boolean;
  entriesCount: number;
  brokenAtPiece?: string;
  brokenAtLine?: number;
  reason?: string;
}

export interface LedgerAnchor {
  id: string;
  tenantId: string;
  anchorDate: string;
  merkleRoot: string;
  entriesCount: number;
  lastEntryHash: string;
  sealedAt: string;
}

