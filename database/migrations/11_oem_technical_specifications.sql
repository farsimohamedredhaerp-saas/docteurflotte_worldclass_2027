-- =============================================================================
-- FICHIER : database/migrations/11_oem_technical_specifications.sql
-- OBJET   : Référentiel Technique Constructeurs OEM Déterministe
--           (Couples de serrage, Contenances fluides & Codes défauts DTC/J1939)
-- CONFORMITÉ : Zéro hallucination LLM, Fiches constructeurs officielles
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des couples de serrage officiels
CREATE TABLE IF NOT EXISTS oem_torque_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(64) NOT NULL,
    model_family VARCHAR(64) NOT NULL,
    engine_code VARCHAR(64) NOT NULL,
    component_code VARCHAR(64) NOT NULL,
    component_name_fr VARCHAR(128) NOT NULL,
    component_name_darja VARCHAR(128),
    stage_1_torque_nm NUMERIC(8,2) NOT NULL,
    stage_2_torque_nm NUMERIC(8,2),
    stage_3_torque_nm NUMERIC(8,2),
    angle_stage_1_degrees NUMERIC(6,2),
    angle_stage_2_degrees NUMERIC(6,2),
    tightening_order_diagram_url VARCHAR(255),
    specific_tool_ref VARCHAR(64),
    is_critical_assembly BOOLEAN NOT NULL DEFAULT TRUE,
    notes_dz VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_torque UNIQUE (make, engine_code, component_code)
);

CREATE INDEX IF NOT EXISTS idx_oem_torque_search 
ON oem_torque_specs(make, engine_code, component_code);

-- 2. Table des contenances de fluides & préconisations sahariennes
CREATE TABLE IF NOT EXISTS oem_fluid_capacities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(64) NOT NULL,
    model_family VARCHAR(64) NOT NULL,
    engine_code VARCHAR(64) NOT NULL,
    compartment_code VARCHAR(64) NOT NULL,
    compartment_name_fr VARCHAR(128) NOT NULL,
    compartment_name_darja VARCHAR(128),
    capacity_liters NUMERIC(6,2) NOT NULL,
    standard_viscosity VARCHAR(32) NOT NULL,
    saharan_heavy_viscosity VARCHAR(32) NOT NULL,
    standard_interval_km INT NOT NULL,
    saharan_interval_km INT NOT NULL,
    oem_oil_standard VARCHAR(64) NOT NULL,
    notes_dz VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_fluid UNIQUE (make, engine_code, compartment_code)
);

CREATE INDEX IF NOT EXISTS idx_oem_fluid_search 
ON oem_fluid_capacities(make, engine_code, compartment_code);

-- 3. Table du catalogue des codes défauts (DTC OBD2 et J1939 SPN/FMI)
CREATE TABLE IF NOT EXISTS oem_dtc_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(64) NOT NULL,
    code_type VARCHAR(16) NOT NULL,
    fault_code VARCHAR(32) NOT NULL,
    description_fr VARCHAR(255) NOT NULL,
    probable_cause_fr TEXT NOT NULL,
    immediate_action_fr TEXT NOT NULL,
    darja_audio_cue VARCHAR(255),
    severity_level VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oem_dtc UNIQUE (make, code_type, fault_code)
);

CREATE INDEX IF NOT EXISTS idx_oem_dtc_search 
ON oem_dtc_catalog(make, fault_code);

