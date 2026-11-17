import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { OtifMetrics } from '@docteurflotte/contracts';

@Injectable()
export class OtifMetricsService {
  constructor(private readonly db: DatabaseService) {}

  async getOtifMetrics(tenantId: string, assetId?: string): Promise<OtifMetrics> {
    let lveSql = `SELECT id, status FROM logistics_consignment_notes WHERE tenant_id = $1`;
    const params: string[] = [tenantId];
    if (assetId) {
      lveSql += ` AND asset_id = $2`;
      params.push(assetId);
    }

    const lveRes = await this.db.query<{ id: string; status: string }>(lveSql, params);
    const totalShipments = lveRes.rows.length;

    let podSql = `
      SELECT p.packages_delivered, p.packages_damaged, p.packages_refused, p.is_first_pass_delivery
      FROM logistics_proof_of_delivery p
      WHERE p.tenant_id = $1
    `;
    const podParams: string[] = [tenantId];
    if (assetId) {
      podSql += ` AND p.asset_id = $2`;
      podParams.push(assetId);
    }
    const podRes = await this.db.query<{
      packages_delivered: number;
      packages_damaged: number;
      packages_refused: number;
      is_first_pass_delivery: boolean;
    }>(podSql, podParams);

    let deliveredInFullCount = 0;
    let firstPassCount = 0;
    podRes.rows.forEach((p) => {
      if (Number(p.packages_damaged) === 0 && Number(p.packages_refused) === 0) {
        deliveredInFullCount++;
      }
      if (p.is_first_pass_delivery) {
        firstPassCount++;
      }
    });

    const deliveredOnTime = deliveredInFullCount; // Approximation déterministe
    const totalDeliveries = Math.max(1, podRes.rows.length);
    const otifRatePct = Number(((deliveredInFullCount / totalDeliveries) * 100).toFixed(1));
    const firstPassDeliveryRatePct = Number(((firstPassCount / totalDeliveries) * 100).toFixed(1));

    // Litiges
    let dispSql = `SELECT COUNT(*)::int as count FROM logistics_delivery_disputes WHERE tenant_id = $1`;
    const dispParams: string[] = [tenantId];
    if (assetId) {
      dispSql += ` AND asset_id = $2`;
      dispParams.push(assetId);
    }
    const dispRes = await this.db.query<{ count: number }>(dispSql, dispParams);
    const disputesCount = Number(dispRes.rows[0]?.count || 0);

    return {
      totalShipments,
      deliveredOnTime,
      deliveredInFull: deliveredInFullCount,
      otifRatePct,
      firstPassDeliveryRatePct,
      totalDeliveryCostDzd: totalShipments * 4500, // Forfait estimé de transport
      averageCostPerDeliveryDzd: 4500,
      disputesCount,
    };
  }
}

