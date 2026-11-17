import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SiteProfitabilitySummary } from '@docteurflotte/contracts';

@Injectable()
export class SiteProfitabilityService {
  constructor(private readonly db: DatabaseService) { }

  async getSiteProfitability(tenantId: string, siteId: string): Promise<SiteProfitabilitySummary> {
    // 1. Chantier
    const siteRes = await this.db.query<{
      id: string;
      code: string;
      name: string;
      wilaya_code: number;
      start_date: string;
      actual_end_date: string | null;
      total_revenue_dzd: string | number;
    }>(
      `SELECT id, code, name, wilaya_code, start_date, actual_end_date, total_revenue_dzd
       FROM site_workspaces
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, siteId],
    );

    if (siteRes.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${siteId}`);
    }
    const site = siteRes.rows[0];

    // Durée en jours
    const start = new Date(site.start_date).getTime();
    const end = site.actual_end_date ? new Date(site.actual_end_date).getTime() : Date.now();
    const durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    // 2. Coût de refacturation interne des actifs (Internal Asset Billing)
    const assignRes = await this.db.query<{
      asset_id: string;
      internal_daily_rate_dzd: string | number;
      start_date: string;
      actual_end_date: string | null;
    }>(
      `SELECT asset_id, internal_daily_rate_dzd, start_date, actual_end_date
       FROM asset_site_assignments
       WHERE tenant_id = $1 AND site_id = $2`,
      [tenantId, siteId],
    );

    let internalAssetBillingDzd = 0;
    assignRes.rows.forEach((a) => {
      const aStart = new Date(a.start_date).getTime();
      const aEnd = a.actual_end_date ? new Date(a.actual_end_date).getTime() : Date.now();
      const aDays = Math.max(1, Math.round((aEnd - aStart) / (1000 * 60 * 60 * 24)));
      internalAssetBillingDzd += aDays * Number(a.internal_daily_rate_dzd);
    });

    // 3. Coût de carburant & heures consommées
    const fuelRes = await this.db.query<{
      asset_id: string;
      asset_code: string;
      total_hours: string | number;
      total_fuel: string | number;
      total_cost: string | number;
    }>(
      `SELECT l.asset_id, a.code as asset_code,
              SUM(l.delta_hours_since_last) as total_hours,
              SUM(l.fuel_consumed_liters) as total_fuel,
              SUM(COALESCE(NULLIF(l.total_consumables_cost_dzd, 0), l.fuel_cost_dzd, 0)) as total_cost
       FROM asset_engine_hour_logs l
       JOIN assets a ON a.id = l.asset_id
       WHERE l.tenant_id = $1 AND l.site_id = $2
       GROUP BY l.asset_id, a.code`,
      [tenantId, siteId],
    );

    let fuelCostDzd = 0;
    const assignedAssetsSummary = fuelRes.rows.map((r) => {
      const cost = Number(r.total_cost || 0);
      fuelCostDzd += cost;
      return {
        assetId: r.asset_id,
        assetCode: r.asset_code,
        hoursRun: Number(r.total_hours || 0),
        fuelLiters: Number(r.total_fuel || 0),
        costDzd: cost,
      };
    });

    // 4. Coûts de maintenance (Ordres de travaux rattachés aux actifs de ce site)
    let maintenanceCostDzd = 0;
    const woRes = await this.db.query<{ total: string | number }>(
      `SELECT COALESCE(SUM(total_cost), 0) as total
       FROM work_orders
       WHERE tenant_id = $1 AND asset_id IN (
         SELECT asset_id FROM asset_site_assignments WHERE site_id = $2
       )`,
      [tenantId, siteId],
    );
    if (woRes.rows.length > 0) {
      maintenanceCostDzd = Number(woRes.rows[0].total || 0);
    }

    const laborCostDzd = 0; // inclus dans les OTs
    const totalDirectCostDzd = Number((internalAssetBillingDzd + fuelCostDzd + maintenanceCostDzd + laborCostDzd).toFixed(2));
    const billedRevenueDzd = Number(site.total_revenue_dzd || 0);
    const grossMarginDzd = Number((billedRevenueDzd - totalDirectCostDzd).toFixed(2));
    const grossMarginPct = billedRevenueDzd > 0 ? Number(((grossMarginDzd / billedRevenueDzd) * 100).toFixed(2)) : 0;

    return {
      siteId: site.id,
      siteCode: site.code,
      siteName: site.name,
      wilayaCode: Number(site.wilaya_code),
      durationDays,
      internalAssetBillingDzd: Number(internalAssetBillingDzd.toFixed(2)),
      fuelCostDzd: Number(fuelCostDzd.toFixed(2)),
      maintenanceCostDzd: Number(maintenanceCostDzd.toFixed(2)),
      laborCostDzd,
      totalDirectCostDzd,
      billedRevenueDzd,
      grossMarginDzd,
      grossMarginPct,
      assignedAssetsSummary,
    };
  }
}

