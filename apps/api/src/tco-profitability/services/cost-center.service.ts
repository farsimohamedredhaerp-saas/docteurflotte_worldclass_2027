import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AssetCostCenter } from '@docteurflotte/contracts';

interface CostCenterRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  asset_code?: string;
  cost_center_code: string;
  allocated_business_unit: string;
  target_cost_per_km_dzd: string | number | null;
  target_cost_per_hour_dzd: string | number | null;
  monthly_fixed_budget_dzd: string | number;
  created_at: string;
}

@Injectable()
export class CostCenterService {
  constructor(private readonly db: DatabaseService) {}

  async assignCostCenter(
    tenantId: string,
    dto: {
      assetId: string;
      costCenterCode: string;
      allocatedBusinessUnit: string;
      targetCostPerKmDzd?: number;
      targetCostPerHourDzd?: number;
      monthlyFixedBudgetDzd?: number;
    },
  ): Promise<AssetCostCenter> {
    if (!dto.assetId || !dto.costCenterCode || !dto.allocatedBusinessUnit) {
      throw new BadRequestException('L’actif racine, le code centre de coût et l’unité d’affectation sont obligatoires.');
    }

    // 1. Vérification Asset Racine
    const assetRes = await this.db.query(
      `SELECT id, code, tenant_id FROM assets WHERE id = $1`,
      [dto.assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${dto.assetId}`);
    }
    const asset = assetRes.rows[0];
    if (asset.tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : actif non autorisé.");
    }

    const upsertSql = `
      INSERT INTO asset_cost_centers (
        tenant_id, asset_id, cost_center_code, allocated_business_unit,
        target_cost_per_km_dzd, target_cost_per_hour_dzd, monthly_fixed_budget_dzd
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (tenant_id, asset_id)
      DO UPDATE SET
        cost_center_code = EXCLUDED.cost_center_code,
        allocated_business_unit = EXCLUDED.allocated_business_unit,
        target_cost_per_km_dzd = EXCLUDED.target_cost_per_km_dzd,
        target_cost_per_hour_dzd = EXCLUDED.target_cost_per_hour_dzd,
        monthly_fixed_budget_dzd = EXCLUDED.monthly_fixed_budget_dzd
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.assetId,
      dto.costCenterCode.trim().toUpperCase(),
      dto.allocatedBusinessUnit.trim(),
      dto.targetCostPerKmDzd || null,
      dto.targetCostPerHourDzd || null,
      dto.monthlyFixedBudgetDzd || 0,
    ];

    const res = await this.db.query<CostCenterRow>(upsertSql, params);
    const row = res.rows[0];
    row.asset_code = asset.code;
    return this.mapRow(row);
  }

  async listCostCenters(tenantId: string): Promise<AssetCostCenter[]> {
    const sql = `
      SELECT cc.*, a.code as asset_code
      FROM asset_cost_centers cc
      JOIN assets a ON a.id = cc.asset_id
      WHERE cc.tenant_id = $1
      ORDER BY cc.cost_center_code ASC
    `;
    const res = await this.db.query<CostCenterRow>(sql, [tenantId]);
    return res.rows.map((r) => this.mapRow(r));
  }

  async getCostCenterByAsset(tenantId: string, assetId: string): Promise<AssetCostCenter | null> {
    const sql = `
      SELECT cc.*, a.code as asset_code
      FROM asset_cost_centers cc
      JOIN assets a ON a.id = cc.asset_id
      WHERE cc.tenant_id = $1 AND cc.asset_id = $2
    `;
    const res = await this.db.query<CostCenterRow>(sql, [tenantId, assetId]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: CostCenterRow): AssetCostCenter {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      assetId: r.asset_id,
      assetCode: r.asset_code || '',
      costCenterCode: r.cost_center_code,
      allocatedBusinessUnit: r.allocated_business_unit,
      targetCostPerKmDzd: r.target_cost_per_km_dzd != null ? Number(r.target_cost_per_km_dzd) : undefined,
      targetCostPerHourDzd: r.target_cost_per_hour_dzd != null ? Number(r.target_cost_per_hour_dzd) : undefined,
      monthlyFixedBudgetDzd: Number(r.monthly_fixed_budget_dzd),
      createdAt: r.created_at,
    };
  }
}

