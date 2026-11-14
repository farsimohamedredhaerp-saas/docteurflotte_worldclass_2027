import type { CreateDecisionConfigDto, ModalTabItem } from './types';

export const DEFAULT_CONFIG_FORM_DATA: CreateDecisionConfigDto = {
  version: '',
  scope_key: 'ALGERIA_CORE_DECISION',
  change_justification: 'Nouvelle configuration optimisée',
  scientific_validation_ref: '',
  arrhenius_activation_energy: 6500,
  arrhenius_ref_temp_c: 90,
  arrhenius_idle_degradation_factor: 1.8,
  battery_crit_voltage_mv_12v: 9600,
  battery_crit_voltage_mv_24v: 19200,
  battery_temp_comp_factor: 15,
  cooling_ewma_alpha: 0.15,
  cooling_overheat_threshold_c: 11,
  cooling_clogging_threshold_c: 7.5,
  cooling_thermostat_stuck_threshold_c: -12,
  brake_wear_energy_per_mm_mj: 25,
  brake_min_thickness_mm: 3,
  dpf_soot_limit_grams: 45,
  dpf_backpressure_limit_mbar: 300,
  fuel_siphon_stop_liters: 15,
  fuel_cusum_slack_liters: 0.6,
  fuel_cusum_alarm_ratio: 0.05,
  vhi_threshold_green: 80,
  vhi_threshold_orange: 50,
  inaction_risk_multiplier: 3.5,
};

export const CONFIG_MODAL_TABS: ModalTabItem[] = [
  { id: 0, label: '1. Arrhenius (Huile)', category: 'ENGINE_OIL' },
  { id: 1, label: '2. Batterie (CVHI)', category: 'BATTERY_CRANKING' },
  { id: 2, label: '3. Refroidissement (EWMA)', category: 'COOLING_SYSTEM' },
  { id: 3, label: '4. Freinage (Archard)', category: 'BRAKE_PADS' },
  { id: 4, label: '5. Colmatage (FAP)', category: 'DPF_FILTER' },
  { id: 5, label: '6. Anti-Fraude (CUSUM)', category: 'FUEL_CUSUM' },
  { id: 6, label: '7. VHI & Risque Inaction', category: 'VHI_ARBITRAGE' },
];
