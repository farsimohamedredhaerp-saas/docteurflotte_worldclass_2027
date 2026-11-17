-- ============================================================================
-- Migration 17 : Module F — Parts & Procurement (Stock Pièces & Approvisionnement)
-- Respect strict du principe d'ancrage racine : asset_id REFERENCES assets(id)
-- RLS Fail-Closed sur tenant_id & Imputation stricte sur work_orders et asset_id
-- ============================================================================

-- 1. Référentiel des Pièces Détachées (Articles de Stock)
CREATE TABLE IF NOT EXISTS parts_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    part_number VARCHAR(100) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'FILTRES', 'FREINAGE', 'LUBRIFIANTS', 'PNEUMATIQUES', 'SUSPENSION', 'MOTEUR', 'ELECTRICITE', 'DIVERS'
    oem_brand_compatibility JSONB NOT NULL DEFAULT '[]',
    unit_measure VARCHAR(20) NOT NULL DEFAULT 'PIECE', -- 'PIECE', 'LITRE', 'KG', 'JEU'
    average_weighted_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0, -- CMUP
    default_selling_price_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_quantity_in_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    reorder_point_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_parts_tenant_number UNIQUE (tenant_id, part_number)
);

CREATE INDEX IF NOT EXISTS idx_parts_inventory_tenant ON parts_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_number ON parts_inventory(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_category ON parts_inventory(category);

ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parts_inventory_tenant_isolation ON parts_inventory;
CREATE POLICY parts_inventory_tenant_isolation ON parts_inventory
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON parts_inventory TO df_tenant_role;
    END IF;
END $$;


-- 2. Dépôts & Magasins de Stockage par Wilaya
CREATE TABLE IF NOT EXISTS parts_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 58),
    address TEXT,
    manager_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_warehouses_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_parts_warehouses_tenant ON parts_warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parts_warehouses_wilaya ON parts_warehouses(wilaya_code);

ALTER TABLE parts_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_warehouses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parts_warehouses_tenant_isolation ON parts_warehouses;
CREATE POLICY parts_warehouses_tenant_isolation ON parts_warehouses
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON parts_warehouses TO df_tenant_role;
    END IF;
END $$;


-- 3. Niveaux de Stock Multi-Dépôts & Seuils d'Alerte
CREATE TABLE IF NOT EXISTS parts_stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts_inventory(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES parts_warehouses(id) ON DELETE CASCADE,
    quantity_on_hand NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity_available NUMERIC(10, 2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    reorder_point NUMERIC(10, 2) NOT NULL DEFAULT 0,
    location_bin VARCHAR(100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_stock_level UNIQUE (tenant_id, part_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_parts_stock_levels_tenant ON parts_stock_levels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parts_stock_levels_part ON parts_stock_levels(part_id);
CREATE INDEX IF NOT EXISTS idx_parts_stock_levels_warehouse ON parts_stock_levels(warehouse_id);

ALTER TABLE parts_stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_stock_levels FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parts_stock_levels_tenant_isolation ON parts_stock_levels;
CREATE POLICY parts_stock_levels_tenant_isolation ON parts_stock_levels
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON parts_stock_levels TO df_tenant_role;
    END IF;
END $$;


-- 4. Imputation de Pièces sur Ordres de Travail & Actif Racine (asset_id)
CREATE TABLE IF NOT EXISTS work_order_parts_consumption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    part_id UUID NOT NULL REFERENCES parts_inventory(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES parts_warehouses(id) ON DELETE RESTRICT,
    quantity_consumed NUMERIC(10, 2) NOT NULL CHECK (quantity_consumed > 0),
    unit_cost_applied_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cost_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_by_user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_wo_parts_tenant ON work_order_parts_consumption(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wo_parts_asset_id ON work_order_parts_consumption(asset_id);
CREATE INDEX IF NOT EXISTS idx_wo_parts_wo_id ON work_order_parts_consumption(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_parts_part_id ON work_order_parts_consumption(part_id);

ALTER TABLE work_order_parts_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_parts_consumption FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wo_parts_consumption_tenant_isolation ON work_order_parts_consumption;
CREATE POLICY wo_parts_consumption_tenant_isolation ON work_order_parts_consumption
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON work_order_parts_consumption TO df_tenant_role;
    END IF;
END $$;


-- 5. Bons de Commande d'Achat (Multi-Devises DZD, EUR, USD)
CREATE TABLE IF NOT EXISTS parts_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_number VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_nif VARCHAR(50),
    supplier_currency VARCHAR(10) NOT NULL DEFAULT 'DZD', -- 'DZD', 'USD', 'EUR'
    exchange_rate_to_dzd NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
    total_amount_currency NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount_dzd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
    items JSONB NOT NULL DEFAULT '[]',
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_delivery_date DATE,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_po_tenant_number UNIQUE (tenant_id, po_number)
);

CREATE INDEX IF NOT EXISTS idx_parts_po_tenant ON parts_purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parts_po_status ON parts_purchase_orders(status);

ALTER TABLE parts_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_purchase_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parts_po_tenant_isolation ON parts_purchase_orders;
CREATE POLICY parts_po_tenant_isolation ON parts_purchase_orders
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
        GRANT SELECT, INSERT, UPDATE, DELETE ON parts_purchase_orders TO df_tenant_role;
    END IF;
END $$;

