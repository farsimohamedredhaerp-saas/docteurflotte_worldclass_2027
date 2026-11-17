import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { InsuranceCase, ClaimStatus } from '@docteurflotte/contracts';

export interface OpenInsuranceCaseDto {
  claimId: string;
  insurancePolicyNumber: string;
  insuranceCompany: string;
  expertName?: string;
  assessedDamageDzd?: number;
  deductibleDzd?: number;
  approvedCompensationDzd?: number;
}

export interface SettleInsuranceCaseDto {
  approvedCompensationDzd: number;
  payoutDate?: string;
}

interface InsuranceCaseRow {
  id: string;
  tenant_id: string;
  claim_id: string;
  asset_id: string;
  insurance_policy_number: string;
  insurance_company: string;
  expert_name: string | null;
  assessed_damage_dzd: string | number;
  deductible_dzd: string | number;
  approved_compensation_dzd: string | number;
  payout_date: string | null;
  is_closed: boolean;
  created_at: string;
}

@Injectable()
export class InsuranceCaseService {
  constructor(private readonly db: DatabaseService) {}

  async openCase(tenantId: string, dto: OpenInsuranceCaseDto): Promise<InsuranceCase> {
    if (!dto.claimId || !dto.insurancePolicyNumber || !dto.insuranceCompany) {
      throw new BadRequestException('Le sinistre, le numéro de police et la compagnie d’assurance sont obligatoires.');
    }

    // 1. Vérification du Sinistre parent et récupération de l'asset_id
    const claimRes = await this.db.query(
      `SELECT id, asset_id, status FROM asset_accident_claims WHERE id = $1 AND tenant_id = $2`,
      [dto.claimId, tenantId],
    );
    if (claimRes.rows.length === 0) {
      throw new NotFoundException(`Sinistre introuvable: ${dto.claimId}`);
    }
    const claim = claimRes.rows[0];

    // 2. Insertion du dossier assurance
    const insertSql = `
      INSERT INTO asset_insurance_cases (
        tenant_id, claim_id, asset_id, insurance_policy_number,
        insurance_company, expert_name, assessed_damage_dzd,
        deductible_dzd, approved_compensation_dzd, is_closed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.claimId,
      claim.asset_id,
      dto.insurancePolicyNumber,
      dto.insuranceCompany,
      dto.expertName || null,
      dto.assessedDamageDzd || 0,
      dto.deductibleDzd || 0,
      dto.approvedCompensationDzd || 0,
    ];

    const res = await this.db.query<InsuranceCaseRow>(insertSql, params);
    const row = res.rows[0];

    // 3. Mise à jour statut sinistre -> INSURANCE_SUBMITTED
    await this.db.query(
      `UPDATE asset_accident_claims SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [ClaimStatus.INSURANCE_SUBMITTED, dto.claimId, tenantId],
    );

    return this.mapRow(row);
  }

  async listCases(
    tenantId: string,
    params?: { assetId?: string; isClosed?: boolean },
  ): Promise<InsuranceCase[]> {
    let sql = `SELECT * FROM asset_insurance_cases WHERE tenant_id = $1`;
    const queryParams: any[] = [tenantId];
    let idx = 2;

    if (params?.assetId) {
      sql += ` AND asset_id = $${idx++}`;
      queryParams.push(params.assetId);
    }
    if (params?.isClosed !== undefined) {
      sql += ` AND is_closed = $${idx++}`;
      queryParams.push(params.isClosed);
    }

    sql += ` ORDER BY created_at DESC`;
    const res = await this.db.query<InsuranceCaseRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  async getCaseById(tenantId: string, id: string): Promise<InsuranceCase> {
    const res = await this.db.query<InsuranceCaseRow>(
      `SELECT * FROM asset_insurance_cases WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException(`Dossier assurance introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  async settleCase(
    tenantId: string,
    id: string,
    dto: SettleInsuranceCaseDto,
  ): Promise<InsuranceCase> {
    if (dto.approvedCompensationDzd == null || dto.approvedCompensationDzd < 0) {
      throw new BadRequestException('L’indemnité validée en DZD doit être supérieure ou égale à zéro.');
    }

    const payoutDate = dto.payoutDate || new Date().toISOString().split('T')[0];

    const updateSql = `
      UPDATE asset_insurance_cases
      SET approved_compensation_dzd = $1,
          payout_date = $2,
          is_closed = TRUE
      WHERE tenant_id = $3 AND id = $4
      RETURNING *
    `;
    const res = await this.db.query<InsuranceCaseRow>(updateSql, [
      dto.approvedCompensationDzd,
      payoutDate,
      tenantId,
      id,
    ]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Dossier assurance introuvable: ${id}`);
    }
    const row = res.rows[0];

    // Mise à jour du sinistre parent vers SETTLED
    await this.db.query(
      `UPDATE asset_accident_claims SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [ClaimStatus.SETTLED, row.claim_id, tenantId],
    );

    return this.mapRow(row);
  }

  private mapRow(r: InsuranceCaseRow): InsuranceCase {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      claimId: r.claim_id,
      assetId: r.asset_id,
      insurancePolicyNumber: r.insurance_policy_number,
      insuranceCompany: r.insurance_company,
      expertName: r.expert_name || undefined,
      assessedDamageDzd: Number(r.assessed_damage_dzd),
      deductibleDzd: Number(r.deductible_dzd),
      approvedCompensationDzd: Number(r.approved_compensation_dzd),
      payoutDate: r.payout_date || undefined,
      isClosed: r.is_closed,
      createdAt: r.created_at,
    };
  }
}

