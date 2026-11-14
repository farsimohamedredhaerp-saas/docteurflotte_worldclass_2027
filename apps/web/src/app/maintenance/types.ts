import type {
  VehicleAssetRecord,
  TelemetryDtcItem,
  MaintenanceWorkOrderItem,
  OemPartItem,
  WarehouseStoreItem,
  PartInventoryItemRecord,
  StockMovementRecord,
  PurchaseOrderRecord,
} from '@/lib/api-maintenance-40';
import type { SubsystemType, RulCalculationResult } from '@docteurflotte/contracts';

export type MaintenanceTab =
  | 'hub'
  | 'diagnostics'
  | 'organs'
  | 'calculations'
  | 'cooldown';

export interface TechnicalFilters {
  category: 'ALL' | 'HEAVY_TRUCK' | 'CONSTRUCTION_MACHINERY_BTP' | 'LIGHT_COMMERCIAL';
  severity: 'ALL' | 'UNDER_25H' | 'UNDER_1000KM' | 'CRITICAL';
  subsystem: 'ALL' | 'ENGINE' | 'HYDRAULICS' | 'BRAKES_APS' | 'TRANSMISSION' | 'FUEL_SYSTEM';
}

export interface InventoryStats {
  totalValuationDzd: number;
  totalReferences: number;
  lowStockAlerts: number;
  outOfStockCount: number;
  activeOrdersCount: number;
}

export type {
  VehicleAssetRecord,
  TelemetryDtcItem,
  MaintenanceWorkOrderItem,
  OemPartItem,
  WarehouseStoreItem,
  PartInventoryItemRecord,
  StockMovementRecord,
  PurchaseOrderRecord,
  SubsystemType,
  RulCalculationResult,
};

