-- ============================================================================
-- Migration 15 : Module C — Logistics & POD (Lettre de Voiture Électronique & Preuve de Livraison)
-- Respect strict du principe d'ancrage racine : asset_id REFERENCES assets(id)
-- RLS Fail-Closed sur tenant_id & Décret 03-223 / JORADP 58 Wilayas
-- ============================================================================

-- 1. Lettres de Voiture Électroniques (LVE)
CREATE TABLE IF NOT EXISTS logistics_consignment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lve_number VARCHAR(50) NOT NULL,
    mission_id UUID,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    driver_id UUID,
    driver_name VARCHAR(255),
    shipper_name VARCHAR(255) NOT NULL,
    shipper_address TEXT NOT NULL,
    shipper_wilaya_code INT NOT NULL CHECK (shipper_wilaya_code BETWEEN 1 AND 58),
    consignee_name VARCHAR(255) NOT NULL,
    consignee_address TEXT NOT NULL,
    consignee_wilaya_code INT NOT NULL CHECK (consignee_wilaya_code BETWEEN 1 AND 58),
    consignee_phone_dz VARCHAR(50) NOT NULL,
    cargo_nature VARCHAR(255) NOT NULL,
    total_weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
    packages_count INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'PREPARED',
    qr_code_validation_hmac VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_lve_tenant_num UNIQUE (tenant_id, lve_number)
);

CREATE INDEX IF NOT EXISTS idx_lve_tenant_id ON logistics_consignment_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lve_asset_id ON logistics_consignment_notes(asset_id);
CREATE INDEX IF NOT EXISTS idx_lve_status ON logistics_consignment_notes(status);
CREATE INDEX IF NOT EXISTS idx_lve_shipper_wilaya ON logistics_consignment_notes(shipper_wilaya_code);
CREATE INDEX IF NOT EXISTS idx_lve_consignee_wilaya ON logistics_consignment_notes(consignee_wilaya_code);

ALTER TABLE logistics_consignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_consignment_notes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lve_tenant_isolation ON logistics_consignment_notes;
CREATE POLICY lve_tenant_isolation ON logistics_consignment_notes
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON logistics_consignment_notes TO df_tenant_role;
    END IF;
END $$;


-- 2. Preuves de Livraison (POD Mobile Offline-First)
CREATE TABLE IF NOT EXISTS logistics_proof_of_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lve_id UUID NOT NULL REFERENCES logistics_consignment_notes(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_identity_doc_ref VARCHAR(100),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    packages_delivered INT NOT NULL DEFAULT 0,
    packages_damaged INT NOT NULL DEFAULT 0,
    packages_refused INT NOT NULL DEFAULT 0,
    photos_urls JSONB NOT NULL DEFAULT '[]',
    signature_svg TEXT NOT NULL,
    notes TEXT,
    is_first_pass_delivery BOOLEAN NOT NULL DEFAULT TRUE,
    sha256_proof_seal VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pod_tenant_id ON logistics_proof_of_delivery(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pod_lve_id ON logistics_proof_of_delivery(lve_id);
CREATE INDEX IF NOT EXISTS idx_pod_asset_id ON logistics_proof_of_delivery(asset_id);

ALTER TABLE logistics_proof_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_proof_of_delivery FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pod_tenant_isolation ON logistics_proof_of_delivery;
CREATE POLICY pod_tenant_isolation ON logistics_proof_of_delivery
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON logistics_proof_of_delivery TO df_tenant_role;
    END IF;
END $$;


-- 3. Litiges de Livraison (Avaries, Manquants, Blocage Facturation)
CREATE TABLE IF NOT EXISTS logistics_delivery_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lve_id UUID NOT NULL REFERENCES logistics_consignment_notes(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    dispute_number VARCHAR(50) NOT NULL,
    dispute_type VARCHAR(50) NOT NULL, -- 'DAMAGE', 'SHORTAGE', 'REFUSAL', 'WRONG_ADDRESS', 'LATE_DELIVERY'
    description TEXT NOT NULL,
    estimated_claim_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_billing_blocked BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'INVESTIGATING', 'SETTLED'
    photos_urls JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_delivery_dispute_tenant_num UNIQUE (tenant_id, dispute_number)
);

CREATE INDEX IF NOT EXISTS idx_delivery_disputes_tenant ON logistics_delivery_disputes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_disputes_lve ON logistics_delivery_disputes(lve_id);
CREATE INDEX IF NOT EXISTS idx_delivery_disputes_asset_id ON logistics_delivery_disputes(asset_id);

ALTER TABLE logistics_delivery_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_delivery_disputes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS delivery_disputes_tenant_isolation ON logistics_delivery_disputes;
CREATE POLICY delivery_disputes_tenant_isolation ON logistics_delivery_disputes
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON logistics_delivery_disputes TO df_tenant_role;
    END IF;
END $$;

