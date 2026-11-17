-- =============================================================================
-- FICHIER : database/migrations/23_multi_consumables_and_work_situations.sql
-- OBJET   : ERP Multi-Activités — Phase 2 : BTPH & Matrice Multi-Consommables
-- SOUVERAINETÉ : DGI Algérie, Décret 15-247 (Retenue de garantie 5%),
--               Art. 14 CTCA (TVA Travaux à l'encaissement - Compte 445780),
--               Multi-Fluides (Gasoil, Sirghaz GPLc, Essence, Huiles ISO 46/68, 15W40, AdBlue)
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enrichissement Multi-Consommables sur les Relevés d'Actifs (asset_engine_hour_logs)
ALTER TABLE asset_engine_hour_logs
    ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(30) NOT NULL DEFAULT 'GASOIL',
    ADD COLUMN IF NOT EXISTS hydraulic_oil_liters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hydraulic_oil_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engine_oil_liters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engine_oil_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS adblue_liters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS adblue_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS coolant_liters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_consumables_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0;

-- 2. Table des Cuves, Citernes Mobiles & Stocks Fluides de Chantier
CREATE TABLE IF NOT EXISTS site_consumable_tanks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES site_workspaces(id) ON DELETE CASCADE,
    tank_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    consumable_type VARCHAR(50) NOT NULL, -- 'GASOIL', 'SIRGHAZ_GPL', 'ESSENCE_SP', 'HUILE_HYDRAULIQUE_ISO46', 'HUILE_MOTEUR_15W40', 'ADBLUE'
    capacity_liters NUMERIC(12, 2) NOT NULL,
    current_level_liters NUMERIC(12, 2) NOT NULL DEFAULT 0,
    alert_low_level_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    unit_cost_ref_dzd NUMERIC(12, 2) NOT NULL DEFAULT 29.00,
    last_delivery_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_site_tank_code UNIQUE (tenant_id, site_id, tank_code)
);

CREATE INDEX IF NOT EXISTS idx_site_tanks_tenant ON site_consumable_tanks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_tanks_site ON site_consumable_tanks(site_id);
CREATE INDEX IF NOT EXISTS idx_site_tanks_type ON site_consumable_tanks(consumable_type);

ALTER TABLE site_consumable_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_consumable_tanks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_tanks_tenant_isolation ON site_consumable_tanks;
CREATE POLICY site_tanks_tenant_isolation ON site_consumable_tanks
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON site_consumable_tanks TO df_tenant_role;
    END IF;
END $$;

-- 3. Table des Réceptions & Livraisons de Carburants / Fluides de Chantier (BL Naftal)
CREATE TABLE IF NOT EXISTS site_consumable_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES site_workspaces(id) ON DELETE CASCADE,
    tank_id UUID REFERENCES site_consumable_tanks(id) ON DELETE SET NULL,
    delivery_note_ref VARCHAR(100) NOT NULL, -- Réf BL Naftal ou distributeur
    delivery_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    supplier_name VARCHAR(255) NOT NULL DEFAULT 'NAFTAL',
    supplier_nif VARCHAR(50),
    consumable_type VARCHAR(50) NOT NULL,
    volume_liters NUMERIC(12, 2) NOT NULL CHECK (volume_liters > 0),
    density NUMERIC(6, 4), -- Densité mesurée à 15°C
    unit_price_ht_dzd NUMERIC(12, 4) NOT NULL,
    total_ht_dzd NUMERIC(15, 2) NOT NULL,
    vat_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 19.00,
    vat_amount_dzd NUMERIC(15, 2) NOT NULL,
    total_ttc_dzd NUMERIC(15, 2) NOT NULL,
    sha256_proof VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_site_delivery_ref UNIQUE (tenant_id, delivery_note_ref)
);

CREATE INDEX IF NOT EXISTS idx_site_deliveries_tenant ON site_consumable_deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_deliveries_site ON site_consumable_deliveries(site_id);
CREATE INDEX IF NOT EXISTS idx_site_deliveries_tank ON site_consumable_deliveries(tank_id);

ALTER TABLE site_consumable_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_consumable_deliveries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_deliveries_tenant_isolation ON site_consumable_deliveries;
CREATE POLICY site_deliveries_tenant_isolation ON site_consumable_deliveries
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON site_consumable_deliveries TO df_tenant_role;
    END IF;
END $$;

-- 4. Table des Situations de Travaux BTPH (DPM - Décomptes Provisoires Mensuels)
CREATE TABLE IF NOT EXISTS site_work_situations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES site_workspaces(id) ON DELETE CASCADE,
    situation_number VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    month_work_amount_ht_dzd NUMERIC(15, 2) NOT NULL CHECK (month_work_amount_ht_dzd >= 0),
    withholding_guarantee_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    withholding_guarantee_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_work_amount_ht_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    vat_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 19.00,
    vat_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_payable_ttc_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'BILLED', 'PAID'
    client_name VARCHAR(255) NOT NULL,
    client_nif VARCHAR(50),
    vat_tax_point VARCHAR(20) NOT NULL DEFAULT 'ENCAISSEMENT',
    is_settled BOOLEAN NOT NULL DEFAULT FALSE,
    settlement_date DATE,
    notes TEXT,
    sha256_seal VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_site_situation_number UNIQUE (tenant_id, situation_number)
);

CREATE INDEX IF NOT EXISTS idx_site_situations_tenant ON site_work_situations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_situations_site ON site_work_situations(site_id);
CREATE INDEX IF NOT EXISTS idx_site_situations_status ON site_work_situations(status);

ALTER TABLE site_work_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_work_situations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_situations_tenant_isolation ON site_work_situations;
CREATE POLICY site_situations_tenant_isolation ON site_work_situations
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON site_work_situations TO df_tenant_role;
    END IF;
END $$;

COMMIT;

