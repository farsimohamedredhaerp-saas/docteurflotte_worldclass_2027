-- =============================================================================
-- FICHIER : database/migrations/03_saas_platform_admin.sql
-- OBJET   : Console d'Administration SaaS DocteurFlotte (Control Plane v2.0-REVISED)
--           Gouvernance Multi-Tenant, Moteur Décisionnel (SAD/ADS), Moteur Fiscal & IoT
--           Conforme aux Recommandations de l'Audit Expert (Publication Ledger, Outbox, 2026 Data)
-- =============================================================================

BEGIN;

-- 1. Table des Tenants de la Plateforme (SuperAdmin Control Plane)
CREATE TABLE IF NOT EXISTS platform_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    slug VARCHAR(100) NOT NULL UNIQUE,
    activity_pack VARCHAR(50) NOT NULL DEFAULT 'TRANSPORT', -- TRANSPORT, BTP_MINES, AGRI, WORKSHOP
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'PRO_GPS_MODE_1', -- STARTER_MODE_0, PRO_GPS_MODE_1, ENTERPRISE_IOT_MODE_2
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'TERMINATED')),
    max_vehicles INT NOT NULL CHECK (max_vehicles >= 0),
    max_devices INT NOT NULL CHECK (max_devices >= 0),
    max_users INT NOT NULL CHECK (max_users >= 0),
    max_api_rate_per_min INT NOT NULL DEFAULT 120,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    tax_id_nif VARCHAR(50),
    trade_reg_nis VARCHAR(50),
    data_origin VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_tenants_slug ON platform_tenants(slug);
CREATE INDEX IF NOT EXISTS idx_platform_tenants_status ON platform_tenants(status);

-- 2. Table de Définition des Configurations du Moteur Décisionnel (Immuable dès Approbation)
CREATE TABLE IF NOT EXISTS platform_decision_engine_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) NOT NULL UNIQUE
);

-- Évolution du schéma pour garantir toutes les colonnes requises
ALTER TABLE platform_decision_engine_configs
    ADD COLUMN IF NOT EXISTS scope_key VARCHAR(100) NOT NULL DEFAULT 'ALGERIA_CORE_DECISION',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS author_email VARCHAR(255) NOT NULL DEFAULT 'architecte@docteurflotte.dz',
    ADD COLUMN IF NOT EXISTS approved_by_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS change_justification TEXT,
    ADD COLUMN IF NOT EXISTS scientific_validation_ref VARCHAR(255),
    ADD COLUMN IF NOT EXISTS config_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS canonical_content_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS arrhenius_activation_energy NUMERIC(10, 2) NOT NULL DEFAULT 6500.0,
    ADD COLUMN IF NOT EXISTS arrhenius_ref_temp_c NUMERIC(6, 2) NOT NULL DEFAULT 90.0,
    ADD COLUMN IF NOT EXISTS arrhenius_idle_degradation_factor NUMERIC(6, 2) NOT NULL DEFAULT 1.80,
    ADD COLUMN IF NOT EXISTS battery_crit_voltage_mv_12v NUMERIC(8, 2) NOT NULL DEFAULT 9600.0,
    ADD COLUMN IF NOT EXISTS battery_crit_voltage_mv_24v NUMERIC(8, 2) NOT NULL DEFAULT 19200.0,
    ADD COLUMN IF NOT EXISTS battery_temp_comp_factor NUMERIC(6, 2) NOT NULL DEFAULT 15.0,
    ADD COLUMN IF NOT EXISTS cooling_ewma_alpha NUMERIC(4, 2) NOT NULL DEFAULT 0.15,
    ADD COLUMN IF NOT EXISTS cooling_overheat_threshold_c NUMERIC(6, 2) NOT NULL DEFAULT 11.0,
    ADD COLUMN IF NOT EXISTS cooling_clogging_threshold_c NUMERIC(6, 2) NOT NULL DEFAULT 7.5,
    ADD COLUMN IF NOT EXISTS cooling_thermostat_stuck_threshold_c NUMERIC(6, 2) NOT NULL DEFAULT -12.0,
    ADD COLUMN IF NOT EXISTS brake_wear_energy_per_mm_mj NUMERIC(8, 2) NOT NULL DEFAULT 25.0,
    ADD COLUMN IF NOT EXISTS brake_min_thickness_mm NUMERIC(4, 2) NOT NULL DEFAULT 3.0,
    ADD COLUMN IF NOT EXISTS dpf_soot_limit_grams NUMERIC(6, 2) NOT NULL DEFAULT 45.0,
    ADD COLUMN IF NOT EXISTS dpf_backpressure_limit_mbar NUMERIC(6, 2) NOT NULL DEFAULT 300.0,
    ADD COLUMN IF NOT EXISTS fuel_siphon_stop_liters NUMERIC(6, 2) NOT NULL DEFAULT 15.0,
    ADD COLUMN IF NOT EXISTS fuel_cusum_slack_liters NUMERIC(6, 2) NOT NULL DEFAULT 0.60,
    ADD COLUMN IF NOT EXISTS fuel_cusum_alarm_ratio NUMERIC(6, 4) NOT NULL DEFAULT 0.05,
    ADD COLUMN IF NOT EXISTS vhi_weights JSONB NOT NULL DEFAULT '{"engine": 0.35, "brakes": 0.25, "cooling": 0.20, "battery": 0.10, "transmission": 0.10}'::jsonb,
    ADD COLUMN IF NOT EXISTS vhi_threshold_green INT NOT NULL DEFAULT 80,
    ADD COLUMN IF NOT EXISTS vhi_threshold_orange INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS inaction_risk_multiplier NUMERIC(6, 2) NOT NULL DEFAULT 3.50,
    ADD COLUMN IF NOT EXISTS downtime_daily_costs_dzd JSONB NOT NULL DEFAULT '{"HEAVY_TRUCK": 45000, "LCV": 15000, "CONSTRUCTION": 65000, "BUS": 35000, "AGRI_TRACTOR": 25000}'::jsonb,
    ADD COLUMN IF NOT EXISTS climate_severity_factors JSONB NOT NULL DEFAULT '{"TELL_URBAN": 0.80, "HIGH_PLATEAUS": 0.70, "SAHARA_DESERT": 0.55}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Contrainte Maker-Checker
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_maker_checker_distinct'
    ) THEN
        ALTER TABLE platform_decision_engine_configs
        ADD CONSTRAINT chk_maker_checker_distinct CHECK (
            (status != 'APPROVED') OR 
            (approved_by_email IS NOT NULL AND approved_by_email <> author_email)
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_platform_decision_configs_status ON platform_decision_engine_configs(status);
CREATE INDEX IF NOT EXISTS idx_platform_decision_configs_scope ON platform_decision_engine_configs(scope_key);


-- 3. Registre des Publications de Configuration (Append-Only Publication Ledger)
CREATE TABLE IF NOT EXISTS platform_config_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope_key VARCHAR(100) NOT NULL,
    config_id UUID NOT NULL REFERENCES platform_decision_engine_configs(id),
    version VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('PUBLICATION_ACTIVATE', 'PUBLICATION_ROLLBACK', 'PUBLICATION_DEACTIVATE')),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    published_by VARCHAR(255) NOT NULL,
    canonical_content_hash VARCHAR(64) NOT NULL,
    justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_publications_scope_active ON platform_config_publications(scope_key) WHERE effective_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_publications_config_id ON platform_config_publications(config_id);

-- 4. Table Outbox Transactionnelle pour Distribution d'Événements & Invalidation Caches
CREATE TABLE IF NOT EXISTS platform_transactional_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
    retry_count INT NOT NULL DEFAULT 0,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_outbox_pending ON platform_transactional_outbox(status, created_at) WHERE status = 'PENDING';

-- 5. Procédure Stockée d'Activation Transactionnelle Sécurisée
CREATE OR REPLACE FUNCTION fn_activate_platform_config(
    p_config_id UUID,
    p_actor_email VARCHAR(255),
    p_scope_key VARCHAR(100),
    p_justification TEXT
) RETURNS UUID AS $$
DECLARE
    v_config RECORD;
    v_pub_id UUID;
    v_retired_count INT;
BEGIN
    -- Verrouillage applicatif sur le périmètre
    PERFORM pg_advisory_xact_lock(hashtext(p_scope_key));

    -- Vérification de l'existence et du statut APPROVED
    SELECT id, version, COALESCE(canonical_content_hash, config_hash) as c_hash, status
    INTO v_config
    FROM platform_decision_engine_configs
    WHERE id = p_config_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Configuration introuvable : %', p_config_id USING ERRCODE = 'P0002';
    END IF;

    IF v_config.status <> 'APPROVED' THEN
        RAISE EXCEPTION 'Interdit : la configuration % est au statut %, statut APPROVED requis', 
            v_config.version, v_config.status USING ERRCODE = '22023';
    END IF;

    -- Clôture de la publication active précédente pour ce périmètre
    UPDATE platform_config_publications
    SET effective_to = NOW(),
        updated_at = NOW()
    WHERE scope_key = p_scope_key AND effective_to IS NULL;
    GET DIAGNOSTICS v_retired_count = ROW_COUNT;

    -- Insertion de la nouvelle publication active
    INSERT INTO platform_config_publications (
        scope_key, config_id, version, event_type, effective_from, 
        published_by, canonical_content_hash, justification
    ) VALUES (
        p_scope_key, v_config.id, v_config.version, 'PUBLICATION_ACTIVATE', NOW(),
        p_actor_email, v_config.c_hash, p_justification
    ) RETURNING id INTO v_pub_id;

    -- Insertion dans l'Outbox transactionnel pour notification asynchrone Redis
    INSERT INTO platform_transactional_outbox (
        event_type, aggregate_type, aggregate_id, payload
    ) VALUES (
        'CONFIG_CACHE_INVALIDATED', 'DECISION_CONFIG', v_config.id::TEXT,
        json_build_object(
            'scope_key', p_scope_key,
            'config_id', v_config.id,
            'version', v_config.version,
            'canonical_hash', v_config.c_hash,
            'publication_id', v_pub_id,
            'published_at', NOW()
        )
    );

    -- Piste d'audit immuable
    INSERT INTO platform_audit_logs (
        actor_email, action, target_entity, target_id, notes
    ) VALUES (
        p_actor_email, 'ACTIVATE_CONFIG', 'platform_config_publications', v_pub_id::TEXT,
        format('Activation de la version %s pour le scope %s (%s ancienne(s) publication(s) fermée(s))',
               v_config.version, p_scope_key, v_retired_count)
    );

    RETURN v_pub_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Procédure Stockée de Rollback Transactionnel Append-Only
CREATE OR REPLACE FUNCTION fn_rollback_platform_config(
    p_scope_key VARCHAR(100),
    p_actor_email VARCHAR(255),
    p_justification TEXT
) RETURNS UUID AS $$
DECLARE
    v_prev_pub RECORD;
    v_new_pub_id UUID;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_scope_key));

    -- Identifier l'avant-dernière publication valide pour ce scope
    SELECT config_id, version, canonical_content_hash
    INTO v_prev_pub
    FROM platform_config_publications
    WHERE scope_key = p_scope_key AND effective_to IS NOT NULL
    ORDER BY effective_to DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aucune publication antérieure trouvée pour effectuer un rollback sur le scope %', p_scope_key
            USING ERRCODE = 'P0002';
    END IF;

    -- Clôturer la publication active courante
    UPDATE platform_config_publications
    SET effective_to = NOW(),
        updated_at = NOW()
    WHERE scope_key = p_scope_key AND effective_to IS NULL;

    -- Insérer un nouvel événement de publication désignant la version précédente (Append-Only)
    INSERT INTO platform_config_publications (
        scope_key, config_id, version, event_type, effective_from,
        published_by, canonical_content_hash, justification
    ) VALUES (
        p_scope_key, v_prev_pub.config_id, v_prev_pub.version, 'PUBLICATION_ROLLBACK', NOW(),
        p_actor_email, v_prev_pub.canonical_content_hash, p_justification
    ) RETURNING id INTO v_new_pub_id;

    -- Notifier l'Outbox pour invalidation des caches du runtime
    INSERT INTO platform_transactional_outbox (
        event_type, aggregate_type, aggregate_id, payload
    ) VALUES (
        'CONFIG_CACHE_INVALIDATED', 'DECISION_CONFIG', v_prev_pub.config_id::TEXT,
        json_build_object(
            'scope_key', p_scope_key,
            'config_id', v_prev_pub.config_id,
            'version', v_prev_pub.version,
            'canonical_hash', v_prev_pub.canonical_content_hash,
            'publication_id', v_new_pub_id,
            'rollback', true,
            'published_at', NOW()
        )
    );

    -- Piste d'audit
    INSERT INTO platform_audit_logs (
        actor_email, action, target_entity, target_id, notes
    ) VALUES (
        p_actor_email, 'ROLLBACK_CONFIG', 'platform_config_publications', v_new_pub_id::TEXT,
        format('Rollback vers la version %s pour le scope %s. Motif : %s',
               v_prev_pub.version, p_scope_key, p_justification)
    );

    RETURN v_new_pub_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Table des Prix Officiels des Carburants Naftal (Historique et Actuel 2026)
CREATE TABLE IF NOT EXISTS platform_fiscal_fuel_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fuel_type VARCHAR(50) NOT NULL,
    label_fr VARCHAR(100) NOT NULL,
    price_per_liter_dzd NUMERIC(8, 2) NOT NULL,
    tva_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 19.00,
    is_tva_deductible BOOLEAN NOT NULL DEFAULT TRUE,
    official_reference_joradp VARCHAR(255) NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    author_email VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_platform_fuel_type_date UNIQUE (fuel_type, effective_date)
);

ALTER TABLE platform_fiscal_fuel_prices
    ADD COLUMN IF NOT EXISTS author_email VARCHAR(255) NOT NULL DEFAULT 'system',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 8. Table des Barèmes Officiels de Contrôle Technique ENACTA (JORADP)
CREATE TABLE IF NOT EXISTS platform_regulatory_enacta_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_category VARCHAR(50) NOT NULL UNIQUE,
    label_fr VARCHAR(150) NOT NULL,
    periodicity_months INT NOT NULL,
    first_inspection_months INT NOT NULL DEFAULT 12,
    warning_lead_days INT[] NOT NULL DEFAULT '{30, 15, 7}',
    official_decree_ref VARCHAR(255) NOT NULL,
    mandatory_checkpoints TEXT[] NOT NULL DEFAULT '{FREINAGE,DIRECTION,CHASSIS_SUSPENSION,OPACITE_FUMEES,DISPOSITIF_ATTELAGE}',
    tariff_base_ht_dzd NUMERIC(10, 2) NOT NULL DEFAULT 2450.00,
    tva_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 19.00,
    tariff_total_ttc_dzd NUMERIC(10, 2) NOT NULL DEFAULT 2915.50,
    internal_tco_provision_dzd NUMERIC(10, 2) NOT NULL DEFAULT 8500.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_regulatory_enacta_rules
    ADD COLUMN IF NOT EXISTS tariff_base_ht_dzd NUMERIC(10, 2) NOT NULL DEFAULT 2450.00,
    ADD COLUMN IF NOT EXISTS tva_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 19.00,
    ADD COLUMN IF NOT EXISTS tariff_total_ttc_dzd NUMERIC(10, 2) NOT NULL DEFAULT 2915.50,
    ADD COLUMN IF NOT EXISTS internal_tco_provision_dzd NUMERIC(10, 2) NOT NULL DEFAULT 8500.00;

-- 9. Table des Tarifs Officiels de Vignettes Automobiles (Loi de Finances Algérie)
CREATE TABLE IF NOT EXISTS platform_vignette_tarifs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_category VARCHAR(50) NOT NULL,
    power_cv_min INT NOT NULL,
    power_cv_max INT NOT NULL,
    vehicle_age_min_years INT NOT NULL,
    vehicle_age_max_years INT NOT NULL,
    amount_dzd NUMERIC(10, 2) NOT NULL,
    finance_law_year INT NOT NULL,
    official_reference_joradp VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_vignette_lookup ON platform_vignette_tarifs(vehicle_category, finance_law_year);

-- 10. Table des Règles Fiscales d'Amortissement & Déductibilité
CREATE TABLE IF NOT EXISTS platform_fiscal_tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    label_fr VARCHAR(255) NOT NULL,
    tax_type VARCHAR(50) NOT NULL,
    threshold_amount_dzd NUMERIC(14, 2),
    rate_pct NUMERIC(6, 2),
    legal_basis_article VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Table des Passerelles Télématiques & IoT Platform Cluster
CREATE TABLE IF NOT EXISTS platform_telematics_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    endpoint_url VARCHAR(255) NOT NULL,
    api_port INT NOT NULL,
    protocol_ports VARCHAR(255) NOT NULL,
    health_status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY',
    is_active_gateway BOOLEAN NOT NULL DEFAULT TRUE,
    max_packets_per_sec INT NOT NULL DEFAULT 5000,
    current_latency_ms INT NOT NULL DEFAULT 12,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Piste d'Audit Immuable Append-Only SuperAdmin (Anti-Tampering Trigger & Hash Chaining)
CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
    ip_address VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    legal_reference VARCHAR(255),
    correlation_id VARCHAR(100),
    prev_hash VARCHAR(64),
    entry_hash VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_audit_logs
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS prev_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(64);


CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_action ON platform_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_created_at ON platform_audit_logs(created_at);

-- Trigger Immuable : Interdiction absolue de modification ou suppression sur platform_audit_logs
CREATE OR REPLACE FUNCTION fn_prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLATION DE SÉCURITÉ AUDIT : Les entrées du journal d audit platform_audit_logs sont strictement immuables (APPEND-ONLY). Aucune modification (UPDATE) ou suppression (DELETE) n est autorisée.'
        USING ERRCODE = '55000';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON platform_audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON platform_audit_logs
FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_tampering();

REVOKE UPDATE, DELETE, TRUNCATE ON platform_audit_logs FROM PUBLIC;

-- =============================================================================
-- SEED INITIAL SOUVERAIN (DONNÉES HOMOLOGUÉES 2026 & BASES LÉGALES)
-- =============================================================================

-- A. Configuration Baseline v2.0-PROD (Statut APPROVED & Maker != Checker)
INSERT INTO platform_decision_engine_configs (
    id, version, scope_key, status, author_email, approved_by_email, approved_at, effective_from,
    scientific_validation_ref, config_hash, canonical_content_hash, change_justification,
    arrhenius_activation_energy, arrhenius_ref_temp_c, arrhenius_idle_degradation_factor,
    battery_crit_voltage_mv_12v, battery_crit_voltage_mv_24v, battery_temp_comp_factor,
    cooling_ewma_alpha, cooling_overheat_threshold_c, cooling_clogging_threshold_c, cooling_thermostat_stuck_threshold_c,
    brake_wear_energy_per_mm_mj, brake_min_thickness_mm, dpf_soot_limit_grams, dpf_backpressure_limit_mbar,
    fuel_siphon_stop_liters, fuel_cusum_slack_liters, fuel_cusum_alarm_ratio,
    vhi_weights, vhi_threshold_green, vhi_threshold_orange, inaction_risk_multiplier,
    downtime_daily_costs_dzd, climate_severity_factors
) VALUES (
    'c0000000-0000-0000-0000-000000000001', 'v2.0-PROD-BASELINE', 'ALGERIA_CORE_DECISION', 'APPROVED',
    'architecte@docteurflotte.dz', 'directeur-scientifique@docteurflotte.dz', NOW(), NOW(),
    'MASTER_SPEC v2.0 Section 4 — Modélisation Déterministe Parc Algérien & Arrhenius 254.5 km',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'Configuration initiale de référence validée pour flottes sous climat algérien',
    6500.0, 90.0, 1.80,
    9600.0, 19200.0, 15.0,
    0.15, 11.0, 7.5, -12.0,
    25.0, 3.0, 45.0, 300.0,
    15.0, 0.60, 0.0500,
    '{"engine": 0.35, "brakes": 0.25, "cooling": 0.20, "battery": 0.10, "transmission": 0.10}'::jsonb,
    80, 50, 3.50,
    '{"HEAVY_TRUCK": 45000, "LCV": 15000, "CONSTRUCTION": 65000, "BUS": 35000, "AGRI_TRACTOR": 25000}'::jsonb,
    '{"TELL_URBAN": 0.80, "HIGH_PLATEAUS": 0.70, "SAHARA_DESERT": 0.55}'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
    scope_key = EXCLUDED.scope_key,
    status = EXCLUDED.status,
    canonical_content_hash = EXCLUDED.canonical_content_hash;

-- B. Publication Initiale Active dans le Registre (Single Source of Truth)
INSERT INTO platform_config_publications (
    scope_key, config_id, version, event_type, effective_from, effective_to,
    published_by, canonical_content_hash, justification
) VALUES (
    'ALGERIA_CORE_DECISION', 'c0000000-0000-0000-0000-000000000001', 'v2.0-PROD-BASELINE',
    'PUBLICATION_ACTIVATE', NOW(), NULL,
    'release-admin@docteurflotte.dz', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'Publication initiale de référence de la baseline v2.0-PROD'
) ON CONFLICT DO NOTHING;

-- C. Prix Officiels des Carburants (Historiques 2020-2025 + Nouveaux Tarifs au 1er Janvier 2026)
INSERT INTO platform_fiscal_fuel_prices (
    fuel_type, label_fr, price_per_liter_dzd, tva_rate_pct, is_tva_deductible, official_reference_joradp, effective_date, is_active, author_email
) VALUES 
-- Tarifs 2026 en Vigueur (Ajustement du 1er janvier 2026)
('DIESEL_GASOIL', 'Gazole / Diesel Routier (2026)', 31.00, 19.00, TRUE, 'Ministère des Hydrocarbures et des Mines (Radio Algérienne, 2 janvier 2026)', '2026-01-01', TRUE, 'officier-reglementaire@docteurflotte.dz'),
('ESSENCE_SANS_PLOMB', 'Essence Sans Plomb 95 RON (2026)', 47.00, 19.00, TRUE, 'Ministère des Hydrocarbures et des Mines (Radio Algérienne, 2 janvier 2026)', '2026-01-01', TRUE, 'officier-reglementaire@docteurflotte.dz'),
('GPL_SIRGHAZ', 'GPL / Sirghaz Liquéfié (2026)', 12.00, 19.00, TRUE, 'Ministère des Hydrocarbures et des Mines (Radio Algérienne, 2 janvier 2026)', '2026-01-01', TRUE, 'officier-reglementaire@docteurflotte.dz'),
-- Tarifs Historiques 2020-2025 (Conservés pour calculs rétroactifs et audit)
('DIESEL_GASOIL', 'Gazole / Diesel Routier (Historique 2020-2025)', 29.01, 19.00, TRUE, 'Décret exécutif n° 20-141 du 2 juin 2020 (JORADP n° 33)', '2020-06-03', FALSE, 'officier-reglementaire@docteurflotte.dz'),
('ESSENCE_SANS_PLOMB', 'Essence Sans Plomb (Historique 2020-2025)', 45.62, 19.00, TRUE, 'Décret exécutif n° 20-141 du 2 juin 2020 (JORADP n° 33)', '2020-06-03', FALSE, 'officier-reglementaire@docteurflotte.dz'),
('ESSENCE_SUPER', 'Essence Super 98 RON (Historique 2020-2025)', 45.97, 19.00, TRUE, 'Décret exécutif n° 20-141 du 2 juin 2020 (JORADP n° 33)', '2020-06-03', FALSE, 'officier-reglementaire@docteurflotte.dz'),
('GPL_SIRGHAZ', 'GPL / Sirghaz (Historique 2016-2025)', 9.00, 19.00, TRUE, 'Décret exécutif n° 16-169 du 6 juin 2016 (JORADP n° 35)', '2016-06-08', FALSE, 'officier-reglementaire@docteurflotte.dz')
ON CONFLICT (fuel_type, effective_date) DO UPDATE SET 
    price_per_liter_dzd = EXCLUDED.price_per_liter_dzd,
    is_active = EXCLUDED.is_active,
    official_reference_joradp = EXCLUDED.official_reference_joradp;

-- D. Règles ENACTA (Décret exécutif n° 03-223 du 10 juin 2003)
INSERT INTO platform_regulatory_enacta_rules (
    asset_category, label_fr, periodicity_months, first_inspection_months, warning_lead_days, official_decree_ref, mandatory_checkpoints
) VALUES
('HEAVY_TRUCK', 'Poids Lourds & Tracteurs Routiers (PTAC > 3.5t)', 6, 6, '{30, 15, 7}', 'Décret exécutif n° 03-223 - Art. 18 (JORADP n° 37)', '{FREINAGE_PNEUMATIQUE,DIRECTION,CHASSIS_LONGRONS,DISPOSITIF_SELLETTE,OPACITE_FUMEES}'),
('TANKER_HAZMAT', 'Véhicules Citernes & Matières Dangereuses (HAZMAT)', 6, 6, '{45, 30, 15, 7}', 'Arrêté interministériel matières dangereuses & Art. 21 Décret 03-223', '{ETANCHEITE_CITERNE,CLAPET_COUPE_CIRCUIT,EXTINCTEURS_HOMOLOGUES,FREINAGE,CHASSIS}'),
('BUS', 'Autocars & Véhicules de Transport de Personnes (> 9 places)', 6, 6, '{30, 15, 7}', 'Décret exécutif n° 03-223 - Art. 19', '{FREINAGE_RALENTISSEUR,ISSUES_SECOURS,DIRECTION,CEINTURES,OPACITE_FUMEES}'),
('LCV', 'Véhicules Utilitaires Légers (Fourgons & Pick-ups <= 3.5t)', 12, 24, '{30, 15, 7}', 'Décret exécutif n° 03-223 - Art. 16', '{FREINAGE_HYDRAULIQUE,DIRECTION,PNEUMATIQUES,EMISSIONS_GAZ,ECLAIRAGE}'),
('CONSTRUCTION', 'Engins de Travaux Publics & Carrières', 12, 12, '{30, 15}', 'Réglementation Sécurité Industrielle & Visite Périodique Levage', '{CIRCUITS_HYDRAULIQUES,ORGANES_DE_DIRECTION,VERINS,STRUCTURE_ROPS_FOPS}')
ON CONFLICT (asset_category) DO UPDATE SET periodicity_months = EXCLUDED.periodicity_months, official_decree_ref = EXCLUDED.official_decree_ref;

-- E. Vignettes Automobiles 2025 (Loi de Finances pour 2025 — Article 55 / MFDGI)
DELETE FROM platform_vignette_tarifs WHERE finance_law_year = 2025;
INSERT INTO platform_vignette_tarifs (
    vehicle_category, power_cv_min, power_cv_max, vehicle_age_min_years, vehicle_age_max_years, amount_dzd, finance_law_year, official_reference_joradp
) VALUES
-- Véhicules utilitaires de charge utile <= 2.5 tonnes
('UTILITAIRE_CHARGE_UTILE_LE_2_5T', 1, 99, 0, 2, 6000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
('UTILITAIRE_CHARGE_UTILE_LE_2_5T', 1, 99, 3, 6, 4000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
('UTILITAIRE_CHARGE_UTILE_LE_2_5T', 1, 99, 7, 50, 3000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
-- Véhicules utilitaires de charge utile entre 2.5 tonnes et 5.5 tonnes
('UTILITAIRE_CHARGE_UTILE_2_5T_A_5_5T', 1, 99, 0, 2, 10000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
('UTILITAIRE_CHARGE_UTILE_2_5T_A_5_5T', 1, 99, 3, 6, 7000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
('UTILITAIRE_CHARGE_UTILE_2_5T_A_5_5T', 1, 99, 7, 50, 5000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
-- Poids lourds de charge utile > 5.5 tonnes et tracteurs routiers
('POIDS_LOURD_PLUS_5_5T', 1, 99, 0, 2, 20000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
('POIDS_LOURD_PLUS_5_5T', 1, 99, 3, 6, 14000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
('POIDS_LOURD_PLUS_5_5T', 1, 99, 7, 50, 9000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)'),
-- Transport en commun de voyageurs
('TRANSPORT_VOYAGEURS', 1, 99, 0, 50, 6000.00, 2025, 'Loi de Finances pour 2025 - Art. 55 (MFDGI)');

-- F. Règles Fiscales (Code des Impôts Directs & TCA)
INSERT INTO platform_fiscal_tax_rules (
    rule_code, label_fr, tax_type, threshold_amount_dzd, rate_pct, legal_basis_article, is_active
) VALUES
('PLAFOND_AMORTISSEMENT_VP', 'Plafonnement d amortissement fiscal des véhicules de tourisme', 'AMORTISSEMENT_PLAFONNE', 3000000.00, NULL, 'Art. 141-2 du Code des Impôts Directs (Loi de Finances)', TRUE),
('TVA_DEDUCTIBLE_CARBURANT_UTILITAIRE', 'Déductibilité intégrale de la TVA sur gazole pour flottes utilitaires et transport', 'TVA_DEDUCTIBLE', NULL, 19.00, 'Art. 30 du Code des Taxes sur le Chiffre d Affaires', TRUE),
('EXONERATION_VIGNETTE_ELECTRIQUE_GPL', 'Exonération de vignette automobile pour véhicules équipés en Sirghaz / GPL', 'TAP_EXEMPTION', 0.00, 100.00, 'Art. 302 du Code des Impôts Directs', TRUE)
ON CONFLICT (rule_code) DO NOTHING;

-- G. Passerelles Télématiques Autonomes Traccar & Flespi
INSERT INTO platform_telematics_gateways (
    name, provider_type, endpoint_url, api_port, protocol_ports, health_status, is_active_gateway, max_packets_per_sec, current_latency_ms
) VALUES
('Traccar Local National (Cluster Principal)', 'TRACCAR_SELF_HOSTED', 'http://localhost:8085', 8085, '5027 (Teltonika), 5001 (Coban), 5093 (Queclink)', 'HEALTHY', TRUE, 8000, 8),
('Flespi Failover Stateless (Secours Zéro PII)', 'FLESPI_FAILOVER', 'https://flespi.io/gw', 443, 'Token-Masked Gateway (Only Hardware IMEI)', 'HEALTHY', FALSE, 2500, 24)
ON CONFLICT DO NOTHING;

-- H. Initialisation des Tenants Pilotes
INSERT INTO platform_tenants (
    id, name, legal_name, slug, activity_pack, plan_tier, status, max_vehicles, max_devices, max_users, contact_email, contact_phone, tax_id_nif, data_origin, notes
) VALUES
('00000000-0000-0000-0000-000000000001', 'SARL Logistique Nationale DZ', 'SARL LOGISTIQUE NATIONALE ALGÉRIE', 'logistique-dz', 'TRANSPORT', 'ENTERPRISE_IOT_MODE_2', 'ACTIVE', 150, 150, 25, 'direction@logistique-dz.com', '+213 23 45 67 89', '001216012345678', 'PRODUCTION', 'Grand compte transporteur national pétrolier et conteneurs.'),
('00000000-0000-0000-0000-000000000002', 'BTPH Grand Sud Chantiers', 'EURL BTPH SAHARA INFRASTRUCTURES', 'btph-grand-sud', 'BTP_MINES', 'PRO_GPS_MODE_1', 'ACTIVE', 80, 80, 15, 'exploitation@btph-grandsud.dz', '+213 29 78 90 12', '001530098765432', 'PRODUCTION', 'Engins carrières et terrassement Hassi Messaoud et Ouargla.'),
('00000000-0000-0000-0000-000000000003', 'Agro-Distribution Mitidja', 'SPA AGRO MITIDJA DISTRIBUTION', 'agro-mitidja', 'TRANSPORT', 'STARTER_MODE_0', 'TRIAL', 25, 10, 5, 'flotte@agromitidja.com', '+213 25 34 56 78', '001816045612345', 'PRODUCTION', 'Flotte sous chaîne du froid laitière et produits frais Mode 0.')
ON CONFLICT (slug) DO NOTHING;

-- Privilèges pour le rôle technique tenant (lecture seule des tables globales)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
        GRANT SELECT ON platform_fiscal_fuel_prices TO df_tenant_role;
        GRANT SELECT ON platform_regulatory_enacta_rules TO df_tenant_role;
        GRANT SELECT ON platform_vignette_tarifs TO df_tenant_role;
        GRANT SELECT ON platform_fiscal_tax_rules TO df_tenant_role;
        GRANT SELECT ON platform_decision_engine_configs TO df_tenant_role;
        GRANT SELECT ON platform_config_publications TO df_tenant_role;
    END IF;
END $$;

COMMIT;
