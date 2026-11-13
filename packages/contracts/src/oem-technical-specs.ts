import { z } from 'zod';

export enum OemMake {
  SHACMAN = 'SHACMAN',
  RENAULT_TRUCKS = 'RENAULT_TRUCKS',
  MAN = 'MAN',
  MERCEDES_ACTROS = 'MERCEDES_ACTROS',
  ISUZU = 'ISUZU',
  HINO = 'HINO',
  CATERPILLAR = 'CATERPILLAR',
}

export enum OemComponentCode {
  CYLINDER_HEAD = 'CYLINDER_HEAD',             // Culasse (Rass el moteur)
  CON_ROD = 'CON_ROD',                         // Bielle (El bielle)
  MAIN_BEARING = 'MAIN_BEARING',               // Palier vilebrequin (Palier)
  INJECTOR_CLAMP = 'INJECTOR_CLAMP',           // Bride d'injecteur (Bride injecteur)
  FLYWHEEL = 'FLYWHEEL',                       // Volant moteur (Volant)
  OIL_PAN = 'OIL_PAN',                         // Carter d'huile (Carter)
  WHEEL_NUTS = 'WHEEL_NUTS',                   // Écrous de roue (Boulonatt rwayed)
}

export enum OemFluidCompartment {
  ENGINE_SUMP = 'ENGINE_SUMP',                 // Carter huile moteur (Zit moteur)
  GEARBOX = 'GEARBOX',                         // Boîte de vitesses (Zit la boite)
  REAR_AXLE = 'REAR_AXLE',                     // Pont arrière (Zit el pont)
  COOLING_SYSTEM = 'COOLING_SYSTEM',           // Liquide de refroidissement (Maa el radiateur)
  POWER_STEERING = 'POWER_STEERING',           // Direction assistée (Zit assisté)
  BRAKE_FLUID = 'BRAKE_FLUID',                 // Liquide de frein / Embrayage
}

export const OemTorqueSpecSchema = z.object({
  id: z.string().uuid().optional(),
  make: z.nativeEnum(OemMake),
  modelFamily: z.string().min(1),
  engineCode: z.string().min(1),
  componentCode: z.nativeEnum(OemComponentCode),
  componentNameFr: z.string().min(1),
  componentNameDarja: z.string().optional(),
  stage1TorqueNm: z.number().positive(),
  stage2TorqueNm: z.number().positive().optional(),
  stage3TorqueNm: z.number().positive().optional(),
  angleStage1Degrees: z.number().positive().optional(),
  angleStage2Degrees: z.number().positive().optional(),
  tighteningOrderDiagramUrl: z.string().optional(),
  specificToolRef: z.string().optional(),
  isCriticalAssembly: z.boolean().default(true),
  notesDz: z.string().optional(),
});

export type OemTorqueSpec = z.infer<typeof OemTorqueSpecSchema>;

export const OemFluidCapacitySchema = z.object({
  id: z.string().uuid().optional(),
  make: z.nativeEnum(OemMake),
  modelFamily: z.string().min(1),
  engineCode: z.string().min(1),
  compartmentCode: z.nativeEnum(OemFluidCompartment),
  compartmentNameFr: z.string().min(1),
  compartmentNameDarja: z.string().optional(),
  capacityLiters: z.number().positive(),
  standardViscosity: z.string().min(1),        // ex: '15W40 CI-4'
  saharanHeavyViscosity: z.string().min(1),    // ex: '20W50 CI-4' pour Adrar/Ouargla
  standardIntervalKm: z.number().int().positive(),
  saharanIntervalKm: z.number().int().positive(), // Réduction sévérité Grand Sud
  oemOilStandard: z.string().min(1),           // ex: 'Renault RLD-3', 'MAN M 3275'
  notesDz: z.string().optional(),
});

export type OemFluidCapacity = z.infer<typeof OemFluidCapacitySchema>;

export enum OemDtcType {
  OBD2_DTC = 'OBD2_DTC',
  J1939_SPN_FMI = 'J1939_SPN_FMI',
}

export enum DtcSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export const OemDtcFaultSchema = z.object({
  id: z.string().uuid().optional(),
  make: z.nativeEnum(OemMake),
  codeType: z.nativeEnum(OemDtcType),
  faultCode: z.string().min(1),                // ex: 'SPN 100 FMI 1', 'P0299'
  descriptionFr: z.string().min(1),
  probableCauseFr: z.string().min(1),
  immediateActionFr: z.string().min(1),
  darjaAudioCue: z.string().optional(),
  severityLevel: z.nativeEnum(DtcSeverity),
});

export type OemDtcFault = z.infer<typeof OemDtcFaultSchema>;

// Données d'ingénierie certifiées constructeurs (Golden Master Déterministe Algérie)
export const OFFICIAL_OEM_TORQUE_SPECS: OemTorqueSpec[] = [
  // 1. Shacman F3000 / X3000 (Weichai WP12.430 Euro II / III)
  {
    make: OemMake.SHACMAN,
    modelFamily: 'F3000 / X3000 6x4',
    engineCode: 'Weichai WP12.430',
    componentCode: OemComponentCode.CYLINDER_HEAD,
    componentNameFr: 'Vis de Culasse (M16 x 1.5 - Grade 12.9)',
    componentNameDarja: 'Boulonatt Rass el Moteur Shacman Weichai',
    stage1TorqueNm: 60,
    stage2TorqueNm: 120,
    stage3TorqueNm: 240,
    angleStage1Degrees: 90,
    angleStage2Degrees: 90,
    specificToolRef: 'Douille Torx Femelle E20 / Clé dynamométrique 3/4"',
    isCriticalAssembly: true,
    notesDz: 'Serrage en spirale du centre vers les extrémités. Huiler les filets et sous la tête. Remplacement vis obligatoire à chaque dépose.',
  },
  {
    make: OemMake.SHACMAN,
    modelFamily: 'F3000 / X3000 6x4',
    engineCode: 'Weichai WP12.430',
    componentCode: OemComponentCode.CON_ROD,
    componentNameFr: 'Vis de Chapeau de Bielle',
    componentNameDarja: 'Boulonatt Chapeau Bielle',
    stage1TorqueNm: 70,
    stage2TorqueNm: 140,
    angleStage1Degrees: 90,
    isCriticalAssembly: true,
    notesDz: 'Vérifier le jeu latéral (0.15 - 0.35 mm). Huilage avec huile moteur propre 15W40.',
  },
  // 2. Renault Trucks K440 / Kerax (DXi 11 / DTi 11 Euro 3 / 5)
  {
    make: OemMake.RENAULT_TRUCKS,
    modelFamily: 'Kerax / K-Series',
    engineCode: 'DTi 11 / DXi 11',
    componentCode: OemComponentCode.CYLINDER_HEAD,
    componentNameFr: 'Vis de Culasse (M16 x 2.0)',
    componentNameDarja: 'Boulonatt Rass Culasse Renault Kerax',
    stage1TorqueNm: 100,
    stage2TorqueNm: 200,
    angleStage1Degrees: 90,
    angleStage2Degrees: 90,
    specificToolRef: 'Douille Renault 9996963 / Clé à angle',
    isCriticalAssembly: true,
    notesDz: 'Respecter l ordre numérique 1 à 38 de la documentation officielle RVI. Contrôler la longueur sous tête (max 215.5 mm).',
  },
  {
    make: OemMake.RENAULT_TRUCKS,
    modelFamily: 'Kerax / K-Series',
    engineCode: 'DTi 11 / DXi 11',
    componentCode: OemComponentCode.INJECTOR_CLAMP,
    componentNameFr: 'Vis de Bride Porte-Injecteur',
    componentNameDarja: 'Bride Injecteur Kerax',
    stage1TorqueNm: 20,
    angleStage1Degrees: 180,
    isCriticalAssembly: true,
    notesDz: 'Changer obligatoirement la rondelle pare-flamme en cuivre.',
  },
  // 3. MAN TGX 33.480 / TGS 33.400 (D2676 LF / D2066)
  {
    make: OemMake.MAN,
    modelFamily: 'TGS / TGX 6x4',
    engineCode: 'MAN D2676 LF',
    componentCode: OemComponentCode.CYLINDER_HEAD,
    componentNameFr: 'Vis de Culasse MAN D26',
    componentNameDarja: 'Vis Culasse MAN TGX',
    stage1TorqueNm: 150,
    stage2TorqueNm: 300,
    angleStage1Degrees: 90,
    angleStage2Degrees: 90,
    specificToolRef: 'Embout MAN Torx Spécial T60',
    isCriticalAssembly: true,
    notesDz: 'Attendre 15 minutes de relaxation thermique entre les passes angulaires.',
  },
  // 4. Mercedes-Benz Actros 3340 / 3344 (OM501LA V6 Euro 3)
  {
    make: OemMake.MERCEDES_ACTROS,
    modelFamily: 'Actros MP2/MP3 3340',
    engineCode: 'OM 501 LA V6',
    componentCode: OemComponentCode.CYLINDER_HEAD,
    componentNameFr: 'Vis de Culasse individuelle (Par cylindre)',
    componentNameDarja: 'Culasse individuelle Actros V6',
    stage1TorqueNm: 60,
    stage2TorqueNm: 120,
    stage3TorqueNm: 200,
    angleStage1Degrees: 90,
    angleStage2Degrees: 90,
    isCriticalAssembly: true,
    notesDz: 'Moteur à culasses séparées. Vérifier impérativement le dépassement des chemises (0.23 à 0.28 mm).',
  },
];

export const OFFICIAL_OEM_FLUID_CAPACITIES: OemFluidCapacity[] = [
  // Shacman Weichai WP12
  {
    make: OemMake.SHACMAN,
    modelFamily: 'F3000 / X3000',
    engineCode: 'Weichai WP12.430',
    compartmentCode: OemFluidCompartment.ENGINE_SUMP,
    compartmentNameFr: 'Carter Huile Moteur (avec filtres)',
    compartmentNameDarja: 'Zit Moteur Shacman Weichai',
    capacityLiters: 36.0,
    standardViscosity: '15W40 CI-4',
    saharanHeavyViscosity: '20W50 CI-4 Heavy Duty',
    standardIntervalKm: 20000,
    saharanIntervalKm: 12000,
    oemOilStandard: 'Weichai Power Specification WP-01',
    notesDz: 'Capacité totale avec 2 filtres spin-on. Dans le Grand Sud (Tamanrasset/Adrar), vidange impérative à 12 000 km avec soufflage filtre air bi-hebdomadaire.',
  },
  {
    make: OemMake.SHACMAN,
    modelFamily: 'F3000 / X3000',
    engineCode: 'Fast 12JSD200T',
    compartmentCode: OemFluidCompartment.GEARBOX,
    compartmentNameFr: 'Boîte de Vitesses Fast Fuller 12 Rapports',
    compartmentNameDarja: 'Zit la Boite Fast Shacman',
    capacityLiters: 14.5,
    standardViscosity: '85W90 GL-4 / GL-5',
    saharanHeavyViscosity: '85W140 GL-5 Haute Température',
    standardIntervalKm: 60000,
    saharanIntervalKm: 35000,
    oemOilStandard: 'Fast Gear Lubricant Manual',
    notesDz: 'Remplissage par le bouchon latéral jusqu au débordement. Ne jamais mélanger avec de la fluide ATF.',
  },
  {
    make: OemMake.SHACMAN,
    modelFamily: 'F3000 / X3000',
    engineCode: 'HanDe MAN Steyr 16T',
    compartmentCode: OemFluidCompartment.REAR_AXLE,
    compartmentNameFr: 'Tandem Arrière Double Réduction (Ponts 1 & 2)',
    compartmentNameDarja: 'Zit El Pont Arrière Double Réduction',
    capacityLiters: 38.0, // 19L par pont
    standardViscosity: '80W90 GL-5 Hypoïde',
    saharanHeavyViscosity: '85W140 GL-5 Extrême Pression',
    standardIntervalKm: 50000,
    saharanIntervalKm: 30000,
    oemOilStandard: 'HanDe Axle EP-5 Standard',
    notesDz: 'Comprend les moyeux à réduction planétaire. Vidanger aussi les réductions de moyeux (3.5L chacune).',
  },
  // Renault Trucks Kerax DXi 11
  {
    make: OemMake.RENAULT_TRUCKS,
    modelFamily: 'Kerax / K-Series',
    engineCode: 'DTi 11 / DXi 11',
    compartmentCode: OemFluidCompartment.ENGINE_SUMP,
    compartmentNameFr: 'Carter Huile Moteur (avec cartouches)',
    compartmentNameDarja: 'Zit Moteur Renault Kerax',
    capacityLiters: 36.5,
    standardViscosity: '15W40 RLD-3',
    saharanHeavyViscosity: '15W50 / 20W50 RLD-2/3',
    standardIntervalKm: 30000,
    saharanIntervalKm: 18000,
    oemOilStandard: 'Renault Trucks RLD-3 / Volvo VDS-4.5',
    notesDz: 'Contrôler la présence d impuretés siliceuses dans le centrifugeur auxiliaire.',
  },
  // Mercedes-Benz Actros OM501LA
  {
    make: OemMake.MERCEDES_ACTROS,
    modelFamily: 'Actros 3340',
    engineCode: 'OM 501 LA V6',
    compartmentCode: OemFluidCompartment.ENGINE_SUMP,
    compartmentNameFr: 'Carter Huile Moteur Actros V6',
    compartmentNameDarja: 'Zit Moteur Actros OM501',
    capacityLiters: 34.0,
    standardViscosity: '15W40 MB 228.3 / 228.5',
    saharanHeavyViscosity: '20W50 MB 228.3 Saharien',
    standardIntervalKm: 40000,
    saharanIntervalKm: 25000,
    oemOilStandard: 'Mercedes-Benz Sheet 228.5',
    notesDz: 'Système Telligent de calcul de maintenance embarqué. Réduire de 35% en exploitation piste désertique.',
  },
];

export const OFFICIAL_OEM_DTC_FAULTS: OemDtcFault[] = [
  {
    make: OemMake.SHACMAN,
    codeType: OemDtcType.J1939_SPN_FMI,
    faultCode: 'SPN 100 FMI 1',
    descriptionFr: 'Pression d huile moteur trop basse (Danger Lubrification)',
    probableCauseFr: 'Niveau d huile insuffisant, crépine de pompe colmatée par boue ou pompe à huile défaillante.',
    immediateActionFr: 'Arrêt moteur immédiat. Contrôler la jauge manuelle et inspecter le carter pour fuite massive.',
    darjaAudioCue: 'Zit el moteur naqess bezzaf, habbes el camion direct w chouf la jauge!',
    severityLevel: DtcSeverity.CRITICAL,
  },
  {
    make: OemMake.SHACMAN,
    codeType: OemDtcType.J1939_SPN_FMI,
    faultCode: 'SPN 110 FMI 0',
    descriptionFr: 'Température de liquide de refroidissement moteur excessive (> 103 °C)',
    probableCauseFr: 'Radiateur entartré ou colmaté par sable/poussière, thermostat bloqué ou courroie détendue.',
    immediateActionFr: 'Laisser tourner au ralenti pour évacuer les calories, ne jamais ouvrir le bouchon sous pression.',
    darjaAudioCue: 'El skhouna talaa bezzaf kther men miya, khalli el moteur ydor bel aakel w mateftahch el bouchon!',
    severityLevel: DtcSeverity.CRITICAL,
  },
  {
    make: OemMake.RENAULT_TRUCKS,
    codeType: OemDtcType.OBD2_DTC,
    faultCode: 'P0299',
    descriptionFr: 'Sous-pression de suralimentation turbocompresseur',
    probableCauseFr: 'Durite d air de suralimentation fendue, échangeur intercooler percé par projection de gravier.',
    immediateActionFr: 'Vérifier l étanchéité du circuit d air comprimé et les colliers de serrage durite.',
    darjaAudioCue: 'L air makhnouq, l intercooler wela durite mchartka, chouf les colliers.',
    severityLevel: DtcSeverity.WARNING,
  },
];

