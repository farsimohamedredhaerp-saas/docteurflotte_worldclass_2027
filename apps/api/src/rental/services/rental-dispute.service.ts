import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { AssetRentalDispute } from '@docteurflotte/contracts';

interface DisputeRow {
  id: string;
  tenant_id: string;
  contract_id: string;
  asset_id: string;
  dispute_ref: string;
  claimant: 'LANDLORD' | 'TENANT';
  dispute_reason: string;
  claimed_amount_dzd: string | number;
  retained_deposit_dzd: string | number;
  status: 'OPEN' | 'ARBITRATED' | 'RESOLVED';
  sha256_legal_dossier: string;
  created_at: string;
}

@Injectable()
export class RentalDisputeService {
  constructor(private readonly db: DatabaseService) {}

  async createDispute(
    tenantId: string,
    data: {
      contractId: string;
      claimant: 'LANDLORD' | 'TENANT';
      disputeReason: string;
      claimedAmountDzd: number;
      retainedDepositDzd?: number;
    },
  ): Promise<AssetRentalDispute> {
    if (!data.contractId || !data.disputeReason) {
      throw new BadRequestException('contractId et disputeReason sont obligatoires.');
    }

    // 1. Récupération du contrat
    const contractRes = await this.db.query<{ id: string; asset_id: string; deposit_amount_dzd: string | number }>(
      `SELECT id, asset_id, deposit_amount_dzd FROM asset_rental_contracts WHERE tenant_id = $1 AND id = $2`,
      [tenantId, data.contractId],
    );
    if (contractRes.rows.length === 0) {
      throw new NotFoundException(`Contrat introuvable: ${data.contractId}`);
    }
    const contract = contractRes.rows[0];

    // 2. Réf litige
    const countRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM asset_rental_disputes WHERE tenant_id = $1`,
      [tenantId],
    );
    const seq = Number(countRes.rows[0].count) + 1;
    const disputeRef = `LIT-LOC-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    // 3. Calcul scellé SHA-256 du dossier opposable
    const canonicalDossier = JSON.stringify({
      tenantId,
      contractId: data.contractId,
      assetId: contract.asset_id,
      disputeRef,
      claimant: data.claimant,
      disputeReason: data.disputeReason,
      claimedAmountDzd: data.claimedAmountDzd,
      retainedDepositDzd: data.retainedDepositDzd || Number(contract.deposit_amount_dzd),
      createdAt: new Date().toISOString(),
    });
    const sha256LegalDossier = createHash('sha256').update(canonicalDossier).digest('hex');

    // 4. Insertion
    const insertSql = `
      INSERT INTO asset_rental_disputes (
        tenant_id, contract_id, asset_id, dispute_ref, claimant, dispute_reason,
        claimed_amount_dzd, retained_deposit_dzd, status, sha256_legal_dossier
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', $9)
      RETURNING *
    `;
    const params = [
      tenantId,
      data.contractId,
      contract.asset_id,
      disputeRef,
      data.claimant,
      data.disputeReason,
      data.claimedAmountDzd || 0,
      data.retainedDepositDzd !== undefined ? data.retainedDepositDzd : Number(contract.deposit_amount_dzd),
      sha256LegalDossier,
    ];

    const res = await this.db.query<DisputeRow>(insertSql, params);

    // 5. Mise à jour statut contrat
    await this.db.query(
      `UPDATE asset_rental_contracts SET status = 'DISPUTED', updated_at = NOW() WHERE id = $1`,
      [data.contractId],
    );

    return this.mapRow(res.rows[0]);
  }

  async listDisputes(tenantId: string, contractId?: string): Promise<AssetRentalDispute[]> {
    let sql = `SELECT * FROM asset_rental_disputes WHERE tenant_id = $1`;
    const params: string[] = [tenantId];
    if (contractId) {
      sql += ` AND contract_id = $2`;
      params.push(contractId);
    }
    sql += ` ORDER BY created_at DESC`;
    const res = await this.db.query<DisputeRow>(sql, params);
    return res.rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: DisputeRow): AssetRentalDispute {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      contractId: r.contract_id,
      assetId: r.asset_id,
      disputeRef: r.dispute_ref,
      claimant: r.claimant,
      disputeReason: r.dispute_reason,
      claimedAmountDzd: Number(r.claimed_amount_dzd),
      retainedDepositDzd: Number(r.retained_deposit_dzd),
      status: r.status,
      sha256LegalDossier: r.sha256_legal_dossier,
      createdAt: r.created_at,
    };
  }
}

