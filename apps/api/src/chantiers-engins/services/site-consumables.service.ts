import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  ConsumableType,
  SiteConsumableTank,
  CreateSiteConsumableTankDto,
  SiteConsumableDelivery,
  RecordSiteConsumableDeliveryDto,
} from '@docteurflotte/contracts';
import * as crypto from 'crypto';

interface TankRow {
  id: string;
  tenant_id: string;
  site_id: string;
  tank_code: string;
  name: string;
  consumable_type: ConsumableType;
  capacity_liters: string | number;
  current_level_liters: string | number;
  alert_low_level_pct: string | number;
  unit_cost_ref_dzd: string | number;
  last_delivery_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DeliveryRow {
  id: string;
  tenant_id: string;
  site_id: string;
  tank_id: string | null;
  delivery_note_ref: string;
  delivery_date: string;
  supplier_name: string;
  supplier_nif: string | null;
  consumable_type: ConsumableType;
  volume_liters: string | number;
  density: string | number | null;
  unit_price_ht_dzd: string | number;
  total_ht_dzd: string | number;
  vat_rate_pct: string | number;
  vat_amount_dzd: string | number;
  total_ttc_dzd: string | number;
  sha256_proof: string;
  created_at: string;
}

@Injectable()
export class SiteConsumablesService {
  private readonly logger = new Logger(SiteConsumablesService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Crée ou configure une cuve / citerne / stock de fluides de chantier
   */
  async createTank(tenantId: string, dto: CreateSiteConsumableTankDto): Promise<SiteConsumableTank> {
    if (!dto.siteId || !dto.tankCode || !dto.name || !dto.consumableType || !dto.capacityLiters) {
      throw new BadRequestException('Paramètres obligatoires manquants pour la création de cuve.');
    }

    // Vérifier l'existence du chantier
    const siteRes = await this.db.query(
      `SELECT id FROM site_workspaces WHERE id = $1 AND tenant_id = $2`,
      [dto.siteId, tenantId],
    );
    if (siteRes.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${dto.siteId}`);
    }

    const currentLevel = dto.currentLevelLiters ?? 0;
    const alertPct = dto.alertLowLevelPct ?? 15.0;
    const unitCost = dto.unitCostRefDzd ?? (dto.consumableType === ConsumableType.GASOIL ? 29.01 : 350.0);

    const insertSql = `
      INSERT INTO site_consumable_tanks (
        tenant_id, site_id, tank_code, name, consumable_type,
        capacity_liters, current_level_liters, alert_low_level_pct, unit_cost_ref_dzd
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const res = await this.db.query<TankRow>(insertSql, [
      tenantId,
      dto.siteId,
      dto.tankCode.trim().toUpperCase(),
      dto.name.trim(),
      dto.consumableType,
      dto.capacityLiters,
      currentLevel,
      alertPct,
      unitCost,
    ]);

    return this.mapTankRow(res.rows[0]);
  }

  /**
   * Liste les cuves et stocks de fluides d'un tenant / chantier
   */
  async listTanks(tenantId: string, siteId?: string): Promise<SiteConsumableTank[]> {
    let sql = `SELECT * FROM site_consumable_tanks WHERE tenant_id = $1`;
    const params: string[] = [tenantId];

    if (siteId) {
      sql += ` AND site_id = $2`;
      params.push(siteId);
    }
    sql += ` ORDER BY tank_code ASC`;

    const res = await this.db.query<TankRow>(sql, params);
    return res.rows.map((r) => this.mapTankRow(r));
  }

  /**
   * Enregistre un bon de livraison (BL Naftal ou distributeur) et met à jour le niveau de la cuve
   */
  async recordDelivery(
    tenantId: string,
    dto: RecordSiteConsumableDeliveryDto,
  ): Promise<SiteConsumableDelivery> {
    if (!dto.siteId || !dto.deliveryNoteRef || !dto.consumableType || !dto.volumeLiters || dto.volumeLiters <= 0) {
      throw new BadRequestException('Paramètres de livraison de fluide invalides.');
    }

    const unitPriceHt = dto.unitPriceHtDzd;
    const vatRate = dto.vatRatePct ?? 19.0;
    const totalHt = Number((dto.volumeLiters * unitPriceHt).toFixed(2));
    const vatAmount = Number(((totalHt * vatRate) / 100).toFixed(2));
    const totalTtc = Number((totalHt + vatAmount).toFixed(2));

    // Calcul du scellé d'intégrité SHA-256
    const payload = `${tenantId}:${dto.siteId}:${dto.deliveryNoteRef}:${dto.consumableType}:${dto.volumeLiters}:${totalTtc}`;
    const sha256Proof = crypto.createHash('sha256').update(payload).digest('hex');

    const insertSql = `
      INSERT INTO site_consumable_deliveries (
        tenant_id, site_id, tank_id, delivery_note_ref, delivery_date,
        supplier_name, supplier_nif, consumable_type, volume_liters, density,
        unit_price_ht_dzd, total_ht_dzd, vat_rate_pct, vat_amount_dzd, total_ttc_dzd, sha256_proof
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const delRes = await this.db.query<DeliveryRow>(insertSql, [
      tenantId,
      dto.siteId,
      dto.tankId || null,
      dto.deliveryNoteRef.trim(),
      dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
      dto.supplierName || 'NAFTAL',
      dto.supplierNif || null,
      dto.consumableType,
      dto.volumeLiters,
      dto.density || null,
      unitPriceHt,
      totalHt,
      vatRate,
      vatAmount,
      totalTtc,
      sha256Proof,
    ]);

    // Mettre à jour le stock de la cuve si spécifiée
    if (dto.tankId) {
      await this.db.query(
        `UPDATE site_consumable_tanks
         SET current_level_liters = LEAST(capacity_liters, current_level_liters + $1),
             unit_cost_ref_dzd = $2,
             last_delivery_date = NOW(),
             updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4`,
        [dto.volumeLiters, unitPriceHt, dto.tankId, tenantId],
      );
    }

    return this.mapDeliveryRow(delRes.rows[0]);
  }

  /**
   * Liste les réceptions de fluides d'un chantier
   */
  async listDeliveries(tenantId: string, siteId?: string): Promise<SiteConsumableDelivery[]> {
    let sql = `SELECT * FROM site_consumable_deliveries WHERE tenant_id = $1`;
    const params: string[] = [tenantId];

    if (siteId) {
      sql += ` AND site_id = $2`;
      params.push(siteId);
    }
    sql += ` ORDER BY delivery_date DESC, created_at DESC`;

    const res = await this.db.query<DeliveryRow>(sql, params);
    return res.rows.map((r) => this.mapDeliveryRow(r));
  }

  private mapTankRow(r: TankRow): SiteConsumableTank {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      siteId: r.site_id,
      tankCode: r.tank_code,
      name: r.name,
      consumableType: r.consumable_type,
      capacityLiters: Number(r.capacity_liters),
      currentLevelLiters: Number(r.current_level_liters),
      alertLowLevelPct: Number(r.alert_low_level_pct),
      unitCostRefDzd: Number(r.unit_cost_ref_dzd),
      lastDeliveryDate: r.last_delivery_date || undefined,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private mapDeliveryRow(r: DeliveryRow): SiteConsumableDelivery {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      siteId: r.site_id,
      tankId: r.tank_id || undefined,
      deliveryNoteRef: r.delivery_note_ref,
      deliveryDate: r.delivery_date,
      supplierName: r.supplier_name,
      supplierNif: r.supplier_nif || undefined,
      consumableType: r.consumable_type,
      volumeLiters: Number(r.volume_liters),
      density: r.density !== null ? Number(r.density) : undefined,
      unitPriceHtDzd: Number(r.unit_price_ht_dzd),
      totalHtDzd: Number(r.total_ht_dzd),
      vatRatePct: Number(r.vat_rate_pct),
      vatAmountDzd: Number(r.vat_amount_dzd),
      totalTtcDzd: Number(r.total_ttc_dzd),
      sha256Proof: r.sha256_proof,
      createdAt: r.created_at,
    };
  }
}

