import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  IrrigationPivot,
  CreateIrrigationPivotDto,
  IrrigationTelemetryLog,
  RecordIrrigationTelemetryDto,
  CropType,
  PivotStatus,
} from '@docteurflotte/contracts';

@Injectable()
export class IrrigationPivotsService {
  private readonly logger = new Logger(IrrigationPivotsService.name);

  constructor(private readonly db: DatabaseService) {}

  async listPivots(tenantId: string, farmId?: string): Promise<IrrigationPivot[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let sql = `SELECT * FROM irrigation_pivots WHERE tenant_id = $1`;
      const params: any[] = [tenantId];

      if (farmId) {
        sql += ` AND farm_id = $2`;
        params.push(farmId);
      }

      sql += ` ORDER BY pivot_code ASC`;
      const res = await client.query(sql, params);
      return res.rows.map((r) => this.mapPivot(r));
    });
  }

  async createPivot(tenantId: string, dto: CreateIrrigationPivotDto): Promise<IrrigationPivot> {
    if (!dto.farmId || !dto.pivotCode || !dto.name) {
      throw new BadRequestException('Domaine de rattachement, code pivot et désignation obligatoires.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO irrigation_pivots (
          tenant_id, farm_id, pivot_code, name, crop_type,
          surface_hectares, borehole_depth_meters, generator_asset_id,
          pump_power_kw, nominal_flow_m3_h, nominal_fuel_burn_rate_l_h
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          tenantId,
          dto.farmId,
          dto.pivotCode.trim().toUpperCase(),
          dto.name.trim(),
          dto.cropType || CropType.BLE_DUR,
          dto.surfaceHectares || 80.0,
          dto.boreholeDepthMeters || 450.0,
          dto.generatorAssetId || null,
          dto.pumpPowerKw || 110.0,
          dto.nominalFlowM3H || 180.0,
          dto.nominalFuelBurnRateLH || 32.0,
        ],
      );
      return this.mapPivot(res.rows[0]);
    });
  }

  async recordTelemetry(
    tenantId: string,
    dto: RecordIrrigationTelemetryDto,
  ): Promise<IrrigationTelemetryLog> {
    if (!dto.pivotId || dto.hoursRunningDelta <= 0) {
      throw new BadRequestException('ID pivot et delta d’heures de fonctionnement obligatoires.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Récupération du pivot
      const pivotRes = await client.query(
        `SELECT * FROM irrigation_pivots WHERE id = $1 AND tenant_id = $2`,
        [dto.pivotId, tenantId],
      );
      if (pivotRes.rows.length === 0) {
        throw new NotFoundException(`Pivot ${dto.pivotId} introuvable.`);
      }
      const pivot = pivotRes.rows[0];

      // 2. Calculs agronomiques et énergétiques
      const hourlyBurnRate = Math.round((dto.fuelConsumedLiters / dto.hoursRunningDelta) * 100) / 100;
      const nominalBurn = Number(pivot.nominal_fuel_burn_rate_l_h || 32.0);
      const isBurnAbnormal = hourlyBurnRate > nominalBurn * 1.35; // Détection surconsommation / siphonnage

      const waterFlow = Number(dto.waterFlowM3H || pivot.nominal_flow_m3_h || 180.0);
      const waterVolumeDelta = waterFlow * dto.hoursRunningDelta;
      const efficiencyRatio =
        waterVolumeDelta > 0
          ? Math.round((dto.fuelConsumedLiters / waterVolumeDelta) * 10000) / 10000
          : 0;

      // 3. Insertion du log télématique
      const logRes = await client.query(
        `INSERT INTO irrigation_telemetry_logs (
          tenant_id, pivot_id, recorded_at, hours_running_delta,
          fuel_consumed_liters, hourly_burn_rate_l_h, water_flow_m3_h,
          water_pressure_bar, efficiency_ratio_l_per_m3, ambient_temp_c,
          is_burn_rate_abnormal
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          tenantId,
          dto.pivotId,
          dto.hoursRunningDelta,
          dto.fuelConsumedLiters,
          hourlyBurnRate,
          waterFlow,
          dto.waterPressureBar ?? 3.5,
          efficiencyRatio,
          dto.ambientTempC || null,
          isBurnAbnormal,
        ],
      );

      // 4. Mise à jour des compteurs cumulés du pivot
      await client.query(
        `UPDATE irrigation_pivots
         SET total_running_hours = total_running_hours + $1,
             total_water_volume_m3 = total_water_volume_m3 + $2,
             total_fuel_consumed_liters = total_fuel_consumed_liters + $3,
             updated_at = NOW()
         WHERE id = $4 AND tenant_id = $5`,
        [dto.hoursRunningDelta, waterVolumeDelta, dto.fuelConsumedLiters, dto.pivotId, tenantId],
      );

      return this.mapTelemetry(logRes.rows[0]);
    });
  }

  async listTelemetry(
    tenantId: string,
    pivotId: string,
    limit = 50,
  ): Promise<IrrigationTelemetryLog[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM irrigation_telemetry_logs
         WHERE pivot_id = $1 AND tenant_id = $2
         ORDER BY recorded_at DESC LIMIT $3`,
        [pivotId, tenantId, limit],
      );
      return res.rows.map((r) => this.mapTelemetry(r));
    });
  }

  private mapPivot(row: any): IrrigationPivot {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      farmId: row.farm_id,
      pivotCode: row.pivot_code,
      name: row.name,
      cropType: row.crop_type as CropType,
      surfaceHectares: Number(row.surface_hectares),
      boreholeDepthMeters: Number(row.borehole_depth_meters),
      generatorAssetId: row.generator_asset_id || undefined,
      pumpPowerKw: Number(row.pump_power_kw),
      nominalFlowM3H: Number(row.nominal_flow_m3_h),
      nominalFuelBurnRateLH: Number(row.nominal_fuel_burn_rate_l_h),
      status: row.status as PivotStatus,
      totalRunningHours: Number(row.total_running_hours),
      totalWaterVolumeM3: Number(row.total_water_volume_m3),
      totalFuelConsumedLiters: Number(row.total_fuel_consumed_liters),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapTelemetry(row: any): IrrigationTelemetryLog {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      pivotId: row.pivot_id,
      recordedAt: row.recorded_at.toISOString(),
      hoursRunningDelta: Number(row.hours_running_delta),
      fuelConsumedLiters: Number(row.fuel_consumed_liters),
      hourlyBurnRateLH: Number(row.hourly_burn_rate_l_h),
      waterFlowM3H: Number(row.water_flow_m3_h),
      waterPressureBar: Number(row.water_pressure_bar),
      efficiencyRatioLPerM3: Number(row.efficiency_ratio_l_per_m3),
      ambientTempC: row.ambient_temp_c !== null ? Number(row.ambient_temp_c) : undefined,
      isBurnRateAbnormal: Boolean(row.is_burn_rate_abnormal),
      createdAt: row.created_at.toISOString(),
    };
  }
}

