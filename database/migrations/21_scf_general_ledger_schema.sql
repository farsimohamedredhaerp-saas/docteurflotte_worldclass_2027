-- =============================================================================
-- FICHIER : database/migrations/21_scf_general_ledger_schema.sql
-- OBJET   : Extension ERP Multi-Activités — Phase 1 : Grand Livre SCF & Journaux Auxiliaires
-- SOUVERAINETÉ : DGI Algérie, Plan Comptable SCF 2007, Décret exécutif e-Facturation 2027,
--               Loi 18-07 / 25-11, Scellés d'Inaltérabilité SHA-256 Chaînés, RLS Fail-Closed
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table du Plan de Comptes Général SCF (Classes 1 à 7)
CREATE TABLE IF NOT EXISTS scf_chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    account_class INT NOT NULL CHECK (account_class BETWEEN 1 AND 7),
    account_category VARCHAR(50) NOT NULL CHECK (account_category IN ('ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT', 'CAPITAUX')),
    is_tax_account BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scf_accounts_code ON scf_chart_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_scf_accounts_class ON scf_chart_of_accounts(account_class);

-- 2. Table des Journaux Comptables Auxiliaires
CREATE TABLE IF NOT EXISTS accounting_journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    journal_type VARCHAR(50) NOT NULL CHECK (journal_type IN ('ACHATS', 'VENTES', 'BANQUE', 'CAISSE', 'OPERATIONS_DIVERSES')),
    default_account VARCHAR(20),
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed des 5 Journaux Auxiliaires Standard Algériens
INSERT INTO accounting_journals (code, name, journal_type, default_account, is_system)
VALUES
    ('ACH', 'Journal des Achats & Fournisseurs', 'ACHATS', '401000', TRUE),
    ('VTE', 'Journal des Ventes & Prestations', 'VENTES', '411000', TRUE),
    ('BQ',  'Journal de Banque', 'BANQUE', '512000', TRUE),
    ('CA',  'Journal de Caisse (Espèces)', 'CAISSE', '530000', TRUE),
    ('OD',  'Journal des Opérations Diverses & Dotations', 'OPERATIONS_DIVERSES', NULL, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. Table du Grand Livre & Journal Général des Écritures (Asset-Native & Multi-Métiers)
CREATE TABLE IF NOT EXISTS accounting_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_number VARCHAR(100) NOT NULL,
    journal_code VARCHAR(10) NOT NULL REFERENCES accounting_journals(code) ON DELETE RESTRICT,
    entry_date DATE NOT NULL,
    fiscal_document_id UUID REFERENCES fiscal_documents(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    site_id UUID REFERENCES site_workspaces(id) ON DELETE SET NULL,
    cnrc_activity_id UUID REFERENCES tenant_cnrc_activities(id) ON DELETE SET NULL,
    account_code VARCHAR(20) NOT NULL,
    account_label VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    debit_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    credit_dzd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    third_party_name VARCHAR(255),
    third_party_nif VARCHAR(32),
    is_validated BOOLEAN NOT NULL DEFAULT TRUE,
    sha256_hash VARCHAR(64) NOT NULL,
    previous_entry_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_date ON accounting_ledger_entries(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_journal ON accounting_ledger_entries(tenant_id, journal_code);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_account ON accounting_ledger_entries(tenant_id, account_code);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_asset ON accounting_ledger_entries(tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_site ON accounting_ledger_entries(tenant_id, site_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_cnrc ON accounting_ledger_entries(tenant_id, cnrc_activity_id);
CREATE INDEX IF NOT EXISTS idx_ledger_hash ON accounting_ledger_entries(tenant_id, sha256_hash);

-- 4. Activation de Row Level Security (RLS) Fail-Closed
ALTER TABLE accounting_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_ledger_entries FORCE ROW LEVEL SECURITY;

-- 5. Politique d'Isolation Multi-Tenant Fail-Closed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounting_ledger_entries' AND policyname = 'tenant_isolation_ledger_entries') THEN
        CREATE POLICY tenant_isolation_ledger_entries ON accounting_ledger_entries
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

COMMIT;

