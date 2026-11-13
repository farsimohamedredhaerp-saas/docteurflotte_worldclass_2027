-- =============================================================================
-- FICHIER : database/migrations/10_telemetry_tiers_and_naftal.sql
-- OBJET   : Paliers d'honnêteté fonctionnelle télématique (Mode 0 / 1 / 2)
--           & Ingestion des relevés de cartes carburant Naftal
-- CONFORMITÉ : Loi 18-07 (ANPDP) & Soutien Véhicules Flotte Algérie
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Énumération des paliers télématiques stricts
DO $$ BEGIN
    CREATE TYPE df_telemetry_tier AS ENUM (
        'MODE_0_DECLARATIVE',
        'MODE_1_GNSS',
        'MODE_2_CAN_J1939'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ajout de la colonne telemetry_tier sur la table assets
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets') THEN
        ALTER TABLE assets 
        ADD COLUMN IF NOT EXISTS telemetry_tier df_telemetry_tier NOT NULL DEFAULT 'MODE_0_DECLARATIVE';

        CREATE INDEX IF NOT EXISTS idx_assets_telemetry_tier ON assets(tenant_id, telemetry_tier);
    END IF;
END $$;

-- 3. Table des relevés de cartes carburant Naftal (Mode 0 & Multi-sources)
CREATE TABLE IF NOT EXISTS naftal_card_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    card_number VARCHAR(64) NOT NULL,
    transaction_timestamp TIMESTAMPTZ NOT NULL,
    station_code VARCHAR(32) NOT NULL,
    station_name VARCHAR(128) NOT NULL,
    station_wilaya_code INT NOT NULL CHECK (station_wilaya_code BETWEEN 1 AND 58),
    fuel_type VARCHAR(32) NOT NULL, -- 'GASOIL', 'SIRGHAZ', 'SANS_PLOMB'
    volume_liters NUMERIC(10,2) NOT NULL CHECK (volume_liters > 0),
    unit_price_dzd NUMERIC(10,2) NOT NULL,
    total_amount_dzd NUMERIC(12,2) NOT NULL,
    declared_odometer_km NUMERIC(12,1) NOT NULL,
    previous_station_code VARCHAR(32),
    previous_odometer_km NUMERIC(12,1),
    valhalla_expected_min_km NUMERIC(12,1),
    discrepancy_km NUMERIC(12,1),
    discrepancy_percentage NUMERIC(6,2),
    has_discrepancy_alert BOOLEAN NOT NULL DEFAULT FALSE,
    discrepancy_reason VARCHAR(255),
    raw_source_type VARCHAR(32) NOT NULL, -- 'EXCEL_STATEMENT', 'CSV_STATEMENT', 'OCR_RECEIPT'
    batch_reference VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_naftal_statements_lookup 
ON naftal_card_statements(tenant_id, asset_id, transaction_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_naftal_discrepancy_alerts 
ON naftal_card_statements(tenant_id, has_discrepancy_alert) 
WHERE has_discrepancy_alert = TRUE;

