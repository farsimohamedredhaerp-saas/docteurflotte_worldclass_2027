import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum IngestionSource {
  TRACCAR = 'TRACCAR',
  FLESPI = 'FLESPI',
  VIRTUAL_MODE_0 = 'VIRTUAL_MODE_0',
}

export enum EngineStateEnum {
  OFF = 'OFF',
  ON = 'ON',
  IDLE = 'IDLE',
}

export enum Mode0EventType {
  NAFTAL_FUEL_TICKET = 'NAFTAL_FUEL_TICKET',
  MOBILE_DVIR_ODOMETER = 'MOBILE_DVIR_ODOMETER',
  VALHALLA_MISSION_COMPLETED = 'VALHALLA_MISSION_COMPLETED',
}

export enum TelematicsConnectivityStatus {
  ONLINE = 'ONLINE',
  IDLE = 'IDLE',
  OFFLINE = 'OFFLINE',
  OFFLINE_DARK_ZONE = 'OFFLINE_DARK_ZONE',
  TAMPER_SUSPECTED = 'TAMPER_SUSPECTED',
}

export interface CanonicalTelemetryEvent {
  time: string; // ISO-8601 UTC
  tenantId: string;
  vehicleId: string;
  deviceImei: string;
  sourceProvider: IngestionSource;
  // Géolocalisation & Cinématique
  latitude: number;
  longitude: number;
  altitudeM: number;
  speedKmh: number;
  headingDeg: number;
  // État Moteur & Compteurs Consolidés
  ignitionOn: boolean;
  engineState: EngineStateEnum;
  odometerKm: number | null;
  engineHoursSec: number | null;
  // Paramètres CAN Bus / OBD-II / J1939
  engineRpm: number | null;
  engineLoadPct: number | null;
  coolantTempC: number | null;
  ambientTempC: number | null;
  batteryMv: number | null;
  fuelLevelPct: number | null;
  fuelUsedTotalL: number | null;
  defLevelPct: number | null;
  // Paramètres Avancés J1939 (EPIC 2)
  oilPressureKpa?: number | null;
  fuelRateLPerHour?: number | null;
  retarderTorquePct?: number | null;
  axleWeightKg?: number | null;
  // Statut de Connectivité (EPIC 2 Tâche 2.4)
  connectivityStatus?: TelematicsConnectivityStatus;
  // Équipements Métiers (BTP, Frigo, Agriculture) & Alertes
  ptoEngaged: boolean;
  harshEvent: string | null; // HARSH_BRAKE | HARSH_ACCEL | HARSH_TURN | CRASH
  dtcCodes: string[];
  extraIotSensors: Record<string, unknown>;
  needsFlespiFailover: boolean;
}

// --- Payloads Entrants Traccar ---
export class TraccarDeviceDto {
  @IsNumber() id: number;
  @IsString() name: string;
  @IsString() uniqueId: string; // IMEI
  @IsOptional() @IsString() status?: string;
}

export class TraccarPositionDto {
  @IsOptional() @IsNumber() id?: number;
  @IsNumber() deviceId: number;
  @IsOptional() @IsString() protocol?: string;
  @IsString() fixTime: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsOptional() @IsNumber() altitude?: number = 0;
  @IsOptional() @IsNumber() speed?: number = 0; // En noeuds (Knots) dans Traccar
  @IsOptional() @IsNumber() course?: number = 0;
  @IsObject() attributes: Record<string, unknown> = {};
}

export class TraccarWebhookRequestDto {
  @ValidateNested() @Type(() => TraccarPositionDto) position: TraccarPositionDto;
  @ValidateNested() @Type(() => TraccarDeviceDto) device: TraccarDeviceDto;
}

// --- Payload Entrant Flespi (Failover Stateless) ---
export class FlespiStreamRequestDto {
  @IsArray() messages: Record<string, unknown>[];
}

// --- Payload Entrant Mode 0 (Sans Boîtier) ---
export class Mode0VirtualIngestionDto {
  @IsString() tenantId: string;
  @IsString() vehicleId: string;
  @IsEnum(Mode0EventType) eventType: Mode0EventType;
  @IsOptional() @IsString() recordedAt?: string;
  @IsOptional() @IsNumber() latitude?: number = 36.7525;
  @IsOptional() @IsNumber() longitude?: number = 3.042;
  @IsOptional() @IsNumber() naftalLitersFilled?: number;
  @IsOptional() @IsNumber() fuelTankCapacityL?: number = 400.0;
  @IsOptional() @IsNumber() refConsumptionL100Km?: number = 34.0;
  @IsOptional() @IsNumber() climateSeverityAlpha?: number = 0.75; // 0.75 Tell, 0.80 Hauts Plateaux, 0.60 Sahara
  @IsOptional() @IsNumber() reportedOdometerKm?: number;
  @IsOptional() @IsNumber() reportedEngineHours?: number;
  @IsOptional() @IsNumber() missionDistanceKm?: number;
  @IsOptional() @IsNumber() missionDurationHours?: number;
  @IsNumber() currentDbOdometerKm: number = 0;
  @IsNumber() currentDbEngineHours: number = 0;
}
