import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PartItem, CreatePartItemDto } from '@docteurflotte/contracts';

interface PartRow {
  id: string;
  tenant_id: string;
  part_number: string;
  designation: string;
  category: PartItem['category'];
  oem_brand_compatibility: string[];
  unit_measure: PartItem['unitMeasure'];
  average_weighted_cost_dzd: string | number;
  default_selling_price_dzd: string | number;
  total_quantity_in_stock: string | number;
  reorder_point_quantity: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class PartsInventoryService {
  constructor(private readonly db: DatabaseService) {}

  async createPartItem(tenantId: string, dto: CreatePartItemDto): Promise<PartItem> {
    if (!dto.partNumber || !dto.designation || !dto.category) {
      throw new BadRequestException('La référence, la désignation et la catégorie sont obligatoires.');
    }
    if (dto.initialCostDzd == null || dto.initialCostDzd < 0) {
      throw new BadRequestException('Le coût initial unitaire en DZD doit être positif ou nul.');
    }

    const checkRes = await this.db.query(
      `SELECT id FROM parts_inventory WHERE tenant_id = $1 AND part_number = $2`,
      [tenantId, dto.partNumber.trim().toUpperCase()],
    );
    if (checkRes.rows.length > 0) {
      throw new BadRequestException(`La référence article ${dto.partNumber} existe déjà pour cette organisation.`);
    }

    const insertSql = `
      INSERT INTO parts_inventory (
        tenant_id, part_number, designation, category, oem_brand_compatibility,
        unit_measure, average_weighted_cost_dzd, default_selling_price_dzd,
        total_quantity_in_stock, reorder_point_quantity, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, TRUE)
      RETURNING *
    `;
    const params = [
      tenantId,
      dto.partNumber.trim().toUpperCase(),
      dto.designation.trim(),
      dto.category,
      JSON.stringify(dto.oemBrandCompatibility || []),
      dto.unitMeasure || 'PIECE',
      dto.initialCostDzd,
      dto.initialCostDzd * 1.25, // Marge indicative 25%
      dto.reorderPointQuantity || 5,
    ];

    const res = await this.db.query<PartRow>(insertSql, params);
    return this.mapRow(res.rows[0]);
  }

  async listParts(
    tenantId: string,
    params?: { category?: string; lowStockOnly?: boolean },
  ): Promise<PartItem[]> {
    let sql = `SELECT * FROM parts_inventory WHERE tenant_id = $1 AND is_active = TRUE`;
    const queryParams: any[] = [tenantId];
    let idx = 2;

    if (params?.category) {
      sql += ` AND category = $${idx++}`;
      queryParams.push(params.category);
    }
    if (params?.lowStockOnly) {
      sql += ` AND total_quantity_in_stock <= reorder_point_quantity`;
    }

    sql += ` ORDER BY designation ASC`;
    const res = await this.db.query<PartRow>(sql, queryParams);
    return res.rows.map((r) => this.mapRow(r));
  }

  async getPartById(tenantId: string, id: string): Promise<PartItem> {
    const res = await this.db.query<PartRow>(
      `SELECT * FROM parts_inventory WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException(`Article de stock introuvable: ${id}`);
    }
    return this.mapRow(res.rows[0]);
  }

  private mapRow(r: PartRow): PartItem {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      partNumber: r.part_number,
      designation: r.designation,
      category: r.category,
      oemBrandCompatibility: typeof r.oem_brand_compatibility === 'string'
        ? JSON.parse(r.oem_brand_compatibility)
        : (r.oem_brand_compatibility || []),
      unitMeasure: r.unit_measure,
      averageWeightedCostDzd: Number(r.average_weighted_cost_dzd),
      defaultSellingPriceDzd: Number(r.default_selling_price_dzd),
      totalQuantityInStock: Number(r.total_quantity_in_stock),
      reorderPointQuantity: Number(r.reorder_point_quantity),
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

