import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AssetEngineHourLog, RecordEngineHourLogDto, EngineHourSource } from '@docteurflotte/contracts';
import { OperationalFiscalBridgeService } from '../../fiscal-compliance/services/operational-fiscal-bridge.service';

interface EngineHourRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  site_id: string;
  recorded_at: string;
  hours_value: string | number;
  delta_hours_since_last: string | number;
  source: EngineHourSource;
  fuel_type?: string;
  fuel_consumed_liters: string | number | null;
  fuel_cost_dzd: string | number | null;
  hydraulic_oil_liters?: string | number | null;
  hydraulic_oil_cost_dzd?: string | number | null;
  engine_oil_liters?: string | number | null;
  engine_oil_cost_dzd?: string | number | null;
  adblue_liters?: string | number | null;
  adblue_cost_dzd?: string | number | null;
  coolant_liters?: string | number | null;
  total_consumables_cost_dzd?: string | number | null;
  work_description: string | null;
  operator_name: string | null;
  is_validated: boolean;
  created_at: string;
}

@Injectable()
export class EngineHoursService {
  private readonly logger = new Logger(EngineHoursService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly fiscalBridge?: OperationalFiscalBridgeService,
  ) { }

  async recordEngineHours(
    tenantId: string,
    dto: RecordEngineHourLogDto,
  ): Promise<AssetEngineHourLog> {
    if (!dto.assetId) {
      throw new BadRequestException('assetId est obligatoire pour enregistrer des heures moteur.');
    }
    if (!dto.siteId) {
      throw new BadRequestException('siteId est obligatoire.');
    }
    if (dto.hoursValue === undefined || dto.hoursValue < 0) {
      throw new BadRequestException('La valeur des heures moteur doit être un nombre positif ou nul.');
    }

    // 1. Vérification Asset Racine
    const assetRes = await this.db.query(
      `SELECT id, status, tenant_id FROM assets WHERE id = $1`,
      [dto.assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${dto.assetId}`);
    }
    if (assetRes.rows[0].tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : actif non autorisé.");
    }
    if (assetRes.rows[0].status === 'DECOMMISSIONED') {
      throw new BadRequestException('Impossible d’enregistrer des heures moteur pour un actif décommissionné.');
    }

    // 2. Vérification Chantier
    const siteRes = await this.db.query(
      `SELECT id FROM site_workspaces WHERE id = $1 AND tenant_id = $2`,
      [dto.siteId, tenantId],
    );
    if (siteRes.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${dto.siteId}`);
    }

    // 3. Contrôle anti-régression : recherche du dernier relevé de cet actif
    const lastLogSql = `
      SELECT hours_value FROM asset_engine_hour_logs
      WHERE tenant_id = $1 AND asset_id = $2
      ORDER BY recorded_at DESC, created_at DESC
      LIMIT 1
    `;
    const lastLogRes = await this.db.query<{ hours_value: string | number }>(lastLogSql, [tenantId, dto.assetId]);

    let deltaHours = 0;
    if (lastLogRes.rows.length > 0) {
      const lastHours = Number(lastLogRes.rows[0].hours_value);
      if (dto.hoursValue < lastHours) {
        throw new BadRequestException(
          `Régression horaire interdite : le compteur indiqué (${dto.hoursValue} h) est inférieur au dernier relevé enregistré (${lastHours} h).`,
        );
      }
      deltaHours = Number((dto.hoursValue - lastHours).toFixed(2));
    }

    // 4. Calcul dynamique du coût multi-carburants et fluides
    const fuelType = (dto.fuelType || 'GASOIL').toUpperCase();
    let fuelPrice = 29.01; // fallback Gasoil Naftal Algérie
    if (fuelType === 'SIRGHAZ_GPL' || fuelType === 'GPL') {
      fuelPrice = 9.0;
    } else if (fuelType === 'ESSENCE_SP' || fuelType === 'ESSENCE') {
      fuelPrice = 45.62;
    }

    try {
      const fuelPriceSql = `
        SELECT price_per_liter_dzd FROM platform_fiscal_fuel_prices
        WHERE fuel_type = $1
        ORDER BY effective_date DESC LIMIT 1
      `;
      const priceRes = await this.db.query<{ price_per_liter_dzd: string | number }>(fuelPriceSql, [fuelType]);
      if (priceRes.rows.length > 0) {
        fuelPrice = Number(priceRes.rows[0].price_per_liter_dzd);
      }
    } catch {
      // Table non configurée
    }

    const fuelConsumed = dto.fuelConsumedLiters || 0;
    const fuelCostDzd = Number((fuelConsumed * fuelPrice).toFixed(2));

    // Fluides additionnels : Huile Hydraulique (350 DA/L), Huile Moteur (420 DA/L), AdBlue (120 DA/L)
    const hydLiters = dto.hydraulicOilLiters || 0;
    const hydCostDzd = Number((hydLiters * 350.0).toFixed(2));

    const engLiters = dto.engineOilLiters || 0;
    const engCostDzd = Number((engLiters * 420.0).toFixed(2));

    const adblueLiters = dto.adblueLiters || 0;
    const adblueCostDzd = Number((adblueLiters * 120.0).toFixed(2));

    const coolantLiters = dto.coolantLiters || 0;
    const totalConsumablesCostDzd = Number((fuelCostDzd + hydCostDzd + engCostDzd + adblueCostDzd).toFixed(2));

    // 5. Enregistrement du relevé enrichi multi-fluides
    const insertSql = `
      INSERT INTO asset_engine_hour_logs (
        tenant_id, asset_id, site_id, hours_value, delta_hours_since_last,
        source, fuel_type, fuel_consumed_liters, fuel_cost_dzd,
        hydraulic_oil_liters, hydraulic_oil_cost_dzd,
        engine_oil_liters, engine_oil_cost_dzd,
        adblue_liters, adblue_cost_dzd, coolant_liters, total_consumables_cost_dzd,
        work_description, operator_name, is_validated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, TRUE)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.assetId,
      dto.siteId,
      dto.hoursValue,
      deltaHours,
      dto.source || EngineHourSource.MANUAL,
      fuelType,
      fuelConsumed,
      fuelCostDzd,
      hydLiters,
      hydCostDzd,
      engLiters,
      engCostDzd,
      adblueLiters,
      adblueCostDzd,
      coolantLiters,
      totalConsumablesCostDzd,
      dto.workDescription || null,
      dto.operatorName || null,
    ];

    const res = await this.db.query<EngineHourRow>(insertSql, params);

    // 6. Synchronisation optionnelle avec meter_readings de l'actif
    try {
      await this.db.query(
        `INSERT INTO meter_readings (tenant_id, asset_id, reading_type, value, recorded_at)
         VALUES ($1, $2, 'HOURS', $3, NOW())`,
        [tenantId, dto.assetId, dto.hoursValue],
      );
    } catch {
      // Ignorer si la table n'accepte pas ce format
    }

    const log = this.mapRow(res.rows[0]);

    // 7. Pontage comptable et fiscal automatique du carburant engin de chantier
    if (this.fiscalBridge && log.fuelConsumedLiters && log.fuelConsumedLiters > 0) {
      try {
        await this.fiscalBridge.bridgeEngineHoursFuel(tenantId, log);
      } catch (err) {
        this.logger.warn(
          `[EngineHours] Erreur de pontage fiscal automatique pour l'engin ${log.assetId}: ${(err as Error).message}`,
        );
      }
    }

    return log;
  }

  async listEngineHourLogs(
    tenantId: string,
    params?: { assetId?: string; siteId?: string; limit?: number },
  ): Promise<AssetEngineHourLog[]> {
    let sql = `
      SELECT * FROM asset_engine_hour_logs
      WHERE tenant_id = $1
    `;
    const queryParams: (string | number)[] = [tenantId];
    let idx = 2;

    if (params?.assetId) {
      sql += ` AND asset_id = $${idx++}`;
      queryParams.push(params.assetId);
    }
    if (params?.siteId) {
      sql += ` AND site_id = $${idx++}`;
      queryParams.push(params.siteId);
    }

    sql += ` ORDER BY recorded_at DESC, created_at DESC`;
    if (params?.limit) {
      sql += ` LIMIT $${idx++}`;
      queryParams.push(params.limit);
    }

    const res = await this.db.query<EngineHourRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: EngineHourRow): AssetEngineHourLog {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      assetId: r.asset_id,
      siteId: r.site_id,
      recordedAt: r.recorded_at,
      hoursValue: Number(r.hours_value),
      deltaHoursSinceLast: Number(r.delta_hours_since_last),
      source: r.source,
      fuelType: r.fuel_type || undefined,
      fuelConsumedLiters: r.fuel_consumed_liters !== null ? Number(r.fuel_consumed_liters) : undefined,
      fuelCostDzd: r.fuel_cost_dzd !== null ? Number(r.fuel_cost_dzd) : undefined,
      hydraulicOilLiters: r.hydraulic_oil_liters !== null ? Number(r.hydraulic_oil_liters) : undefined,
      hydraulicOilCostDzd: r.hydraulic_oil_cost_dzd !== null ? Number(r.hydraulic_oil_cost_dzd) : undefined,
      engineOilLiters: r.engine_oil_liters !== null ? Number(r.engine_oil_liters) : undefined,
      engineOilCostDzd: r.engine_oil_cost_dzd !== null ? Number(r.engine_oil_cost_dzd) : undefined,
      adblueLiters: r.adblue_liters !== null ? Number(r.adblue_liters) : undefined,
      adblueCostDzd: r.adblue_cost_dzd !== null ? Number(r.adblue_cost_dzd) : undefined,
      coolantLiters: r.coolant_liters !== null ? Number(r.coolant_liters) : undefined,
      totalConsumablesCostDzd: r.total_consumables_cost_dzd !== null ? Number(r.total_consumables_cost_dzd) : undefined,
      workDescription: r.work_description || undefined,
      operatorName: r.operator_name || undefined,
      isValidated: r.is_validated,
      createdAt: r.created_at,
    };
  }
}

