/**
-- =============================================================================
-- Contrats TypeScript pour Mines, Carrières & Pneumatiques Hors-Route (OTR)
-- SOUVERAINETÉ : Gisements Miniers Algériens (Gâra Djebilet 50, Tébessa 12, M'Sila 28),
--               Engins d'Extraction Lourds (Dumpers 50T-100T Cat 777 / Komatsu HD785),
--               Physique Déterministe TKPH (Tonnes-Kilomètres Par Heure) & Standby Thermique.
-- =============================================================================
*/

export enum MiningSiteType {
  IRON_ORE = 'IRON_ORE',
  PHOSPHATE = 'PHOSPHATE',
  AGGREGATES_QUARRY = 'AGGREGATES_QUARRY',
  CEMENT_PLANT = 'CEMENT_PLANT',
  MARBLE = 'MARBLE',
}

export enum OtrTirePosition {
  FL = 'FL',   // Avant Gauche
  FR = 'FR',   // Avant Droit
  RLO = 'RLO', // Arrière Gauche Extérieur
  RLI = 'RLI', // Arrière Gauche Intérieur
  RRO = 'RRO', // Arrière Droit Extérieur
  RRI = 'RRI', // Arrière Droit Intérieur
}

export enum OtrTireStatus {
  MOUNTED = 'MOUNTED',
  COOLING_STANDBY = 'COOLING_STANDBY',
  REPAIR = 'REPAIR',
  SCRAPPED = 'SCRAPPED',
}

export interface MiningSite {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  wilayaCode: number;
  commune?: string;
  siteType: MiningSiteType;
  ambientTempSummerC: number;
  averageHaulDistanceKm: number;
  pisteGradientMaxPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMiningSiteDto {
  code: string;
  name: string;
  wilayaCode: number;
  commune?: string;
  siteType?: MiningSiteType;
  ambientTempSummerC?: number;
  averageHaulDistanceKm?: number;
  pisteGradientMaxPct?: number;
}

export interface OtrTire {
  id: string;
  tenantId: string;
  assetId?: string;
  serialNumber: string;
  brand: string;
  modelPattern?: string;
  dimension: string;
  position: OtrTirePosition;
  nominalTkph: number;
  purchaseCostDzd: number;
  treadDepthInitialMm: number;
  treadDepthCurrentMm: number;
  currentPressureBar?: number;
  currentTempC?: number;
  totalOperatingHours: number;
  status: OtrTireStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOtrTireDto {
  assetId?: string;
  serialNumber: string;
  brand: string;
  modelPattern?: string;
  dimension: string;
  position: OtrTirePosition;
  nominalTkph?: number;
  purchaseCostDzd?: number;
  treadDepthInitialMm?: number;
  treadDepthCurrentMm?: number;
}

export interface UpdateOtrTireTelemetryDto {
  tireId: string;
  pressureBar?: number;
  temperatureC?: number;
  treadDepthMm?: number;
  operatingHoursDelta?: number;
}

export interface DumperHaulingCycle {
  id: string;
  tenantId: string;
  siteId: string;
  assetId: string;
  driverId?: string;
  cycleTimestamp: string;
  cycleDurationMinutes: number;
  cycleDistanceKm: number;
  payloadMetricTons: number;
  fuelConsumedLiters: number;
  calculatedTkph: number;
  tkphAdmissible: number;
  isTkphExceeded: boolean;
  costPerTonDzd: number;
  coolingStandbyRecommended: boolean;
  createdAt: string;
}

export interface RecordHaulingCycleDto {
  siteId: string;
  assetId: string;
  driverId?: string;
  cycleDurationMinutes: number;
  cycleDistanceKm: number;
  payloadMetricTons: number;
  fuelConsumedLiters: number;
  emptyWeightTons?: number; // Poids à vide du dumper (ex: 65T pour un 100T)
  ambientTempC?: number;
  nominalTkph?: number;
}
