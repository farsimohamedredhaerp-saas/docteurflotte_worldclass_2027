/**
 * Alignement avec AGENTS.md Section 6 et skill asset-maintenance-core :
 * Le produit est une plateforme multi-métier pour tous les actifs opérationnels,
 * et ne doit pas être réduit à une classe de véhicules unique.
 */

export enum AssetCategory {
  ROAD_VEHICLE = 'ROAD_VEHICLE',
  HEAVY_TRUCK = 'HEAVY_TRUCK',
  CONSTRUCTION_EQUIPMENT = 'CONSTRUCTION_EQUIPMENT',
  INDUSTRIAL_MACHINE = 'INDUSTRIAL_MACHINE',
  TECHNICAL_DEVICE = 'TECHNICAL_DEVICE',
  OTHER = 'OTHER',
}

export enum AssetStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  IN_SERVICE = 'IN_SERVICE',
  DOWN = 'DOWN',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export enum MeterType {
  ODOMETER_KM = 'ODOMETER_KM',
  ENGINE_HOURS = 'ENGINE_HOURS',
  OPERATING_CYCLES = 'OPERATING_CYCLES',
  CUSTOM = 'CUSTOM',
}

export enum MeterSource {
  MANUAL = 'MANUAL',
  TELEMATICS = 'TELEMATICS',
  IMPORT = 'IMPORT',
  WORK_ORDER = 'WORK_ORDER',
}

export enum DataOrigin {
  DEMO = 'DEMO',
  IMPORT = 'IMPORT',
  USER_ENTRY = 'USER_ENTRY',
  TELEMATICS = 'TELEMATICS',
  INTEGRATION = 'INTEGRATION',
}

export enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  code: string; // Immatriculation, code parc ou numéro de série
  category: AssetCategory;
  brand?: string;
  model?: string;
  year?: number;
  status: AssetStatus;
  dataOrigin: DataOrigin;
  primaryMeterType: MeterType;
  currentMeterValue: number;
  maintenanceIntervalValue?: number; // Ex: Révision tous les 10 000 km ou 250 h
  nextMaintenanceMeterValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDto {
  name: string;
  code: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  year?: number;
  primaryMeterType: MeterType;
  initialMeterValue: number;
  maintenanceIntervalValue?: number;
}

export interface MeterReading {
  id: string;
  tenantId: string;
  assetId: string;
  meterType: MeterType;
  value: number;
  source: MeterSource;
  recordedAt: string;
  isValidated: boolean;
  validationError?: string;
}

export interface RecordMeterReadingDto {
  meterType: MeterType;
  value: number;
  source?: MeterSource;
  recordedAt?: string;
}

export interface MeterReadingResponse {
  success: boolean;
  reading: MeterReading;
  currentValue: number;
  rollbackDetected: boolean;
  maintenanceTriggered: boolean;
  message: string;
}

export type ClosedLoopAlgorithmKey =
  | 'OIL_ARRHENIUS'
  | 'COOLING_THERMAL'
  | 'BRAKE_ARCHARD'
  | 'BATTERY_CRANKING'
  | 'DPF_REGENERATION'
  | 'CUSUM_FUEL'
  | 'ALL';

export interface WorkOrder {
  id: string;
  tenantId: string;
  assetId: string;
  assetName?: string;
  assetCode?: string;
  title: string;
  description?: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  triggerMeterValue?: number;
  estimatedLaborHours?: number;
  actualLaborHours?: number;
  hourlyRateApplied?: number;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  downtimeHours?: number;
  assignedTo?: string;
  resetAlgorithmKey?: ClosedLoopAlgorithmKey;
  oemPartReference?: string;
  mathematicalResetCertified?: boolean;
  recalculatedVhi?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkOrderDto {
  assetId: string;
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
  estimatedLaborHours?: number;
  assignedTo?: string;
}

export interface CompleteWorkOrderDto {
  actualLaborHours: number;
  partsCost?: number;
  downtimeHours?: number;
  completionNotes?: string;
  resetAlgorithmKey?: ClosedLoopAlgorithmKey;
  oemPartReference?: string;
  recalculatedVhi?: number;
}
