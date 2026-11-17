-- ============================================================================
-- Migration 14 : Module B — Rental (Location de Flotte & Engins)
-- Respect strict du principe d'ancrage racine : asset_id REFERENCES assets(id)
-- RLS Fail-Closed sur tenant_id & conformité TVA 19% DGI
-- ============================================================================

-- 1. Contrats de Location
CREATE TABLE IF NOT EXISTS asset_rental_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_nif VARCHAR(50),
    customer_phone_dz VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_return_date DATE,
    daily_rate_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    included_km_or_hours_per_day NUMERIC(10, 2) NOT NULL DEFAULT 200,
    extra_unit_rate_dzd NUMERIC(15, 2) NOT NULL DEFAULT 50,
    fuel_refill_rate_per_liter_dzd NUMERIC(15, 2) NOT NULL DEFAULT 40,
    deposit_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_rental_contract_tenant_num UNIQUE (tenant_id, contract_number)
);

CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant ON asset_rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_asset_id ON asset_rental_contracts(asset_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON asset_rental_contracts(status);

ALTER TABLE asset_rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_rental_contracts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_contracts_tenant_isolation ON asset_rental_contracts;
CREATE POLICY rental_contracts_tenant_isolation ON asset_rental_contracts
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON asset_rental_contracts TO df_tenant_role;
    END IF;
END $$;


-- 2. États des Lieux Check-In / Check-Out Numériques (Photos, Scellés SHA-256)
CREATE TABLE IF NOT EXISTS asset_rental_check_ins_outs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES asset_rental_contracts(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL, -- 'CHECK_OUT', 'CHECK_IN'
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    performed_by VARCHAR(255) NOT NULL,
    customer_signatory_name VARCHAR(255) NOT NULL,
    meter_value NUMERIC(12, 2) NOT NULL,
    fuel_level_quarter INT NOT NULL CHECK (fuel_level_quarter BETWEEN 0 AND 4),
    cleanliness_state VARCHAR(50) NOT NULL DEFAULT 'CLEAN',
    accessories_present JSONB NOT NULL DEFAULT '{}',
    damages_notes TEXT,
    photos_urls JSONB NOT NULL DEFAULT '[]',
    signature_svg TEXT NOT NULL,
    sha256_proof VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_check_ins_outs_tenant ON asset_rental_check_ins_outs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_check_ins_outs_contract ON asset_rental_check_ins_outs(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_check_ins_outs_asset_id ON asset_rental_check_ins_outs(asset_id);

ALTER TABLE asset_rental_check_ins_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_rental_check_ins_outs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_check_ins_outs_tenant_isolation ON asset_rental_check_ins_outs;
CREATE POLICY rental_check_ins_outs_tenant_isolation ON asset_rental_check_ins_outs
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON asset_rental_check_ins_outs TO df_tenant_role;
    END IF;
END $$;


-- 3. Factures de Location (Moteur Fiscal DGI TVA 19% + Timbre Fiscal)
CREATE TABLE IF NOT EXISTS asset_rental_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    contract_id UUID NOT NULL REFERENCES asset_rental_contracts(id) ON DELETE RESTRICT,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_nif VARCHAR(50),
    base_days_billed INT NOT NULL DEFAULT 1,
    base_rental_ht_dzd NUMERIC(15, 2) NOT NULL,
    extra_km_or_hours_billed NUMERIC(10, 2) NOT NULL DEFAULT 0,
    extra_units_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    fuel_penalty_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    damages_deductions_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_ht_dzd NUMERIC(15, 2) NOT NULL,
    vat_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 19.00,
    vat_amount_dzd NUMERIC(15, 2) NOT NULL,
    stamp_duty_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_ttc_dzd NUMERIC(15, 2) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_rental_invoices_tenant_num UNIQUE (tenant_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant ON asset_rental_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_contract ON asset_rental_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_asset_id ON asset_rental_invoices(asset_id);

ALTER TABLE asset_rental_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_rental_invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_invoices_tenant_isolation ON asset_rental_invoices;
CREATE POLICY rental_invoices_tenant_isolation ON asset_rental_invoices
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON asset_rental_invoices TO df_tenant_role;
    END IF;
END $$;


-- 4. Litiges & Contentieux de Location (Opposabilité Juridique Algérie)
CREATE TABLE IF NOT EXISTS asset_rental_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES asset_rental_contracts(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    dispute_ref VARCHAR(50) NOT NULL,
    claimant VARCHAR(50) NOT NULL, -- 'LANDLORD', 'TENANT'
    dispute_reason TEXT NOT NULL,
    claimed_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    retained_deposit_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    sha256_legal_dossier VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_disputes_tenant ON asset_rental_disputes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_disputes_contract ON asset_rental_disputes(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_disputes_asset_id ON asset_rental_disputes(asset_id);

ALTER TABLE asset_rental_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_rental_disputes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_disputes_tenant_isolation ON asset_rental_disputes;
CREATE POLICY rental_disputes_tenant_isolation ON asset_rental_disputes
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON asset_rental_disputes TO df_tenant_role;
    END IF;
END $$;

