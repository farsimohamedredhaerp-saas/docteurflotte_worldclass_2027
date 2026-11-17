import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AssetSiteAssignment, CreateAssetSiteAssignmentDto, AssignmentStatus } from '@docteurflotte/contracts';

interface AssignmentRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  asset_code?: string;
  asset_name?: string;
  site_id: string;
  site_name?: string;
  assigned_by_user_id: string | null;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  internal_daily_rate_dzd: string | number;
  start_meter_hours: string | number;
  end_meter_hours: string | number | null;
  status: AssignmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class AssetAssignmentService {
  constructor(private readonly db: DatabaseService) {}

  async assignAssetToSite(
    tenantId: string,
    dto: CreateAssetSiteAssignmentDto,
    assignedByUserId?: string,
  ): Promise<AssetSiteAssignment> {
    if (!dto.assetId) {
      throw new BadRequestException('assetId est obligatoire pour toute affectation opérationnelle.');
    }
    if (!dto.siteId) {
      throw new BadRequestException('siteId est obligatoire.');
    }

    // 1. Vérification Asset Racine existant et tenant hermétique
    const assetSql = `SELECT id, code, name, status, tenant_id FROM assets WHERE id = $1`;
    const assetRes = await this.db.query(assetSql, [dto.assetId]);
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${dto.assetId}`);
    }
    const asset = assetRes.rows[0];
    if (asset.tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : actif non autorisé.");
    }
    if (asset.status === 'DECOMMISSIONED') {
      throw new BadRequestException("Impossible d'affecter un actif décommissionné (retiré du parc).");
    }

    // 2. Vérification Chantier
    const siteSql = `SELECT id, name, status FROM site_workspaces WHERE id = $1 AND tenant_id = $2`;
    const siteRes = await this.db.query(siteSql, [dto.siteId, tenantId]);
    if (siteRes.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${dto.siteId}`);
    }
    if (siteRes.rows[0].status === 'CLOSED') {
      throw new BadRequestException("Impossible d'affecter un actif à un chantier clôturé.");
    }

    // 3. Vérification affectation active concurrente
    const activeSql = `
      SELECT id FROM asset_site_assignments 
      WHERE tenant_id = $1 AND asset_id = $2 AND status = 'ACTIVE'
    `;
    const activeRes = await this.db.query(activeSql, [tenantId, dto.assetId]);
    if (activeRes.rows.length > 0) {
      throw new BadRequestException("Cet actif est déjà activement affecté à un autre chantier. Effectuez un transfert ou une libération préalable.");
    }

    // 4. Insertion affectation
    const insertSql = `
      INSERT INTO asset_site_assignments (
        tenant_id, asset_id, site_id, assigned_by_user_id, start_date, expected_end_date,
        internal_daily_rate_dzd, start_meter_hours, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', $9)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.assetId,
      dto.siteId,
      assignedByUserId || null,
      dto.startDate || new Date().toISOString(),
      dto.expectedEndDate || null,
      dto.internalDailyRateDzd || 0,
      dto.startMeterHours || 0,
      dto.notes || null,
    ];

    const res = await this.db.query<AssignmentRow>(insertSql, params);
    const row = res.rows[0];
    row.asset_code = asset.code;
    row.asset_name = asset.name;
    row.site_name = siteRes.rows[0].name;

    return this.mapRow(row);
  }

  async listAssignments(tenantId: string, params?: { siteId?: string; assetId?: string; status?: AssignmentStatus }): Promise<AssetSiteAssignment[]> {
    let sql = `
      SELECT a.*, ass.code as asset_code, ass.name as asset_name, s.name as site_name
      FROM asset_site_assignments a
      JOIN assets ass ON ass.id = a.asset_id
      JOIN site_workspaces s ON s.id = a.site_id
      WHERE a.tenant_id = $1
    `;
    const queryParams: (string | number)[] = [tenantId];
    let idx = 2;

    if (params?.siteId) {
      sql += ` AND a.site_id = $${idx++}`;
      queryParams.push(params.siteId);
    }
    if (params?.assetId) {
      sql += ` AND a.asset_id = $${idx++}`;
      queryParams.push(params.assetId);
    }
    if (params?.status) {
      sql += ` AND a.status = $${idx++}`;
      queryParams.push(params.status);
    }

    sql += ` ORDER BY a.start_date DESC`;

    const res = await this.db.query<AssignmentRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  async endAssignment(
    tenantId: string,
    assignmentId: string,
    endMeterHours: number,
    notes?: string,
  ): Promise<AssetSiteAssignment> {
    const existing = await this.db.query<AssignmentRow>(
      `SELECT * FROM asset_site_assignments WHERE tenant_id = $1 AND id = $2`,
      [tenantId, assignmentId],
    );
    if (existing.rows.length === 0) {
      throw new NotFoundException(`Affectation introuvable: ${assignmentId}`);
    }
    const current = existing.rows[0];
    if (endMeterHours < Number(current.start_meter_hours)) {
      throw new BadRequestException('Le compteur horaire final ne peut pas être inférieur au compteur initial de début d’affectation.');
    }

    const updateSql = `
      UPDATE asset_site_assignments
      SET status = 'RETURNED', actual_end_date = NOW(), end_meter_hours = $1,
          notes = COALESCE($2, notes), updated_at = NOW()
      WHERE tenant_id = $3 AND id = $4
      RETURNING *
    `;
    const res = await this.db.query<AssignmentRow>(updateSql, [endMeterHours, notes || null, tenantId, assignmentId]);
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: AssignmentRow): AssetSiteAssignment {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      assetId: r.asset_id,
      assetCode: r.asset_code,
      assetName: r.asset_name,
      siteId: r.site_id,
      siteName: r.site_name,
      assignedByUserId: r.assigned_by_user_id || '',
      startDate: r.start_date,
      expectedEndDate: r.expected_end_date || undefined,
      actualEndDate: r.actual_end_date || undefined,
      internalDailyRateDzd: Number(r.internal_daily_rate_dzd),
      startMeterHours: Number(r.start_meter_hours),
      endMeterHours: r.end_meter_hours !== null ? Number(r.end_meter_hours) : undefined,
      status: r.status,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

