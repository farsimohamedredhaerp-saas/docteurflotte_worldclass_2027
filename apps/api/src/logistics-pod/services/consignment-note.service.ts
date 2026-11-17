import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  ConsignmentNote,
  CreateConsignmentNoteDto,
  ShipmentStatus,
} from '@docteurflotte/contracts';

interface LveRow {
  id: string;
  tenant_id: string;
  lve_number: string;
  mission_id: string | null;
  asset_id: string;
  asset_code?: string;
  driver_id: string | null;
  driver_name: string | null;
  shipper_name: string;
  shipper_address: string;
  shipper_wilaya_code: number;
  consignee_name: string;
  consignee_address: string;
  consignee_wilaya_code: number;
  consignee_phone_dz: string;
  cargo_nature: string;
  total_weight_kg: string | number;
  packages_count: number;
  status: ShipmentStatus;
  qr_code_validation_hmac: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ConsignmentNoteService {
  private readonly hmacSecret = process.env.LVE_HMAC_SECRET || 'docteurflotte-sovereign-lve-hmac-secret-2027';

  constructor(private readonly db: DatabaseService) {}

  async createConsignmentNote(
    tenantId: string,
    dto: CreateConsignmentNoteDto,
  ): Promise<ConsignmentNote> {
    if (!dto.assetId) {
      throw new BadRequestException('assetId est obligatoire pour émettre une Lettre de Voiture.');
    }
    if (
      !dto.shipperWilayaCode ||
      dto.shipperWilayaCode < 1 ||
      dto.shipperWilayaCode > 58 ||
      !dto.consigneeWilayaCode ||
      dto.consigneeWilayaCode < 1 ||
      dto.consigneeWilayaCode > 58
    ) {
      throw new BadRequestException('Les codes Wilaya expéditeur et destinataire doivent être compris entre 1 et 58.');
    }

    // 1. Vérification Asset Racine
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
      throw new BadRequestException('Impossible d’assigner une LVE à un actif décommissionné.');
    }

    // 2. Numéro officiel séquentiel
    const countRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM logistics_consignment_notes WHERE tenant_id = $1`,
      [tenantId],
    );
    const seq = Number(countRes.rows[0].count) + 1;
    const lveNumber = `LVE-${new Date().getFullYear()}-${seq.toString().padStart(5, '0')}`;

    // 3. Signature cryptographique HMAC-256 (opposable gendarmerie / douanes sans réseau)
    const payloadToSign = `${tenantId}:${lveNumber}:${asset.code}:${dto.shipperWilayaCode}:${dto.consigneeWilayaCode}:${dto.cargoNature}`;
    const qrCodeValidationHmac = createHmac('sha256', this.hmacSecret)
      .update(payloadToSign)
      .digest('hex');

    // 4. Insertion
    const insertSql = `
      INSERT INTO logistics_consignment_notes (
        tenant_id, lve_number, mission_id, asset_id, driver_id, driver_name,
        shipper_name, shipper_address, shipper_wilaya_code,
        consignee_name, consignee_address, consignee_wilaya_code, consignee_phone_dz,
        cargo_nature, total_weight_kg, packages_count, status, qr_code_validation_hmac
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'PREPARED', $17)
      RETURNING *
    `;
    const params = [
      tenantId,
      lveNumber,
      dto.missionId || null,
      dto.assetId,
      dto.driverId || null,
      dto.driverName || null,
      dto.shipperName,
      dto.shipperAddress,
      dto.shipperWilayaCode,
      dto.consigneeName,
      dto.consigneeAddress,
      dto.consigneeWilayaCode,
      dto.consigneePhoneDz,
      dto.cargoNature,
      dto.totalWeightKg || 0,
      dto.packagesCount || 1,
      qrCodeValidationHmac,
    ];

    const res = await this.db.query<LveRow>(insertSql, params);
    const row = res.rows[0];
    row.asset_code = asset.code;
    return this.mapRow(row);
  }

  async listConsignmentNotes(
    tenantId: string,
    params?: { assetId?: string; status?: ShipmentStatus },
  ): Promise<ConsignmentNote[]> {
    let sql = `
      SELECT l.*, a.code as asset_code
      FROM logistics_consignment_notes l
      JOIN assets a ON a.id = l.asset_id
      WHERE l.tenant_id = $1
    `;
    const queryParams: string[] = [tenantId];
    let idx = 2;

    if (params?.assetId) {
      sql += ` AND l.asset_id = $${idx++}`;
      queryParams.push(params.assetId);
    }
    if (params?.status) {
      sql += ` AND l.status = $${idx++}`;
      queryParams.push(params.status);
    }

    sql += ` ORDER BY l.created_at DESC`;
    const res = await this.db.query<LveRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  async getConsignmentNoteById(tenantId: string, id: string): Promise<ConsignmentNote> {
    const sql = `
      SELECT l.*, a.code as asset_code
      FROM logistics_consignment_notes l
      JOIN assets a ON a.id = l.asset_id
      WHERE l.tenant_id = $1 AND l.id = $2
    `;
    const res = await this.db.query<LveRow>(sql, [tenantId, id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Lettre de voiture introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  async updateShipmentStatus(tenantId: string, id: string, status: ShipmentStatus): Promise<ConsignmentNote> {
    const sql = `
      UPDATE logistics_consignment_notes
      SET status = $1, updated_at = NOW()
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `;
    const res = await this.db.query<LveRow>(sql, [status, tenantId, id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Lettre de voiture introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: LveRow): ConsignmentNote {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      lveNumber: r.lve_number,
      missionId: r.mission_id || undefined,
      assetId: r.asset_id,
      assetCode: r.asset_code,
      driverId: r.driver_id || undefined,
      driverName: r.driver_name || undefined,
      shipperName: r.shipper_name,
      shipperAddress: r.shipper_address,
      shipperWilayaCode: Number(r.shipper_wilaya_code),
      consigneeName: r.consignee_name,
      consigneeAddress: r.consignee_address,
      consigneeWilayaCode: Number(r.consignee_wilaya_code),
      consigneePhoneDz: r.consignee_phone_dz,
      cargoNature: r.cargo_nature,
      totalWeightKg: Number(r.total_weight_kg),
      packagesCount: Number(r.packages_count),
      status: r.status,
      qrCodeValidationHmac: r.qr_code_validation_hmac,
      createdAt: r.created_at,
    };
  }
}

