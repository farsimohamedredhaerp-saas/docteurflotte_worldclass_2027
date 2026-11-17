-- ============================================================================
-- Migration 16 : Module E — Claims, Fines & Insurance (Sinistres, Amendes & Assurances)
-- Respect strict du principe d'ancrage racine : asset_id REFERENCES assets(id)
-- RLS Fail-Closed sur tenant_id & Imputation automatique de l'amende au chauffeur à l'instant t
-- ============================================================================

-- 1. Déclarations de Sinistres & Accidents
CREATE TABLE IF NOT EXISTS asset_accident_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    driver_id UUID,
    driver_name VARCHAR(255),
    accident_date TIMESTAMPTZ NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 58),
    location_details TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'MODERATE', -- 'MINOR', 'MODERATE', 'SEVERE', 'TOTAL_LOSS'
    third_party_involved BOOLEAN NOT NULL DEFAULT FALSE,
    third_party_details JSONB NOT NULL DEFAULT '{}',
    police_report_ref VARCHAR(100),
    estimated_damage_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    photos_urls JSONB NOT NULL DEFAULT '[]',
    circumstances_description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REPORTED', -- 'REPORTED', 'UNDER_REVIEW', 'INSURANCE_SUBMITTED', 'REPAIRED', 'SETTLED', 'CLOSED'
    work_order_id_generated UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_accident_claim_tenant_num UNIQUE (tenant_id, claim_number)
);

CREATE INDEX IF NOT EXISTS idx_accident_claims_tenant ON asset_accident_claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accident_claims_asset_id ON asset_accident_claims(asset_id);
CREATE INDEX IF NOT EXISTS idx_accident_claims_status ON asset_accident_claims(status);
CREATE INDEX IF NOT EXISTS idx_accident_claims_wilaya ON asset_accident_claims(wilaya_code);

ALTER TABLE asset_accident_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY accident_claims_tenant_isolation ON asset_accident_claims
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_accident_claims TO df_tenant_role;


-- 2. Dossiers d'Assurances & Remboursements
CREATE TABLE IF NOT EXISTS asset_insurance_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    claim_id UUID NOT NULL REFERENCES asset_accident_claims(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    insurance_policy_number VARCHAR(100) NOT NULL,
    insurance_company VARCHAR(100) NOT NULL, -- 'SAA', 'CAAT', 'CASH', 'CIAR', 'TRUST', 'ALLIANCE', 'MACIR_VIE'
    expert_name VARCHAR(255),
    assessed_damage_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deductible_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    approved_compensation_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payout_date DATE,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_cases_tenant ON asset_insurance_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_claim ON asset_insurance_cases(claim_id);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_asset_id ON asset_insurance_cases(asset_id);

ALTER TABLE asset_insurance_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_cases_tenant_isolation ON asset_insurance_cases
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_insurance_cases TO df_tenant_role;


-- 3. Procès-Verbaux & Amendes Routières (Imputation Chauffeur à l'instant t)
CREATE TABLE IF NOT EXISTS asset_traffic_fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fine_notice_number VARCHAR(100) NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    infraction_date TIMESTAMPTZ NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 58),
    location_highway_code VARCHAR(50), -- 'RN1', 'A1', 'RN3', etc.
    infraction_nature VARCHAR(255) NOT NULL,
    amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    attributed_driver_id UUID,
    attributed_driver_name VARCHAR(255),
    attribution_source VARCHAR(50) NOT NULL DEFAULT 'MANUAL_DISPATCH', -- 'TELEMATICS_GPS_TIMESTAMP', 'MISSION_ORDER', 'MANUAL_DISPATCH'
    is_contested BOOLEAN NOT NULL DEFAULT FALSE,
    contest_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_traffic_fine_tenant_num UNIQUE (tenant_id, fine_notice_number)
);

CREATE INDEX IF NOT EXISTS idx_traffic_fines_tenant ON asset_traffic_fines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_asset_id ON asset_traffic_fines(asset_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_driver ON asset_traffic_fines(attributed_driver_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_infraction_date ON asset_traffic_fines(infraction_date);

ALTER TABLE asset_traffic_fines ENABLE ROW LEVEL SECURITY;
CREATE POLICY traffic_fines_tenant_isolation ON asset_traffic_fines
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_traffic_fines TO df_tenant_role;

