/**
 * Contrats TypeScript pour la télémétrie de la Chaîne du Froid & Groupes Frigorifiques (Reefers)
 * Conforme aux normes d'hygiène alimentaire et pharmaceutique sous climat algérien.
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

export interface ReeferTelemetryPayload {
  deviceId?: string;
  assetId: string;
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
  fuelLevelPercent?: number;
  alarmCodes?: string[];
}

export interface ReeferLiveStatus {
  assetId: string;
  assetCode: string;
  assetName: string;
  cargoType: ReeferCargoType;
  currentTempC: number;
  setpointTempC: number;
  tempDeltaC: number;
  isWithinSafeRange: boolean;
  doorOpen: boolean;
  powerMode: ReeferPowerMode;
  lastUpdate: string;
  excursionDurationMinutes: number;
  estimatedCargoValueDzd: number;
  financialRiskDzd: number;
}
