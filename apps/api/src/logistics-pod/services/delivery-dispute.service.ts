import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DeliveryDispute, ShipmentStatus } from '@docteurflotte/contracts';

interface DisputeRow {
  id: string;
  tenant_id: string;
  lve_id: string;
  asset_id: string;
  dispute_number: string;
  dispute_type: 'DAMAGE' | 'SHORTAGE' | 'REFUSAL' | 'WRONG_ADDRESS' | 'LATE_DELIVERY';
  description: string;
  estimated_claim_amount_dzd: string | number;
  is_billing_blocked: boolean;
  status: 'OPEN' | 'INVESTIGATING' | 'SETTLED';
  photos_urls: string[];
  created_at: string;
}

@Injectable()
export class DeliveryDisputeService {
  constructor(private readonly db: DatabaseService) {}

  async createDispute(
    tenantId: string,
    data: {
      lveId: string;
      disputeType: 'DAMAGE' | 'SHORTAGE' | 'REFUSAL' | 'WRONG_ADDRESS' | 'LATE_DELIVERY';
      description: string;
      estimatedClaimAmountDzd?: number;
      photosUrls?: string[];
    },
  ): Promise<DeliveryDispute> {
    if (!data.lveId || !data.description) {
      throw new BadRequestException('lveId et description sont obligatoires pour déclarer un litige.');
    }

    // 1. Récupération de la LVE
    const lveRes = await this.db.query<{ id: string; asset_id: string }>(
      `SELECT id, asset_id FROM logistics_consignment_notes WHERE tenant_id = $1 AND id = $2`,
      [tenantId, data.lveId],
    );
    if (lveRes.rows.length === 0) {
      throw new NotFoundException(`Lettre de voiture introuvable: ${data.lveId}`);
    }
    const lve = lveRes.rows[0];

    // 2. Numéro de litige séquentiel
    const countRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM logistics_delivery_disputes WHERE tenant_id = $1`,
      [tenantId],
    );
    const seq = Number(countRes.rows[0].count) + 1;
    const disputeNumber = `LIT-LVE-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    // 3. Insertion litige avec blocage systématique de la facturation
    const insertSql = `
      INSERT INTO logistics_delivery_disputes (
        tenant_id, lve_id, asset_id, dispute_number, dispute_type, description,
        estimated_claim_amount_dzd, is_billing_blocked, status, photos_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, 'OPEN', $8)
      RETURNING *
    `;
    const params = [
      tenantId,
      data.lveId,
      lve.asset_id,
      disputeNumber,
      data.disputeType,
      data.description,
      data.estimatedClaimAmountDzd || 0,
      JSON.stringify(data.photosUrls || []),
    ];

    const res = await this.db.query<DisputeRow>(insertSql, params);

    // 4. Mise à jour de la LVE à DISPUTED
    await this.db.query(
      `UPDATE logistics_consignment_notes SET status = 'DISPUTED', updated_at = NOW() WHERE id = $1`,
      [data.lveId],
    );

    return this.mapRow(res.rows[0]);
  }

  async settleDispute(tenantId: string, disputeId: string): Promise<DeliveryDispute> {
    const updateSql = `
      UPDATE logistics_delivery_disputes
      SET status = 'SETTLED', is_billing_blocked = FALSE
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    const res = await this.db.query<DisputeRow>(updateSql, [tenantId, disputeId]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Litige introuvable: ${disputeId}`);
    }
    return this.mapRow(res.rows[0]);
  }

  async listDisputes(tenantId: string, lveId?: string): Promise<DeliveryDispute[]> {
    let sql = `SELECT * FROM logistics_delivery_disputes WHERE tenant_id = $1`;
    const params: string[] = [tenantId];
    if (lveId) {
      sql += ` AND lve_id = $2`;
      params.push(lveId);
    }
    sql += ` ORDER BY created_at DESC`;
    const res = await this.db.query<DisputeRow>(sql, params);
    return res.rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: DisputeRow): DeliveryDispute {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      lveId: r.lve_id,
      assetId: r.asset_id,
      disputeNumber: r.dispute_number,
      disputeType: r.dispute_type,
      description: r.description,
      estimatedClaimAmountDzd: Number(r.estimated_claim_amount_dzd),
      isBillingBlocked: r.is_billing_blocked,
      status: r.status,
      photosUrls: typeof r.photos_urls === 'string'
        ? JSON.parse(r.photos_urls)
        : (r.photos_urls || []),
      createdAt: r.created_at,
    };
  }
}

