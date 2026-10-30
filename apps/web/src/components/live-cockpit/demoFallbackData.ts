/**
 * ============================================================================
 * FICHIER SÉPARÉ : DEMO_FALLBACK_DATA & CONTRATS TYPESCRIPT (100% DATA-DRIVEN)
 * Aucune constante métier ni statut figé dans l'UI.
 * Les schémas ci-dessous modélisent les 6 types de véhicules de référence.
 * En production SaaS, ces schémas sont récupérés depuis la BDD / l'API REST
 * et les payloads temps réel arrivent via les passerelles Traccar / WebSocket / MQTT.
 * ============================================================================
 */

export type SeverityStatus = 'nominal' | 'warning' | 'critical';
export type ChassisTemplate = 'sedan' | 'van' | 'suv' | 'truck' | 'semi' | 'coach';

export interface SensorThresholds {
  critLow?: number;
  warnLow?: number;
  warnHigh?: number;
  critHigh?: number;
}

export interface SensorSchemaItem {
  key: string;
  label: string;
  code: string;
  unit: string;
  min: number;
  max: number;
  thresholds: SensorThresholds;
  jitter: number;
}

export interface MetricSchemaItem {
  key: string;
  label: string;
  unit: string;
  thresholds?: SensorThresholds;
  valueMap?: Record<string | number, string>;
  rawValue?: number | string;
}

export interface NodeSchemaItem {
  id: string;
  code: string;
  name: string;
  system: string;
  x: number;
  y: number;
  linkedSensorKeys?: string[];
  metricsSchema?: MetricSchemaItem[];
}

export interface RulSchemaItem {
  key: string;
  name: string;
  maxKm: number;
  avgDailyKm: number;
}

export interface DtcItem {
  code: string;
  spn: string;
  targetNodeId: string;
  desc: string;
  title?: string;      // Alias lisible de 'desc' — utilisé dans les payloads Worker
  severity: SeverityStatus;
  count: number;
  time: string;
}

/**
 * Calques d'affichage du blueprint CAD vectoriel.
 * Chaque calque peut être activé/désactivé indépendamment sans re-rendu complet.
 */
export interface CadLayers {
  chassis: boolean;
  powertrain: boolean;
  thermal: boolean;
  electrical?: boolean;
  brakes?: boolean;
}

export interface GpsTelemetry {
  lat: number;
  lng: number;
  alt: number;
  speed: number;
  heading: string;
  latencyMs: number;
}

export interface TelemetryPayload {
  gps: GpsTelemetry;
  values: Record<string, number | string>;
  rulHealth: Record<string, number>;
  dtcs: DtcItem[];
}

export interface VehicleIdentity {
  vin: string;
  plate: string;
  wilaya?: string;
  driver?: string;
  protocol: string;
  dimensions: string;
  weightLabel: string;
  odometerKm?: number;
}

export interface VehicleSchema {
  id: string;
  chassisTemplate: ChassisTemplate;
  code: string;
  shortName: string;
  fullName: string;
  identity: VehicleIdentity;
  sensorsSchema: SensorSchemaItem[];
  nodesSchema: NodeSchemaItem[];
  rulSchema: RulSchemaItem[];
  demoPayload: TelemetryPayload;
}

export const DEMO_FALLBACK_DATA: Record<string, VehicleSchema> = {
  sedan: {
    id: 'sedan',
    chassisTemplate: 'sedan', // Détermine le Blueprint SVG utilisé
    code: 'CLS-01 // BERLINE',
    shortName: 'VOITURE TOURISME',
    fullName: 'BERLINE DE FLOTTE EXÉCUTIVE // OBD-II CAN',
    identity: {
      vin: 'VF1-RFE00-584920-SED',
      plate: 'FL-892-TX',
      protocol: 'ISO 15765-4 (CAN 11/500kbps)',
      dimensions: '4.78m × 1.85m × 1.44m',
      weightLabel: 'PTAC: 1,940 KG',
    },
    sensorsSchema: [
      { key: 'rpm', label: 'RÉGIME MOTEUR', code: 'PID_0C', unit: 'RPM', min: 0, max: 6500, thresholds: { warnHigh: 4800, critHigh: 5800 }, jitter: 45 },
      { key: 'coolant', label: 'TEMP. EAU MOTEUR', code: 'PID_05', unit: '°C', min: 40, max: 125, thresholds: { warnHigh: 102, critHigh: 112 }, jitter: 0.4 },
      { key: 'stft', label: 'CORRECTION INJECTION', code: 'PID_06', unit: '%', min: -15, max: 15, thresholds: { warnLow: -8, warnHigh: 8, critLow: -12, critHigh: 12 }, jitter: 0.3 },
      { key: 'batt', label: 'TENSION ALTERNATEUR', code: 'PID_42', unit: 'V', min: 11.0, max: 15.5, thresholds: { critLow: 11.8, warnLow: 12.4, warnHigh: 14.9, critHigh: 15.2 }, jitter: 0.08 },
      { key: 'fuel', label: 'NIVEAU CARBURANT', code: 'PID_2F', unit: '%', min: 0, max: 100, thresholds: { critLow: 8, warnLow: 18 }, jitter: 0.02 },
      { key: 'tpms_rr', label: 'PRESSION PNEU ARD', code: 'TPMS_RR', unit: 'BAR', min: 1.2, max: 3.2, thresholds: { critLow: 1.65, warnLow: 2.05, warnHigh: 2.85, critHigh: 3.1 }, jitter: 0.01 },
    ],
    nodesSchema: [
      {
        id: 'sed-eng',
        code: 'NOD-01',
        name: 'Moteur 4-Cyl Turbo & Injection Multipoint',
        system: 'POWERTRAIN // ECU_01',
        x: 180,
        y: 122,
        linkedSensorKeys: ['rpm', 'coolant', 'stft'],
        metricsSchema: [
          { key: 'rail_bar', label: 'Pression Rail', unit: 'BAR', thresholds: { warnHigh: 185, critHigh: 200 } },
          { key: 'ign_adv', label: 'Avance Allumage', unit: '° BTDC' },
          { key: 'boost_bar', label: 'Pression Turbo', unit: 'BAR', thresholds: { warnHigh: 1.55, critHigh: 1.8 } },
          { key: 'eng_load', label: 'Charge Calculée', unit: '%', thresholds: { warnHigh: 85, critHigh: 95 } },
        ],
      },
      {
        id: 'sed-trans',
        code: 'NOD-02',
        name: 'Boîte Automatique DSG-7 & Embrayage Double',
        system: 'TRANSMISSION // TCU_02',
        x: 150,
        y: 175,
        linkedSensorKeys: [],
        metricsSchema: [
          { key: 'gear', label: 'Rapport Actuel', unit: '' },
          { key: 'atf_temp', label: 'Temp. Huile ATF', unit: '°C', thresholds: { warnHigh: 108, critHigh: 122 } },
          { key: 'clutch_slip', label: 'Glissement K1/K2', unit: '%', thresholds: { warnHigh: 2.5, critHigh: 5.0 } },
          { key: 'hyd_press', label: 'Pression Hydraulique', unit: 'BAR' },
        ],
      },
      {
        id: 'sed-abs',
        code: 'NOD-03',
        name: 'Groupe Hydraulique ABS / ESP & Freinage',
        system: 'CHASSIS // ESP_09',
        x: 248,
        y: 138,
        linkedSensorKeys: ['batt'],
        metricsSchema: [
          { key: 'mc_bar', label: 'Pression Maître-Cyl.', unit: 'BAR' },
          { key: 'pad_wear_f', label: 'Usure Plaquettes AV', unit: '%', thresholds: { warnHigh: 75, critHigh: 90 } },
          { key: 'steer_deg', label: 'Angle Braquage', unit: '°' },
          { key: 'lat_g', label: 'Accélération Lat.', unit: 'G' },
        ],
      },
      {
        id: 'sed-tpms',
        code: 'NOD-04',
        name: 'Capteur TPMS Roue Arrière Droite',
        system: 'PNEUMATICS // RF_433MHz',
        x: 256,
        y: 458,
        linkedSensorKeys: ['tpms_rr'],
        metricsSchema: [
          { key: 'tpms_rr', label: 'Pression Actuelle', unit: 'BAR', thresholds: { critLow: 1.65, warnLow: 2.05 } },
          { key: 'tpms_target', label: 'Pression Cible', unit: 'BAR' },
          { key: 'tire_temp_rr', label: 'Température Interne', unit: '°C', thresholds: { warnHigh: 45, critHigh: 65 } },
          { key: 'tpms_batt', label: 'Batterie Capteur RF', unit: '%', thresholds: { warnLow: 25, critLow: 10 } },
        ],
      },
      {
        id: 'sed-cat',
        code: 'NOD-05',
        name: 'Ligne Échappement, Catalyseur & Sondes Lambda',
        system: 'EMISSIONS // CAT_O2',
        x: 180,
        y: 345,
        linkedSensorKeys: ['fuel'],
        metricsSchema: [
          { key: 'cat_temp', label: 'Temp. Catalyseur', unit: '°C', thresholds: { warnHigh: 780, critHigh: 890 } },
          { key: 'o2_up', label: 'Sonde O2 Amont', unit: 'V' },
          { key: 'o2_down', label: 'Sonde O2 Aval', unit: 'V' },
          { key: 'back_press', label: 'Contre-Pression', unit: 'mBar' },
        ],
      },
    ],
    rulSchema: [
      { key: 'rul_pads', name: 'Plaquettes & Disques Avant', maxKm: 40000, avgDailyKm: 130 },
      { key: 'rul_oil', name: 'Huile Moteur Synthétique 5W30', maxKm: 15000, avgDailyKm: 130 },
      { key: 'rul_tire_rr', name: 'Pneumatique Arrière Droit (TPMS)', maxKm: 4500, avgDailyKm: 130 },
      { key: 'rul_batt', name: 'Batterie AGM 12V 70Ah (SOH)', maxKm: 55000, avgDailyKm: 130 },
    ],
    demoPayload: {
      gps: { lat: 48.8566, lng: 2.3522, alt: 42, speed: 114, heading: '284° WNW', latencyMs: 18 },
      values: {
        rpm: 2450,
        coolant: 89.4,
        stft: 1.8,
        batt: 14.2,
        fuel: 64.0,
        tpms_rr: 1.92,
        rail_bar: 148,
        ign_adv: 14.5,
        boost_bar: 1.18,
        eng_load: 44.2,
        gear: 'D7',
        atf_temp: 82.1,
        clutch_slip: 0.4,
        hyd_press: 26.4,
        mc_bar: 0.0,
        pad_wear_f: 32,
        steer_deg: -1.2,
        lat_g: 0.04,
        tpms_target: 2.3,
        tire_temp_rr: 46.8,
        tpms_batt: 88,
        cat_temp: 612,
        o2_up: 0.72,
        o2_down: 0.65,
        back_press: 18,
      },
      rulHealth: { rul_pads: 68, rul_oil: 44, rul_tire_rr: 28, rul_batt: 86 },
      dtcs: [
        { code: 'C102D-00', spn: 'TPMS_RR', targetNodeId: 'sed-tpms', desc: 'Sous-gonflage détecté Pneumatique Arrière Droit', severity: 'warning', count: 3, time: '14:12:09 UTC' },
      ],
    },
  },

  van: {
    id: 'van',
    chassisTemplate: 'van',
    code: 'CLS-02 // UTILITAIRE',
    shortName: 'UTILITAIRE LÉGER',
    fullName: 'FOURGON LCV FRIGORIFIQUE // MESSAGERIE & CHAÎNE DU FROID',
    identity: {
      vin: 'WDB-907633-1N0492-LCV',
      plate: 'LC-409-FR',
      protocol: 'OBD-II + RS485 COLD-CHAIN',
      dimensions: '5.93m × 2.02m × 2.64m',
      weightLabel: 'PTAC MAX: 3,500 KG',
    },
    sensorsSchema: [
      { key: 'cargo_t', label: 'TEMP. CELLULE FRIGO', code: 'TMP_CRG1', unit: '°C', min: -5, max: 12, thresholds: { warnHigh: 4.0, critHigh: 7.0 }, jitter: 0.15 },
      { key: 'dpf_soot', label: 'CHARGE SUIES FAP', code: 'PID_8B', unit: '%', min: 0, max: 100, thresholds: { warnHigh: 65, critHigh: 80 }, jitter: 0.1 },
      { key: 'payload', label: 'CHARGE ESSIEU ARR.', code: 'AXL_LOAD', unit: 'KG', min: 500, max: 2200, thresholds: { warnHigh: 1800, critHigh: 2050 }, jitter: 5 },
      { key: 'rpm', label: 'RÉGIME DIESEL', code: 'PID_0C', unit: 'RPM', min: 0, max: 4500, thresholds: { warnHigh: 3500, critHigh: 4100 }, jitter: 35 },
      { key: 'doors', label: 'CYCLES PORTES JOUR', code: 'D_CNT24', unit: 'CYC', min: 0, max: 100, thresholds: { warnHigh: 75, critHigh: 95 }, jitter: 0 },
      { key: 'fuel', label: 'NIVEAU GASOIL', code: 'PID_2F', unit: '%', min: 0, max: 100, thresholds: { critLow: 10, warnLow: 20 }, jitter: 0.04 },
    ],
    nodesSchema: [
      {
        id: 'van-dpf',
        code: 'NOD-01',
        name: 'Filtre à Particules (FAP/DPF) & Vanne EGR',
        system: 'EXHAUST // DPF_CTRL',
        x: 198,
        y: 238,
        linkedSensorKeys: ['dpf_soot'],
        metricsSchema: [
          { key: 'dpf_diff', label: 'Pression Diff. FAP', unit: 'mBar', thresholds: { warnHigh: 220, critHigh: 290 } },
          { key: 'soot_g', label: 'Masse Suies Estimée', unit: 'g/L', thresholds: { warnHigh: 18, critHigh: 23 } },
          { key: 'dpf_in_t', label: 'Temp. Entrée FAP', unit: '°C', thresholds: { warnLow: 280 } },
          { key: 'egr_pct', label: 'Ouverture EGR', unit: '%' },
        ],
      },
      {
        id: 'van-cold',
        code: 'NOD-02',
        name: 'Groupe Frigorifique Toiture & Sonde Cellule Cargo',
        system: 'COLD_CHAIN // ATP_CLASS_A',
        x: 180,
        y: 350,
        linkedSensorKeys: ['cargo_t'],
        metricsSchema: [
          { key: 'supply_air', label: 'Temp. Air Soufflé', unit: '°C' },
          { key: 'cargo_t', label: 'Temp. Reprise Cargo', unit: '°C', thresholds: { warnHigh: 4.0, critHigh: 7.0 } },
          { key: 'atp_set', label: 'Consigne ATP', unit: '°C' },
          { key: 'comp_state', label: 'Compresseur Frigo', unit: '' },
        ],
      },
      {
        id: 'van-axle',
        code: 'NOD-03',
        name: 'Essieu Arrière Renforcé & Jauge de Charge Utile',
        system: 'CHASSIS // LOAD_SENS',
        x: 180,
        y: 472,
        linkedSensorKeys: ['payload'],
        metricsSchema: [
          { key: 'payload', label: 'Masse Essieu AR', unit: 'KG', thresholds: { warnHigh: 1800, critHigh: 2050 } },
          { key: 'front_kg', label: 'Masse Essieu AV', unit: 'KG' },
          { key: 'margin_kg', label: 'Marge avant Surcharge', unit: 'KG', thresholds: { warnLow: 400, critLow: 150 } },
          { key: 'leaf_defl', label: 'Flèche Lames Susp.', unit: 'mm' },
        ],
      },
      {
        id: 'van-clutch',
        code: 'NOD-04',
        name: 'Bloc Diesel 2.0L, Volant Bi-Masse & Embrayage',
        system: 'POWERTRAIN // STOP_START',
        x: 180,
        y: 112,
        linkedSensorKeys: ['rpm'],
        metricsSchema: [
          { key: 'clutch_t', label: 'Temp. Garniture Embr.', unit: '°C', thresholds: { warnHigh: 160, critHigh: 210 } },
          { key: 'ss_cycles', label: 'Cycles Stop/Start', unit: 'CYC' },
          { key: 'eng_trq', label: 'Couple Moteur', unit: 'Nm' },
          { key: 'rail_bar', label: 'Pression Rail', unit: 'BAR' },
        ],
      },
      {
        id: 'van-doors',
        code: 'NOD-05',
        name: 'Capteurs Magnétiques Portes Arrière & Latérale',
        system: 'SECURITY // CARGO_LOCK',
        x: 256,
        y: 385,
        linkedSensorKeys: ['doors'],
        metricsSchema: [
          { key: 'side_door', label: 'Porte Latérale D.', unit: '' },
          { key: 'rear_door', label: 'Portes Battantes AR', unit: '' },
          { key: 'e_seal', label: 'Scellé Électronique', unit: '' },
          { key: 'doors', label: 'Ouvertures Jour', unit: 'CYC' },
        ],
      },
    ],
    rulSchema: [
      { key: 'rul_dpf', name: 'Filtre à Particules (Régénération Forcée)', maxKm: 2200, avgDailyKm: 160 },
      { key: 'rul_brakes_r', name: 'Disques & Plaquettes Frein Arrière (Charge)', maxKm: 12500, avgDailyKm: 160 },
      { key: 'rul_clutch', name: 'Kit Embrayage & Volant Bi-Masse (Urbain)', maxKm: 42000, avgDailyKm: 160 },
      { key: 'rul_belt', name: 'Courroie Compresseur Frigorifique', maxKm: 48000, avgDailyKm: 160 },
    ],
    demoPayload: {
      gps: { lat: 45.764, lng: 4.8357, alt: 174, speed: 68, heading: '112° ESE', latencyMs: 24 },
      values: {
        cargo_t: 4.8,
        dpf_soot: 84.2,
        payload: 1890,
        rpm: 1920,
        doors: 47,
        fuel: 38.5,
        dpf_diff: 312,
        soot_g: 24.8,
        dpf_in_t: 264,
        egr_pct: 62,
        supply_air: 1.4,
        atp_set: 2.0,
        comp_state: 'ACTIVE_MAX',
        front_kg: 1290,
        margin_kg: 320,
        leaf_defl: -34,
        clutch_t: 118,
        ss_cycles: 142,
        eng_trq: 310,
        rail_bar: 1420,
        side_door: 'LOCKED',
        rear_door: 'LOCKED',
        e_seal: 'VALID_#894',
      },
      rulHealth: { rul_dpf: 16, rul_brakes_r: 39, rul_clutch: 58, rul_belt: 81 },
      dtcs: [
        { code: 'P2463-00', spn: 'SPN 3251', targetNodeId: 'van-dpf', desc: 'Accumulation Critique de Suies dans le Filtre à Particules (Banc 1)', severity: 'critical', count: 14, time: '14:28:11 UTC' },
        { code: 'B1492-11', spn: 'COLD_02', targetNodeId: 'van-cold', desc: 'Dépassement Seuil Température Cellule Frigo (> +4.0°C)', severity: 'warning', count: 2, time: '12:51:03 UTC' },
      ],
    },
  },

  suv: {
    id: 'suv',
    chassisTemplate: 'suv',
    code: 'CLS-03 // SUV 4X4',
    shortName: 'SUV / 4X4 INTERVENTION',
    fullName: 'VÉHICULE TOUT-TERRAIN TACTIQUE 4WD // RECONNAISSANCE & CHANTIER',
    identity: {
      vin: 'JTE-BR3FJ-0K9921-4WD',
      plate: 'TT-551-KR',
      protocol: 'OBD-II + CAN CHASSIS 4WD',
      dimensions: '4.95m × 1.98m × 1.92m',
      weightLabel: 'MODE: 4WD LOW-RANGE LOCK',
    },
    sensorsSchema: [
      { key: 'tcase_t', label: 'TEMP. BOÎTE TRANSFERT', code: '4WD_TMP', unit: '°C', min: 40, max: 140, thresholds: { warnHigh: 108, critHigh: 125 }, jitter: 0.5 },
      { key: 'pitch', label: 'INCLINAISON TANGAGE', code: 'IMU_PTCH', unit: 'DEG', min: -35, max: 35, thresholds: { warnHigh: 24, critHigh: 30, warnLow: -24, critLow: -30 }, jitter: 0.3 },
      { key: 'roll', label: 'ANGLE DE ROULIS', code: 'IMU_ROLL', unit: 'DEG', min: -30, max: 30, thresholds: { warnHigh: 10, critHigh: 18, warnLow: -10, critLow: -18 }, jitter: 0.4 },
      { key: 'trq_f', label: 'COUPLE ESSIEU AVANT', code: 'TRQ_FWD', unit: '%', min: 0, max: 100, thresholds: {}, jitter: 0 },
      { key: 'coolant', label: 'TEMP. EAU RADIATEUR', code: 'PID_05', unit: '°C', min: 40, max: 125, thresholds: { warnHigh: 105, critHigh: 115 }, jitter: 0.3 },
      { key: 'aux_v', label: 'BATTERIE AUX. TREUIL', code: 'AUX_24V', unit: 'V', min: 20, max: 30, thresholds: { critLow: 23.0, warnLow: 24.4 }, jitter: 0.05 },
    ],
    nodesSchema: [
      {
        id: 'suv-tcase',
        code: 'NOD-01',
        name: 'Boîte de Transfert Centrale 4x4 (Gamme Courte)',
        system: 'DRIVETRAIN // T_CASE_4L',
        x: 180,
        y: 285,
        linkedSensorKeys: ['tcase_t', 'trq_f'],
        metricsSchema: [
          { key: 'mode_4wd', label: 'Mode Transmission', unit: '' },
          { key: 'tcase_t', label: 'Temp. Huile 75W90', unit: '°C', thresholds: { warnHigh: 108, critHigh: 125 } },
          { key: 'trq_split', label: 'Répartition Couple', unit: '' },
          { key: 'prop_trq', label: 'Couple Arbre Central', unit: 'Nm', thresholds: { warnHigh: 800, critHigh: 950 } },
        ],
      },
      {
        id: 'suv-rdiff',
        code: 'NOD-02',
        name: 'Différentiel Arrière Verrouillable (E-Locker)',
        system: 'AXLE_REAR // DIFF_LOCK',
        x: 180,
        y: 446,
        linkedSensorKeys: [],
        metricsSchema: [
          { key: 'elock_st', label: 'Actionneur E-Lock', unit: '' },
          { key: 'wheel_delta', label: 'Delta Vitesse G/D', unit: 'RPM' },
          { key: 'rdiff_t', label: 'Temp. Pont Arrière', unit: '°C', thresholds: { warnHigh: 105, critHigh: 120 } },
          { key: 'breather', label: 'Pression Reniflard', unit: '' },
        ],
      },
      {
        id: 'suv-susp',
        code: 'NOD-03',
        name: 'Suspension Grand Débattement & Inclinomètre IMU',
        system: 'CHASSIS // KDSS_IMU',
        x: 262,
        y: 295,
        linkedSensorKeys: ['pitch', 'roll'],
        metricsSchema: [
          { key: 'ride_h', label: 'Hauteur Caisse', unit: 'mm' },
          { key: 'travel_rr', label: 'Débattement ARD', unit: '%', thresholds: { warnHigh: 85, critHigh: 96 } },
          { key: 'kdss_st', label: 'Barres Stab. KDSS', unit: '' },
          { key: 'roll', label: 'Roulis Latéral IMU', unit: '°', thresholds: { warnHigh: 10, critHigh: 18 } },
        ],
      },
      {
        id: 'suv-eng',
        code: 'NOD-04',
        name: 'Moteur V6 Bi-Turbo Longitudinal & Blindage Carter',
        system: 'POWERTRAIN // V6_TT',
        x: 180,
        y: 145,
        linkedSensorKeys: ['coolant', 'aux_v'],
        metricsSchema: [
          { key: 'oil_bar', label: 'Pression Huile', unit: 'BAR', thresholds: { critLow: 1.5, warnLow: 2.2 } },
          { key: 'air_clog', label: 'Colmatage Filtre Air', unit: '%', thresholds: { warnHigh: 70, critHigh: 88 } },
          { key: 'iat_t', label: 'Temp. Admission IAT', unit: '°C' },
          { key: 'skid_st', label: 'Blindage Inférieur', unit: '' },
        ],
      },
      {
        id: 'suv-hdc',
        code: 'NOD-05',
        name: 'Freinage Tout-Terrain Crawl Control & Pneus Mud',
        system: 'BRAKES // CRAWL_HDC',
        x: 98,
        y: 150,
        linkedSensorKeys: [],
        metricsSchema: [
          { key: 'mud_bar', label: 'Pression Pneus (4x)', unit: 'BAR' },
          { key: 'caliper_t', label: 'Temp. Étriers AV', unit: '°C', thresholds: { warnHigh: 220, critHigh: 280 } },
          { key: 'terrain_m', label: 'Mode Terrain', unit: '' },
          { key: 'hdc_st', label: 'Assistance Descente', unit: '' },
        ],
      },
    ],
    rulSchema: [
      { key: 'rul_tcase', name: 'Huile Boîte de Transfert & Ponts (Usage Sévère)', maxKm: 6800, avgDailyKm: 115 },
      { key: 'rul_air', name: 'Filtre à Air Cyclonique Pré-Séparateur (Sable)', maxKm: 8000, avgDailyKm: 115 },
      { key: 'rul_bush', name: 'Silentblocs & Rotules Triangle Avant', maxKm: 26000, avgDailyKm: 115 },
      { key: 'rul_mt', name: 'Pneumatiques All-Terrain Renforcés (Kevlar)', maxKm: 34000, avgDailyKm: 115 },
    ],
    demoPayload: {
      gps: { lat: 31.6295, lng: -7.9811, alt: 1482, speed: 34, heading: '042° NE', latencyMs: 64 },
      values: {
        tcase_t: 112.6,
        pitch: 18.4,
        roll: 11.2,
        trq_f: 50.0,
        coolant: 98.2,
        aux_v: 27.8,
        mode_4wd: '4L_LOCKED',
        trq_split: '50% AV / 50% AR',
        prop_trq: 840,
        elock_st: 'ENGAGED_100%',
        wheel_delta: 0.0,
        rdiff_t: 86.4,
        breather: 'NOMINAL',
        ride_h: '+65 (HIGH)',
        travel_rr: 88,
        kdss_st: 'DECOUPLED',
        oil_bar: 4.6,
        air_clog: 34,
        iat_t: 52.0,
        skid_st: 'INTACT',
        mud_bar: 1.6,
        caliper_t: 164,
        terrain_m: 'ROCK_DIRT',
        hdc_st: 'STANDBY',
      },
      rulHealth: { rul_tcase: 31, rul_air: 42, rul_bush: 74, rul_mt: 82 },
      dtcs: [
        { code: 'C1298-4B', spn: '4WD_TEMP', targetNodeId: 'suv-tcase', desc: 'Température Élevée Huile Boîte de Transfert 4x4 (>108°C)', severity: 'warning', count: 2, time: '14:31:02 UTC' },
      ],
    },
  },

  truck: {
    id: 'truck',
    chassisTemplate: 'truck',
    code: 'CLS-04 // PORTEUR 6X4',
    shortName: 'CAMION PORTEUR',
    fullName: 'POIDS LOURD RIGIDE 6X4 (26 TONNES) // DISTRIBUTION & BTP — J1939',
    identity: {
      vin: 'YV2-RT40C-9LA841-6X4',
      plate: 'PL-604-HD',
      protocol: 'SAE J1939 (250kbps) + FMS 4.0',
      dimensions: '8.85m × 2.55m × 3.45m',
      weightLabel: 'PTAC: 24.8 / 26.0 TONNES',
    },
    sensorsSchema: [
      { key: 'air_p', label: 'PRESSION AIR CIRCUIT 1', code: 'SPN_1087', unit: 'BAR', min: 0, max: 12.5, thresholds: { critLow: 6.8, warnLow: 8.2, warnHigh: 11.8 }, jitter: 0.08 },
      { key: 'boost', label: 'PRESSION TURBO J1939', code: 'SPN_102', unit: 'BAR', min: 0, max: 3.5, thresholds: { warnHigh: 2.9, critHigh: 3.2 }, jitter: 0.05 },
      { key: 'oil_p', label: 'PRESSION HUILE MOTEUR', code: 'SPN_100', unit: 'BAR', min: 0, max: 7.0, thresholds: { critLow: 1.8, warnLow: 2.5 }, jitter: 0.04 },
      { key: 'adblue', label: 'NIVEAU ADBLUE (DEF)', code: 'SPN_1761', unit: '%', min: 0, max: 100, thresholds: { critLow: 10, warnLow: 22 }, jitter: 0.01 },
      { key: 'fuel_r', label: 'DÉBIT INSTANTANÉ', code: 'SPN_183', unit: 'L/H', min: 0, max: 85, thresholds: { warnHigh: 68, critHigh: 78 }, jitter: 0.8 },
      { key: 'tandem_t', label: 'TEMP. PONT TANDEM 6X4', code: 'SPN_578', unit: '°C', min: 30, max: 130, thresholds: { warnHigh: 105, critHigh: 118 }, jitter: 0.2 },
    ],
    nodesSchema: [
      {
        id: 'trk-apu',
        code: 'NOD-01',
        name: 'Unité Traitement d\'Air (APU/EAPU) & Réservoirs',
        system: 'PNEUMATICS // J1939_SPN1087',
        x: 248,
        y: 280,
        linkedSensorKeys: ['air_p'],
        metricsSchema: [
          { key: 'air_p', label: 'Pression Circuit 1 (AR)', unit: 'BAR', thresholds: { critLow: 6.8, warnLow: 8.2 } },
          { key: 'air_p2', label: 'Pression Circuit 2 (AV)', unit: 'BAR', thresholds: { critLow: 6.8, warnLow: 8.2 } },
          { key: 'comp_duty', label: 'Cycle Compresseur', unit: '%', thresholds: { warnHigh: 75, critHigh: 90 } },
          { key: 'dryer_st', label: 'Cartouche Dessiccateur', unit: '' },
        ],
      },
      {
        id: 'trk-eng',
        code: 'NOD-02',
        name: 'Moteur 6-Cyl en Ligne 12.8L Turbo-Compound',
        system: 'POWERTRAIN // EMS_J1939',
        x: 180,
        y: 126,
        linkedSensorKeys: ['boost', 'oil_p', 'fuel_r'],
        metricsSchema: [
          { key: 'rpm_j1939', label: 'Régime (SPN 190)', unit: 'RPM' },
          { key: 'load_j1939', label: 'Charge Moteur (SPN 92)', unit: '%' },
          { key: 'coolant_j', label: 'Temp. Liquide (SPN 110)', unit: '°C', thresholds: { warnHigh: 98, critHigh: 106 } },
          { key: 'rail_j', label: 'Pression Rail', unit: 'BAR' },
        ],
      },
      {
        id: 'trk-fuel',
        code: 'NOD-03',
        name: 'Réservoir Alu 450L & Sonde Capacitive CUSUM',
        system: 'FUEL_SECURITY // CUSUM_ALG',
        x: 102,
        y: 265,
        linkedSensorKeys: [],
        metricsSchema: [
          { key: 'fuel_liters', label: 'Volume Mesuré Sonde', unit: 'L', thresholds: { critLow: 45, warnLow: 90 } },
          { key: 'cusum_drift', label: 'Dérive CUSUM', unit: 'L/min', thresholds: { warnHigh: 1.5, critHigh: 3.0 } },
          { key: 'diesel_t', label: 'Temp. Gasoil', unit: '°C' },
          { key: 'cap_lock', label: 'Bouchon Connecté', unit: '' },
        ],
      },
      {
        id: 'trk-scr',
        code: 'NOD-04',
        name: 'Catalyseur SCR Euro-6 & Injecteur AdBlue (DEF)',
        system: 'AFTERTREATMENT // SCR_NOx',
        x: 248,
        y: 205,
        linkedSensorKeys: ['adblue'],
        metricsSchema: [
          { key: 'nox_ppm', label: 'NOx Aval (SPN 3226)', unit: 'ppm', thresholds: { warnHigh: 350, critHigh: 600 } },
          { key: 'scr_eff', label: 'Efficacité Conversion', unit: '%', thresholds: { warnLow: 88, critLow: 78 } },
          { key: 'def_bar', label: 'Pression Pompe AdBlue', unit: 'BAR', thresholds: { warnLow: 8.5, critLow: 7.0 } },
          { key: 'adblue', label: 'Niveau AdBlue', unit: '%', thresholds: { critLow: 10, warnLow: 22 } },
        ],
      },
      {
        id: 'trk-tandem',
        code: 'NOD-05',
        name: 'Tandem Arrière 6x4 (Double Pont & Roues Jumelées)',
        system: 'DRIVELINE // BOGIE_6X4',
        x: 180,
        y: 486,
        linkedSensorKeys: ['tandem_t'],
        metricsSchema: [
          { key: 'bogie_ton', label: 'Charge Tandem 6x4', unit: 'TON', thresholds: { warnHigh: 19.0, critHigh: 20.5 } },
          { key: 'tandem_t', label: 'Temp. Pont Moyen', unit: '°C', thresholds: { warnHigh: 105, critHigh: 118 } },
          { key: 'rear_diff_t', label: 'Temp. Pont Arrière', unit: '°C', thresholds: { warnHigh: 105, critHigh: 118 } },
          { key: 'pto_state', label: 'Prise de Force (PTO)', unit: '' },
        ],
      },
    ],
    rulSchema: [
      { key: 'rul_apu', name: 'Valve 4 Voies & Cartouche Dessiccateur APU', maxKm: 1500, avgDailyKm: 220 },
      { key: 'rul_def', name: 'Doseur / Injecteur AdBlue (Cristallisation)', maxKm: 11000, avgDailyKm: 220 },
      { key: 'rul_drums', name: 'Garnitures Freins Tandem 6x4', maxKm: 50000, avgDailyKm: 220 },
      { key: 'rul_oil13', name: 'Huile Moteur Long-Drain 10W40 (12.8L)', maxKm: 68000, avgDailyKm: 220 },
    ],
    demoPayload: {
      gps: { lat: 43.6047, lng: 1.4442, alt: 152, speed: 79, heading: '195° SSW', latencyMs: 29 },
      values: {
        air_p: 6.4,
        boost: 2.34,
        oil_p: 4.15,
        adblue: 19.0,
        fuel_r: 34.8,
        tandem_t: 94.2,
        air_p2: 8.9,
        comp_duty: 94,
        dryer_st: 'SATURATED',
        rpm_j1939: 1185,
        load_j1939: 78,
        coolant_j: 88.0,
        rail_j: 2150,
        fuel_liters: 312.4,
        cusum_drift: 0.0,
        diesel_t: 31.2,
        cap_lock: 'SEALED_OK',
        nox_ppm: 142,
        scr_eff: 94.1,
        def_bar: 8.2,
        bogie_ton: 18.2,
        rear_diff_t: 89.5,
        pto_state: 'DISENGAGED',
      },
      rulHealth: { rul_apu: 12, rul_def: 38, rul_drums: 64, rul_oil13: 79 },
      dtcs: [
        { code: 'J1939-1087', spn: 'SPN 1087 FMI 1', targetNodeId: 'trk-apu', desc: 'Pression Pneumatique Circuit Frein #1 Critiquement Basse (<6.8 Bar)', severity: 'critical', count: 8, time: '14:32:18 UTC' },
        { code: 'J1939-5394', spn: 'SPN 5394 FMI 7', targetNodeId: 'trk-scr', desc: 'Doseur AdBlue (DEF) : Réponse Mécanique Lente', severity: 'warning', count: 4, time: '11:20:05 UTC' },
      ],
    },
  },

  semi: {
    id: 'semi',
    chassisTemplate: 'semi',
    code: 'CLS-05 // SEMI-REMORQUE',
    shortName: 'SEMI-REMORQUE 44T',
    fullName: 'ENSEMBLE ARTICULÉ TRACTEUR 4X2 + REMORQUE TRIDEM // J1939 & ISO 11992',
    identity: {
      vin: 'WMA-06XZZ-8MP104-ART',
      plate: 'SR-990-EU',
      protocol: 'J1939 + ISO 11992-2 (EBS REMORQUE)',
      dimensions: '16.50m × 2.55m × 4.00m',
      weightLabel: 'PTRA: 41.6 / 44.0 TONNES',
    },
    sensorsSchema: [
      { key: 'kingpin', label: 'EFFORT SELLETTE (KINGPIN)', code: 'KP_FORCE', unit: 'TON', min: 0, max: 18.0, thresholds: { warnHigh: 14.5, critHigh: 16.5 }, jitter: 0.1 },
      { key: 'hub_t2r', label: 'TEMP. MOYEU REMORQUE 2D', code: 'EBS_T2R', unit: '°C', min: 20, max: 170, thresholds: { warnHigh: 115, critHigh: 145 }, jitter: 0.6 },
      { key: 'tank_tot', label: 'DOUBLE RÉSERVOIR (G+D)', code: 'SPN_96_2', unit: 'LIT', min: 0, max: 1150, thresholds: { critLow: 90, warnLow: 180 }, jitter: 0.2 },
      { key: 'reefer_t', label: 'TEMP. REEFER REMORQUE', code: 'RFR_SET', unit: '°C', min: -25, max: 5, thresholds: { warnHigh: -15.0, critHigh: -12.0 }, jitter: 0.1 },
      { key: 'intarder', label: 'COUPLE RALENTISSEUR', code: 'SPN_556', unit: 'NM', min: 0, max: 3500, thresholds: { warnHigh: 2900, critHigh: 3350 }, jitter: 0 },
      { key: 'ecas_bar', label: 'PRESSION COUSSINS TRIDEM', code: 'ECAS_BAR', unit: 'BAR', min: 1.0, max: 8.5, thresholds: { critLow: 3.5, warnLow: 4.4, warnHigh: 7.5 }, jitter: 0.03 },
    ],
    nodesSchema: [
      {
        id: 'sem-kingpin',
        code: 'NOD-01',
        name: 'Sellette d\'Attelage (Fifth Wheel) & Liaison ISO 11992',
        system: 'COUPLING // KINGPIN_EBS',
        x: 180,
        y: 218,
        linkedSensorKeys: ['kingpin'],
        metricsSchema: [
          { key: 'jaw_lock', label: 'Capteur Mâchoire', unit: '' },
          { key: 'art_deg', label: 'Angle Articulation', unit: '°' },
          { key: 'iso_loss', label: 'Perte Paquets ISO 11992', unit: '%', thresholds: { warnHigh: 1.0, critHigh: 5.0 } },
          { key: 'red_line', label: 'Tête Accouplement', unit: 'BAR', thresholds: { critLow: 6.5, warnLow: 7.5 } },
        ],
      },
      {
        id: 'sem-tridem',
        code: 'NOD-02',
        name: 'Essieu Tridem Remorque (Surveillance Thermique Moyeux)',
        system: 'TRAILER_EBS // HUB_T2R',
        x: 248,
        y: 525,
        linkedSensorKeys: ['hub_t2r', 'ecas_bar'],
        metricsSchema: [
          { key: 'hub_t2r', label: 'Temp. Moyeu Essieu 2D', unit: '°C', thresholds: { warnHigh: 115, critHigh: 145 } },
          { key: 'hub_avg', label: 'Moyenne Autres Moyeux', unit: '°C' },
          { key: 'tpms_t2r', label: 'Pression Pneu 2D', unit: 'BAR', thresholds: { warnHigh: 9.2, critHigh: 9.8, warnLow: 7.8 } },
          { key: 'ebs_mod', label: 'Modulateur EBS Rem.', unit: '' },
        ],
      },
      {
        id: 'sem-tanks',
        code: 'NOD-03',
        name: 'Double Réservoir Aluminium (750L Gauche + 400L Droit)',
        system: 'FUEL_TELEMETRY // DUAL_TANK',
        x: 108,
        y: 162,
        linkedSensorKeys: ['tank_tot'],
        metricsSchema: [
          { key: 'tank_l', label: 'Réservoir Principal G.', unit: 'L' },
          { key: 'tank_r', label: 'Réservoir Auxiliaire D.', unit: 'L' },
          { key: 'avg_l100', label: 'Conso Moyenne Trajet', unit: 'L/100' },
          { key: 'siphon_st', label: 'Alerte Siphonnage', unit: '' },
        ],
      },
      {
        id: 'sem-eng',
        code: 'NOD-04',
        name: 'Tracteur Routier 13L 540ch & Intarder Hydraulique',
        system: 'TRACTOR // POWERTRAIN',
        x: 180,
        y: 92,
        linkedSensorKeys: ['intarder'],
        metricsSchema: [
          { key: 'rpm_semi', label: 'Régime Croisière', unit: 'RPM' },
          { key: 'gear_semi', label: 'Boîte Robotisée 12v', unit: '' },
          { key: 'int_temp', label: 'Temp. Huile Intarder', unit: '°C', thresholds: { warnHigh: 110, critHigh: 128 } },
          { key: 'ecoroll', label: 'Rendement Éco-Roll', unit: '%' },
        ],
      },
      {
        id: 'sem-reefer',
        code: 'NOD-05',
        name: 'Unité Frigorifique Autonome Semi-Remorque (-18°C)',
        system: 'TRAILER_REEFER // THERMO_2',
        x: 180,
        y: 266,
        linkedSensorKeys: ['reefer_t'],
        metricsSchema: [
          { key: 'reefer_t', label: 'Zone Avant Remorque', unit: '°C', thresholds: { warnHigh: -15.0, critHigh: -12.0 } },
          { key: 'reefer_rear', label: 'Zone Arrière Portes', unit: '°C', thresholds: { warnHigh: -14.5, critHigh: -11.5 } },
          { key: 'reefer_hrs', label: 'Heures Moteur Frigo', unit: 'HRS' },
          { key: 'defrost_st', label: 'Statut Dégivrage', unit: '' },
        ],
      },
    ],
    rulSchema: [
      { key: 'rul_hub2r', name: 'Roulement & Étrier Moyeu Remorque Essieu 2D', maxKm: 3900, avgDailyKm: 380 },
      { key: 'rul_kp', name: 'Bague d\'Usure Sellette d\'Attelage (Kingpin 2")', maxKm: 95000, avgDailyKm: 380 },
      { key: 'rul_tridem', name: 'Pneumatiques Tridem Remorque (385/65 R22.5)', maxKm: 72000, avgDailyKm: 380 },
      { key: 'rul_ecas', name: 'Coussins Pneumatiques ECAS Semi-Remorque', maxKm: 135000, avgDailyKm: 380 },
    ],
    demoPayload: {
      gps: { lat: 50.6292, lng: 3.0573, alt: 31, speed: 89, heading: '014° NNE', latencyMs: 21 },
      values: {
        kingpin: 11.4,
        hub_t2r: 138.5,
        tank_tot: 845,
        reefer_t: -18.2,
        intarder: 0.0,
        ecas_bar: 5.85,
        jaw_lock: 'LOCKED_SECURE',
        art_deg: 1.4,
        iso_loss: 0.0,
        red_line: 8.5,
        hub_avg: 76.2,
        tpms_t2r: 9.4,
        ebs_mod: 'ACTIVE_RSS',
        tank_l: 560,
        tank_r: 285,
        avg_l100: 29.2,
        siphon_st: 'ARMED_OK',
        rpm_semi: 1110,
        gear_semi: '12_DIRECT',
        int_temp: 84.0,
        ecoroll: 18,
        reefer_rear: -17.9,
        reefer_hrs: 4128,
        defrost_st: 'AUTO_STANDBY',
      },
      rulHealth: { rul_hub2r: 22, rul_kp: 71, rul_tridem: 54, rul_ecas: 88 },
      dtcs: [
        { code: 'ISO11992-EBS', spn: 'SPN 1068 FMI 0', targetNodeId: 'sem-tridem', desc: 'Échauffement Moyeu / Frein Remorque Essieu 2 Droit (>115°C)', severity: 'warning', count: 5, time: '14:29:50 UTC' },
      ],
    },
  },

  coach: {
    id: 'coach',
    chassisTemplate: 'coach',
    code: 'CLS-06 // AUTOCAR PAX',
    shortName: 'TRANSPORT VOYAGEURS',
    fullName: 'AUTOCAR GRAND TOURISME 55 PLACES // MOTEUR ARRIÈRE & MULTIPLEXAGE',
    identity: {
      vin: 'WEB-632410-132984-BUS',
      plate: 'TC-702-VX',
      protocol: 'J1939 + CAN CARROSSERIE MUX',
      dimensions: '13.10m × 2.55m × 3.77m',
      weightLabel: 'CAPACITÉ: 55 PASSAGERS',
    },
    sensorsSchema: [
      { key: 'rear_bay', label: 'TEMP. BAIE MOTEUR ARR.', code: 'FIRE_BAY', unit: '°C', min: 30, max: 140, thresholds: { warnHigh: 108, critHigh: 122 }, jitter: 0.4 },
      { key: 'hvac_cab', label: 'CLIMATISATION SALON PAX', code: 'HVAC_Z1', unit: '°C', min: 15, max: 30, thresholds: { warnHigh: 25.0, critHigh: 28.0, warnLow: 17.5 }, jitter: 0.1 },
      { key: 'ret_temp', label: 'TEMP. STATOR TELMA/VOITH', code: 'RET_TMP', unit: '°C', min: 40, max: 330, thresholds: { warnHigh: 230, critHigh: 285 }, jitter: 1.5 },
      { key: 'alt_24v', label: 'RÉSEAU 24V (3x ALTERN.)', code: 'MUX_24V', unit: 'V', min: 22.0, max: 30.0, thresholds: { critLow: 24.2, warnLow: 25.5, warnHigh: 29.2 }, jitter: 0.05 },
      { key: 'door_p', label: 'PRESSION CIRCUIT PORTES', code: 'DOOR_BAR', unit: 'BAR', min: 4.0, max: 10.0, thresholds: { critLow: 5.5, warnLow: 6.5 }, jitter: 0.02 },
      { key: 'co2_pax', label: 'QUALITÉ AIR CABINE CO2', code: 'IAQ_PPM', unit: 'PPM', min: 400, max: 1600, thresholds: { warnHigh: 1000, critHigh: 1350 }, jitter: 6 },
    ],
    nodesSchema: [
      {
        id: 'bus-rear-eng',
        code: 'NOD-01',
        name: 'Moteur en Porte-à-Faux Arrière & Boucle Incendie R107',
        system: 'REAR_ENGINE_BAY // UN_ECE_R107',
        x: 180,
        y: 548,
        linkedSensorKeys: ['rear_bay'],
        metricsSchema: [
          { key: 'rear_bay', label: 'Temp. Ambiante Baie', unit: '°C', thresholds: { warnHigh: 108, critHigh: 122 } },
          { key: 'r107_bar', label: 'Extinction R107', unit: 'BAR', thresholds: { critLow: 12, warnLow: 15 } },
          { key: 'bus_rpm', label: 'Régime Moteur Arrière', unit: 'RPM' },
          { key: 'bus_cool', label: 'Temp. Liquide Refr.', unit: '°C', thresholds: { warnHigh: 98, critHigh: 105 } },
        ],
      },
      {
        id: 'bus-retarder',
        code: 'NOD-02',
        name: 'Ralentisseur Électromagnétique / Hydrodynamique Arrière',
        system: 'SECONDARY_BRAKE // RETARDER',
        x: 180,
        y: 454,
        linkedSensorKeys: ['ret_temp'],
        metricsSchema: [
          { key: 'ret_temp', label: 'Temp. Rotor/Stator', unit: '°C', thresholds: { warnHigh: 230, critHigh: 285 } },
          { key: 'ret_stage', label: 'Cran Engagé', unit: '' },
          { key: 'ret_derate', label: 'Capacité Thermique', unit: '%', thresholds: { warnLow: 90, critLow: 70 } },
          { key: 'ret_amps', label: 'Courant Induit 24V', unit: 'A', thresholds: { warnHigh: 180, critHigh: 240 } },
        ],
      },
      {
        id: 'bus-hvac',
        code: 'NOD-03',
        name: 'Double Unité Climatisation Toiture (38 kW) & CO2',
        system: 'ROOF_HVAC // PAX_COMFORT',
        x: 180,
        y: 280,
        linkedSensorKeys: ['hvac_cab', 'co2_pax'],
        metricsSchema: [
          { key: 'hvac_cab', label: 'Temp. Salon Pax', unit: '°C', thresholds: { warnHigh: 25, critHigh: 28 } },
          { key: 'roof_rpm', label: 'Turbines Condenseur', unit: 'RPM' },
          { key: 'r134a_bar', label: 'Pression Gaz R134a', unit: 'BAR' },
          { key: 'co2_pax', label: 'Capteur CO2 Cabine', unit: 'ppm', thresholds: { warnHigh: 1000, critHigh: 1350 } },
        ],
      },
      {
        id: 'bus-doors',
        code: 'NOD-04',
        name: 'Portes Pneumatiques Louvoyantes & Agenouillement ECAS',
        system: 'BODY_MUX // DOORS_KNEEL',
        x: 256,
        y: 332,
        linkedSensorKeys: ['door_p'],
        metricsSchema: [
          { key: 'door_f', label: 'Porte Accès Avant', unit: '' },
          { key: 'door_m', label: 'Porte Médiane PMR', unit: '' },
          { key: 'kneel_st', label: 'Agenouillement ECAS', unit: '' },
          { key: 'pax_belts', label: 'Ceintures Passagers', unit: '' },
        ],
      },
      {
        id: 'bus-elec',
        code: 'NOD-05',
        name: 'Centrale Électrique Multiplexée 24V & 3 Alternateurs',
        system: 'POWER_GRID // 24V_TRIPLE_ALT',
        x: 112,
        y: 495,
        linkedSensorKeys: ['alt_24v'],
        metricsSchema: [
          { key: 'alt_24v', label: 'Tension Bus 24V', unit: 'V', thresholds: { critLow: 24.2, warnLow: 25.5 } },
          { key: 'alt_load', label: 'Débit 3 Alternateurs', unit: 'A' },
          { key: 'soc_24v', label: 'SOC Batteries Dém.', unit: '%', thresholds: { warnLow: 75, critLow: 60 } },
          { key: 'inv_230v', label: 'Onduleur 230V Salon', unit: 'kW' },
        ],
      },
    ],
    rulSchema: [
      { key: 'rul_ret', name: 'Ralentisseur Arrière (Bagues & Isolation)', maxKm: 15000, avgDailyKm: 260 },
      { key: 'rul_hvac_f', name: 'Filtres Habitacle Haute Capacité (Toiture HVAC)', maxKm: 21500, avgDailyKm: 260 },
      { key: 'rul_doors', name: 'Vérins Pneumatiques & Joints Portes Louvoyantes', maxKm: 54000, avgDailyKm: 260 },
      { key: 'rul_belts3', name: 'Courroies Alternateurs 3x150A (Baie Arrière)', maxKm: 69000, avgDailyKm: 260 },
    ],
    demoPayload: {
      gps: { lat: 46.2044, lng: 6.1432, alt: 375, speed: 96, heading: '078° ENE', latencyMs: 19 },
      values: {
        rear_bay: 96.4,
        hvac_cab: 21.5,
        ret_temp: 248.0,
        alt_24v: 28.4,
        door_p: 7.8,
        co2_pax: 690,
        r107_bar: 18.0,
        bus_rpm: 1240,
        bus_cool: 89.0,
        ret_stage: 'STAGE_3/5',
        ret_derate: 85,
        ret_amps: 195,
        roof_rpm: 2100,
        r134a_bar: 14.2,
        door_f: 'LOCKED_SEALED',
        door_m: 'LOCKED_SEALED',
        kneel_st: 'NORMAL_HEIGHT',
        pax_belts: '46 / 48 OK',
        alt_load: 245,
        soc_24v: 98,
        inv_230v: 1.4,
      },
      rulHealth: { rul_ret: 36, rul_hvac_f: 52, rul_doors: 78, rul_belts3: 84 },
      dtcs: [
        { code: 'J1939-RET02', spn: 'SPN 748 FMI 15', targetNodeId: 'bus-retarder', desc: 'Température Élevée Ralentisseur Secondaire (>230°C) — Limitation Couple Active', severity: 'warning', count: 3, time: '14:24:39 UTC' },
      ],
    },
  },
};
