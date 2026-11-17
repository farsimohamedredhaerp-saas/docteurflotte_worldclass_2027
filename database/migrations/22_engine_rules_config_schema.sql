-- =============================================================================
-- FICHIER : database/migrations/22_engine_rules_config_schema.sql
-- OBJET   : Extension ERP Multi-Activités — Matrice Dynamique des Règles de Contrôle Déterministes (Zéro Hardcode)
-- SOUVERAINETÉ : DGI Algérie (LF 2024-2026, CIDTA, CTCA, CPF, Décret 15-247),
--               Physique Déterministe J1939, ENACTA, AETR, RLS Fail-Closed
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table de Paramétrage Dynamique des Moteurs de Contrôle
CREATE TABLE IF NOT EXISTS engine_rules_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = GLOBAL SUPERADMIN DEFAULTS (Pack DZ)
    rule_category VARCHAR(64) NOT NULL CHECK (rule_category IN ('FISCAL', 'TELEMATICS_PHYSICS', 'REGULATORY', 'PROCUREMENT_WORKSHOP')),
    rule_code VARCHAR(64) NOT NULL,
    param_key VARCHAR(128) NOT NULL,
    param_value JSONB NOT NULL,
    is_locked_by_law BOOLEAN NOT NULL DEFAULT FALSE, -- Si TRUE : Ordre public légal (inviolable par le tenant)
    description TEXT,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index unique tenant + règle + clé
CREATE UNIQUE INDEX IF NOT EXISTS uq_engine_rules_config_param 
ON engine_rules_config (
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID), 
    rule_code, 
    param_key
);

CREATE INDEX IF NOT EXISTS idx_engine_rules_tenant_cat ON engine_rules_config(tenant_id, rule_category);
CREATE INDEX IF NOT EXISTS idx_engine_rules_code ON engine_rules_config(rule_code);

-- 2. Activation de Row Level Security (RLS) Fail-Closed
ALTER TABLE engine_rules_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_rules_config FORCE ROW LEVEL SECURITY;

-- 3. Politique d'Isolation Multi-Tenant Fail-Closed
-- Lecture : Le tenant lit ses paramètres personnalisés OU les paramètres globaux (tenant_id IS NULL)
-- Écriture : Le tenant ne peut modifier que ses propres lignes, et pas si is_locked_by_law = TRUE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'engine_rules_config' AND policyname = 'tenant_isolation_engine_rules_select') THEN
        CREATE POLICY tenant_isolation_engine_rules_select ON engine_rules_config
            FOR SELECT
            USING (
                tenant_id IS NULL
                OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'engine_rules_config' AND policyname = 'tenant_isolation_engine_rules_write') THEN
        CREATE POLICY tenant_isolation_engine_rules_write ON engine_rules_config
            FOR ALL
            USING (
                (
                    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                    AND is_locked_by_law = FALSE
                )
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
                (
                    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                    AND is_locked_by_law = FALSE
                )
                OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
    END IF;
END $$;

-- 4. Initialisation des Paramètres Nationaux Globaux (Pack Algérie Zéro Hardcode)
INSERT INTO engine_rules_config (tenant_id, rule_category, rule_code, param_key, param_value, is_locked_by_law, description)
VALUES
    -- PILIER 1 : MOTEUR FISCAL & COMPTABLE
    (NULL, 'FISCAL', 'RULE_09_RAS', 'ras_default_rate', '0.30'::jsonb, TRUE, 'Taux légal de retenue à la source IBS pour prestataires étrangers non installés (Art. 156 CIDTA).'),
    (NULL, 'FISCAL', 'RULE_09_RAS', 'vat_reverse_charge_rate', '0.19'::jsonb, TRUE, 'Taux de TVA autoliquidée sur prestations de services immatériels / logiciels étrangères (Art. 83 CTCA).'),
    (NULL, 'FISCAL', 'RULE_09_RAS', 'account_ras', '"447200"'::jsonb, FALSE, 'Compte SCF pour la retenue à la source IBS.'),
    (NULL, 'FISCAL', 'RULE_09_RAS', 'account_vat_reciprocal_deductible', '"445660"'::jsonb, FALSE, 'Compte SCF TVA déductible autoliquidée.'),
    (NULL, 'FISCAL', 'RULE_09_RAS', 'account_vat_reciprocal_due', '"445760"'::jsonb, FALSE, 'Compte SCF TVA due autoliquidée.'),

    (NULL, 'FISCAL', 'RULE_10_GUARANTEE_WITHHOLDING', 'guarantee_withholding_rate', '0.05'::jsonb, FALSE, 'Taux légal de retenue de garantie sur situations de travaux BTPH en marchés publics (Décret 15-247).'),
    (NULL, 'FISCAL', 'RULE_10_GUARANTEE_WITHHOLDING', 'guarantee_release_months', '12'::jsonb, FALSE, 'Délai standard de libération de garantie après réception provisoire (mois).'),
    (NULL, 'FISCAL', 'RULE_10_GUARANTEE_WITHHOLDING', 'account_guarantee', '"411700"'::jsonb, FALSE, 'Compte SCF Clients - Retenues de garantie.'),
    (NULL, 'FISCAL', 'RULE_10_GUARANTEE_WITHHOLDING', 'account_vat_pending', '"445780"'::jsonb, FALSE, 'Compte SCF TVA sur encaissements en attente.'),

    (NULL, 'FISCAL', 'RULE_11_STAMP_DUTY', 'cash_tax_deduction_ceiling_dzd', '1000000'::jsonb, TRUE, 'Plafond légal de règlement espèces entraînant le rejet de la TVA et de la charge IBS (Art. 169 CIDTA).'),
    (NULL, 'FISCAL', 'RULE_11_STAMP_DUTY', 'stamp_duty_brackets', '[{"min": 0, "max": 300, "rate": 0.0}, {"min": 301, "max": 30000, "rate": 0.01}, {"min": 30001, "max": 100000, "rate": 0.015}, {"min": 100001, "max": null, "rate": 0.02}]'::jsonb, TRUE, 'Barème progressif du droit de timbre fiscal sur quittances espèces (Art. 258 Code du Timbre).'),
    (NULL, 'FISCAL', 'RULE_11_STAMP_DUTY', 'stamp_duty_min_dzd', '5'::jsonb, TRUE, 'Droit de timbre minimum légal en DZD.'),
    (NULL, 'FISCAL', 'RULE_11_STAMP_DUTY', 'stamp_duty_max_dzd', '10000'::jsonb, TRUE, 'Droit de timbre maximum plafonné légal en DZD.'),
    (NULL, 'FISCAL', 'RULE_11_STAMP_DUTY', 'account_stamp_duty', '"445790"'::jsonb, FALSE, 'Compte SCF Droit de timbre fiscal à reverser.'),

    (NULL, 'FISCAL', 'RULE_12_F20_FRANCHISE', 'f20_validation_enforced', 'true'::jsonb, TRUE, 'Vérification obligatoire de l''attestation de franchise F20/AAPI (Art. 42 CTCA).'),
    (NULL, 'FISCAL', 'RULE_12_F20_FRANCHISE', 'f20_check_amount_ceiling', 'true'::jsonb, TRUE, 'Vérification du non-dépassement du montant contingenté en valeur.'),

    (NULL, 'FISCAL', 'RULE_13_VAT_FORFEITURE', 'vat_forfeiture_deadline_month', '12'::jsonb, TRUE, 'Mois limite légal de forclusion de la TVA déductible (Art. 34 CTCA).'),
    (NULL, 'FISCAL', 'RULE_13_VAT_FORFEITURE', 'vat_forfeiture_deadline_day', '20'::jsonb, TRUE, 'Jour limite légal de forclusion de la TVA déductible (20 décembre N+1).'),
    (NULL, 'FISCAL', 'RULE_13_VAT_FORFEITURE', 'vat_forfeiture_additional_years', '1'::jsonb, TRUE, 'Années additionnelles de forclusion (N+1).'),

    -- PILIER 2 : MOTEUR TÉLÉMATIQUE & PHYSIQUE
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T01_CUSUM', 'fuel_thermal_expansion_coeff', '0.00083'::jsonb, FALSE, 'Coefficient volumique de dilatation thermique du gasoil par degré Celsius (1/°C).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T01_CUSUM', 'cusum_sensitivity_k_liters', '3.5'::jsonb, FALSE, 'Sensibilité CUSUM anti-ballottement (L).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T01_CUSUM', 'cusum_threshold_h_liters', '15.0'::jsonb, FALSE, 'Seuil d''alerte CUSUM vol de carburant (L).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T01_CUSUM', 'topographic_pitch_tolerance_deg', '2.5'::jsonb, FALSE, 'Tolérance d''inclinaison routière Valhalla (degrés).'),

    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T02_GHOST_REFUEL', 'tank_capacity_overflow_tolerance_pct', '0.03'::jsonb, FALSE, 'Tolérance de débordement physique du réservoir carburant (3%).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T02_GHOST_REFUEL', 'valhalla_speed_violation_threshold_kmh', '115.0'::jsonb, FALSE, 'Vitesse moyenne maximale physiquement impossible entre 2 stations Naftal.'),

    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T03_CYLINDER_HEAD', 'engine_temp_delta_threshold_celsius', '30.0'::jsonb, FALSE, 'Écart différentiel maximal température huile vs eau (|T_huile - T_eau| en °C).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T03_CYLINDER_HEAD', 'engine_coolant_critical_celsius', '103.0'::jsonb, FALSE, 'Température critique de liquide de refroidissement déclenchant alerte immédiate (°C).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T03_CYLINDER_HEAD', 'engine_coolant_gradient_threshold', '0.15'::jsonb, FALSE, 'Gradient d''emballement thermique d(T_eau)/dt critique (°C/s).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T03_CYLINDER_HEAD', 'engine_temp_sustain_seconds', '180'::jsonb, FALSE, 'Durée de maintien continue de surchauffe (secondes).'),

    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T04_IDLE_WASTE', 'idle_rpm_min', '550'::jsonb, FALSE, 'Régime moteur ralenti minimal (RPM).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T04_IDLE_WASTE', 'idle_rpm_max', '850'::jsonb, FALSE, 'Régime moteur ralenti maximal sous climatisation cabine (RPM).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T04_IDLE_WASTE', 'idle_max_allowed_minutes', '20'::jsonb, FALSE, 'Durée maximale autorisée de ralenti stationnaire injustifié sans prise de force (minutes).'),

    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T05_CLUTCH_SLIP', 'clutch_slip_engine_load_pct', '70'::jsonb, FALSE, 'Charge moteur minimale requise pour tester le patinage d''embrayage (SPN 513 en %).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T05_CLUTCH_SLIP', 'clutch_slip_ratio_tolerance_pct', '8'::jsonb, FALSE, 'Écart de ratio de transmission mesuré vs constructeur (%).'),
    (NULL, 'TELEMATICS_PHYSICS', 'RULE_T05_CLUTCH_SLIP', 'clutch_slip_duration_seconds', '5.0'::jsonb, FALSE, 'Durée continue de patinage sous couple élevé pour valider l''alerte (secondes).'),

    -- PILIER 3 : MOTEUR RÉGLEMENTAIRE & SÉCURITÉ ROUTIÈRE
    (NULL, 'REGULATORY', 'RULE_R01_ENACTA', 'enacta_periodicity_months_by_category', '{"ROAD_VEHICLE": 12, "LIGHT_COMMERCIAL": 6, "HEAVY_TRUCK": 6, "CONSTRUCTION_EQUIPMENT": 6, "HAZMAT_TMD": 6, "RENTAL": 6}'::jsonb, TRUE, 'Périodicité légale du contrôle technique ENACTA par catégorie de véhicule (mois).'),
    (NULL, 'REGULATORY', 'RULE_R01_ENACTA', 'dispatch_lock_on_expiry', 'true'::jsonb, FALSE, 'Interdiction d''affectation de mission dès J+1 d''expiration ENACTA.'),
    (NULL, 'REGULATORY', 'RULE_R01_ENACTA', 'enacta_alert_days_before', '[30, 15, 7]'::jsonb, FALSE, 'Jalons de notification préventive avant expiration ENACTA (jours).'),

    (NULL, 'REGULATORY', 'RULE_R02_DRIVING_HOURS', 'max_continuous_driving_minutes', '270'::jsonb, FALSE, 'Temps maximal de conduite continue sans pause de 45 min (270 min = 4h30).'),
    (NULL, 'REGULATORY', 'RULE_R02_DRIVING_HOURS', 'min_break_duration_minutes', '45'::jsonb, FALSE, 'Durée minimale de repos obligatoire après 4h30 de conduite (minutes).'),
    (NULL, 'REGULATORY', 'RULE_R02_DRIVING_HOURS', 'max_daily_driving_hours', '9'::jsonb, FALSE, 'Temps maximal de conduite journalière (heures).'),
    (NULL, 'REGULATORY', 'RULE_R02_DRIVING_HOURS', 'min_daily_rest_hours', '11'::jsonb, FALSE, 'Durée minimale de repos journalier consécutif (heures).'),

    (NULL, 'REGULATORY', 'RULE_R03_COLD_CHAIN', 'cold_chain_door_sensor_enforced', 'true'::jsonb, FALSE, 'Conditionnement de l''alerte de chaîne du froid à l''état fermé de la porte.'),
    (NULL, 'REGULATORY', 'RULE_R03_COLD_CHAIN', 'cold_chain_thermal_inertia_minutes', '25'::jsonb, FALSE, 'Filtre d''inertie thermique de la denrée (EWMA en minutes).'),
    (NULL, 'REGULATORY', 'RULE_R03_COLD_CHAIN', 'cold_chain_temp_tolerance_celsius', '2.0'::jsonb, FALSE, 'Tolérance admissible d''écart de consigne de température (°C).'),

    -- PILIER 4 : MOTEUR ACHATS, STOCKS PDR & ATELIER
    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A01_THREE_WAY_MATCH', 'three_way_matching_qty_tolerance_pct', '0.0'::jsonb, FALSE, 'Tolérance sur les quantités facturées vs réceptionnées (inégalité stricte <= 0%).'),
    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A01_THREE_WAY_MATCH', 'three_way_matching_rounding_tolerance_dzd', '1.00'::jsonb, FALSE, 'Tolérance d''écart d''arrondi de TVA / remises pied de facture (± DZD).'),
    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A01_THREE_WAY_MATCH', 'require_nif_active_status_before_po', 'true'::jsonb, FALSE, 'Contrôle automatique de validité du NIF et du Registre de Commerce avant validation Bon de Commande.'),

    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A02_SPARE_PARTS_SERIAL', 'spare_parts_abnormal_consumption_factor', '2.5'::jsonb, FALSE, 'Multiplicateur de surconsommation déclenchant l''audit d''anomalie magasin PDR.'),
    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A02_SPARE_PARTS_SERIAL', 'serialized_tracking_categories', '["PNEUMATIQUE", "BATTERIE", "INJECTEUR", "TURBOCOMPRESSEUR", "FILTRE_FAP"]'::jsonb, FALSE, 'Organes majeurs exigeant un scan du numéro de série déposé vs monté.'),
    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A02_SPARE_PARTS_SERIAL', 'block_wo_close_if_serial_mismatch', 'true'::jsonb, FALSE, 'Blocage de clôture de l''ordre de travail en cas de divergence de numéro de série.'),

    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A03_ODOMETER_CHECK', 'odometer_variance_allowed_km', '50'::jsonb, FALSE, 'Écart toléré entre index kilométrique déclaré et index CAN J1939 SPN 245 (km).'),
    (NULL, 'PROCUREMENT_WORKSHOP', 'RULE_A03_ODOMETER_CHECK', 'photo_proof_required_on_variance', 'true'::jsonb, FALSE, 'Exigence de photo du compteur kilométrique si écart supérieur au seuil toléré.')

ON CONFLICT (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID), rule_code, param_key) 
DO UPDATE SET 
    param_value = EXCLUDED.param_value,
    is_locked_by_law = EXCLUDED.is_locked_by_law,
    description = EXCLUDED.description,
    updated_at = NOW();

COMMIT;

