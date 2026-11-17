/**
 * Contrats TypeScript pour la télémétrie de la Chaîne du Froid & Groupes Frigorifiques (Reefers)
 * Conforme aux normes d'hygiène alimentaire et pharmaceutique sous climat algérien.
 * SOUVERAINETÉ : Arrêté Interministériel du 21 Safar 1414, Normes DSV / Agrément Sanitaire ATP,
 * Traçabilité Thermique HACCP & Groupes Bi-Moteurs (Moteur porteur + Groupe froid auxiliaire).
 */

export enum ReeferCargoType {
  DAIRY = 'DAIRY',           // Produits laitiers (+2°C à +4°C)
  FRESH_MEAT = 'FRESH_MEAT', // Viandes fraîches (0°C à +2°C)
  FROZEN = 'FROZEN',         // Surgelés (-18°C à -22°C)
  PHARMA = 'PHARMA',         // Médicaments / Vaccins (+2°C à +8°C)
  PRODUCE = 'PRODUCE',       // Fruits & Légumes (+8°C à +12°C)
  AMBIENT = 'AMBIENT',       // Sec tempéré (+15°C à +25°C)
}

export enum ReeferPowerMode {
  DIESEL = 'DIESEL',
  ELECTRIC_STANDBY = 'ELECTRIC_STANDBY',
  OFF = 'OFF',
}

export interface ReeferUnit {
  id: string;
  tenantId: string;
  assetId: string;
  unitCode: string;
  makeModel: string;
  serialNumber?: string;
  atpCertificateNumber?: string;
  atpExpiryDate?: string;
  auxiliaryTankCapacityLiters: number;
  auxiliaryFuelLevelLiters: number;
  engineHoursTotal: number;
  electricHoursTotal: number;
  defaultCargoType: ReeferCargoType;
  targetSetpointTempC: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReeferUnitDto {
  assetId: string;
  unitCode: string;
  makeModel: string;
  serialNumber?: string;
  atpCertificateNumber?: string;
  atpExpiryDate?: string;
  auxiliaryTankCapacityLiters?: number;
  auxiliaryFuelLevelLiters?: number;
  defaultCargoType?: ReeferCargoType;
  targetSetpointTempC?: number;
}

export interface ReeferTelemetryPayload {
  deviceId?: string;
  assetId: string;
  reeferUnitId?: string;
  recordedAt?: string;
  cargoType: ReeferCargoType;
  setpointTempC: number;
  supplyTempC: number;      // Température de soufflage (évaporateur)
  returnTempC: number;      // Température de reprise (fond de caisse)
  ambientTempC?: number;    // Température extérieure ambiante
  humidityPercent?: number;
  powerMode: ReeferPowerMode;
  doorOpen: boolean;
  defrostActive?: boolean;
  engineHours?: number;
  engineHoursDiesel?: number;
  engineHoursElectric?: number;
  auxiliaryFuelLevelLiters?: number;
  fuelLevelPercent?: number;
  alarmCodes?: string[];
  latitude?: number;
  longitude?: number;
}

export interface ReeferTelemetryLog {
  id: string;
  tenantId: string;
  reeferUnitId: string;
  assetId: string;
  recordedAt: string;
  cargoType: ReeferCargoType;
  setpointTempC: number;
  supplyTempC: number;
  returnTempC: number;
  ambientTempC?: number;
  powerMode: ReeferPowerMode;
  doorOpen: boolean;
  defrostActive: boolean;
  auxiliaryFuelLevelLiters?: number;
  reeferEngineHours?: number;
  isWithinSafeRange: boolean;
  tempDeltaC: number;
  excursionDurationMinutes: number;
  financialRiskDzd: number;
  alarmCodes: string[];
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface ReeferLiveStatus {
  assetId: string;
  assetCode: string;
  assetName: string;
  reeferUnitId?: string;
  unitCode?: string;
  makeModel?: string;
  atpCertificateNumber?: string;
  atpExpiryDate?: string;
  auxiliaryTankCapacityLiters?: number;
  auxiliaryFuelLevelLiters?: number;
  auxiliaryFuelLevelPct?: number;
  cargoType: ReeferCargoType;
  currentTempC: number;
  supplyTempC?: number;
  setpointTempC: number;
  tempDeltaC: number;
  isWithinSafeRange: boolean;
  doorOpen: boolean;
  powerMode: ReeferPowerMode;
  lastUpdate: string;
  excursionDurationMinutes: number;
  estimatedCargoValueDzd: number;
  financialRiskDzd: number;
  alarmCodes?: string[];
  latitude?: number;
  longitude?: number;
}

export interface ReeferHaccpCertificate {
  id: string;
  tenantId: string;
  certificateRef: string;
  reeferUnitId: string;
  assetId: string;
  missionRef?: string;
  cargoType: ReeferCargoType;
  cargoDescription?: string;
  departureWilaya: number;
  arrivalWilaya: number;
  departureTime: string;
  arrivalTime?: string;
  minTempRecordedC: number;
  maxTempRecordedC: number;
  averageTempC: number;
  totalExcursionMinutes: number;
  complianceStatus: 'CONFORME_HACCP' | 'NON_CONFORME_EXCURSION' | 'ALERTE_PORTE_PROLONGEE';
  sanitaryVerdict: string;
  auxiliaryFuelConsumedLiters: number;
  auxiliaryFuelCostDzd: number;
  sha256Hash: string;
  createdAt: string;
}

export interface GenerateHaccpCertificateDto {
  reeferUnitId: string;
  assetId: string;
  missionRef?: string;
  cargoType: ReeferCargoType;
  cargoDescription?: string;
  departureWilaya: number;
  arrivalWilaya: number;
  departureTime: string;
  arrivalTime?: string;
  auxiliaryFuelConsumedLiters?: number;
}
