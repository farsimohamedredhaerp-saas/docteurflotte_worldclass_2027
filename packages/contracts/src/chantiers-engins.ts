/**
 * Contrats du Module Chantiers & Engins BTP / Travaux Publics (Module A)
 * Toutes les entités opérationnelles référencent obligatoirement asset_id
 */

export enum SiteStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export enum AssignmentStatus {
  REQUESTED = 'REQUESTED',
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum EngineHourSource {
  MANUAL = 'MANUAL',
  CAN_J1939 = 'CAN_J1939',
  ESTIMATED = 'ESTIMATED',
}

export interface SiteWorkspace {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  wilayaCode: number;
  locationDetails?: string;
  clientName?: string;
  managerName?: string;
  startDate: string;
  targetEndDate?: string;
  actualEndDate?: string;
  status: SiteStatus;
  budgetAllocatedDzd: number;
  totalExpensesDzd: number;
  totalRevenueDzd: number;
  activeAssetsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteWorkspaceDto {
  code: string;
  name: string;
  wilayaCode: number;
  locationDetails?: string;
  clientName?: string;
  managerName?: string;
  startDate: string;
  targetEndDate?: string;
  budgetAllocatedDzd?: number;
}

export interface AssetSiteAssignment {
  id: string;
  tenantId: string;
  assetId: string; // FK racine Asset
  assetCode?: string;
  assetName?: string;
  siteId: string;
  siteName?: string;
  assignedByUserId: string;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  internalDailyRateDzd: number;
  startMeterHours: number;
  endMeterHours?: number;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetSiteAssignmentDto {
  assetId: string;
  siteId: string;
  startDate: string;
  expectedEndDate?: string;
  internalDailyRateDzd?: number;
  startMeterHours?: number;
  notes?: string;
}

export enum ConsumableType {
  GASOIL = 'GASOIL',
  SIRGHAZ_GPL = 'SIRGHAZ_GPL',
  ESSENCE_SP = 'ESSENCE_SP',
  HUILE_HYDRAULIQUE_ISO46 = 'HUILE_HYDRAULIQUE_ISO46',
  HUILE_HYDRAULIQUE_ISO68 = 'HUILE_HYDRAULIQUE_ISO68',
  HUILE_MOTEUR_15W40 = 'HUILE_MOTEUR_15W40',
  HUILE_PONT_80W90 = 'HUILE_PONT_80W90',
  ADBLUE = 'ADBLUE',
  LIQUIDE_REFROIDISSEMENT = 'LIQUIDE_REFROIDISSEMENT',
  GRAISSE = 'GRAISSE',
}

export interface SiteConsumableTank {
  id: string;
  tenantId: string;
  siteId: string;
  tankCode: string;
  name: string;
  consumableType: ConsumableType;
  capacityLiters: number;
  currentLevelLiters: number;
  alertLowLevelPct: number;
  unitCostRefDzd: number;
  lastDeliveryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteConsumableTankDto {
  siteId: string;
  tankCode: string;
  name: string;
  consumableType: ConsumableType;
  capacityLiters: number;
  currentLevelLiters?: number;
  alertLowLevelPct?: number;
  unitCostRefDzd?: number;
}

export interface SiteConsumableDelivery {
  id: string;
  tenantId: string;
  siteId: string;
  tankId?: string;
  deliveryNoteRef: string;
  deliveryDate: string;
  supplierName: string;
  supplierNif?: string;
  consumableType: ConsumableType;
  volumeLiters: number;
  density?: number;
  unitPriceHtDzd: number;
  totalHtDzd: number;
  vatRatePct: number;
  vatAmountDzd: number;
  totalTtcDzd: number;
  sha256Proof: string;
  createdAt: string;
}

export interface RecordSiteConsumableDeliveryDto {
  siteId: string;
  tankId?: string;
  deliveryNoteRef: string;
  deliveryDate?: string;
  supplierName?: string;
  supplierNif?: string;
  consumableType: ConsumableType;
  volumeLiters: number;
  density?: number;
  unitPriceHtDzd: number;
  vatRatePct?: number;
}

export interface SiteWorkSituation {
  id: string;
  tenantId: string;
  siteId: string;
  situationNumber: string;
  periodStart: string;
  periodEnd: string;
  monthWorkAmountHtDzd: number;
  withholdingGuaranteeRatePct: number;
  withholdingGuaranteeAmountDzd: number;
  netWorkAmountHtDzd: number;
  vatRatePct: number;
  vatAmountDzd: number;
  totalPayableTtcDzd: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'BILLED' | 'PAID';
  clientName: string;
  clientNif?: string;
  vatTaxPoint: 'ENCAISSEMENT' | 'DEBIT';
  isSettled: boolean;
  settlementDate?: string;
  notes?: string;
  sha256Seal: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteWorkSituationDto {
  siteId: string;
  situationNumber: string;
  periodStart: string;
  periodEnd: string;
  monthWorkAmountHtDzd: number;
  withholdingGuaranteeRatePct?: number;
  vatRatePct?: number;
  clientName: string;
  clientNif?: string;
  notes?: string;
}

export interface AssetEngineHourLog {
  id: string;
  tenantId: string;
  assetId: string; // FK racine Asset
  siteId: string;
  recordedAt: string;
  hoursValue: number;
  deltaHoursSinceLast: number;
  source: EngineHourSource;
  fuelType?: ConsumableType | string;
  fuelConsumedLiters?: number;
  fuelCostDzd?: number;
  hydraulicOilLiters?: number;
  hydraulicOilCostDzd?: number;
  engineOilLiters?: number;
  engineOilCostDzd?: number;
  adblueLiters?: number;
  adblueCostDzd?: number;
  coolantLiters?: number;
  totalConsumablesCostDzd?: number;
  workDescription?: string;
  operatorName?: string;
  isValidated: boolean;
  createdAt: string;
}

export interface RecordEngineHourLogDto {
  assetId: string;
  siteId: string;
  hoursValue: number;
  source?: EngineHourSource;
  fuelType?: ConsumableType | string;
  fuelConsumedLiters?: number;
  fuelCostDzd?: number;
  hydraulicOilLiters?: number;
  hydraulicOilCostDzd?: number;
  engineOilLiters?: number;
  engineOilCostDzd?: number;
  adblueLiters?: number;
  adblueCostDzd?: number;
  coolantLiters?: number;
  workDescription?: string;
  operatorName?: string;
}

export interface RecordSiteSituationDto {
  siteId: string;
  situationNumber: string;
  situationDate?: string;
  amountHtDzd: number;
  vatRatePct?: number;
  withholdingTaxRatePct?: number; // Ex: 5% ou 10% retenue de garantie BTPH
  clientName?: string;
  clientNif?: string;
  notes?: string;
  assetId?: string; // Actif principal ou représentatif du chantier
}

export interface AssetTransferChecklist {
  id: string;
  tenantId: string;
  assetId: string; // FK racine Asset
  fromSiteId?: string;
  toSiteId: string;
  transferDate: string;
  transferredBy: string;
  receivedBy?: string;
  meterHoursDeparture: number;
  meterHoursArrival?: number;
  generalState: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR';
  accessoriesChecked: Record<string, boolean>; // godet, brise-roche, chenilles, gyrophares, extincteur
  photosUrls: string[];
  signatureDepartureSvg?: string;
  signatureArrivalSvg?: string;
  requiresImmediateWorkOrder: boolean;
  generatedWorkOrderId?: string;
  createdAt: string;
}

export interface CreateAssetTransferChecklistDto {
  assetId: string;
  fromSiteId?: string;
  toSiteId: string;
  transferDate?: string;
  transferredBy: string;
  meterHoursDeparture: number;
  generalState: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR';
  accessoriesChecked: Record<string, boolean>;
  photosUrls?: string[];
  signatureDepartureSvg?: string;
  requiresImmediateWorkOrder?: boolean;
}

export interface SiteProfitabilitySummary {
  siteId: string;
  siteCode: string;
  siteName: string;
  wilayaCode: number;
  durationDays: number;
  internalAssetBillingDzd: number;
  fuelCostDzd: number;
  maintenanceCostDzd: number;
  laborCostDzd: number;
  totalDirectCostDzd: number;
  billedRevenueDzd: number;
  grossMarginDzd: number;
  grossMarginPct: number;
  assignedAssetsSummary: {
    assetId: string;
    assetCode: string;
    hoursRun: number;
    fuelLiters: number;
    costDzd: number;
  }[];
}

