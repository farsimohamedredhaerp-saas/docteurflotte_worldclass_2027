-- ============================================================================
-- Migration 13 : Module A — Chantiers & Engins BTP / Carrières (World-Class DZ)
-- Respect strict du principe d'ancrage racine : asset_id REFERENCES assets(id)
-- RLS Fail-Closed sur tenant_id & conformité 58 Wilayas algériennes
-- ============================================================================

-- 1. Espaces de Chantiers / Sites d'exploitation
CREATE TABLE IF NOT EXISTS site_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 58),
    location_details TEXT,
    client_name VARCHAR(255),
    manager_name VARCHAR(255),
    start_date DATE NOT NULL,
    target_end_date DATE,
    actual_end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    budget_allocated_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_expenses_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_revenue_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_site_workspaces_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_site_workspaces_tenant_id ON site_workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_workspaces_wilaya ON site_workspaces(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_site_workspaces_status ON site_workspaces(status);

ALTER TABLE site_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_workspaces_tenant_isolation ON site_workspaces
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON site_workspaces TO df_tenant_role;


-- 2. Affectations d'Actifs aux Chantiers (Asset-Centric)
CREATE TABLE IF NOT EXISTS asset_site_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    site_id UUID NOT NULL REFERENCES site_workspaces(id) ON DELETE CASCADE,
    assigned_by_user_id UUID,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_end_date TIMESTAMPTZ,
    actual_end_date TIMESTAMPTZ,
    internal_daily_rate_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    start_meter_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    end_meter_hours NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_site_assignments_tenant ON asset_site_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_site_assignments_asset_id ON asset_site_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_site_assignments_site_id ON asset_site_assignments(site_id);
CREATE INDEX IF NOT EXISTS idx_asset_site_assignments_status ON asset_site_assignments(status);

ALTER TABLE asset_site_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_site_assignments_tenant_isolation ON asset_site_assignments
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_site_assignments TO df_tenant_role;


-- 3. Relevés d'Heures Moteur & Consommations Chantiers (Mode 0 Manuel & Mode 2 CAN J1939)
CREATE TABLE IF NOT EXISTS asset_engine_hour_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES site_workspaces(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hours_value NUMERIC(10, 2) NOT NULL,
    delta_hours_since_last NUMERIC(10, 2) NOT NULL DEFAULT 0,
    source VARCHAR(50) NOT NULL DEFAULT 'MANUAL', -- 'MANUAL', 'CAN_J1939', 'ESTIMATED'
    fuel_consumed_liters NUMERIC(10, 2),
    fuel_cost_dzd NUMERIC(15, 2) DEFAULT 0,
    work_description TEXT,
    operator_name VARCHAR(255),
    is_validated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_engine_hour_logs_tenant ON asset_engine_hour_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_engine_hour_logs_asset_id ON asset_engine_hour_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_engine_hour_logs_site_id ON asset_engine_hour_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_asset_engine_hour_logs_recorded_at ON asset_engine_hour_logs(recorded_at);

ALTER TABLE asset_engine_hour_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_engine_hour_logs_tenant_isolation ON asset_engine_hour_logs
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_engine_hour_logs TO df_tenant_role;


-- 4. Checklists de Transfert Inter-Chantiers (Offline-First, Photos, Signatures, Contrôle d'état)
CREATE TABLE IF NOT EXISTS asset_transfer_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    from_site_id UUID REFERENCES site_workspaces(id) ON DELETE SET NULL,
    to_site_id UUID NOT NULL REFERENCES site_workspaces(id) ON DELETE RESTRICT,
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transferred_by VARCHAR(255) NOT NULL,
    received_by VARCHAR(255),
    meter_hours_departure NUMERIC(10, 2) NOT NULL,
    meter_hours_arrival NUMERIC(10, 2),
    general_state VARCHAR(50) NOT NULL DEFAULT 'GOOD', -- 'EXCELLENT', 'GOOD', 'FAIR', 'REQUIRES_REPAIR'
    accessories_checked JSONB NOT NULL DEFAULT '{}',
    photos_urls JSONB NOT NULL DEFAULT '[]',
    signature_departure_svg TEXT,
    signature_arrival_svg TEXT,
    requires_immediate_work_order BOOLEAN NOT NULL DEFAULT FALSE,
    generated_work_order_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_transfer_checklists_tenant ON asset_transfer_checklists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfer_checklists_asset_id ON asset_transfer_checklists(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfer_checklists_from_site ON asset_transfer_checklists(from_site_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfer_checklists_to_site ON asset_transfer_checklists(to_site_id);

ALTER TABLE asset_transfer_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_transfer_checklists_tenant_isolation ON asset_transfer_checklists
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_transfer_checklists TO df_tenant_role;

