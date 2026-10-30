import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { RecordMeterReadingDto } from './dto/record-meter-reading.dto';
import {
  Asset,
  AssetCategory,
  AssetStatus,
  DataOrigin,
  MeterReading,
  MeterReadingResponse,
  MeterSource,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@docteurflotte/contracts';

@Injectable()
export class AssetsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Crée un nouvel actif opérationnel avec compteur initial et révision projetée.
   */
  async createAsset(tenantId: string, dto: CreateAssetDto): Promise<Asset> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const tenantRes = await client.query('SELECT data_origin FROM tenants WHERE id = $1', [tenantId]);
      const dataOrigin = tenantRes.rows[0]?.data_origin || DataOrigin.USER_ENTRY;

      const nextMaintenance = dto.maintenanceIntervalValue
        ? Number(dto.initialMeterValue) + Number(dto.maintenanceIntervalValue)
        : null;

      const assetRes = await client.query(
        `INSERT INTO assets (
          tenant_id, name, code, category, brand, model, year,
          status, data_origin, primary_meter_type, current_meter_value,
          maintenance_interval_value, next_maintenance_meter_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          tenantId,
          dto.name,
          dto.code,
          dto.category,
          dto.brand || null,
          dto.model || null,
          dto.year || null,
          AssetStatus.OPERATIONAL,
          dataOrigin,
          dto.primaryMeterType,
          dto.initialMeterValue,
          dto.maintenanceIntervalValue || null,
          nextMaintenance,
        ],
      );

      const asset = this.mapAsset(assetRes.rows[0]);

      await client.query(
        `INSERT INTO meter_readings (
          tenant_id, asset_id, meter_type, value, source, is_validated
        ) VALUES ($1, $2, $3, $4, $5, true)`,
        [tenantId, asset.id, dto.primaryMeterType, dto.initialMeterValue, MeterSource.MANUAL],
      );

      return asset;
    });
  }

  /**
   * Liste les actifs de l'organisation connectée sous RLS.
   */
  async listAssets(tenantId: string, category?: AssetCategory): Promise<Asset[]> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      let query = 'SELECT * FROM assets WHERE tenant_id = $1';
      const params: any[] = [tenantId];

      if (category) {
        query += ' AND category = $2';
        params.push(category);
      }

      query += ' ORDER BY created_at DESC';
      const res = await client.query(query, params);
      return res.rows.map((row) => this.mapAsset(row));
    });
  }

  /**
   * Obtient un actif spécifique par son ID.
   */
  async getAssetById(tenantId: string, id: string): Promise<Asset> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const res = await client.query('SELECT * FROM assets WHERE id = $1 AND tenant_id = $2', [
        id,
        tenantId,
      ]);
      if (res.rowCount === 0) {
        throw new NotFoundException('Actif introuvable.');
      }
      return this.mapAsset(res.rows[0]);
    });
  }

  /**
   * Met à jour un actif opérationnel sous RLS.
   */
  async updateAsset(
    tenantId: string,
    id: string,
    dto: Partial<CreateAssetDto>,
  ): Promise<Asset> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `UPDATE assets
         SET name = COALESCE($1, name),
             code = COALESCE($2, code),
             category = COALESCE($3, category),
             brand = COALESCE($4, brand),
             model = COALESCE($5, model),
             year = COALESCE($6, year),
             maintenance_interval_value = COALESCE($7, maintenance_interval_value),
             updated_at = NOW()
         WHERE id = $8 AND tenant_id = $9
         RETURNING *`,
        [
          dto.name,
          dto.code,
          dto.category,
          dto.brand,
          dto.model,
          dto.year,
          dto.maintenanceIntervalValue,
          id,
          tenantId,
        ],
      );
      if (res.rowCount === 0) {
        throw new NotFoundException('Actif introuvable.');
      }
      return this.mapAsset(res.rows[0]);
    });
  }

  /**
   * Supprime un actif opérationnel sous RLS.
   */
  async deleteAsset(tenantId: string, id: string): Promise<{ success: boolean }> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const res = await client.query('DELETE FROM assets WHERE id = $1 AND tenant_id = $2', [
        id,
        tenantId,
      ]);
      if (res.rowCount === 0) {
        throw new NotFoundException('Actif introuvable.');
      }
      return { success: true };
    });
  }

  /**
   * Enregistre un relevé de compteur, analyse les régressions (recul compteur)
   * et déclenche un ordre de travail préventif si le seuil est franchi.
   */
  async recordMeterReading(
    tenantId: string,
    assetId: string,
    dto: RecordMeterReadingDto,
  ): Promise<MeterReadingResponse> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const assetRes = await client.query(
        'SELECT * FROM assets WHERE id = $1 AND tenant_id = $2',
        [assetId, tenantId],
      );
      if (assetRes.rowCount === 0) {
        throw new NotFoundException('Actif introuvable.');
      }
      const assetRow = assetRes.rows[0];
      const currentVal = Number(assetRow.current_meter_value);

      const settingsRes = await client.query(
        'SELECT alert_thresholds FROM tenant_settings WHERE tenant_id = $1',
        [tenantId],
      );
      const thresholds = settingsRes.rows[0]?.alert_thresholds || {};
      const rollbackTolerance = Number(thresholds.odometerRollbackToleranceKm ?? 0);

      const newValue = Number(dto.value);
      const source = dto.source || MeterSource.MANUAL;

      if (newValue < currentVal - rollbackTolerance) {
        const readingRes = await client.query(
          `INSERT INTO meter_readings (
            tenant_id, asset_id, meter_type, value, source, is_validated, validation_error
          ) VALUES ($1, $2, $3, $4, $5, false, 'METER_ROLLBACK_DETECTED')
          RETURNING *`,
          [tenantId, assetId, dto.meterType, newValue, source],
        );

        return {
          success: false,
          reading: this.mapMeterReading(readingRes.rows[0]),
          currentValue: currentVal,
          rollbackDetected: true,
          maintenanceTriggered: false,
          message: `Anomalie métrologique : relevé (${newValue}) inférieur au compteur validé (${currentVal}). Rejeté sous alerte recul.`,
        };
      }

      const readingRes = await client.query(
        `INSERT INTO meter_readings (
          tenant_id, asset_id, meter_type, value, source, is_validated
        ) VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *`,
        [tenantId, assetId, dto.meterType, newValue, source],
      );

      await client.query(
        'UPDATE assets SET current_meter_value = $1, updated_at = NOW() WHERE id = $2',
        [newValue, assetId],
      );

      let maintenanceTriggered = false;
      const nextMaintenance = assetRow.next_maintenance_meter_value
        ? Number(assetRow.next_maintenance_meter_value)
        : null;

      if (nextMaintenance !== null && newValue >= nextMaintenance) {
        maintenanceTriggered = true;

        await client.query(
          `INSERT INTO work_orders (
            tenant_id, asset_id, title, description, priority, status, trigger_meter_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            tenantId,
            assetId,
            `Révision préventive cyclique (${assetRow.primary_meter_type} : ${newValue})`,
            `Déclenchement automatique suite au franchissement du seuil d'entretien (${nextMaintenance}).`,
            WorkOrderPriority.HIGH,
            WorkOrderStatus.SCHEDULED,
            newValue,
          ],
        );

        await client.query(
          'UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2',
          [AssetStatus.MAINTENANCE_REQUIRED, assetId],
        );
      }

      return {
        success: true,
        reading: this.mapMeterReading(readingRes.rows[0]),
        currentValue: newValue,
        rollbackDetected: false,
        maintenanceTriggered,
        message: maintenanceTriggered
          ? `Compteur mis à jour (${newValue}). Seuil d'entretien franchi : Ordre de travail préventif généré !`
          : `Compteur mis à jour avec succès (${newValue}).`,
      };
    });
  }

  async listMeterReadings(tenantId: string, assetId: string): Promise<MeterReading[]> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        'SELECT * FROM meter_readings WHERE asset_id = $1 AND tenant_id = $2 ORDER BY recorded_at DESC',
        [assetId, tenantId],
      );
      return res.rows.map((row) => this.mapMeterReading(row));
    });
  }

  private mapAsset(row: any): Asset {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      code: row.code,
      category: row.category,
      brand: row.brand || undefined,
      model: row.model || undefined,
      year: row.year ? Number(row.year) : undefined,
      status: row.status,
      dataOrigin: row.data_origin,
      primaryMeterType: row.primary_meter_type,
      currentMeterValue: Number(row.current_meter_value),
      maintenanceIntervalValue: row.maintenance_interval_value
        ? Number(row.maintenance_interval_value)
        : undefined,
      nextMaintenanceMeterValue: row.next_maintenance_meter_value
        ? Number(row.next_maintenance_meter_value)
        : undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  private mapMeterReading(row: any): MeterReading {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      meterType: row.meter_type,
      value: Number(row.value),
      source: row.source,
      recordedAt: new Date(row.recorded_at).toISOString(),
      isValidated: Boolean(row.is_validated),
      validationError: row.validation_error || undefined,
    };
  }
}
