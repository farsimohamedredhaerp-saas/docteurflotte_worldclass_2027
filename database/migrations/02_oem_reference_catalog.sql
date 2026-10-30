-- =============================================================================
-- FICHIER : database/migrations/02_oem_reference_catalog.sql
-- OBJET   : Catalogue Universel Constructeurs (OEM Reference Catalog)
--           Intégration normalisée des référentiels open-source mondiaux :
--           1. vehiclesdb/vehiclesdb (Slugs, Marques, Catégories, Popularité)
--           2. gor3a/vehicle-makes-models (Moteurs, Cylindrées, Puissances, Codes)
--           3. T33R0/ddpc-vehicle-specs (PTAC, Consommations, Réservoirs, Dimensions)
--           4. api-evangelist/vehicle-databases (Échéanciers RMI, Fluides, Sous-systèmes)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Table des Marques de Véhicules (OEM Brands)
CREATE TABLE IF NOT EXISTS oem_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_origin VARCHAR(10),
    is_algeria_common BOOLEAN DEFAULT FALSE,
    logo_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oem_brands_slug ON oem_brands(slug);
CREATE INDEX IF NOT EXISTS idx_oem_brands_dz ON oem_brands(is_algeria_common);
CREATE INDEX IF NOT EXISTS idx_oem_brands_name_trgm ON oem_brands USING gin (name gin_trgm_ops);

-- 2. Table des Modèles de Véhicules (OEM Models)
CREATE TABLE IF NOT EXISTS oem_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES oem_brands(id) ON DELETE CASCADE,
    slug VARCHAR(120) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL, -- HEAVY_TRUCK, LCV, PASSENGER_CAR, BUS, CONSTRUCTION, AGRI_TRACTOR, MOTORCYCLE
    body_type VARCHAR(50),          -- TRACTOR_HEAD, RIGID_TRUCK, TIPPER, VAN, PICKUP, SEDAN, EXCAVATOR
    year_start INT,
    year_end INT,
    popularity_dz_rank INT DEFAULT 999,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_model_brand_slug UNIQUE (brand_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_oem_models_brand_id ON oem_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_oem_models_slug ON oem_models(slug);
CREATE INDEX IF NOT EXISTS idx_oem_models_category ON oem_models(category);
CREATE INDEX IF NOT EXISTS idx_oem_models_dz_rank ON oem_models(popularity_dz_rank);
CREATE INDEX IF NOT EXISTS idx_oem_models_name_trgm ON oem_models USING gin (name gin_trgm_ops);

-- 3. Table des Variantes Motorisations & Fiches Techniques Homologation (OEM Engine Variants)
CREATE TABLE IF NOT EXISTS oem_engine_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES oem_models(id) ON DELETE CASCADE,
    wmi_pattern VARCHAR(10),
    engine_code VARCHAR(100) NOT NULL,
    engine_name VARCHAR(150),
    displacement_cc INT,
    cylinders INT DEFAULT 4,
    power_kw NUMERIC(6, 1),
    power_hp NUMERIC(6, 1),
    torque_nm NUMERIC(6, 1),
    fuel_type VARCHAR(30) NOT NULL DEFAULT 'DIESEL', -- DIESEL, PETROL, HYBRID, ELECTRIC, LPG
    euro_standard VARCHAR(20) DEFAULT 'EURO_3',
    -- Caractéristiques physiques homologation (DDPC-Vehicle-Specs)
    fuel_tank_capacity_liters NUMERIC(6, 1) NOT NULL DEFAULT 60.0,
    gross_vehicle_weight_kg NUMERIC(8, 1),   -- PTAC (Essentiel pour ENACTA et Arrêté Alger 07h-20h)
    curb_weight_kg NUMERIC(8, 1),            -- Poids à vide
    payload_capacity_kg NUMERIC(8, 1),       -- Charge utile
    -- Consommations étalons Mode 0 (Zero-Hardware)
    ref_consumption_mixed_l_100km NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    ref_consumption_urban_l_100km NUMERIC(5, 2),
    ref_consumption_highway_l_100km NUMERIC(5, 2),
    ref_idle_consumption_l_hour NUMERIC(5, 2) NOT NULL DEFAULT 1.5,
    -- Capacités de fluides (API Evangelist & Arrhenius Oil)
    oil_capacity_liters NUMERIC(6, 2) NOT NULL DEFAULT 6.0,
    oil_norm_spec VARCHAR(255) NOT NULL DEFAULT '10W-40 ACEA E7',
    coolant_capacity_liters NUMERIC(6, 2) DEFAULT 12.0,
    transmission_oil_capacity_liters NUMERIC(6, 2) DEFAULT 4.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_variant_model_engine UNIQUE (model_id, engine_code)
);

CREATE INDEX IF NOT EXISTS idx_oem_variants_model_id ON oem_engine_variants(model_id);
CREATE INDEX IF NOT EXISTS idx_oem_variants_engine_code ON oem_engine_variants(engine_code);
CREATE INDEX IF NOT EXISTS idx_oem_variants_wmi ON oem_engine_variants(wmi_pattern);
CREATE INDEX IF NOT EXISTS idx_oem_variants_ptac ON oem_engine_variants(gross_vehicle_weight_kg);

-- 4. Table des Plans d'Entretien Constructeurs par Variante (OEM Maintenance Schedules Ref)
CREATE TABLE IF NOT EXISTS oem_maintenance_schedules_ref (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES oem_engine_variants(id) ON DELETE CASCADE,
    task_code VARCHAR(100) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    subsystem VARCHAR(50) NOT NULL, -- ENGINE, BRAKES, TRANSMISSION, COOLING, SUSPENSION, ELECTRICAL, FILTERS
    normal_interval_km INT,
    normal_interval_months INT,
    normal_interval_engine_hours INT,
    -- Seuils sévères spécifiques Algérie (Chaleur Tell/Sahara et poussières)
    severe_interval_km INT,
    severe_interval_months INT,
    severe_interval_engine_hours INT,
    standard_labor_minutes INT DEFAULT 60,
    criticality_weight NUMERIC(4, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_ref_task UNIQUE (variant_id, task_code)
);

CREATE INDEX IF NOT EXISTS idx_oem_ref_sched_variant ON oem_maintenance_schedules_ref(variant_id);
CREATE INDEX IF NOT EXISTS idx_oem_ref_sched_subsystem ON oem_maintenance_schedules_ref(subsystem);

-- 5. Activation de RLS avec Politique de Lecture Publique Partagée pour les Tables Référentielles
ALTER TABLE oem_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE oem_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE oem_engine_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE oem_maintenance_schedules_ref ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oem_brands' AND policyname = 'oem_brands_read_all') THEN
        CREATE POLICY oem_brands_read_all ON oem_brands FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oem_models' AND policyname = 'oem_models_read_all') THEN
        CREATE POLICY oem_models_read_all ON oem_models FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oem_engine_variants' AND policyname = 'oem_variants_read_all') THEN
        CREATE POLICY oem_variants_read_all ON oem_engine_variants FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oem_maintenance_schedules_ref' AND policyname = 'oem_schedules_read_all') THEN
        CREATE POLICY oem_schedules_read_all ON oem_maintenance_schedules_ref FOR SELECT USING (true);
    END IF;
END $$;

-- 6. Droits accordés au rôle d'exploitation multi-tenant
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT ON oem_brands TO df_tenant_role;
        GRANT SELECT ON oem_models TO df_tenant_role;
        GRANT SELECT ON oem_engine_variants TO df_tenant_role;
        GRANT SELECT ON oem_maintenance_schedules_ref TO df_tenant_role;
    END IF;
END $$;
