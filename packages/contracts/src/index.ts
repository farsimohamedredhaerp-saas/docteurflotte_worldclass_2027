export * from './health';
export * from './assets';
export * from './tenant';
export * from './auth';
export * from './telematics';
export * from './decisions';
export * from './eco-driving';
export * from './dvir';
export * from './cold-chain';
export * from './platform-admin';
export * from './copilot';
export * from './fuel-scanner';
export * from './digital-twin';
export * from './PredictiveRulEngine';
export * from './local-oem-resolver';
export * from './physics-engine';
export * from './algeria-regulatory';
export * from './country-packs';
export * from './dispatch';
export * from './subscriptions';
export * from './deterministic-physics';

// Explicit re-exports of runtime constants for bundlers (Turbopack / Webpack / Vite)
export { ALGERIA_58_WILAYAS_PROFILES } from './digital-twin';
export {
  LIGHT_COMMERCIAL_PRESET,
  HEAVY_TRUCK_PRESET,
  OFF_ROAD_BTP_PRESET,
} from './deterministic-physics';
export {
  ENACTA_REGULATORY_MATRIX,
  NAFTAL_FUEL_PRICES_DZD,
  REGIONAL_TOWING_RATES_DZD,
  PREDICTIVE_FAILURE_MODES_CATALOG,
  DAILY_DOWNTIME_COST_DZD,
  DEFAULT_SUBSTITUTION_WEIGHTS,
  ALGERIA_FISCAL_RATES,
} from './algeria-regulatory';
export { GLOBAL_COUNTRY_PACKS } from './country-packs';
export {
  ALGERIA_58_WILAYAS_MATRIX,
  WILAYAS_BY_CODE,
  WMI_REGISTRY_MAP,
  ISO_3779_YEAR_CODES,
  SEVERE_DUTY_FACTORS,
} from './local-oem-resolver';

