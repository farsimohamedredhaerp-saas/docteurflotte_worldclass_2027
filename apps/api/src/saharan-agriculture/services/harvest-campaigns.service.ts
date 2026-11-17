import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  HarvestCampaignLog,
  RecordHarvestCampaignDto,
  CropType,
  AgriculturalTaskType,
} from '@docteurflotte/contracts';

@Injectable()
export class HarvestCampaignsService {
  private readonly logger = new Logger(HarvestCampaignsService.name);

  constructor(private readonly db: DatabaseService) {}

  async recordHarvest(tenantId: string, dto: RecordHarvestCampaignDto): Promise<HarvestCampaignLog> {
    if (!dto.farmId || !dto.assetId || dto.areaWorkedHectares <= 0) {
      throw new BadRequestException('Domaine, engin agricole et surface travaillée obligatoires.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Calculs économiques et rémunération chauffeur à la tâche
      const rateHectare = Number(dto.driverRatePerHectareDzd || 0);
      const rateQuintal = Number(dto.driverRatePerQuintalDzd || 0);
      const yieldQuintals = Number(dto.yieldQuintals || 0);
      const driverPayout = dto.areaWorkedHectares * rateHectare + yieldQuintals * rateQuintal;

      // Coût du carburant (Gasoil agricole 29.00 DA/L)
      const fuelCost = Math.round(Number(dto.fuelConsumedLiters) * 29.0 * 100) / 100;

      // Coût unitaire direct par quintal récolté
      const costPerQuintal =
        yieldQuintals > 0
          ? Math.round(((driverPayout + fuelCost) / yieldQuintals) * 100) / 100
          : 0;

      const campaignYear = dto.campaignYear || new Date().getFullYear();
      const crop = dto.cropType || CropType.BLE_DUR;
      const task = dto.taskType || AgriculturalTaskType.MOISSON_BATTAGE;

      // 2. Scellé cryptographique d'intégrité SHA-256
      const sealPayload = `${tenantId}:${dto.farmId}:${dto.assetId}:${dto.startDate}:${dto.areaWorkedHectares}:${yieldQuintals}:${fuelCost}:${driverPayout}`;
      const sha256Proof = crypto.createHash('sha256').update(sealPayload).digest('hex');

      // 3. Insertion en base
      const res = await client.query(
        `INSERT INTO harvest_campaign_logs (
          tenant_id, farm_id, asset_id, driver_id, campaign_year,
          crop_type, task_type, start_date, end_date, area_worked_hectares,
          yield_quintals, ccls_delivery_note_ref, driver_rate_per_hectare_dzd,
          driver_rate_per_quintal_dzd, driver_payout_dzd, fuel_consumed_liters,
          fuel_cost_dzd, total_cost_per_quintal_dzd, sha256_proof
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          tenantId,
          dto.farmId,
          dto.assetId,
          dto.driverId || null,
          campaignYear,
          crop,
          task,
          dto.startDate,
          dto.endDate || null,
          dto.areaWorkedHectares,
          yieldQuintals,
          dto.cclsDeliveryNoteRef || null,
          rateHectare,
          rateQuintal,
          driverPayout,
          dto.fuelConsumedLiters,
          fuelCost,
          costPerQuintal,
          sha256Proof,
        ],
      );

      return this.mapHarvest(res.rows[0]);
    });
  }

  async listHarvestLogs(
    tenantId: string,
    params?: { farmId?: string; year?: number },
  ): Promise<HarvestCampaignLog[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let sql = `SELECT * FROM harvest_campaign_logs WHERE tenant_id = $1`;
      const sqlParams: any[] = [tenantId];

      if (params?.farmId) {
        sqlParams.push(params.farmId);
        sql += ` AND farm_id = $${sqlParams.length}`;
      }
      if (params?.year) {
        sqlParams.push(params.year);
        sql += ` AND campaign_year = $${sqlParams.length}`;
      }

      sql += ` ORDER BY start_date DESC LIMIT 100`;
      const res = await client.query(sql, sqlParams);
      return res.rows.map((r) => this.mapHarvest(r));
    });
  }

  private mapHarvest(row: any): HarvestCampaignLog {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      farmId: row.farm_id,
      assetId: row.asset_id,
      driverId: row.driver_id || undefined,
      campaignYear: Number(row.campaign_year),
      cropType: row.crop_type as CropType,
      taskType: row.task_type as AgriculturalTaskType,
      startDate: row.start_date.toISOString().split('T')[0],
      endDate: row.end_date ? row.end_date.toISOString().split('T')[0] : undefined,
      areaWorkedHectares: Number(row.area_worked_hectares),
      yieldQuintals: Number(row.yield_quintals),
      cclsDeliveryNoteRef: row.ccls_delivery_note_ref || undefined,
      driverRatePerHectareDzd: Number(row.driver_rate_per_hectare_dzd),
      driverRatePerQuintalDzd: Number(row.driver_rate_per_quintal_dzd),
      driverPayoutDzd: Number(row.driver_payout_dzd),
      fuelConsumedLiters: Number(row.fuel_consumed_liters),
      fuelCostDzd: Number(row.fuel_cost_dzd),
      totalCostPerQuintalDzd: Number(row.total_cost_per_quintal_dzd),
      sha256Proof: row.sha256_proof,
      createdAt: row.created_at.toISOString(),
    };
  }
}

