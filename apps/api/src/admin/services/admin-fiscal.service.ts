import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  PlatformFiscalFuelPrice,
  PlatformRegulatoryEnactaRule,
  PlatformVignetteTarif,
  UpdatePlatformRegulatoryEnactaRuleDto,
} from '@docteurflotte/contracts';

@Injectable()
export class AdminFiscalService {
  private readonly logger = new Logger(AdminFiscalService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getFuelPrices(): Promise<PlatformFiscalFuelPrice[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT * 
      FROM platform_fiscal_fuel_prices 
      ORDER BY fuel_type, effective_date DESC
    `);

    return res.rows.map((r) => ({
      ...r,
      price_per_liter_dzd: Number(r.price_per_liter_dzd),
      tva_rate_pct: Number(r.tva_rate_pct),
    }));
  }

  async updateFuelPrice(
    id: string,
    dto: Partial<PlatformFiscalFuelPrice>,
    actorEmail: string
  ): Promise<PlatformFiscalFuelPrice> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `UPDATE platform_fiscal_fuel_prices
       SET price_per_liter_dzd = COALESCE($1, price_per_liter_dzd),
           tva_rate_pct = COALESCE($2, tva_rate_pct),
           is_tva_deductible = COALESCE($3, is_tva_deductible),
           official_reference_joradp = COALESCE($4, official_reference_joradp),
           is_active = COALESCE($5, is_active),
           author_email = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        dto.price_per_liter_dzd,
        dto.tva_rate_pct,
        dto.is_tva_deductible,
        dto.official_reference_joradp,
        dto.is_active,
        actorEmail,
        id,
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO platform_audit_logs (actor_email, action, target_entity, target_id, after_state, notes)
       VALUES ($1, 'UPDATE_FUEL_PRICE', 'platform_fiscal_fuel_prices', $2, $3, $4)`,
      [
        actorEmail,
        id,
        JSON.stringify(res.rows[0]),
        `Mise à jour du tarif de carburant ${res.rows[0]?.fuel_type}`,
      ]
    );

    return {
      ...res.rows[0],
      price_per_liter_dzd: Number(res.rows[0].price_per_liter_dzd),
      tva_rate_pct: Number(res.rows[0].tva_rate_pct),
    };
  }

  async getVignettes(): Promise<PlatformVignetteTarif[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT * 
      FROM platform_vignette_tarifs 
      ORDER BY finance_law_year DESC, vehicle_category, power_cv_min
    `);

    return res.rows.map((r) => ({
      ...r,
      amount_dzd: Number(r.amount_dzd),
    }));
  }

  async getEnactaRules(): Promise<PlatformRegulatoryEnactaRule[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT * 
      FROM platform_regulatory_enacta_rules 
      ORDER BY asset_category
    `);

    return res.rows.map((r) => ({
      ...r,
      periodicity_months: Number(r.periodicity_months),
      first_inspection_months: Number(r.first_inspection_months),
      tariff_base_ht_dzd: r.tariff_base_ht_dzd != null ? Number(r.tariff_base_ht_dzd) : 2450.0,
      tva_rate_pct: r.tva_rate_pct != null ? Number(r.tva_rate_pct) : 19.0,
      tariff_total_ttc_dzd: r.tariff_total_ttc_dzd != null ? Number(r.tariff_total_ttc_dzd) : 2915.5,
      internal_tco_provision_dzd: r.internal_tco_provision_dzd != null ? Number(r.internal_tco_provision_dzd) : 8500.0,
    }));
  }

  async updateEnactaRule(
    id: string,
    dto: UpdatePlatformRegulatoryEnactaRuleDto,
    actorEmail: string
  ): Promise<PlatformRegulatoryEnactaRule> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const calculatedTtc =
      dto.tariff_total_ttc_dzd ??
      (dto.tariff_base_ht_dzd != null && dto.tva_rate_pct != null
        ? Number((dto.tariff_base_ht_dzd * (1 + dto.tva_rate_pct / 100)).toFixed(2))
        : undefined);

    const res = await pool.query(
      `UPDATE platform_regulatory_enacta_rules
       SET tariff_base_ht_dzd = COALESCE($1, tariff_base_ht_dzd),
           tva_rate_pct = COALESCE($2, tva_rate_pct),
           tariff_total_ttc_dzd = COALESCE($3, tariff_total_ttc_dzd),
           internal_tco_provision_dzd = COALESCE($4, internal_tco_provision_dzd),
           periodicity_months = COALESCE($5, periodicity_months),
           first_inspection_months = COALESCE($6, first_inspection_months),
           official_decree_ref = COALESCE($7, official_decree_ref),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        dto.tariff_base_ht_dzd,
        dto.tva_rate_pct,
        calculatedTtc,
        dto.internal_tco_provision_dzd,
        dto.periodicity_months,
        dto.first_inspection_months,
        dto.official_decree_ref,
        id,
      ]
    );

    if (res.rowCount === 0) {
      throw new Error(`Règle ENACTA ${id} introuvable.`);
    }

    // Piste d'audit SuperAdmin immuable
    await pool.query(
      `INSERT INTO platform_audit_logs (actor_email, action, target_entity, target_id, after_state, notes)
       VALUES ($1, 'UPDATE_ENACTA_RULE', 'platform_regulatory_enacta_rules', $2, $3, $4)`,
      [
        actorEmail,
        id,
        JSON.stringify(res.rows[0]),
        dto.justification || `Mise à jour du barème ENACTA pour la catégorie ${res.rows[0]?.asset_category}`,
      ]
    );

    const row = res.rows[0];
    return {
      ...row,
      periodicity_months: Number(row.periodicity_months),
      first_inspection_months: Number(row.first_inspection_months),
      tariff_base_ht_dzd: Number(row.tariff_base_ht_dzd),
      tva_rate_pct: Number(row.tva_rate_pct),
      tariff_total_ttc_dzd: Number(row.tariff_total_ttc_dzd),
      internal_tco_provision_dzd: Number(row.internal_tco_provision_dzd),
    };
  }
}
