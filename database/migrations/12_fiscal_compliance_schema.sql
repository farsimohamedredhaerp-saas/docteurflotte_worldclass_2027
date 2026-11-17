-- =============================================================================
-- FICHIER : database/migrations/12_fiscal_compliance_schema.sql
-- OBJET   : Extension ERP Flotte DocteurFlotte — Module G : Conformité Fiscale
--           Architecture Asset-Centric, Adossée à packages/decision-engine
-- SOUVERAINETÉ : DGI Algérie, CIDTA, Code TCA, Scellés SHA-256, RLS Fail-Closed
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table Profil Fiscal du Tenant
CREATE TABLE IF NOT EXISTS tenant_fiscal_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    legal_name VARCHAR(255) NOT NULL,
    nif VARCHAR(32) NOT NULL,
    nis VARCHAR(32),
    rc_number VARCHAR(64),
    article_imposition VARCHAR(32),
    tax_regime VARCHAR(50) NOT NULL DEFAULT 'REEL_NORMAL',
    is_vat_subject BOOLEAN NOT NULL DEFAULT TRUE,
    vat_declaration_frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 58),
    fiscal_center VARCHAR(150),
    is_configured BOOLEAN NOT NULL DEFAULT FALSE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_fiscal_profile UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_fiscal_profile_lookup ON tenant_fiscal_profile(tenant_id);

-- 2. Table des Pièces Justificatives Fiscales (Rattachées aux Assets)
CREATE TABLE IF NOT EXISTS fiscal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    document_date DATE NOT NULL,
    third_party_name VARCHAR(255),
    third_party_nif VARCHAR(32),
    amount_ht_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0,
    vat_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    vat_amount_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0,
    stamp_duty_dzd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_ttc_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_vat_deductible BOOLEAN NOT NULL DEFAULT TRUE,
    deductibility_rationale VARCHAR(255),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_AUDIT',
    rejection_reason TEXT,
    sha256_fingerprint VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fiscal_doc_tenant_number UNIQUE (tenant_id, document_type, document_number)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_documents_asset_id ON fiscal_documents(tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_date ON fiscal_documents(tenant_id, document_date);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_fingerprint ON fiscal_documents(tenant_id, sha256_fingerprint);

-- 3. Table des Événements Fiscaux Qualifiés (Asset-Centric)
CREATE TABLE IF NOT EXISTS fiscal_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    fiscal_document_id UUID REFERENCES fiscal_documents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    tax_category VARCHAR(50) NOT NULL,
    taxable_base_dzd NUMERIC(14, 2) NOT NULL,
    applied_rate_pct NUMERIC(5, 2) NOT NULL,
    tax_amount_dzd NUMERIC(14, 2) NOT NULL,
    accounting_account VARCHAR(50) NOT NULL,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    fiscal_rule_id VARCHAR(100) NOT NULL,
    rule_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    engine_used VARCHAR(50) NOT NULL DEFAULT 'TVA_ENGINE',
    sha256_seal VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_events_asset_id ON fiscal_events(tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_events_tenant_period ON fiscal_events(tenant_id, period_year, period_month);

-- 4. Table des Brouillons de Déclarations Fiscales (G50 / Liasse)
CREATE TABLE IF NOT EXISTS fiscal_declaration_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    declaration_type VARCHAR(50) NOT NULL DEFAULT 'G50_MONTHLY',
    total_taxable_revenue_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    total_vat_collected_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    total_vat_deductible_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    net_vat_payable_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    tap_amount_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    stamp_duty_total_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_due_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    breakdown_by_asset JSONB NOT NULL DEFAULT '{}'::jsonb,
    missing_receipts_count INT NOT NULL DEFAULT 0,
    fiscal_audit_seal_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_declaration_tenant_period_type UNIQUE (tenant_id, period_year, period_month, declaration_type)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_declaration_drafts_lookup 
ON fiscal_declaration_drafts(tenant_id, period_year, period_month);

-- 5. Table des Scellés Cryptographiques SHA-256 Immuables
CREATE TABLE IF NOT EXISTS fiscal_audit_seals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    declaration_id UUID REFERENCES fiscal_declaration_drafts(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL DEFAULT 'DECLARATION_G50',
    target_id VARCHAR(100) NOT NULL,
    sealed_by_user_id VARCHAR(100) NOT NULL,
    sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    canonical_payload TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    merkle_leaf VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_audit_seals_tenant_hash ON fiscal_audit_seals(tenant_id, sha256_hash);

-- 6. Activation de Row Level Security (RLS) Fail-Closed
ALTER TABLE tenant_fiscal_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fiscal_profile FORCE ROW LEVEL SECURITY;

ALTER TABLE fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_documents FORCE ROW LEVEL SECURITY;

ALTER TABLE fiscal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_events FORCE ROW LEVEL SECURITY;

ALTER TABLE fiscal_declaration_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_declaration_drafts FORCE ROW LEVEL SECURITY;

ALTER TABLE fiscal_audit_seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_audit_seals FORCE ROW LEVEL SECURITY;

-- 7. Politiques d'Isolation Multi-Tenant Fail-Closed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_fiscal_profile' AND policyname = 'tenant_isolation_fiscal_profile') THEN
        CREATE POLICY tenant_isolation_fiscal_profile ON tenant_fiscal_profile
            USING (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fiscal_documents' AND policyname = 'tenant_isolation_fiscal_documents') THEN
        CREATE POLICY tenant_isolation_fiscal_documents ON fiscal_documents
            USING (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fiscal_events' AND policyname = 'tenant_isolation_fiscal_events') THEN
        CREATE POLICY tenant_isolation_fiscal_events ON fiscal_events
            USING (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fiscal_declaration_drafts' AND policyname = 'tenant_isolation_declaration_drafts') THEN
        CREATE POLICY tenant_isolation_declaration_drafts ON fiscal_declaration_drafts
            USING (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fiscal_audit_seals' AND policyname = 'tenant_isolation_fiscal_audit_seals') THEN
        CREATE POLICY tenant_isolation_fiscal_audit_seals ON fiscal_audit_seals
            USING (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
                tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
    END IF;
END $$;

-- 8. Droits d'Accès pour df_tenant_role
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_fiscal_profile TO df_tenant_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_documents TO df_tenant_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_events TO df_tenant_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_declaration_drafts TO df_tenant_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_audit_seals TO df_tenant_role;
    END IF;
END $$;

COMMIT;

