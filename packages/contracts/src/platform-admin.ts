export interface PlatformTenant {
  id: string;
  name: string;
  legal_name?: string;
  slug: string;
  activity_pack: string;
  plan_tier: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'TERMINATED';
  max_vehicles: number;
  max_devices: number;
  max_users: number;
  max_api_rate_per_min: number;
  contact_email: string;
  contact_phone?: string;
  tax_id_nif?: string;
  trade_reg_nis?: string;
  data_origin: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  actual_vehicles?: number;
  actual_users?: number;
}

export interface PlatformDecisionEngineConfig {
  id: string;
  version: string;
  scope_key: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  author_email: string;
  approved_by_email?: string;
  approved_at?: string;
  effective_from?: string;
  effective_to?: string;
  change_justification?: string;
  scientific_validation_ref?: string;
  config_hash?: string;
  canonical_content_hash?: string;
  arrhenius_activation_energy: number;
  arrhenius_ref_temp_c: number;
  arrhenius_idle_degradation_factor: number;
  battery_crit_voltage_mv_12v: number;
  battery_crit_voltage_mv_24v: number;
  battery_temp_comp_factor: number;
  cooling_ewma_alpha: number;
  cooling_overheat_threshold_c: number;
  cooling_clogging_threshold_c: number;
  cooling_thermostat_stuck_threshold_c: number;
  brake_wear_energy_per_mm_mj: number;
  brake_min_thickness_mm: number;
  dpf_soot_limit_grams: number;
  dpf_backpressure_limit_mbar: number;
  fuel_siphon_stop_liters: number;
  fuel_cusum_slack_liters: number;
  fuel_cusum_alarm_ratio: number;
  vhi_weights: Record<string, number>;
  vhi_threshold_green: number;
  vhi_threshold_orange: number;
  inaction_risk_multiplier: number;
  downtime_daily_costs_dzd: Record<string, number>;
  climate_severity_factors: Record<string, number>;
  created_at: string;
  updated_at: string;
  is_active_publication?: boolean;
}

export interface PlatformConfigPublication {
  id: string;
  scope_key: string;
  config_id: string;
  version: string;
  event_type: 'PUBLICATION_ACTIVATE' | 'PUBLICATION_ROLLBACK' | 'PUBLICATION_DEACTIVATE';
  effective_from: string;
  effective_to?: string;
  published_by: string;
  canonical_content_hash: string;
  justification?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformFiscalFuelPrice {
  id: string;
  fuel_type: string;
  label_fr: string;
  price_per_liter_dzd: number;
  tva_rate_pct: number;
  is_tva_deductible: boolean;
  official_reference_joradp: string;
  effective_date: string;
  is_active: boolean;
  author_email: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformRegulatoryEnactaRule {
  id: string;
  asset_category: string;
  label_fr: string;
  periodicity_months: number;
  first_inspection_months: number;
  warning_lead_days: number[];
  official_decree_ref: string;
  mandatory_checkpoints: string[];
  tariff_base_ht_dzd?: number;
  tva_rate_pct?: number;
  tariff_total_ttc_dzd?: number;
  internal_tco_provision_dzd?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdatePlatformRegulatoryEnactaRuleDto {
  tariff_base_ht_dzd?: number;
  tva_rate_pct?: number;
  tariff_total_ttc_dzd?: number;
  internal_tco_provision_dzd?: number;
  periodicity_months?: number;
  first_inspection_months?: number;
  official_decree_ref?: string;
  justification?: string;
}

export interface PlatformVignetteTarif {
  id: string;
  vehicle_category: string;
  power_cv_min: number;
  power_cv_max: number;
  vehicle_age_min_years: number;
  vehicle_age_max_years: number;
  amount_dzd: number;
  finance_law_year: number;
  official_reference_joradp: string;
  created_at: string;
}

export interface PlatformTelematicsGateway {
  id: string;
  name: string;
  provider_type: string;
  endpoint_url: string;
  api_port: number;
  protocol_ports: string;
  health_status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  is_active_gateway: boolean;
  max_packets_per_sec: number;
  current_latency_ms: number;
  last_heartbeat_at: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformAuditLog {
  id: string;
  actor_email: string;
  actor_role: string;
  ip_address?: string;
  action: string;
  target_entity: string;
  target_id?: string;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  legal_reference?: string;
  notes?: string;
  row_hash?: string;
  created_at: string;
}

export interface PlatformOverviewKpis {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalVehicles: number;
  totalUsers: number;
  activeDecisionConfigVersion: string;
  activeDecisionScope: string;
  fuelPricesCount: number;
  healthyGatewaysCount: number;
  lastAuditAction?: string;
  lastAuditTimestamp?: string;
}

export interface CreateDecisionConfigDto {
  version: string;
  scope_key?: string;
  change_justification: string;
  scientific_validation_ref?: string;
  arrhenius_activation_energy: number;
  arrhenius_ref_temp_c: number;
  arrhenius_idle_degradation_factor: number;
  battery_crit_voltage_mv_12v: number;
  battery_crit_voltage_mv_24v: number;
  battery_temp_comp_factor: number;
  cooling_ewma_alpha: number;
  cooling_overheat_threshold_c: number;
  cooling_clogging_threshold_c: number;
  cooling_thermostat_stuck_threshold_c: number;
  brake_wear_energy_per_mm_mj: number;
  brake_min_thickness_mm: number;
  dpf_soot_limit_grams: number;
  dpf_backpressure_limit_mbar: number;
  fuel_siphon_stop_liters: number;
  fuel_cusum_slack_liters: number;
  fuel_cusum_alarm_ratio: number;
  vhi_weights?: Record<string, number>;
  vhi_threshold_green?: number;
  vhi_threshold_orange?: number;
  inaction_risk_multiplier?: number;
  downtime_daily_costs_dzd?: Record<string, number>;
  climate_severity_factors?: Record<string, number>;
}

export type UpdateDecisionConfigDto = Partial<CreateDecisionConfigDto>;

export interface DecisionEngineSimulationParams {
  arrhenius_activation_energy: number;
  arrhenius_ref_temp_c: number;
  arrhenius_idle_degradation_factor: number;
  battery_crit_voltage_mv_12v: number;
  battery_crit_voltage_mv_24v: number;
  battery_temp_comp_factor: number;
  cooling_ewma_alpha: number;
  cooling_overheat_threshold_c: number;
  cooling_clogging_threshold_c: number;
  brake_wear_energy_per_mm_mj: number;
  brake_min_thickness_mm: number;
  dpf_soot_limit_grams: number;
  fuel_siphon_stop_liters: number;
  fuel_cusum_slack_liters: number;
  inaction_risk_multiplier: number;
}

export interface VehicleSimulationBenchmark {
  vehicleModel: string;
  category: string;
  engineCode: string;
  arrheniusOilEquivalentKmAt110C: number;
  batteryCrankingDropAtMinus5C_mV: number;
  batteryCrankingDropAtPlus45C_mV: number;
  coolingOverheatMargin_C: number;
  brakePadsEstimatedRemainingLifeKm: number;
  dpfRegenTriggerIntervalKm: number;
  fuelSiphonDetectionThresholdLiters: number;
  projectedVhiScore: number;
  projectedInactionRiskDzd: number;
}

export interface DecisionEngineSimulationResult {
  simulatedAt: string;
  canonical_content_hash: string;
  benchmarks: VehicleSimulationBenchmark[];
}
