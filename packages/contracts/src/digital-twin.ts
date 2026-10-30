export type DigitalTwinOrganType =
  | 'ENGINE_OIL'
  | 'BATTERY_CRANKING'
  | 'BRAKE_PADS'
  | 'COOLING_SYSTEM'
  | 'DPF_FILTER';

export interface DigitalTwinOrganStatus {
  organ: DigitalTwinOrganType;
  name: string;
  icon: string;
  healthPercent: number; // 0 - 100
  remainingUsefulLifeValue: number;
  remainingUsefulLifeUnit: 'KM' | 'DAYS' | 'STARTS' | 'PERCENT';
  status: 'HEALTHY' | 'PRE_CRITICAL' | 'CRITICAL';
  physicsAlgorithm: string;
  observedMetrics: {
    label: string;
    value: string | number;
    threshold: string | number;
  }[];
  explanation: string;
}

export interface DigitalTwinSimulationParams {
  climateSeverityMultiplier: number; // 1.0 (Alger) à 1.7 (Sahara)
  driverAggressivenessMultiplier: number; // 0.8 (Éco) à 1.6 (Sportif)
  simulatedDailyKm?: number;
}

export interface DigitalTwinAsset {
  assetId: string;
  assetName: string;
  assetCode: string;
  category: string;
  brand: string;
  model: string;
  year: number;
  currentOdometerKm: number;
  currentVhi: number; // Score global 0 - 100
  wilayaLocation: string;
  driverAggressivenessScore: number;
  climateSeverityFactor: number;
  organs: DigitalTwinOrganStatus[];
  projectionTrajectory: {
    day0Vhi: number;
    day30VhiWithoutAction: number;
    day60VhiWithoutAction: number;
    day90VhiWithoutAction: number;
    day30VhiWithAction: number;
  };
  substitutionAsset?: {
    assetId: string;
    assetName: string;
    assetCode: string;
    vhiScore: number;
    locationWilaya: string;
    reason: string;
  };
  partsReservation?: {
    partNumber: string;
    partName: string;
    inStock: boolean;
    warehouseStockQty: number;
    estimatedCostDzd: number;
    oemHomologation: string;
  };
}
