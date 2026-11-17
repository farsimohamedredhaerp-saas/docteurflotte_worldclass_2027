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

export interface ScfAccount {
  id?: string;
  code: string;
  label: string;
  accountClass: number; // 1 à 7
  accountCategory: 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT' | 'CAPITAUX';
  isTaxAccount: boolean;
  isActive: boolean;
}

export type AccountingJournalCode = 'ACH' | 'VTE' | 'BQ' | 'CA' | 'OD';

export interface AccountingJournal {
  id?: string;
  code: AccountingJournalCode | string;
  name: string;
  journalType: 'ACHATS' | 'VENTES' | 'BANQUE' | 'CAISSE' | 'OPERATIONS_DIVERSES';
  defaultAccount?: string;
  isSystem: boolean;
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  entryNumber: string;
  journalCode: string;
  entryDate: string;
  fiscalDocumentId?: string | null;
  assetId?: string | null;
  assetCode?: string | null;
  siteId?: string | null;
  siteCode?: string | null;
  cnrcActivityId?: string | null;
  cnrcActivityCode?: string | null;
  accountCode: string;
  accountLabel: string;
  description: string;
  debitDzd: number;
  creditDzd: number;
  thirdPartyName?: string | null;
  thirdPartyNif?: string | null;
  isValidated: boolean;
  sha256Hash: string;
  previousEntryHash?: string | null;
  createdAt: string;
}

export interface ScfTrialBalanceAccount {
  accountCode: string;
  accountLabel: string;
  accountClass: number;
  totalDebitDzd: number;
  totalCreditDzd: number;
  debitBalanceDzd: number;
  creditBalanceDzd: number;
}

export interface ScfTrialBalance {
  tenantId: string;
  periodYear: number;
  periodMonth?: number;
  generatedAt: string;
  accounts: ScfTrialBalanceAccount[];
  totalDebitSumDzd: number;
  totalCreditSumDzd: number;
  isBalanced: boolean; // Total Débit === Total Crédit (Partie double stricte)
  discrepancyDzd: number;
}

export const DEFAULT_ALGERIA_SCF_ACCOUNTS: Omit<ScfAccount, 'id'>[] = [
  // Classe 2 : Immobilisations
  { code: '215000', label: 'Installations techniques, matériel et outillage BTP', accountClass: 2, accountCategory: 'ACTIF', isTaxAccount: false, isActive: true },
  { code: '218200', label: 'Matériel de transport (Flotte)', accountClass: 2, accountCategory: 'ACTIF', isTaxAccount: false, isActive: true },
  { code: '281500', label: 'Amortissement matériel de chantier BTP', accountClass: 2, accountCategory: 'ACTIF', isTaxAccount: false, isActive: true },
  { code: '281820', label: 'Amortissement matériel de transport', accountClass: 2, accountCategory: 'ACTIF', isTaxAccount: false, isActive: true },

  // Classe 4 : Comptes de Tiers
  { code: '401000', label: 'Fournisseurs de biens et services', accountClass: 4, accountCategory: 'PASSIF', isTaxAccount: false, isActive: true },
  { code: '404000', label: 'Fournisseurs d\'immobilisations', accountClass: 4, accountCategory: 'PASSIF', isTaxAccount: false, isActive: true },
  { code: '411000', label: 'Clients (Créances d\'exploitation)', accountClass: 4, accountCategory: 'ACTIF', isTaxAccount: false, isActive: true },
  { code: '445600', label: 'État, TVA déductible (Art. 30 TCA)', accountClass: 4, accountCategory: 'ACTIF', isTaxAccount: true, isActive: true },
  { code: '445700', label: 'État, TVA collectée (Art. 21 TCA)', accountClass: 4, accountCategory: 'PASSIF', isTaxAccount: true, isActive: true },
  { code: '445790', label: 'Droit de timbre fiscal à reverser DGI', accountClass: 4, accountCategory: 'PASSIF', isTaxAccount: true, isActive: true },
  { code: '447000', label: 'Autres impôts et taxes (TAP / ENACTA)', accountClass: 4, accountCategory: 'PASSIF', isTaxAccount: true, isActive: true },

  // Classe 5 : Comptes Financiers
  { code: '512000', label: 'Banques nationales algériennes', accountClass: 5, accountCategory: 'ACTIF', isTaxAccount: false, isActive: true },
  { code: '530000', label: 'Caisse centrale (Espèces)', accountClass: 5, accountCategory: 'ACTIF', isTaxAccount: false, isActive: true },

  // Classe 6 : Comptes de Charges
  { code: '605000', label: 'Achats de matériel, équipements et fournitures BTP', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '606100', label: 'Carburant Naftal (Gasoil, Essence, Sirghaz)', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '606200', label: 'Lubrifiants et consommables mécaniques', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '613000', label: 'Locations d\'engins et véhicules de transport', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '615000', label: 'Entretien et réparations d\'atelier', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '616000', label: 'Primes d\'assurances flotte (SAA, CAAT, CASH)', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '624000', label: 'Transports de biens et fret inter-wilayas', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '625000', label: 'Frais de route, déplacements et missions chauffeurs', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '635000', label: 'Taxes et vignettes automobiles DGI', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '658000', label: 'Charges diverses, amendes et pénalités (Art. 169 CIDTA)', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },
  { code: '681000', label: 'Dotations aux amortissements des actifs roulants', accountClass: 6, accountCategory: 'CHARGE', isTaxAccount: false, isActive: true },

  // Classe 7 : Comptes de Produits
  { code: '704000', label: 'Travaux BTPH et situations de chantier', accountClass: 7, accountCategory: 'PRODUIT', isTaxAccount: false, isActive: true },
  { code: '706000', label: 'Prestations de transport de fret et logistique', accountClass: 7, accountCategory: 'PRODUIT', isTaxAccount: false, isActive: true },
  { code: '708000', label: 'Locations d\'engins et mises à disposition de matériel', accountClass: 7, accountCategory: 'PRODUIT', isTaxAccount: false, isActive: true },
];


