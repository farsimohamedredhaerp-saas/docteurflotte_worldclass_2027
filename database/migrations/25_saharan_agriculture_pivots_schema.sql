-- =============================================================================
-- FICHIER : database/migrations/25_saharan_agriculture_pivots_schema.sql
-- OBJET   : ERP Multi-Activités — Phase 4 : Agriculture Saharienne & Grands Forages
-- SOUVERAINETÉ : Sécurité Alimentaire Nationale (Céréaliculture Grand Sud : Adrar, Timimoun, Biskra, El Oued),
--               Pivots d'Irrigation Circulaires, Pompage Albien (Litres/Heure L/h sans odomètre),
--               Campagnes Moisson-Battage à la tâche (CCLS / OAIC, Hectares & Quintaux)
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Domaines & Exploitations Agricoles Sahariennes
CREATE TABLE IF NOT EXISTS farm_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- ex: DOM-ADR-01
    name VARCHAR(255) NOT NULL, -- ex: Domaine Céréalier Oasis Verte Adrar
    wilaya_code INT NOT NULL,   -- ex: 01 (Adrar), 49 (Timimoun), 07 (Biskra), 39 (El Oued)
    commune VARCHAR(100),
    total_surface_hectares NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ccls_code VARCHAR(100),     -- Code CCLS de rattachement pour collecte OAIC
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_farm_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_farm_tenant ON farm_properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_farm_wilaya ON farm_properties(wilaya_code);

ALTER TABLE farm_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_properties FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS farm_properties_tenant_isolation ON farm_properties;
CREATE POLICY farm_properties_tenant_isolation ON farm_properties
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 2. Table des Pivots d'Irrigation & Stations de Pompage Albien
CREATE TABLE IF NOT EXISTS irrigation_pivots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farm_properties(id) ON DELETE CASCADE,
    pivot_code VARCHAR(50) NOT NULL, -- ex: PIVOT-ADR-01
    name VARCHAR(255) NOT NULL,
    crop_type VARCHAR(50) NOT NULL DEFAULT 'BLE_DUR', -- 'BLE_DUR', 'ORGE', 'MAIS', 'LUZERNE', 'PALMIER_DATTIER'
    surface_hectares NUMERIC(10, 2) NOT NULL DEFAULT 80.00,
    borehole_depth_meters NUMERIC(6, 1) DEFAULT 450.0,
    generator_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- Groupe électrogène diesel associé
    pump_power_kw NUMERIC(6, 1) DEFAULT 110.0,
    nominal_flow_m3_h NUMERIC(8, 2) DEFAULT 180.00,
    nominal_fuel_burn_rate_l_h NUMERIC(6, 2) DEFAULT 32.00,
    status VARCHAR(30) NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'PAUSED', 'MAINTENANCE', 'FAULT'
    total_running_hours NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_water_volume_m3 NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_fuel_consumed_liters NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pivot_code UNIQUE (tenant_id, farm_id, pivot_code)
);

CREATE INDEX IF NOT EXISTS idx_pivots_tenant ON irrigation_pivots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pivots_farm ON irrigation_pivots(farm_id);
CREATE INDEX IF NOT EXISTS idx_pivots_crop ON irrigation_pivots(crop_type);
CREATE INDEX IF NOT EXISTS idx_pivots_status ON irrigation_pivots(status);

ALTER TABLE irrigation_pivots ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_pivots FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS irrigation_pivots_tenant_isolation ON irrigation_pivots;
CREATE POLICY irrigation_pivots_tenant_isolation ON irrigation_pivots
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 3. Table des Relevés Télématiques Forages & Pivots (L/h et Ratio m3 d'eau)
CREATE TABLE IF NOT EXISTS irrigation_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pivot_id UUID NOT NULL REFERENCES irrigation_pivots(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hours_running_delta NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
    fuel_consumed_liters NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    hourly_burn_rate_l_h NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    water_flow_m3_h NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    water_pressure_bar NUMERIC(5, 2) NOT NULL DEFAULT 3.50,
    efficiency_ratio_l_per_m3 NUMERIC(6, 4) NOT NULL DEFAULT 0.0000,
    ambient_temp_c NUMERIC(5, 2),
    is_burn_rate_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_irrig_logs_tenant ON irrigation_telemetry_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_irrig_logs_pivot ON irrigation_telemetry_logs(pivot_id);
CREATE INDEX IF NOT EXISTS idx_irrig_logs_recorded ON irrigation_telemetry_logs(recorded_at DESC);

ALTER TABLE irrigation_telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_telemetry_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS irrigation_logs_tenant_isolation ON irrigation_telemetry_logs;
CREATE POLICY irrigation_logs_tenant_isolation ON irrigation_telemetry_logs
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 4. Table des Campagnes de Moisson-Battage & Travail Agricole à la Tâche
CREATE TABLE IF NOT EXISTS harvest_campaign_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farm_properties(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE, -- Moissonneuse ou Tracteur
    driver_id VARCHAR(100),
    campaign_year INT NOT NULL DEFAULT 2026,
    crop_type VARCHAR(50) NOT NULL DEFAULT 'BLE_DUR',
    task_type VARCHAR(50) NOT NULL DEFAULT 'MOISSON_BATTAGE', -- 'MOISSON_BATTAGE', 'LABOUR_PROFOND', 'SEMIS', 'TRAITEMENT'
    start_date DATE NOT NULL,
    end_date DATE,
    area_worked_hectares NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    yield_quintals NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ccls_delivery_note_ref VARCHAR(100), -- Bon de livraison pesée CCLS
    driver_rate_per_hectare_dzd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    driver_rate_per_quintal_dzd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    driver_payout_dzd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fuel_consumed_liters NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fuel_cost_dzd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cost_per_quintal_dzd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    sha256_proof VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harvest_tenant ON harvest_campaign_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_harvest_farm ON harvest_campaign_logs(farm_id);
CREATE INDEX IF NOT EXISTS idx_harvest_asset ON harvest_campaign_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_harvest_year ON harvest_campaign_logs(campaign_year);

ALTER TABLE harvest_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_campaign_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS harvest_logs_tenant_isolation ON harvest_campaign_logs;
CREATE POLICY harvest_logs_tenant_isolation ON harvest_campaign_logs
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

COMMIT;

