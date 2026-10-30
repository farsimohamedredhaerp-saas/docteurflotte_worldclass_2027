import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  CreateDecisionConfigDto as ICreateDecisionConfigDto,
  DecisionEngineSimulationParams as IDecisionEngineSimulationParams,
} from '@docteurflotte/contracts';

export class CreateDecisionConfigDto implements ICreateDecisionConfigDto {
  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsString()
  @IsOptional()
  scope_key?: string;

  @IsString()
  @IsNotEmpty()
  change_justification!: string;

  @IsString()
  @IsOptional()
  scientific_validation_ref?: string;

  // 1. Arrhenius
  @IsNumber()
  @Min(3000)
  @Max(12000)
  arrhenius_activation_energy!: number;

  @IsNumber()
  @Min(70)
  @Max(110)
  arrhenius_ref_temp_c!: number;

  @IsNumber()
  @Min(1.0)
  @Max(3.0)
  arrhenius_idle_degradation_factor!: number;

  // 2. Battery CVHI
  @IsNumber()
  @Min(8000)
  @Max(11000)
  battery_crit_voltage_mv_12v!: number;

  @IsNumber()
  @Min(16000)
  @Max(22000)
  battery_crit_voltage_mv_24v!: number;

  @IsNumber()
  @Min(5.0)
  @Max(30.0)
  battery_temp_comp_factor!: number;

  // 3. Cooling EWMA
  @IsNumber()
  @Min(0.01)
  @Max(0.5)
  cooling_ewma_alpha!: number;

  @IsNumber()
  @Min(5.0)
  @Max(25.0)
  cooling_overheat_threshold_c!: number;

  @IsNumber()
  @Min(3.0)
  @Max(15.0)
  cooling_clogging_threshold_c!: number;

  @IsNumber()
  @Min(-25.0)
  @Max(-5.0)
  cooling_thermostat_stuck_threshold_c!: number;

  // 4. Brakes Archard
  @IsNumber()
  @Min(10.0)
  @Max(50.0)
  brake_wear_energy_per_mm_mj!: number;

  @IsNumber()
  @Min(1.5)
  @Max(6.0)
  brake_min_thickness_mm!: number;

  // 5. DPF
  @IsNumber()
  @Min(20.0)
  @Max(100.0)
  dpf_soot_limit_grams!: number;

  @IsNumber()
  @Min(150.0)
  @Max(600.0)
  dpf_backpressure_limit_mbar!: number;

  // 6. Fuel CUSUM
  @IsNumber()
  @Min(5.0)
  @Max(40.0)
  fuel_siphon_stop_liters!: number;

  @IsNumber()
  @Min(0.2)
  @Max(2.0)
  fuel_cusum_slack_liters!: number;

  @IsNumber()
  @Min(0.01)
  @Max(0.15)
  fuel_cusum_alarm_ratio!: number;

  // Metadata & Economics
  @IsObject()
  @IsOptional()
  vhi_weights?: Record<string, number>;

  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(95)
  vhi_threshold_green?: number;

  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(60)
  vhi_threshold_orange?: number;

  @IsNumber()
  @IsOptional()
  @Min(1.5)
  @Max(10.0)
  inaction_risk_multiplier?: number;

  @IsObject()
  @IsOptional()
  downtime_daily_costs_dzd?: Record<string, number>;

  @IsObject()
  @IsOptional()
  climate_severity_factors?: Record<string, number>;
}

export class UpdateDecisionConfigDto {
  @IsString()
  @IsOptional()
  change_justification?: string;

  @IsString()
  @IsOptional()
  scientific_validation_ref?: string;

  @IsNumber()
  @IsOptional()
  arrhenius_activation_energy?: number;

  @IsNumber()
  @IsOptional()
  arrhenius_ref_temp_c?: number;

  @IsNumber()
  @IsOptional()
  arrhenius_idle_degradation_factor?: number;

  @IsNumber()
  @IsOptional()
  battery_crit_voltage_mv_12v?: number;

  @IsNumber()
  @IsOptional()
  battery_crit_voltage_mv_24v?: number;

  @IsNumber()
  @IsOptional()
  battery_temp_comp_factor?: number;

  @IsNumber()
  @IsOptional()
  cooling_ewma_alpha?: number;

  @IsNumber()
  @IsOptional()
  cooling_overheat_threshold_c?: number;

  @IsNumber()
  @IsOptional()
  cooling_clogging_threshold_c?: number;

  @IsNumber()
  @IsOptional()
  cooling_thermostat_stuck_threshold_c?: number;

  @IsNumber()
  @IsOptional()
  brake_wear_energy_per_mm_mj?: number;

  @IsNumber()
  @IsOptional()
  brake_min_thickness_mm?: number;

  @IsNumber()
  @IsOptional()
  dpf_soot_limit_grams?: number;

  @IsNumber()
  @IsOptional()
  dpf_backpressure_limit_mbar?: number;

  @IsNumber()
  @IsOptional()
  fuel_siphon_stop_liters?: number;

  @IsNumber()
  @IsOptional()
  fuel_cusum_slack_liters?: number;

  @IsNumber()
  @IsOptional()
  fuel_cusum_alarm_ratio?: number;

  @IsObject()
  @IsOptional()
  vhi_weights?: Record<string, number>;

  @IsNumber()
  @IsOptional()
  vhi_threshold_green?: number;

  @IsNumber()
  @IsOptional()
  vhi_threshold_orange?: number;

  @IsNumber()
  @IsOptional()
  inaction_risk_multiplier?: number;

  @IsObject()
  @IsOptional()
  downtime_daily_costs_dzd?: Record<string, number>;

  @IsObject()
  @IsOptional()
  climate_severity_factors?: Record<string, number>;
}

export class DecisionEngineSimulationParamsDto implements IDecisionEngineSimulationParams {
  @IsNumber()
  arrhenius_activation_energy!: number;

  @IsNumber()
  arrhenius_ref_temp_c!: number;

  @IsNumber()
  arrhenius_idle_degradation_factor!: number;

  @IsNumber()
  battery_crit_voltage_mv_12v!: number;

  @IsNumber()
  battery_crit_voltage_mv_24v!: number;

  @IsNumber()
  battery_temp_comp_factor!: number;

  @IsNumber()
  cooling_ewma_alpha!: number;

  @IsNumber()
  cooling_overheat_threshold_c!: number;

  @IsNumber()
  cooling_clogging_threshold_c!: number;

  @IsNumber()
  brake_wear_energy_per_mm_mj!: number;

  @IsNumber()
  brake_min_thickness_mm!: number;

  @IsNumber()
  dpf_soot_limit_grams!: number;

  @IsNumber()
  fuel_siphon_stop_liters!: number;

  @IsNumber()
  fuel_cusum_slack_liters!: number;

  @IsNumber()
  inaction_risk_multiplier!: number;
}
