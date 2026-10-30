export interface FuelReceiptScanRequestDto {
  receiptImageBase64?: string;
  receiptTextRaw?: string;
  assetId: string;
  driverId?: string;
  manualOverrides?: {
    liters?: number;
    totalAmountDzd?: number;
    stationName?: string;
    fuelType?: string;
  };
}

export type FuelReconciliationStatus =
  | 'VERIFIED'
  | 'SUSPICIOUS_LOCATION'
  | 'SUSPICIOUS_VOLUME'
  | 'POTENTIAL_FRAUD'
  | 'INSUFFICIENT_TELEMATICS';

export interface FuelTelematicsReconciliation {
  matchedPositionId?: string;
  telematicsTimestamp?: string;
  distanceToStationMeters: number;
  isLocationVerified: boolean;
  tankLevelBeforeLiters: number;
  tankLevelAfterLiters: number;
  telematicsLevelDeltaLiters: number;
  varianceLiters: number;
  reconciliationStatus: FuelReconciliationStatus;
  confidenceScore: number;
  fraudRiskProbability: number;
  explanation: string;
}

export interface FuelReceiptScanResult {
  receiptId: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  stationName: string;
  stationWilaya: string;
  fuelType: 'Gasoil' | 'Super' | 'Sans Plomb' | 'GPL';
  liters: number;
  unitPriceDzd: number;
  totalAmountDzd: number;
  dateTime: string;
  receiptConfidence: number;
  reconciliation: FuelTelematicsReconciliation;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
