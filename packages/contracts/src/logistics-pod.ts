/**
 * Contrats du Module Logistique & Preuve de Livraison (Module C)
 * Lettre de voiture électronique (LVE), Proof of Delivery (POD) mobile offline
 */

export enum ShipmentStatus {
  PREPARED = 'PREPARED',
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  RETURNED = 'RETURNED',
  DISPUTED = 'DISPUTED',
}

export interface ConsignmentNote {
  id: string;
  tenantId: string;
  lveNumber: string; // Numéro Lettre de Voiture Électronique
  missionId?: string; // Lien optionnel vers Ordre de Mission existant
  assetId: string;    // FK racine Asset
  assetCode?: string;
  driverId?: string;
  driverName?: string;
  shipperName: string;
  shipperAddress: string;
  shipperWilayaCode: number;
  consigneeName: string;
  consigneeAddress: string;
  consigneeWilayaCode: number;
  consigneePhoneDz: string;
  cargoNature: string;
  totalWeightKg: number;
  packagesCount: number;
  status: ShipmentStatus;
  qrCodeValidationHmac: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateConsignmentNoteDto {
  missionId?: string;
  assetId: string;
  driverId?: string;
  driverName?: string;
  shipperName: string;
  shipperAddress: string;
  shipperWilayaCode: number;
  consigneeName: string;
  consigneeAddress: string;
  consigneeWilayaCode: number;
  consigneePhoneDz: string;
  cargoNature: string;
  totalWeightKg: number;
  packagesCount: number;
}

export interface ProofOfDelivery {
  id: string;
  tenantId: string;
  lveId: string;
  assetId: string;
  deliveredAt: string;
  recipientName: string;
  recipientIdentityDocRef?: string;
  latitude?: number;
  longitude?: number;
  packagesDelivered: number;
  packagesDamaged: number;
  packagesRefused: number;
  photosUrls: string[];
  signatureSvg: string;
  notes?: string;
  isFirstPassDelivery: boolean; // Indicateur OTIF
  sha256ProofSeal: string;
  createdAt: string;
}

export interface RecordPodDto {
  lveId: string;
  recipientName: string;
  recipientIdentityDocRef?: string;
  latitude?: number;
  longitude?: number;
  packagesDelivered: number;
  packagesDamaged?: number;
  packagesRefused?: number;
  photosUrls?: string[];
  signatureSvg: string;
  notes?: string;
  isFirstPassDelivery?: boolean;
}

export interface DeliveryDispute {
  id: string;
  tenantId: string;
  lveId: string;
  assetId: string;
  disputeNumber: string;
  disputeType: 'DAMAGE' | 'SHORTAGE' | 'REFUSAL' | 'WRONG_ADDRESS' | 'LATE_DELIVERY';
  description: string;
  estimatedClaimAmountDzd: number;
  isBillingBlocked: boolean; // Règle : livraison litige bloque la facturation
  status: 'OPEN' | 'INVESTIGATING' | 'SETTLED';
  photosUrls: string[];
  createdAt: string;
}

export interface OtifMetrics {
  totalShipments: number;
  deliveredOnTime: number;
  deliveredInFull: number;
  otifRatePct: number;
  firstPassDeliveryRatePct: number;
  totalDeliveryCostDzd: number;
  averageCostPerDeliveryDzd: number;
  disputesCount: number;
}

