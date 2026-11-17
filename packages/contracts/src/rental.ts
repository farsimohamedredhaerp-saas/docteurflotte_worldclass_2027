/**
 * Contrats du Module Location & Rental (Module B)
 * Gestion des contrats de location d'actifs (flotte louée ou location tierce)
 */

export enum RentalContractStatus {
  DRAFT = 'DRAFT',
  RESERVED = 'RESERVED',
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  INVOICED = 'INVOICED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum CheckInOutType {
  CHECK_OUT = 'CHECK_OUT', // Départ client / Mise à disposition
  CHECK_IN = 'CHECK_IN',   // Retour client / Réception
}

export interface AssetRentalContract {
  id: string;
  tenantId: string;
  contractNumber: string;
  assetId: string; // FK racine Asset
  assetCode?: string;
  customerName: string;
  customerNif?: string;
  customerPhoneDz: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  dailyRateDzd: number;
  includedKmOrHoursPerDay: number;
  extraUnitRateDzd: number; // Taux au km ou à l'heure supplémentaire
  fuelRefillRatePerLiterDzd: number;
  depositAmountDzd: number; // Caution
  status: RentalContractStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRentalContractDto {
  assetId: string;
  customerName: string;
  customerNif?: string;
  customerPhoneDz: string;
  startDate: string;
  endDate: string;
  dailyRateDzd: number;
  includedKmOrHoursPerDay?: number;
  extraUnitRateDzd?: number;
  fuelRefillRatePerLiterDzd?: number;
  depositAmountDzd?: number;
  notes?: string;
}

export interface AssetRentalCheckInOut {
  id: string;
  tenantId: string;
  contractId: string;
  assetId: string; // FK racine Asset
  type: CheckInOutType;
  performedAt: string;
  performedBy: string;
  customerSignatoryName: string;
  meterValue: number;
  fuelLevelQuarter: number; // 0, 1, 2, 3, 4 (quart de réservoir) ou % direct
  cleanlinessState: 'CLEAN' | 'ACCEPTABLE' | 'DIRTY';
  accessoriesPresent: Record<string, boolean>; // roue de secours, cric, extincteur, documents de bord
  damagesNotes?: string;
  photosUrls: string[];
  signatureSvg: string;
  sha256Proof: string;
  createdAt: string;
}

export interface CreateRentalCheckInOutDto {
  contractId: string;
  type: CheckInOutType;
  customerSignatoryName: string;
  meterValue: number;
  fuelLevelQuarter: number;
  cleanlinessState: 'CLEAN' | 'ACCEPTABLE' | 'DIRTY';
  accessoriesPresent?: Record<string, boolean>;
  damagesNotes?: string;
  photosUrls?: string[];
  signatureSvg: string;
}

export interface AssetRentalInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  contractId: string;
  assetId: string;
  customerName: string;
  customerNif?: string;
  baseDaysBilled: number;
  baseRentalHtDzd: number;
  extraKmOrHoursBilled: number;
  extraUnitsAmountDzd: number;
  fuelPenaltyAmountDzd: number;
  damagesDeductionsDzd: number;
  totalHtDzd: number;
  vatRatePct: number; // 19% légal
  vatAmountDzd: number;
  stampDutyDzd: number;
  totalTtcDzd: number;
  isPaid: boolean;
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
}

export interface AssetRentalDispute {
  id: string;
  tenantId: string;
  contractId: string;
  assetId: string;
  disputeRef: string;
  claimant: 'LANDLORD' | 'TENANT';
  disputeReason: string;
  claimedAmountDzd: number;
  retainedDepositDzd: number;
  status: 'OPEN' | 'ARBITRATED' | 'RESOLVED';
  sha256LegalDossier: string;
  createdAt: string;
}

