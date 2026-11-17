/**
 * Contrats du Module Stock Pièces & Approvisionnement Atelier (Module F)
 * Complète le module work-orders par la gestion du stock et l'imputation sur asset_id
 */

export interface PartItem {
  id: string;
  tenantId: string;
  partNumber: string; // Référence OEM / Fabricant
  designation: string;
  category: 'FILTRES' | 'FREINAGE' | 'LUBRIFIANTS' | 'PNEUMATIQUES' | 'SUSPENSION' | 'MOTEUR' | 'ELECTRICITE' | 'DIVERS';
  oemBrandCompatibility: string[]; // Renault, Shacman, MAN, Mercedes, etc.
  unitMeasure: 'PIECE' | 'LITRE' | 'KG' | 'JEU';
  averageWeightedCostDzd: number; // Coût Moyen Unitaire Pondéré (CMUP)
  defaultSellingPriceDzd: number;
  totalQuantityInStock: number;
  reorderPointQuantity: number; // Seuil de réapprovisionnement automatique
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartItemDto {
  partNumber: string;
  designation: string;
  category: PartItem['category'];
  oemBrandCompatibility?: string[];
  unitMeasure?: PartItem['unitMeasure'];
  initialCostDzd: number;
  reorderPointQuantity?: number;
}

export interface PartWarehouse {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  wilayaCode: number;
  address?: string;
  managerName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PartStockLevel {
  id: string;
  tenantId: string;
  partId: string;
  partNumber?: string;
  partDesignation?: string;
  warehouseId: string;
  warehouseName?: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  isBelowReorderPoint: boolean;
  locationBin?: string; // Rayon / Casier
  updatedAt: string;
}

export interface WorkOrderPartConsumption {
  id: string;
  tenantId: string;
  workOrderId: string;
  assetId: string; // FK racine Asset
  partId: string;
  warehouseId: string;
  quantityConsumed: number;
  unitCostAppliedDzd: number;
  totalCostDzd: number;
  consumedAt: string;
  consumedByUserId: string;
}

export interface RecordWorkOrderPartConsumptionDto {
  workOrderId: string;
  assetId: string;
  partId: string;
  warehouseId: string;
  quantityConsumed: number;
  unitCostAppliedDzd?: number;
}

export interface PartPurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  supplierName: string;
  supplierNif?: string;
  supplierCurrency: 'DZD' | 'USD' | 'EUR';
  exchangeRateToDzd: number;
  totalAmountCurrency: number;
  totalAmountDzd: number;
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  orderedAt: string;
  expectedDeliveryDate?: string;
  receivedAt?: string;
  items: {
    partId: string;
    partNumber: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPriceCurrency: number;
  }[];
  createdAt: string;
}

