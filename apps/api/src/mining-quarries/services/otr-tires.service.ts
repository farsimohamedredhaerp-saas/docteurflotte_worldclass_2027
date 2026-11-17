import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  OtrTire,
  CreateOtrTireDto,
  UpdateOtrTireTelemetryDto,
  OtrTirePosition,
  OtrTireStatus,
} from '@docteurflotte/contracts';

@Injectable()
export class OtrTiresService {
  private readonly logger = new Logger(OtrTiresService.name);

  constructor(private readonly db: DatabaseService) {}

  async listTires(
    tenantId: string,
    params?: { assetId?: string; status?: OtrTireStatus },
  ): Promise<OtrTire[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `SELECT * FROM otr_tires WHERE tenant_id = $1`;
      const values: any[] = [tenantId];
      let pIdx = 2;

      if (params?.assetId) {
        query += ` AND asset_id = $${pIdx++}`;
        values.push(params.assetId);
      }
      if (params?.status) {
        query += ` AND status = $${pIdx++}`;
        values.push(params.status);
      }

      query += ` ORDER BY position ASC, serial_number ASC`;
      const res = await client.query(query, values);
      return res.rows.map((r) => this.mapTire(r));
    });
  }

  async getTire(tenantId: string, id: string): Promise<OtrTire> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM otr_tires WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );
      if (res.rows.length === 0) {
        throw new NotFoundException(`Pneumatique OTR ${id} introuvable.`);
      }
      return this.mapTire(res.rows[0]);
    });
  }

  async createTire(tenantId: string, dto: CreateOtrTireDto): Promise<OtrTire> {
    if (!dto.serialNumber || !dto.brand || !dto.dimension || !dto.position) {
      throw new BadRequestException('Numéro de série, marque, dimension et position obligatoires.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO otr_tires (
          tenant_id, asset_id, serial_number, brand, model_pattern,
          dimension, position, nominal_tkph, purchase_cost_dzd,
          tread_depth_initial_mm, tread_depth_current_mm
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          tenantId,
          dto.assetId || null,
          dto.serialNumber.trim().toUpperCase(),
          dto.brand.trim(),
          dto.modelPattern || null,
          dto.dimension.trim(),
          dto.position,
          dto.nominalTkph || 350,
          dto.purchaseCostDzd || 2800000.0,
          dto.treadDepthInitialMm || 85.0,
          dto.treadDepthCurrentMm || dto.treadDepthInitialMm || 85.0,
        ],
      );
      return this.mapTire(res.rows[0]);
    });
  }

  async updateTireTelemetry(tenantId: string, dto: UpdateOtrTireTelemetryDto): Promise<OtrTire> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const existing = await client.query(
        `SELECT * FROM otr_tires WHERE id = $1 AND tenant_id = $2`,
        [dto.tireId, tenantId],
      );
      if (existing.rows.length === 0) {
        throw new NotFoundException(`Pneumatique OTR ${dto.tireId} introuvable.`);
      }

      const tire = existing.rows[0];
      const newOperatingHours = parseFloat(tire.total_operating_hours) + (dto.operatingHoursDelta || 0);
      const newPressure = dto.pressureBar ?? parseFloat(tire.current_pressure_bar);
      const newTemp = dto.temperatureC ?? parseFloat(tire.current_temp_c);
      const newTread = dto.treadDepthMm ?? parseFloat(tire.tread_depth_current_mm);

      let newStatus = tire.status;
      if (newTemp >= 90.0) {
        // Alerte surchauffe critique du pneu : passage automatique en Standby Refroidissement
        newStatus = OtrTireStatus.COOLING_STANDBY;
      } else if (newTread <= 15.0) {
        // Fin de vie de la bande de roulement
        newStatus = OtrTireStatus.SCRAPPED;
      }

      const res = await client.query(
        `UPDATE otr_tires SET
          current_pressure_bar = $1,
          current_temp_c = $2,
          tread_depth_current_mm = $3,
          total_operating_hours = $4,
          status = $5,
          updated_at = NOW()
        WHERE id = $6 AND tenant_id = $7
        RETURNING *`,
        [newPressure, newTemp, newTread, newOperatingHours, newStatus, dto.tireId, tenantId],
      );

      return this.mapTire(res.rows[0]);
    });
  }

  private mapTire(row: any): OtrTire {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      serialNumber: row.serial_number,
      brand: row.brand,
      modelPattern: row.model_pattern,
      dimension: row.dimension,
      position: row.position as OtrTirePosition,
      nominalTkph: parseInt(row.nominal_tkph, 10),
      purchaseCostDzd: parseFloat(row.purchase_cost_dzd),
      treadDepthInitialMm: parseFloat(row.tread_depth_initial_mm),
      treadDepthCurrentMm: parseFloat(row.tread_depth_current_mm),
      currentPressureBar: row.current_pressure_bar ? parseFloat(row.current_pressure_bar) : undefined,
      currentTempC: row.current_temp_c ? parseFloat(row.current_temp_c) : undefined,
      totalOperatingHours: parseFloat(row.total_operating_hours),
      status: row.status as OtrTireStatus,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    };
  }
}
