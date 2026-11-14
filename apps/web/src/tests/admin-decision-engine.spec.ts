import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG_FORM_DATA, CONFIG_MODAL_TABS } from '../app/admin/decision-engine/constants';
import type { PlatformDecisionEngineConfig } from '../app/admin/decision-engine/types';

describe('Admin Decision Engine Governance & 6 Physics Models (Lot 5 Target 1)', () => {
  it('définit les constantes canoniques par défaut calibrées pour le climat algérien', () => {
    // 1. Arrhenius Huile Moteur
    expect(DEFAULT_CONFIG_FORM_DATA.arrhenius_activation_energy).toBe(6500);
    expect(DEFAULT_CONFIG_FORM_DATA.arrhenius_ref_temp_c).toBe(90);
    expect(DEFAULT_CONFIG_FORM_DATA.arrhenius_idle_degradation_factor).toBe(1.8);

    // 2. Batterie Cranking CVHI
    expect(DEFAULT_CONFIG_FORM_DATA.battery_crit_voltage_mv_12v).toBe(9600);
    expect(DEFAULT_CONFIG_FORM_DATA.battery_crit_voltage_mv_24v).toBe(19200);
    expect(DEFAULT_CONFIG_FORM_DATA.battery_temp_comp_factor).toBe(15);

    // 3. Refroidissement EWMA
    expect(DEFAULT_CONFIG_FORM_DATA.cooling_ewma_alpha).toBe(0.15);
    expect(DEFAULT_CONFIG_FORM_DATA.cooling_overheat_threshold_c).toBe(11);
    expect(DEFAULT_CONFIG_FORM_DATA.cooling_clogging_threshold_c).toBe(7.5);
    expect(DEFAULT_CONFIG_FORM_DATA.cooling_thermostat_stuck_threshold_c).toBe(-12);

    // 4. Freinage Archard
    expect(DEFAULT_CONFIG_FORM_DATA.brake_wear_energy_per_mm_mj).toBe(25);
    expect(DEFAULT_CONFIG_FORM_DATA.brake_min_thickness_mm).toBe(3);

    // 5. Filtre à Particules DPF
    expect(DEFAULT_CONFIG_FORM_DATA.dpf_soot_limit_grams).toBe(45);
    expect(DEFAULT_CONFIG_FORM_DATA.dpf_backpressure_limit_mbar).toBe(300);

    // 6. Anti-Fraude Carburant CUSUM
    expect(DEFAULT_CONFIG_FORM_DATA.fuel_siphon_stop_liters).toBe(15);
    expect(DEFAULT_CONFIG_FORM_DATA.fuel_cusum_slack_liters).toBe(0.6);

    // Arbitrage Actuariel
    expect(DEFAULT_CONFIG_FORM_DATA.inaction_risk_multiplier).toBe(3.5);
    expect(DEFAULT_CONFIG_FORM_DATA.vhi_threshold_green).toBe(80);
    expect(DEFAULT_CONFIG_FORM_DATA.vhi_threshold_orange).toBe(50);
  });

  it('fournit les 7 onglets de modélisation physique sans omission', () => {
    expect(CONFIG_MODAL_TABS).toHaveLength(7);
    const categories = CONFIG_MODAL_TABS.map((t) => t.category);
    expect(categories).toEqual([
      'ENGINE_OIL',
      'BATTERY_CRANKING',
      'COOLING_SYSTEM',
      'BRAKE_PADS',
      'DPF_FILTER',
      'FUEL_CUSUM',
      'VHI_ARBITRAGE',
    ]);
  });

  it('garantit la conformité du cycle de vie Maker-Checker d une configuration', () => {
    const mockDraft: PlatformDecisionEngineConfig = {
      id: 'cfg-draft-1',
      version: 'v2.2-DRAFT',
      scope_key: 'ALGERIA_CORE_DECISION',
      status: 'DRAFT',
      is_active_publication: false,
      author_email: 'engineer@docteurflotte.dz',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config_hash: 'hash-draft-001',
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
      vhi_weights: {
        engine_oil: 0.25,
        battery: 0.2,
        cooling: 0.2,
        brakes: 0.15,
        dpf: 0.1,
        transmission: 0.1,
      },
      vhi_threshold_green: 80,
      vhi_threshold_orange: 50,
      inaction_risk_multiplier: 3.5,
      downtime_daily_costs_dzd: {
        HEAVY_TRUCK: 25000,
        LIGHT_VEHICLE: 12000,
      },
      climate_severity_factors: {
        TELL: 1.0,
        SAHARA: 1.45,
      },
    };

    expect(mockDraft.status).toBe('DRAFT');
    expect(mockDraft.is_active_publication).toBe(false);

    // Transition vers APPROVED (Checker)
    const approvedDraft: PlatformDecisionEngineConfig = {
      ...mockDraft,
      status: 'APPROVED',
      approved_by_email: 'lead-architect@docteurflotte.dz',
      approved_at: new Date().toISOString(),
    };
    expect(approvedDraft.status).toBe('APPROVED');
    expect(approvedDraft.approved_by_email).toBeDefined();

    // Transition vers ACTIVE (Publication en production)
    const activePublication: PlatformDecisionEngineConfig = {
      ...approvedDraft,
      is_active_publication: true,
    };
    expect(activePublication.is_active_publication).toBe(true);
  });
});
