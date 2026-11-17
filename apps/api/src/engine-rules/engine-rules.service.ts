import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  EngineRuleCategory,
  EngineRuleCode,
  EngineRuleConfigEntry,
  FiscalRasParams,
  GuaranteeWithholdingParams,
  StampDutyParams,
  StampDutyBracket,
  F20FranchiseParams,
  VatForfeitureParams,
  TelematicsCusumParams,
  GhostRefuelParams,
  CylinderHeadProtectionParams,
  IdleWasteParams,
  ClutchSlipParams,
  EnactaParams,
  DrivingHoursParams,
  ColdChainParams,
  ThreeWayMatchParams,
  SparePartsSerialParams,
  OdometerCheckParams,
} from '@docteurflotte/contracts';

interface CachedEntry {
  value: unknown;
  isLockedByLaw: boolean;
  expiresAt: number;
}

@Injectable()
export class EngineRulesConfigService {
  private readonly logger = new Logger(EngineRulesConfigService.name);
  private readonly cache = new Map<string, CachedEntry>();
  private readonly TTL_MS = 60_000; // 60 secondes en cache mémoire local

  constructor(private readonly db: DatabaseService) {}

  private getCacheKey(ruleCode: string, paramKey: string, tenantId?: string): string {
    return `${tenantId || 'GLOBAL'}:${ruleCode}:${paramKey}`;
  }

  /**
   * Récupère la valeur d'un paramètre de contrôle déterministe.
   * Cascade hiérarchique :
   * 1. Paramètre personnalisé de l'organisation (tenant_id)
   * 2. Paramètre national par défaut (tenant_id IS NULL / SuperAdmin DZ)
   */
  async getParam<T>(
    ruleCode: EngineRuleCode,
    paramKey: string,
    tenantId?: string,
    defaultValue?: T,
  ): Promise<T> {
    const cacheKey = this.getCacheKey(ruleCode, paramKey, tenantId);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const sql = `
      SELECT param_value, is_locked_by_law
      FROM engine_rules_config
      WHERE (tenant_id = $1 OR tenant_id IS NULL)
        AND rule_code = $2
        AND param_key = $3
      ORDER BY tenant_id NULLS LAST
      LIMIT 1
    `;

    const res = await this.db.query<{ param_value: T; is_locked_by_law: boolean }>(sql, [
      tenantId || null,
      ruleCode,
      paramKey,
    ]);

    if (res.rows.length > 0) {
      const val = res.rows[0].param_value;
      this.cache.set(cacheKey, {
        value: val,
        isLockedByLaw: res.rows[0].is_locked_by_law,
        expiresAt: Date.now() + this.TTL_MS,
      });
      return val;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new BadRequestException(
      `Paramètre de contrôle introuvable : [${ruleCode}] ${paramKey} (tenant: ${tenantId || 'GLOBAL'})`,
    );
  }

  // ==========================================
  // GETTERS TYPÉS PAR RÈGLE DÉTERMINISTE
  // ==========================================

  // PILIER 1 : MOTEUR FISCAL & COMPTABLE
  async getFiscalRasParams(tenantId?: string): Promise<FiscalRasParams> {
    const [rasDefaultRate, vatReverseChargeRate, accountRas, accountVatReciprocalDeductible, accountVatReciprocalDue] =
      await Promise.all([
        this.getParam<number>('RULE_09_RAS', 'ras_default_rate', tenantId, 0.30),
        this.getParam<number>('RULE_09_RAS', 'vat_reverse_charge_rate', tenantId, 0.19),
        this.getParam<string>('RULE_09_RAS', 'account_ras', tenantId, '447200'),
        this.getParam<string>('RULE_09_RAS', 'account_vat_reciprocal_deductible', tenantId, '445660'),
        this.getParam<string>('RULE_09_RAS', 'account_vat_reciprocal_due', tenantId, '445760'),
      ]);

    return {
      rasDefaultRate,
      vatReverseChargeRate,
      accountRas,
      accountVatReciprocalDeductible,
      accountVatReciprocalDue,
    };
  }

  async getGuaranteeWithholdingParams(tenantId?: string): Promise<GuaranteeWithholdingParams> {
    const [guaranteeWithholdingRate, guaranteeReleaseMonths, accountGuarantee, accountVatPending] =
      await Promise.all([
        this.getParam<number>('RULE_10_GUARANTEE_WITHHOLDING', 'guarantee_withholding_rate', tenantId, 0.05),
        this.getParam<number>('RULE_10_GUARANTEE_WITHHOLDING', 'guarantee_release_months', tenantId, 12),
        this.getParam<string>('RULE_10_GUARANTEE_WITHHOLDING', 'account_guarantee', tenantId, '411700'),
        this.getParam<string>('RULE_10_GUARANTEE_WITHHOLDING', 'account_vat_pending', tenantId, '445780'),
      ]);

    return {
      guaranteeWithholdingRate,
      guaranteeReleaseMonths,
      accountGuarantee,
      accountVatPending,
    };
  }

  async getStampDutyParams(tenantId?: string): Promise<StampDutyParams> {
    const [cashTaxDeductionCeilingDzd, stampDutyBrackets, stampDutyMinDzd, stampDutyMaxDzd, accountStampDuty] =
      await Promise.all([
        this.getParam<number>('RULE_11_STAMP_DUTY', 'cash_tax_deduction_ceiling_dzd', tenantId, 1_000_000),
        this.getParam<StampDutyBracket[]>('RULE_11_STAMP_DUTY', 'stamp_duty_brackets', tenantId, [
          { min: 0, max: 300, rate: 0.0 },
          { min: 301, max: 30000, rate: 0.01 },
          { min: 30001, max: 100000, rate: 0.015 },
          { min: 100001, max: null, rate: 0.02 },
        ]),
        this.getParam<number>('RULE_11_STAMP_DUTY', 'stamp_duty_min_dzd', tenantId, 5),
        this.getParam<number>('RULE_11_STAMP_DUTY', 'stamp_duty_max_dzd', tenantId, 10_000),
        this.getParam<string>('RULE_11_STAMP_DUTY', 'account_stamp_duty', tenantId, '445790'),
      ]);

    return {
      cashTaxDeductionCeilingDzd,
      stampDutyBrackets,
      stampDutyMinDzd,
      stampDutyMaxDzd,
      accountStampDuty,
    };
  }

  async getF20FranchiseParams(tenantId?: string): Promise<F20FranchiseParams> {
    const [f20ValidationEnforced, f20CheckAmountCeiling] = await Promise.all([
      this.getParam<boolean>('RULE_12_F20_FRANCHISE', 'f20_validation_enforced', tenantId, true),
      this.getParam<boolean>('RULE_12_F20_FRANCHISE', 'f20_check_amount_ceiling', tenantId, true),
    ]);

    return {
      f20ValidationEnforced,
      f20CheckAmountCeiling,
    };
  }

  async getVatForfeitureParams(tenantId?: string): Promise<VatForfeitureParams> {
    const [vatForfeitureDeadlineMonth, vatForfeitureDeadlineDay, vatForfeitureAdditionalYears] =
      await Promise.all([
        this.getParam<number>('RULE_13_VAT_FORFEITURE', 'vat_forfeiture_deadline_month', tenantId, 12),
        this.getParam<number>('RULE_13_VAT_FORFEITURE', 'vat_forfeiture_deadline_day', tenantId, 20),
        this.getParam<number>('RULE_13_VAT_FORFEITURE', 'vat_forfeiture_additional_years', tenantId, 1),
      ]);

    return {
      vatForfeitureDeadlineMonth,
      vatForfeitureDeadlineDay,
      vatForfeitureAdditionalYears,
    };
  }

  // PILIER 2 : MOTEUR TÉLÉMATIQUE & PHYSIQUE
  async getTelematicsCusumParams(tenantId?: string): Promise<TelematicsCusumParams> {
    const [fuelThermalExpansionCoeff, cusumSensitivityKLiters, cusumThresholdHLiters, topographicPitchToleranceDeg] =
      await Promise.all([
        this.getParam<number>('RULE_T01_CUSUM', 'fuel_thermal_expansion_coeff', tenantId, 0.00083),
        this.getParam<number>('RULE_T01_CUSUM', 'cusum_sensitivity_k_liters', tenantId, 3.5),
        this.getParam<number>('RULE_T01_CUSUM', 'cusum_threshold_h_liters', tenantId, 15.0),
        this.getParam<number>('RULE_T01_CUSUM', 'topographic_pitch_tolerance_deg', tenantId, 2.5),
      ]);

    return {
      fuelThermalExpansionCoeff,
      cusumSensitivityKLiters,
      cusumThresholdHLiters,
      topographicPitchToleranceDeg,
    };
  }

  async getGhostRefuelParams(tenantId?: string): Promise<GhostRefuelParams> {
    const [tankCapacityOverflowTolerancePct, valhallaSpeedViolationThresholdKmh] = await Promise.all([
      this.getParam<number>('RULE_T02_GHOST_REFUEL', 'tank_capacity_overflow_tolerance_pct', tenantId, 0.03),
      this.getParam<number>('RULE_T02_GHOST_REFUEL', 'valhalla_speed_violation_threshold_kmh', tenantId, 115.0),
    ]);

    return {
      tankCapacityOverflowTolerancePct,
      valhallaSpeedViolationThresholdKmh,
    };
  }

  async getCylinderHeadParams(tenantId?: string): Promise<CylinderHeadProtectionParams> {
    const [
      engineTempDeltaThresholdCelsius,
      engineCoolantCriticalCelsius,
      engineCoolantGradientThreshold,
      engineTempSustainSeconds,
    ] = await Promise.all([
      this.getParam<number>('RULE_T03_CYLINDER_HEAD', 'engine_temp_delta_threshold_celsius', tenantId, 30.0),
      this.getParam<number>('RULE_T03_CYLINDER_HEAD', 'engine_coolant_critical_celsius', tenantId, 103.0),
      this.getParam<number>('RULE_T03_CYLINDER_HEAD', 'engine_coolant_gradient_threshold', tenantId, 0.15),
      this.getParam<number>('RULE_T03_CYLINDER_HEAD', 'engine_temp_sustain_seconds', tenantId, 180),
    ]);

    return {
      engineTempDeltaThresholdCelsius,
      engineCoolantCriticalCelsius,
      engineCoolantGradientThreshold,
      engineTempSustainSeconds,
    };
  }

  async getIdleWasteParams(tenantId?: string): Promise<IdleWasteParams> {
    const [idleRpmMin, idleRpmMax, idleMaxAllowedMinutes] = await Promise.all([
      this.getParam<number>('RULE_T04_IDLE_WASTE', 'idle_rpm_min', tenantId, 550),
      this.getParam<number>('RULE_T04_IDLE_WASTE', 'idle_rpm_max', tenantId, 850),
      this.getParam<number>('RULE_T04_IDLE_WASTE', 'idle_max_allowed_minutes', tenantId, 20),
    ]);

    return {
      idleRpmMin,
      idleRpmMax,
      idleMaxAllowedMinutes,
    };
  }

  async getClutchSlipParams(tenantId?: string): Promise<ClutchSlipParams> {
    const [clutchSlipEngineLoadPct, clutchSlipRatioTolerancePct, clutchSlipDurationSeconds] = await Promise.all([
      this.getParam<number>('RULE_T05_CLUTCH_SLIP', 'clutch_slip_engine_load_pct', tenantId, 70),
      this.getParam<number>('RULE_T05_CLUTCH_SLIP', 'clutch_slip_ratio_tolerance_pct', tenantId, 8),
      this.getParam<number>('RULE_T05_CLUTCH_SLIP', 'clutch_slip_duration_seconds', tenantId, 5.0),
    ]);

    return {
      clutchSlipEngineLoadPct,
      clutchSlipRatioTolerancePct,
      clutchSlipDurationSeconds,
    };
  }

  // PILIER 3 : MOTEUR RÉGLEMENTAIRE & SÉCURITÉ ROUTIÈRE
  async getEnactaParams(tenantId?: string): Promise<EnactaParams> {
    const [enactaPeriodicityMonthsByCategory, dispatchLockOnExpiry, enactaAlertDaysBefore] = await Promise.all([
      this.getParam<Record<string, number>>('RULE_R01_ENACTA', 'enacta_periodicity_months_by_category', tenantId, {
        ROAD_VEHICLE: 12,
        LIGHT_COMMERCIAL: 6,
        HEAVY_TRUCK: 6,
        CONSTRUCTION_EQUIPMENT: 6,
        HAZMAT_TMD: 6,
        RENTAL: 6,
      }),
      this.getParam<boolean>('RULE_R01_ENACTA', 'dispatch_lock_on_expiry', tenantId, true),
      this.getParam<number[]>('RULE_R01_ENACTA', 'enacta_alert_days_before', tenantId, [30, 15, 7]),
    ]);

    return {
      enactaPeriodicityMonthsByCategory,
      dispatchLockOnExpiry,
      enactaAlertDaysBefore,
    };
  }

  async getDrivingHoursParams(tenantId?: string): Promise<DrivingHoursParams> {
    const [maxContinuousDrivingMinutes, minBreakDurationMinutes, maxDailyDrivingHours, minDailyRestHours] =
      await Promise.all([
        this.getParam<number>('RULE_R02_DRIVING_HOURS', 'max_continuous_driving_minutes', tenantId, 270),
        this.getParam<number>('RULE_R02_DRIVING_HOURS', 'min_break_duration_minutes', tenantId, 45),
        this.getParam<number>('RULE_R02_DRIVING_HOURS', 'max_daily_driving_hours', tenantId, 9),
        this.getParam<number>('RULE_R02_DRIVING_HOURS', 'min_daily_rest_hours', tenantId, 11),
      ]);

    return {
      maxContinuousDrivingMinutes,
      minBreakDurationMinutes,
      maxDailyDrivingHours,
      minDailyRestHours,
    };
  }

  async getColdChainParams(tenantId?: string): Promise<ColdChainParams> {
    const [coldChainDoorSensorEnforced, coldChainThermalInertiaMinutes, coldChainTempToleranceCelsius] =
      await Promise.all([
        this.getParam<boolean>('RULE_R03_COLD_CHAIN', 'cold_chain_door_sensor_enforced', tenantId, true),
        this.getParam<number>('RULE_R03_COLD_CHAIN', 'cold_chain_thermal_inertia_minutes', tenantId, 25),
        this.getParam<number>('RULE_R03_COLD_CHAIN', 'cold_chain_temp_tolerance_celsius', tenantId, 2.0),
      ]);

    return {
      coldChainDoorSensorEnforced,
      coldChainThermalInertiaMinutes,
      coldChainTempToleranceCelsius,
    };
  }

  // PILIER 4 : MOTEUR ACHATS, STOCKS PDR & ATELIER
  async getThreeWayMatchParams(tenantId?: string): Promise<ThreeWayMatchParams> {
    const [threeWayMatchingQtyTolerancePct, threeWayMatchingRoundingToleranceDzd, requireNifActiveStatusBeforePo] =
      await Promise.all([
        this.getParam<number>('RULE_A01_THREE_WAY_MATCH', 'three_way_matching_qty_tolerance_pct', tenantId, 0.0),
        this.getParam<number>('RULE_A01_THREE_WAY_MATCH', 'three_way_matching_rounding_tolerance_dzd', tenantId, 1.00),
        this.getParam<boolean>('RULE_A01_THREE_WAY_MATCH', 'require_nif_active_status_before_po', tenantId, true),
      ]);

    return {
      threeWayMatchingQtyTolerancePct,
      threeWayMatchingRoundingToleranceDzd,
      requireNifActiveStatusBeforePo,
    };
  }

  async getSparePartsSerialParams(tenantId?: string): Promise<SparePartsSerialParams> {
    const [sparePartsAbnormalConsumptionFactor, serializedTrackingCategories, blockWoCloseIfSerialMismatch] =
      await Promise.all([
        this.getParam<number>('RULE_A02_SPARE_PARTS_SERIAL', 'spare_parts_abnormal_consumption_factor', tenantId, 2.5),
        this.getParam<string[]>('RULE_A02_SPARE_PARTS_SERIAL', 'serialized_tracking_categories', tenantId, [
          'PNEUMATIQUE',
          'BATTERIE',
          'INJECTEUR',
          'TURBOCOMPRESSEUR',
          'FILTRE_FAP',
        ]),
        this.getParam<boolean>('RULE_A02_SPARE_PARTS_SERIAL', 'block_wo_close_if_serial_mismatch', tenantId, true),
      ]);

    return {
      sparePartsAbnormalConsumptionFactor,
      serializedTrackingCategories,
      blockWoCloseIfSerialMismatch,
    };
  }

  async getOdometerCheckParams(tenantId?: string): Promise<OdometerCheckParams> {
    const [odometerVarianceAllowedKm, photoProofRequiredOnVariance] = await Promise.all([
      this.getParam<number>('RULE_A03_ODOMETER_CHECK', 'odometer_variance_allowed_km', tenantId, 50),
      this.getParam<boolean>('RULE_A03_ODOMETER_CHECK', 'photo_proof_required_on_variance', tenantId, true),
    ]);

    return {
      odometerVarianceAllowedKm,
      photoProofRequiredOnVariance,
    };
  }

  // ==========================================
  // GESTION ADMINISTRATIVE (SUPERADMIN & TENANT)
  // ==========================================

  async listRules(tenantId?: string, category?: EngineRuleCategory): Promise<EngineRuleConfigEntry[]> {
    let sql = `
      SELECT 
        id,
        tenant_id AS "tenantId",
        rule_category AS "ruleCategory",
        rule_code AS "ruleCode",
        param_key AS "paramKey",
        param_value AS "paramValue",
        is_locked_by_law AS "isLockedByLaw",
        description,
        updated_by AS "updatedBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM engine_rules_config
      WHERE (tenant_id = $1 OR (tenant_id IS NULL AND $1 IS NOT NULL) OR ($1 IS NULL AND tenant_id IS NULL))
    `;
    const params: (string | null)[] = [tenantId || null];

    if (category) {
      sql += ` AND rule_category = $2`;
      params.push(category);
    }

    sql += ` ORDER BY rule_category, rule_code, param_key`;

    const res = await this.db.query<EngineRuleConfigEntry>(sql, params);
    return res.rows;
  }

  async setTenantParam(
    tenantId: string,
    ruleCategory: EngineRuleCategory,
    ruleCode: EngineRuleCode,
    paramKey: string,
    paramValue: unknown,
    description?: string,
  ): Promise<EngineRuleConfigEntry> {
    // Vérifier si le paramètre national est verrouillé par la loi
    const checkSql = `
      SELECT is_locked_by_law 
      FROM engine_rules_config 
      WHERE tenant_id IS NULL AND rule_code = $1 AND param_key = $2
    `;
    const checkRes = await this.db.query<{ is_locked_by_law: boolean }>(checkSql, [ruleCode, paramKey]);
    if (checkRes.rows.length > 0 && checkRes.rows[0].is_locked_by_law) {
      throw new ForbiddenException(
        `Ce paramètre est verrouillé par la loi d'ordre public fiscal (Art. DGI) et ne peut être altéré au niveau de l'organisation.`,
      );
    }

    const upsertSql = `
      INSERT INTO engine_rules_config (tenant_id, rule_category, rule_code, param_key, param_value, is_locked_by_law, description, updated_at)
      VALUES ($1, $2, $3, $4, $5, FALSE, $6, NOW())
      ON CONFLICT (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID), rule_code, param_key)
      DO UPDATE SET 
        param_value = EXCLUDED.param_value,
        description = COALESCE(EXCLUDED.description, engine_rules_config.description),
        updated_at = NOW()
      RETURNING 
        id,
        tenant_id AS "tenantId",
        rule_category AS "ruleCategory",
        rule_code AS "ruleCode",
        param_key AS "paramKey",
        param_value AS "paramValue",
        is_locked_by_law AS "isLockedByLaw",
        description,
        updated_at AS "updatedAt"
    `;

    const res = await this.db.query<EngineRuleConfigEntry>(upsertSql, [
      tenantId,
      ruleCategory,
      ruleCode,
      paramKey,
      JSON.stringify(paramValue),
      description || null,
    ]);

    // Invalidation du cache local
    this.cache.delete(this.getCacheKey(ruleCode, paramKey, tenantId));
    return res.rows[0];
  }

  async setSuperAdminParam(
    ruleCategory: EngineRuleCategory,
    ruleCode: EngineRuleCode,
    paramKey: string,
    paramValue: unknown,
    isLockedByLaw: boolean = false,
    description?: string,
  ): Promise<EngineRuleConfigEntry> {
    const upsertSql = `
      INSERT INTO engine_rules_config (tenant_id, rule_category, rule_code, param_key, param_value, is_locked_by_law, description, updated_at)
      VALUES (NULL, $1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID), rule_code, param_key)
      DO UPDATE SET 
        param_value = EXCLUDED.param_value,
        is_locked_by_law = EXCLUDED.is_locked_by_law,
        description = COALESCE(EXCLUDED.description, engine_rules_config.description),
        updated_at = NOW()
      RETURNING 
        id,
        tenant_id AS "tenantId",
        rule_category AS "ruleCategory",
        rule_code AS "ruleCode",
        param_key AS "paramKey",
        param_value AS "paramValue",
        is_locked_by_law AS "isLockedByLaw",
        description,
        updated_at AS "updatedAt"
    `;

    const res = await this.db.query<EngineRuleConfigEntry>(upsertSql, [
      ruleCategory,
      ruleCode,
      paramKey,
      JSON.stringify(paramValue),
      isLockedByLaw,
      description || null,
    ]);

    // Invalidation du cache local global
    this.cache.delete(this.getCacheKey(ruleCode, paramKey, undefined));
    return res.rows[0];
  }

  async resetTenantParam(tenantId: string, ruleCode: EngineRuleCode, paramKey: string): Promise<boolean> {
    const deleteSql = `
      DELETE FROM engine_rules_config 
      WHERE tenant_id = $1 AND rule_code = $2 AND param_key = $3
    `;
    await this.db.query(deleteSql, [tenantId, ruleCode, paramKey]);
    this.cache.delete(this.getCacheKey(ruleCode, paramKey, tenantId));
    return true;
  }
}
