import {
  calculateRul,
  type RulCalculationInput,
  type RulCalculationResult,
  type SubsystemType,
} from '@docteurflotte/contracts';

export type AssetCategory40 =
  | 'HEAVY_TRUCK'
  | 'CONSTRUCTION_MACHINERY_BTP'
  | 'LIGHT_COMMERCIAL'
  | 'GENERATOR';

export interface VehicleAssetRecord {
  id: string;
  vin: string;
  registrationNumber: string;
  assetCategory: AssetCategory40;
  make: string;
  model: string;
  year: number;
  engineModel: string;
  protocolType: 'SAE_J1939' | 'OBD2_CAN' | 'OPENDBC_CUSTOM';
  currentOdometerKm: number;
  currentEngineHours: number;
  idleHours: number;
  avgDailyKm: number;
  avgDailyEngineHours: number;
  severeDutyFactor: number;
  globalHealthScore: number;
  subsystems: Record<SubsystemType, RulCalculationResult>;
  activeDtcs: string[];
}

export interface TelemetryDtcItem {
  id: string;
  timestamp: string;
  protocol: 'J1939' | 'OBD2' | 'DBC_SIGNAL';
  codeString: string;
  spn?: number;
  fmi?: number;
  pgn?: number;
  canFrameId?: string;
  subsystem: SubsystemType;
  titleFr: string;
  technicalDescriptionFr: string;
  severityLevel: 'INFO' | 'PROACTIVE_WARNING' | 'CRITICAL_IMMOBILIZATION';
  rulPenaltyFactor: number;
  recommendedWorkshopAction: string;
  vehicleRegistration: string;
}

export interface MaintenanceWorkOrderItem {
  id: string;
  workOrderNumber: string;
  vehicleId: string;
  vehicleRegistration: string;
  vehicleModel: string;
  triggerSource: 'PREVENTIVE_KM_HOURS' | 'PREDICTIVE_RUL_DRIFT' | 'TELEMETRY_DTC_CRITICAL';
  priority: 'P1_IMMOBILIZATION' | 'P2_URGENT_48H' | 'P3_SCHEDULED';
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED';
  subsystem: SubsystemType;
  title: string;
  description: string;
  estimatedCostDzd: number;
  downtimeHours: number;
  partsRequired: string[];
  assignedTechnician: string;
  createdAt: string;
}

export interface OemPlanTemplate {
  code: string;
  name: string;
  intervalKm: number;
  intervalEngineHours: number;
  intervalMonths: number;
  subsystemsCovered: SubsystemType[];
  description: string;
  standardOperations: string[];
  requiredParts: string[];
  recommendedOil: string;
}

// 1. TEMPLATES CONSTRUCTEUR PM1 À PM4
export const OEM_PREVENTIVE_TEMPLATES: OemPlanTemplate[] = [
  {
    code: 'PM1',
    name: 'Service Mineur (PM1 — 250h / 15 000 km)',
    intervalKm: 15000,
    intervalEngineHours: 250,
    intervalMonths: 6,
    subsystemsCovered: ['ENGINE', 'FILTRATION'],
    description: 'Vidange huile moteur 15W40/10W40, remplacement filtre à huile et purge décanteur carburant.',
    standardOperations: [
      'Vidange carter moteur à chaud et contrôle limaille sur bouchon magnétique',
      'Remplacement cartouche filtre huile moteur (serrage au couple)',
      'Purge eau et sédiments du préfiltre séparateur Naftal',
      'Contrôle visuel des niveaux (liquide refroidissement, direction assistée)',
    ],
    requiredParts: ['Filtre à huile OEM', 'Joint de vidange cuivre', 'Huile moteur 15W-40 API CK-4 (32L)'],
    recommendedOil: 'Total Rubia TIR 7400 15W-40 / Cat DEO 15W-40',
  },
  {
    code: 'PM2',
    name: 'Service Intermédiaire (PM2 — 500h / 30 000 km)',
    intervalKm: 30000,
    intervalEngineHours: 500,
    intervalMonths: 12,
    subsystemsCovered: ['ENGINE', 'FILTRATION', 'BRAKES_APS'],
    description: 'PM1 + Remplacement filtres carburant primaire/secondaire, filtre air primaire et graissage châssis.',
    standardOperations: [
      'Ensemble des opérations du palier PM1',
      'Remplacement filtre à carburant principal et filtre séparateur',
      'Nettoyage ou remplacement filtre à air moteur primaire (tamis cyclonique BTP)',
      'Graissage complet de la sellette d’attelage, pivots et croisillons de transmission',
      'Contrôle pression pneumatique des circuits de service APS (8.5 - 10.5 bar)',
    ],
    requiredParts: ['Filtres carburant x2', 'Cartouche filtre air primaire', 'Graisse NLGI 2 lithium complexe EP'],
    recommendedOil: 'Total Rubia TIR 7400 15W-40 / Cat DEO 15W-40',
  },
  {
    code: 'PM3',
    name: 'Service Majeur Transmission & Hydraulique (PM3 — 1000h / 60 000 km)',
    intervalKm: 60000,
    intervalEngineHours: 1000,
    intervalMonths: 18,
    subsystemsCovered: ['ENGINE', 'TRANSMISSION', 'HYDRAULICS', 'BRAKES_APS'],
    description: 'PM2 + Vidange boîte de vitesses mécanique/robotisée, ponts moteurs et cartouche dessiccateur freinage.',
    standardOperations: [
      'Ensemble des opérations PM2',
      'Vidange boîte de vitesses et remplacement crépine',
      'Vidange différentiel(s) de pont arrière avec nettoyage reniflard',
      'Remplacement cartouche dessiccateur d’air freinage APS (anti-huile)',
      'Vidange fluide hydraulique BTP et remplacement filtres haute pression',
    ],
    requiredParts: ['Cartouche dessiccateur APS', 'Huile transmission 75W-80 / 85W-140 (18L)', 'Filtre retour hydraulique 10µ'],
    recommendedOil: 'Total Traxium Axle 7 85W-140 / Cat HYDO Advanced 10',
  },
  {
    code: 'PM4',
    name: 'Révision Générale & Distribution (PM4 — 2000h / 120 000 km)',
    intervalKm: 120000,
    intervalEngineHours: 2000,
    intervalMonths: 24,
    subsystemsCovered: ['ENGINE', 'COOLING', 'FILTRATION', 'BRAKES_APS', 'TRANSMISSION', 'HYDRAULICS'],
    description: 'Révision complète d’endurance : courroies accessoires, vidange circuit refroidissement, injecteurs et culbuteurs.',
    standardOperations: [
      'Ensemble des opérations PM3',
      'Remplacement kit courroies poly-V et galets tendeurs automatiques',
      'Vidange totale et rinçage du circuit de refroidissement (liquide OAT -35°C)',
      'Contrôle jeu aux soupapes et réglage culbuteurs moteur',
      'Test de débit et étanchéité injecteurs Common Rail au banc',
      'Contrôle étanchéité compresseur d’air bi-cylindre et turbo-compresseur',
    ],
    requiredParts: ['Kit courroies + galets', 'Liquide de refroidissement OAT (40L)', 'Joints couvre-culasse', 'Filtres dessiccateur'],
    recommendedOil: 'Total Glacelf Auto Supra / Cat ELC -37°C',
  },
];

// 2. ÉTAT INITIAL DES ACTIFS AVEC CALCUL DU RUL DETERMINISTE
export function generateInitialFleet(): VehicleAssetRecord[] {
  const assets: Array<Omit<VehicleAssetRecord, 'subsystems' | 'globalHealthScore'>> = [
    {
      id: 'v-001',
      vin: 'VF624GPA00018540',
      registrationNumber: '16-0428-118',
      assetCategory: 'HEAVY_TRUCK',
      make: 'Renault Trucks',
      model: 'T 480 Optifuel 4x2',
      year: 2021,
      engineModel: 'DTI 13 480hp Euro 5',
      protocolType: 'SAE_J1939',
      currentOdometerKm: 185400,
      currentEngineHours: 4120,
      idleHours: 48,
      avgDailyKm: 320,
      avgDailyEngineHours: 7.2,
      severeDutyFactor: 0.85,
      activeDtcs: ['SPN-1087-FMI-1'], // Légère dérive pression APS Scania/Renault
    },
    {
      id: 'v-002',
      vin: 'CAT0320GCG002850',
      registrationNumber: '30-0192-121',
      assetCategory: 'CONSTRUCTION_MACHINERY_BTP',
      make: 'Caterpillar',
      model: '320 GC Excavator',
      year: 2022,
      engineModel: 'Cat C4.4 ACERT 146hp',
      protocolType: 'SAE_J1939',
      currentOdometerKm: 12400,
      currentEngineHours: 2850,
      idleHours: 92,
      avgDailyKm: 25,
      avgDailyEngineHours: 8.5,
      severeDutyFactor: 0.65, // Chantier Ouargla : chaleur & poussière abrasive
      activeDtcs: ['SPN-1638-FMI-0'], // Température hydraulique élevée
    },
    {
      id: 'v-003',
      vin: 'WDB9634031L24180',
      registrationNumber: '16-0891-120',
      assetCategory: 'HEAVY_TRUCK',
      make: 'Mercedes-Benz',
      model: 'Actros 1845 LS StreamSpace',
      year: 2020,
      engineModel: 'OM 471 LA 449hp',
      protocolType: 'SAE_J1939',
      currentOdometerKm: 241800,
      currentEngineHours: 5640,
      idleHours: 35,
      avgDailyKm: 410,
      avgDailyEngineHours: 8.0,
      severeDutyFactor: 0.90,
      activeDtcs: [],
    },
    {
      id: 'v-004',
      vin: 'KMTPC210M0001980',
      registrationNumber: '09-0054-119',
      assetCategory: 'CONSTRUCTION_MACHINERY_BTP',
      make: 'Komatsu',
      model: 'PC210-10M0 Crawler',
      year: 2023,
      engineModel: 'Komatsu SAA6D107E-1',
      protocolType: 'SAE_J1939',
      currentOdometerKm: 8900,
      currentEngineHours: 1980,
      idleHours: 64,
      avgDailyKm: 15,
      avgDailyEngineHours: 7.0,
      severeDutyFactor: 0.60,
      activeDtcs: ['SPN-110-FMI-0'], // Surchauffe liquide refroidissement
    },
    {
      id: 'v-005',
      vin: 'MR0BA3CD40009840',
      registrationNumber: '16-0312-122',
      assetCategory: 'LIGHT_COMMERCIAL',
      make: 'Toyota',
      model: 'Hilux Double Cabine 2.8 D-4D',
      year: 2022,
      engineModel: '1GD-FTV 204hp',
      protocolType: 'OBD2_CAN',
      currentOdometerKm: 98400,
      currentEngineHours: 2150,
      idleHours: 22,
      avgDailyKm: 140,
      avgDailyEngineHours: 3.5,
      severeDutyFactor: 0.75,
      activeDtcs: ['P0087'], // Pression rail faible
    },
    {
      id: 'v-006',
      vin: 'SX4254JT29401623',
      registrationNumber: '16-0567-117',
      assetCategory: 'HEAVY_TRUCK',
      make: 'Shacman',
      model: 'F3000 6x4 Benne 18m³',
      year: 2019,
      engineModel: 'Weichai WP12.375E50',
      protocolType: 'SAE_J1939',
      currentOdometerKm: 162300,
      currentEngineHours: 4890,
      idleHours: 110,
      avgDailyKm: 180,
      avgDailyEngineHours: 9.0,
      severeDutyFactor: 0.60,
      activeDtcs: ['SPN-100-FMI-1', 'SPN-3251-FMI-16'], // Chute pression huile & FAP colmaté
    },
  ];

  return assets.map((asset) => {
    const subsystemsMap = computeAllSubsystems(asset);
    const healthScores = Object.values(subsystemsMap).map((s) => 100 - s.wearIndexPercent);
    const globalScore = Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length);

    return {
      ...asset,
      subsystems: subsystemsMap,
      globalHealthScore: globalScore,
    };
  });
}

// 3. FONCTION DE CALCUL DÉTERMINISTE MULTI-ORGANES
export function computeAllSubsystems(asset: {
  currentOdometerKm: number;
  currentEngineHours: number;
  idleHours: number;
  avgDailyKm: number;
  avgDailyEngineHours: number;
  severeDutyFactor: number;
  activeDtcs: string[];
}): Record<SubsystemType, RulCalculationResult> {
  const subsystemsList: SubsystemType[] = [
    'ENGINE',
    'HYDRAULICS',
    'TRANSMISSION',
    'BRAKES_APS',
    'COOLING',
    'FILTRATION',
    'TIRES_TRACKS',
  ];

  const result: Partial<Record<SubsystemType, RulCalculationResult>> = {};

  for (const sub of subsystemsList) {
    let oemKm = 30000;
    let oemHours = 500;
    let oemDays = 180;
    let deltaKm = 18500;
    let deltaHours = 320;
    let deltaDays = 75;

    if (sub === 'ENGINE') {
      oemKm = 30000;
      oemHours = 500;
      deltaKm = 21000;
      deltaHours = 380;
    } else if (sub === 'HYDRAULICS') {
      oemKm = 60000;
      oemHours = 1000;
      deltaKm = 34000;
      deltaHours = 680;
    } else if (sub === 'BRAKES_APS') {
      oemKm = 60000;
      oemHours = 1000;
      deltaKm = 42000;
      deltaHours = 790;
    } else if (sub === 'TRANSMISSION') {
      oemKm = 90000;
      oemHours = 1500;
      deltaKm = 48000;
      deltaHours = 820;
    } else if (sub === 'COOLING') {
      oemKm = 60000;
      oemHours = 1000;
      deltaKm = 38000;
      deltaHours = 640;
    } else if (sub === 'FILTRATION') {
      oemKm = 15000;
      oemHours = 250;
      deltaKm = 11000;
      deltaHours = 195;
    } else if (sub === 'TIRES_TRACKS') {
      oemKm = 80000;
      oemHours = 2000;
      deltaKm = 52000;
      deltaHours = 1100;
    }

    // Capteurs simulés pour ce sous-système
    const sensors = [];
    if (sub === 'COOLING' && asset.activeDtcs.includes('SPN-110-FMI-0')) {
      sensors.push({ parameterName: 'SPN 110 Temp Eau', value: 106.5, normalMax: 100, isAnomalous: true, penalty: 0.18 });
    }
    if (sub === 'ENGINE' && asset.activeDtcs.includes('SPN-100-FMI-1')) {
      sensors.push({ parameterName: 'SPN 100 Pression Huile', value: 1.1, normalMax: 4.5, isAnomalous: true, penalty: 0.35 });
    }
    if (sub === 'BRAKES_APS' && asset.activeDtcs.includes('SPN-1087-FMI-1')) {
      sensors.push({ parameterName: 'SPN 1087 Pression Freinage APS', value: 6.8, normalMax: 10.5, isAnomalous: true, penalty: 0.25 });
    }
    if (sub === 'HYDRAULICS' && asset.activeDtcs.includes('SPN-1638-FMI-0')) {
      sensors.push({ parameterName: 'SPN 1638 Temp Huile Hydr', value: 98.0, normalMax: 85, isAnomalous: true, penalty: 0.18 });
    }

    // DTCs filtrés
    const dtcs = asset.activeDtcs.map((d) => ({
      code: d,
      penalty: d === 'SPN-100-FMI-1' ? 0.35 : d === 'P0087' ? 0.30 : 0.20,
    }));

    const input: RulCalculationInput = {
      subsystem: sub,
      severeDutyFactor: asset.severeDutyFactor,
      oemIntervalKm: oemKm,
      oemIntervalEngineHours: oemHours,
      oemIntervalDays: oemDays,
      deltaOdometerKm: deltaKm,
      deltaEngineHours: deltaHours,
      deltaDays: deltaDays,
      idleHours: asset.idleHours,
      avgDailyKm: asset.avgDailyKm,
      avgDailyEngineHours: asset.avgDailyEngineHours,
      sensors,
      dtcs,
    };

    result[sub] = calculateRul(input);
  }

  return result as Record<SubsystemType, RulCalculationResult>;
}

// 4. FLUX TEMPS RÉEL DES TRAMES J1939 / OBD-II / OPENDBC
export const INITIAL_TELEMETRY_STREAM: TelemetryDtcItem[] = [
  {
    id: 'dtc-101',
    timestamp: '10:14:22',
    protocol: 'J1939',
    codeString: 'SPN-1087-FMI-1',
    spn: 1087,
    fmi: 1,
    pgn: 65198,
    subsystem: 'BRAKES_APS',
    titleFr: 'Pression circuit pneumatique 1 anormalement basse',
    technicalDescriptionFr: 'Pression du réservoir primaire sous le seuil critique (6.8 bar vs 10.5 bar consigne). Risque de purge compresseur continue.',
    severityLevel: 'PROACTIVE_WARNING',
    rulPenaltyFactor: 0.25,
    recommendedWorkshopAction: 'Contrôler cartouche dessiccateur APS et fuite raccord tête d’accouplement remorque.',
    vehicleRegistration: '16-0428-118',
  },
  {
    id: 'dtc-102',
    timestamp: '10:12:05',
    protocol: 'J1939',
    codeString: 'SPN-1638-FMI-0',
    spn: 1638,
    fmi: 0,
    pgn: 65128,
    subsystem: 'HYDRAULICS',
    titleFr: 'Température huile hydraulique au-dessus de la plage nominale',
    technicalDescriptionFr: 'Huile hydraulique relevée à 98.4°C en continu. Échauffement sévère des distributeurs et risque de cavitation de la pompe principale.',
    severityLevel: 'CRITICAL_IMMOBILIZATION',
    rulPenaltyFactor: 0.35,
    recommendedWorkshopAction: 'Dépoussiérer le radiateur d’huile hydraulique au jet d’air et contrôler le bypass thermostatique.',
    vehicleRegistration: '30-0192-121',
  },
  {
    id: 'dtc-103',
    timestamp: '10:08:41',
    protocol: 'OBD2',
    codeString: 'P0087',
    subsystem: 'ENGINE',
    titleFr: 'Pression rail injection gazole trop faible (Fuel Rail Low)',
    technicalDescriptionFr: 'Pression rampe commune Common Rail sous la consigne calculateur (-180 bar sous charge). Colmatage filtre Naftal suspecté.',
    severityLevel: 'CRITICAL_IMMOBILIZATION',
    rulPenaltyFactor: 0.30,
    recommendedWorkshopAction: 'Remplacer d’urgence le filtre à carburant et contrôler le régulateur de débit haute pression CP4.',
    vehicleRegistration: '16-0312-122',
  },
  {
    id: 'dtc-104',
    timestamp: '09:55:18',
    protocol: 'J1939',
    codeString: 'SPN-110-FMI-0',
    spn: 110,
    fmi: 0,
    pgn: 65262,
    subsystem: 'COOLING',
    titleFr: 'Surchauffe liquide de refroidissement moteur (> 106°C)',
    technicalDescriptionFr: 'Température culasse critique atteinte en cycle de terrassement lourd sous 44°C ambiant.',
    severityLevel: 'CRITICAL_IMMOBILIZATION',
    rulPenaltyFactor: 0.35,
    recommendedWorkshopAction: 'Arrêt immédiat au ralenti accéléré. Vérifier courroie ventilateur visco-coupleur et niveau liquide.',
    vehicleRegistration: '09-0054-119',
  },
  {
    id: 'dtc-105',
    timestamp: '09:42:30',
    protocol: 'DBC_SIGNAL',
    codeString: 'RENAULT_EMS_COOLANT_TEMP',
    canFrameId: '0x18FEEE00',
    subsystem: 'COOLING',
    titleFr: 'Trame OpenDBC Renault Trucks Engine Status',
    technicalDescriptionFr: 'Décodage trame OEM CAN : Température eau 94.2°C, Pression huile 3.4 bar, Vitesse turbine turbo 82 000 rpm.',
    severityLevel: 'INFO',
    rulPenaltyFactor: 0.0,
    recommendedWorkshopAction: 'Télémétrie nominale conforme.',
    vehicleRegistration: '16-0428-118',
  },
  {
    id: 'dtc-106',
    timestamp: '09:30:12',
    protocol: 'J1939',
    codeString: 'SPN-100-FMI-1',
    spn: 100,
    fmi: 1,
    pgn: 65263,
    subsystem: 'ENGINE',
    titleFr: 'Pression huile moteur sous le seuil critique (1.1 bar)',
    technicalDescriptionFr: 'Pression carter moteur à 1.1 bar à 1400 rpm. Dilution huile par carburant ou pompe à huile défaillante.',
    severityLevel: 'CRITICAL_IMMOBILIZATION',
    rulPenaltyFactor: 0.35,
    recommendedWorkshopAction: 'Immobilisation immédiate. Prélèvement d’huile pour analyse spectrométrique et vérification crépine.',
    vehicleRegistration: '16-0567-117',
  },
];

// 5. ORDRES DE TRAVAIL ATELIER (OT)
export const INITIAL_WORK_ORDERS: MaintenanceWorkOrderItem[] = [
  {
    id: 'wo-2026-084',
    workOrderNumber: 'OT-2026-0084',
    vehicleId: 'v-002',
    vehicleRegistration: '30-0192-121',
    vehicleModel: 'Caterpillar 320 GC',
    triggerSource: 'PREDICTIVE_RUL_DRIFT',
    priority: 'P1_IMMOBILIZATION',
    status: 'IN_PROGRESS',
    subsystem: 'HYDRAULICS',
    title: 'Remplacement préventif cartouche hydraulique et contrôle bypass',
    description: 'Dérive de dégradation thermique détectée par le modèle prédictif (RUL < 18h). Risque de surchauffe distributeur.',
    estimatedCostDzd: 68500,
    downtimeHours: 4.5,
    partsRequired: ['Filtre hydraulique Cat 1R-0722', 'Huile Cat HYDO Advanced (20L)', 'Joint torique distributeur'],
    assignedTechnician: 'Mourad K. (Chef d’Atelier BTP)',
    createdAt: '2026-10-27 08:30',
  },
  {
    id: 'wo-2026-085',
    workOrderNumber: 'OT-2026-0085',
    vehicleId: 'v-005',
    vehicleRegistration: '16-0312-122',
    vehicleModel: 'Toyota Hilux 2.8 D-4D',
    triggerSource: 'TELEMETRY_DTC_CRITICAL',
    priority: 'P1_IMMOBILIZATION',
    status: 'OPEN',
    subsystem: 'ENGINE',
    title: 'Purge décanteur Naftal et remplacement filtre carburant suite DTC P0087',
    description: 'Alerte pression rail faible transmise par passerelle OBD-II. Perte de puissance constatée.',
    estimatedCostDzd: 18200,
    downtimeHours: 2.0,
    partsRequired: ['Cartouche filtre gazole OEM Toyota', 'Dose nettoyant injecteur professionnel'],
    assignedTechnician: 'Youcef B. (Mécanicien VUL)',
    createdAt: '2026-10-27 09:15',
  },
  {
    id: 'wo-2026-086',
    workOrderNumber: 'OT-2026-0086',
    vehicleId: 'v-001',
    vehicleRegistration: '16-0428-118',
    vehicleModel: 'Renault Trucks T 480',
    triggerSource: 'PREVENTIVE_KM_HOURS',
    priority: 'P3_SCHEDULED',
    status: 'OPEN',
    subsystem: 'BRAKES_APS',
    title: 'Entretien préventif PM2 & Remplacement cartouche dessiccateur APS',
    description: 'Échéance kilométrique des 30 000 km atteinte et début de dérive pression SPN 1087.',
    estimatedCostDzd: 42000,
    downtimeHours: 3.5,
    partsRequired: ['Cartouche dessiccateur Haldex/Knorr', 'Jeu filtres moteur PM2'],
    assignedTechnician: 'Khaled M. (Électro-mécanicien PL)',
    createdAt: '2026-10-26 16:45',
  },
  {
    id: 'wo-2026-087',
    workOrderNumber: 'OT-2026-0087',
    vehicleId: 'v-006',
    vehicleRegistration: '16-0567-117',
    vehicleModel: 'Shacman F3000 6x4',
    triggerSource: 'TELEMETRY_DTC_CRITICAL',
    priority: 'P1_IMMOBILIZATION',
    status: 'WAITING_PARTS',
    subsystem: 'ENGINE',
    title: 'Contrôle pression pompe à huile et régénération forcée FAP',
    description: 'SPN-100-FMI-1 et SPN-3251-FMI-16 reçus simultanément. Véhicule consigné à l’arrêt.',
    estimatedCostDzd: 95000,
    downtimeHours: 8.0,
    partsRequired: ['Capteur pression huile Weichai OEM', 'Huile moteur 15W40 (36L)', 'Filtre reniflard'],
    assignedTechnician: 'Amine T. (Spécialiste Moteur Weichai)',
    createdAt: '2026-10-27 07:50',
  },
];

// ============================================================================
// 6. CATALOGUE LOCAL DE PIÈCES & CROSS-REFERENCES (15 PIÈCES MAÎTRESSES)
// ============================================================================
export interface OemPartItem {
  internalSku: string;
  category: string;
  nameFr: string;
  oemReference: string;
  oemBrand: string;
  technicalSpecs: Record<string, any>;
  unitPriceDzd: number;
  equivalences: Array<{
    aftermarketBrand: string;
    equivalentReference: string;
    confidenceLevel: 'EXACT_OEM_MATCH' | 'HIGH_PERFORMANCE_HEAVY_DUTY';
  }>;
}

export const OEM_PARTS_CROSS_REF_SEEDS: OemPartItem[] = [
  {
    internalSku: 'SKU-FLT-OIL-CAT-1R1808',
    category: 'OIL_FILTER',
    nameFr: 'Filtre à Huile Moteur Haute Efficacité BTP (Caterpillar)',
    oemReference: '1R-1808',
    oemBrand: 'Caterpillar',
    technicalSpecs: { threadSize: '1 1/8-16 UN-2B', outerDiameterMm: 136, heightMm: 308, micronRating: 20, bypassValveBar: 2.5 },
    unitPriceDzd: 8900,
    equivalences: [
      { aftermarketBrand: 'DONALDSON', equivalentReference: 'P551808', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FLEETGUARD', equivalentReference: 'LF691A', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'MANN_FILTER', equivalentReference: 'WD 13 145/18', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'BALDWIN', equivalentReference: 'B7299', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-FLT-FUEL-CAT-1R0749',
    category: 'FUEL_FILTER',
    nameFr: 'Filtre Carburant Secondaire Haute Efficacité 2 Microns (Caterpillar)',
    oemReference: '1R-0749',
    oemBrand: 'Caterpillar',
    technicalSpecs: { threadSize: '1-14 UNS-2B', outerDiameterMm: 93, heightMm: 266, micronRating: 2, mediumType: 'Cellulose Synthétique' },
    unitPriceDzd: 7600,
    equivalences: [
      { aftermarketBrand: 'DONALDSON', equivalentReference: 'P551311', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FLEETGUARD', equivalentReference: 'FF5319', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'MANN_FILTER', equivalentReference: 'WK 980/1', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'BOSCH', equivalentReference: 'F 026 402 045', confidenceLevel: 'HIGH_PERFORMANCE_HEAVY_DUTY' },
    ],
  },
  {
    internalSku: 'SKU-FLT-APS-VOLVO-21620181',
    category: 'APS_DRYER_CARTRIDGE',
    nameFr: 'Cartouche Dessiccateur d’Air Coalescente Sécheur APS (Renault / Volvo)',
    oemReference: '21620181',
    oemBrand: 'Renault Trucks / Volvo',
    technicalSpecs: { threadSize: 'M39 x 1.5', outerDiameterMm: 140, heightMm: 165, features: 'Séparateur d’huile coalescent intégré (Oil Catch)' },
    unitPriceDzd: 18500,
    equivalences: [
      { aftermarketBrand: 'MANN_FILTER', equivalentReference: 'TB 1394/1 x', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'KNORR_BREMSE', equivalentReference: 'II40100F', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'WABCO', equivalentReference: '4329012232', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FLEETGUARD', equivalentReference: 'AD27750', confidenceLevel: 'HIGH_PERFORMANCE_HEAVY_DUTY' },
    ],
  },
  {
    internalSku: 'SKU-FLT-OIL-RENAULT-7421380488',
    category: 'OIL_FILTER',
    nameFr: 'Filtre à Huile Moteur DTi 11 / DTi 13 (Renault Trucks T & K)',
    oemReference: '7421380488',
    oemBrand: 'Renault Trucks',
    technicalSpecs: { outerDiameterMm: 108, heightMm: 262, bypassValveBar: 2.2 },
    unitPriceDzd: 6800,
    equivalences: [
      { aftermarketBrand: 'MANN_FILTER', equivalentReference: 'HU 1176 y', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'DONALDSON', equivalentReference: 'P550529', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FLEETGUARD', equivalentReference: 'LF16015', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-FLT-AIR-SCANIA-1869993',
    category: 'AIR_FILTER_PRIMARY',
    nameFr: 'Élément Filtre à Air Primaire Poids Lourds (Scania Série R & G)',
    oemReference: '1869993',
    oemBrand: 'Scania',
    technicalSpecs: { outerDiameterMm: 303, innerDiameterMm: 191, heightMm: 494 },
    unitPriceDzd: 16400,
    equivalences: [
      { aftermarketBrand: 'DONALDSON', equivalentReference: 'P782857', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'MANN_FILTER', equivalentReference: 'C 30 1530', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FLEETGUARD', equivalentReference: 'AF26165', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-FLT-HYD-KOMATSU-4216035170',
    category: 'HYDRAULIC_FILTER',
    nameFr: 'Filtre Retour Circuit Hydraulique Haute Pression (Komatsu PC210)',
    oemReference: '421-60-35170',
    oemBrand: 'Komatsu',
    technicalSpecs: { outerDiameterMm: 150, heightMm: 450, micronRating: 10, collapsePressureBar: 25 },
    unitPriceDzd: 24500,
    equivalences: [
      { aftermarketBrand: 'DONALDSON', equivalentReference: 'P550388', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FLEETGUARD', equivalentReference: 'HF35150', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'PARKER', equivalentReference: '936718Q', confidenceLevel: 'HIGH_PERFORMANCE_HEAVY_DUTY' },
    ],
  },
  {
    internalSku: 'SKU-OIL-ENG-15W40-CAT',
    category: 'ENGINE_OIL',
    nameFr: 'Huile Moteur Minérale Supérieure 15W-40 API CK-4 / CAT ECF-3 (Fût 208L)',
    oemReference: 'CAT-DEO-15W40-208L',
    oemBrand: 'Caterpillar',
    technicalSpecs: { viscosityGrade: '15W-40', apiSpec: 'CK-4/CJ-4', aceaSpec: 'E9', tbn: 10.2, flashPointC: 228 },
    unitPriceDzd: 165000,
    equivalences: [
      { aftermarketBrand: 'TOTAL_ENERGIES', equivalentReference: 'Rubia Works 4000 15W-40', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'MOBIL', equivalentReference: 'Delvac Modern 15W-40 Super Defense', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'SHELL', equivalentReference: 'Rimula R4 X 15W-40', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-OIL-ENG-10W40-RENAULT',
    category: 'ENGINE_OIL',
    nameFr: 'Huile Moteur Synthèse Poids Lourds 10W-40 ACEA E6/E9 Low-SAPS (Fût 208L)',
    oemReference: 'RENAULT-RLD-3-10W40',
    oemBrand: 'Renault Trucks',
    technicalSpecs: { viscosityGrade: '10W-40', aceaSpec: 'E6/E9/E7', oemApprovals: 'Renault RLD-3 / Volvo VDS-4.5 / MB 228.51' },
    unitPriceDzd: 182000,
    equivalences: [
      { aftermarketBrand: 'TOTAL_ENERGIES', equivalentReference: 'Rubia TIR 8900 10W-40', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'SHELL', equivalentReference: 'Rimula R6 LM 10W-40', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'CASTROL', equivalentReference: 'Vecton Long Drain 10W-40 E6/E9', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-OIL-HYD-VG46-TOTAL',
    category: 'HYDRAULIC_OIL',
    nameFr: 'Huile Hydraulique Anti-Usure ISO VG 46 Haute Température (Fût 208L)',
    oemReference: 'CAT-HYDO-ADVANCED-10',
    oemBrand: 'Caterpillar',
    technicalSpecs: { isoViscosityGrade: 46, dinSpec: '51524 Part 2 HLP', vi: 105, pourPointC: -30 },
    unitPriceDzd: 142000,
    equivalences: [
      { aftermarketBrand: 'TOTAL_ENERGIES', equivalentReference: 'Azolla ZS 46', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'MOBIL', equivalentReference: 'DTE 10 Excel 46', confidenceLevel: 'HIGH_PERFORMANCE_HEAVY_DUTY' },
      { aftermarketBrand: 'SHELL', equivalentReference: 'Tellus S2 MX 46', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-FLT-DIESEL-TOYOTA-233900L070',
    category: 'FUEL_FILTER',
    nameFr: 'Filtre à Carburant Cartouche Purge Eau (Toyota Hilux 2.4D / 2.8D)',
    oemReference: '23390-0L070',
    oemBrand: 'Toyota',
    technicalSpecs: { outerDiameterMm: 83, innerDiameterMm: 19, heightMm: 76, sensorPort: true },
    unitPriceDzd: 3800,
    equivalences: [
      { aftermarketBrand: 'MANN_FILTER', equivalentReference: 'PU 8008 z', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'DENSO', equivalentReference: 'DCF004K', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'BOSCH', equivalentReference: 'F 026 402 188', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-FLT-OIL-RENAULT-LCV-152093920R',
    category: 'OIL_FILTER',
    nameFr: 'Filtre à Huile Moteur 2.3 dCi M9T / 1.5 dCi K9K (Renault Master & Kangoo)',
    oemReference: '152093920R',
    oemBrand: 'Renault',
    technicalSpecs: { outerDiameterMm: 57, innerDiameterMm: 24, heightMm: 133 },
    unitPriceDzd: 2400,
    equivalences: [
      { aftermarketBrand: 'PURFLUX', equivalentReference: 'L441', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'MANN_FILTER', equivalentReference: 'HU 6011 z', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'BOSCH', equivalentReference: 'F 026 407 125', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-BRK-PAD-MERCEDES-ACTROS',
    category: 'BRAKE_PAD',
    nameFr: 'Jeu de Plaquettes de Frein à Disque Essieu Avant (Mercedes Actros MP4/MP5)',
    oemReference: '0064201120',
    oemBrand: 'Mercedes-Benz Trucks',
    technicalSpecs: { widthMm: 249.6, heightMm: 118, thicknessMm: 30, brakeSystem: 'Knorr SN7000' },
    unitPriceDzd: 28500,
    equivalences: [
      { aftermarketBrand: 'TEXTAR', equivalentReference: '2927801', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FERODO_RACING', equivalentReference: 'FCV4385FE', confidenceLevel: 'HIGH_PERFORMANCE_HEAVY_DUTY' },
      { aftermarketBrand: 'JURID', equivalentReference: '572624J', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-KIT-TIMING-HILUX',
    category: 'TIMING_KIT',
    nameFr: 'Kit Courroie de Distribution Renforcée (Toyota Hilux 1KD/2KD-FTV)',
    oemReference: '13568-39016',
    oemBrand: 'Toyota',
    technicalSpecs: { toothCount: 97, widthMm: 25, profile: 'Curviligne Haute Résistance Poussière' },
    unitPriceDzd: 14500,
    equivalences: [
      { aftermarketBrand: 'GATES', equivalentReference: '5636XS', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'CONTITECH', equivalentReference: 'CT1084', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'DAYCO', equivalentReference: '94998', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-OIL-GEAR-75W80-ZF',
    category: 'GEAR_OIL',
    nameFr: 'Huile de Boîte de Vitesses Robotisée 75W-80 API GL-4 ZF TraXon / Optidriver (Bidon 20L)',
    oemReference: 'ZF-ECOFLUID-M-75W80',
    oemBrand: 'ZF Friedrichshafen',
    technicalSpecs: { viscosityGrade: '75W-80', specification: 'ZF TE-ML 01E, 02E, 16K / MAN 341 Typ Z5', drainIntervalKm: 300000 },
    unitPriceDzd: 32000,
    equivalences: [
      { aftermarketBrand: 'TOTAL_ENERGIES', equivalentReference: 'Traxium Gear 8 75W-80', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'MOBIL', equivalentReference: 'Delvac 1 Transmission Fluid 75W-80', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
  {
    internalSku: 'SKU-FLT-WATER-SEP-RACOR',
    category: 'WATER_SEPARATOR',
    nameFr: 'Cartouche Filtre Séparateur d’Eau Gazole Turbine 30 Microns (Parker Racor)',
    oemReference: '2040PM-OR',
    oemBrand: 'Parker Racor',
    technicalSpecs: { flowRateGph: 60, micronRating: 30, aquabloc: true },
    unitPriceDzd: 5200,
    equivalences: [
      { aftermarketBrand: 'BALDWIN', equivalentReference: 'PF598-30', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'DONALDSON', equivalentReference: 'P552040', confidenceLevel: 'EXACT_OEM_MATCH' },
      { aftermarketBrand: 'FLEETGUARD', equivalentReference: 'FS20403', confidenceLevel: 'EXACT_OEM_MATCH' },
    ],
  },
];

// ============================================================================
// 7. DÉCODEUR CAN-BUS .DBC INTERACTIF
// ============================================================================
export interface DbcCanFrameDefinition {
  frameIdHex: string;
  name: string;
  description: string;
  signals: Array<{
    name: string;
    startBit: number;
    bitLength: number;
    scale: number;
    offset: number;
    unit: string;
    spn?: number;
  }>;
}

export const DBC_CAN_DEFINITIONS: DbcCanFrameDefinition[] = [
  {
    frameIdHex: '0x0CF00400',
    name: 'EEC1 (Electronic Engine Controller 1)',
    description: 'Régime moteur (RPM) et Couple instantané moteur (J1939)',
    signals: [
      { name: 'EngineSpeed_RPM', startBit: 24, bitLength: 16, scale: 0.125, offset: 0, unit: 'rpm', spn: 190 },
      { name: 'ActualEnginePercentTorque', startBit: 16, bitLength: 8, scale: 1.0, offset: -125, unit: '%', spn: 513 },
      { name: 'DriversDemandPercentTorque', startBit: 8, bitLength: 8, scale: 1.0, offset: -125, unit: '%', spn: 512 },
    ],
  },
  {
    frameIdHex: '0x18FEEE00',
    name: 'ET1 (Engine Temperature 1)',
    description: 'Températures critiques culasse, huile et gazole (J1939)',
    signals: [
      { name: 'EngineCoolantTemp_DegC', startBit: 0, bitLength: 8, scale: 1.0, offset: -40, unit: '°C', spn: 110 },
      { name: 'FuelTemp_DegC', startBit: 8, bitLength: 8, scale: 1.0, offset: -40, unit: '°C', spn: 174 },
      { name: 'EngineOilTemp_DegC', startBit: 16, bitLength: 16, scale: 0.03125, offset: -273, unit: '°C', spn: 175 },
    ],
  },
  {
    frameIdHex: '0x18FEEF00',
    name: 'EFL_P1 (Engine Fluid Level/Pressure 1)',
    description: 'Pression d’huile moteur et pression de carter (J1939)',
    signals: [
      { name: 'EngineOilPressure_Bar', startBit: 24, bitLength: 8, scale: 0.04, offset: 0, unit: 'bar', spn: 100 },
      { name: 'CrankcasePressure_kPa', startBit: 40, bitLength: 16, scale: 0.0078125, offset: -250, unit: 'kPa', spn: 101 },
    ],
  },
  {
    frameIdHex: '0x18FEAE00',
    name: 'AIR1 (Air Supply Pressure)',
    description: 'Pression circuit de freinage et sécheur pneumatique APS (J1939)',
    signals: [
      { name: 'PneumaticSupplyPressure_Bar', startBit: 0, bitLength: 8, scale: 0.08, offset: 0, unit: 'bar', spn: 1087 },
    ],
  },
];

/**
 * Décode une trame CAN 8 octets selon sa définition DBC
 */
export function decodeRawCanFrame(frameIdHex: string, hexPayload: string) {
  const def = DBC_CAN_DEFINITIONS.find((d) => d.frameIdHex.toUpperCase() === frameIdHex.toUpperCase());
  if (!def) return null;

  const cleanHex = hexPayload.replace(/\s+/g, '').padStart(16, '0').slice(0, 16);
  const bytes = [];
  for (let i = 0; i < 16; i += 2) {
    bytes.push(parseInt(cleanHex.substring(i, i + 2), 16) || 0);
  }

  const decodedSignals: Array<{
    name: string;
    rawValue: number;
    physicalValue: number;
    unit: string;
    spn?: number;
  }> = [];

  for (const sig of def.signals) {
    const startByte = Math.floor(sig.startBit / 8);
    let raw = 0;
    if (sig.bitLength === 8) {
      raw = bytes[startByte] ?? 0;
    } else if (sig.bitLength === 16) {
      const b0 = bytes[startByte] ?? 0;
      const b1 = bytes[startByte + 1] ?? 0;
      raw = b0 | (b1 << 8); // Little Endian (Intel @1)
    }

    const physicalValue = parseFloat((raw * sig.scale + sig.offset).toFixed(2));
    decodedSignals.push({
      name: sig.name,
      rawValue: raw,
      physicalValue,
      unit: sig.unit,
      spn: sig.spn,
    });
  }

  return {
    frameName: def.name,
    description: def.description,
    rawBytes: bytes,
    signals: decodedSignals,
  };
}

// ============================================================================
// 8. MODULE ACHATS & STOCKS PHYSIQUES DE MAGASIN (INVENTAIRE 4.0)
// ============================================================================

export interface WarehouseStoreItem {
  id: string;
  code: string;
  name: string;
  locationWilaya: string;
  address: string;
  managerName: string;
  isCentralHub: boolean;
  isActive: boolean;
}

export interface PartInventoryItemRecord {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  partId: string;
  internalSku: string;
  partName: string;
  oemReference: string;
  oemBrand: string;
  category: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  minimumStockThreshold: number;
  reorderQuantity: number;
  binLocation: string;
  averageUnitCostDzd: number;
  lastRestockDate: string;
  status: 'IN_STOCK' | 'LOW_STOCK_ALERT' | 'OUT_OF_STOCK' | 'OVERSTOCKED';
}

export interface StockMovementRecord {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  inventoryItemId: string;
  internalSku: string;
  partName: string;
  movementType:
    | 'PURCHASE_RECEIPT'
    | 'WORK_ORDER_ISSUE'
    | 'WORK_ORDER_RETURN'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'INVENTORY_ADJUSTMENT';
  quantity: number;
  balanceAfter: number;
  unitCostDzd: number;
  totalCostDzd: number;
  workOrderNumber?: string;
  purchaseOrderNumber?: string;
  referenceDocNumber: string;
  performedBy: string;
  notes?: string;
  timestamp: string;
}

export interface PurchaseOrderItemRecord {
  id: string;
  partId: string;
  internalSku: string;
  partName: string;
  orderedBrand: string;
  orderedReference: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPriceDzd: number;
  totalPriceDzd: number;
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  supplierName: string;
  supplierNif: string;
  status: 'DRAFT' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  totalAmountDzd: number;
  expectedDeliveryDate: string;
  createdFromAlert: boolean;
  notes?: string;
  createdAt: string;
  items: PurchaseOrderItemRecord[];
}

export const INITIAL_WAREHOUSE_STORES: WarehouseStoreItem[] = [
  {
    id: 'wh-001',
    code: 'MAG-ALGER-CENTRE',
    name: 'Magasin Central & Hub Pièces Alger (Zone Industrielle Oued Smar)',
    locationWilaya: '16 - Alger',
    address: 'Zone Industrielle Oued Smar, Lot 42, Alger',
    managerName: 'Karim Meziane (Chef Magasinier Central)',
    isCentralHub: true,
    isActive: true,
  },
  {
    id: 'wh-002',
    code: 'DEPOT-HASSI-MESSAOUD',
    name: 'Dépôt Régional Sud & Carrières BTP (Base Opérationnelle Irara)',
    locationWilaya: '30 - Ouargla',
    address: 'Base Logistique Irara, Route de Touggourt, Hassi Messaoud',
    managerName: 'Sofiane Brahimi (Gestionnaire Pièces BTP Sud)',
    isCentralHub: false,
    isActive: true,
  },
  {
    id: 'wh-003',
    code: 'ATELIER-ORAN',
    name: 'Atelier & Dépôt Ouest (Zone Es-Sénia)',
    locationWilaya: '31 - Oran',
    address: 'Parc Technique Es-Sénia, Voie C, Oran',
    managerName: 'Rachid Benali (Responsable Atelier & Stocks Ouest)',
    isCentralHub: false,
    isActive: true,
  },
];

export const INITIAL_INVENTORY_ITEMS: PartInventoryItemRecord[] = [
  {
    id: 'inv-001',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-cat-1r1808',
    internalSku: 'SKU-FLT-OIL-CAT-1R1808',
    partName: 'Filtre à Huile Moteur Haute Efficacité BTP (Caterpillar)',
    oemReference: '1R-1808',
    oemBrand: 'Caterpillar',
    category: 'OIL_FILTER',
    quantityOnHand: 14,
    quantityReserved: 2,
    quantityAvailable: 12,
    minimumStockThreshold: 4,
    reorderQuantity: 10,
    binLocation: 'A-01-R03 (Rayon Filtres Moteur)',
    averageUnitCostDzd: 8900,
    lastRestockDate: '2026-10-18',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-002',
    warehouseId: 'wh-002',
    warehouseCode: 'DEPOT-HASSI-MESSAOUD',
    partId: 'part-cat-1r1808',
    internalSku: 'SKU-FLT-OIL-CAT-1R1808',
    partName: 'Filtre à Huile Moteur Haute Efficacité BTP (Caterpillar)',
    oemReference: '1R-1808',
    oemBrand: 'Caterpillar',
    category: 'OIL_FILTER',
    quantityOnHand: 2,
    quantityReserved: 1,
    quantityAvailable: 1,
    minimumStockThreshold: 4,
    reorderQuantity: 8,
    binLocation: 'S-BTP-12 (Casier Équipements Sud)',
    averageUnitCostDzd: 9100,
    lastRestockDate: '2026-10-02',
    status: 'LOW_STOCK_ALERT',
  },
  {
    id: 'inv-003',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-cat-1r0749',
    internalSku: 'SKU-FLT-FUEL-CAT-1R0749',
    partName: 'Filtre Carburant Secondaire Haute Efficacité 2 Microns (Caterpillar)',
    oemReference: '1R-0749',
    oemBrand: 'Caterpillar',
    category: 'FUEL_FILTER',
    quantityOnHand: 18,
    quantityReserved: 4,
    quantityAvailable: 14,
    minimumStockThreshold: 5,
    reorderQuantity: 12,
    binLocation: 'A-02-R01 (Rayon Injection)',
    averageUnitCostDzd: 7600,
    lastRestockDate: '2026-10-20',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-004',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-volvo-21620181',
    internalSku: 'SKU-FLT-APS-VOLVO-21620181',
    partName: 'Cartouche Dessiccateur d’Air Coalescente Sécheur APS (Renault / Volvo)',
    oemReference: '21620181',
    oemBrand: 'Renault Trucks / Volvo',
    category: 'APS_DRYER_CARTRIDGE',
    quantityOnHand: 8,
    quantityReserved: 2,
    quantityAvailable: 6,
    minimumStockThreshold: 3,
    reorderQuantity: 6,
    binLocation: 'B-04-R02 (Pneumatique & Freinage PL)',
    averageUnitCostDzd: 18500,
    lastRestockDate: '2026-10-15',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-005',
    warehouseId: 'wh-003',
    warehouseCode: 'ATELIER-ORAN',
    partId: 'part-volvo-21620181',
    internalSku: 'SKU-FLT-APS-VOLVO-21620181',
    partName: 'Cartouche Dessiccateur d’Air Coalescente Sécheur APS (Renault / Volvo)',
    oemReference: '21620181',
    oemBrand: 'Renault Trucks / Volvo',
    category: 'APS_DRYER_CARTRIDGE',
    quantityOnHand: 1,
    quantityReserved: 1,
    quantityAvailable: 0,
    minimumStockThreshold: 2,
    reorderQuantity: 4,
    binLocation: 'O-PL-04 (Freinage Ouest)',
    averageUnitCostDzd: 18500,
    lastRestockDate: '2026-09-28',
    status: 'OUT_OF_STOCK',
  },
  {
    id: 'inv-006',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-renault-7421380488',
    internalSku: 'SKU-FLT-OIL-RENAULT-7421380488',
    partName: 'Filtre à Huile Moteur DTi 11 / DTi 13 (Renault Trucks T & K)',
    oemReference: '7421380488',
    oemBrand: 'Renault Trucks',
    category: 'OIL_FILTER',
    quantityOnHand: 22,
    quantityReserved: 4,
    quantityAvailable: 18,
    minimumStockThreshold: 6,
    reorderQuantity: 15,
    binLocation: 'A-01-R05',
    averageUnitCostDzd: 6800,
    lastRestockDate: '2026-10-22',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-007',
    warehouseId: 'wh-002',
    warehouseCode: 'DEPOT-HASSI-MESSAOUD',
    partId: 'part-komatsu-4216035170',
    internalSku: 'SKU-FLT-HYD-KOMATSU-4216035170',
    partName: 'Filtre Retour Circuit Hydraulique Haute Pression (Komatsu PC210)',
    oemReference: '421-60-35170',
    oemBrand: 'Komatsu',
    category: 'HYDRAULIC_FILTER',
    quantityOnHand: 3,
    quantityReserved: 0,
    quantityAvailable: 3,
    minimumStockThreshold: 2,
    reorderQuantity: 4,
    binLocation: 'S-HYD-03',
    averageUnitCostDzd: 24500,
    lastRestockDate: '2026-10-10',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-008',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-oil-cat-15w40',
    internalSku: 'SKU-OIL-ENG-15W40-CAT',
    partName: 'Huile Moteur Minérale Supérieure 15W-40 API CK-4 (Fût 208L)',
    oemReference: 'CAT-DEO-15W40-208L',
    oemBrand: 'Caterpillar',
    category: 'ENGINE_OIL',
    quantityOnHand: 6,
    quantityReserved: 1,
    quantityAvailable: 5,
    minimumStockThreshold: 2,
    reorderQuantity: 4,
    binLocation: 'PARC-FUTS-01 (Zone Lubrifiants)',
    averageUnitCostDzd: 165000,
    lastRestockDate: '2026-10-12',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-009',
    warehouseId: 'wh-002',
    warehouseCode: 'DEPOT-HASSI-MESSAOUD',
    partId: 'part-oil-hyd-vg46',
    internalSku: 'SKU-OIL-HYD-VG46-TOTAL',
    partName: 'Huile Hydraulique Anti-Usure ISO VG 46 Haute Température (Fût 208L)',
    oemReference: 'CAT-HYDO-ADVANCED-10',
    oemBrand: 'Caterpillar',
    category: 'HYDRAULIC_OIL',
    quantityOnHand: 2,
    quantityReserved: 1,
    quantityAvailable: 1,
    minimumStockThreshold: 3,
    reorderQuantity: 5,
    binLocation: 'S-LUB-02 (Abri Fûts Sud)',
    averageUnitCostDzd: 142000,
    lastRestockDate: '2026-09-25',
    status: 'LOW_STOCK_ALERT',
  },
  {
    id: 'inv-010',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-toyota-diesel',
    internalSku: 'SKU-FLT-DIESEL-TOYOTA-233900L070',
    partName: 'Filtre à Carburant Cartouche Purge Eau (Toyota Hilux)',
    oemReference: '23390-0L070',
    oemBrand: 'Toyota',
    category: 'FUEL_FILTER',
    quantityOnHand: 25,
    quantityReserved: 3,
    quantityAvailable: 22,
    minimumStockThreshold: 8,
    reorderQuantity: 20,
    binLocation: 'V-TOY-01',
    averageUnitCostDzd: 3800,
    lastRestockDate: '2026-10-24',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-011',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-mercedes-actros-pad',
    internalSku: 'SKU-BRK-PAD-MERCEDES-ACTROS',
    partName: 'Jeu de Plaquettes de Frein à Disque Essieu Avant (Mercedes Actros)',
    oemReference: '0064201120',
    oemBrand: 'Mercedes-Benz Trucks',
    category: 'BRAKE_PAD',
    quantityOnHand: 5,
    quantityReserved: 1,
    quantityAvailable: 4,
    minimumStockThreshold: 3,
    reorderQuantity: 6,
    binLocation: 'B-02-R04',
    averageUnitCostDzd: 28500,
    lastRestockDate: '2026-10-14',
    status: 'IN_STOCK',
  },
  {
    id: 'inv-012',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    partId: 'part-racor-water-sep',
    internalSku: 'SKU-FLT-WATER-SEP-RACOR',
    partName: 'Cartouche Filtre Séparateur d’Eau Gazole Turbine 30 Microns (Parker Racor)',
    oemReference: '2040PM-OR',
    oemBrand: 'Parker Racor',
    category: 'WATER_SEPARATOR',
    quantityOnHand: 16,
    quantityReserved: 2,
    quantityAvailable: 14,
    minimumStockThreshold: 5,
    reorderQuantity: 10,
    binLocation: 'A-03-R02',
    averageUnitCostDzd: 5200,
    lastRestockDate: '2026-10-21',
    status: 'IN_STOCK',
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovementRecord[] = [
  {
    id: 'mov-001',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    inventoryItemId: 'inv-001',
    internalSku: 'SKU-FLT-OIL-CAT-1R1808',
    partName: 'Filtre à Huile Moteur Cat 1R-1808',
    movementType: 'WORK_ORDER_ISSUE',
    quantity: -1,
    balanceAfter: 14,
    unitCostDzd: 8900,
    totalCostDzd: 8900,
    workOrderNumber: 'OT-2026-0084',
    referenceDocNumber: 'BS-2026-1092',
    performedBy: 'Karim Meziane',
    notes: 'Sortie pour révision PM1 tracteur Caterpillar 320 GC',
    timestamp: '2026-10-27 08:45',
  },
  {
    id: 'mov-002',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    inventoryItemId: 'inv-004',
    internalSku: 'SKU-FLT-APS-VOLVO-21620181',
    partName: 'Cartouche Dessiccateur APS Renault/Volvo 21620181',
    movementType: 'PURCHASE_RECEIPT',
    quantity: +6,
    balanceAfter: 8,
    unitCostDzd: 18500,
    totalCostDzd: 111000,
    purchaseOrderNumber: 'BC-2026-0039',
    referenceDocNumber: 'BL-FOURN-44912',
    performedBy: 'Karim Meziane',
    notes: 'Réception livraison Comptoir Algérien des Filtres (BL N° 44912)',
    timestamp: '2026-10-26 14:15',
  },
  {
    id: 'mov-003',
    warehouseId: 'wh-002',
    warehouseCode: 'DEPOT-HASSI-MESSAOUD',
    inventoryItemId: 'inv-002',
    internalSku: 'SKU-FLT-OIL-CAT-1R1808',
    partName: 'Filtre à Huile Moteur Cat 1R-1808',
    movementType: 'WORK_ORDER_ISSUE',
    quantity: -2,
    balanceAfter: 2,
    unitCostDzd: 9100,
    totalCostDzd: 18200,
    workOrderNumber: 'OT-2026-0082',
    referenceDocNumber: 'BS-SUD-0518',
    performedBy: 'Sofiane Brahimi',
    notes: 'Remplacement urgent sur pelle hydraulique carrière Sud',
    timestamp: '2026-10-25 11:20',
  },
  {
    id: 'mov-004',
    warehouseId: 'wh-001',
    warehouseCode: 'MAG-ALGER-CENTRE',
    inventoryItemId: 'inv-010',
    internalSku: 'SKU-FLT-DIESEL-TOYOTA-233900L070',
    partName: 'Filtre Gazole Toyota Hilux',
    movementType: 'WORK_ORDER_ISSUE',
    quantity: -1,
    balanceAfter: 25,
    unitCostDzd: 3800,
    totalCostDzd: 3800,
    workOrderNumber: 'OT-2026-0085',
    referenceDocNumber: 'BS-2026-1094',
    performedBy: 'Karim Meziane',
    notes: 'Consommation suite DTC P0087 (Perte pression rampe)',
    timestamp: '2026-10-27 09:20',
  },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: 'po-2026-041',
    poNumber: 'BC-2026-0041',
    warehouseId: 'wh-002',
    warehouseCode: 'DEPOT-HASSI-MESSAOUD',
    warehouseName: 'Dépôt Régional Sud & Carrières BTP',
    supplierName: 'Bergerat Monnoyeur Algérie (Distributeur Officiel CAT)',
    supplierNif: '000016001234567',
    status: 'ORDERED',
    totalAmountDzd: 218000,
    expectedDeliveryDate: '2026-10-30',
    createdFromAlert: true,
    notes: 'Réapprovisionnement d’urgence filtres Cat 1R-1808 et fûts huile hydraulique Sud',
    createdAt: '2026-10-26 16:30',
    items: [
      {
        id: 'poi-101',
        partId: 'part-cat-1r1808',
        internalSku: 'SKU-FLT-OIL-CAT-1R1808',
        partName: 'Filtre à Huile Moteur Cat 1R-1808 (Équivalence Donaldson P551808)',
        orderedBrand: 'DONALDSON',
        orderedReference: 'P551808',
        quantityOrdered: 8,
        quantityReceived: 0,
        unitPriceDzd: 8500,
        totalPriceDzd: 68000,
      },
      {
        id: 'poi-102',
        partId: 'part-oil-hyd-vg46',
        internalSku: 'SKU-OIL-HYD-VG46-TOTAL',
        partName: 'Huile Hydraulique ISO VG 46 (Total Azolla ZS 46 - Fût 208L)',
        orderedBrand: 'TOTAL_ENERGIES',
        orderedReference: 'Azolla ZS 46',
        quantityOrdered: 1,
        quantityReceived: 0,
        unitPriceDzd: 150000,
        totalPriceDzd: 150000,
      },
    ],
  },
  {
    id: 'po-2026-042',
    poNumber: 'BC-2026-0042',
    warehouseId: 'wh-003',
    warehouseCode: 'ATELIER-ORAN',
    warehouseName: 'Atelier & Dépôt Ouest (Es-Sénia)',
    supplierName: 'Comptoir Algérien de Filtration & Freinage',
    supplierNif: '000231009876543',
    status: 'APPROVED',
    totalAmountDzd: 74000,
    expectedDeliveryDate: '2026-11-02',
    createdFromAlert: true,
    notes: 'Rupture constatée sur cartouches dessiccateurs APS Oran',
    createdAt: '2026-10-27 10:15',
    items: [
      {
        id: 'poi-201',
        partId: 'part-volvo-21620181',
        internalSku: 'SKU-FLT-APS-VOLVO-21620181',
        partName: 'Cartouche Dessiccateur APS (Mann-Filter TB 1394/1 x)',
        orderedBrand: 'MANN_FILTER',
        orderedReference: 'TB 1394/1 x',
        quantityOrdered: 4,
        quantityReceived: 0,
        unitPriceDzd: 18500,
        totalPriceDzd: 74000,
      },
    ],
  },
];

