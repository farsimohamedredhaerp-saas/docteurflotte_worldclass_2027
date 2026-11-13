-- =============================================================================
-- FICHIER : database/migrations/08_reg_packs_control_plane.sql
-- OBJET   : Control Plane Moteur Décisionnel Algérie — Packs Réglementaires
--           Bi-temporalité, Contraintes d'Exclusion btree_gist, Signatures Ed25519
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. Table des Packs Réglementaires (Control Plane)
CREATE TABLE IF NOT EXISTS reg_pack (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_code VARCHAR(100) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REVOKED')),
    content_hash VARCHAR(64) NOT NULL,
    signature VARCHAR(256),
    author_email VARCHAR(255) NOT NULL,
    published_by VARCHAR(255),
    validated_by VARCHAR(255),
    description_fr TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT chk_pack_maker_checker CHECK (
        status != 'PUBLISHED' OR (published_by IS NOT NULL AND published_by <> author_email)
    )
);

CREATE INDEX IF NOT EXISTS idx_reg_pack_status ON reg_pack(status);
CREATE INDEX IF NOT EXISTS idx_reg_pack_code_version ON reg_pack(pack_code, version);

-- 2. Table des Éléments de Pack Réglementaire (Règles, Paramètres, Barèmes)
CREATE TABLE IF NOT EXISTS reg_pack_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_id UUID NOT NULL REFERENCES reg_pack(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    kind VARCHAR(50) NOT NULL CHECK (kind IN (
        'RULE', 'PARAMETER', 'POSTING_SCHEMA', 'CHART_TEMPLATE',
        'IDENTIFIER_FORMAT', 'PENALTY_GRID', 'CALENDAR',
        'DECLARATION_TEMPLATE', 'SECTOR_PROFILE'
    )),
    source_hierarchy VARCHAR(50) NOT NULL DEFAULT 'LF' CHECK (source_hierarchy IN ('LFC', 'LF', 'DECRET', 'ARRETE', 'DOCTRINE')),
    valid_from DATE NOT NULL,
    valid_to DATE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    superseded_at TIMESTAMPTZ,
    legal_ref VARCHAR(255) NOT NULL,
    legal_basis_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(50) NOT NULL CHECK (verification_status IN ('SOURCED_OFFICIAL', 'SOURCED_SECONDARY', 'UNVERIFIED')),
    evidence_level VARCHAR(50) NOT NULL CHECK (evidence_level IN ('LEGAL_TEXT', 'ADMIN_DOCTRINE', 'AUDIT_PRACTICE', 'STATISTICAL')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contrainte d'exclusion temporelle btree_gist : interdiction de chevauchement sur items actifs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_no_overlap_active_item'
    ) THEN
        ALTER TABLE reg_pack_item
        ADD CONSTRAINT uq_no_overlap_active_item EXCLUDE USING gist (
            item_code WITH =,
            source_hierarchy WITH =,
            daterange(valid_from, COALESCE(valid_to, '9999-12-31'::date), '[]') WITH &&
        ) WHERE (superseded_at IS NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reg_pack_item_code ON reg_pack_item(item_code);
CREATE INDEX IF NOT EXISTS idx_reg_pack_item_lookup ON reg_pack_item(item_code, valid_from, valid_to);

-- 3. Table des Jeux Dorés de Test Associés aux Règles (Golden Tests)
CREATE TABLE IF NOT EXISTS reg_pack_item_test (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES reg_pack_item(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    inputs JSONB NOT NULL,
    expected_output JSONB NOT NULL,
    is_golden BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_pack_test_item ON reg_pack_item_test(item_id);

-- 4. Table des Approbations Formelles (Maker-Checker à 4 yeux)
CREATE TABLE IF NOT EXISTS reg_pack_approval (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_id UUID NOT NULL REFERENCES reg_pack(id) ON DELETE CASCADE,
    approver_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'REGULATORY_REVIEWER',
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pack_approver UNIQUE (pack_id, approver_email)
);

-- 5. Table des Clés de Signature Ed25519 Homologuées
CREATE TABLE IF NOT EXISTS signing_key (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id VARCHAR(100) NOT NULL UNIQUE,
    public_key_hex VARCHAR(128) NOT NULL,
    algorithm VARCHAR(32) NOT NULL DEFAULT 'Ed25519',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Table d'Épinglage de Pack par Tenant (Tenant Pack Pin)
CREATE TABLE IF NOT EXISTS tenant_pack_pin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    pack_id UUID NOT NULL REFERENCES reg_pack(id),
    pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pinned_by VARCHAR(255) NOT NULL,
    CONSTRAINT uq_tenant_pack_pin UNIQUE (tenant_id, pack_id)
);

-- 7. Trigger d'Immuabilité Absolue des Packs Publiés
CREATE OR REPLACE FUNCTION fn_prevent_published_pack_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'PUBLISHED' THEN
        -- Seule la transition vers REVOKED avec justification est admise
        IF TG_OP = 'UPDATE' AND NEW.status = 'REVOKED' AND NEW.content_hash = OLD.content_hash THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'VIOLATION D IMMUABILITÉ : Un pack réglementaire publié (PUBLISHED) ne peut être ni modifié (UPDATE) ni supprimé (DELETE). Créez une nouvelle version.'
            USING ERRCODE = '55000';
    END IF;

    IF TG_OP = 'DELETE' AND OLD.status = 'PUBLISHED' THEN
        RAISE EXCEPTION 'VIOLATION D IMMUABILITÉ : Suppression interdite d un pack publié.'
            USING ERRCODE = '55000';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reg_pack_immutable ON reg_pack;
CREATE TRIGGER trg_reg_pack_immutable
BEFORE UPDATE OR DELETE ON reg_pack
FOR EACH ROW EXECUTE FUNCTION fn_prevent_published_pack_tampering();

COMMIT;

