import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PartPurchaseOrder } from '@docteurflotte/contracts';

interface PurchaseOrderRow {
  id: string;
  tenant_id: string;
  po_number: string;
  supplier_name: string;
  supplier_nif: string | null;
  supplier_currency: 'DZD' | 'USD' | 'EUR';
  exchange_rate_to_dzd: string | number;
  total_amount_currency: string | number;
  total_amount_dzd: string | number;
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  items: any;
  ordered_at: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  created_at: string;
}

@Injectable()
export class PartsPurchaseOrderService {
  constructor(private readonly db: DatabaseService) {}

  async createPurchaseOrder(
    tenantId: string,
    dto: {
      supplierName: string;
      supplierNif?: string;
      supplierCurrency?: 'DZD' | 'USD' | 'EUR';
      exchangeRateToDzd?: number;
      expectedDeliveryDate?: string;
      items: {
        partId: string;
        partNumber: string;
        quantityOrdered: number;
        unitPriceCurrency: number;
      }[];
    },
  ): Promise<PartPurchaseOrder> {
    if (!dto.supplierName || !dto.items || dto.items.length === 0) {
      throw new BadRequestException('Le fournisseur et les articles commandés sont obligatoires.');
    }

    const currency = dto.supplierCurrency || 'DZD';
    const rate = currency === 'DZD' ? 1.0 : (dto.exchangeRateToDzd || 145.0);

    let totalCurrency = 0;
    for (const item of dto.items) {
      totalCurrency += item.quantityOrdered * item.unitPriceCurrency;
    }
    const totalDzd = totalCurrency * rate;

    // Génération séquentielle du numéro de bon de commande
    const countRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM parts_purchase_orders WHERE tenant_id = $1`,
      [tenantId],
    );
    const seq = Number(countRes.rows[0].count) + 1;
    const poNumber = `BC-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    const insertSql = `
      INSERT INTO parts_purchase_orders (
        tenant_id, po_number, supplier_name, supplier_nif, supplier_currency,
        exchange_rate_to_dzd, total_amount_currency, total_amount_dzd,
        status, items, ordered_at, expected_delivery_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ORDERED', $9, NOW(), $10)
      RETURNING *
    `;
    const params = [
      tenantId,
      poNumber,
      dto.supplierName.trim(),
      dto.supplierNif || null,
      currency,
      rate,
      totalCurrency,
      totalDzd,
      JSON.stringify(dto.items.map((i) => ({ ...i, quantityReceived: 0 }))),
      dto.expectedDeliveryDate || null,
    ];

    const res = await this.db.query<PurchaseOrderRow>(insertSql, params);
    return this.mapOrder(res.rows[0]);
  }

  async listPurchaseOrders(tenantId: string, status?: string): Promise<PartPurchaseOrder[]> {
    let sql = `SELECT * FROM parts_purchase_orders WHERE tenant_id = $1`;
    const params: string[] = [tenantId];
    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }
    sql += ` ORDER BY ordered_at DESC`;

    const res = await this.db.query<PurchaseOrderRow>(sql, params);
    return res.rows.map((r) => this.mapOrder(r));
  }

  async receivePurchaseOrder(tenantId: string, poId: string, warehouseId: string): Promise<PartPurchaseOrder> {
    const poRes = await this.db.query<PurchaseOrderRow>(
      `SELECT * FROM parts_purchase_orders WHERE id = $1 AND tenant_id = $2`,
      [poId, tenantId],
    );
    if (poRes.rows.length === 0) {
      throw new NotFoundException(`Bon de commande introuvable: ${poId}`);
    }
    const po = poRes.rows[0];
    if (po.status === 'RECEIVED') {
      throw new BadRequestException('Ce bon de commande a déjà été réceptionné.');
    }

    const items: Array<{
      partId: string;
      partNumber: string;
      quantityOrdered: number;
      quantityReceived: number;
      unitPriceCurrency: number;
    }> = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;

    const rate = Number(po.exchange_rate_to_dzd);

    // Réception de chaque article en stock magasin et recalcul CMUP
    for (const item of items) {
      const unitCostDzd = item.unitPriceCurrency * rate;
      const qty = item.quantityOrdered;

      // 1. Incrémenter stock magasin
      await this.db.query(
        `INSERT INTO parts_stock_levels (
           tenant_id, part_id, warehouse_id, quantity_on_hand, quantity_reserved, reorder_point
         ) VALUES ($1, $2, $3, $4, 0, 5)
         ON CONFLICT (tenant_id, part_id, warehouse_id)
         DO UPDATE SET
           quantity_on_hand = parts_stock_levels.quantity_on_hand + EXCLUDED.quantity_on_hand,
           updated_at = NOW()`,
        [tenantId, item.partId, warehouseId, qty],
      );

      // 2. Mise à jour CMUP et stock total dans parts_inventory
      const currentPartRes = await this.db.query(
        `SELECT total_quantity_in_stock, average_weighted_cost_dzd FROM parts_inventory WHERE id = $1 AND tenant_id = $2`,
        [item.partId, tenantId],
      );
      if (currentPartRes.rows.length > 0) {
        const currentQty = Number(currentPartRes.rows[0].total_quantity_in_stock);
        const currentCost = Number(currentPartRes.rows[0].average_weighted_cost_dzd);

        const newTotalQty = currentQty + qty;
        const newCmup = newTotalQty > 0
          ? (currentQty * currentCost + qty * unitCostDzd) / newTotalQty
          : unitCostDzd;

        await this.db.query(
          `UPDATE parts_inventory
           SET total_quantity_in_stock = $1, average_weighted_cost_dzd = $2, updated_at = NOW()
           WHERE id = $3 AND tenant_id = $4`,
          [newTotalQty, newCmup, item.partId, tenantId],
        );
      }

      item.quantityReceived = qty;
    }

    // 3. Mettre à jour le statut du PO
    const updateSql = `
      UPDATE parts_purchase_orders
      SET status = 'RECEIVED', items = $1, received_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    const res = await this.db.query<PurchaseOrderRow>(updateSql, [
      JSON.stringify(items),
      poId,
      tenantId,
    ]);

    return this.mapOrder(res.rows[0]);
  }

  private mapOrder(r: PurchaseOrderRow): PartPurchaseOrder {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      poNumber: r.po_number,
      supplierName: r.supplier_name,
      supplierNif: r.supplier_nif || undefined,
      supplierCurrency: r.supplier_currency,
      exchangeRateToDzd: Number(r.exchange_rate_to_dzd),
      totalAmountCurrency: Number(r.total_amount_currency),
      totalAmountDzd: Number(r.total_amount_dzd),
      status: r.status,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
      orderedAt: r.ordered_at,
      expectedDeliveryDate: r.expected_delivery_date || undefined,
      receivedAt: r.received_at || undefined,
      createdAt: r.created_at,
    };
  }
}

