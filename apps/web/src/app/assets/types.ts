import { AssetCategory, AssetStatus, MeterType } from '@docteurflotte/contracts';

export interface CreateAssetFormData {
  name: string;
  code: string;
  category: AssetCategory;
  brand: string;
  model: string;
  year: number;
  primaryMeterType: MeterType;
  initialMeterValue: number;
  maintenanceIntervalValue: number;
}

export interface EditAssetFormData {
  name: string;
  code: string;
  brand: string;
  model: string;
  category: AssetCategory;
  maintenanceIntervalValue: number;
}

export interface MeterReadingFormData {
  meterType: MeterType;
  value: number;
}

export interface AssetsKpiSummary {
  totalCount: number;
  operationalCount: number;
  maintenanceCount: number;
  downCount: number;
  canJ1939Count: number;
}
