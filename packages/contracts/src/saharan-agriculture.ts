/**
 * Contrats TypeScript pour l'Agriculture Saharienne & Grands Forages (Module AGRI-Pivots & Moisson-Battage)
 * SOUVERAINETÉ : Sécurité Alimentaire Nationale (Céréaliculture Grand Sud : Adrar, Timimoun, Biskra, El Oued),
 * Irrigation Albienne (Suivi en Litres/Heure L/h sans odomètre), Rémunération à la tâche (Hectares & Quintaux CCLS / OAIC).
 */

export enum CropType {
  BLE_DUR = 'BLE_DUR',
  ORGE = 'ORGE',
  MAIS = 'MAIS',
  LUZERNE = 'LUZERNE',
  PALMIER_DATTIER = 'PALMIER_DATTIER',
}

export enum PivotStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  MAINTENANCE = 'MAINTENANCE',
  FAULT = 'FAULT',
}

export enum AgriculturalTaskType {
  MOISSON_BATTAGE = 'MOISSON_BATTAGE',
  LABOUR_PROFOND = 'LABOUR_PROFOND',
  SEMIS = 'SEMIS',
  TRAITEMENT = 'TRAITEMENT',
  EPANDAGE = 'EPANDAGE',
}

export interface FarmProperty {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  wilayaCode: number;
  commune?: string;
  totalSurfaceHectares: number;
  cclsCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmPropertyDto {
  code: string;
  name: string;
  wilayaCode: number;
  commune?: string;
  totalSurfaceHectares: number;
  cclsCode?: string;
}

export interface IrrigationPivot {
  id: string;
  tenantId: string;
  farmId: string;
  pivotCode: string;
  name: string;
  cropType: CropType;
  surfaceHectares: number;
  boreholeDepthMeters: number;
  generatorAssetId?: string;
  pumpPowerKw: number;
  nominalFlowM3H: number;
  nominalFuelBurnRateLH: number;
  status: PivotStatus;
  totalRunningHours: number;
  totalWaterVolumeM3: number;
  totalFuelConsumedLiters: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIrrigationPivotDto {
  farmId: string;
  pivotCode: string;
  name: string;
  cropType?: CropType;
  surfaceHectares?: number;
  boreholeDepthMeters?: number;
  generatorAssetId?: string;
  pumpPowerKw?: number;
  nominalFlowM3H?: number;
  nominalFuelBurnRateLH?: number;
}

export interface IrrigationTelemetryLog {
  id: string;
  tenantId: string;
  pivotId: string;
  recordedAt: string;
  hoursRunningDelta: number;
  fuelConsumedLiters: number;
  hourlyBurnRateLH: number;
  waterFlowM3H: number;
  waterPressureBar: number;
  efficiencyRatioLPerM3: number;
  ambientTempC?: number;
  isBurnRateAbnormal: boolean;
  createdAt: string;
}

export interface RecordIrrigationTelemetryDto {
  pivotId: string;
  hoursRunningDelta: number;
  fuelConsumedLiters: number;
  waterFlowM3H?: number;
  waterPressureBar?: number;
  ambientTempC?: number;
}

export interface HarvestCampaignLog {
  id: string;
  tenantId: string;
  farmId: string;
  assetId: string;
  driverId?: string;
  campaignYear: number;
  cropType: CropType;
  taskType: AgriculturalTaskType;
  startDate: string;
  endDate?: string;
  areaWorkedHectares: number;
  yieldQuintals: number;
  cclsDeliveryNoteRef?: string;
  driverRatePerHectareDzd: number;
  driverRatePerQuintalDzd: number;
  driverPayoutDzd: number;
  fuelConsumedLiters: number;
  fuelCostDzd: number;
  totalCostPerQuintalDzd: number;
  sha256Proof: string;
  createdAt: string;
}

export interface RecordHarvestCampaignDto {
  farmId: string;
  assetId: string;
  driverId?: string;
  campaignYear?: number;
  cropType?: CropType;
  taskType?: AgriculturalTaskType;
  startDate: string;
  endDate?: string;
  areaWorkedHectares: number;
  yieldQuintals?: number;
  cclsDeliveryNoteRef?: string;
  driverRatePerHectareDzd?: number;
  driverRatePerQuintalDzd?: number;
  fuelConsumedLiters: number;
}

