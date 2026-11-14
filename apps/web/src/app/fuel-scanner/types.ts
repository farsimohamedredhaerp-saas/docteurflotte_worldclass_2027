import {
  FuelReceiptScanResult,
  StandardFuelType,
} from '@docteurflotte/contracts';

export type FuelStatusFilter = 'ALL' | 'VERIFIED' | 'ANOMALY';

export interface ManualReceiptFormData {
  assetId: string;
  stationName: string;
  fuelType: 'Gasoil' | 'Super' | 'Sans Plomb' | 'GPL';
  liters: number;
  totalAmountDzd: number;
}

export interface EditReceiptFormData {
  stationName: string;
  liters: number;
  totalAmountDzd: number;
}

export interface FuelScannerKpiSummary {
  totalCount: number;
  verifiedCount: number;
  anomalyCount: number;
  totalLiters: number;
  totalSpentDzd: number;
  gasoilLiters: number;
  sirghazEconomyDzd: number;
}

export interface ScanOverrides {
  liters: number;
  stationName: string;
  fuelType: StandardFuelType;
  rawText: string;
}

