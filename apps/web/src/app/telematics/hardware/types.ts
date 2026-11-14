export type DeviceCategory = 'all' | 'heavy' | 'light' | 'cold-chain' | 'autonomous' | 'obd' | 'video';

export type GatewayFilter = 'all' | 'traccar' | 'flespi';

export type TelecomOperator = 'mobilis' | 'ooredoo' | 'djezzy';

export interface DeviceSpecs {
  voltage: string;
  battery: string;
  ipRating: string;
  inputs: string;
}

export interface DeviceItem {
  id: string;
  name: string;
  manufacturer: string;
  category: Exclude<DeviceCategory, 'all'>;
  categoryLabel: string;
  traccarProtocol: string;
  traccarPort: number;
  flespiDeviceType: string;
  flespiSupported: boolean;
  connectivity: string;
  canSupport: string;
  supportedSensors: string[];
  recommendedAlgorithms: string[];
  description: string;
  defaultConfigSample: string;
  algeriaReadiness: 'EXCELLENT' | 'RECOMMENDED' | 'STANDARD';
  specs: DeviceSpecs;
}

export interface ProtocolReferenceRow {
  port: number;
  proto: string;
  mfr: string;
  flespi: string;
  trans: string;
  can: string;
}

export interface CategoryOption {
  id: DeviceCategory;
  label: string;
}

