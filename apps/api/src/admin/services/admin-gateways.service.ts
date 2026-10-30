import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PlatformTelematicsGateway } from '@docteurflotte/contracts';

@Injectable()
export class AdminGatewaysService {
  private readonly logger = new Logger(AdminGatewaysService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getGateways(): Promise<PlatformTelematicsGateway[]> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(`
      SELECT * 
      FROM platform_telematics_gateways 
      ORDER BY name ASC
    `);

    return res.rows.map((r) => ({
      ...r,
      api_port: Number(r.api_port),
      max_packets_per_sec: Number(r.max_packets_per_sec),
      current_latency_ms: Number(r.current_latency_ms),
    }));
  }

  async updateGateway(
    id: string,
    dto: Partial<PlatformTelematicsGateway>,
    actorEmail: string
  ): Promise<PlatformTelematicsGateway> {
    const pool = this.databaseService.getPool();
    if (!pool) throw new Error('Database unavailable');

    const res = await pool.query(
      `UPDATE platform_telematics_gateways
       SET health_status = COALESCE($1, health_status),
           is_active_gateway = COALESCE($2, is_active_gateway),
           current_latency_ms = COALESCE($3, current_latency_ms),
           last_heartbeat_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [dto.health_status, dto.is_active_gateway, dto.current_latency_ms, id]
    );

    // Audit log
    await pool.query(
      `INSERT INTO platform_audit_logs (actor_email, action, target_entity, target_id, after_state, notes)
       VALUES ($1, 'UPDATE_GATEWAY', 'platform_telematics_gateways', $2, $3, $4)`,
      [
        actorEmail,
        id,
        JSON.stringify(res.rows[0]),
        `Mise à jour de la passerelle ${res.rows[0]?.name}`,
      ]
    );

    return {
      ...res.rows[0],
      api_port: Number(res.rows[0].api_port),
      max_packets_per_sec: Number(res.rows[0].max_packets_per_sec),
      current_latency_ms: Number(res.rows[0].current_latency_ms),
    };
  }
}
