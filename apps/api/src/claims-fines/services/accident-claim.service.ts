import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  AccidentClaim,
  CreateAccidentClaimDto,
  ClaimSeverity,
  ClaimStatus,
} from '@docteurflotte/contracts';

interface ClaimRow {
  id: string;
  tenant_id: string;
  claim_number: string;
  asset_id: string;
  asset_code?: string;
  driver_id: string | null;
  driver_name: string | null;
  accident_date: string;
  wilaya_code: number;
  location_details: string;
  severity: ClaimSeverity;
  third_party_involved: boolean;
  third_party_details: Record<string, unknown>;
  police_report_ref: string | null;
  estimated_damage_dzd: string | number;
  photos_urls: string[];
  circumstances_description: string;
  status: ClaimStatus;
  work_order_id_generated: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class AccidentClaimService {
  constructor(private readonly db: DatabaseService) {}

  async createClaim(tenantId: string, dto: CreateAccidentClaimDto): Promise<AccidentClaim> {
    if (!dto.assetId) {
      throw new BadRequestException('assetId est obligatoire pour déclarer un sinistre.');
    }
    if (!dto.accidentDate || !dto.circumstancesDescription) {
      throw new BadRequestException('La date et la description des circonstances du sinistre sont obligatoires.');
    }
    if (!dto.wilayaCode || dto.wilayaCode < 1 || dto.wilayaCode > 58) {
      throw new BadRequestException('Le code Wilaya doit être compris entre 1 et 58 (Nomenclature Algérie).');
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

    // 2. Numéro officiel séquentiel
    const countRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM asset_accident_claims WHERE tenant_id = $1`,
      [tenantId],
    );
    const seq = Number(countRes.rows[0].count) + 1;
    const claimNumber = `SIN-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    // 3. Déclenchement automatique d'un Work Order si gravité élevée
    let workOrderIdGenerated: string | null = null;
    if (dto.severity === ClaimSeverity.SEVERE || dto.severity === ClaimSeverity.MODERATE || dto.severity === ClaimSeverity.TOTAL_LOSS) {
      try {
        const woPriority = dto.severity === ClaimSeverity.SEVERE || dto.severity === ClaimSeverity.TOTAL_LOSS ? 'CRITICAL' : 'HIGH';
        const woRes = await this.db.query<{ id: string }>(
          `INSERT INTO work_orders (
            tenant_id, asset_id, title, description, priority, status
          ) VALUES ($1, $2, $3, $4, $5, 'OPEN') RETURNING id`,
          [
            tenantId,
            dto.assetId,
            `Réparation post-sinistre (${claimNumber} - ${asset.code})`,
            `Sinistre déclaré le ${dto.accidentDate} (Wilaya ${dto.wilayaCode}). Gravité: ${dto.severity}. ${dto.circumstancesDescription}`,
            woPriority,
          ],
        );
        if (woRes.rows.length > 0) {
          workOrderIdGenerated = woRes.rows[0].id;
        }
      } catch (err) {
        console.error('[AccidentClaim] Erreur création work_order:', err);
      }
    }

    // 4. Insertion sinistre
    const insertSql = `
      INSERT INTO asset_accident_claims (
        tenant_id, claim_number, asset_id, driver_id, driver_name, accident_date,
        wilaya_code, location_details, severity, third_party_involved, third_party_details,
        police_report_ref, estimated_damage_dzd, photos_urls, circumstances_description,
        status, work_order_id_generated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'REPORTED', $16)
      RETURNING *
    `;
    const params = [
      tenantId,
      claimNumber,
      dto.assetId,
      dto.driverId || null,
      dto.driverName || null,
      dto.accidentDate,
      dto.wilayaCode,
      dto.locationDetails,
      dto.severity,
      Boolean(dto.thirdPartyInvolved),
      JSON.stringify(dto.thirdPartyDetails || {}),
      dto.policeReportRef || null,
      dto.estimatedDamageDzd || 0,
      JSON.stringify(dto.photosUrls || []),
      dto.circumstancesDescription,
      workOrderIdGenerated,
    ];

    const res = await this.db.query<ClaimRow>(insertSql, params);
    const row = res.rows[0];
    row.asset_code = asset.code;
    return this.mapRow(row);
  }

  async listClaims(
    tenantId: string,
    params?: { assetId?: string; status?: ClaimStatus },
  ): Promise<AccidentClaim[]> {
    let sql = `
      SELECT c.*, a.code as asset_code
      FROM asset_accident_claims c
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

    sql += ` ORDER BY c.accident_date DESC`;
    const res = await this.db.query<ClaimRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  async getClaimById(tenantId: string, id: string): Promise<AccidentClaim> {
    const sql = `
      SELECT c.*, a.code as asset_code
      FROM asset_accident_claims c
      JOIN assets a ON a.id = c.asset_id
      WHERE c.tenant_id = $1 AND c.id = $2
    `;
    const res = await this.db.query<ClaimRow>(sql, [tenantId, id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Sinistre introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  async updateClaimStatus(tenantId: string, id: string, status: ClaimStatus): Promise<AccidentClaim> {
    const sql = `
      UPDATE asset_accident_claims
      SET status = $1, updated_at = NOW()
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `;
    const res = await this.db.query<ClaimRow>(sql, [status, tenantId, id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Sinistre introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: ClaimRow): AccidentClaim {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      claimNumber: r.claim_number,
      assetId: r.asset_id,
      assetCode: r.asset_code,
      driverId: r.driver_id || undefined,
      driverName: r.driver_name || undefined,
      accidentDate: r.accident_date,
      wilayaCode: Number(r.wilaya_code),
      locationDetails: r.location_details,
      severity: r.severity,
      thirdPartyInvolved: r.third_party_involved,
      thirdPartyDetails: typeof r.third_party_details === 'string'
        ? JSON.parse(r.third_party_details)
        : (r.third_party_details || undefined),
      policeReportRef: r.police_report_ref || undefined,
      estimatedDamageDzd: Number(r.estimated_damage_dzd),
      photosUrls: typeof r.photos_urls === 'string'
        ? JSON.parse(r.photos_urls)
        : (r.photos_urls || []),
      circumstancesDescription: r.circumstances_description,
      status: r.status,
      workOrderIdGenerated: r.work_order_id_generated || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

