/**
 * Contrats TypeScript pour le module Éco-Conduite & Lutte Anti-Gaspillage Naftal
 * Les barèmes de carburants sont résolus dynamiquement depuis platform_fiscal_fuel_prices (Mode Réglementaire / Fiscal)
 * et ne doivent jamais être codés en dur dans les contrats applicatifs.
 */

export enum DrivingSeverityLevel {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  MODERATE = 'MODERATE',
  RISKY = 'RISKY',
}

export interface EcoDrivingEvent {
  id: string;
  tenantId: string;
  assetId: string;
  driverId?: string;
  eventType: 'HARSH_ACCEL' | 'HARSH_BRAKE' | 'HARSH_CORNER' | 'EXCESSIVE_IDLING' | 'OVERSPEED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  value: number; // Accélération en m/s², vitesse en km/h, ou durée en sec
  durationSeconds: number;
  latitude: number;
  longitude: number;
  speedKmH: number;
  timestamp: string;
}

export interface DriverEcoScore {
  driverId: string;
  driverName: string;
  tenantId: string;
  score100: number; // 0 à 100
  level: DrivingSeverityLevel;
  totalDistanceKm: number;
  totalOperatingHours: number;
  idlingHours: number;
  idlingFuelLiters: number;
  idlingCostDzd: number;
  harshAccelCount: number;
  harshBrakeCount: number;
  harshCornerCount: number;
  overspeedMinutes: number;
  suggestedEcoBonusDzd: number; // Prime éco-conduite suggérée
  co2ExcessKg: number;
}

export interface FleetEcoSummary {
  tenantId: string;
  period: 'DAY' | 'WEEK' | 'MONTH';
  totalFleetDistanceKm: number;
  totalIdlingHours: number;
  totalWastedFuelLiters: number;
  totalFinancialLossDzd: number;
  averageFleetScore: number;
  potentialSavingsDzd: number;
  activeFuelPriceDzd: number; // Prix unitaire du gasoil en vigueur issu de platform_fiscal_fuel_prices (ex: 31.00 DA/L)
  fuelPriceReference?: string; // Référence officielle (ex: 'Ministère des Hydrocarbures et des Mines')
  topDrivers: DriverEcoScore[];
  bottomDrivers: DriverEcoScore[];
}
