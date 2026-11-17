import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { InsuranceRiskScore } from '@docteurflotte/contracts';

@Injectable()
export class RiskScoreService {
  constructor(private readonly db: DatabaseService) {}

  async getAssetRiskScore(tenantId: string, assetId: string): Promise<InsuranceRiskScore> {
    const assetRes = await this.db.query(
      `SELECT id, code, name FROM assets WHERE id = $1 AND tenant_id = $2`,
      [assetId, tenantId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${assetId}`);
    }
    const asset = assetRes.rows[0];

    // Calcul des sinistres sur les 12 derniers mois
    const claimsRes = await this.db.query<{ count: string | number; total_damage: string | number }>(
      `SELECT COUNT(*)::int as count, COALESCE(SUM(estimated_damage_dzd), 0) as total_damage
       FROM asset_accident_claims
       WHERE tenant_id = $1 AND asset_id = $2 AND accident_date >= NOW() - INTERVAL '12 months'`,
      [tenantId, assetId],
    );
    const claimsCount = Number(claimsRes.rows[0]?.count || 0);
    const totalClaimsCostDzd = Number(claimsRes.rows[0]?.total_damage || 0);

    // Calcul des infractions/amendes sur les 12 derniers mois
    const finesRes = await this.db.query<{ count: string | number; total_amount: string | number }>(
      `SELECT COUNT(*)::int as count, COALESCE(SUM(amount_dzd), 0) as total_amount
       FROM asset_traffic_fines
       WHERE tenant_id = $1 AND asset_id = $2 AND infraction_date >= NOW() - INTERVAL '12 months'`,
      [tenantId, assetId],
    );
    const finesCount = Number(finesRes.rows[0]?.count || 0);
    const totalFinesAmountDzd = Number(finesRes.rows[0]?.total_amount || 0);

    // Évaluation catégorielle du risque selon la matrice actuarielle
    let riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    let recommendedPremiumAdjustmentPct = 0;

    if (claimsCount >= 3 || totalClaimsCostDzd > 1500000 || finesCount >= 6) {
      riskCategory = 'CRITICAL';
      recommendedPremiumAdjustmentPct = 40; // Majoration prime +40%
    } else if (claimsCount >= 2 || totalClaimsCostDzd > 500000 || finesCount >= 4) {
      riskCategory = 'HIGH';
      recommendedPremiumAdjustmentPct = 25; // Majoration prime +25%
    } else if (claimsCount >= 1 || finesCount >= 2) {
      riskCategory = 'MODERATE';
      recommendedPremiumAdjustmentPct = 10; // Majoration prime +10%
    } else {
      riskCategory = 'LOW';
      recommendedPremiumAdjustmentPct = 0; // Taux normal / Bonus
    }

    return {
      assetId,
      assetCode: asset.code,
      claimsCountLast12m: claimsCount,
      totalClaimsCostDzd,
      finesCountLast12m: finesCount,
      totalFinesAmountDzd,
      riskCategory,
      recommendedPremiumAdjustmentPct,
    };
  }

  async getFleetRiskSummary(tenantId: string): Promise<InsuranceRiskScore[]> {
    const assetsRes = await this.db.query<{ id: string }>(
      `SELECT id FROM assets WHERE tenant_id = $1 ORDER BY code ASC`,
      [tenantId],
    );

    const scores: InsuranceRiskScore[] = [];
    for (const row of assetsRes.rows) {
      const score = await this.getAssetRiskScore(tenantId, row.id);
      scores.push(score);
    }
    return scores;
  }
}

