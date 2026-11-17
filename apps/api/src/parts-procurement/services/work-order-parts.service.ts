import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  WorkOrderPartConsumption,
  RecordWorkOrderPartConsumptionDto,
} from '@docteurflotte/contracts';

interface ConsumptionRow {
  id: string;
  tenant_id: string;
  work_order_id: string;
  asset_id: string;
  part_id: string;
  warehouse_id: string;
  quantity_consumed: string | number;
  unit_cost_applied_dzd: string | number;
  total_cost_dzd: string | number;
  consumed_at: string;
  consumed_by_user_id: string;
}

@Injectable()
export class WorkOrderPartsService {
  constructor(private readonly db: DatabaseService) {}

  async recordPartsConsumption(
    tenantId: string,
    userId: string,
    dto: RecordWorkOrderPartConsumptionDto,
  ): Promise<WorkOrderPartConsumption> {
    if (!dto.workOrderId || !dto.assetId || !dto.partId || !dto.warehouseId) {
      throw new BadRequestException('L’Ordre de Travail, l’Actif, la pièce et le magasin sont obligatoires.');
    }
    if (!dto.quantityConsumed || dto.quantityConsumed <= 0) {
      throw new BadRequestException('La quantité consommée doit être strictement supérieure à zéro.');
    }

    // 1. Vérification Asset Racine
    const assetRes = await this.db.query(
      `SELECT id, code, tenant_id FROM assets WHERE id = $1`,
      [dto.assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif racine introuvable: ${dto.assetId}`);
    }
    if (assetRes.rows[0].tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : actif non autorisé.");
    }

    // 2. Vérification Work Order
    const woRes = await this.db.query(
      `SELECT id, asset_id, tenant_id FROM work_orders WHERE id = $1`,
      [dto.workOrderId],
    );
    if (woRes.rows.length === 0) {
      throw new NotFoundException(`Ordre de travail introuvable: ${dto.workOrderId}`);
    }
    if (woRes.rows[0].tenant_id !== tenantId) {
      throw new BadRequestException("Violation d'étanchéité multi-tenant : OT non autorisé.");
    }

    // 3. Vérification disponibilité stock magasin
    const stockRes = await this.db.query(
      `SELECT quantity_on_hand, quantity_reserved FROM parts_stock_levels 
       WHERE tenant_id = $1 AND part_id = $2 AND warehouse_id = $3`,
      [tenantId, dto.partId, dto.warehouseId],
    );
    if (stockRes.rows.length === 0) {
      throw new BadRequestException('Cette pièce n’est pas référencée dans ce magasin.');
    }
    const currentOnHand = Number(stockRes.rows[0].quantity_on_hand);
    const currentReserved = Number(stockRes.rows[0].quantity_reserved);
    const currentAvailable = currentOnHand - currentReserved;

    if (currentAvailable < dto.quantityConsumed) {
      throw new BadRequestException(
        `Rupture de stock : ${dto.quantityConsumed} demandé(s), mais seulement ${currentAvailable} disponible(s) dans ce magasin.`,
      );
    }

    // 4. Récupération CMUP (Coût Moyen Unitaire Pondéré) de la pièce
    const partRes = await this.db.query(
      `SELECT average_weighted_cost_dzd FROM parts_inventory WHERE id = $1 AND tenant_id = $2`,
      [dto.partId, tenantId],
    );
    if (partRes.rows.length === 0) {
      throw new NotFoundException(`Pièce introuvable: ${dto.partId}`);
    }
    const unitCost = dto.unitCostAppliedDzd ?? Number(partRes.rows[0].average_weighted_cost_dzd);
    const totalCost = unitCost * dto.quantityConsumed;

    // 5. Décrémenter le stock magasin
    await this.db.query(
      `UPDATE parts_stock_levels 
       SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW()
       WHERE tenant_id = $2 AND part_id = $3 AND warehouse_id = $4`,
      [dto.quantityConsumed, tenantId, dto.partId, dto.warehouseId],
    );

    // 6. Décrémenter le total stock global de la pièce
    await this.db.query(
      `UPDATE parts_inventory
       SET total_quantity_in_stock = GREATEST(0, total_quantity_in_stock - $1), updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [dto.quantityConsumed, dto.partId, tenantId],
    );

    // 7. Enregistrer la consommation avec ancrage racine asset_id
    const insertSql = `
      INSERT INTO work_order_parts_consumption (
        tenant_id, work_order_id, asset_id, part_id, warehouse_id,
        quantity_consumed, unit_cost_applied_dzd, total_cost_dzd, consumed_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const res = await this.db.query<ConsumptionRow>(insertSql, [
      tenantId,
      dto.workOrderId,
      dto.assetId,
      dto.partId,
      dto.warehouseId,
      dto.quantityConsumed,
      unitCost,
      totalCost,
      userId,
    ]);

    return this.mapConsumption(res.rows[0]);
  }

  async listConsumptionsByWorkOrder(
    tenantId: string,
    workOrderId: string,
  ): Promise<WorkOrderPartConsumption[]> {
    const res = await this.db.query<ConsumptionRow>(
      `SELECT * FROM work_order_parts_consumption WHERE tenant_id = $1 AND work_order_id = $2 ORDER BY consumed_at ASC`,
      [tenantId, workOrderId],
    );
    return res.rows.map((r) => this.mapConsumption(r));
  }

  async listConsumptionsByAsset(
    tenantId: string,
    assetId: string,
  ): Promise<WorkOrderPartConsumption[]> {
    const res = await this.db.query<ConsumptionRow>(
      `SELECT * FROM work_order_parts_consumption WHERE tenant_id = $1 AND asset_id = $2 ORDER BY consumed_at DESC`,
      [tenantId, assetId],
    );
    return res.rows.map((r) => this.mapConsumption(r));
  }

  private mapConsumption(r: ConsumptionRow): WorkOrderPartConsumption {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      workOrderId: r.work_order_id,
      assetId: r.asset_id,
      partId: r.part_id,
      warehouseId: r.warehouse_id,
      quantityConsumed: Number(r.quantity_consumed),
      unitCostAppliedDzd: Number(r.unit_cost_applied_dzd),
      totalCostDzd: Number(r.total_cost_dzd),
      consumedAt: r.consumed_at,
      consumedByUserId: r.consumed_by_user_id,
    };
  }
}

