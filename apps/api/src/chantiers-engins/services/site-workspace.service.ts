import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  SiteWorkspace,
  CreateSiteWorkspaceDto,
  SiteStatus,
  RecordSiteSituationDto,
  FiscalDocument,
  FiscalEvent,
} from '@docteurflotte/contracts';
import { OperationalFiscalBridgeService } from '../../fiscal-compliance/services/operational-fiscal-bridge.service';

interface SiteWorkspaceRow {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  wilaya_code: number;
  location_details: string | null;
  client_name: string | null;
  manager_name: string | null;
  start_date: string;
  target_end_date: string | null;
  actual_end_date: string | null;
  status: SiteStatus;
  budget_allocated_dzd: string | number;
  total_expenses_dzd: string | number;
  total_revenue_dzd: string | number;
  active_assets_count?: string | number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class SiteWorkspaceService {
  private readonly logger = new Logger(SiteWorkspaceService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly fiscalBridge?: OperationalFiscalBridgeService,
  ) {}

  async listSites(tenantId: string, status?: SiteStatus): Promise<SiteWorkspace[]> {
    let sql = `
      SELECT s.*,
        (SELECT COUNT(*)::int FROM asset_site_assignments a 
         WHERE a.site_id = s.id AND a.status = 'ACTIVE') as active_assets_count
      FROM site_workspaces s
      WHERE s.tenant_id = $1
    `;
    const params: (string | number)[] = [tenantId];

    if (status) {
      params.push(status);
      sql += ` AND s.status = $2`;
    }

    sql += ` ORDER BY s.created_at DESC`;

    const res = await this.db.query<SiteWorkspaceRow>(sql, params);
    return res.rows.map((r) => this.mapRowToWorkspace(r));
  }

  async getSiteById(tenantId: string, siteId: string): Promise<SiteWorkspace> {
    const sql = `
      SELECT s.*,
        (SELECT COUNT(*)::int FROM asset_site_assignments a 
         WHERE a.site_id = s.id AND a.status = 'ACTIVE') as active_assets_count
      FROM site_workspaces s
      WHERE s.tenant_id = $1 AND s.id = $2
    `;
    const res = await this.db.query<SiteWorkspaceRow>(sql, [tenantId, siteId]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${siteId}`);
    }
    return this.mapRowToWorkspace(res.rows[0]);
  }

  async createSite(tenantId: string, dto: CreateSiteWorkspaceDto): Promise<SiteWorkspace> {
    if (!dto.wilayaCode || dto.wilayaCode < 1 || dto.wilayaCode > 58) {
      throw new BadRequestException('Le code Wilaya doit être compris entre 1 et 58 (Nomenclature Algérie)');
    }
    if (!dto.code || !dto.name) {
      throw new BadRequestException('Le code et le nom du chantier sont obligatoires');
    }

    const checkSql = `SELECT id FROM site_workspaces WHERE tenant_id = $1 AND code = $2`;
    const checkRes = await this.db.query(checkSql, [tenantId, dto.code]);
    if (checkRes.rows.length > 0) {
      throw new BadRequestException(`Un chantier avec le code '${dto.code}' existe déjà.`);
    }

    const insertSql = `
      INSERT INTO site_workspaces (
        tenant_id, code, name, wilaya_code, location_details, client_name, manager_name,
        start_date, target_end_date, budget_allocated_dzd, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.code,
      dto.name,
      dto.wilayaCode,
      dto.locationDetails || null,
      dto.clientName || null,
      dto.managerName || null,
      dto.startDate,
      dto.targetEndDate || null,
      dto.budgetAllocatedDzd || 0,
    ];

    const res = await this.db.query<SiteWorkspaceRow>(insertSql, params);
    return this.mapRowToWorkspace(res.rows[0]);
  }

  async updateSiteStatus(tenantId: string, siteId: string, status: SiteStatus): Promise<SiteWorkspace> {
    const sql = `
      UPDATE site_workspaces
      SET status = $1, updated_at = NOW(),
          actual_end_date = CASE WHEN $1 IN ('COMPLETED', 'CLOSED') THEN CURRENT_DATE ELSE actual_end_date END
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `;
    const res = await this.db.query<SiteWorkspaceRow>(sql, [status, tenantId, siteId]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${siteId}`);
    }
    return this.mapRowToWorkspace(res.rows[0]);
  }

  async recordSiteSituation(
    tenantId: string,
    dto: RecordSiteSituationDto,
  ): Promise<{
    fiscalDocument?: FiscalDocument;
    fiscalEvent?: FiscalEvent;
    updatedSite: SiteWorkspace;
  }> {
    if (!dto.situationNumber) {
      throw new BadRequestException('Le numéro de situation de travaux est obligatoire.');
    }
    if (dto.amountHtDzd === undefined || dto.amountHtDzd <= 0) {
      throw new BadRequestException('Le montant HT de la situation de travaux doit être strictement positif.');
    }

    if (this.fiscalBridge) {
      return this.fiscalBridge.bridgeSiteSituation(tenantId, dto);
    }

    // Fallback direct si le pont fiscal n'est pas injecté
    const updateRes = await this.db.query<SiteWorkspaceRow>(
      `UPDATE site_workspaces
       SET total_revenue_dzd = total_revenue_dzd + $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [dto.amountHtDzd, dto.siteId, tenantId],
    );

    if (updateRes.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${dto.siteId}`);
    }

    return { updatedSite: this.mapRowToWorkspace(updateRes.rows[0]) };
  }

  private mapRowToWorkspace(r: SiteWorkspaceRow): SiteWorkspace {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      code: r.code,
      name: r.name,
      wilayaCode: Number(r.wilaya_code),
      locationDetails: r.location_details || undefined,
      clientName: r.client_name || undefined,
      managerName: r.manager_name || undefined,
      startDate: r.start_date,
      targetEndDate: r.target_end_date || undefined,
      actualEndDate: r.actual_end_date || undefined,
      status: r.status,
      budgetAllocatedDzd: Number(r.budget_allocated_dzd),
      totalExpensesDzd: Number(r.total_expenses_dzd),
      totalRevenueDzd: Number(r.total_revenue_dzd),
      activeAssetsCount: Number(r.active_assets_count || 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

