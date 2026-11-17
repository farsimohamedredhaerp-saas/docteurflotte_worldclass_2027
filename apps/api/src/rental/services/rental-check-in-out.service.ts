import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  AssetRentalCheckInOut,
  CreateRentalCheckInOutDto,
  CheckInOutType,
  RentalContractStatus,
} from '@docteurflotte/contracts';

interface CheckInOutRow {
  id: string;
  tenant_id: string;
  contract_id: string;
  asset_id: string;
  type: CheckInOutType;
  performed_at: string;
  performed_by: string;
  customer_signatory_name: string;
  meter_value: string | number;
  fuel_level_quarter: number;
  cleanliness_state: 'CLEAN' | 'ACCEPTABLE' | 'DIRTY';
  accessories_present: Record<string, boolean>;
  damages_notes: string | null;
  photos_urls: string[];
  signature_svg: string;
  sha256_proof: string;
  created_at: string;
}

@Injectable()
export class RentalCheckInOutService {
  constructor(private readonly db: DatabaseService) {}

  async recordCheckInOut(
    tenantId: string,
    dto: CreateRentalCheckInOutDto,
    performedBy: string,
  ): Promise<AssetRentalCheckInOut> {
    if (!dto.contractId) {
      throw new BadRequestException('contractId est obligatoire.');
    }
    if (dto.meterValue === undefined || dto.meterValue < 0) {
      throw new BadRequestException('La valeur du compteur kilométrique/horaire est obligatoire.');
    }
    if (!dto.signatureSvg) {
      throw new BadRequestException('La signature numérique du client est obligatoire pour le scellement du PV.');
    }

    // 1. Contrat
    const contractRes = await this.db.query<{
      id: string;
      asset_id: string;
      status: RentalContractStatus;
      start_date: string;
    }>(
      `SELECT id, asset_id, status, start_date FROM asset_rental_contracts WHERE tenant_id = $1 AND id = $2`,
      [tenantId, dto.contractId],
    );
    if (contractRes.rows.length === 0) {
      throw new NotFoundException(`Contrat introuvable: ${dto.contractId}`);
    }
    const contract = contractRes.rows[0];

    // 2. Contrôles spécifiques au type
    if (dto.type === CheckInOutType.CHECK_OUT) {
      const existingOut = await this.db.query(
        `SELECT id FROM asset_rental_check_ins_outs WHERE tenant_id = $1 AND contract_id = $2 AND type = 'CHECK_OUT'`,
        [tenantId, dto.contractId],
      );
      if (existingOut.rows.length > 0) {
        throw new BadRequestException('Un état des lieux de départ (Check-Out) existe déjà pour ce contrat.');
      }
    } else if (dto.type === CheckInOutType.CHECK_IN) {
      const checkOutRes = await this.db.query<CheckInOutRow>(
        `SELECT meter_value FROM asset_rental_check_ins_outs 
         WHERE tenant_id = $1 AND contract_id = $2 AND type = 'CHECK_OUT'`,
        [tenantId, dto.contractId],
      );
      if (checkOutRes.rows.length === 0) {
        throw new BadRequestException('Impossible d’effectuer un Check-In sans Check-Out préalable.');
      }
      const departureMeter = Number(checkOutRes.rows[0].meter_value);
      if (dto.meterValue < departureMeter) {
        throw new BadRequestException(
          `Compteur de retour incohérent (${dto.meterValue}) inférieur au compteur de départ (${departureMeter}).`,
        );
      }
    }

    // 3. Calcul scellé cryptographique SHA-256 du PV d'état des lieux
    const canonicalPayload = JSON.stringify({
      tenantId,
      contractId: dto.contractId,
      assetId: contract.asset_id,
      type: dto.type,
      customerSignatoryName: dto.customerSignatoryName,
      meterValue: dto.meterValue,
      fuelLevelQuarter: dto.fuelLevelQuarter,
      cleanlinessState: dto.cleanlinessState,
      damagesNotes: dto.damagesNotes || '',
      accessoriesPresent: dto.accessoriesPresent || {},
      performedAt: new Date().toISOString().substring(0, 10),
    });
    const sha256Proof = createHash('sha256').update(canonicalPayload).digest('hex');

    // 4. Insertion
    const insertSql = `
      INSERT INTO asset_rental_check_ins_outs (
        tenant_id, contract_id, asset_id, type, performed_by, customer_signatory_name,
        meter_value, fuel_level_quarter, cleanliness_state, accessories_present,
        damages_notes, photos_urls, signature_svg, sha256_proof
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.contractId,
      contract.asset_id,
      dto.type,
      performedBy,
      dto.customerSignatoryName,
      dto.meterValue,
      dto.fuelLevelQuarter,
      dto.cleanlinessState,
      JSON.stringify(dto.accessoriesPresent || {}),
      dto.damagesNotes || null,
      JSON.stringify(dto.photosUrls || []),
      dto.signatureSvg,
      sha256Proof,
    ];

    const res = await this.db.query<CheckInOutRow>(insertSql, params);

    // 5. Mise à jour de l'état du contrat
    if (dto.type === CheckInOutType.CHECK_OUT) {
      await this.db.query(
        `UPDATE asset_rental_contracts SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
        [dto.contractId],
      );
    } else if (dto.type === CheckInOutType.CHECK_IN) {
      await this.db.query(
        `UPDATE asset_rental_contracts SET status = 'RETURNED', actual_return_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1`,
        [dto.contractId],
      );
    }

    return this.mapRow(res.rows[0]);
  }

  async listCheckInOuts(tenantId: string, contractId?: string): Promise<AssetRentalCheckInOut[]> {
    let sql = `SELECT * FROM asset_rental_check_ins_outs WHERE tenant_id = $1`;
    const params: string[] = [tenantId];
    if (contractId) {
      sql += ` AND contract_id = $2`;
      params.push(contractId);
    }
    sql += ` ORDER BY performed_at ASC`;
    const res = await this.db.query<CheckInOutRow>(sql, params);
    return res.rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: CheckInOutRow): AssetRentalCheckInOut {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      contractId: r.contract_id,
      assetId: r.asset_id,
      type: r.type,
      performedAt: r.performed_at,
      performedBy: r.performed_by,
      customerSignatoryName: r.customer_signatory_name,
      meterValue: Number(r.meter_value),
      fuelLevelQuarter: r.fuel_level_quarter,
      cleanlinessState: r.cleanliness_state,
      accessoriesPresent: typeof r.accessories_present === 'string'
        ? JSON.parse(r.accessories_present)
        : (r.accessories_present || {}),
      damagesNotes: r.damages_notes || undefined,
      photosUrls: typeof r.photos_urls === 'string'
        ? JSON.parse(r.photos_urls)
        : (r.photos_urls || []),
      signatureSvg: r.signature_svg,
      sha256Proof: r.sha256_proof,
      createdAt: r.created_at,
    };
  }
}

