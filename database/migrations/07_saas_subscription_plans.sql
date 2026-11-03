-- =============================================================================
-- FICHIER : database/migrations/07_saas_subscription_plans.sql
-- OBJET   : Système d'Abonnement Souverain DocteurFlotte (Marché Algérien)
--           Gestion des Plans Flexibles, Dérogations SuperAdmin & Facturation DGI
-- =============================================================================

BEGIN;

-- 1. Table des Plans d'Abonnement Paramétrables (Catalogue SuperAdmin)
CREATE TABLE IF NOT EXISTS saas_subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    billing_model VARCHAR(50) NOT NULL DEFAULT 'ANNUAL_INVOICE' CHECK (
        billing_model IN ('ANNUAL_INVOICE', 'CAPEX_TMA', 'PAY_PER_ACTIVE_ASSET', 'AUDIT_TRIAL', 'MONTHLY_FLEX')
    ),
    price_per_asset_dzd NUMERIC(12, 2) NOT NULL DEFAULT 12000.00,
    base_fee_dzd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    billing_interval_months INT NOT NULL DEFAULT 12,
    min_assets INT NOT NULL DEFAULT 1,
    max_assets INT,
    supported_modes JSONB NOT NULL DEFAULT '["MODE_0"]'::jsonb,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    discount_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_subscription_plans_code ON saas_subscription_plans(code);
CREATE INDEX IF NOT EXISTS idx_saas_subscription_plans_active ON saas_subscription_plans(is_active);

-- 2. Table des Abonnements Tenants (Liaison Client avec Surcharges & Négociations SuperAdmin)
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES saas_subscription_plans(id) ON DELETE RESTRICT,
    billing_model VARCHAR(50) NOT NULL DEFAULT 'ANNUAL_INVOICE' CHECK (
        billing_model IN ('ANNUAL_INVOICE', 'CAPEX_TMA', 'PAY_PER_ACTIVE_ASSET', 'AUDIT_TRIAL', 'MONTHLY_FLEX')
    ),
    custom_price_per_asset_dzd NUMERIC(12, 2), -- Marge de manœuvre SuperAdmin (dérogation de prix)
    custom_base_fee_dzd NUMERIC(12, 2),
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED', 'PENDING_PAYMENT')
    ),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    renewal_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    trial_ends_at TIMESTAMPTZ,
    allocated_vehicles_limit INT NOT NULL DEFAULT 20,
    payment_terms VARCHAR(50) NOT NULL DEFAULT 'ANNUEL_AVANCE' CHECK (
        payment_terms IN ('ANNUEL_AVANCE', 'SEMESTRIEL', 'TRIMESTRIEL', 'MENSUEL', 'BON_DE_COMMANDE_60J')
    ),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'VIREMENT_BANCAIRE' CHECK (
        payment_method IN ('VIREMENT_BANCAIRE', 'CHEQUE', 'ESPECES', 'CIB_EDAHABIA')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

-- 3. Table des Factures d'Abonnement et Proformas (Conformité DGI Algérie)
CREATE TABLE IF NOT EXISTS tenant_subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(50) NOT NULL DEFAULT 'PROFORMA' CHECK (
        invoice_type IN ('PROFORMA', 'FACTURE_DEFINITIVE', 'AVOIR')
    ),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_vehicles_billed INT NOT NULL DEFAULT 0,
    unit_price_dzd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal_ht_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tva_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.19,
    tva_amount_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    stamp_duty_dzd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_ttc_dzd NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED' CHECK (
        status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED')
    ),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_sub_invoices_tenant_id ON tenant_subscription_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_invoices_number ON tenant_subscription_invoices(invoice_number);

-- Activation stricte du Row-Level Security (RLS Fail-Closed) sur les tables multi-tenant
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_subscriptions_isolation_policy ON tenant_subscriptions;
CREATE POLICY tenant_subscriptions_isolation_policy ON tenant_subscriptions
    FOR ALL
    USING (
        tenant_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'PLATFORM_SUPERADMIN'
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

ALTER TABLE tenant_subscription_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_subscription_invoices_isolation_policy ON tenant_subscription_invoices;
CREATE POLICY tenant_subscription_invoices_isolation_policy ON tenant_subscription_invoices
    FOR ALL
    USING (
        tenant_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) = 'PLATFORM_SUPERADMIN'
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

-- 4. Insertion des 5 Plans de Référence Algérie (Souveraineté, Hardware-Agnostic & Maintenance 5.0)
INSERT INTO saas_subscription_plans (
    code, name, description, billing_model, price_per_asset_dzd, base_fee_dzd,
    billing_interval_months, min_assets, max_assets, supported_modes, features,
    is_active, is_public, discount_tiers
) VALUES
(
    'PLAN-MODE0-STARTER',
    'Mode 0 — Zéro-Boîtier & Naftal Pass',
    'Exploitation immédiate sans boîtier GPS. Réconciliation des cartes Naftal, topographie Valhalla et inspections DVIR mobiles PWA Offline-First.',
    'ANNUAL_INVOICE',
    12000.00,
    0.00,
    12,
    1,
    NULL,
    '["MODE_0"]'::jsonb,
    '["Scanner OCR Naftal", "Estimation Kilométrique Valhalla", "Fiches DVIR Mobile PWA", "Conformité Loi 18-07 ANPDP", "Support Email & Téléphone"]'::jsonb,
    TRUE,
    TRUE,
    '[{"minVehicles": 10, "discountPercent": 10}, {"minVehicles": 25, "discountPercent": 15}, {"minVehicles": 50, "discountPercent": 20}]'::jsonb
),
(
    'PLAN-MODE1-STANDARD',
    'Mode 1 — GPS & Télémétrie 58 Wilayas',
    'Suivi temps réel haute fréquence Traccar, éco-conduite, détection des dévers et corridors logistiques des 58 Wilayas algériennes.',
    'ANNUAL_INVOICE',
    24000.00,
    0.00,
    12,
    5,
    NULL,
    '["MODE_0", "MODE_1"]'::jsonb,
    '["Toutes les fonctionnalités Mode 0", "Ingestion Traccar & SIM M2M Algérie", "Carte Souveraine MapLibre GL", "Corridors 58 Wilayas", "Alertes Vitesse & Ralenti Prolongé", "Journal d Audit Éco-Conduite"]'::jsonb,
    TRUE,
    TRUE,
    '[{"minVehicles": 10, "discountPercent": 10}, {"minVehicles": 25, "discountPercent": 15}, {"minVehicles": 50, "discountPercent": 25}]'::jsonb
),
(
    'PLAN-MODE2-PREDICTIVE',
    'Mode 2 — Full CAN J1939 & Maintenance 5.0',
    'Télémétrie moteur profonde (Arrhenius, Archard, EWMA), Huissier CUSUM anti-siphonnage opposable, IA Souveraine Ollama Qwen 2.5 et RAG 62 manuels.',
    'ANNUAL_INVOICE',
    42000.00,
    25000.00,
    12,
    5,
    NULL,
    '["MODE_0", "MODE_1", "MODE_2"]'::jsonb,
    '["Toutes les fonctionnalités Mode 1", "6 Algorithmes Physiques Déterministes", "Huissier Juridique CUSUM Anti-Siphonnage", "IA Copilot Ollama Qwen 2.5 Locale", "Coffre RAG 62 Manuels Constructeurs", "Assistant Vocal d Atelier Darja", "Arbitrage Actuariel SAD -> ADS en DZD"]'::jsonb,
    TRUE,
    TRUE,
    '[{"minVehicles": 15, "discountPercent": 12}, {"minVehicles": 30, "discountPercent": 20}, {"minVehicles": 60, "discountPercent": 30}]'::jsonb
),
(
    'PLAN-DYNAMIC-ACTIVE',
    'Flotte Dynamique — À l Actif Roulant (Pay-As-You-Drive)',
    'Facturation mensuelle équitable uniquement pour les véhicules ayant parcouru plus de 100 km dans le mois. 0 DZD facturé pour les véhicules immobilisés.',
    'PAY_PER_ACTIVE_ASSET',
    2400.00,
    5000.00,
    1,
    5,
    NULL,
    '["MODE_0", "MODE_1"]'::jsonb,
    '["Décompte Automatique au 1er du Mois", "Zéro DA Facturé pour Camion au Garage", "Relevé Transparent des Kilomètres", "Recharge Compte Prépayé ou Facture Mensuelle", "Idéal pour BTP et Activités Saisonnières"]'::jsonb,
    TRUE,
    TRUE,
    '[{"minVehicles": 20, "discountPercent": 10}, {"minVehicles": 50, "discountPercent": 15}]'::jsonb
),
(
    'PLAN-AUDIT-CHOC',
    'Pack Choc — Audit Anti-Fraude & Rétention 90 Jours',
    'Offre pilote sans engagement pour 5 à 10 camions avec garantie de résultat. Amorti dès la détection de la première anomalie de carburant.',
    'AUDIT_TRIAL',
    60000.00,
    0.00,
    3,
    5,
    10,
    '["MODE_1", "MODE_2"]'::jsonb,
    '["Audit Carburant Haute Précision CUSUM", "Génération des PV d Infraction Opposables", "Rapport d Économie Nette en Dinars", "Prêt de Boîtiers Télématiques Pilotes", "Garantie Satisfait ou Remboursé sous 90 Jours"]'::jsonb,
    TRUE,
    TRUE,
    '[]'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- 5. Lier les tenants existants à un abonnement par défaut
INSERT INTO tenant_subscriptions (
    tenant_id, plan_id, billing_model, status, allocated_vehicles_limit, payment_terms, payment_method, notes
)
SELECT 
    pt.id,
    p.id,
    p.billing_model,
    'ACTIVE',
    COALESCE(pt.max_vehicles, 25),
    'ANNUEL_AVANCE',
    'VIREMENT_BANCAIRE',
    'Abonnement standard initialisé automatiquement'
FROM platform_tenants pt
CROSS JOIN (
    SELECT id, billing_model FROM saas_subscription_plans WHERE code = 'PLAN-MODE1-STANDARD' LIMIT 1
) p
ON CONFLICT (tenant_id) DO NOTHING;

COMMIT;

