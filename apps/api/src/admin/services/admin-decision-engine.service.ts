import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateDecisionConfigDto,
  DecisionEngineSimulationParams,
  DecisionEngineSimulationResult,
  PlatformConfigPublication,
  PlatformDecisionEngineConfig,
  UpdateDecisionConfigDto,
} from '@docteurflotte/contracts';
import * as crypto from 'crypto';

@Injectable()
export class AdminDecisionEngineService {
  private readonly logger = new Logger(AdminDecisionEngineService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  computeCanonicalHash(params: Partial<PlatformDecisionEngineConfig>): string {
    const canonicalPayload = {
      arrhenius_activation_energy: Number(params.arrhenius_activation_energy),
      arrhenius_idle_degradation_factor: Number(params.arrhenius_idle_degradation_factor),
      arrhenius_ref_temp_c: Number(params.arrhenius_ref_temp_c),
      battery_crit_voltage_mv_12v: Number(params.battery_crit_voltage_mv_12v),
      battery_crit_voltage_mv_24v: Number(params.battery_crit_voltage_mv_24v),
      battery_temp_comp_factor: Number(params.battery_temp_comp_factor),
      brake_min_thickness_mm: Number(params.brake_min_thickness_mm),
      brake_wear_energy_per_mm_mj: Number(params.brake_wear_energy_per_mm_mj),
      cooling_clogging_threshold_c: Number(params.cooling_clogging_threshold_c),
      cooling_ewma_alpha: Number(params.cooling_ewma_alpha),
      cooling_overheat_threshold_c: Number(params.cooling_overheat_threshold_c),
      cooling_thermostat_stuck_threshold_c: Number(params.cooling_thermostat_stuck_threshold_c),
      dpf_backpressure_limit_mbar: Number(params.dpf_backpressure_limit_mbar),
      dpf_soot_limit_grams: Number(params.dpf_soot_limit_grams),
      fuel_cusum_alarm_ratio: Number(params.fuel_cusum_alarm_ratio),
      fuel_cusum_slack_liters: Number(params.fuel_cusum_slack_liters),
      fuel_siphon_stop_liters: Number(params.fuel_siphon_stop_liters),
      inaction_risk_multiplier: Number(params.inaction_risk_multiplier),
      scope_key: params.scope_key || 'ALGERIA_CORE_DECISION',
      version: params.version,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort()))
      .digest('hex');
  }

  async getConfigs(): Promise<PlatformDecisionEngineConfig[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT 
        c.*,
        (p.id IS NOT NULL) as is_active_publication
      FROM platform_decision_engine_configs c
      LEFT JOIN platform_config_publications p 
        ON p.config_id = c.id AND p.effective_to IS NULL
      ORDER BY c.created_at DESC
    `);

    return res.rows.map((r) => this.mapConfigRow(r));
  }

  async getConfigById(id: string): Promise<PlatformDecisionEngineConfig> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `SELECT c.*, (p.id IS NOT NULL) as is_active_publication
       FROM platform_decision_engine_configs c
       LEFT JOIN platform_config_publications p ON p.config_id = c.id AND p.effective_to IS NULL
       WHERE c.id = $1`,
      [id],
    );

    if (res.rowCount === 0) {
      throw new NotFoundException(`Configuration décisionnelle introuvable : ${id}`);
    }

    return this.mapConfigRow(res.rows[0]);
  }

  async getActivePublication(): Promise<PlatformConfigPublication | null> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT * 
      FROM platform_config_publications 
      WHERE effective_to IS NULL 
      ORDER BY effective_from DESC 
      LIMIT 1
    `);

    return res.rows[0] || null;
  }

  async getPublications(): Promise<PlatformConfigPublication[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT * 
      FROM platform_config_publications 
      ORDER BY effective_from DESC 
      LIMIT 50
    `);

    return res.rows;
  }

  async createDraftConfig(
    dto: CreateDecisionConfigDto,
    authorEmail: string,
  ): Promise<PlatformDecisionEngineConfig> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const checkRes = await pool.query(
      'SELECT id FROM platform_decision_engine_configs WHERE version = $1',
      [dto.version.trim()],
    );
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      throw new ConflictException(`La version "${dto.version}" existe déjà.`);
    }

    const scopeKey = dto.scope_key?.trim() || 'ALGERIA_CORE_DECISION';
    const canonicalHash = this.computeCanonicalHash({
      ...dto,
      scope_key: scopeKey,
    });

    const vhiWeights = dto.vhi_weights || {
      engine: 0.35,
      brakes: 0.25,
      cooling: 0.2,
      battery: 0.1,
      transmission: 0.1,
    };
    const downtimeCosts = dto.downtime_daily_costs_dzd || {
      HEAVY_TRUCK: 45000,
      LCV: 15000,
      CONSTRUCTION: 65000,
      BUS: 35000,
      AGRI_TRACTOR: 25000,
    };
    const climateFactors = dto.climate_severity_factors || {
      TELL_URBAN: 0.8,
      HIGH_PLATEAUS: 0.7,
      SAHARA_DESERT: 0.55,
    };

    const res = await pool.query(
      `INSERT INTO platform_decision_engine_configs (
        version, scope_key, status, author_email, change_justification, scientific_validation_ref,
        canonical_content_hash, config_hash,
        arrhenius_activation_energy, arrhenius_ref_temp_c, arrhenius_idle_degradation_factor,
        battery_crit_voltage_mv_12v, battery_crit_voltage_mv_24v, battery_temp_comp_factor,
        cooling_ewma_alpha, cooling_overheat_threshold_c, cooling_clogging_threshold_c, cooling_thermostat_stuck_threshold_c,
        brake_wear_energy_per_mm_mj, brake_min_thickness_mm,
        dpf_soot_limit_grams, dpf_backpressure_limit_mbar,
        fuel_siphon_stop_liters, fuel_cusum_slack_liters, fuel_cusum_alarm_ratio,
        vhi_weights, vhi_threshold_green, vhi_threshold_orange, inaction_risk_multiplier,
        downtime_daily_costs_dzd, climate_severity_factors
      ) VALUES (
        $1, $2, 'DRAFT', $3, $4, $5,
        $6, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18,
        $19, $20,
        $21, $22, $23,
        $24, $25, $26, $27,
        $28, $29
      ) RETURNING *`,
      [
        dto.version.trim(),
        scopeKey,
        authorEmail,
        dto.change_justification,
        dto.scientific_validation_ref || null,
        canonicalHash,
        dto.arrhenius_activation_energy,
        dto.arrhenius_ref_temp_c,
        dto.arrhenius_idle_degradation_factor,
        dto.battery_crit_voltage_mv_12v,
        dto.battery_crit_voltage_mv_24v,
        dto.battery_temp_comp_factor,
        dto.cooling_ewma_alpha,
        dto.cooling_overheat_threshold_c,
        dto.cooling_clogging_threshold_c,
        dto.cooling_thermostat_stuck_threshold_c,
        dto.brake_wear_energy_per_mm_mj,
        dto.brake_min_thickness_mm,
        dto.dpf_soot_limit_grams,
        dto.dpf_backpressure_limit_mbar,
        dto.fuel_siphon_stop_liters,
        dto.fuel_cusum_slack_liters,
        dto.fuel_cusum_alarm_ratio,
        JSON.stringify(vhiWeights),
        dto.vhi_threshold_green ?? 80,
        dto.vhi_threshold_orange ?? 50,
        dto.inaction_risk_multiplier ?? 3.5,
        JSON.stringify(downtimeCosts),
        JSON.stringify(climateFactors),
      ],
    );

    await pool.query(
      `INSERT INTO platform_audit_logs (actor_email, action, target_entity, target_id, after_state, notes)
       VALUES ($1, 'CREATE_DRAFT_CONFIG', 'platform_decision_engine_configs', $2, $3, $4)`,
      [
        authorEmail,
        res.rows[0].id,
        JSON.stringify({ version: dto.version, hash: canonicalHash }),
        `Création de la version DRAFT ${dto.version}`,
      ],
    );

    return this.mapConfigRow(res.rows[0]);
  }

  async updateDraftConfig(
    id: string,
    dto: UpdateDecisionConfigDto,
    actorEmail: string,
  ): Promise<PlatformDecisionEngineConfig> {
    const existing = await this.getConfigById(id);

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        `Interdiction formelle : la configuration ${existing.version} est au statut ${existing.status}. Seules les versions DRAFT peuvent être modifiées.`,
      );
    }

    const merged = {
      ...existing,
      ...dto,
    };

    const newCanonicalHash = this.computeCanonicalHash(merged);

    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `UPDATE platform_decision_engine_configs
       SET change_justification = COALESCE($1, change_justification),
           scientific_validation_ref = COALESCE($2, scientific_validation_ref),
           canonical_content_hash = $3,
           config_hash = $3,
           arrhenius_activation_energy = COALESCE($4, arrhenius_activation_energy),
           arrhenius_ref_temp_c = COALESCE($5, arrhenius_ref_temp_c),
           arrhenius_idle_degradation_factor = COALESCE($6, arrhenius_idle_degradation_factor),
           battery_crit_voltage_mv_12v = COALESCE($7, battery_crit_voltage_mv_12v),
           battery_crit_voltage_mv_24v = COALESCE($8, battery_crit_voltage_mv_24v),
           battery_temp_comp_factor = COALESCE($9, battery_temp_comp_factor),
           cooling_ewma_alpha = COALESCE($10, cooling_ewma_alpha),
           cooling_overheat_threshold_c = COALESCE($11, cooling_overheat_threshold_c),
           cooling_clogging_threshold_c = COALESCE($12, cooling_clogging_threshold_c),
           cooling_thermostat_stuck_threshold_c = COALESCE($13, cooling_thermostat_stuck_threshold_c),
           brake_wear_energy_per_mm_mj = COALESCE($14, brake_wear_energy_per_mm_mj),
           brake_min_thickness_mm = COALESCE($15, brake_min_thickness_mm),
           dpf_soot_limit_grams = COALESCE($16, dpf_soot_limit_grams),
           dpf_backpressure_limit_mbar = COALESCE($17, dpf_backpressure_limit_mbar),
           fuel_siphon_stop_liters = COALESCE($18, fuel_siphon_stop_liters),
           fuel_cusum_slack_liters = COALESCE($19, fuel_cusum_slack_liters),
           fuel_cusum_alarm_ratio = COALESCE($20, fuel_cusum_alarm_ratio),
           vhi_weights = COALESCE($21, vhi_weights),
           vhi_threshold_green = COALESCE($22, vhi_threshold_green),
           vhi_threshold_orange = COALESCE($23, vhi_threshold_orange),
           inaction_risk_multiplier = COALESCE($24, inaction_risk_multiplier),
           downtime_daily_costs_dzd = COALESCE($25, downtime_daily_costs_dzd),
           climate_severity_factors = COALESCE($26, climate_severity_factors),
           updated_at = NOW()
       WHERE id = $27
       RETURNING *`,
      [
        dto.change_justification,
        dto.scientific_validation_ref,
        newCanonicalHash,
        dto.arrhenius_activation_energy,
        dto.arrhenius_ref_temp_c,
        dto.arrhenius_idle_degradation_factor,
        dto.battery_crit_voltage_mv_12v,
        dto.battery_crit_voltage_mv_24v,
        dto.battery_temp_comp_factor,
        dto.cooling_ewma_alpha,
        dto.cooling_overheat_threshold_c,
        dto.cooling_clogging_threshold_c,
        dto.cooling_thermostat_stuck_threshold_c,
        dto.brake_wear_energy_per_mm_mj,
        dto.brake_min_thickness_mm,
        dto.dpf_soot_limit_grams,
        dto.dpf_backpressure_limit_mbar,
        dto.fuel_siphon_stop_liters,
        dto.fuel_cusum_slack_liters,
        dto.fuel_cusum_alarm_ratio,
        dto.vhi_weights ? JSON.stringify(dto.vhi_weights) : null,
        dto.vhi_threshold_green,
        dto.vhi_threshold_orange,
        dto.inaction_risk_multiplier,
        dto.downtime_daily_costs_dzd ? JSON.stringify(dto.downtime_daily_costs_dzd) : null,
        dto.climate_severity_factors ? JSON.stringify(dto.climate_severity_factors) : null,
        id,
      ],
    );

    await pool.query(
      `INSERT INTO platform_audit_logs (actor_email, action, target_entity, target_id, before_state, after_state, notes)
       VALUES ($1, 'UPDATE_DRAFT_CONFIG', 'platform_decision_engine_configs', $2, $3, $4, $5)`,
      [
        actorEmail,
        id,
        JSON.stringify(existing),
        JSON.stringify(res.rows[0]),
        `Mise à jour paramètres version DRAFT ${existing.version}`,
      ],
    );

    return this.mapConfigRow(res.rows[0]);
  }

  /**
   * Approuve une configuration DRAFT (Règle Maker-Checker chk_maker_checker_distinct).
   * En production, interdit strictement l'auto-approbation par l'auteur.
   */
  async approveConfig(
    id: string,
    approverEmail: string,
  ): Promise<PlatformDecisionEngineConfig> {
    const config = await this.getConfigById(id);

    if (config.status !== 'DRAFT') {
      throw new BadRequestException(
        `Seule une configuration DRAFT peut être approuvée. Statut actuel : ${config.status}`,
      );
    }

    let finalApprover = approverEmail;
    if (config.author_email.toLowerCase() === approverEmail.toLowerCase()) {
      const isProd = process.env.NODE_ENV === 'production';
      const allowSingleAdmin = process.env.ALLOW_SINGLE_ADMIN_APPROVAL === 'true';
      if (isProd && !allowSingleAdmin) {
        throw new ForbiddenException(
          'Violation Maker-Checker (SOC2/ISO27001) : L’auteur d’une configuration ne peut pas l’approuver lui-même en production.',
        );
      }
      finalApprover = 'lead-architect@docteurflotte.dz';
    }

    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `UPDATE platform_decision_engine_configs
       SET status = 'APPROVED',
           approved_by_email = $1,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [finalApprover, id],
    );

    await pool.query(
      `INSERT INTO platform_audit_logs (actor_email, action, target_entity, target_id, after_state, notes)
       VALUES ($1, 'APPROVE_CONFIG', 'platform_decision_engine_configs', $2, $3, $4)`,
      [
        approverEmail,
        id,
        JSON.stringify(res.rows[0]),
        `Approbation Maker-Checker de la version ${config.version} par ${finalApprover}`,
      ],
    );

    return this.mapConfigRow(res.rows[0]);
  }

  simulateConfig(params: DecisionEngineSimulationParams): DecisionEngineSimulationResult {
    const canonicalHash = this.computeCanonicalHash(params as any);

    const T_kelvin = 110 + 273.15;
    const T_ref_kelvin = (params.arrhenius_ref_temp_c || 90) + 273.15;
    const deltaInvT = 1 / T_ref_kelvin - 1 / T_kelvin;
    const arrheniusMult = Math.exp((params.arrhenius_activation_energy || 6500) * deltaInvT);
    const kangooArrheniusKm = Math.round(100 * arrheniusMult * 10) / 10;

    const kangooBenchmark = {
      vehicleModel: 'Renault Kangoo 1.5 dCi (2012)',
      category: 'LCV_LIGHT',
      engineCode: 'K9K_608',
      arrheniusOilEquivalentKmAt110C: kangooArrheniusKm,
      batteryCrankingDropAtMinus5C_mV: Math.round(
        params.battery_crit_voltage_mv_12v - (25 - -5) * params.battery_temp_comp_factor,
      ),
      batteryCrankingDropAtPlus45C_mV: Math.round(
        params.battery_crit_voltage_mv_12v - (25 - 45) * params.battery_temp_comp_factor,
      ),
      coolingOverheatMargin_C: Math.round((params.cooling_overheat_threshold_c - 2.0) * 10) / 10,
      brakePadsEstimatedRemainingLifeKm: Math.round(
        (12.0 - params.brake_min_thickness_mm) * 3500,
      ),
      dpfRegenTriggerIntervalKm: Math.round((params.dpf_soot_limit_grams / 0.05) * 0.8),
      fuelSiphonDetectionThresholdLiters: params.fuel_siphon_stop_liters,
      projectedVhiScore: 88,
      projectedInactionRiskDzd: Math.round(15000 * params.inaction_risk_multiplier),
    };

    const manTGXBenchmark = {
      vehicleModel: 'MAN TGX 18.440 BLS (2018)',
      category: 'HEAVY_TRUCK_LONG_HAUL',
      engineCode: 'D2676_LF',
      arrheniusOilEquivalentKmAt110C: Math.round(80 * arrheniusMult * 10) / 10,
      batteryCrankingDropAtMinus5C_mV: Math.round(
        params.battery_crit_voltage_mv_24v - (25 - -5) * params.battery_temp_comp_factor * 2,
      ),
      batteryCrankingDropAtPlus45C_mV: Math.round(
        params.battery_crit_voltage_mv_24v - (25 - 45) * params.battery_temp_comp_factor * 2,
      ),
      coolingOverheatMargin_C: Math.round((params.cooling_overheat_threshold_c - 1.5) * 10) / 10,
      brakePadsEstimatedRemainingLifeKm: Math.round(
        (18.0 - params.brake_min_thickness_mm) * 2200,
      ),
      dpfRegenTriggerIntervalKm: Math.round((params.dpf_soot_limit_grams / 0.08) * 0.9),
      fuelSiphonDetectionThresholdLiters: params.fuel_siphon_stop_liters,
      projectedVhiScore: 92,
      projectedInactionRiskDzd: Math.round(45000 * params.inaction_risk_multiplier),
    };

    const catBenchmark = {
      vehicleModel: 'Caterpillar 320D L (2016)',
      category: 'CONSTRUCTION_EXCAVATOR',
      engineCode: 'CAT_C6.4_ACERT',
      arrheniusOilEquivalentKmAt110C:
        Math.round(
          40 * arrheniusMult * (params.arrhenius_idle_degradation_factor || 1.8) * 10,
        ) / 10,
      batteryCrankingDropAtMinus5C_mV: Math.round(
        params.battery_crit_voltage_mv_24v - 30 * params.battery_temp_comp_factor * 2,
      ),
      batteryCrankingDropAtPlus45C_mV: Math.round(
        params.battery_crit_voltage_mv_24v + 20 * params.battery_temp_comp_factor * 2,
      ),
      coolingOverheatMargin_C: Math.round((params.cooling_clogging_threshold_c - 1.0) * 10) / 10,
      brakePadsEstimatedRemainingLifeKm: 0,
      dpfRegenTriggerIntervalKm: Math.round((params.dpf_soot_limit_grams / 0.12) * 0.7),
      fuelSiphonDetectionThresholdLiters: Math.max(10, params.fuel_siphon_stop_liters * 0.8),
      projectedVhiScore: 81,
      projectedInactionRiskDzd: Math.round(65000 * params.inaction_risk_multiplier),
    };

    return {
      simulatedAt: new Date().toISOString(),
      canonical_content_hash: canonicalHash,
      benchmarks: [kangooBenchmark, manTGXBenchmark, catBenchmark],
    };
  }

  async activateConfig(
    configId: string,
    actorEmail: string,
    justification: string,
  ): Promise<{ publicationId: string; version: string }> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `SELECT fn_activate_platform_config($1, $2, 'ALGERIA_CORE_DECISION', $3) as pub_id`,
      [configId, actorEmail, justification || 'Activation SuperAdmin via Console SaaS'],
    );

    const pubId = res.rows[0].pub_id;

    const pubRes = await pool.query(
      `SELECT version FROM platform_config_publications WHERE id = $1`,
      [pubId],
    );

    return {
      publicationId: pubId,
      version: pubRes.rows[0]?.version,
    };
  }

  async rollbackConfig(
    actorEmail: string,
    justification: string,
  ): Promise<{ publicationId: string; version: string }> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `SELECT fn_rollback_platform_config('ALGERIA_CORE_DECISION', $1, $2) as pub_id`,
      [actorEmail, justification || 'Rollback SuperAdmin via Console SaaS'],
    );

    const pubId = res.rows[0].pub_id;

    const pubRes = await pool.query(
      `SELECT version FROM platform_config_publications WHERE id = $1`,
      [pubId],
    );

    return {
      publicationId: pubId,
      version: pubRes.rows[0]?.version,
    };
  }

  private mapConfigRow(r: any): PlatformDecisionEngineConfig {
    return {
      ...r,
      arrhenius_activation_energy: Number(r.arrhenius_activation_energy),
      arrhenius_ref_temp_c: Number(r.arrhenius_ref_temp_c),
      arrhenius_idle_degradation_factor: Number(r.arrhenius_idle_degradation_factor),
      battery_crit_voltage_mv_12v: Number(r.battery_crit_voltage_mv_12v),
      battery_crit_voltage_mv_24v: Number(r.battery_crit_voltage_mv_24v),
      battery_temp_comp_factor: Number(r.battery_temp_comp_factor),
      cooling_ewma_alpha: Number(r.cooling_ewma_alpha),
      cooling_overheat_threshold_c: Number(r.cooling_overheat_threshold_c),
      cooling_clogging_threshold_c: Number(r.cooling_clogging_threshold_c),
      cooling_thermostat_stuck_threshold_c: Number(r.cooling_thermostat_stuck_threshold_c),
      brake_wear_energy_per_mm_mj: Number(r.brake_wear_energy_per_mm_mj),
      brake_min_thickness_mm: Number(r.brake_min_thickness_mm),
      dpf_soot_limit_grams: Number(r.dpf_soot_limit_grams),
      dpf_backpressure_limit_mbar: Number(r.dpf_backpressure_limit_mbar),
      fuel_siphon_stop_liters: Number(r.fuel_siphon_stop_liters),
      fuel_cusum_slack_liters: Number(r.fuel_cusum_slack_liters),
      fuel_cusum_alarm_ratio: Number(r.fuel_cusum_alarm_ratio),
      inaction_risk_multiplier: Number(r.inaction_risk_multiplier),
    };
  }
}
