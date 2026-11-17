import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { FarmProperty, CreateFarmPropertyDto } from '@docteurflotte/contracts';

@Injectable()
export class FarmPropertiesService {
  private readonly logger = new Logger(FarmPropertiesService.name);

  constructor(private readonly db: DatabaseService) {}

  async listFarms(tenantId: string): Promise<FarmProperty[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM farm_properties WHERE tenant_id = $1 ORDER BY code ASC`,
        [tenantId],
      );
      return res.rows.map((r) => this.mapFarm(r));
    });
  }

  async getFarm(tenantId: string, id: string): Promise<FarmProperty> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM farm_properties WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );
      if (res.rows.length === 0) {
        throw new NotFoundException(`Domaine agricole ${id} introuvable.`);
      }
      return this.mapFarm(res.rows[0]);
    });
  }

  async createFarm(tenantId: string, dto: CreateFarmPropertyDto): Promise<FarmProperty> {
    if (!dto.code || !dto.name || !dto.wilayaCode) {
      throw new BadRequestException('Code domaine, nom et code Wilaya obligatoires.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO farm_properties (
          tenant_id, code, name, wilaya_code, commune,
          total_surface_hectares, ccls_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          tenantId,
          dto.code.trim().toUpperCase(),
          dto.name.trim(),
          dto.wilayaCode,
          dto.commune || null,
          dto.totalSurfaceHectares || 0.0,
          dto.cclsCode || null,
        ],
      );
      return this.mapFarm(res.rows[0]);
    });
  }

  private mapFarm(row: any): FarmProperty {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      name: row.name,
      wilayaCode: Number(row.wilaya_code),
      commune: row.commune || undefined,
      totalSurfaceHectares: Number(row.total_surface_hectares),
      cclsCode: row.ccls_code || undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

