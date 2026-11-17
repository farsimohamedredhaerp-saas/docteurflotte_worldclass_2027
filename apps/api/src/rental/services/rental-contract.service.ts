import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  AssetRentalContract,
  CreateRentalContractDto,
  RentalContractStatus,
} from '@docteurflotte/contracts';

interface ContractRow {
  id: string;
  tenant_id: string;
  contract_number: string;
  asset_id: string;
  asset_code?: string;
  customer_name: string;
  customer_nif: string | null;
  customer_phone_dz: string;
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  daily_rate_dzd: string | number;
  included_km_or_hours_per_day: string | number;
  extra_unit_rate_dzd: string | number;
  fuel_refill_rate_per_liter_dzd: string | number;
  deposit_amount_dzd: string | number;
  status: RentalContractStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class RentalContractService {
  constructor(private readonly db: DatabaseService) {}

  async createContract(tenantId: string, dto: CreateRentalContractDto): Promise<AssetRentalContract> {
    if (!dto.assetId) {
      throw new BadRequestException('assetId est obligatoire pour établir un contrat de location.');
    }
    if (!dto.customerName || !dto.customerPhoneDz) {
      throw new BadRequestException('Le nom et le numéro de téléphone du client sont obligatoires.');
    }
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('Les dates de début et de fin de location sont obligatoires.');
    }

    // 1. Vérification stricte Asset Racine & Règle « 0 DA au garage »
    const assetRes = await this.db.query(
      `SELECT id, code, name, status, tenant_id FROM assets WHERE id = $1`,
      [dto.assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${dto.assetId}`);
    }
    const asset = assetRes.rows[0];
    if (asset.tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : actif non autorisé.");
    }
    if (asset.status === 'DECOMMISSIONED') {
      throw new BadRequestException('Impossible de louer un actif décommissionné.');
    }
    // RÈGLE DU GARAGE À 0 DA
    if (asset.status === 'DOWN' || asset.status === 'MAINTENANCE_REQUIRED') {
      throw new BadRequestException(
        `Règle du garage : l'actif ${asset.code} est actuellement immobilisé (${asset.status}). Il ne peut pas être mis en location.`,
      );
    }

    // 2. Vérification chevauchement de contrat actif
    const conflictSql = `
      SELECT id FROM asset_rental_contracts
      WHERE tenant_id = $1 AND asset_id = $2
        AND status IN ('ACTIVE', 'RESERVED')
        AND (
          (start_date <= $4 AND end_date >= $3)
        )
    `;
    const conflictRes = await this.db.query(conflictSql, [tenantId, dto.assetId, dto.startDate, dto.endDate]);
    if (conflictRes.rows.length > 0) {
      throw new BadRequestException('Cet actif fait déjà l’objet d’une réservation ou d’un contrat actif sur cette période.');
    }

    // 3. Numéro de contrat séquentiel
    const countRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM asset_rental_contracts WHERE tenant_id = $1`,
      [tenantId],
    );
    const seq = Number(countRes.rows[0].count) + 1;
    const contractNumber = `CTR-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    const insertSql = `
      INSERT INTO asset_rental_contracts (
        tenant_id, contract_number, asset_id, customer_name, customer_nif, customer_phone_dz,
        start_date, end_date, daily_rate_dzd, included_km_or_hours_per_day, extra_unit_rate_dzd,
        fuel_refill_rate_per_liter_dzd, deposit_amount_dzd, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'RESERVED', $14)
      RETURNING *
    `;
    const params = [
      tenantId,
      contractNumber,
      dto.assetId,
      dto.customerName,
      dto.customerNif || null,
      dto.customerPhoneDz,
      dto.startDate,
      dto.endDate,
      dto.dailyRateDzd || 0,
      dto.includedKmOrHoursPerDay || 200,
      dto.extraUnitRateDzd || 50,
      dto.fuelRefillRatePerLiterDzd || 40,
      dto.depositAmountDzd || 0,
      dto.notes || null,
    ];

    const res = await this.db.query<ContractRow>(insertSql, params);
    const row = res.rows[0];
    row.asset_code = asset.code;
    return this.mapRow(row);
  }

  async listContracts(
    tenantId: string,
    params?: { assetId?: string; status?: RentalContractStatus },
  ): Promise<AssetRentalContract[]> {
    let sql = `
      SELECT c.*, a.code as asset_code
      FROM asset_rental_contracts c
      JOIN assets a ON a.id = c.asset_id
      WHERE c.tenant_id = $1
    `;
    const queryParams: string[] = [tenantId];
    let idx = 2;

    if (params?.assetId) {
      sql += ` AND c.asset_id = $${idx++}`;
      queryParams.push(params.assetId);
    }
    if (params?.status) {
      sql += ` AND c.status = $${idx++}`;
      queryParams.push(params.status);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const res = await this.db.query<ContractRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  async getContractById(tenantId: string, contractId: string): Promise<AssetRentalContract> {
    const sql = `
      SELECT c.*, a.code as asset_code
      FROM asset_rental_contracts c
      JOIN assets a ON a.id = c.asset_id
      WHERE c.tenant_id = $1 AND c.id = $2
    `;
    const res = await this.db.query<ContractRow>(sql, [tenantId, contractId]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Contrat de location introuvable: ${contractId}`);
    }
    return this.mapRow(res.rows[0]);
  }

  async updateContractStatus(
    tenantId: string,
    contractId: string,
    status: RentalContractStatus,
  ): Promise<AssetRentalContract> {
    const sql = `
      UPDATE asset_rental_contracts
      SET status = $1, updated_at = NOW()
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `;
    const res = await this.db.query<ContractRow>(sql, [status, tenantId, contractId]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Contrat de location introuvable: ${contractId}`);
    }
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: ContractRow): AssetRentalContract {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      contractNumber: r.contract_number,
      assetId: r.asset_id,
      assetCode: r.asset_code,
      customerName: r.customer_name,
      customerNif: r.customer_nif || undefined,
      customerPhoneDz: r.customer_phone_dz,
      startDate: r.start_date,
      endDate: r.end_date,
      actualReturnDate: r.actual_return_date || undefined,
      dailyRateDzd: Number(r.daily_rate_dzd),
      includedKmOrHoursPerDay: Number(r.included_km_or_hours_per_day),
      extraUnitRateDzd: Number(r.extra_unit_rate_dzd),
      fuelRefillRatePerLiterDzd: Number(r.fuel_refill_rate_per_liter_dzd),
      depositAmountDzd: Number(r.deposit_amount_dzd),
      status: r.status,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

