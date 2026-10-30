import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PlatformOverviewKpis, PlatformTenant } from '@docteurflotte/contracts';

@Injectable()
export class AdminTenantsService {
  private readonly logger = new Logger(AdminTenantsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getPlatformOverview(): Promise<PlatformOverviewKpis> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const [tenantsRes, vehiclesRes, usersRes, pubRes, fuelRes, gatewaysRes, auditRes] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE status = 'TRIAL') as trial
        FROM platform_tenants
      `),
      pool.query(`SELECT COUNT(*) as total FROM assets`),
      pool.query(`SELECT COUNT(*) as total FROM users`),
      pool.query(`
        SELECT version, scope_key 
        FROM platform_config_publications 
        WHERE effective_to IS NULL 
        ORDER BY effective_from DESC 
        LIMIT 1
      `),
      pool.query(`SELECT COUNT(*) as total FROM platform_fiscal_fuel_prices WHERE is_active = true`),
      pool.query(`SELECT COUNT(*) as total FROM platform_telematics_gateways WHERE health_status = 'HEALTHY'`),
      pool.query(`SELECT action, created_at FROM platform_audit_logs ORDER BY created_at DESC LIMIT 1`),
    ]);

    const t = tenantsRes.rows[0];
    const pub = pubRes.rows[0] || { version: 'v2.0-PROD-BASELINE', scope_key: 'ALGERIA_CORE_DECISION' };
    const audit = auditRes.rows[0];

    return {
      totalTenants: parseInt(t.total, 10) || 0,
      activeTenants: parseInt(t.active, 10) || 0,
      trialTenants: parseInt(t.trial, 10) || 0,
      totalVehicles: parseInt(vehiclesRes.rows[0]?.total, 10) || 0,
      totalUsers: parseInt(usersRes.rows[0]?.total, 10) || 0,
      activeDecisionConfigVersion: pub.version,
      activeDecisionScope: pub.scope_key,
      fuelPricesCount: parseInt(fuelRes.rows[0]?.total, 10) || 0,
      healthyGatewaysCount: parseInt(gatewaysRes.rows[0]?.total, 10) || 0,
      lastAuditAction: audit?.action,
      lastAuditTimestamp: audit?.created_at,
    };
  }

  async getTenants(): Promise<PlatformTenant[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT 
        pt.*,
        COALESCE(v.cnt, 0)::int as actual_vehicles,
        COALESCE(u.cnt, 0)::int as actual_users
      FROM platform_tenants pt
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) as cnt FROM assets GROUP BY tenant_id
      ) v ON v.tenant_id = pt.id
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) as cnt FROM users GROUP BY tenant_id
      ) u ON u.tenant_id = pt.id
      ORDER BY pt.created_at DESC
    `);

    return res.rows.map((r) => ({
      ...r,
      max_vehicles: Number(r.max_vehicles),
      max_devices: Number(r.max_devices),
      max_users: Number(r.max_users),
      max_api_rate_per_min: Number(r.max_api_rate_per_min),
    }));
  }

  async getTenantById(id: string): Promise<PlatformTenant> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `SELECT * FROM platform_tenants WHERE id = $1`,
      [id]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException(`Tenant introuvable : ${id}`);
    }

    return res.rows[0];
  }

  async updateTenant(
    id: string,
    dto: Partial<PlatformTenant>,
    actorEmail: string
  ): Promise<PlatformTenant> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const existing = await this.getTenantById(id);

    const res = await pool.query(
      `UPDATE platform_tenants
       SET plan_tier = COALESCE($1, plan_tier),
           status = COALESCE($2, status),
           max_vehicles = COALESCE($3, max_vehicles),
           max_devices = COALESCE($4, max_devices),
           max_users = COALESCE($5, max_users),
           max_api_rate_per_min = COALESCE($6, max_api_rate_per_min),
           notes = COALESCE($7, notes),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        dto.plan_tier,
        dto.status,
        dto.max_vehicles,
        dto.max_devices,
        dto.max_users,
        dto.max_api_rate_per_min,
        dto.notes,
        id,
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO platform_audit_logs (actor_email, action, target_entity, target_id, before_state, after_state, notes)
       VALUES ($1, 'UPDATE_TENANT', 'platform_tenants', $2, $3, $4, $5)`,
      [
        actorEmail,
        id,
        JSON.stringify(existing),
        JSON.stringify(res.rows[0]),
        `Mise à jour du tenant ${existing.slug}`,
      ]
    );

    return res.rows[0];
  }
}
