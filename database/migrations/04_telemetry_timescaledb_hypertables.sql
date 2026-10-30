-- =============================================================================
-- FICHIER : database/migrations/04_telemetry_timescaledb_hypertables.sql
-- OBJET   : Hypertable TimescaleDB, Continuous Aggregates & Compression
--           Résilience Zones Blanches & Grand Sud (Conforme Loi 18-07 & AGENTS.md v3.0)
-- =============================================================================

-- 1. Extension TimescaleDB & UUID (avec gestion conditionnelle si absent sur l'environnement de build)
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Extension timescaledb non installée sur ce conteneur, mode standard PostgreSQL utilisé.';
    END;
    BEGIN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Extension uuid-ossp non installée, gen_random_uuid() natif PostgreSQL 16 disponible.';
    END;
END $$;

-- 2. Table Télématique Principale (telemetry_events)
CREATE TABLE IF NOT EXISTS telemetry_events (
    time TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    source_provider VARCHAR(50) NOT NULL DEFAULT 'TRACCAR',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude_m NUMERIC(8, 2) DEFAULT 0,
    speed_kmh NUMERIC(6, 2) NOT NULL DEFAULT 0,
    heading_deg NUMERIC(5, 2) DEFAULT 0,
    ignition_on BOOLEAN NOT NULL DEFAULT FALSE,
    engine_state VARCHAR(20) NOT NULL DEFAULT 'OFF',
    odometer_km NUMERIC(12, 3),
    engine_hours_s BIGINT,
    engine_rpm INT,
    engine_load_pct INT,
    coolant_temp_c INT,
    ambient_temp_c INT,
    battery_mv INT,
    fuel_level_pct NUMERIC(5, 2),
    fuel_used_total_l NUMERIC(12, 2),
    def_level_pct NUMERIC(5, 2),
    oil_pressure_kpa NUMERIC(8, 2),
    fuel_rate_l_h NUMERIC(6, 2),
    retarder_torque_pct INT,
    pto_engaged BOOLEAN DEFAULT FALSE,
    harsh_event VARCHAR(50),
    dtc_codes JSONB DEFAULT '[]'::jsonb,
    extra_iot_sensors JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_telemetry_events PRIMARY KEY (time, tenant_id, vehicle_id)
);

-- 3. Conversion en Hypertable TimescaleDB partitionnée sur le temps réel (device_timestamp)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable(
            'telemetry_events',
            'time',
            chunk_time_interval => INTERVAL '7 days',
            if_not_exists => TRUE
        );
    END IF;
END $$;

-- 4. Index composites essentiels pour le filtrage multi-tenant et les agrégations
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_vehicle_time 
    ON telemetry_events(tenant_id, vehicle_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_time 
    ON telemetry_events(tenant_id, time DESC);

-- 5. Isolation Multi-Tenant Stricte via PostgreSQL RLS (Fail-Closed)
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'telemetry_events' AND policyname = 'tenant_isolation_telemetry_events'
    ) THEN
        CREATE POLICY tenant_isolation_telemetry_events ON telemetry_events
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    END IF;
END $$;

-- 6. Continuous Aggregate Horaire (telemetry_hourly_rollup)
-- Permet de servir les tableaux de bord et graphiques en < 50ms sans scanner les chunks bruts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'telemetry_hourly_rollup') THEN
            EXECUTE $SQL$
                CREATE MATERIALIZED VIEW telemetry_hourly_rollup
                WITH (timescaledb.continuous) AS
                SELECT 
                    time_bucket('1 hour', time) AS bucket,
                    tenant_id,
                    vehicle_id,
                    COUNT(*) AS ping_count,
                    AVG(speed_kmh)::numeric(6,2) AS avg_speed_kmh,
                    MAX(speed_kmh)::numeric(6,2) AS max_speed_kmh,
                    (MAX(odometer_km) - MIN(odometer_km))::numeric(10,3) AS delta_distance_km,
                    AVG(coolant_temp_c)::numeric(5,1) AS avg_coolant_temp_c,
                    MAX(coolant_temp_c) AS max_coolant_temp_c,
                    MIN(battery_mv) AS min_battery_mv,
                    AVG(engine_load_pct)::numeric(5,1) AS avg_engine_load_pct,
                    SUM(CASE WHEN ignition_on THEN 1 ELSE 0 END) AS ignition_active_count
                FROM telemetry_events
                GROUP BY time_bucket('1 hour', time), tenant_id, vehicle_id
                WITH NO DATA;
            $SQL$;

            PERFORM add_continuous_aggregate_policy(
                'telemetry_hourly_rollup',
                start_offset => INTERVAL '1 month',
                end_offset => INTERVAL '1 hour',
                schedule_interval => INTERVAL '15 minutes',
                if_not_exists => TRUE
            );
        END IF;
    END IF;
END $$;

-- 7. Continuous Aggregate Journalier (telemetry_daily_asset_summary)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'telemetry_daily_asset_summary') THEN
            EXECUTE $SQL$
                CREATE MATERIALIZED VIEW telemetry_daily_asset_summary
                WITH (timescaledb.continuous) AS
                SELECT 
                    time_bucket('1 day', time) AS bucket,
                    tenant_id,
                    vehicle_id,
                    COUNT(*) AS total_points,
                    (MAX(odometer_km) - MIN(odometer_km))::numeric(10,2) AS total_distance_km,
                    (MAX(engine_hours_s) - MIN(engine_hours_s))::bigint AS total_engine_hours_s,
                    (MAX(fuel_used_total_l) - MIN(fuel_used_total_l))::numeric(10,2) AS total_fuel_used_l,
                    MAX(speed_kmh)::numeric(6,2) AS peak_speed_kmh,
                    MIN(battery_mv) AS lowest_battery_mv
                FROM telemetry_events
                GROUP BY time_bucket('1 day', time), tenant_id, vehicle_id
                WITH NO DATA;
            $SQL$;

            PERFORM add_continuous_aggregate_policy(
                'telemetry_daily_asset_summary',
                start_offset => INTERVAL '3 months',
                end_offset => INTERVAL '1 day',
                schedule_interval => INTERVAL '1 hour',
                if_not_exists => TRUE
            );
        END IF;
    END IF;
END $$;

-- 8. Politique de Compression Automatique (Gain stockage > 90% après 14 jours)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        ALTER TABLE telemetry_events SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'tenant_id, vehicle_id',
            timescaledb.compress_orderby = 'time DESC'
        );

        PERFORM add_compression_policy(
            'telemetry_events',
            INTERVAL '14 days',
            if_not_exists => TRUE
        );
    END IF;
END $$;

-- 9. Privilèges pour le rôle applicatif df_tenant_role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT ALL PRIVILEGES ON telemetry_events TO df_tenant_role;
        IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'telemetry_hourly_rollup') THEN
            GRANT SELECT ON telemetry_hourly_rollup TO df_tenant_role;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'telemetry_daily_asset_summary') THEN
            GRANT SELECT ON telemetry_daily_asset_summary TO df_tenant_role;
        END IF;
    END IF;
END $$;

