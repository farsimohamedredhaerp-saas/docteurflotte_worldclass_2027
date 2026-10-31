// Fichier : apps/api/src/sovereign-rag/seeds/oem-enacta-knowledge.seed.ts
import { IngestKnowledgeItemDto, KnowledgeCategory, VehicleSubsystem } from '../dto/sovereign-rag.dto';

export const OEM_ENACTA_SEEDS: IngestKnowledgeItemDto[] = [
  // 1. RENAULT TRUCKS KERAX 440 DXi 11 - Culasse
  {
    category: KnowledgeCategory.OEM_MANUAL,
    manufacturer: 'RENAULT_TRUCKS',
    model_series: 'Kerax 440 DXi 11 Euro 3/5',
    subsystem: VehicleSubsystem.MOTEUR,
    section_title: 'Culasse DXi 11 — Procédure et Couples de Serrage Angulaire',
    content: `Procédure de repose de culasse sur moteur Renault DXi 11 (Tracteur Kerax 440).
Vis neuves impératives huilées sous tête.
Ordre de serrage en escargot en partant des vis centrales vers les extrémités.
- Étape 1 : Pré-serrage à 60 Nm.
- Étape 2 : Serrage intermédiaire à 150 Nm.
- Étape 3 : Serrage angulaire final à 270° (en 2 passes de 135° ou 1 passe de 270°).
Jeu aux soupapes à froid : Admission 0.40 mm, Échappement 1.60 mm (frein VEB inclus).`,
    structured_specs: {
      step1_torque_nm: 60,
      step2_torque_nm: 150,
      step3_angle_deg: 270,
      intake_clearance_mm: 0.40,
      exhaust_clearance_mm: 1.60,
      bolt_specification: 'M16x2.0 classe 12.9',
      lubrication_required: true,
      tightening_pattern: 'ESCARGOT_CENTRE_EXTERIEUR',
    },
  },

  // 2. RENAULT TRUCKS KERAX 440 DXi 11 - Graissage Saharien
  {
    category: KnowledgeCategory.OEM_MANUAL,
    manufacturer: 'RENAULT_TRUCKS',
    model_series: 'Kerax 440 DXi 11 Euro 3/5',
    subsystem: VehicleSubsystem.MOTEUR,
    section_title: 'Circuit de Graissage DXi 11 — Climat Sévère Saharien',
    content: `Spécifications de lubrification pour Kerax 440 opérant en climat aride et températures ambiantes > 45°C (Sud Algérien, Hassi Messaoud, In Salah).
Capacité totale d'huile : 36.0 Litres avec remplacement des deux cartouches filtrantes et du filtre by-pass centrifuge.
Spécification requise : Huile 15W-40 répondant à la norme Renault Trucks VDS-3 / API CI-4.
Pression d'huile nominale : 3.5 à 5.0 bar à 1500 tr/min. Pression mini au ralenti à chaud (85°C) : 1.5 bar.
Intervalle de vidange en conditions sahariennes poussiéreuses : 15 000 km (contre 30 000 km en Tell).`,
    structured_specs: {
      oil_capacity_liters: 36.0,
      oil_viscosity: '15W-40',
      oil_standard: 'Renault VDS-3 / API CI-4',
      pressure_idle_bar: 1.5,
      pressure_nominal_bar: 4.2,
      oil_temp_normal_celsius: 95,
      severe_interval_km: 15000,
      centrifugal_bypass_filter: true,
    },
  },

  // 3. RENAULT TRUCKS KERAX 440 DXi 11 - DTC SPN 3216 FMI 14
  {
    category: KnowledgeCategory.DTC_INDEX,
    manufacturer: 'RENAULT_TRUCKS',
    model_series: 'Kerax 440 DXi 11 Euro 3/5',
    subsystem: VehicleSubsystem.ECHAPPEMENT_FAP,
    section_title: 'DTC SPN 3216 FMI 14 — Sonde NOx Amont Défaillante / Dérive',
    content: `Code défaut diagnostic SPN 3216 FMI 14 : Capteur NOx amont (entrée catalyseur SCR) - Signal anormal ou dérive hors tolérance.
Causes probables :
1. Encrassement de la sonde par suies dues à une mauvaise combustion ou gasoil à haute teneur en soufre.
2. Défaillance d'alimentation 24V ou rupture du bus CAN dédié NOx (CAN 2).
3. Résistance de terminaison 120 Ohms défectueuse.
Contrôle atelier : Mesurer la résistance entre CAN-H et CAN-L (doit être de 60 Ohms contact coupé). Vérifier tension batterie 24V sur broche 1 du connecteur sonde.`,
    structured_specs: {
      dtc_codes: ['SPN 3216 FMI 14', 'SPN 3216', 'MID 128 PSID 90'],
      component: 'Sonde NOx Amont',
      sensor_supply_voltage_v: 24,
      can_bus_resistance_ohms: 60,
      impact: 'Perte de puissance 40% (mode dégradé limitation de couple)',
      requires_scr_regeneration: false,
    },
  },

  // 4. SHACMAN X3000 Weichai WP12 - Culasse
  {
    category: KnowledgeCategory.OEM_MANUAL,
    manufacturer: 'SHACMAN',
    model_series: 'X3000 Weichai WP12.430 Euro 3/4',
    subsystem: VehicleSubsystem.MOTEUR,
    section_title: 'Moteur Weichai WP12 — Serrage Culasses Individuelles',
    content: `Moteur 6 cylindres Weichai WP12.430 avec culasses individuelles (4 soupapes par cylindre).
Vis de culasse M16x1.5 classe 12.9 (4 vis principales par culasse + vis auxiliaires).
Procédure de serrage impérative :
- Passe 1 : Serrage préliminaire à 60 Nm.
- Passe 2 : Serrage à 180 Nm.
- Passe 3 : Serrage à 260 Nm (±15 Nm).
- Passe 4 : Serrage angulaire final de 90° ± 5°.
Jeu aux soupapes : Admission 0.30 mm, Échappement 0.40 mm. Frein sur échappement WEVB : jeu 0.25 mm.`,
    structured_specs: {
      step1_torque_nm: 60,
      step2_torque_nm: 180,
      step3_torque_nm: 260,
      step4_angle_deg: 90,
      intake_clearance_mm: 0.30,
      exhaust_clearance_mm: 0.40,
      wevb_clearance_mm: 0.25,
      bolt_specification: 'M16x1.5 classe 12.9',
    },
  },

  // 5. SHACMAN X3000 Weichai WP12 - Common Rail DTC P0087
  {
    category: KnowledgeCategory.DTC_INDEX,
    manufacturer: 'SHACMAN',
    model_series: 'X3000 Weichai WP12.430 Euro 3/4',
    subsystem: VehicleSubsystem.INJECTION_CARBURANT,
    section_title: 'DTC P0087 — Pression Rail Inférieure à la Consigne',
    content: `Code défaut P0087 : Rail Fuel Pressure Too Low.
Système Common Rail Bosch CRIN2 sur moteur Weichai WP12. Pression nominale de rampe jusqu'à 1600 bar.
Causes fréquentes en Algérie :
1. Colmatage du préfiltre décanteur d'eau par impuretés ou paraffine lors de températures négatives sur les Hauts-Plateaux (Sétif, Batna, Djelfa).
2. Clapet de décharge de surpression de rampe fuyard (retour fuite > 50 ml/min au ralenti).
3. Pompe haute pression CP3.4 : usure de l'électrovanne proportionnelle IMV / ZME.
Action atelier : Remplacement cartouche préfiltre 30 microns, test des débits de retour d'injecteurs à l'éprouvette (max 25 ml/min par injecteur à chaud).`,
    structured_specs: {
      dtc_codes: ['P0087', 'SPN 94 FMI 1', 'P0087-00'],
      rail_pressure_max_bar: 1600,
      max_injector_leak_ml_per_min: 25,
      relief_valve_trip_pressure_bar: 1850,
      filter_porosity_microns: 30,
    },
  },

  // 6. MERCEDES-BENZ ACTROS 3340 OM501LA - Freinage Pneumatique
  {
    category: KnowledgeCategory.OEM_MANUAL,
    manufacturer: 'MERCEDES_BENZ',
    model_series: 'Actros 3340 / 4140 OM501LA',
    subsystem: VehicleSubsystem.FREINAGE,
    section_title: 'Système de Freinage Telligent — Disques Knorr SN7 & Épaisseurs',
    content: `Système de freinage électropneumatique EBS Telligent avec étriers à disque Knorr-Bremse SN7.
Épaisseurs de garniture et cotes limites :
- Épaisseur garniture de frein neuve : 21.0 mm.
- Cote d'usure minimale absolue : 3.0 mm (au-delà : risque de destruction du disque et perte d'efficacité).
- Épaisseur disque ventilé neuf : 45.0 mm.
- Cote d'épaisseur minimale de rectification du disque : 39.0 mm. Cote de rebut : 37.0 mm.
Course maxi de tige des récepteurs à membrane : 45 mm.
Couple de serrage vis de support d'étrier sur fusée : 480 Nm.`,
    structured_specs: {
      pad_thickness_new_mm: 21.0,
      pad_thickness_min_wear_mm: 3.0,
      disc_thickness_new_mm: 45.0,
      disc_thickness_min_mm: 37.0,
      caliper_mount_torque_nm: 480,
      brake_chamber_max_stroke_mm: 45,
      ebs_pressure_nominal_bar: 10.0,
    },
  },

  // 7. ENACTA ALGÉRIE — Contrôle Technique Freinage (Décret Exécutif 03-223)
  {
    category: KnowledgeCategory.ENACTA_REGULATION,
    manufacturer: 'ENACTA_DZ',
    model_series: 'Barème Réglementaire 133 Points (Poids Lourds)',
    subsystem: VehicleSubsystem.SECURITE_HOMOLOGATION,
    section_title: 'ENACTA Point 1.1 — Efficacité et Déséquilibre de Freinage',
    content: `Prescriptions techniques du contrôle technique périodique des véhicules poids lourds en Algérie (Décret Exécutif n° 03-223 du 10 juin 2003, Arrêté ministériel portant barème des défaillances).
Seuils éliminatoires pour véhicules de PTAC > 3.5 tonnes :
- Efficacité globale du frein de service : Doit être STRICTEMENT supérieure ou égale à 50% du poids réel mesuré sur banc de freinage. En dessous de 50% : DÉFAILLANCE CRITIQUE avec interdiction de circuler.
- Déséquilibre de freinage essieu directeur (Essieu 1) : Doit être STRICTEMENT inférieur ou égal à 20%. Si > 20% : Contre-visite obligatoire sous 15 jours.
- Déséquilibre de freinage essieux arrière / porteurs : Doit être inférieur ou égal à 30%.
- Efficacité du frein de stationnement : Doit être supérieure ou égale à 18%.`,
    structured_specs: {
      min_service_brake_efficiency_pct: 50.0,
      max_steering_axle_imbalance_pct: 20.0,
      max_rear_axle_imbalance_pct: 30.0,
      min_parking_brake_efficiency_pct: 18.0,
      retest_deadline_days: 15,
      legal_reference: 'Décret Exécutif n° 03-223 / JORADP ENACTA Barème 133 Points',
      defect_classification: 'CRITIQUE_INTERDICTION_CIRCULATION',
    },
  },

  // 8. ENACTA ALGÉRIE — Contrôle Pollution & Opacité Fumées Diesel
  {
    category: KnowledgeCategory.ENACTA_REGULATION,
    manufacturer: 'ENACTA_DZ',
    model_series: 'Barème Réglementaire 133 Points (Poids Lourds)',
    subsystem: VehicleSubsystem.ECHAPPEMENT_FAP,
    section_title: 'ENACTA Point 8.2 — Opacité des Fumées d’Échappement Moteurs Diesel',
    content: `Norme de mesure de l'opacité des gaz d'échappement lors de l'accélération libre en station de contrôle agréée ENACTA.
Seuils du coefficient d'absorption k (en m⁻¹) :
- Moteurs Diesel suralimentés (Turbocompressés Euro 2, Euro 3, Euro 4, Euro 5) : k maximal toléré = 2.5 m⁻¹.
- Moteurs Diesel atmosphériques : k maximal toléré = 3.0 m⁻¹.
- Pour véhicules récents Euro 6 munis de filtre à particules d'origine : k maximal toléré = 0.5 m⁻¹.
Si k dépasse le seuil : DÉFAILLANCE MAJEURE, contre-visite après tarage des injecteurs et décalaminage/remplacement du filtre à air et filtre à carburant.`,
    structured_specs: {
      max_opacity_k_turbo_m_minus_1: 2.5,
      max_opacity_k_naturally_aspirated_m_minus_1: 3.0,
      max_opacity_k_euro6_fap_m_minus_1: 0.5,
      legal_reference: 'Décret Exécutif n° 03-223 / Norme Algérienne NA ENACTA',
      recommended_action: 'Tarage injecteurs et remplacement filtre à air',
    },
  },
];
