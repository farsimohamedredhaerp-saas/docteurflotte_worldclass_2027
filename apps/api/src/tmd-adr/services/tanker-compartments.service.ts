import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  FuelTankerCompartment,
  CreateFuelTankerCompartmentDto,
  UpdateCompartmentTelemetryDto,
  TankerProductType,
  ValveStatus,
} from '@docteurflotte/contracts';

@Injectable()
export class TankerCompartmentsService {
  private readonly logger = new Logger(TankerCompartmentsService.name);

  constructor(private readonly db: DatabaseService) {}

  async listCompartments(
    tenantId: string,
    assetId?: string,
  ): Promise<FuelTankerCompartment[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `SELECT * FROM fuel_tanker_compartments WHERE tenant_id = $1`;
      const values: any[] = [tenantId];

      if (assetId) {
        query += ` AND asset_id = $2`;
        values.push(assetId);
      }

      query += ` ORDER BY tanker_code ASC, compartment_number ASC`;
      const res = await client.query(query, values);
      return res.rows.map((r) => this.mapComp(r));
    });
  }

  async getCompartment(tenantId: string, id: string): Promise<FuelTankerCompartment> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM fuel_tanker_compartments WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );
      if (res.rows.length === 0) {
        throw new NotFoundException(`Compartiment citerne ${id} introuvable.`);
      }
      return this.mapComp(res.rows[0]);
    });
  }

  async createCompartment(
    tenantId: string,
    dto: CreateFuelTankerCompartmentDto,
  ): Promise<FuelTankerCompartment> {
    if (!dto.assetId || !dto.tankerCode || !dto.compartmentNumber || !dto.capacityLiters) {
      throw new BadRequestException('Actif, code citerne, numéro et capacité obligatoires.');
    }

    const isTestExpired = new Date(dto.apaveTestExpiryDate) < new Date();

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO fuel_tanker_compartments (
          tenant_id, asset_id, tanker_code, compartment_number,
          capacity_liters, current_product_type, current_volume_liters,
          bottom_valve_status, apave_hydrostatic_test_date,
          apave_test_expiry_date, is_adr_compliant
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          tenantId,
          dto.assetId,
          dto.tankerCode.trim().toUpperCase(),
          dto.compartmentNumber,
          dto.capacityLiters,
          dto.currentProductType || TankerProductType.GASOIL,
          dto.currentVolumeLiters || 0.0,
          ValveStatus.CLOSED,
          dto.apaveHydrostaticTestDate,
          dto.apaveTestExpiryDate,
          !isTestExpired,
        ],
      );
      return this.mapComp(res.rows[0]);
    });
  }

  async updateCompartmentTelemetry(
    tenantId: string,
    dto: UpdateCompartmentTelemetryDto,
  ): Promise<FuelTankerCompartment> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const existing = await client.query(
        `SELECT * FROM fuel_tanker_compartments WHERE id = $1 AND tenant_id = $2`,
        [dto.compartmentId, tenantId],
      );
      if (existing.rows.length === 0) {
        throw new NotFoundException(`Compartiment citerne ${dto.compartmentId} introuvable.`);
      }

      const comp = existing.rows[0];
      const newVolume = dto.volumeLiters ?? parseFloat(comp.current_volume_liters);
      const newValve = dto.bottomValveStatus ?? comp.bottom_valve_status;

      const res = await client.query(
        `UPDATE fuel_tanker_compartments SET
          current_volume_liters = $1,
          bottom_valve_status = $2,
          updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *`,
        [newVolume, newValve, dto.compartmentId, tenantId],
      );

      return this.mapComp(res.rows[0]);
    });
  }

  async checkTankerApaveStatus(tenantId: string, assetId: string): Promise<{ compliant: boolean; reason?: string }> {
    const compartments = await this.listCompartments(tenantId, assetId);
    if (compartments.length === 0) {
      return { compliant: false, reason: 'Aucun compartiment citerne homologué enregistré pour cet actif.' };
    }

    const now = new Date();
    for (const c of compartments) {
      const expiry = new Date(c.apaveTestExpiryDate);
      if (expiry < now) {
        return {
          compliant: false,
          reason: `Compartiment ${c.compartmentNumber} : Épreuve hydrostatique APAVE échue depuis le ${c.apaveTestExpiryDate}.`,
        };
      }
      if (!c.isAdrCompliant) {
        return {
          compliant: false,
          reason: `Compartiment ${c.compartmentNumber} non conforme aux normes ADR.`,
        };
      }
    }

    return { compliant: true };
  }

  private mapComp(row: any): FuelTankerCompartment {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      tankerCode: row.tanker_code,
      compartmentNumber: parseInt(row.compartment_number, 10),
      capacityLiters: parseFloat(row.capacity_liters),
      currentProductType: row.current_product_type as TankerProductType,
      currentVolumeLiters: parseFloat(row.current_volume_liters),
      bottomValveStatus: row.bottom_valve_status as ValveStatus,
      apaveHydrostaticTestDate: row.apave_hydrostatic_test_date?.toISOString?.()?.slice(0, 10) || String(row.apave_hydrostatic_test_date).slice(0, 10),
      apaveTestExpiryDate: row.apave_test_expiry_date?.toISOString?.()?.slice(0, 10) || String(row.apave_test_expiry_date).slice(0, 10),
      isAdrCompliant: row.is_adr_compliant,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    };
  }
}

