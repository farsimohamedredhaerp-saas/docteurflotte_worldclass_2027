-- =============================================================================
-- FICHIER : database/migrations/27_tmd_adr_fuel_tankers_schema.sql
-- OBJET   : ERP Multi-Activités — Phase 5 : Transport de Matières Dangereuses (TMD / ADR) & Citernes Hydrocarbures
-- SOUVERAINETÉ : Dépôts Stratégiques Carburant Naftal & Sonatrach (El Eulma, Caroubier, Sidi Arcine, Hassi Messaoud),
--               Camions-Citernes Multi-Compartiments (Gasoil, Sans Plomb, Sirghaz),
--               Vérification Déterministe : Brevet TMD Chauffeur (Ministère des Transports) & Épreuve APAVE / ENACTA,
--               Détection Géofencée d'Ouverture de Vannes de Dépotage (Anti-Piquage & Sécurité Incendie).
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Habilitations & Brevets TMD Chauffeurs (Ministère des Transports Algérien)
CREATE TABLE IF NOT EXISTS tmd_driver_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_name VARCHAR(150) NOT NULL,
    driver_license_number VARCHAR(50) NOT NULL,
    tmd_certificate_number VARCHAR(100) NOT NULL, -- Numéro officiel de Brevet TMD
    hazard_classes VARCHAR(100) NOT NULL DEFAULT 'CLASS_3_HYDROCARBONS', -- Classes TMD autorisées (Classe 3, etc.)
    issuing_authority VARCHAR(150) NOT NULL DEFAULT 'Direction des Transports de Wilaya (DTW)',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tmd_driver_cert UNIQUE (tenant_id, tmd_certificate_number)
);

CREATE INDEX IF NOT EXISTS idx_tmd_cert_tenant ON tmd_driver_certifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tmd_cert_expiry ON tmd_driver_certifications(expiry_date);

ALTER TABLE tmd_driver_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tmd_driver_certifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tmd_driver_certifications_tenant_isolation ON tmd_driver_certifications;
CREATE POLICY tmd_driver_certifications_tenant_isolation ON tmd_driver_certifications
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 2. Table des Citernes & Compartiments Multi-Produits (Fuel Tankers)
CREATE TABLE IF NOT EXISTS fuel_tanker_compartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tanker_code VARCHAR(50) NOT NULL, -- ex: CIT-NAF-16-01
    compartment_number INT NOT NULL,  -- 1 à 5
    capacity_liters NUMERIC(10, 2) NOT NULL DEFAULT 8000.00,
    current_product_type VARCHAR(50) NOT NULL DEFAULT 'GASOIL', -- GASOIL, SANS_PLOMB, SIRGHAZ_GPL, FUEL_LOURD
    current_volume_liters NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    bottom_valve_status VARCHAR(20) NOT NULL DEFAULT 'CLOSED', -- CLOSED, OPEN
    apave_hydrostatic_test_date DATE NOT NULL, -- Date dernière épreuve APAVE / ENACTA
    apave_test_expiry_date DATE NOT NULL,      -- Validité 3 ans max
    is_adr_compliant BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tanker_comp UNIQUE (tenant_id, asset_id, compartment_number)
);

CREATE INDEX IF NOT EXISTS idx_tanker_comp_tenant ON fuel_tanker_compartments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tanker_comp_asset ON fuel_tanker_compartments(asset_id);

ALTER TABLE fuel_tanker_compartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_tanker_compartments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fuel_tanker_compartments_tenant_isolation ON fuel_tanker_compartments;
CREATE POLICY fuel_tanker_compartments_tenant_isolation ON fuel_tanker_compartments
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

-- 3. Table des Missions de Transport TMD & Sécurité Vannes
CREATE TABLE IF NOT EXISTS tmd_transport_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    mission_code VARCHAR(50) NOT NULL, -- ex: TMD-MSN-2026-0412
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    driver_certification_id UUID NOT NULL REFERENCES tmd_driver_certifications(id) ON DELETE RESTRICT,
    origin_depot_name VARCHAR(150) NOT NULL, -- ex: Dépôt Naftal El Eulma
    destination_station_name VARCHAR(150) NOT NULL, -- ex: Station-Service Naftal RN5 Sétif
    authorized_route VARCHAR(255),
    total_volume_liters NUMERIC(10, 2) NOT NULL,
    fire_extinguishers_checked BOOLEAN NOT NULL DEFAULT TRUE, -- Extincteurs 6kg poudre certifiés
    grounding_braid_connected BOOLEAN NOT NULL DEFAULT TRUE,  -- Tresse de masse antistatique reliée
    status VARCHAR(50) NOT NULL DEFAULT 'AUTHORIZED', -- AUTHORIZED, BLOCKED_NON_COMPLIANT, IN_TRANSIT, DELIVERED
    unauthorized_valve_opened BOOLEAN NOT NULL DEFAULT FALSE, -- Alerte de piquage / dépotage hors zone
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    sha256_audit_seal VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tmd_missions_tenant ON tmd_transport_missions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tmd_missions_asset ON tmd_transport_missions(asset_id);
CREATE INDEX IF NOT EXISTS idx_tmd_missions_status ON tmd_transport_missions(status);

ALTER TABLE tmd_transport_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tmd_transport_missions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tmd_transport_missions_tenant_isolation ON tmd_transport_missions;
CREATE POLICY tmd_transport_missions_tenant_isolation ON tmd_transport_missions
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
    );

COMMIT;

