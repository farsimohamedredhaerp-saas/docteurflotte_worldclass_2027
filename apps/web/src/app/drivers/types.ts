export interface DriverRecord {
  id: string;
  name: string;
  matriculeNumber: string;
  phone: string;
  licenseCategory: 'C1' | 'C2' | 'E' | 'D' | 'B' | 'BTP_ENGIN';
  licenseNumber: string;
  licenseExpiry: string;
  medicalCheckExpiry: string;
  assignedVehiclePlate: string;
  assignedVehicleModel: string;
  currentSiteOrCorridor: string;
  ecoDrivingScore: number;
  harshBrakingCount: number;
  excessiveIdleMinutes: number;
  status: 'ON_DUTY' | 'AVAILABLE' | 'REST' | 'LICENSE_WARNING';
}

export type DriverCategory = DriverRecord['licenseCategory'];
export type DriverStatus = DriverRecord['status'];

export interface DriverFormData {
  name: string;
  matriculeNumber: string;
  phone: string;
  licenseCategory: DriverCategory;
  licenseNumber: string;
  licenseExpiry: string;
  medicalCheckExpiry: string;
  assignedVehiclePlate: string;
  assignedVehicleModel: string;
  currentSiteOrCorridor: string;
  status: DriverStatus;
}

export interface DriversKpiSummary {
  totalCount: number;
  onDutyCount: number;
  availableCount: number;
  warningCount: number;
}

export type DriverCategoryFilter = 'ALL' | 'HEAVY' | 'BTP' | 'LIGHT';
export type DriverStatusFilter = 'ALL' | 'ON_DUTY' | 'AVAILABLE' | 'REST' | 'LICENSE_WARNING';
