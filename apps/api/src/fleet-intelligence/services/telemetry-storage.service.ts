import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { CanonicalTelemetryEvent } from '../dto/telemetry-ingestion.dto';

export interface BatchPersistResult {
  totalReceived: number;
  insertedCount: number;
  durationMs: number;
  hotPathUpdated: boolean;
}

export interface VehicleDigitalTwinState {
  vehicleId: string;
  tenantId: string;
  lastSeenUtc: string;
  sourceProvider: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  engineState: string;
  odometerKm: number;
  fuelLevelPct: number;
  batteryMv: number;
  oilPressureKpa?: number;
  fuelRateLPerHour?: number;
  retarderTorquePct?: number;
}

@Injectable()
export class TelemetryStorageService implements OnModuleDestroy {
  private readonly logger = new Logger(TelemetryStorageService.name);
  private readonly redis: Redis;
  private readonly pgPool: Pool;

  constructor() {
    const redisUrl =
      process.env.REDIS_URL ||
      (process.env.REDIS_HOST
        ? `redis://${process.env.REDIS_PASSWORD ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@` : ''}${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`
        : 'redis://localhost:6380');

    const dbUrl =
      process.env.DATABASE_URL ||
      (process.env.DATABASE_HOST && process.env.DATABASE_USER && process.env.DATABASE_NAME
        ? `postgresql://${encodeURIComponent(process.env.DATABASE_USER)}${process.env.DATABASE_PASSWORD ? `:${encodeURIComponent(process.env.DATABASE_PASSWORD)}` : ''}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT || '5432'}/${encodeURIComponent(process.env.DATABASE_NAME)}`
        : 'postgresql://docteurflotte:docteurflotte_dev_password_local_only@localhost:5434/docteurflotte_dev');

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
    this.pgPool = new Pool({
      connectionString: dbUrl,
      max: 20,
    });
  }

  async onModuleDestroy() {
    await this.redis.quit().catch(() => null);
    await this.pgPool.end().catch(() => null);
  }

  async resolveImeiToVehicle(imei: string): Promise<{ tenantId: string; vehicleId: string } | null> {
    const cacheKey = `lookup:imei:${imei}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { tenantId: string; vehicleId: string };
        return parsed;
      }

      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', ['app.system_context', 'true']);
        const res = await client.query(
          `SELECT tenant_id::text AS "tenantId", id::text AS "vehicleId"
           FROM vehicles WHERE device_imei = $1 LIMIT 1;`,
          [imei],
        );
        await client.query('COMMIT');
        if (res.rowCount === 0) return null;

        const { tenantId, vehicleId } = res.rows[0] as { tenantId: string; vehicleId: string };
        await this.redis.setex(cacheKey, 3600, JSON.stringify({ tenantId, vehicleId }));
        return { tenantId, vehicleId };
      } catch (dbErr) {
        await client.query('ROLLBACK').catch(() => null);
        throw dbErr;
      } finally {
        client.release();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Fallback résolution IMEI hors-ligne pour ${imei}: ${msg}`);
      return null;
    }
  }

  async getDigitalTwin(tenantId: string, vehicleId: string): Promise<VehicleDigitalTwinState | null> {
    if (!tenantId || !vehicleId) {
      this.logger.warn(`getDigitalTwin appelé sans tenantId ou vehicleId — accès refusé.`);
      return null;
    }
    const twinKey = `vehicle:twin:${tenantId}:${vehicleId}`;
    try {
      const data = await this.redis.hgetall(twinKey);
      if (!data || Object.keys(data).length === 0) {
        return null;
      }
      if (data.tenantId !== tenantId) {
        this.logger.error(
          `SÉCURITÉ : Tentative d'accès cross-tenant détectée — demandé=${tenantId}, stocké=${data.tenantId}, vehicleId=${vehicleId}`,
        );
        return null;
      }
      return {
        vehicleId,
        tenantId: data.tenantId,
        lastSeenUtc: data.lastSeenUtc,
        sourceProvider: data.sourceProvider || 'TRACCAR',
        latitude: Number(data.lat) || 0,
        longitude: Number(data.lon) || 0,
        speedKmh: Number(data.speedKmh) || 0,
        engineState: data.engineState || 'OFF',
        odometerKm: Number(data.odometerKm) || 0,
        fuelLevelPct: Number(data.fuelLevelPct) || 0,
        batteryMv: Number(data.batteryMv) || 0,
        oilPressureKpa: data.oilPressureKpa ? Number(data.oilPressureKpa) : undefined,
        fuelRateLPerHour: data.fuelRateLPerHour ? Number(data.fuelRateLPerHour) : undefined,
        retarderTorquePct: data.retarderTorquePct ? Number(data.retarderTorquePct) : undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erreur lecture Digital Twin Redis [tenant=${tenantId}, vehicle=${vehicleId}]: ${msg}`);
      return null;
    }
  }

  async persistCanonicalEvent(event: CanonicalTelemetryEvent): Promise<void> {
    await this.persistCanonicalEventBatch([event]);
  }

  async persistCanonicalEventBatch(events: CanonicalTelemetryEvent[]): Promise<BatchPersistResult> {
    if (!events || events.length === 0) {
      return { totalReceived: 0, insertedCount: 0, durationMs: 0, hotPathUpdated: false };
    }

    const startTime = Date.now();

    // 1. Hot Path Redis
    try {
      const pipe = this.redis.pipeline();
      const latestEventsPerVehicle = new Map<string, CanonicalTelemetryEvent>();

      for (const evt of events) {
        const existing = latestEventsPerVehicle.get(evt.vehicleId);
        if (!existing || new Date(evt.time).getTime() > new Date(existing.time).getTime()) {
          latestEventsPerVehicle.set(evt.vehicleId, evt);
        }

        const cockpitRoom = `vehicle:cockpit:${evt.tenantId}:${evt.vehicleId}`;
        pipe.publish(cockpitRoom, JSON.stringify(evt));
      }

      latestEventsPerVehicle.forEach((evt, vehicleId) => {
        const twinKey = `vehicle:twin:${evt.tenantId}:${vehicleId}`;
        pipe.hset(twinKey, {
          vehicleId: evt.vehicleId,
          tenantId: evt.tenantId,
          lastSeenUtc: evt.time,
          sourceProvider: evt.sourceProvider,
          lat: String(evt.latitude),
          lon: String(evt.longitude),
          speedKmh: String(evt.speedKmh),
          engineState: evt.engineState,
          odometerKm: String(evt.odometerKm ?? 0),
          fuelLevelPct: String(evt.fuelLevelPct ?? -1),
          batteryMv: String(evt.batteryMv ?? 0),
          oilPressureKpa: String(evt.oilPressureKpa ?? 0),
          fuelRateLPerHour: String(evt.fuelRateLPerHour ?? 0),
          retarderTorquePct: String(evt.retarderTorquePct ?? 0),
        });
        pipe.expire(twinKey, 86400 * 3);

        const overviewRoom = `fleet:overview:${evt.tenantId}`;
        const overviewSummary = JSON.stringify({
          vehicleId: evt.vehicleId,
          lat: evt.latitude,
          lon: evt.longitude,
          speedKmh: evt.speedKmh,
          engineState: evt.engineState,
          time: evt.time,
        });
        pipe.publish(overviewRoom, overviewSummary);
      });

      await pipe.exec();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erreur Redis Hot Path Pipeline: ${msg}`);
    }

    // 2. Cold Path TimescaleDB : Bulk Insert via UNNEST typé
    const client = await this.pgPool.connect();
    let insertedCount = 0;

    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.system_context', 'true']);
      if (events.length === 1) {
        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_tenant_id',
          events[0].tenantId,
        ]);
      }

      const times: string[] = [];
      const tenantIds: string[] = [];
      const vehicleIds: string[] = [];
      const sourceProviders: string[] = [];
      const latitudes: number[] = [];
      const longitudes: number[] = [];
      const altitudes: (number | null)[] = [];
      const speeds: number[] = [];
      const headings: (number | null)[] = [];
      const ignitions: boolean[] = [];
      const engineStates: string[] = [];
      const odometers: (number | null)[] = [];
      const engineHours: (number | null)[] = [];
      const rpms: (number | null)[] = [];
      const loads: (number | null)[] = [];
      const coolants: (number | null)[] = [];
      const ambients: (number | null)[] = [];
      const batteries: (number | null)[] = [];
      const fuelLevels: (number | null)[] = [];
      const fuelsUsed: (number | null)[] = [];
      const defLevels: (number | null)[] = [];
      const oilPressures: (number | null)[] = [];
      const fuelRates: (number | null)[] = [];
      const retarders: (number | null)[] = [];
      const ptos: boolean[] = [];
      const harshEvents: (string | null)[] = [];
      const dtcCodesJson: string[] = [];
      const extraSensorsJson: string[] = [];

      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        times.push(e.time);
        tenantIds.push(e.tenantId);
        vehicleIds.push(e.vehicleId);
        sourceProviders.push(e.sourceProvider);
        latitudes.push(e.latitude);
        longitudes.push(e.longitude);
        altitudes.push(e.altitudeM ?? null);
        speeds.push(e.speedKmh);
        headings.push(e.headingDeg ?? null);
        ignitions.push(e.ignitionOn);
        engineStates.push(e.engineState);
        odometers.push(e.odometerKm ?? null);
        engineHours.push(e.engineHoursSec ?? null);
        rpms.push(e.engineRpm ?? null);
        loads.push(e.engineLoadPct ?? null);
        coolants.push(e.coolantTempC ?? null);
        ambients.push(e.ambientTempC ?? null);
        batteries.push(e.batteryMv ?? null);
        fuelLevels.push(e.fuelLevelPct ?? null);
        fuelsUsed.push(e.fuelUsedTotalL ?? null);
        defLevels.push(e.defLevelPct ?? null);
        oilPressures.push(e.oilPressureKpa ?? null);
        fuelRates.push(e.fuelRateLPerHour ?? null);
        retarders.push(e.retarderTorquePct ?? null);
        ptos.push(e.ptoEngaged ?? false);
        harshEvents.push(e.harshEvent ?? null);
        dtcCodesJson.push(JSON.stringify(e.dtcCodes || []));
        extraSensorsJson.push(JSON.stringify(e.extraIotSensors || {}));
      }

      const bulkInsertSql = `
        INSERT INTO telemetry_events (
          time, tenant_id, vehicle_id, source_provider,
          latitude, longitude, altitude_m, speed_kmh, heading_deg,
          ignition_on, engine_state, odometer_km, engine_hours_s,
          engine_rpm, engine_load_pct, coolant_temp_c, ambient_temp_c,
          battery_mv, fuel_level_pct, fuel_used_total_l, def_level_pct,
          oil_pressure_kpa, fuel_rate_l_h, retarder_torque_pct,
          pto_engaged, harsh_event, dtc_codes, extra_iot_sensors
        )
        SELECT * FROM UNNEST(
          $1::timestamptz[],
          $2::uuid[],
          $3::uuid[],
          $4::varchar[],
          $5::float8[],
          $6::float8[],
          $7::numeric[],
          $8::numeric[],
          $9::numeric[],
          $10::boolean[],
          $11::varchar[],
          $12::numeric[],
          $13::bigint[],
          $14::int[],
          $15::int[],
          $16::int[],
          $17::int[],
          $18::int[],
          $19::numeric[],
          $20::numeric[],
          $21::numeric[],
          $22::numeric[],
          $23::numeric[],
          $24::int[],
          $25::boolean[],
          $26::varchar[],
          $27::jsonb[],
          $28::jsonb[]
        )
        ON CONFLICT (time, tenant_id, vehicle_id) DO NOTHING;
      `;

      const insertRes = await client.query(bulkInsertSql, [
        times,
        tenantIds,
        vehicleIds,
        sourceProviders,
        latitudes,
        longitudes,
        altitudes,
        speeds,
        headings,
        ignitions,
        engineStates,
        odometers,
        engineHours,
        rpms,
        loads,
        coolants,
        ambients,
        batteries,
        fuelLevels,
        fuelsUsed,
        defLevels,
        oilPressures,
        fuelRates,
        retarders,
        ptos,
        harshEvents,
        dtcCodesJson,
        extraSensorsJson,
      ]);

      insertedCount = insertRes.rowCount || events.length;

      const vehicleUpdates = new Map<string, { maxOdo: number; maxHours: number }>();
      for (const e of events) {
        const odo = e.odometerKm ?? 0;
        const hours = e.engineHoursSec ? e.engineHoursSec / 3600.0 : 0;
        const current = vehicleUpdates.get(e.vehicleId);
        if (!current) {
          vehicleUpdates.set(e.vehicleId, { maxOdo: odo, maxHours: hours });
        } else {
          current.maxOdo = Math.max(current.maxOdo, odo);
          current.maxHours = Math.max(current.maxHours, hours);
        }
      }

      if (vehicleUpdates.size > 0) {
        const updVehIds: string[] = [];
        const updOdos: number[] = [];
        const updHours: number[] = [];

        vehicleUpdates.forEach((v, vId) => {
          updVehIds.push(vId);
          updOdos.push(v.maxOdo);
          updHours.push(Number(v.maxHours.toFixed(2)));
        });

        await client.query(
          `UPDATE vehicles AS v
           SET
             current_odometer_km = GREATEST(v.current_odometer_km, b.odo),
             current_engine_hours = GREATEST(v.current_engine_hours, b.hours),
             updated_at = NOW()
           FROM (
             SELECT
               UNNEST($1::uuid[]) AS id,
               UNNEST($2::numeric[]) AS odo,
               UNNEST($3::numeric[]) AS hours
           ) AS b
           WHERE v.id = b.id;`,
          [updVehIds, updOdos, updHours],
        );
      }

      await client.query('COMMIT');
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erreur transaction Bulk UNNEST TimescaleDB: ${msg}`);
      throw err;
    } finally {
      client.release();
    }

    const durationMs = Date.now() - startTime;
    this.logger.debug(
      `Micro-Batch exécuté : ${events.length} trames absorbées en ${durationMs}ms (débit: ${(
        (events.length / Math.max(1, durationMs)) *
        1000
      ).toFixed(0)} msg/s).`,
    );

    return {
      totalReceived: events.length,
      insertedCount,
      durationMs,
      hotPathUpdated: true,
    };
  }
}
