/**
 * Contrats du Module Sinistres, Amendes & Assurances (Module E)
 * Gestion du contentieux, imputation des infractions au chauffeur à l'instant t
 */

export enum ClaimSeverity {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  TOTAL_LOSS = 'TOTAL_LOSS',
}

export enum ClaimStatus {
  REPORTED = 'REPORTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INSURANCE_SUBMITTED = 'INSURANCE_SUBMITTED',
  REPAIRED = 'REPAIRED',
  SETTLED = 'SETTLED',
  CLOSED = 'CLOSED',
}

export interface AccidentClaim {
  id: string;
  tenantId: string;
  claimNumber: string;
  assetId: string; // FK racine Asset
  assetCode?: string;
  driverId?: string;
  driverName?: string;
  accidentDate: string;
  wilayaCode: number;
  locationDetails: string;
  severity: ClaimSeverity;
  thirdPartyInvolved: boolean;
  thirdPartyDetails?: {
    insuranceCompany?: string;
    plateNumber?: string;
    driverName?: string;
  };
  policeReportRef?: string;
  estimatedDamageDzd: number;
  photosUrls: string[];
  circumstancesDescription: string;
  status: ClaimStatus;
  workOrderIdGenerated?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccidentClaimDto {
  assetId: string;
  driverId?: string;
  driverName?: string;
  accidentDate: string;
  wilayaCode: number;
  locationDetails: string;
  severity: ClaimSeverity;
  thirdPartyInvolved?: boolean;
  thirdPartyDetails?: {
    insuranceCompany?: string;
    plateNumber?: string;
    driverName?: string;
  };
  policeReportRef?: string;
  estimatedDamageDzd?: number;
  photosUrls?: string[];
  circumstancesDescription: string;
}

export interface InsuranceCase {
  id: string;
  tenantId: string;
  claimId: string;
  assetId: string;
  insurancePolicyNumber: string;
  insuranceCompany: string; // SAA, CAAT, CASH, CIAR, TRUST, etc.
  expertName?: string;
  assessedDamageDzd: number;
  deductibleDzd: number; // Franchise
  approvedCompensationDzd: number;
  payoutDate?: string;
  isClosed: boolean;
  createdAt: string;
}

export interface TrafficFine {
  id: string;
  tenantId: string;
  fineNoticeNumber: string;
  assetId: string; // FK racine Asset
  assetCode?: string;
  infractionDate: string;
  wilayaCode: number;
  locationHighwayCode?: string; // Ex: RN1, A1, RN3
  infractionNature: string; // Excès de vitesse, surcharge, défaut CT, non-port ceinture, etc.
  amountDzd: number;
  dueDate: string;
  isPaid: boolean;
  paidAt?: string;
  attributedDriverId?: string;
  attributedDriverName?: string;
  attributionSource: 'TELEMATICS_GPS_TIMESTAMP' | 'MISSION_ORDER' | 'MANUAL_DISPATCH';
  isContested: boolean;
  contestReason?: string;
  createdAt: string;
}

export interface RecordTrafficFineDto {
  fineNoticeNumber: string;
  assetId: string;
  infractionDate: string;
  wilayaCode: number;
  locationHighwayCode?: string;
  infractionNature: string;
  amountDzd: number;
  dueDate: string;
  attributedDriverId?: string;
  attributionSource?: 'TELEMATICS_GPS_TIMESTAMP' | 'MISSION_ORDER' | 'MANUAL_DISPATCH';
}

export interface InsuranceRiskScore {
  assetId: string;
  assetCode: string;
  claimsCountLast12m: number;
  totalClaimsCostDzd: number;
  finesCountLast12m: number;
  totalFinesAmountDzd: number;
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recommendedPremiumAdjustmentPct: number;
}

