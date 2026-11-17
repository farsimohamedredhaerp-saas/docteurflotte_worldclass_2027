-- =============================================================================
-- FICHIER : database/migrations/19_fiscal_multi_activities_cnrc.sql
-- OBJET   : Extension Module G : Conformité Fiscale Souveraine Multi-Activités & Multi-Régimes
-- SOUVERAINETÉ : DGI Algérie, LF 2024 (Abrogation TAP/TLS), Art. 150 CIDTA (IBS 19/23/26%),
--               Art. 41 TCA & Art. 141-2 CIDTA (Dérogation VP Outil de Travail), RLS Fail-Closed
-- =============================================================================

BEGIN;

-- 1. Profil Fiscal Enrichi (Support Multi-Régimes & Statuts Juridiques)
ALTER TABLE tenant_fiscal_profile
    ADD COLUMN IF NOT EXISTS legal_form VARCHAR(30) NOT NULL DEFAULT 'SARL',
    ADD COLUMN IF NOT EXISTS profit_tax_type VARCHAR(20) NOT NULL DEFAULT 'IBS',
    ADD COLUMN IF NOT EXISTS aapi_exemption_active BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS aapi_exemption_end_date DATE,
    ADD COLUMN IF NOT EXISTS vat_prorata_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00;

-- 2. Table des Activités CNRC du Tenant (Ventilation Multi-Activités Art. 150 CIDTA & IFU)
CREATE TABLE IF NOT EXISTS tenant_cnrc_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cnrc_code VARCHAR(16) NOT NULL,
    activity_label VARCHAR(255) NOT NULL,
    fiscal_segment VARCHAR(30) NOT NULL DEFAULT 'COMMERCE_SERVICES', -- PRODUCTION (19%), BTPH_TOURISME (23%), COMMERCE_SERVICES (26%)
    ifu_segment VARCHAR(30), -- BIENS_PRODUCTION (5%), SERVICES (12%), AUTO_ENTREPRENEUR (0.5%)
    is_subject_to_tls BOOLEAN NOT NULL DEFAULT FALSE, -- Taxe Locale de Solidarité (remplace TAP pour hydrocarbures/canalisations)
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_cnrc UNIQUE (tenant_id, cnrc_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_cnrc_tenant ON tenant_cnrc_activities(tenant_id);

-- 3. Sécurisation RLS Fail-Closed sur tenant_cnrc_activities
ALTER TABLE tenant_cnrc_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_cnrc_activities FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_cnrc_activities' AND policyname = 'tenant_isolation_tenant_cnrc_activities') THEN
        CREATE POLICY tenant_isolation_tenant_cnrc_activities ON tenant_cnrc_activities
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

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_cnrc_activities TO df_tenant_role;
    END IF;
END $$;

-- 4. Enrichissement de fiscal_documents (Support Flux Hors-Flotte, Franchise F20 & Retenues RAS)
ALTER TABLE fiscal_documents
    ALTER COLUMN asset_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS cnrc_activity_id UUID REFERENCES tenant_cnrc_activities(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cost_center_type VARCHAR(40) NOT NULL DEFAULT 'FLEET_ASSET',
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
    ADD COLUMN IF NOT EXISTS third_party_nis VARCHAR(32),
    ADD COLUMN IF NOT EXISTS third_party_rc VARCHAR(64),
    ADD COLUMN IF NOT EXISTS article_imposition_third_party VARCHAR(32),
    ADD COLUMN IF NOT EXISTS is_vat_exempt_f20 BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS f20_certificate_number VARCHAR(64),
    ADD COLUMN IF NOT EXISTS withholding_tax_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS withholding_tax_amount_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_fiscal_documents_cnrc ON fiscal_documents(tenant_id, cnrc_activity_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_cost_center ON fiscal_documents(tenant_id, cost_center_type);

-- 5. Enrichissement de fiscal_events (Lien Activité CNRC)
ALTER TABLE fiscal_events
    ADD COLUMN IF NOT EXISTS cnrc_activity_id UUID REFERENCES tenant_cnrc_activities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fiscal_events_cnrc ON fiscal_events(tenant_id, cnrc_activity_id);

-- 6. Enrichissement de fiscal_declaration_drafts (TLS, Acomptes IBS, RAS, TVS, Ventilation Activité)
ALTER TABLE fiscal_declaration_drafts
    ADD COLUMN IF NOT EXISTS tls_amount_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ibs_installment_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS irg_salaries_withheld_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS other_withholding_taxes_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tvs_amount_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS breakdown_by_activity JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;

