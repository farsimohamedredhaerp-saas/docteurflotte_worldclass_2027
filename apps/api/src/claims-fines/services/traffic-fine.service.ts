import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  TrafficFine,
  RecordTrafficFineDto,
} from '@docteurflotte/contracts';

interface FineRow {
  id: string;
  tenant_id: string;
  fine_notice_number: string;
  asset_id: string;
  asset_code?: string;
  infraction_date: string;
  wilaya_code: number;
  location_highway_code: string | null;
  infraction_nature: string;
  amount_dzd: string | number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  attributed_driver_id: string | null;
  attributed_driver_name: string | null;
  attribution_source: 'TELEMATICS_GPS_TIMESTAMP' | 'MISSION_ORDER' | 'MANUAL_DISPATCH';
  is_contested: boolean;
  contest_reason: string | null;
  created_at: string;
}

@Injectable()
export class TrafficFineService {
  constructor(private readonly db: DatabaseService) {}

  async recordFine(tenantId: string, dto: RecordTrafficFineDto): Promise<TrafficFine> {
    if (!dto.fineNoticeNumber || !dto.assetId || !dto.infractionDate) {
      throw new BadRequestException('Le numéro de PV, l’actif et la date d’infraction sont obligatoires.');
    }
    if (!dto.wilayaCode || dto.wilayaCode < 1 || dto.wilayaCode > 58) {
      throw new BadRequestException('Le code Wilaya doit être compris entre 1 et 58 (Nomenclature Algérie).');
    }
    if (dto.amountDzd == null || dto.amountDzd < 0) {
      throw new BadRequestException('Le montant de l’amende en DZD doit être supérieur ou égal à zéro.');
    }
    if (!dto.dueDate) {
      throw new BadRequestException('La date limite de paiement est obligatoire.');
    }

    // 1. Vérification Asset Racine
    const assetRes = await this.db.query(
      `SELECT id, code, name, tenant_id FROM assets WHERE id = $1`,
      [dto.assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${dto.assetId}`);
    }
    const asset = assetRes.rows[0];
    if (asset.tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : actif non autorisé.");
    }

    // 2. Résolution / Imputation automatique du chauffeur à l'instant t
    let attributedDriverId: string | null = dto.attributedDriverId || null;
    let attributedDriverName: string | null = null;
    let attributionSource: 'TELEMATICS_GPS_TIMESTAMP' | 'MISSION_ORDER' | 'MANUAL_DISPATCH' =
      dto.attributionSource || 'MANUAL_DISPATCH';

    if (attributedDriverId) {
      // Chauffeur spécifié manuellement : résolution du nom
      const userRes = await this.db.query(
        `SELECT id, first_name, last_name FROM users WHERE id = $1 AND tenant_id = $2`,
        [attributedDriverId, tenantId],
      );
      if (userRes.rows.length > 0) {
        attributedDriverName = `${userRes.rows[0].first_name} ${userRes.rows[0].last_name}`.trim();
      }
    } else {
      // Auto-attribution à l'instant t via Lettres de Voiture / Ordres de Mission
      const missionRes = await this.db.query(
        `SELECT driver_id, driver_name 
         FROM logistics_consignment_notes 
         WHERE tenant_id = $1 
           AND asset_id = $2 
           AND departure_date <= $3 
           AND (estimated_arrival_date >= $3 OR status IN ('IN_TRANSIT', 'DISPATCHED'))
           AND driver_id IS NOT NULL
         ORDER BY departure_date DESC 
         LIMIT 1`,
        [tenantId, dto.assetId, dto.infractionDate],
      );

      if (missionRes.rows.length > 0 && missionRes.rows[0].driver_id) {
        attributedDriverId = missionRes.rows[0].driver_id;
        attributedDriverName = missionRes.rows[0].driver_name;
        attributionSource = 'MISSION_ORDER';
      } else {
        // Recherche dans les affectations de chantiers
        const siteAssignRes = await this.db.query(
          `SELECT assigned_by 
           FROM asset_site_assignments 
           WHERE tenant_id = $1 
             AND asset_id = $2 
             AND assignment_start <= $3 
             AND (assignment_end IS NULL OR assignment_end >= $3)
           LIMIT 1`,
          [tenantId, dto.assetId, dto.infractionDate],
        );

        if (siteAssignRes.rows.length > 0 && siteAssignRes.rows[0].assigned_by) {
          attributedDriverId = siteAssignRes.rows[0].assigned_by;
          const uRes = await this.db.query(
            `SELECT first_name, last_name FROM users WHERE id = $1 AND tenant_id = $2`,
            [attributedDriverId, tenantId],
          );
          if (uRes.rows.length > 0) {
            attributedDriverName = `${uRes.rows[0].first_name} ${uRes.rows[0].last_name}`.trim();
          }
          attributionSource = 'MISSION_ORDER';
        }
      }
    }

    // 3. Insertion de l'amende
    const insertSql = `
      INSERT INTO asset_traffic_fines (
        tenant_id, fine_notice_number, asset_id, infraction_date,
        wilaya_code, location_highway_code, infraction_nature,
        amount_dzd, due_date, is_paid, attributed_driver_id,
        attributed_driver_name, attribution_source, is_contested
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, $10, $11, $12, FALSE)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.fineNoticeNumber,
      dto.assetId,
      dto.infractionDate,
      dto.wilayaCode,
      dto.locationHighwayCode || null,
      dto.infractionNature,
      dto.amountDzd,
      dto.dueDate,
      attributedDriverId,
      attributedDriverName,
      attributionSource,
    ];

    const res = await this.db.query<FineRow>(insertSql, params);
    const row = res.rows[0];
    row.asset_code = asset.code;
    return this.mapRow(row);
  }

  async listFines(
    tenantId: string,
    params?: { assetId?: string; driverId?: string; isPaid?: boolean },
  ): Promise<TrafficFine[]> {
    let sql = `
      SELECT f.*, a.code as asset_code
      FROM asset_traffic_fines f
      JOIN assets a ON a.id = f.asset_id
      WHERE f.tenant_id = $1
    `;
    const queryParams: any[] = [tenantId];
    let idx = 2;

    if (params?.assetId) {
      sql += ` AND f.asset_id = $${idx++}`;
      queryParams.push(params.assetId);
    }
    if (params?.driverId) {
      sql += ` AND f.attributed_driver_id = $${idx++}`;
      queryParams.push(params.driverId);
    }
    if (params?.isPaid !== undefined) {
      sql += ` AND f.is_paid = $${idx++}`;
      queryParams.push(params.isPaid);
    }

    sql += ` ORDER BY f.infraction_date DESC`;
    const res = await this.db.query<FineRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  async getFineById(tenantId: string, id: string): Promise<TrafficFine> {
    const sql = `
      SELECT f.*, a.code as asset_code
      FROM asset_traffic_fines f
      JOIN assets a ON a.id = f.asset_id
      WHERE f.tenant_id = $1 AND f.id = $2
    `;
    const res = await this.db.query<FineRow>(sql, [tenantId, id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Procès-verbal introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  async payFine(tenantId: string, id: string): Promise<TrafficFine> {
    const sql = `
      UPDATE asset_traffic_fines
      SET is_paid = TRUE, paid_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    const res = await this.db.query<FineRow>(sql, [tenantId, id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Procès-verbal introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  async contestFine(tenantId: string, id: string, reason: string): Promise<TrafficFine> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Le motif de contestation de l’amende est obligatoire.');
    }
    const sql = `
      UPDATE asset_traffic_fines
      SET is_contested = TRUE, contest_reason = $1
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `;
    const res = await this.db.query<FineRow>(sql, [reason.trim(), tenantId, id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Procès-verbal introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: FineRow): TrafficFine {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      fineNoticeNumber: r.fine_notice_number,
      assetId: r.asset_id,
      assetCode: r.asset_code,
      infractionDate: r.infraction_date,
      wilayaCode: Number(r.wilaya_code),
      locationHighwayCode: r.location_highway_code || undefined,
      infractionNature: r.infraction_nature,
      amountDzd: Number(r.amount_dzd),
      dueDate: r.due_date,
      isPaid: r.is_paid,
      paidAt: r.paid_at || undefined,
      attributedDriverId: r.attributed_driver_id || undefined,
      attributedDriverName: r.attributed_driver_name || undefined,
      attributionSource: r.attribution_source,
      isContested: r.is_contested,
      contestReason: r.contest_reason || undefined,
      createdAt: r.created_at,
    };
  }
}

