import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  PlatformFiscalFuelPrice,
  PlatformRegulatoryEnactaRule,
  PlatformVignetteTarif,
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

    return res.rows;
  }
}
