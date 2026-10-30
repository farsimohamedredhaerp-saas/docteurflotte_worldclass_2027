export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

export interface TelematicsDevice {
  id: string;
  tenantId: string;
  traccarId?: number;
  uniqueId: string; // IMEI ou numéro de série unique
  name: string;
  model?: string;
  status: DeviceStatus;
  lastUpdate?: string;
  attributes?: Record<string, any>;
  createdAt: string;
}

export interface AssetDeviceBinding {
  id: string;
  tenantId: string;
  assetId: string;
  deviceId: string;
  boundAt: string;
  unboundAt?: string;
  isActive: boolean;
  createdAt: string;
  // Données enrichies lors des requêtes
  assetName?: string;
  assetCode?: string;
  deviceName?: string;
  deviceUniqueId?: string;
}

export interface CanonicalPosition {
  id: string;
  tenantId: string;
  traccarPositionId: string;
  deviceId: string;
  assetId?: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  altitude?: number;
  course?: number;
  ignition: boolean;
  odometerKm?: number;
  engineHours?: number;
  recordedAt: string;
  createdAt: string;
  attributes?: Record<string, any>;
}

export interface RegisterDeviceDto {
  uniqueId: string;
  name: string;
  model?: string;
  traccarId?: number;
  attributes?: Record<string, any>;
}

export interface BindDeviceDto {
  assetId: string;
  deviceId: string;
}

export interface IngestPositionDto {
  traccarPositionId: string;
  uniqueId: string; // Utilisé pour retrouver le device
  latitude: number;
  longitude: number;
  speed: number;
  altitude?: number;
  course?: number;
  ignition: boolean;
  odometerKm?: number;
  engineHours?: number;
  recordedAt: string;
  attributes?: Record<string, any>;
}

export interface FleetLiveAsset {
  assetId: string;
  assetName: string;
  assetCode: string;
  assetCategory: string;
  deviceId?: string;
  deviceUniqueId?: string;
  deviceStatus: DeviceStatus;
  latitude?: number;
  longitude?: number;
  speed: number;
  ignition: boolean;
  lastRecordedAt?: string;
  currentMeterValue: number;
  nextMaintenanceMeterValue?: number;
  maintenanceDue: boolean;
}

export interface TraccarGatewayHealth {
  connected: boolean;
  serverUrl: string;
  deviceCount: number;
  activeBindingsCount: number;
  lastSyncAt: string;
  queueSize: number;
  errorRate: number;
}
