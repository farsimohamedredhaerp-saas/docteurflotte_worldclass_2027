-- =============================================================================
-- FICHIER : database/migrations/01_oem_maintenance_schema.sql
-- OBJET   : Schéma DDL OEM Constructeurs, Véhicules multi-modes & Échéanciers
--           Supporte Mode 0 (Zero-Hardware), Mode 1 (GPS) et Mode 2 (CAN/J1939)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des gabarits constructeurs OEM RMI (Référentiel global partagé)
CREATE TABLE IF NOT EXISTS oem_maintenance_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wmi_prefix VARCHAR(10) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    engine_code VARCHAR(100) NOT NULL,
    asset_category VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL DEFAULT 'DIESEL',
    ref_consumption_l_100km NUMERIC(6, 2) NOT NULL DEFAULT 0,
    ref_consumption_l_hour NUMERIC(6, 2) NOT NULL DEFAULT 0,
    oil_capacity_liters NUMERIC(6, 2) NOT NULL DEFAULT 0,
    oil_norm_spec VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_template_make_model_engine UNIQUE (make, model, engine_code)
);

CREATE INDEX IF NOT EXISTS idx_oem_templates_wmi ON oem_maintenance_templates(wmi_prefix);
CREATE INDEX IF NOT EXISTS idx_oem_templates_make_model ON oem_maintenance_templates(make, model);

-- 2. Table des opérations de maintenance constructeurs (Normal & Sévère)
CREATE TABLE IF NOT EXISTS oem_maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES oem_maintenance_templates(id) ON DELETE CASCADE,
    task_code VARCHAR(100) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    subsystem VARCHAR(50) NOT NULL,
    normal_interval_km INT,
    normal_interval_months INT,
    normal_interval_engine_hours INT,
    severe_interval_km INT,
    severe_interval_months INT,
    severe_interval_engine_hours INT,
    standard_labor_minutes INT DEFAULT 60,
    criticality_weight NUMERIC(4, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_template_task_code UNIQUE (template_id, task_code)
);

CREATE INDEX IF NOT EXISTS idx_oem_tasks_template_id ON oem_maintenance_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_oem_tasks_task_code ON oem_maintenance_tasks(task_code);

-- 3. Table des Véhicules d'exploitation (Supporte Mode 0, 1 et 2)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    oem_template_id UUID REFERENCES oem_maintenance_templates(id) ON DELETE SET NULL,
    vin VARCHAR(50),
    registration_plate VARCHAR(50) NOT NULL,
    telemetry_mode VARCHAR(50) NOT NULL DEFAULT 'MODE_0_NO_BOX',
    ingestion_provider VARCHAR(50) NOT NULL DEFAULT 'NONE',
    operating_climate_zone VARCHAR(50) NOT NULL DEFAULT 'TELL_URBAN',
    current_odometer_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
    current_engine_hours NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_vehicle_plate UNIQUE (tenant_id, registration_plate)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_oem_template_id ON vehicles(oem_template_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- 4. Table des échéanciers prédictifs de maintenance par véhicule
CREATE TABLE IF NOT EXISTS vehicle_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    oem_task_id UUID NOT NULL REFERENCES oem_maintenance_tasks(id) ON DELETE CASCADE,
    last_performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_performed_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
    last_performed_engine_hours NUMERIC(12, 2) NOT NULL DEFAULT 0,
    effective_interval_km INT,
    effective_interval_hours INT,
    effective_interval_days INT,
    wear_ratio_pct NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    predicted_rul_days INT,
    predicted_rul_km INT,
    status VARCHAR(50) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vehicle_oem_schedule UNIQUE (vehicle_id, oem_task_id)
);

CREATE INDEX IF NOT EXISTS idx_schedules_vehicle_id ON vehicle_maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON vehicle_maintenance_schedules(status);

-- 5. Imposition stricte de Row-Level Security (RLS) sur les données multi-tenant
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

ALTER TABLE vehicle_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance_schedules FORCE ROW LEVEL SECURITY;

-- 6. Politiques RLS Fail-Closed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'tenant_isolation_vehicles'
    ) THEN
        CREATE POLICY tenant_isolation_vehicles ON vehicles
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_maintenance_schedules' AND policyname = 'tenant_isolation_vehicle_schedules'
    ) THEN
        CREATE POLICY tenant_isolation_vehicle_schedules ON vehicle_maintenance_schedules
            USING (
                vehicle_id IN (
                    SELECT id FROM vehicles
                    WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                )
            );
    END IF;
END $$;

-- 7. Privilèges pour le rôle applicatif
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT ON oem_maintenance_templates TO df_tenant_role;
        GRANT SELECT ON oem_maintenance_tasks TO df_tenant_role;
        GRANT ALL PRIVILEGES ON vehicles TO df_tenant_role;
        GRANT ALL PRIVILEGES ON vehicle_maintenance_schedules TO df_tenant_role;
    END IF;
END $$;
