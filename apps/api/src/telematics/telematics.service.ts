import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TraccarAdapterService } from './traccar-adapter.service';
import {
  AssetStatus,
  DeviceStatus,
  FleetLiveAsset,
  IngestPositionDto,
  MeterType,
  RegisterDeviceDto,
  TelematicsDevice,
  AssetDeviceBinding,
  CanonicalPosition,
  TraccarGatewayHealth,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@docteurflotte/contracts';

@Injectable()
export class TelematicsService {
  private readonly logger = new Logger(TelematicsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly traccarAdapter: TraccarAdapterService,
  ) {}

  /**
   * Enregistrer un nouveau terminal GPS
   */
  async registerDevice(
    tenantId: string,
    dto: RegisterDeviceDto,
  ): Promise<TelematicsDevice> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO telematics_devices (tenant_id, unique_id, name, model, traccar_id, attributes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, unique_id) DO UPDATE
         SET name = EXCLUDED.name, model = EXCLUDED.model, traccar_id = EXCLUDED.traccar_id
         RETURNING *`,
        [
          tenantId,
          dto.uniqueId.trim(),
          dto.name.trim(),
          dto.model || null,
          dto.traccarId || null,
          JSON.stringify(dto.attributes || {}),
        ],
      );

      return this.mapDevice(res.rows[0]);
    });
  }

  /**
   * Liste des terminaux du tenant
   */
  async listDevices(tenantId: string): Promise<TelematicsDevice[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM telematics_devices WHERE tenant_id = $1 ORDER BY created_at DESC`,
        [tenantId],
      );
      return res.rows.map((r) => this.mapDevice(r));
    });
  }

  /**
   * Appairer un boîtier GPS à un actif opérationnel
   */
  async bindDeviceToAsset(
    tenantId: string,
    assetId: string,
    deviceId: string,
  ): Promise<AssetDeviceBinding> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Vérifier l'actif
      const assetRes = await client.query(
        `SELECT id, name, code FROM assets WHERE id = $1 AND tenant_id = $2`,
        [assetId, tenantId],
      );
      if (assetRes.rows.length === 0) {
        throw new NotFoundException(`Actif avec l'identifiant ${assetId} non trouvé.`);
      }

      // 2. Vérifier le boîtier
      const deviceRes = await client.query(
        `SELECT id, name, unique_id FROM telematics_devices WHERE id = $1 AND tenant_id = $2`,
        [deviceId, tenantId],
      );
      if (deviceRes.rows.length === 0) {
        throw new NotFoundException(`Boîtier avec l'identifiant ${deviceId} non trouvé.`);
      }

      // 3. Désactiver les appairages antérieurs de cet actif ou de ce boîtier
      await client.query(
        `UPDATE asset_device_bindings
         SET is_active = FALSE, unbound_at = NOW()
         WHERE tenant_id = $1 AND (asset_id = $2 OR device_id = $3) AND is_active = TRUE`,
        [tenantId, assetId, deviceId],
      );

      // 4. Insérer le nouvel appairage actif horodaté
      const insertRes = await client.query(
        `INSERT INTO asset_device_bindings (tenant_id, asset_id, device_id, bound_at, is_active)
         VALUES ($1, $2, $3, NOW(), TRUE)
         RETURNING *`,
        [tenantId, assetId, deviceId],
      );

      const binding = insertRes.rows[0];
      return {
        id: binding.id,
        tenantId: binding.tenant_id,
        assetId: binding.asset_id,
        deviceId: binding.device_id,
        boundAt: binding.bound_at,
        unboundAt: binding.unbound_at,
        isActive: binding.is_active,
        createdAt: binding.created_at,
        assetName: assetRes.rows[0].name,
        assetCode: assetRes.rows[0].code,
        deviceName: deviceRes.rows[0].name,
        deviceUniqueId: deviceRes.rows[0].unique_id,
      };
    });
  }

  /**
   * Désappairer un boîtier
   */
  async unbindDevice(tenantId: string, bindingId: string): Promise<void> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `UPDATE asset_device_bindings
         SET is_active = FALSE, unbound_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE`,
        [bindingId, tenantId],
      );
      if (res.rowCount === 0) {
        throw new NotFoundException(`Appairage actif ${bindingId} non trouvé.`);
      }
    });
  }

  /**
   * Lister les appairages
   */
  async listBindings(tenantId: string): Promise<AssetDeviceBinding[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT b.*, a.name as asset_name, a.code as asset_code, d.name as device_name, d.unique_id as device_unique_id
         FROM asset_device_bindings b
         JOIN assets a ON a.id = b.asset_id
         JOIN telematics_devices d ON d.id = b.device_id
         WHERE b.tenant_id = $1
         ORDER BY b.is_active DESC, b.bound_at DESC`,
        [tenantId],
      );

      return res.rows.map((r) => ({
        id: r.id,
        tenantId: r.tenant_id,
        assetId: r.asset_id,
        deviceId: r.device_id,
        boundAt: r.bound_at,
        unboundAt: r.unbound_at,
        isActive: r.is_active,
        createdAt: r.created_at,
        assetName: r.asset_name,
        assetCode: r.asset_code,
        deviceName: r.device_name,
        deviceUniqueId: r.device_unique_id,
      }));
    });
  }

  /**
   * Ingestion de Position Télématique Résiliente & Idempotente
   * Conforme à AGENTS.md (Section 8.3 & Skill traccar-integration)
   */
  async ingestPosition(
    tenantId: string,
    dto: IngestPositionDto,
  ): Promise<{
    duplicate: boolean;
    position: CanonicalPosition;
    assetUpdated?: {
      assetId: string;
      newMeterValue: number;
      maintenanceTriggered: boolean;
    };
  }> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Contrôle d'Idempotence stricte (traccar_position_id déjà présent ?)
      const dupCheck = await client.query(
        `SELECT * FROM telematics_positions
         WHERE tenant_id = $1 AND traccar_position_id = $2`,
        [tenantId, dto.traccarPositionId],
      );

      if (dupCheck.rows.length > 0) {
        this.logger.debug(`Idempotence: position ${dto.traccarPositionId} déjà ingérée. Ignorée sans doublon.`);
        return {
          duplicate: true,
          position: this.mapPosition(dupCheck.rows[0]),
        };
      }

      // 2. Rechercher ou créer le device par uniqueId
      let deviceRes = await client.query(
        `SELECT id, name FROM telematics_devices WHERE tenant_id = $1 AND unique_id = $2`,
        [tenantId, dto.uniqueId],
      );

      let deviceId: string;
      if (deviceRes.rows.length === 0) {
        const createRes = await client.query(
          `INSERT INTO telematics_devices (tenant_id, unique_id, name, status, last_update)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name`,
          [tenantId, dto.uniqueId, `Dispositif ${dto.uniqueId}`, DeviceStatus.ONLINE, dto.recordedAt],
        );
        deviceId = createRes.rows[0].id;
      } else {
        deviceId = deviceRes.rows[0].id;
        await client.query(
          `UPDATE telematics_devices
           SET status = $1, last_update = $2
           WHERE id = $3 AND tenant_id = $4`,
          [DeviceStatus.ONLINE, dto.recordedAt, deviceId, tenantId],
        );
      }

      // 3. Déterminer si ce terminal est appairé à un actif opérationnel
      const bindingRes = await client.query(
        `SELECT asset_id FROM asset_device_bindings
         WHERE tenant_id = $1 AND device_id = $2 AND is_active = TRUE`,
        [tenantId, deviceId],
      );

      const assetId: string | null = bindingRes.rows.length > 0 ? bindingRes.rows[0].asset_id : null;

      // 4. Insérer la position canonique dans telematics_positions
      const insertPos = await client.query(
        `INSERT INTO telematics_positions
         (tenant_id, traccar_position_id, device_id, asset_id, latitude, longitude, speed, altitude, course, ignition, odometer_km, engine_hours, recorded_at, attributes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          tenantId,
          dto.traccarPositionId,
          deviceId,
          assetId,
          dto.latitude,
          dto.longitude,
          dto.speed,
          dto.altitude || null,
          dto.course || null,
          dto.ignition,
          dto.odometerKm || null,
          dto.engineHours || null,
          dto.recordedAt,
          JSON.stringify(dto.attributes || {}),
        ],
      );

      const savedPosition = this.mapPosition(insertPos.rows[0]);

      // 5. Mise à jour de l'actif et déclenchement préventif si appairé
      let assetUpdateResult = undefined;
      if (assetId && (dto.odometerKm !== undefined || dto.engineHours !== undefined)) {
        const assetRes = await client.query(
          `SELECT id, name, code, primary_meter_type, current_meter_value, next_maintenance_meter_value, maintenance_interval_value
           FROM assets WHERE id = $1 AND tenant_id = $2`,
          [assetId, tenantId],
        );

        if (assetRes.rows.length > 0) {
          const asset = assetRes.rows[0];
          const incomingValue =
            asset.primary_meter_type === MeterType.ODOMETER_KM
              ? dto.odometerKm
              : dto.engineHours;

          if (incomingValue !== undefined && incomingValue > Number(asset.current_meter_value)) {
            let nextMaintenance = Number(asset.next_maintenance_meter_value);
            let maintenanceTriggered = false;

            if (nextMaintenance && incomingValue >= nextMaintenance) {
              maintenanceTriggered = true;

              // Mettre l'actif en révision requise
              await client.query(
                `UPDATE assets
                 SET current_meter_value = $1, status = $2, updated_at = NOW()
                 WHERE id = $3 AND tenant_id = $4`,
                [incomingValue, AssetStatus.MAINTENANCE_REQUIRED, assetId, tenantId],
              );

              // Créer l'ordre de travail préventif automatique
              await client.query(
                `INSERT INTO work_orders (tenant_id, asset_id, title, description, priority, status, trigger_meter_value, estimated_labor_hours)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  tenantId,
                  assetId,
                  `Révision Préventive Télématique : Seuil ${nextMaintenance} franchi`,
                  `Déclenché automatiquement par flux Traccar. Compteur certifié : ${incomingValue}. Seuil d'intervention : ${nextMaintenance}.`,
                  WorkOrderPriority.HIGH,
                  WorkOrderStatus.SCHEDULED,
                  incomingValue,
                  3.5,
                ],
              );

              this.logger.log(`⚡ OT préventif auto généré pour ${asset.code} suite au relevé télématique ${incomingValue}`);
            } else {
              // Simple mise à jour du compteur
              await client.query(
                `UPDATE assets
                 SET current_meter_value = $1, updated_at = NOW()
                 WHERE id = $2 AND tenant_id = $3`,
                [incomingValue, assetId, tenantId],
              );
            }

            // Consigner dans meter_readings
            await client.query(
              `INSERT INTO meter_readings (tenant_id, asset_id, meter_type, value, source, is_validated, recorded_at)
               VALUES ($1, $2, $3, $4, 'TELEMATICS_TRACCAR', TRUE, $5)`,
              [tenantId, assetId, asset.primary_meter_type, incomingValue, dto.recordedAt],
            );

            assetUpdateResult = {
              assetId,
              newMeterValue: incomingValue,
              maintenanceTriggered,
            };
          }
        }
      }

      return {
        duplicate: false,
        position: savedPosition,
        assetUpdated: assetUpdateResult,
      };
    });
  }

  /**
   * Supervision de la flotte en direct (Fleet Live)
   */
  async getFleetLive(tenantId: string): Promise<FleetLiveAsset[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `SELECT
           a.id as asset_id,
           a.name as asset_name,
           a.code as asset_code,
           a.category as asset_category,
           a.current_meter_value,
           a.next_maintenance_meter_value,
           a.status as asset_status,
           d.id as device_id,
           d.unique_id as device_unique_id,
           d.status as device_status,
           p.latitude,
           p.longitude,
           p.speed,
           p.ignition,
           p.recorded_at as last_recorded_at
         FROM assets a
         LEFT JOIN asset_device_bindings b ON b.asset_id = a.id AND b.is_active = TRUE
         LEFT JOIN telematics_devices d ON d.id = b.device_id
         LEFT JOIN LATERAL (
           SELECT latitude, longitude, speed, ignition, recorded_at
           FROM telematics_positions
           WHERE asset_id = a.id
           ORDER BY recorded_at DESC
           LIMIT 1
         ) p ON TRUE
         WHERE a.tenant_id = $1
         ORDER BY a.name ASC`,
        [tenantId],
      );

      return res.rows.map((r) => {
        const isDue =
          r.next_maintenance_meter_value &&
          Number(r.current_meter_value) >= Number(r.next_maintenance_meter_value);

        return {
          assetId: r.asset_id,
          assetName: r.asset_name,
          assetCode: r.asset_code,
          assetCategory: r.asset_category,
          deviceId: r.device_id,
          deviceUniqueId: r.device_unique_id,
          deviceStatus: (r.device_status as DeviceStatus) || DeviceStatus.OFFLINE,
          latitude: r.latitude ? Number(r.latitude) : undefined,
          longitude: r.longitude ? Number(r.longitude) : undefined,
          speed: r.speed ? Number(r.speed) : 0,
          ignition: r.ignition === true,
          lastRecordedAt: r.last_recorded_at,
          currentMeterValue: Number(r.current_meter_value),
          nextMaintenanceMeterValue: r.next_maintenance_meter_value
            ? Number(r.next_maintenance_meter_value)
            : undefined,
          maintenanceDue: Boolean(isDue),
        };
      });
    });
  }

  /**
   * État de santé de la passerelle Traccar et de l'ingestion
   */
  async getGatewayHealth(tenantId: string): Promise<TraccarGatewayHealth> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const adapterHealth = await this.traccarAdapter.checkHealth();

      const [devicesCountRes, bindingsCountRes] = await Promise.all([
        client.query(`SELECT COUNT(*) as c FROM telematics_devices WHERE tenant_id = $1`, [tenantId]),
        client.query(`SELECT COUNT(*) as c FROM asset_device_bindings WHERE tenant_id = $1 AND is_active = TRUE`, [tenantId]),
      ]);

      return {
        ...adapterHealth,
        deviceCount: parseInt(devicesCountRes.rows[0].c, 10),
        activeBindingsCount: parseInt(bindingsCountRes.rows[0].c, 10),
      };
    });
  }

  private mapDevice(row: any): TelematicsDevice {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      uniqueId: row.unique_id,
      name: row.name,
      model: row.model,
      status: row.status as DeviceStatus,
      traccarId: row.traccar_id,
      lastUpdate: row.last_update,
      attributes: row.attributes,
      createdAt: row.created_at,
    };
  }

  private mapPosition(row: any): CanonicalPosition {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      traccarPositionId: row.traccar_position_id,
      deviceId: row.device_id,
      assetId: row.asset_id,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      speed: Number(row.speed),
      altitude: row.altitude ? Number(row.altitude) : undefined,
      course: row.course ? Number(row.course) : undefined,
      ignition: Boolean(row.ignition),
      odometerKm: row.odometer_km ? Number(row.odometer_km) : undefined,
      engineHours: row.engine_hours ? Number(row.engine_hours) : undefined,
      recordedAt: row.recorded_at,
      createdAt: row.created_at,
      attributes: row.attributes,
    };
  }
}
