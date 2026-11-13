-- =============================================================================
-- FICHIER : database/migrations/09_data_plane_ledger_events.sql
-- OBJET   : Data Plane Moteur Décisionnel Algérie — Grand Livre, Événements,
--           Numérotation Continue, Clôtures & Immuabilité Cryptographique (SHA-256)
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table Profil de l'Entité (Régime fiscal, Forme, Segments d'activité, Options)
CREATE TABLE IF NOT EXISTS entity_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    legal_form VARCHAR(50) NOT NULL, -- SARL, EURL, SPA, SNC, INDIVIDUELLE, AUTO_ENTREPRENEUR
    tax_regime VARCHAR(50) NOT NULL, -- REEL_NORMAL, REEL_SIMPLIFIE, IFU, ANAE
    activity_segments JSONB NOT NULL DEFAULT '[]',
    derogatory_options JSONB NOT NULL DEFAULT '{}',
    fiscal_year_end_month INT NOT NULL DEFAULT 12,
    fiscal_year_end_day INT NOT NULL DEFAULT 31,
    active_pack_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_entity_profile_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_profile_tenant ON entity_profile(tenant_id);

-- 2. Table des Périodes Comptables (OPEN, SOFT_CLOSED, CLOSED)
CREATE TABLE IF NOT EXISTS accounting_period (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    fiscal_year INT NOT NULL,
    period_code VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SOFT_CLOSED', 'CLOSED')),
    pack_hash VARCHAR(64) NOT NULL,
    closed_at TIMESTAMPTZ,
    closed_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_accounting_period_code UNIQUE (tenant_id, period_code)
);

CREATE INDEX IF NOT EXISTS idx_accounting_period_tenant_year ON accounting_period(tenant_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_accounting_period_dates ON accounting_period(start_date, end_date);

-- 3. Table Séquenceur de Numérotation de Pièces Comptables (Numérotation continue sous verrou)
CREATE TABLE IF NOT EXISTS piece_sequence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    fiscal_year INT NOT NULL,
    journal_code VARCHAR(20) NOT NULL,
    last_number BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_piece_sequence UNIQUE (tenant_id, fiscal_year, journal_code)
);

CREATE INDEX IF NOT EXISTS idx_piece_sequence_tenant ON piece_sequence(tenant_id, fiscal_year, journal_code);

-- 4. Table des Événements d'Activité Métier (Idempotence par tenant_id + event_id)
CREATE TABLE IF NOT EXISTS business_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    source_event_hash VARCHAR(64) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    local_date DATE NOT NULL,
    payload JSONB NOT NULL,
    piece_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PROCESSED', 'IGNORED_DUPLICATE', 'FAILED')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_business_event_tenant_event UNIQUE (tenant_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_business_event_tenant ON business_event(tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_business_event_hash ON business_event(tenant_id, source_event_hash);

-- 5. Table Grand Livre (ledger_entry) — Append-Only, Chaînage SHA-256
CREATE TABLE IF NOT EXISTS ledger_entry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    period_id UUID NOT NULL REFERENCES accounting_period(id),
    piece_number VARCHAR(100) NOT NULL,
    line_number INT NOT NULL,
    local_date DATE NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    account_role VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    debit NUMERIC(20,2),
    credit NUMERIC(20,2),
    amount_ht NUMERIC(20,2),
    vat_amount NUMERIC(20,2),
    payment_mode VARCHAR(50),
    collection_date DATE,
    segment_code VARCHAR(50),
    tags JSONB NOT NULL DEFAULT '[]',
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'VALIDATED' CHECK (status IN ('VALIDATED', 'REVERSED', 'VOID')),
    reversed_entry_id UUID REFERENCES ledger_entry(id),
    event_id VARCHAR(100),
    pack_hash VARCHAR(64) NOT NULL,
    CONSTRAINT chk_ledger_entry_debit_credit CHECK (
        (debit IS NOT NULL AND credit IS NULL AND debit > 0) OR
        (credit IS NOT NULL AND debit IS NULL AND credit > 0)
    ),
    CONSTRAINT uq_ledger_entry_piece_line UNIQUE (tenant_id, piece_number, line_number)
);

CREATE INDEX IF NOT EXISTS idx_ledger_entry_tenant_date ON ledger_entry(tenant_id, local_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_tenant_piece ON ledger_entry(tenant_id, piece_number);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_account ON ledger_entry(tenant_id, account_number);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_role ON ledger_entry(tenant_id, account_role);

-- 6. Table Ancrage Quotidien Merkle (ledger_anchor)
CREATE TABLE IF NOT EXISTS ledger_anchor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    anchor_date DATE NOT NULL,
    merkle_root VARCHAR(64) NOT NULL,
    entries_count INT NOT NULL,
    last_entry_hash VARCHAR(64) NOT NULL,
    sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ledger_anchor_tenant_date UNIQUE (tenant_id, anchor_date)
);

CREATE INDEX IF NOT EXISTS idx_ledger_anchor_tenant_date ON ledger_anchor(tenant_id, anchor_date);

-- =============================================================================
-- TRIGGERS MÉTIER ET CONTRAINTES D'IMMUABILITÉ DU GRAND LIVRE
-- =============================================================================

-- A. Trigger d'équilibre comptable strict par pièce (Débit = Crédit) — Différé à la fin de transaction
CREATE OR REPLACE FUNCTION fn_check_piece_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_piece_number VARCHAR;
    v_debit_sum NUMERIC;
    v_credit_sum NUMERIC;
    v_diff NUMERIC;
BEGIN
    v_piece_number := NEW.piece_number;
    
    SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
    INTO v_debit_sum, v_credit_sum
    FROM ledger_entry
    WHERE tenant_id = NEW.tenant_id 
      AND piece_number = v_piece_number 
      AND status != 'VOID';

    v_diff := ABS(v_debit_sum - v_credit_sum);
    IF v_diff > 0.000001 THEN
        RAISE EXCEPTION 'VIOLATION D EQUILIBRE COMPTABLE : La pièce % est déséquilibrée (Débits: %, Crédits: %, Écart: % DA)',
            v_piece_number, v_debit_sum, v_credit_sum, v_diff
            USING ERRCODE = '23514'; -- check_violation
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_piece_balance_deferred ON ledger_entry;
CREATE CONSTRAINT TRIGGER trg_piece_balance_deferred
AFTER INSERT OR UPDATE ON ledger_entry
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_check_piece_balance();

-- B. Trigger de refus d'écriture en période close (CLOSED)
CREATE OR REPLACE FUNCTION fn_check_period_open_for_entry()
RETURNS TRIGGER AS $$
DECLARE
    v_period_status VARCHAR;
BEGIN
    SELECT status INTO v_period_status
    FROM accounting_period
    WHERE id = NEW.period_id AND tenant_id = NEW.tenant_id;

    IF v_period_status IS NULL THEN
        RAISE EXCEPTION 'PÉRIODE INTROUVABLE : La période comptable % n existe pas pour le tenant %',
            NEW.period_id, NEW.tenant_id
            USING ERRCODE = '23503';
    END IF;

    IF v_period_status = 'CLOSED' THEN
        RAISE EXCEPTION 'REFUS D ECRITURE : L exercice ou la période comptable est définitivement clôturée (CLOSED).'
            USING ERRCODE = '55000';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_entry_check_period ON ledger_entry;
CREATE TRIGGER trg_ledger_entry_check_period
BEFORE INSERT ON ledger_entry
FOR EACH ROW EXECUTE FUNCTION fn_check_period_open_for_entry();

-- C. Trigger d'immuabilité totale du Grand Livre (Interdiction UPDATE et DELETE)
CREATE OR REPLACE FUNCTION fn_prevent_ledger_entry_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Seul le marquage REVERSED d'une écriture existante est toléré, à condition stricte
        -- qu'aucun montant, compte, date, hash ou identifiant ne soit altéré
        IF OLD.status = 'VALIDATED' AND NEW.status = 'REVERSED'
           AND NEW.id = OLD.id
           AND NEW.tenant_id = OLD.tenant_id
           AND NEW.piece_number = OLD.piece_number
           AND NEW.line_number = OLD.line_number
           AND NEW.debit IS NOT DISTINCT FROM OLD.debit
           AND NEW.credit IS NOT DISTINCT FROM OLD.credit
           AND NEW.hash = OLD.hash
           AND NEW.prev_hash = OLD.prev_hash
           AND NEW.account_number = OLD.account_number
           AND NEW.local_date = OLD.local_date THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'VIOLATION D IMMUABILITÉ : Toute modification directe (UPDATE) d une écriture comptable est strictement interdite (art. 7 Loi 07-11). Utilisez la contre-passation.'
            USING ERRCODE = '55000';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'VIOLATION D IMMUABILITÉ : Toute suppression physique (DELETE) d une écriture comptable est strictement interdite (art. 7 Loi 07-11).'
            USING ERRCODE = '55000';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_entry_immutable ON ledger_entry;
CREATE TRIGGER trg_ledger_entry_immutable
BEFORE UPDATE OR DELETE ON ledger_entry
FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_entry_tampering();

-- =============================================================================
-- POLITIQUES D'ISOLATION MULTI-TENANT (POSTGRESQL RLS FAIL-CLOSED)
-- =============================================================================

ALTER TABLE entity_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_profile FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_entity_profile ON entity_profile;
CREATE POLICY tenant_isolation_entity_profile ON entity_profile
    USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

ALTER TABLE accounting_period ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_period FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_accounting_period ON accounting_period;
CREATE POLICY tenant_isolation_accounting_period ON accounting_period
    USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

ALTER TABLE piece_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_sequence FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_piece_sequence ON piece_sequence;
CREATE POLICY tenant_isolation_piece_sequence ON piece_sequence
    USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

ALTER TABLE business_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_event FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_business_event ON business_event;
CREATE POLICY tenant_isolation_business_event ON business_event
    USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

ALTER TABLE ledger_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entry FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ledger_entry ON ledger_entry;
CREATE POLICY tenant_isolation_ledger_entry ON ledger_entry
    USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

ALTER TABLE ledger_anchor ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_anchor FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ledger_anchor ON ledger_anchor;
CREATE POLICY tenant_isolation_ledger_anchor ON ledger_anchor
    USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

COMMIT;

