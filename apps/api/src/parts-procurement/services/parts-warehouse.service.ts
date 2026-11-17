import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PartWarehouse, PartStockLevel } from '@docteurflotte/contracts';

interface WarehouseRow {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  wilaya_code: number;
  address: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface StockLevelRow {
  id: string;
  tenant_id: string;
  part_id: string;
  part_number?: string;
  part_designation?: string;
  warehouse_id: string;
  warehouse_name?: string;
  quantity_on_hand: string | number;
  quantity_reserved: string | number;
  quantity_available: string | number;
  reorder_point: string | number;
  location_bin: string | null;
  updated_at: string;
}

@Injectable()
export class PartsWarehouseService {
  constructor(private readonly db: DatabaseService) {}

  async createWarehouse(
    tenantId: string,
    dto: { code: string; name: string; wilayaCode: number; address?: string; managerName?: string },
  ): Promise<PartWarehouse> {
    if (!dto.code || !dto.name) {
      throw new BadRequestException('Le code et le nom du dépôt sont obligatoires.');
    }
    if (!dto.wilayaCode || dto.wilayaCode < 1 || dto.wilayaCode > 58) {
      throw new BadRequestException('Le code Wilaya doit être compris entre 1 et 58 (Nomenclature Algérie).');
    }

    const checkRes = await this.db.query(
      `SELECT id FROM parts_warehouses WHERE tenant_id = $1 AND code = $2`,
      [tenantId, dto.code.trim().toUpperCase()],
    );
    if (checkRes.rows.length > 0) {
      throw new BadRequestException(`Le dépôt de code ${dto.code} existe déjà pour cette organisation.`);
    }

    const insertSql = `
      INSERT INTO parts_warehouses (tenant_id, code, name, wilaya_code, address, manager_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING *
    `;
    const res = await this.db.query<WarehouseRow>(insertSql, [
      tenantId,
      dto.code.trim().toUpperCase(),
      dto.name.trim(),
      dto.wilayaCode,
      dto.address || null,
      dto.managerName || null,
    ]);

    return this.mapWarehouse(res.rows[0]);
  }

  async listWarehouses(tenantId: string): Promise<PartWarehouse[]> {
    const res = await this.db.query<WarehouseRow>(
      `SELECT * FROM parts_warehouses WHERE tenant_id = $1 AND is_active = TRUE ORDER BY code ASC`,
      [tenantId],
    );
    return res.rows.map((r) => this.mapWarehouse(r));
  }

  async getStockLevels(tenantId: string, warehouseId?: string): Promise<PartStockLevel[]> {
    let sql = `
      SELECT sl.*, p.part_number, p.designation as part_designation, w.name as warehouse_name
      FROM parts_stock_levels sl
      JOIN parts_inventory p ON p.id = sl.part_id
      JOIN parts_warehouses w ON w.id = sl.warehouse_id
      WHERE sl.tenant_id = $1
    `;
    const params: string[] = [tenantId];
    if (warehouseId) {
      sql += ` AND sl.warehouse_id = $2`;
      params.push(warehouseId);
    }
    sql += ` ORDER BY p.designation ASC`;

    const res = await this.db.query<StockLevelRow>(sql, params);
    return res.rows.map((r) => this.mapStockLevel(r));
  }

  async adjustStock(
    tenantId: string,
    dto: { partId: string; warehouseId: string; quantityAdjustment: number; locationBin?: string },
  ): Promise<PartStockLevel> {
    if (!dto.partId || !dto.warehouseId) {
      throw new BadRequestException('L’article et le dépôt sont obligatoires.');
    }

    // 1. Vérification part & warehouse
    const partRes = await this.db.query(`SELECT id FROM parts_inventory WHERE id = $1 AND tenant_id = $2`, [dto.partId, tenantId]);
    if (partRes.rows.length === 0) throw new NotFoundException('Article introuvable');
    const whRes = await this.db.query(`SELECT id FROM parts_warehouses WHERE id = $1 AND tenant_id = $2`, [dto.warehouseId, tenantId]);
    if (whRes.rows.length === 0) throw new NotFoundException('Dépôt introuvable');

    // 2. Upsert stock level
    const upsertSql = `
      INSERT INTO parts_stock_levels (
        tenant_id, part_id, warehouse_id, quantity_on_hand, quantity_reserved, reorder_point, location_bin
      ) VALUES ($1, $2, $3, GREATEST(0, $4), 0, 5, $5)
      ON CONFLICT (tenant_id, part_id, warehouse_id)
      DO UPDATE SET
        quantity_on_hand = GREATEST(0, parts_stock_levels.quantity_on_hand + EXCLUDED.quantity_on_hand),
        location_bin = COALESCE(EXCLUDED.location_bin, parts_stock_levels.location_bin),
        updated_at = NOW()
      RETURNING *
    `;
    const res = await this.db.query<StockLevelRow>(upsertSql, [
      tenantId,
      dto.partId,
      dto.warehouseId,
      dto.quantityAdjustment,
      dto.locationBin || null,
    ]);

    // 3. Recalcul total stock sur parts_inventory
    await this.db.query(
      `UPDATE parts_inventory
       SET total_quantity_in_stock = (
         SELECT COALESCE(SUM(quantity_on_hand), 0) FROM parts_stock_levels WHERE part_id = $1 AND tenant_id = $2
       ), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [dto.partId, tenantId],
    );

    return this.mapStockLevel(res.rows[0]);
  }

  private mapWarehouse(r: WarehouseRow): PartWarehouse {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      code: r.code,
      name: r.name,
      wilayaCode: Number(r.wilaya_code),
      address: r.address || undefined,
      managerName: r.manager_name || undefined,
      isActive: r.is_active,
      createdAt: r.created_at,
    };
  }

  private mapStockLevel(r: StockLevelRow): PartStockLevel {
    const onHand = Number(r.quantity_on_hand);
    const reserved = Number(r.quantity_reserved);
    const available = onHand - reserved;
    const reorder = Number(r.reorder_point);

    return {
      id: r.id,
      tenantId: r.tenant_id,
      partId: r.part_id,
      partNumber: r.part_number,
      partDesignation: r.part_designation,
      warehouseId: r.warehouse_id,
      warehouseName: r.warehouse_name,
      quantityOnHand: onHand,
      quantityReserved: reserved,
      quantityAvailable: available,
      reorderPoint: reorder,
      isBelowReorderPoint: available <= reorder,
      locationBin: r.location_bin || undefined,
      updatedAt: r.updated_at,
    };
  }
}

