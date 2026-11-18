import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { TmdDriversService } from './tmd-drivers.service';
import { TankerCompartmentsService } from './tanker-compartments.service';
import {
  TmdTransportMission,
  CreateTmdTransportMissionDto,
  TmdMissionStatus,
} from '@docteurflotte/contracts';

@Injectable()
export class TmdMissionsService {
  private readonly logger = new Logger(TmdMissionsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly driversService: TmdDriversService,
    private readonly compartmentsService: TankerCompartmentsService,
  ) {}

  async createMission(
    tenantId: string,
    dto: CreateTmdTransportMissionDto,
  ): Promise<TmdTransportMission> {
    if (!dto.missionCode || !dto.assetId || !dto.driverCertificationId || !dto.totalVolumeLiters) {
      throw new BadRequestException('Code mission, camion-citerne, chauffeur TMD et volume total obligatoires.');
    }

    // 1. RÈGLE DÉTERMINISTE 1 : Éligibilité Réglementaire du Chauffeur (Brevet TMD)
    const driverCheck = await this.driversService.checkDriverEligibility(tenantId, dto.driverCertificationId);
    if (!driverCheck.eligible) {
      throw new BadRequestException(`BLOCAGE MISSION TMD : ${driverCheck.reason}`);
    }

    // 2. RÈGLE DÉTERMINISTE 2 : Épreuve Hydrostatique APAVE / ENACTA Citerne
    const tankerCheck = await this.compartmentsService.checkTankerApaveStatus(tenantId, dto.assetId);
    if (!tankerCheck.compliant) {
      throw new BadRequestException(`BLOCAGE MISSION TMD : ${tankerCheck.reason}`);
    }

    // 3. RÈGLE DÉTERMINISTE 3 : Équipements de Sécurité Incendie & Antistatique
    const fireExtinguishers = dto.fireExtinguishersChecked ?? true;
    const groundingBraid = dto.groundingBraidConnected ?? true;

    if (!fireExtinguishers || !groundingBraid) {
      throw new BadRequestException(
        'BLOCAGE MISSION TMD : Extincteurs 6kg non certifiés ou tresse de masse antistatique non reliée.',
      );
    }

    // 4. Scellement Cryptographique SHA-256 Immuable
    const payloadForSeal = `${tenantId}:${dto.missionCode}:${dto.assetId}:${dto.driverCertificationId}:${dto.totalVolumeLiters}:${Date.now()}`;
    const sha256Seal = createHash('sha256').update(payloadForSeal).digest('hex');

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO tmd_transport_missions (
          tenant_id, mission_code, asset_id, driver_certification_id,
          origin_depot_name, destination_station_name, authorized_route,
          total_volume_liters, fire_extinguishers_checked, grounding_braid_connected,
          status, unauthorized_valve_opened, departure_time, sha256_audit_seal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
        RETURNING *`,
        [
          tenantId,
          dto.missionCode.trim().toUpperCase(),
          dto.assetId,
          dto.driverCertificationId,
          dto.originDepotName.trim(),
          dto.destinationStationName.trim(),
          dto.authorizedRoute || null,
          dto.totalVolumeLiters,
          fireExtinguishers,
          groundingBraid,
          TmdMissionStatus.AUTHORIZED,
          false,
          sha256Seal,
        ],
      );

      return this.mapMission(res.rows[0]);
    });
  }

  async recordValveOpening(
    tenantId: string,
    missionId: string,
    isWithinAuthorizedGeofence: boolean,
  ): Promise<TmdTransportMission> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const existing = await client.query(
        `SELECT * FROM tmd_transport_missions WHERE id = $1 AND tenant_id = $2`,
        [missionId, tenantId],
      );
      if (existing.rows.length === 0) {
        throw new NotFoundException(`Mission TMD ${missionId} introuvable.`);
      }

      const isUnauthorized = !isWithinAuthorizedGeofence;
      if (isUnauthorized) {
        this.logger.warn(
          `🚨 ALERTE CRITIQUE TMD : Ouverture de vanne de dépotage hors zone géofencée pour la mission ${missionId} !`,
        );
      }

      const res = await client.query(
        `UPDATE tmd_transport_missions SET
          unauthorized_valve_opened = $1,
          status = CASE WHEN $1 = true THEN 'BLOCKED_NON_COMPLIANT' ELSE status END
        WHERE id = $2 AND tenant_id = $3
        RETURNING *`,
        [isUnauthorized, missionId, tenantId],
      );

      return this.mapMission(res.rows[0]);
    });
  }

  async listMissions(
    tenantId: string,
    params?: { assetId?: string; status?: TmdMissionStatus },
  ): Promise<TmdTransportMission[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `SELECT * FROM tmd_transport_missions WHERE tenant_id = $1`;
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

      query += ` ORDER BY created_at DESC`;
      const res = await client.query(query, values);
      return res.rows.map((r) => this.mapMission(r));
    });
  }

  private mapMission(row: any): TmdTransportMission {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      missionCode: row.mission_code,
      assetId: row.asset_id,
      driverCertificationId: row.driver_certification_id,
      originDepotName: row.origin_depot_name,
      destinationStationName: row.destination_station_name,
      authorizedRoute: row.authorized_route,
      totalVolumeLiters: parseFloat(row.total_volume_liters),
      fireExtinguishersChecked: row.fire_extinguishers_checked,
      groundingBraidConnected: row.grounding_braid_connected,
      status: row.status as TmdMissionStatus,
      unauthorizedValveOpened: row.unauthorized_valve_opened,
      departureTime: row.departure_time?.toISOString?.() || row.departure_time,
      arrivalTime: row.arrival_time?.toISOString?.() || row.arrival_time,
      sha256AuditSeal: row.sha256_audit_seal,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
    };
  }
}

