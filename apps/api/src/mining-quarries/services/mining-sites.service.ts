import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { MiningSite, CreateMiningSiteDto, MiningSiteType } from '@docteurflotte/contracts';

@Injectable()
export class MiningSitesService {
  private readonly logger = new Logger(MiningSitesService.name);

  constructor(private readonly db: DatabaseService) {}

  async listSites(tenantId: string): Promise<MiningSite[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM mining_sites WHERE tenant_id = $1 ORDER BY code ASC`,
        [tenantId],
      );
      return res.rows.map((r) => this.mapSite(r));
    });
  }

  async getSite(tenantId: string, id: string): Promise<MiningSite> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM mining_sites WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );
      if (res.rows.length === 0) {
        throw new NotFoundException(`Site minier ${id} introuvable.`);
      }
      return this.mapSite(res.rows[0]);
    });
  }

  async createSite(tenantId: string, dto: CreateMiningSiteDto): Promise<MiningSite> {
    if (!dto.code || !dto.name || !dto.wilayaCode) {
      throw new BadRequestException('Code du site, désignation et code Wilaya obligatoires.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO mining_sites (
          tenant_id, code, name, wilaya_code, commune,
          site_type, ambient_temp_summer_c, average_haul_distance_km, piste_gradient_max_pct
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          tenantId,
          dto.code.trim().toUpperCase(),
          dto.name.trim(),
          dto.wilayaCode,
          dto.commune || null,
          dto.siteType || MiningSiteType.IRON_ORE,
          dto.ambientTempSummerC ?? 45.0,
          dto.averageHaulDistanceKm ?? 3.5,
          dto.pisteGradientMaxPct ?? 10.0,
        ],
      );
      return this.mapSite(res.rows[0]);
    });
  }

  private mapSite(row: any): MiningSite {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      name: row.name,
      wilayaCode: row.wilaya_code,
      commune: row.commune,
      siteType: row.site_type as MiningSiteType,
      ambientTempSummerC: parseFloat(row.ambient_temp_summer_c),
      averageHaulDistanceKm: parseFloat(row.average_haul_distance_km),
      pisteGradientMaxPct: parseFloat(row.piste_gradient_max_pct),
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    };
  }
}

