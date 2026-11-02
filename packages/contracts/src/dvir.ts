/**
 * Contrats TypeScript pour le module DVIR (Driver Vehicle Inspection Report)
 * Conforme aux règles du Code de la Route algérien, contrôles ENACTA et Décret 03-223.
 */

export enum DVIRInspectionType {
  PRE_TRIP = 'PRE_TRIP',
  POST_TRIP = 'POST_TRIP',
}

export enum DVIRItemStatus {
  PASS = 'PASS',
  FAIL_MINOR = 'FAIL_MINOR',
  FAIL_CRITICAL = 'FAIL_CRITICAL',
}

export interface DVIRChecklistItem {
  code: string;
  category: 'MECHANICAL' | 'SAFETY_EQUIPMENT' | 'REGULATORY_DOCS' | 'TIRES_BRAKES' | 'LIGHTING';
  label: string;
  description?: string;
  status: DVIRItemStatus;
  comment?: string;
  photoUrl?: string;
}

export interface DVIRSubmissionDto {
  assetId: string;
  driverId: string;
  driverName: string;
  inspectionType: DVIRInspectionType;
  odometerKm?: number;
  engineHours?: number;
  items: DVIRChecklistItem[];
  generalNotes?: string;
  signatureDataUrl?: string;
  submittedAt?: string;
}

export interface DVIRInspectionReport {
  id: string;
  tenantId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  driverId: string;
  driverName: string;
  inspectionType: DVIRInspectionType;
  isCompliant: boolean;
  hasCriticalFailures: boolean;
  odometerKm?: number;
  items: DVIRChecklistItem[];
  signatureDataUrl?: string;
  generatedWorkOrderId?: string;
  submittedAt: string;
  resolvedAt?: string;
  resolvedByWorkOrderId?: string;
  resolutionNotes?: string;
}

export interface DVIRResolveBlockDto {
  assetId: string;
  workOrderId?: string;
  resolutionNotes?: string;
}

export interface DVIRResolveBlockResult {
  resolved: boolean;
  assetId: string;
  unblockedAt: string;
  resolvedWorkOrderId?: string;
  activeBlockRemaining: boolean;
}

export interface DVIRSyncBatchDto {
  reports: DVIRSubmissionDto[];
  syncDeviceId?: string;
  syncTimestampUtc?: string;
}

export interface DVIRSyncBatchResult {
  totalReceived: number;
  syncedCount: number;
  criticalFailuresCount: number;
  generatedWorkOrderIds: string[];
  processedReports: DVIRInspectionReport[];
}
