-- =============================================================================
-- FICHIER : database/seeds/01_seed_oem_maintenance_dz.sql
-- OBJET   : Référentiel Constructeurs (OEM RMI) — 15 Modèles Clés Algérie
--           Supporte Mode 0 (Sans Boîtier), Mode 1 (GPS) et Mode 2 (CAN/J1939)
-- =============================================================================

BEGIN;

-- Contrainte d'unicité sur les tâches par modèle pour garantir l'idempotence du Seed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_oem_template_task_code'
    ) THEN
        ALTER TABLE oem_maintenance_tasks
        ADD CONSTRAINT uq_oem_template_task_code UNIQUE (template_id, task_code);
    END IF;
END $$;

-- =============================================================================
-- 1. INSERTION DES 15 PROFILS CONSTRUCTEURS (OEM MAINTENANCE TEMPLATES)
-- =============================================================================

INSERT INTO oem_maintenance_templates (
    wmi_prefix, make, model, engine_code, asset_category, fuel_type,
    ref_consumption_l_100km, ref_consumption_l_hour, oil_capacity_liters, oil_norm_spec
) VALUES
-- 1. Renault Trucks T480 / K480 (Transport Lourd & Chantier)
('VF6', 'Renault Trucks', 'T 480 / K 480', 'DTI 13 (12.8L)', 'HEAVY_TRUCK', 'DIESEL', 33.50, 14.50, 36.00, '10W-40 Renault Trucks RLD-3 / VDS-4.5'),

-- 2. MAN TGS 33.440 / 40.440 6x4 (Tracteur Lourd / Convoi Saharien)
('WMA', 'MAN', 'TGS 33.440 / 40.440', 'D2066 LF (10.5L)', 'HEAVY_TRUCK', 'DIESEL', 36.00, 15.50, 40.00, '10W-40 MAN M 3277 / M 3477'),

-- 3. Mercedes-Benz Actros MP3 / MP4 (Transport National & Citernes Hydrocarbures)
('WDB', 'Mercedes-Benz', 'Actros 2041 / 3344', 'OM 501 LA V6 (11.9L)', 'HEAVY_TRUCK', 'DIESEL', 34.50, 14.80, 38.00, '10W-40 MB-Approval 228.5'),

-- 4. Shacman X3000 / F3000 6x4 (Benne BTP, Agrégats & Transport Lourd)
('LZG', 'Shacman', 'X3000 / F3000 6x4', 'Weichai WP12.430E201', 'HEAVY_TRUCK', 'DIESEL', 39.50, 16.50, 32.00, '15W-40 API CI-4 / CH-4'),

-- 5. SNVI K66 / K120 (Porteur National Algérien)
('VFA', 'SNVI', 'K66 / K120', 'Deutz F6L912 (Air-Cooled)', 'HEAVY_TRUCK', 'DIESEL', 22.00, 8.50, 14.50, '15W-40 API CG-4 / MIL-L-2104E'),

-- 6. Isuzu NPR 71 / NQR 75 (Distribution Inter-Wilayas & Dépannage)
('JAA', 'Isuzu', 'NPR 71 / NQR 75', '4HK1-TCN (5.2L)', 'HEAVY_TRUCK', 'DIESEL', 17.50, 6.20, 13.00, '10W-40 ACEA E7 / API CI-4'),

-- 7. Hyundai HD65 / HD72 / HD120 (Distribution Urbaine & Frigo Porteur)
('KMF', 'Hyundai', 'HD65 / HD72', 'D4DB (3.9L Turbo)', 'HEAVY_TRUCK', 'DIESEL', 16.80, 5.80, 8.50, '15W-40 API CH-4 / CI-4'),

-- 8. Renault Master III 2.3 dCi (Grand Fourgon Logistique)
('VF1', 'Renault', 'Master III', '2.3 dCi M9T', 'VAN', 'DIESEL', 9.80, 3.20, 8.90, '5W-30 Renault RN0720 / ACEA C4'),

-- 8b. Renault Kangoo II / Express 1.5 dCi (Fourgonnette Urbaine & Flotte Messagerie, Années 2008-2021)
('VF1', 'Renault', 'Kangoo II / Express', '1.5 dCi 85 / 90 (K9K)', 'VAN', 'DIESEL', 4.70, 1.10, 4.50, '5W-30 Renault RN0720 / ACEA C4 (ou 5W-40 RN0710)'),

-- 9. Fiat Ducato / Peugeot Boxer (Grand Fourgon Distribution)
('ZFA', 'Fiat / Peugeot', 'Ducato / Boxer', '2.2 MultiJet3 / HDi 140', 'VAN', 'DIESEL', 9.50, 3.10, 6.30, '0W-30 / 5W-30 ACEA C2 (Fiat 9.55535-DS1)'),

-- 10. Peugeot Partner / Citroën Berlingo / Fiat Doblo (Fourgonnette Messagerie/Pharma)
('VF3', 'Peugeot / Fiat', 'Partner / Doblo', '1.6 HDi 92 (DV6DTED)', 'VAN', 'DIESEL', 6.40, 2.10, 3.80, '5W-30 PSA B71 2290 / ACEA C2'),

-- 11. Toyota Hilux 4x4 (Exploitation Pétrolière Grand Sud, Mines & Chantiers)
('AHT', 'Toyota', 'Hilux 4x4 Double Cab', '2.4 D-4D (2GD-FTV)', 'LIGHT_VEHICLE', 'DIESEL', 9.20, 3.50, 7.50, '5W-30 API CF-4 / ACEA C2'),

-- 12. Dacia Duster / Logan MCV (Véhicule de Liaison & Flotte Commerciale)
('UU1', 'Dacia', 'Duster / Logan', '1.5 dCi (K9K)', 'LIGHT_VEHICLE', 'DIESEL', 5.80, 1.80, 4.50, '5W-40 Renault RN0710 / ACEA B4'),

-- 13. Thermo King SLXi 300 / SLXe 300 (Groupe Frigorifique Semi-Remorque)
('TKG', 'Thermo King', 'SLXi 300 / SLXe 300', 'Yanmar TK486V (2.1L)', 'TRAILER_REEFER', 'DIESEL', 0.00, 3.40, 14.20, '15W-40 Thermo King API CI-4'),

-- 14. JCB 3CX / 4CX Eco (Tractopelle BTP / VRD / Génie Civil)
('SLP', 'JCB', '3CX / 4CX Backhoe Loader', 'JCB Dieselmax 444 (4.4L)', 'CONSTRUCTION_EQUIP', 'DIESEL', 0.00, 8.20, 15.00, '10W-40 JCB Extreme Performance ACEA E7'),

-- 15. Cirta C6807 / Massey Ferguson MF 440 (Tracteur Agricole Céréaliculture)
('CIR', 'Cirta / Massey Ferguson', 'C6807 / MF 440', 'Perkins 1104D-44T / Deutz', 'AGRI_TRACTOR', 'DIESEL', 0.00, 7.50, 8.50, '15W-40 API CI-4 / STOU Multi-Agri')

ON CONFLICT (make, model, engine_code) DO UPDATE SET
    wmi_prefix = EXCLUDED.wmi_prefix,
    asset_category = EXCLUDED.asset_category,
    ref_consumption_l_100km = EXCLUDED.ref_consumption_l_100km,
    ref_consumption_l_hour = EXCLUDED.ref_consumption_l_hour,
    oil_capacity_liters = EXCLUDED.oil_capacity_liters,
    oil_norm_spec = EXCLUDED.oil_norm_spec;


-- =============================================================================
-- 2. INSERTION DES OPÉRATIONS DE MAINTENANCE CONSTRUCTEURS (USAGE NORMAL & SÉVÈRE)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MODÈLE 01 : RENAULT TRUCKS T 480 / K 480 — DTI 13
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange huile moteur DTI 13 (36L) + remplacement 2 filtres à huile + filtre centrifuge', 'ENGINE', 60000, 12, 1200, 30000, 6, 600, 90, 1.50),
    ('FUEL_FILTER_WATER_SEP', 'Remplacement filtre à gazole principal + cartouche préfiltre séparateur d''eau Racor', 'FILTRATION', 60000, 12, 1200, 25000, 6, 500, 45, 1.35),
    ('AIR_FILTER_ELEMENT', 'Remplacement cartouche filtre à air primaire + élément de sécurité (Spécial Sable/Poussière)', 'FILTRATION', 90000, 24, 1800, 30000, 6, 600, 35, 1.25),
    ('AIR_DRYER_CARTRIDGE', 'Remplacement cartouche dessiccateur d''air comprimé APM (Protection circuit freinage pneumatique)', 'BRAKES', 90000, 12, 1800, 45000, 6, 900, 30, 1.40),
    ('OPTIDRIVER_GEARBOX_OIL', 'Vidange boîte de vitesses robotisée Optidriver + pont arrière (Huile 75W-90)', 'TRANSMISSION', 240000, 36, 4500, 120000, 18, 2400, 120, 1.20),
    ('BRAKE_LININGS_DISCS', 'Contrôle et remplacement garnitures/plaquettes de frein + contrôle disques/tambours', 'BRAKES', 120000, 24, 2400, 65000, 12, 1300, 180, 1.50),
    ('COOLANT_VALVE_LASH', 'Vidange liquide de refroidissement Ultracooling Plus + réglage jeu aux soupapes et frein Optibrake', 'COOLING', 240000, 36, 4500, 150000, 24, 3000, 210, 1.30)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Renault Trucks' AND t.model = 'T 480 / K 480'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km,
    severe_interval_engine_hours = EXCLUDED.severe_interval_engine_hours;

-- -----------------------------------------------------------------------------
-- MODÈLE 02 : MAN TGS 33.440 / 40.440 — D2066 LF
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur MAN D2066 (40L MAN M 3277) + cartouche filtre à huile', 'ENGINE', 50000, 12, 1000, 25000, 6, 500, 90, 1.50),
    ('FUEL_FILTER_SEPAR', 'Remplacement filtre carburant KSC + cartouche préfiltre chauffant séparateur d''eau', 'FILTRATION', 50000, 12, 1000, 20000, 6, 400, 45, 1.40),
    ('AIR_FILTER_HEAVY_DUTY', 'Remplacement filtre à air double étage + nettoyage cyclone pré-filtre poussière', 'FILTRATION', 80000, 24, 1600, 25000, 6, 500, 40, 1.30),
    ('ZF_GEARBOX_AXLE_OIL', 'Vidange boîte de vitesses ZF TipMatic / Manuelle + ponts planétaires tandem 6x4', 'TRANSMISSION', 180000, 24, 3600, 90000, 12, 1800, 150, 1.25),
    ('BRAKE_DRUMS_LININGS', 'Révision garnitures de freins à tambour S-Cam + rattrapage automatique d''usure', 'BRAKES', 100000, 18, 2000, 55000, 9, 1100, 190, 1.50),
    ('COOLING_CAB_TILT_HYD', 'Purge circuit de refroidissement MAN + contrôle pompe à eau et vérin basculement cabine', 'COOLING', 200000, 36, 4000, 120000, 24, 2400, 140, 1.30)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'MAN' AND t.model = 'TGS 33.440 / 40.440'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 03 : MERCEDES-BENZ ACTROS 2041 / 3344 — OM 501 LA V6
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Maintenance Moteur Telligent : Vidange OM 501 LA (38L MB 228.5) + filtre', 'ENGINE', 60000, 12, 1200, 30000, 6, 600, 90, 1.50),
    ('FUEL_FILTER_SYSTEM', 'Remplacement élément filtre à carburant + séparateur d''eau additionnel', 'FILTRATION', 60000, 12, 1200, 25000, 6, 500, 45, 1.35),
    ('AIR_FILTER_ELEMENT', 'Remplacement cartouche filtre à air principale', 'FILTRATION', 90000, 24, 1800, 30000, 6, 600, 30, 1.25),
    ('POWERSHIFT_RETARDER_OIL', 'Vidange boîte Mercedes PowerShift + vidange ralentisseur hydraulique Voith Retarder', 'TRANSMISSION', 200000, 36, 4000, 100000, 18, 2000, 140, 1.35),
    ('BRAKE_PADS_DISCS', 'Remplacement plaquettes de frein haute performance + contrôle capteurs d''usure EBS', 'BRAKES', 110000, 24, 2200, 60000, 12, 1200, 160, 1.50)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Mercedes-Benz' AND t.model = 'Actros 2041 / 3344'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 04 : SHACMAN X3000 / F3000 6x4 — WEICHAI WP12.430
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur Weichai WP12 (32L 15W-40 CI-4) + 2 filtres à huile', 'ENGINE', 20000, 6, 500, 10000, 3, 250, 75, 1.50),
    ('FUEL_FILTER_DUAL', 'Remplacement double filtre à gazole Weichai + purge décanteur Parker', 'FILTRATION', 20000, 6, 500, 10000, 3, 250, 45, 1.45),
    ('OIL_BATH_AIR_FILTER', 'Nettoyage bain d''huile préfiltre + remplacement cartouches papier primaire/secondaire', 'FILTRATION', 30000, 6, 750, 10000, 2, 250, 50, 1.35),
    ('FAST_GEAR_AXLES_GREASE', 'Vidange boîte Fast Gear 12 rapports + ponts Hande 16T + graissage arbres et sellette', 'TRANSMISSION', 60000, 12, 1500, 30000, 6, 750, 150, 1.30),
    ('HYDRAULIC_TIPPER_PTO', 'Vidange huile hydraulique benne (ISO VG 46/68) + contrôle prise de force (PTO) et vérin', 'HYDRAULICS', 60000, 12, 1200, 30000, 6, 600, 120, 1.35),
    ('BRAKE_DRUMS_SPRINGS', 'Réglage et remplacement garnitures de freins + serrage brides de ressorts à lames', 'BRAKES', 50000, 12, 1200, 25000, 6, 600, 180, 1.50)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Shacman' AND t.model = 'X3000 / F3000 6x4'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 05 : SNVI K66 / K120 — DEUTZ F6L912 (REFROIDISSEMENT PAR AIR)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur Deutz F6L912 (14.5L 15W-40) + remplacement cartouche filtre', 'ENGINE', 10000, 6, 300, 6000, 3, 180, 60, 1.50),
    ('COOLING_FINS_BLOWER_BELT', 'Décrassage ailettes de cylindres (Refroidissement par air) + remplacement courroies turbine', 'COOLING', 20000, 12, 600, 10000, 6, 300, 90, 1.50),
    ('FUEL_AIR_FILTERS', 'Remplacement filtre à gazole + nettoyage filtre à air à bain d''huile', 'FILTRATION', 15000, 6, 450, 7500, 3, 220, 45, 1.30),
    ('BRAKE_SHOES_CLUTCH', 'Révision mâchoires de freins + réglage garde d''embrayage et graissage pivots', 'BRAKES', 35000, 12, 1000, 20000, 6, 600, 150, 1.45)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'SNVI' AND t.model = 'K66 / K120'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 06 : ISUZU NPR 71 / NQR 75 — 4HK1-TCN (5.2L)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur Isuzu 4HK1 (13L 10W-40) + remplacement filtre à huile', 'ENGINE', 15000, 6, 450, 10000, 4, 300, 60, 1.50),
    ('FUEL_FILTER_COMMON_RAIL', 'Remplacement filtre à gazole primaire et secondaire (Protection injecteurs Denso)', 'FILTRATION', 20000, 12, 600, 10000, 6, 300, 45, 1.45),
    ('AIR_FILTER_ELEMENT', 'Remplacement filtre à air Isuzu', 'FILTRATION', 30000, 12, 900, 15000, 6, 450, 25, 1.25),
    ('BRAKE_DRUMS_FLUID', 'Remplacement garnitures de frein avant/arrière + purge liquide DOT 4 et graissage', 'BRAKES', 45000, 18, 1350, 25000, 12, 750, 140, 1.50),
    ('GEARBOX_DIFF_OIL', 'Vidange boîte de vitesses MZZ6F + pont arrière', 'TRANSMISSION', 60000, 24, 1800, 40000, 12, 1200, 75, 1.20)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Isuzu' AND t.model = 'NPR 71 / NQR 75'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 07 : HYUNDAI HD65 / HD72 — D4DB (3.9L TURBO)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur Hyundai D4DB (8.5L 15W-40) + filtre à huile', 'ENGINE', 10000, 6, 350, 7500, 4, 250, 50, 1.50),
    ('FUEL_AIR_FILTERS', 'Remplacement cartouche filtre à gazole + filtre à air', 'FILTRATION', 20000, 12, 700, 10000, 6, 350, 40, 1.35),
    ('BRAKE_LININGS_WHEEL_CYL', 'Révision freins à tambour + contrôle cylindres de roues et maître-cylindre', 'BRAKES', 40000, 18, 1200, 25000, 12, 750, 130, 1.50),
    ('COOLANT_BELTS', 'Vidange radiateur + remplacement courroies d''accessoires et pompe à eau', 'COOLING', 60000, 24, 1800, 40000, 18, 1200, 90, 1.30)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Hyundai' AND t.model = 'HD65 / HD72'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 08 : RENAULT MASTER III — 2.3 dCi (M9T)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur 2.3 dCi M9T (8.9L 5W-30 RN0720) + filtre à huile', 'ENGINE', 20000, 12, 600, 12000, 6, 350, 45, 1.50),
    ('FUEL_AIR_CABIN_FILTERS', 'Remplacement filtre à gazole complet + filtre à air + filtre habitacle', 'FILTRATION', 40000, 24, 1200, 20000, 12, 600, 50, 1.35),
    ('BRAKE_PADS_FRONT_REAR', 'Remplacement plaquettes de frein avant et arrière + contrôle disques', 'BRAKES', 40000, 18, 1200, 25000, 12, 750, 90, 1.50),
    ('ACCESSORY_BELT_COOLANT', 'Remplacement kit courroie d''accessoires + galets + purge liquide refroidissement Type D', 'COOLING', 120000, 48, 3500, 80000, 36, 2400, 120, 1.40)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Renault' AND t.model = 'Master III'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 08b : RENAULT KANGOO II / EXPRESS — 1.5 dCi (K9K)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur 1.5 dCi K9K (4.5L 5W-30 RN0720 / ACEA C4) + filtre à huile', 'ENGINE', 20000, 12, 600, 10000, 6, 300, 40, 1.50),
    ('FUEL_FILTER_DIESEL', 'Remplacement filtre à gazole avec capteur d''eau (Purge décanteur eau Naftal)', 'FILTRATION', 30000, 24, 900, 15000, 12, 450, 35, 1.40),
    ('AIR_CABIN_FILTERS', 'Remplacement cartouche filtre à air moteur + filtre d''habitacle anti-poussière', 'FILTRATION', 30000, 12, 900, 15000, 6, 450, 30, 1.25),
    ('BRAKE_PADS_DISCS_FRONT', 'Contrôle et remplacement plaquettes de frein avant + contrôle disques ventilés', 'BRAKES', 40000, 24, 1200, 25000, 12, 750, 60, 1.50),
    ('TIMING_BELT_WATER_PUMP', 'Remplacement kit courroie de distribution + pompe à eau + courroie d''accessoires', 'ENGINE', 120000, 72, 3600, 80000, 48, 2400, 210, 1.60),
    ('COOLANT_BRAKE_FLUID', 'Purge et vidange liquide de refroidissement Glaceol RX Type D + liquide de frein DOT4', 'COOLING', 120000, 48, 3600, 60000, 24, 1800, 75, 1.30)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Renault' AND t.model = 'Kangoo II / Express'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;


-- -----------------------------------------------------------------------------
-- MODÈLE 09 : FIAT DUCATO / PEUGEOT BOXER — 2.2 MULTIJET3 / HDi 140
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur 2.2 MultiJet/HDi (6.3L 0W-30/5W-30 ACEA C2) + filtre', 'ENGINE', 20000, 12, 600, 10000, 6, 300, 45, 1.50),
    ('FUEL_AIR_FILTERS', 'Remplacement cartouche filtre à gazole UFI + filtre à air', 'FILTRATION', 30000, 12, 900, 15000, 6, 450, 45, 1.35),
    ('TIMING_BELT_WATER_PUMP', 'Remplacement kit courroie de distribution + pompe à eau + courroie accessoires', 'ENGINE', 140000, 60, 4000, 90000, 48, 2600, 210, 1.50),
    ('BRAKE_PADS_DISCS', 'Remplacement plaquettes de frein avant/arrière + purge liquide DOT 4', 'BRAKES', 40000, 18, 1200, 22000, 10, 650, 90, 1.50)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Fiat / Peugeot' AND t.model = 'Ducato / Boxer'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 10 : PEUGEOT PARTNER / FIAT DOBLO — 1.6 HDi 92 (DV6DTED)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur 1.6 HDi DV6 (3.8L 5W-30) + filtre à huile + nettoyage crépine turbo', 'ENGINE', 15000, 12, 450, 10000, 6, 300, 45, 1.50),
    ('FUEL_AIR_FILTERS', 'Remplacement filtre à gazole + filtre à air + filtre habitacle', 'FILTRATION', 30000, 24, 900, 15000, 12, 450, 45, 1.35),
    ('TIMING_BELT_KIT', 'Remplacement kit courroie de distribution + pompe à eau + liquide refroidissement', 'ENGINE', 140000, 60, 4000, 100000, 48, 2800, 180, 1.50),
    ('BRAKE_PADS_DISCS', 'Remplacement plaquettes de frein avant + contrôle disques et freins arrière', 'BRAKES', 35000, 18, 1050, 20000, 12, 600, 75, 1.50)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Peugeot / Fiat' AND t.model = 'Partner / Doblo'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 11 : TOYOTA HILUX 4x4 DOUBLE CAB — 2.4 D-4D (2GD-FTV)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur Toyota D-4D (7.5L 5W-30) + filtre à huile d''origine', 'ENGINE', 10000, 6, 350, 7000, 4, 220, 45, 1.50),
    ('FUEL_AIR_SAND_FILTERS', 'Remplacement filtre à gazole + filtre à air cyclonique (Conditions Pistes & Sahara)', 'FILTRATION', 20000, 12, 700, 10000, 4, 300, 40, 1.45),
    ('TRANSFER_DIFF_4X4_OIL', 'Vidange boîte de transfert 4x4 + différentiels avant/arrière (Huile 75W-85 GL-5) + graissage croisillons', 'TRANSMISSION', 40000, 24, 1400, 20000, 12, 700, 90, 1.35),
    ('BRAKE_PADS_SHOES', 'Remplacement plaquettes avant + dépoussiérage/réglage tambours arrière (Sable)', 'BRAKES', 40000, 18, 1400, 20000, 9, 700, 90, 1.50),
    ('COOLANT_SLLC', 'Remplacement liquide de refroidissement Toyota Super Long Life Coolant + contrôle visco-coupleur', 'COOLING', 100000, 36, 3200, 60000, 24, 2000, 75, 1.35)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Toyota' AND t.model = 'Hilux 4x4 Double Cab'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 12 : DACIA DUSTER / LOGAN — 1.5 dCi (K9K)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('ENG_OIL_FILTER', 'Vidange moteur 1.5 dCi K9K (4.5L 5W-40 RN0710) + filtre à huile', 'ENGINE', 10000, 12, 350, 8000, 6, 250, 40, 1.50),
    ('FUEL_AIR_FILTERS', 'Remplacement filtre à gazole + filtre à air + filtre habitacle', 'FILTRATION', 20000, 12, 700, 10000, 6, 350, 40, 1.35),
    ('TIMING_BELT_WATER_PUMP', 'Remplacement kit courroie de distribution K9K + pompe à eau + courroie accessoires', 'ENGINE', 80000, 48, 2600, 60000, 36, 1900, 180, 1.50),
    ('BRAKE_PADS_FRONT', 'Remplacement plaquettes de frein avant + dépoussiérage tambours arrière', 'BRAKES', 35000, 18, 1100, 20000, 12, 650, 60, 1.50)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Dacia' AND t.model = 'Duster / Logan'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_km = EXCLUDED.normal_interval_km,
    severe_interval_km = EXCLUDED.severe_interval_km;

-- -----------------------------------------------------------------------------
-- MODÈLE 13 : THERMO KING SLXi 300 / SLXe 300 — GROUPE FRIGORIFIQUE (HEURES MOTEUR)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('REEFER_ENG_OIL_FILTERS', 'Vidange moteur thermique Yanmar TK486V (14.2L) + filtre à huile EMI 3000 + filtre à gazole', 'ENGINE', 100000, 12, 1500, 60000, 6, 1000, 90, 1.50),
    ('REEFER_BELTS_COILS_CALIB', 'Contrôle tension courroies compresseur/alternateur + nettoyage condenseur + étalonnage sondes ATP', 'COOLING', 50000, 6, 750, 30000, 4, 500, 75, 1.50),
    ('REEFER_REFRIGERANT_DRYER', 'Contrôle charge fluide frigorigène R-452A/R-404A + remplacement bouteille déshydratante', 'COOLING', 150000, 24, 3000, 100000, 12, 2000, 120, 1.40)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Thermo King' AND t.model = 'SLXi 300 / SLXe 300'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_engine_hours = EXCLUDED.normal_interval_engine_hours,
    severe_interval_engine_hours = EXCLUDED.severe_interval_engine_hours;

-- -----------------------------------------------------------------------------
-- MODÈLE 14 : JCB 3CX / 4CX ECO — TRACTOPELLE BTP (PILOTÉ PAR HEURES MOTEUR)
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('BTP_ENG_OIL_FILTER', 'Service 500h : Vidange moteur JCB Dieselmax (15L) + filtre à huile + filtres carburant/eau', 'ENGINE', 25000, 6, 500, 12500, 3, 250, 90, 1.50),
    ('BTP_HYDRAULIC_FILTER_OIL', 'Service 1000h : Remplacement filtre retour hydraulique + analyse/vidange huile hydraulique JCB HP46', 'HYDRAULICS', 50000, 12, 1000, 25000, 6, 500, 150, 1.50),
    ('BTP_POWERSHIFT_AXLES', 'Service 1000h : Vidange transmission JCB Powershift + ponts avant/arrière à freins immergés', 'TRANSMISSION', 50000, 12, 1000, 25000, 6, 500, 140, 1.40),
    ('BTP_AIR_FILTERS_PINS', 'Remplacement filtres à air primaire/secondaire + graissage complet axes de flèche et godet', 'FILTRATION', 12500, 3, 250, 6000, 1, 125, 60, 1.35)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'JCB' AND t.model = '3CX / 4CX Backhoe Loader'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_engine_hours = EXCLUDED.normal_interval_engine_hours,
    severe_interval_engine_hours = EXCLUDED.severe_interval_engine_hours;

-- -----------------------------------------------------------------------------
-- MODÈLE 15 : TRACTEUR AGRICOLE CIRTA C6807 / MASSEY FERGUSON MF 440
-- -----------------------------------------------------------------------------
INSERT INTO oem_maintenance_tasks (
    template_id, task_code, task_name, subsystem,
    normal_interval_km, normal_interval_months, normal_interval_engine_hours,
    severe_interval_km, severe_interval_months, severe_interval_engine_hours,
    standard_labor_minutes, criticality_weight
)
SELECT id, v.task_code, v.task_name, v.subsystem,
       v.norm_km, v.norm_mo, v.norm_hr,
       v.sev_km, v.sev_mo, v.sev_hr,
       v.labor_min, v.crit_w
FROM oem_maintenance_templates t
CROSS JOIN (VALUES
    ('AGRI_ENG_OIL_FILTER', 'Service 250h : Vidange moteur Perkins/Deutz (8.5L 15W-40) + remplacement filtre à huile', 'ENGINE', 15000, 6, 250, 9000, 3, 150, 60, 1.50),
    ('AGRI_FUEL_AIR_DUST', 'Remplacement double filtre à gazole + nettoyage préfiltre cyclonique et cartouche air (Moissons)', 'FILTRATION', 15000, 6, 250, 6000, 2, 100, 45, 1.45),
    ('AGRI_HYD_PTO_TRANS_OIL', 'Service 1000h : Vidange carter commun Transmission / Relevage Hydraulique / Prise de force (PTO)', 'HYDRAULICS', 60000, 24, 1000, 36000, 12, 600, 150, 1.40)
) AS v(task_code, task_name, subsystem, norm_km, norm_mo, norm_hr, sev_km, sev_mo, sev_hr, labor_min, crit_w)
WHERE t.make = 'Cirta / Massey Ferguson' AND t.model = 'C6807 / MF 440'
ON CONFLICT (template_id, task_code) DO UPDATE SET
    normal_interval_engine_hours = EXCLUDED.normal_interval_engine_hours,
    severe_interval_engine_hours = EXCLUDED.severe_interval_engine_hours;


-- =============================================================================
-- 3. FONCTION STOCKÉE D'INITIALISATION AUTOMATIQUE D'ÉCHÉANCIER PAR VÉHICULE
--    (S'exécute automatiquement lors de l'ajout d'un véhicule en Mode 0, 1 ou 2)
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_bootstrap_vehicle_oem_schedule(p_vehicle_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_vehicle RECORD;
    v_task RECORD;
    v_use_severe BOOLEAN;
    v_eff_km INTEGER;
    v_eff_hours INTEGER;
    v_eff_days INTEGER;
    v_inserted_count INTEGER := 0;
BEGIN
    SELECT * INTO v_vehicle FROM vehicles WHERE id = p_vehicle_id;
    IF NOT FOUND OR v_vehicle.oem_template_id IS NULL THEN
        RETURN 0;
    END IF;

    -- En Algérie, les zones TELL_URBAN (embouteillages) et SAHARA_SOUTH (chaleur/sable)
    -- basculent automatiquement sur la grille Constructeur "Usage Sévère"
    v_use_severe := (v_vehicle.operating_climate_zone IN ('TELL_URBAN', 'SAHARA_SOUTH'));

    FOR v_task IN
        SELECT * FROM oem_maintenance_tasks WHERE template_id = v_vehicle.oem_template_id
    LOOP
        IF v_use_severe THEN
            v_eff_km := v_task.severe_interval_km;
            v_eff_hours := v_task.severe_interval_engine_hours;
            v_eff_days := v_task.severe_interval_months * 30;
        ELSE
            v_eff_km := v_task.normal_interval_km;
            v_eff_hours := v_task.normal_interval_engine_hours;
            v_eff_days := v_task.normal_interval_months * 30;
        END IF;

        INSERT INTO vehicle_maintenance_schedules (
            vehicle_id, oem_task_id,
            last_performed_at, last_performed_km, last_performed_engine_hours,
            effective_interval_km, effective_interval_hours, effective_interval_days,
            wear_ratio_pct, predicted_rul_days, predicted_rul_km, status
        ) VALUES (
            v_vehicle.id, v_task.id,
            NOW(), v_vehicle.current_odometer_km, v_vehicle.current_engine_hours,
            v_eff_km, v_eff_hours, v_eff_days,
            0.00, v_eff_days, v_eff_km, 'OK'
        )
        ON CONFLICT DO NOTHING;

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;
