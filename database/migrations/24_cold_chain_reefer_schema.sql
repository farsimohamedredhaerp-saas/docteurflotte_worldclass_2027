-- =============================================================================
-- FICHIER : database/migrations/24_cold_chain_reefer_schema.sql
-- OBJET   : ERP Multi-Activités — Phase 3 : Chaîne du Froid & Groupes Bi-Moteurs (Reefers)
-- SOUVERAINETÉ : Arrêté Interministériel du 21 Safar 1414, Normes DSV / ATP Algérie,
--               Traçabilité Thermique HACCP, Télémétrie Bi-Moteur (Traction + Froid)
--               Réservoir Carburant Auxiliaire Dédié (200 L) & Prévention Fraude Froid
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Unités / Caisses Frigorifiques (Reefer Units)
CREATE TABLE IF NOT EXISTS reefer_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    unit_code VARCHAR(50) NOT NULL, -- ex: REEF-LAMB-16-01
    make_model VARCHAR(100) NOT NULL, -- ex: Carrier Vector 1550, Thermo King SLXi 300
    serial_number VARCHAR(100),
    atp_certificate_number VARCHAR(100), -- Agrément Sanitaire ATP Vétérinaire
    atp_expiry_date DATE,
    auxiliary_tank_capacity_liters NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    auxiliary_fuel_level_liters NUMERIC(10, 2) NOT NULL DEFAULT 180.00,
    engine_hours_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    electric_hours_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    default_cargo_type VARCHAR(50) NOT NULL DEFAULT 'DAIRY',
    target_setpoint_temp_c NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reefer_unit_code UNIQUE (tenant_id, unit_code)
);

CREATE INDEX IF NOT EXISTS idx_reefer_units_tenant ON reefer_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reefer_units_asset ON reefer_units(asset_id);
CREATE INDEX IF NOT EXISTS idx_reefer_units_cargo ON reefer_units(default_cargo_type);

ALTER TABLE reefer_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE reefer_units FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reefer_units_tenant_isolation ON reefer_units;
CREATE POLICY reefer_units_tenant_isolation ON reefer_units
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 2. Table des Relevés Télématiques Haute Fréquence Frigo (Reefer Telemetry Logs)
CREATE TABLE IF NOT EXISTS reefer_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reefer_unit_id UUID NOT NULL REFERENCES reefer_units(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cargo_type VARCHAR(50) NOT NULL,
    setpoint_temp_c NUMERIC(5, 2) NOT NULL,
    supply_temp_c NUMERIC(5, 2) NOT NULL, -- Soufflage évaporateur
    return_temp_c NUMERIC(5, 2) NOT NULL, -- Reprise caisse
    ambient_temp_c NUMERIC(5, 2),        -- Température extérieure saharienne/côtière
    power_mode VARCHAR(30) NOT NULL DEFAULT 'DIESEL', -- 'DIESEL', 'ELECTRIC_STANDBY', 'OFF'
    door_open BOOLEAN NOT NULL DEFAULT FALSE,
    defrost_active BOOLEAN NOT NULL DEFAULT FALSE,
    auxiliary_fuel_level_liters NUMERIC(10, 2),
    reefer_engine_hours NUMERIC(10, 2),
    is_within_safe_range BOOLEAN NOT NULL,
    temp_delta_c NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    excursion_duration_minutes INT NOT NULL DEFAULT 0,
    financial_risk_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    alarm_codes JSONB DEFAULT '[]'::jsonb,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reefer_telemetry_tenant ON reefer_telemetry_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reefer_telemetry_unit ON reefer_telemetry_logs(reefer_unit_id);
CREATE INDEX IF NOT EXISTS idx_reefer_telemetry_asset ON reefer_telemetry_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_reefer_telemetry_recorded ON reefer_telemetry_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_reefer_telemetry_safe ON reefer_telemetry_logs(is_within_safe_range);

ALTER TABLE reefer_telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reefer_telemetry_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reefer_telemetry_tenant_isolation ON reefer_telemetry_logs;
CREATE POLICY reefer_telemetry_tenant_isolation ON reefer_telemetry_logs
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 3. Table des Certificats de Traçabilité Sanitaire HACCP & ATP (Opposable DSV / Assurances)
CREATE TABLE IF NOT EXISTS reefer_haccp_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    certificate_ref VARCHAR(100) NOT NULL, -- ex: CERT-HACCP-2026-ALG-0492
    reefer_unit_id UUID NOT NULL REFERENCES reefer_units(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    mission_ref VARCHAR(100),
    cargo_type VARCHAR(50) NOT NULL,
    cargo_description TEXT,
    departure_wilaya INT NOT NULL,
    arrival_wilaya INT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ,
    min_temp_recorded_c NUMERIC(5, 2) NOT NULL,
    max_temp_recorded_c NUMERIC(5, 2) NOT NULL,
    average_temp_c NUMERIC(5, 2) NOT NULL,
    total_excursion_minutes INT NOT NULL DEFAULT 0,
    compliance_status VARCHAR(50) NOT NULL DEFAULT 'CONFORME_HACCP', -- 'CONFORME_HACCP', 'NON_CONFORME_EXCURSION', 'ALERTE_PORTE_PROLONGEE'
    sanitary_verdict TEXT NOT NULL,
    auxiliary_fuel_consumed_liters NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    auxiliary_fuel_cost_dzd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sha256_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_haccp_certificate_ref UNIQUE (tenant_id, certificate_ref)
);

CREATE INDEX IF NOT EXISTS idx_haccp_certs_tenant ON reefer_haccp_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_haccp_certs_unit ON reefer_haccp_certificates(reefer_unit_id);
CREATE INDEX IF NOT EXISTS idx_haccp_certs_status ON reefer_haccp_certificates(compliance_status);

ALTER TABLE reefer_haccp_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reefer_haccp_certificates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reefer_haccp_certs_tenant_isolation ON reefer_haccp_certificates;
CREATE POLICY reefer_haccp_certs_tenant_isolation ON reefer_haccp_certificates
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

COMMIT;

