-- =============================================================================
-- FICHIER : database/migrations/26_mining_quarries_otr_tires_schema.sql
-- OBJET   : ERP Multi-Activités — Phase 4 : Mines, Carrières & Pneumatiques Hors-Route (OTR)
-- SOUVERAINETÉ : Grands Gisements Miniers Nationaux (Gâra Djebilet Tindouf, Bled El Hadba Tébessa, Cimenteries GICA/Lafarge),
--               Engins d'Extraction Lourds (Dumpers 50T-100T Cat/Komatsu),
--               Algorithme Physique Déterministe TKPH (Tonnes-Kilomètres Par Heure) Anti-Éclatement Thermique,
--               Coût de Revient par Tonne Transportée (DZD/Tonne) & Standby de Refroidissement Prescriptif.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Sites Miniers, Carrières & Cimenteries
CREATE TABLE IF NOT EXISTS mining_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- ex: MINE-TIN-01
    name VARCHAR(255) NOT NULL, -- ex: Gisement de Fer Gâra Djebilet (Tindouf)
    wilaya_code INT NOT NULL,   -- ex: 50 (Tindouf), 12 (Tébessa), 28 (M'Sila), 07 (Biskra)
    commune VARCHAR(100),
    site_type VARCHAR(50) NOT NULL DEFAULT 'IRON_ORE', -- IRON_ORE, PHOSPHATE, AGGREGATES_QUARRY, CEMENT_PLANT, MARBLE
    ambient_temp_summer_c NUMERIC(4, 1) NOT NULL DEFAULT 45.0,
    average_haul_distance_km NUMERIC(6, 2) NOT NULL DEFAULT 3.50,
    piste_gradient_max_pct NUMERIC(4, 1) NOT NULL DEFAULT 10.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mining_site_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_mining_site_tenant ON mining_sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mining_site_wilaya ON mining_sites(wilaya_code);

ALTER TABLE mining_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_sites FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mining_sites_tenant_isolation ON mining_sites;
CREATE POLICY mining_sites_tenant_isolation ON mining_sites
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 2. Table des Pneumatiques Hors-Route (OTR Tires) Haute Valeur
CREATE TABLE IF NOT EXISTS otr_tires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    serial_number VARCHAR(100) NOT NULL, -- Numéro de série unique vulcanisé sur le pneu
    brand VARCHAR(100) NOT NULL,        -- Michelin, Bridgestone, Goodyear, Triangle
    model_pattern VARCHAR(100),         -- ex: XDR 3, V-STEEL, E4 ROCK
    dimension VARCHAR(50) NOT NULL,     -- ex: 27.00R49, 33.00R51, 40.00R57
    position VARCHAR(20) NOT NULL,      -- FL (Front Left), FR (Front Right), RLO, RLI, RRO, RRI
    nominal_tkph INT NOT NULL DEFAULT 350, -- TKPH Constructeur à 38°C standard
    purchase_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 2800000.00, -- Coût acquisition unitaire (2.8M DZD standard)
    tread_depth_initial_mm NUMERIC(5, 1) NOT NULL DEFAULT 85.0,
    tread_depth_current_mm NUMERIC(5, 1) NOT NULL DEFAULT 72.0,
    current_pressure_bar NUMERIC(4, 2) DEFAULT 7.20,
    current_temp_c NUMERIC(5, 1) DEFAULT 68.0,
    total_operating_hours NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'MOUNTED', -- MOUNTED, COOLING_STANDBY, REPAIR, SCRAPPED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_otr_serial UNIQUE (tenant_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_otr_tires_tenant ON otr_tires(tenant_id);
CREATE INDEX IF NOT EXISTS idx_otr_tires_asset ON otr_tires(asset_id);
CREATE INDEX IF NOT EXISTS idx_otr_tires_status ON otr_tires(status);

ALTER TABLE otr_tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE otr_tires FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS otr_tires_tenant_isolation ON otr_tires;
CREATE POLICY otr_tires_tenant_isolation ON otr_tires
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 3. Table des Cycles de Roulage & Roulage Dumper (Hauling Cycles & Déterminisme TKPH)
CREATE TABLE IF NOT EXISTS dumper_hauling_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES mining_sites(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    driver_id VARCHAR(100),
    cycle_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cycle_duration_minutes NUMERIC(6, 1) NOT NULL,
    cycle_distance_km NUMERIC(6, 2) NOT NULL,
    payload_metric_tons NUMERIC(8, 2) NOT NULL,
    fuel_consumed_liters NUMERIC(8, 2) NOT NULL,
    calculated_tkph NUMERIC(8, 2) NOT NULL,
    tkph_admissible NUMERIC(8, 2) NOT NULL,
    is_tkph_exceeded BOOLEAN NOT NULL DEFAULT FALSE,
    cost_per_ton_dzd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cooling_standby_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dumper_cycles_tenant ON dumper_hauling_cycles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dumper_cycles_asset ON dumper_hauling_cycles(asset_id);
CREATE INDEX IF NOT EXISTS idx_dumper_cycles_site ON dumper_hauling_cycles(site_id);
CREATE INDEX IF NOT EXISTS idx_dumper_cycles_timestamp ON dumper_hauling_cycles(cycle_timestamp);

ALTER TABLE dumper_hauling_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dumper_hauling_cycles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dumper_hauling_cycles_tenant_isolation ON dumper_hauling_cycles;
CREATE POLICY dumper_hauling_cycles_tenant_isolation ON dumper_hauling_cycles
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

COMMIT;

