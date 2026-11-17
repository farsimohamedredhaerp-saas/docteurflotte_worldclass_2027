import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  AssetTransferChecklist,
  CreateAssetTransferChecklistDto,
} from '@docteurflotte/contracts';

interface TransferChecklistRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  from_site_id: string | null;
  to_site_id: string;
  transfer_date: string;
  transferred_by: string;
  received_by: string | null;
  meter_hours_departure: string | number;
  meter_hours_arrival: string | number | null;
  general_state: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR';
  accessories_checked: Record<string, boolean>;
  photos_urls: string[];
  signature_departure_svg: string | null;
  signature_arrival_svg: string | null;
  requires_immediate_work_order: boolean;
  generated_work_order_id: string | null;
  created_at: string;
}

@Injectable()
export class TransferChecklistService {
  constructor(private readonly db: DatabaseService) {}

  async createDepartureChecklist(
    tenantId: string,
    dto: CreateAssetTransferChecklistDto,
  ): Promise<AssetTransferChecklist> {
    if (!dto.assetId) {
      throw new BadRequestException('assetId est obligatoire pour initier un transfert.');
    }
    if (!dto.toSiteId) {
      throw new BadRequestException('Le chantier de destination (toSiteId) est obligatoire.');
    }
    if (dto.meterHoursDeparture === undefined || dto.meterHoursDeparture < 0) {
      throw new BadRequestException('Le relevé d’heures moteur au départ est obligatoire.');
    }

    // 1. Vérification Asset Racine
    const assetRes = await this.db.query(
      `SELECT id, code, name, status, tenant_id FROM assets WHERE id = $1`,
      [dto.assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${dto.assetId}`);
    }
    if (assetRes.rows[0].tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : actif non autorisé.");
    }
    if (assetRes.rows[0].status === 'DECOMMISSIONED') {
      throw new BadRequestException('Impossible de transférer un actif décommissionné.');
    }

    // 2. Vérification Chantier Destination
    const siteRes = await this.db.query(
      `SELECT id, name FROM site_workspaces WHERE id = $1 AND tenant_id = $2`,
      [dto.toSiteId, tenantId],
    );
    if (siteRes.rows.length === 0) {
      throw new NotFoundException(`Chantier de destination introuvable: ${dto.toSiteId}`);
    }

    // 3. Déclenchement automatique d'un Ordre de Travail si nécessaire
    let generatedWorkOrderId: string | null = null;
    if (dto.requiresImmediateWorkOrder || dto.generalState === 'REQUIRES_REPAIR') {
      try {
        const woRes = await this.db.query<{ id: string }>(
          `INSERT INTO work_orders (
            tenant_id, asset_id, title, description, priority, status
          ) VALUES ($1, $2, $3, $4, 'HIGH', 'OPEN') RETURNING id`,
          [
            tenantId,
            dto.assetId,
            `Réparation immédiate suite transfert inter-chantiers (${assetRes.rows[0].code})`,
            `Checklist de transfert : état constaté '${dto.generalState}'. Transféré par: ${dto.transferredBy}.`,
          ],
        );
        if (woRes.rows.length > 0) {
          generatedWorkOrderId = woRes.rows[0].id;
        }
      } catch (err) {
        console.error('[TransferChecklist] Erreur lors de la création auto du work_order:', err);
      }
    }

    // 4. Insertion de la checklist
    const insertSql = `
      INSERT INTO asset_transfer_checklists (
        tenant_id, asset_id, from_site_id, to_site_id, transfer_date, transferred_by,
        meter_hours_departure, general_state, accessories_checked, photos_urls,
        signature_departure_svg, requires_immediate_work_order, generated_work_order_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.assetId,
      dto.fromSiteId || null,
      dto.toSiteId,
      dto.transferDate || new Date().toISOString(),
      dto.transferredBy,
      dto.meterHoursDeparture,
      dto.generalState || 'GOOD',
      JSON.stringify(dto.accessoriesChecked || {}),
      JSON.stringify(dto.photosUrls || []),
      dto.signatureDepartureSvg || null,
      Boolean(dto.requiresImmediateWorkOrder || dto.generalState === 'REQUIRES_REPAIR'),
      generatedWorkOrderId,
    ];

    const res = await this.db.query<TransferChecklistRow>(insertSql, params);

    // 5. Clôture de l'ancienne affectation active si présente
    if (dto.fromSiteId) {
      await this.db.query(
        `UPDATE asset_site_assignments
         SET status = 'TRANSFERRED', actual_end_date = NOW(), end_meter_hours = $1, updated_at = NOW()
         WHERE tenant_id = $2 AND asset_id = $3 AND site_id = $4 AND status = 'ACTIVE'`,
        [dto.meterHoursDeparture, tenantId, dto.assetId, dto.fromSiteId],
      );
    }

    return this.mapRow(res.rows[0]);
  }

  async completeArrivalChecklist(
    tenantId: string,
    checklistId: string,
    data: {
      receivedBy: string;
      meterHoursArrival: number;
      signatureArrivalSvg?: string;
    },
  ): Promise<AssetTransferChecklist> {
    const existing = await this.db.query<TransferChecklistRow>(
      `SELECT * FROM asset_transfer_checklists WHERE tenant_id = $1 AND id = $2`,
      [tenantId, checklistId],
    );
    if (existing.rows.length === 0) {
      throw new NotFoundException(`Checklist introuvable: ${checklistId}`);
    }
    const current = existing.rows[0];

    if (data.meterHoursArrival < Number(current.meter_hours_departure)) {
      throw new BadRequestException('Le compteur horaire à l’arrivée ne peut être inférieur au compteur au départ.');
    }

    const updateSql = `
      UPDATE asset_transfer_checklists
      SET received_by = $1, meter_hours_arrival = $2, signature_arrival_svg = COALESCE($3, signature_arrival_svg)
      WHERE tenant_id = $4 AND id = $5
      RETURNING *
    `;
    const res = await this.db.query<TransferChecklistRow>(updateSql, [
      data.receivedBy,
      data.meterHoursArrival,
      data.signatureArrivalSvg || null,
      tenantId,
      checklistId,
    ]);

    // Création automatique de la nouvelle affectation sur le site de destination
    await this.db.query(
      `INSERT INTO asset_site_assignments (
        tenant_id, asset_id, site_id, start_date, start_meter_hours, status
      ) VALUES ($1, $2, $3, NOW(), $4, 'ACTIVE')`,
      [tenantId, current.asset_id, current.to_site_id, data.meterHoursArrival],
    );

    return this.mapRow(res.rows[0]);
  }

  async listChecklists(
    tenantId: string,
    params?: { assetId?: string; siteId?: string },
  ): Promise<AssetTransferChecklist[]> {
    let sql = `
      SELECT * FROM asset_transfer_checklists
      WHERE tenant_id = $1
    `;
    const queryParams: string[] = [tenantId];
    let idx = 2;

    if (params?.assetId) {
      sql += ` AND asset_id = $${idx++}`;
      queryParams.push(params.assetId);
    }
    if (params?.siteId) {
      sql += ` AND (from_site_id = $${idx} OR to_site_id = $${idx})`;
      queryParams.push(params.siteId);
      idx++;
    }

    sql += ` ORDER BY transfer_date DESC`;

    const res = await this.db.query<TransferChecklistRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: TransferChecklistRow): AssetTransferChecklist {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      assetId: r.asset_id,
      fromSiteId: r.from_site_id || undefined,
      toSiteId: r.to_site_id,
      transferDate: r.transfer_date,
      transferredBy: r.transferred_by,
      receivedBy: r.received_by || undefined,
      meterHoursDeparture: Number(r.meter_hours_departure),
      meterHoursArrival: r.meter_hours_arrival !== null ? Number(r.meter_hours_arrival) : undefined,
      generalState: r.general_state,
      accessoriesChecked: typeof r.accessories_checked === 'string'
        ? JSON.parse(r.accessories_checked)
        : (r.accessories_checked || {}),
      photosUrls: typeof r.photos_urls === 'string'
        ? JSON.parse(r.photos_urls)
        : (r.photos_urls || []),
      signatureDepartureSvg: r.signature_departure_svg || undefined,
      signatureArrivalSvg: r.signature_arrival_svg || undefined,
      requiresImmediateWorkOrder: r.requires_immediate_work_order,
      generatedWorkOrderId: r.generated_work_order_id || undefined,
      createdAt: r.created_at,
    };
  }
}

