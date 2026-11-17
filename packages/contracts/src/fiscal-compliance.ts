/**
 * Contrats du Module Conformité Fiscale (Module G)
 * Adossé au moteur fiscal souverain packages/decision-engine (TVA, TAP, IBS, Timbre, SCF)
 */

export enum TaxRegimeDZ {
  REEL_NORMAL = 'REEL_NORMAL',
  REEL_SIMPLIFIE = 'REEL_SIMPLIFIE',
  IFU = 'IFU',
}

export enum FiscalDocumentType {
  FACTURE_FOURNISSEUR = 'FACTURE_FOURNISSEUR',
  FACTURE_CLIENT = 'FACTURE_CLIENT',
  TICKET_NAFTAL = 'TICKET_NAFTAL',
  ORDRE_TRAVAIL = 'ORDRE_TRAVAIL',
  CONTRAT_LOCATION = 'CONTRAT_LOCATION',
  SITUATION_TRAVAUX = 'SITUATION_TRAVAUX',
  AMENDE = 'AMENDE',
  CONSTAT_SINISTRE = 'CONSTAT_SINISTRE',
}

export enum FiscalVerificationStatus {
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  SUSPICIOUS = 'SUSPICIOUS',
  PENDING_AUDIT = 'PENDING_AUDIT',
}

export enum FiscalDeclarationStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  SEALED = 'SEALED',
  EXPORTED = 'EXPORTED',
}

export interface TenantFiscalProfile {
  id: string;
  tenantId: string;
  legalName: string;
  legalForm?: string; // SPA, SARL, EURL, SNC, EI_BIC, PROF_LIBERALE_BNC, AGRICOLE, AUTO_ENTREPRENEUR
  profitTaxType?: string; // IBS, IRG_BIC, IRG_BNC, IRG_AGRI, IFU
  nif: string;
  nis?: string;
  rcNumber?: string;
  articleImposition?: string;
  taxRegime: TaxRegimeDZ;
  isVatSubject: boolean;
  vatDeclarationFrequency: 'MONTHLY' | 'TRIMESTRIAL';
  vatProrataPct?: number;
  aapiExemptionActive?: boolean;
  aapiExemptionEndDate?: string;
  wilayaCode: number;
  fiscalCenter?: string;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantFiscalProfileDto {
  legalName?: string;
  legalForm?: string;
  profitTaxType?: string;
  nif?: string;
  nis?: string;
  rcNumber?: string;
  articleImposition?: string;
  taxRegime?: TaxRegimeDZ;
  isVatSubject?: boolean;
  vatDeclarationFrequency?: 'MONTHLY' | 'TRIMESTRIAL';
  vatProrataPct?: number;
  aapiExemptionActive?: boolean;
  aapiExemptionEndDate?: string;
  wilayaCode?: number;
  fiscalCenter?: string;
}

export interface TenantCnrcActivity {
  id: string;
  tenantId: string;
  cnrcCode: string;
  activityLabel: string;
  fiscalSegment: 'PRODUCTION' | 'BTPH_TOURISME' | 'COMMERCE_SERVICES' | string;
  ifuSegment?: 'BIENS_PRODUCTION' | 'SERVICES' | 'AUTO_ENTREPRENEUR' | string;
  isSubjectToTls: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface CreateTenantCnrcActivityDto {
  cnrcCode: string;
  activityLabel: string;
  fiscalSegment: 'PRODUCTION' | 'BTPH_TOURISME' | 'COMMERCE_SERVICES' | string;
  ifuSegment?: string;
  isSubjectToTls?: boolean;
  isPrimary?: boolean;
}

export interface FiscalDocument {
  id: string;
  tenantId: string;
  assetId?: string; // Obligatoire pour tout flux touchant un actif
  assetCode?: string;
  cnrcActivityId?: string;
  costCenterType?: string; // FLEET_ASSET, BTP_CHANTIER, USINE_PRODUCTION, FRAIS_GENERAUX, IMPORT_DOUANE, RH_PAIE
  documentType: FiscalDocumentType;
  documentNumber: string;
  documentDate: string;
  paymentMethod?: string; // CASH, BANK_TRANSFER, CHECK, CARD_CIB_EDAHABIA
  thirdPartyName?: string;
  thirdPartyNif?: string;
  thirdPartyNis?: string;
  thirdPartyRc?: string;
  articleImpositionThirdParty?: string;
  amountHtDzd: number;
  vatRatePct: number;
  vatAmountDzd: number;
  stampDutyDzd: number;
  totalTtcDzd: number;
  isVatExemptF20?: boolean;
  f20CertificateNumber?: string;
  isVatDeductible: boolean;
  deductibilityRationale?: string;
  withholdingTaxRatePct?: number;
  withholdingTaxAmountDzd?: number;
  vatTaxPoint?: 'DEBIT' | 'ENCAISSEMENT';
  isSettled?: boolean;
  settlementDate?: string;
  verificationStatus: FiscalVerificationStatus;
  rejectionReason?: string;
  sha256Fingerprint: string;
  createdAt: string;
}

export interface CreateFiscalDocumentDto {
  assetId?: string;
  cnrcActivityId?: string;
  costCenterType?: string;
  documentType: FiscalDocumentType;
  documentNumber: string;
  documentDate: string;
  paymentMethod?: string;
  thirdPartyName?: string;
  thirdPartyNif?: string;
  thirdPartyNis?: string;
  thirdPartyRc?: string;
  articleImpositionThirdParty?: string;
  amountHtDzd: number;
  vatRatePct?: number;
  vatAmountDzd?: number;
  stampDutyDzd?: number;
  totalTtcDzd?: number;
  isVatExemptF20?: boolean;
  f20CertificateNumber?: string;
  isVatDeductible?: boolean;
  deductibilityRationale?: string;
  withholdingTaxRatePct?: number;
  withholdingTaxAmountDzd?: number;
  vatTaxPoint?: 'DEBIT' | 'ENCAISSEMENT';
  isSettled?: boolean;
  settlementDate?: string;
}

export interface FiscalEvent {
  id: string;
  tenantId: string;
  assetId?: string;
  documentId?: string;
  cnrcActivityId?: string;
  eventType: string; // TVA_DEDUCTION, TVA_COLLECTED, NON_DEDUCTIBLE_PENALTY, QUINQUENNIAL_ADJUSTMENT, IBS_TAX_REINTEGRATION
  taxCategory: 'TVA' | 'TLS' | 'TAP' | 'IBS' | 'IRG' | 'TIMBRE' | 'TVS' | 'TFPA' | 'RAS' | string;
  taxableBaseDzd: number;
  appliedRatePct: number;
  taxAmountDzd: number;
  accountingAccount: string;
  periodYear: number;
  periodMonth: number;
  vatTaxPoint?: 'DEBIT' | 'ENCAISSEMENT';
  isSettled?: boolean;
  reintegrationType?: string; // 'EXCESS_DEPRECIATION_VP_ART_141_2', 'CASH_PAYMENT_EXCESS_ART_30', 'AMENDE_PENALITE_ART_169'
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Tableau9Scf {
  tenantId: string;
  fiscalYear: number;
  legalName: string;
  nif: string;
  taxRegime: string;
  accountingNetProfitDzd: number;
  reintegrations: {
    penaltiesAndFinesDzd: number; // Art. 169 CIDTA
    excessDepreciationVpDzd: number; // Art. 141-2 CIDTA (> 3 000 000 DZD)
    cashPaymentsOverCeilingDzd: number; // Art. 30 TCA & CIDTA (> 1 000 000 DZD)
    nonDeductibleTvaDzd: number;
    otherReintegrationsDzd: number;
    totalReintegrationsDzd: number;
  };
  deductions: {
    taxExemptionsDzd: number;
    otherDeductionsDzd: number;
    totalDeductionsDzd: number;
  };
  taxableProfitIbsDzd: number;
  appliedIbsRatePct: number;
  grossIbsDueDzd: number;
  sha256Seal: string;
  generatedAt: string;
}

export interface FiscalDeclarationDraft {
  id: string;
  tenantId: string;
  periodYear: number;
  periodMonth: number;
  declarationType: string;
  totalTaxableRevenueDzd: number;
  totalVatCollectedDzd: number;
  totalVatDeductibleDzd: number;
  netVatPayableDzd: number;
  tapAmountDzd: number;
  tlsAmountDzd?: number;
  ibsInstallmentDzd?: number;
  irgSalariesWithheldDzd?: number;
  otherWithholdingTaxesDzd?: number;
  tvsAmountDzd?: number;
  stampDutyTotalDzd: number;
  totalDueDzd: number;
  status: FiscalDeclarationStatus;
  breakdownByActivity?: Record<string, unknown>;
  breakdownByAsset: Record<string, {
    assetCode: string;
    vatDeductibleDzd: number;
    vatExcludedDzd: number;
    totalExpenseDzd: number;
    itemsCount: number;
  }>;
  missingReceiptsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalAuditSeal {
  id: string;
  tenantId: string;
  declarationId: string;
  sealedByUserId: string;
  sealedAt: string;
  canonicalPayload: string;
  sha256Hash: string;
  merkleLeaf: string;
}

export interface AssetFiscalSummary {
  assetId: string;
  assetCode: string;
  category: string;
  isVatDeductibleClass: boolean; // False pour les véhicules de tourisme (VP)
  totalExpensesDzd: number;
  vatDeductedDzd: number;
  vatNonDeductibleDzd: number;
  penaltiesNonDeductibleDzd: number;
  documentsCount: number;
  quinquennialAdjustmentRequired: boolean;
}

export interface EInvoicingReadinessAnomaly {
  documentId?: string;
  documentNumber?: string;
  documentDate?: string;
  thirdPartyName?: string;
  thirdPartyNif?: string;
  anomalyType: 'INVALID_NIF' | 'MISSING_RC' | 'MISSING_ARTICLE_IMPOSITION' | 'CASH_LIMIT_EXCEEDED' | 'AMBIGUOUS_TAX_POINT';
  severity: 'BLOCKING_DGI' | 'HIGH_RISK' | 'WARNING';
  description: string;
  impactDzd: number;
  recommendation: string;
}

export interface EInvoicingReadinessReport {
  tenantId: string;
  generatedAt: string;
  readinessScore: number; // 0 à 100%
  status: 'PRET_E_FACTURATION_2027' | 'A_RISQUE' | 'NON_CONFORME_CRITIQUE';
  totalDocumentsAudited: number;
  compliantDocumentsCount: number;
  anomaliesCount: number;
  totalVatAtRiskDzd: number;
  totalCashOverCeilingDzd: number;
  suppliersSummary: {
    totalSuppliers: number;
    compliantNifCount: number;
    invalidOrMissingNifCount: number;
  };
  anomalies: EInvoicingReadinessAnomaly[];
  executiveChecklist: {
    rule: string;
    status: 'CONFORME' | 'ACTION_REQUISE';
    legalReference: string;
    details: string;
  }[];
}

export interface PartnerAccountingExport {
  tenantId: string;
  format: 'PC_COMPTA_DGI' | 'ODOO_ALMAWARID_JSON' | 'SAGE_CSV';
  periodYear: number;
  periodMonth?: number;
  entriesCount: number;
  checksumSha256: string;
  rawContent: string;
}

