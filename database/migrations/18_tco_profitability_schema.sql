-- ============================================================================
-- Migration 18 : Module D — TCO & Profitability per Asset (TCO & Rentabilité par Actif)
-- Respect strict du principe d'ancrage racine : asset_id REFERENCES assets(id)
-- RLS Fail-Closed sur tenant_id & Consolidation multi-sources en Dinars Algériens (DZD)
-- ============================================================================

-- 1. Centres de Coûts & Budgets Cibles par Actif
CREATE TABLE IF NOT EXISTS asset_cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    cost_center_code VARCHAR(50) NOT NULL,
    allocated_business_unit VARCHAR(100) NOT NULL,
    target_cost_per_km_dzd NUMERIC(10, 2),
    target_cost_per_hour_dzd NUMERIC(10, 2),
    monthly_fixed_budget_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_cost_center_asset UNIQUE (tenant_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON asset_cost_centers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_asset_id ON asset_cost_centers(asset_id);

ALTER TABLE asset_cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cost_centers_tenant_isolation ON asset_cost_centers
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_cost_centers TO df_tenant_role;


-- 2. Simulations Décisionnelles Formelles "Réparer vs Remplacer" (12/24 mois)
CREATE TABLE IF NOT EXISTS asset_decision_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    simulation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    horizon_months INT NOT NULL DEFAULT 24,
    vhi_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
    estimated_immediate_repair_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    projected_maintenance_next_24m_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    projected_fuel_consumption_next_24m_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    new_asset_acquisition_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    new_asset_projected_tco_24m_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    existing_asset_total_projected_tco_24m_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    recommended_decision VARCHAR(50) NOT NULL, -- 'REPAIR_AND_CONTINUE', 'REPLACE_BY_NEW', 'TRANSFER_TO_LIGHT_DUTY'
    net_savings_estimate_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    roi_months NUMERIC(6, 1) NOT NULL DEFAULT 0,
    justification_dossier TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_simulations_tenant ON asset_decision_simulations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decision_simulations_asset_id ON asset_decision_simulations(asset_id);
CREATE INDEX IF NOT EXISTS idx_decision_simulations_date ON asset_decision_simulations(simulation_date);

ALTER TABLE asset_decision_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY decision_simulations_tenant_isolation ON asset_decision_simulations
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON asset_decision_simulations TO df_tenant_role;

