import {
  DVIRInspectionReport,
  DVIRSubmissionDto,
  DVIRChecklistItem,
  DVIRInspectionType,
  DVIRItemStatus,
} from '../../lib/api-fleet-intelligence';

export {
  type DVIRInspectionReport,
  type DVIRSubmissionDto,
  type DVIRChecklistItem,
  DVIRInspectionType,
  DVIRItemStatus,
};

export interface VehicleProfile {
  id: string;
  name: string;
  plate: string;
  category: string;
  driverName: string;
  driverId: string;
  odometerKm: number;
  engineHours: number;
  wilaya: string;
  fuelType: string;
  lastInspectionDate: string;
  lastInspectionResult: 'PASS' | 'FAIL_MINOR' | 'FAIL_CRITICAL';
  lastInspectionNotes?: string;
  traccarDeviceId?: string;
}

export interface DvirKpiSummary {
  totalCount: number;
  passCount: number;
  criticalCount: number;
}

export type DvirLanguage = 'fr' | 'ar';
