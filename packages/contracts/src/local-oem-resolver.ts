/**
 * LocalOemResolverService — Décodage VIN/PIN, Matrice Géoclimatique des 58 Wilayas & Mode 0
 * 100% Local-First / Air-Gapped Ready (Conforme ISO 3779, JORADP & AGENTS.md v3.0)
 */

export type OemAssetCategory =
  | 'LIGHT_COMMERCIAL'
  | 'HEAVY_TRUCK'
  | 'CONSTRUCTION_MACHINERY_BTP'
  | 'AGRICULTURAL_MACHINERY';

export type OperatingZone =
  | 'ZONE_1_TELL_COASTAL'
  | 'ZONE_2_HAUTS_PLATEAUX_STEPPE'
  | 'ZONE_3_SAHARA_DEEP_SOUTH'
  | 'HIGHWAY'
  | 'URBAN_DELIVERY'
  | 'BTP_QUARRY_SAHARA';

export type OemClimateZoneDZ = 'TELL_COASTAL' | 'HAUTS_PLATEAUX_STEPPE' | 'SAHARA_DEEP_SOUTH';

export type DustSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME_SILICA';

export interface DecodedOemAssetProfile {
  vin: string;
  wmi: string;
  make: string;
  model: string;
  country: string;
  modelYear: number;
  assetCategory: OemAssetCategory;
  defaultProtocol: 'SAE_J1939' | 'OBD2_CAN';
  operatingZone: OperatingZone;
  severeDutyFactor: number;
  recommendedTemplateCode: string;
  recommendedTemplateName: string;
  recommendedIntervals: {
    firstServiceKm?: number;
    firstServiceHours?: number;
    severeServiceKm?: number;
    severeServiceHours?: number;
  };
}

export interface WilayaSeverityInfo {
  code: string; // "01" à "58"
  codeNumber: number;
  nameFr: string;
  nameAr: string;
  chefLieu: string;
  zone: OemClimateZoneDZ;
  alphaDzOil: number;
  alphaDzFilter: number;
  alphaDz: number; // Composite
  ambientTempSummerMaxC: number;
  dustSeverity: DustSeverity;
  trafficIdlePercentTypical: number;
  constraints: string;
}

// ---------------------------------------------------------------------------
// 1. Matrice Officielle des 58 Wilayas d'Algérie (JORADP - Loi 19-12)
// ---------------------------------------------------------------------------
export const ALGERIA_58_WILAYAS_MATRIX: readonly WilayaSeverityInfo[] = [
  {
    code: '01',
    codeNumber: 1,
    nameFr: 'Adrar',
    nameAr: 'أدرار',
    chefLieu: 'Adrar',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.65,
    alphaDzFilter: 0.50,
    alphaDz: 0.58,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 25,
    constraints: 'Chaleur extrême (> 48°C), ensablement fin, pistes isolées, surchauffe pont.',
  },
  {
    code: '02',
    codeNumber: 2,
    nameFr: 'Chlef',
    nameAr: 'الشلف',
    chefLieu: 'Chlef',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 43,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 30,
    constraints: 'Forte chaleur estivale, corridor Autoroute A1 Est-Ouest.',
  },
  {
    code: '03',
    codeNumber: 3,
    nameFr: 'Laghouat',
    nameAr: 'الأغواط',
    chefLieu: 'Laghouat',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.70,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 44,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 20,
    constraints: 'Amplitudes thermiques importantes, transition désertique RN1.',
  },
  {
    code: '04',
    codeNumber: 4,
    nameFr: 'Oum El Bouaghi',
    nameAr: 'أم البواقي',
    chefLieu: 'Oum El Bouaghi',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 40,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 22,
    constraints: 'Hiver rigoureux avec gel et verglas, poussière calcaire.',
  },
  {
    code: '05',
    codeNumber: 5,
    nameFr: 'Batna',
    nameAr: 'باتنة',
    chefLieu: 'Batna',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 25,
    constraints: 'Massif des Aurès, fortes pentes, sollicitation accrue des freins et retarder.',
  },
  {
    code: '06',
    codeNumber: 6,
    nameFr: 'Béjaïa',
    nameAr: 'بجاية',
    chefLieu: 'Béjaïa',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 38,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 38,
    constraints: 'Humidité saline côtière, trafic portuaire dense, relief accidenté des Babors.',
  },
  {
    code: '07',
    codeNumber: 7,
    nameFr: 'Biskra',
    nameAr: 'بسكرة',
    chefLieu: 'Biskra',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.70,
    alphaDzFilter: 0.55,
    alphaDz: 0.63,
    ambientTempSummerMaxC: 47,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 28,
    constraints: 'Porte du Sud, canicules estivales, trafic maraîcher et camions frigorifiques lourds.',
  },
  {
    code: '08',
    codeNumber: 8,
    nameFr: 'Béchar',
    nameAr: 'بشار',
    chefLieu: 'Béchar',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.65,
    alphaDzFilter: 0.50,
    alphaDz: 0.58,
    ambientTempSummerMaxC: 48,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 22,
    constraints: 'Climat aride, carrières de gypse, vents de sable abrasifs pour la filtration.',
  },
  {
    code: '09',
    codeNumber: 9,
    nameFr: 'Blida',
    nameAr: 'البليدة',
    chefLieu: 'Blida',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 42,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 40,
    constraints: 'Gorges de la Chiffa (pente 8%), trafic dense axe Alger-Sud RN1.',
  },
  {
    code: '10',
    codeNumber: 10,
    nameFr: 'Bouira',
    nameAr: 'البويرة',
    chefLieu: 'Bouira',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 30,
    constraints: 'Col de Ben Haroun, fortes rampes A1, neige et verglas en hiver.',
  },
  {
    code: '11',
    codeNumber: 11,
    nameFr: 'Tamanrasset',
    nameAr: 'تمنراست',
    chefLieu: 'Tamanrasset',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.60,
    alphaDzFilter: 0.45,
    alphaDz: 0.53,
    ambientTempSummerMaxC: 46,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 20,
    constraints: 'Zones blanches radio > 300 km, pistes rocailleuses du Hoggar, transport d hydrocarbures.',
  },
  {
    code: '12',
    codeNumber: 12,
    nameFr: 'Tébessa',
    nameAr: 'تبسة',
    chefLieu: 'Tébessa',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.70,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 25,
    constraints: 'Poussières minières phosphate/fer, amplitudes thermiques et gel.',
  },
  {
    code: '13',
    codeNumber: 13,
    nameFr: 'Tlemcen',
    nameAr: 'تلمسان',
    chefLieu: 'Tlemcen',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 40,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 32,
    constraints: 'Monts de Tlemcen, routes sinueuses, trafic transfrontalier.',
  },
  {
    code: '14',
    codeNumber: 14,
    nameFr: 'Tiaret',
    nameAr: 'تيارت',
    chefLieu: 'Tiaret',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 25,
    constraints: 'Pôle industriel SAFMMA Mercedes-Benz, froid hivernal continental, steppe.',
  },
  {
    code: '15',
    codeNumber: 15,
    nameFr: 'Tizi Ouzou',
    nameAr: 'تيزي وزو',
    chefLieu: 'Tizi Ouzou',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 40,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 35,
    constraints: 'Massif du Djurdjura, fort dénivelé, forte usure freins et embrayage.',
  },
  {
    code: '16',
    codeNumber: 16,
    nameFr: 'Alger',
    nameAr: 'الجزائر',
    chefLieu: 'Alger',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.70,
    alphaDzFilter: 0.75,
    alphaDz: 0.73,
    ambientTempSummerMaxC: 39,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 48,
    constraints: 'Embouteillages sévères, ralenti urbain > 45% du temps moteur, encrassement FAP.',
  },
  {
    code: '17',
    codeNumber: 17,
    nameFr: 'Djelfa',
    nameAr: 'الجلفة',
    chefLieu: 'Djelfa',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.70,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 42,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 22,
    constraints: 'Carrefour logistique Nord-Sud RN1, amplitude thermique jour/nuit.',
  },
  {
    code: '18',
    codeNumber: 18,
    nameFr: 'Jijel',
    nameAr: 'جيجل',
    chefLieu: 'Jijel',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 37,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 30,
    constraints: 'Corrosion saline, port de Djen Djen, routes de corniche sinueuses.',
  },
  {
    code: '19',
    codeNumber: 19,
    nameFr: 'Sétif',
    nameAr: 'سطيف',
    chefLieu: 'Sétif',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 32,
    constraints: 'Pôle commercial et logistique, verglas en hiver, climat continental rude.',
  },
  {
    code: '20',
    codeNumber: 20,
    nameFr: 'Saïda',
    nameAr: 'سعيدة',
    chefLieu: 'Saïda',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.70,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 42,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 22,
    constraints: 'Relief semi-aride, pistes de carrières et transport minéralier.',
  },
  {
    code: '21',
    codeNumber: 21,
    nameFr: 'Skikda',
    nameAr: 'سكيكدة',
    chefLieu: 'Skikda',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 39,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 35,
    constraints: 'Pôle pétrochimique GNL, trafic citernes HAZMAT continu, sel marin.',
  },
  {
    code: '22',
    codeNumber: 22,
    nameFr: 'Sidi Bel Abbès',
    nameAr: 'سيدي بلعباس',
    chefLieu: 'Sidi Bel Abbès',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 42,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 28,
    constraints: 'Agro-industrie et matériel agricole PMA/Cirta, chaleur estivale.',
  },
  {
    code: '23',
    codeNumber: 23,
    nameFr: 'Annaba',
    nameAr: 'عنابة',
    chefLieu: 'Annaba',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 38,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 38,
    constraints: 'Poussières sidérurgiques (El Hadjar), port minéralier, corrosion saline.',
  },
  {
    code: '24',
    codeNumber: 24,
    nameFr: 'Guelma',
    nameAr: 'قالمة',
    chefLieu: 'Guelma',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 42,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 26,
    constraints: 'Bassin agricole tellien, cuvette de forte chaleur en juillet/août.',
  },
  {
    code: '25',
    codeNumber: 25,
    nameFr: 'Constantine',
    nameAr: 'قسنطينة',
    chefLieu: 'Constantine',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 42,
    constraints: 'Topographie escarpée, ponts et dénivelés urbains, usure plaquettes.',
  },
  {
    code: '26',
    codeNumber: 26,
    nameFr: 'Médéa',
    nameAr: 'المدية',
    chefLieu: 'Médéa',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 28,
    constraints: 'Atlas Tellien, col de Chréa, routes sinueuses en lacet, frein moteur sollicité.',
  },
  {
    code: '27',
    codeNumber: 27,
    nameFr: 'Mostaganem',
    nameAr: 'مستغانم',
    chefLieu: 'Mostaganem',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 38,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 30,
    constraints: 'Bassin maraîcher et portuaire, trafic lourd frigo.',
  },
  {
    code: '28',
    codeNumber: 28,
    nameFr: "M'Sila",
    nameAr: 'المسيلة',
    chefLieu: "M'Sila",
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.65,
    alphaDz: 0.70,
    ambientTempSummerMaxC: 45,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 25,
    constraints: 'Bassin du Hodna, tempêtes de sable chaud (Sirocco), abrasion des filtres.',
  },
  {
    code: '29',
    codeNumber: 29,
    nameFr: 'Mascara',
    nameAr: 'معسكر',
    chefLieu: 'Mascara',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 42,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 26,
    constraints: 'Plaine de Ghriss, transport agro-alimentaire, fortes chaleurs estivales.',
  },
  {
    code: '30',
    codeNumber: 30,
    nameFr: 'Ouargla',
    nameAr: 'ورقلة',
    chefLieu: 'Ouargla',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.65,
    alphaDzFilter: 0.50,
    alphaDz: 0.58,
    ambientTempSummerMaxC: 50,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 35,
    constraints: 'Bassin pétrolier Hassi Messaoud, bitume > 65°C, convoi lourd, PTO continu.',
  },
  {
    code: '31',
    codeNumber: 31,
    nameFr: 'Oran',
    nameAr: 'وهران',
    chefLieu: 'Oran',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 39,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 44,
    constraints: 'Deuxième métropole du pays, pôle Bethioua, trafic portuaire et A1 lourd.',
  },
  {
    code: '32',
    codeNumber: 32,
    nameFr: 'El Bayadh',
    nameAr: 'البيض',
    chefLieu: 'El Bayadh',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.65,
    alphaDz: 0.73,
    ambientTempSummerMaxC: 42,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 20,
    constraints: 'Altitude > 1000m, froid vif et neige hivernale, steppe saharienne en été.',
  },
  {
    code: '33',
    codeNumber: 33,
    nameFr: 'Illizi',
    nameAr: 'إيليزي',
    chefLieu: 'Illizi',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.60,
    alphaDzFilter: 0.45,
    alphaDz: 0.53,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 25,
    constraints: 'Bassins gaziers In Amenas / Ohanez, isolement, pistes très dures.',
  },
  {
    code: '34',
    codeNumber: 34,
    nameFr: 'Bordj Bou Arréridj',
    nameAr: 'برج بوعريريج',
    chefLieu: 'Bordj Bou Arréridj',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 30,
    constraints: 'Pôle électronique national, défilé des Portes de Fer, gel et froid.',
  },
  {
    code: '35',
    codeNumber: 35,
    nameFr: 'Boumerdès',
    nameAr: 'بومرداس',
    chefLieu: 'Boumerdès',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 38,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 36,
    constraints: 'Corridor d entrée Est d Alger, carrières de gravats, humidité marine.',
  },
  {
    code: '36',
    codeNumber: 36,
    nameFr: 'El Tarf',
    nameAr: 'الطارف',
    chefLieu: 'El Tarf',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 38,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 25,
    constraints: 'Zone frontalière Est, forte humidité forestière et maritime.',
  },
  {
    code: '37',
    codeNumber: 37,
    nameFr: 'Tindouf',
    nameAr: 'تندوف',
    chefLieu: 'Tindouf',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.60,
    alphaDzFilter: 0.45,
    alphaDz: 0.53,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 20,
    constraints: 'Giga-projet minier Gara Djebilet, pistes très abrasives, isolement logistique total.',
  },
  {
    code: '38',
    codeNumber: 38,
    nameFr: 'Tissemsilt',
    nameAr: 'تيسمسيلت',
    chefLieu: 'Tissemsilt',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 22,
    constraints: 'Massif de l Ouarsenis, routes secondaires sinueuses, enclavement relatif.',
  },
  {
    code: '39',
    codeNumber: 39,
    nameFr: 'El Oued',
    nameAr: 'الوادي',
    chefLieu: 'El Oued',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.65,
    alphaDzFilter: 0.50,
    alphaDz: 0.58,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 26,
    constraints: 'Région des Mille Coupoles, dunes mouvantes, agriculture sous serres, chaleur intense.',
  },
  {
    code: '40',
    codeNumber: 40,
    nameFr: 'Khenchela',
    nameAr: 'خنشلة',
    chefLieu: 'Khenchela',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.70,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 22,
    constraints: 'Sud des Aurès, fortes pentes, rigueur hivernale et neige précoce.',
  },
  {
    code: '41',
    codeNumber: 41,
    nameFr: 'Souk Ahras',
    nameAr: 'سوق أهراس',
    chefLieu: 'Souk Ahras',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.75,
    alphaDz: 0.78,
    ambientTempSummerMaxC: 40,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 24,
    constraints: 'Relief accidenté, monts de la Medjerda, hivers froids et humides.',
  },
  {
    code: '42',
    codeNumber: 42,
    nameFr: 'Tipaza',
    nameAr: 'تيبازة',
    chefLieu: 'Tipaza',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 38,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 30,
    constraints: 'Port de Cherchell, routes côtières, trafic touristique et agricole.',
  },
  {
    code: '43',
    codeNumber: 43,
    nameFr: 'Mila',
    nameAr: 'ميلة',
    chefLieu: 'Mila',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 41,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 26,
    constraints: 'Bassin du barrage de Beni Haroun, relief argileux instable.',
  },
  {
    code: '44',
    codeNumber: 44,
    nameFr: 'Aïn Defla',
    nameAr: 'عين الدفلى',
    chefLieu: 'Aïn Defla',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 44,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 30,
    constraints: 'Vallée du Chélif, cuve thermique estivale, agro-industrie et axe A1.',
  },
  {
    code: '45',
    codeNumber: 45,
    nameFr: 'Naâma',
    nameAr: 'النعامة',
    chefLieu: 'Naâma',
    zone: 'HAUTS_PLATEAUX_STEPPE',
    alphaDzOil: 0.80,
    alphaDzFilter: 0.65,
    alphaDz: 0.73,
    ambientTempSummerMaxC: 43,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 20,
    constraints: 'Axe Sud-Ouest RN6, steppe pastorale, gel hivernal et vents de sable.',
  },
  {
    code: '46',
    codeNumber: 46,
    nameFr: 'Aïn Témouchent',
    nameAr: 'عين تموشنت',
    chefLieu: 'Aïn Témouchent',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 38,
    dustSeverity: 'LOW',
    trafficIdlePercentTypical: 28,
    constraints: 'Bassin agricole et halieutique, trafic vers les ports de Béni Saf.',
  },
  {
    code: '47',
    codeNumber: 47,
    nameFr: 'Ghardaïa',
    nameAr: 'غرداية',
    chefLieu: 'Ghardaïa',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.70,
    alphaDzFilter: 0.55,
    alphaDz: 0.63,
    ambientTempSummerMaxC: 48,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 28,
    constraints: 'Vallée du M Zab, carrefour stratégique Nord-Sud RN1, fortes chaleurs.',
  },
  {
    code: '48',
    codeNumber: 48,
    nameFr: 'Relizane',
    nameAr: 'غليزان',
    chefLieu: 'Relizane',
    zone: 'TELL_COASTAL',
    alphaDzOil: 0.75,
    alphaDzFilter: 0.75,
    alphaDz: 0.75,
    ambientTempSummerMaxC: 46,
    dustSeverity: 'MEDIUM',
    trafficIdlePercentTypical: 30,
    constraints: 'Plaine de la Mina, record national de températures estivales telliennes (> 46°C).',
  },
  {
    code: '49',
    codeNumber: 49,
    nameFr: 'Timimoun',
    nameAr: 'تيميمون',
    chefLieu: 'Timimoun',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.60,
    alphaDzFilter: 0.45,
    alphaDz: 0.53,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 20,
    constraints: 'Oasis du Gourara, dunes rouges, pistes touristiques et de forages.',
  },
  {
    code: '50',
    codeNumber: 50,
    nameFr: 'Bordj Badji Mokhtar',
    nameAr: 'برج باجي مختار',
    chefLieu: 'Bordj Badji Mokhtar',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.55,
    alphaDzFilter: 0.40,
    alphaDz: 0.48,
    ambientTempSummerMaxC: 50,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 20,
    constraints: 'Extrême Sud frontalier Mali, piste Transsaharienne très éprouvante, zone blanche > 400 km.',
  },
  {
    code: '51',
    codeNumber: 51,
    nameFr: 'Ouled Djellal',
    nameAr: 'أولاد جلال',
    chefLieu: 'Ouled Djellal',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.70,
    alphaDzFilter: 0.60,
    alphaDz: 0.65,
    ambientTempSummerMaxC: 47,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 25,
    constraints: 'Bassin phœnicicole et ovin des Zibans, chaleur aride.',
  },
  {
    code: '52',
    codeNumber: 52,
    nameFr: 'Béni Abbès',
    nameAr: 'بني عباس',
    chefLieu: 'Béni Abbès',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.60,
    alphaDzFilter: 0.45,
    alphaDz: 0.53,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 20,
    constraints: 'Vallée de la Saoura, Grand Erg Occidental, chaleur sèche extrême.',
  },
  {
    code: '53',
    codeNumber: 53,
    nameFr: 'In Salah',
    nameAr: 'عين صالح',
    chefLieu: 'In Salah',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.55,
    alphaDzFilter: 0.40,
    alphaDz: 0.48,
    ambientTempSummerMaxC: 51,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 25,
    constraints: 'Pôle gazier stratégique, point le plus chaud d Algérie (> 50°C), poussières de forage.',
  },
  {
    code: '54',
    codeNumber: 54,
    nameFr: 'In Guezzam',
    nameAr: 'عين قزام',
    chefLieu: 'In Guezzam',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.55,
    alphaDzFilter: 0.40,
    alphaDz: 0.48,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 20,
    constraints: 'Frontière Niger, corridors d exportations subsahariennes, pistes abrasives.',
  },
  {
    code: '55',
    codeNumber: 55,
    nameFr: 'Touggourt',
    nameAr: 'تقرت',
    chefLieu: 'Touggourt',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.65,
    alphaDzFilter: 0.50,
    alphaDz: 0.58,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 28,
    constraints: 'Vallée de l Oued Righ, forages pétroliers périphériques, routes ensablées.',
  },
  {
    code: '56',
    codeNumber: 56,
    nameFr: 'Djanet',
    nameAr: 'جانت',
    chefLieu: 'Djanet',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.60,
    alphaDzFilter: 0.45,
    alphaDz: 0.53,
    ambientTempSummerMaxC: 46,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 20,
    constraints: 'Tassili n Ajjer, roches volcaniques aiguës, pistes d altitude désertiques.',
  },
  {
    code: '57',
    codeNumber: 57,
    nameFr: "El M'Ghair",
    nameAr: 'المغير',
    chefLieu: "El M'Ghair",
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.70,
    alphaDzFilter: 0.55,
    alphaDz: 0.63,
    ambientTempSummerMaxC: 48,
    dustSeverity: 'HIGH',
    trafficIdlePercentTypical: 24,
    constraints: 'Dépression du Chott Melrhir, poussières salines corrosives, forte chaleur.',
  },
  {
    code: '58',
    codeNumber: 58,
    nameFr: 'El Meniaa',
    nameAr: 'المنيعة',
    chefLieu: 'El Meniaa',
    zone: 'SAHARA_DEEP_SOUTH',
    alphaDzOil: 0.65,
    alphaDzFilter: 0.50,
    alphaDz: 0.58,
    ambientTempSummerMaxC: 49,
    dustSeverity: 'EXTREME_SILICA',
    trafficIdlePercentTypical: 24,
    constraints: 'Pôle agricole saharien pivots nappe albienne, transport lourd RN1.',
  },
] as const;

export const WILAYAS_BY_CODE: Record<string, WilayaSeverityInfo> = Object.freeze(
  ALGERIA_58_WILAYAS_MATRIX.reduce(
    (acc, item) => {
      acc[item.code] = item;
      acc[String(item.codeNumber)] = item;
      return acc;
    },
    {} as Record<string, WilayaSeverityInfo>
  )
);

/**
 * Récupère les métadonnées de sévérité d'une Wilaya par code ou nom
 */
export function getWilayaInfo(codeOrName: string | number): WilayaSeverityInfo | undefined {
  if (codeOrName === undefined || codeOrName === null) return undefined;
  const raw = String(codeOrName).trim();
  const normalizedCode = raw.length === 1 ? `0${raw}` : raw;

  if (WILAYAS_BY_CODE[normalizedCode]) {
    return WILAYAS_BY_CODE[normalizedCode];
  }

  const lower = raw.toLowerCase();
  return ALGERIA_58_WILAYAS_MATRIX.find(
    (w) =>
      w.nameFr.toLowerCase() === lower ||
      w.nameAr === raw ||
      w.chefLieu.toLowerCase() === lower
  );
}

/**
 * Retourne le coefficient alpha_dz d'une Wilaya pour l'huile, le filtre ou composite
 */
export function getWilayaAlphaDz(
  codeOrName: string | number,
  component: 'oil' | 'filter' | 'composite' = 'composite'
): number {
  const info = getWilayaInfo(codeOrName);
  if (!info) return 0.75; // Tell par défaut
  if (component === 'oil') return info.alphaDzOil;
  if (component === 'filter') return info.alphaDzFilter;
  return info.alphaDz;
}

// ---------------------------------------------------------------------------
// 2. Table Complète WMI Constructeurs (Algérie & Marché International)
// ---------------------------------------------------------------------------
export interface WmiRegistryEntry {
  make: string;
  country: string;
  category: OemAssetCategory;
  protocol: 'SAE_J1939' | 'OBD2_CAN';
  isDomesticDz?: boolean;
}

export const WMI_REGISTRY_MAP: Record<string, WmiRegistryEntry> = {
  // --- Constructeurs Nationaux & Assemblage Local Algérie ---
  DZ1: { make: 'SNVI (Rouïba)', country: 'Algeria', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939', isDomesticDz: true },
  SNV: { make: 'SNVI (Rouïba)', country: 'Algeria', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939', isDomesticDz: true },
  DSN: { make: 'SNVI (Rouïba)', country: 'Algeria', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939', isDomesticDz: true },
  DZ2: { make: 'Mercedes-Benz Algérie (SAFMMA)', country: 'Algeria', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939', isDomesticDz: true },
  SMF: { make: 'Mercedes-Benz Algérie (SAFMMA)', country: 'Algeria', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939', isDomesticDz: true },
  DZ3: { make: 'Cirta / PMA (Constantine)', country: 'Algeria', category: 'AGRICULTURAL_MACHINERY', protocol: 'SAE_J1939', isDomesticDz: true },
  PMA: { make: 'Cirta / PMA (Constantine)', country: 'Algeria', category: 'AGRICULTURAL_MACHINERY', protocol: 'SAE_J1939', isDomesticDz: true },

  // --- Poids Lourds Chinois (Marché BTP & Carrières Algérien) ---
  LZG: { make: 'Shacman (Shaanxi)', country: 'China', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  LZZ: { make: 'Sinotruk Howo', country: 'China', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  LDF: { make: 'Dongfeng Heavy', country: 'China', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  LFD: { make: 'Foton Heavy', country: 'China', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  LJ1: { make: 'JAC Motors', country: 'China', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },

  // --- Poids Lourds Européens ---
  VF6: { make: 'Renault Trucks', country: 'France', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  YS2: { make: 'Scania', country: 'Sweden', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  VLU: { make: 'Scania', country: 'France', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  WDB: { make: 'Mercedes-Benz Trucks', country: 'Germany', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  WMA: { make: 'MAN Truck & Bus', country: 'Germany', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  YV2: { make: 'Volvo Trucks', country: 'Sweden', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  XLR: { make: 'DAF Trucks', country: 'Netherlands', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },
  ZCF: { make: 'Iveco', country: 'Italy', category: 'HEAVY_TRUCK', protocol: 'SAE_J1939' },

  // --- Engins BTP, Mines & Génie Civil ---
  CAT: { make: 'Caterpillar', country: 'USA', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },
  KMT: { make: 'Komatsu', country: 'Japan', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },
  SLP: { make: 'JCB', country: 'UK', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },
  HYU: { make: 'Hyundai Construction', country: 'South Korea', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },
  VCE: { make: 'Volvo Construction', country: 'Sweden', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },
  LGY: { make: 'LiuGong Machinery', country: 'China', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },
  XCM: { make: 'XCMG Heavy Industry', country: 'China', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },
  SDG: { make: 'SDLG Lingong', country: 'China', category: 'CONSTRUCTION_MACHINERY_BTP', protocol: 'SAE_J1939' },

  // --- Matériel Agricole ---
  AGR: { make: 'Massey Ferguson', country: 'USA', category: 'AGRICULTURAL_MACHINERY', protocol: 'SAE_J1939' },
  CLA: { make: 'Claas', country: 'Germany', category: 'AGRICULTURAL_MACHINERY', protocol: 'SAE_J1939' },
  DFA: { make: 'Deutz-Fahr', country: 'Germany', category: 'AGRICULTURAL_MACHINERY', protocol: 'SAE_J1939' },

  // --- Véhicules Utilitaires Légers & Pick-ups (VUL) ---
  WDF: { make: 'Mercedes-Benz Vans (Sprinter/Vito)', country: 'Germany', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  VF1: { make: 'Renault LCV (Master/Kangoo)', country: 'France', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  VF3: { make: 'Peugeot Commercial (Partner/Boxer)', country: 'France', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  VF7: { make: 'Citroën Commercial (Berlingo/Jumper)', country: 'France', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  ZFA: { make: 'Fiat Professional (Ducato/Doblo)', country: 'Italy', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  JTE: { make: 'Toyota (Hilux & Land Cruiser)', country: 'Japan', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  JT1: { make: 'Toyota Commercial', country: 'Japan', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  AHT: { make: 'Toyota South Africa (Hilux)', country: 'South Africa', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  WV1: { make: 'Volkswagen Nutzfahrzeuge (Caddy/Crafter)', country: 'Germany', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  WV2: { make: 'Volkswagen Transporter/Bus', country: 'Germany', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  WF0: { make: 'Ford Transit', country: 'Germany', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  JAL: { make: 'Isuzu Trucks & D-Max', country: 'Japan', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  MP1: { make: 'Isuzu Pick-up D-Max', country: 'Thailand', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  KMH: { make: 'Hyundai Commercial (H100/HD35/HD65/HD72)', country: 'South Korea', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  NMT: { make: 'Hyundai Assan LCV', country: 'Turkey', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  KNA: { make: 'Kia Commercial (K2700/Bongo)', country: 'South Korea', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
  UU1: { make: 'Dacia (Dokker & Duster)', country: 'Romania', category: 'LIGHT_COMMERCIAL', protocol: 'OBD2_CAN' },
};

// ---------------------------------------------------------------------------
// 3. Table ISO 3779 pour le 10e caractère (Année Modèle)
// ---------------------------------------------------------------------------
export const ISO_3779_YEAR_CODES: Record<string, number> = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
  1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009,
};

// ---------------------------------------------------------------------------
// 4. Facteurs de Sévérité par Macro-Zone (Rétro-compatibilité & Defaults)
// ---------------------------------------------------------------------------
export const SEVERE_DUTY_FACTORS: Record<OperatingZone, number> = {
  ZONE_1_TELL_COASTAL: 0.75,
  ZONE_2_HAUTS_PLATEAUX_STEPPE: 0.80,
  ZONE_3_SAHARA_DEEP_SOUTH: 0.58,
  HIGHWAY: 1.0,
  URBAN_DELIVERY: 0.75,
  BTP_QUARRY_SAHARA: 0.58,
};

// ---------------------------------------------------------------------------
// 5. Service Principal LocalOemResolverService
// ---------------------------------------------------------------------------
export class LocalOemResolverService {
  /**
   * Décode un VIN / PIN d'engin 100% hors-ligne (Air-Gapped Ready)
   */
  static decodeVin(
    vin: string,
    zoneOrWilaya: OperatingZone | string | number = 'ZONE_3_SAHARA_DEEP_SOUTH'
  ): DecodedOemAssetProfile {
    const cleanVin = (vin || '').trim().toUpperCase();
    const wmi = cleanVin.substring(0, 3);

    // Résolution WMI
    const wmiEntry = WMI_REGISTRY_MAP[wmi] || {
      make: 'Constructeur Standard / OEM',
      country: 'International',
      category: 'HEAVY_TRUCK' as OemAssetCategory,
      protocol: 'SAE_J1939' as const,
    };

    // Décodage de l'Année (10e caractère ISO 3779)
    const yearChar = cleanVin.length >= 10 ? cleanVin.charAt(9) : 'R';
    const modelYear = ISO_3779_YEAR_CODES[yearChar] || 2024;

    // Résolution de la zone et du facteur de sévérité
    let severeDutyFactor = 0.75;
    let operatingZone: OperatingZone = 'ZONE_1_TELL_COASTAL';

    if (typeof zoneOrWilaya === 'number' || (!isNaN(Number(zoneOrWilaya)) && zoneOrWilaya !== '')) {
      const wilayaInfo = getWilayaInfo(zoneOrWilaya);
      if (wilayaInfo) {
        severeDutyFactor = wilayaInfo.alphaDz;
        operatingZone = wilayaInfo.zone === 'SAHARA_DEEP_SOUTH'
          ? 'ZONE_3_SAHARA_DEEP_SOUTH'
          : wilayaInfo.zone === 'HAUTS_PLATEAUX_STEPPE'
          ? 'ZONE_2_HAUTS_PLATEAUX_STEPPE'
          : 'ZONE_1_TELL_COASTAL';
      }
    } else if (zoneOrWilaya in SEVERE_DUTY_FACTORS) {
      operatingZone = zoneOrWilaya as OperatingZone;
      severeDutyFactor = SEVERE_DUTY_FACTORS[operatingZone];
    } else {
      const wilayaInfo = getWilayaInfo(String(zoneOrWilaya));
      if (wilayaInfo) {
        severeDutyFactor = wilayaInfo.alphaDz;
        operatingZone = wilayaInfo.zone === 'SAHARA_DEEP_SOUTH'
          ? 'ZONE_3_SAHARA_DEEP_SOUTH'
          : wilayaInfo.zone === 'HAUTS_PLATEAUX_STEPPE'
          ? 'ZONE_2_HAUTS_PLATEAUX_STEPPE'
          : 'ZONE_1_TELL_COASTAL';
      }
    }

    // Détection fine du modèle (VDS caractères 4 à 8)
    const vds = cleanVin.substring(3, 8);
    let model = 'Modèle Standard';
    let recommendedTemplateCode = 'OEM_HEAVY_TRUCK_STD';
    let recommendedTemplateName = 'Plan Constructeur Poids Lourds Routier (40 000 km / 800h)';
    let intervals: DecodedOemAssetProfile['recommendedIntervals'] = {
      firstServiceKm: 40000,
      firstServiceHours: 800,
      severeServiceKm: Math.round(40000 * severeDutyFactor),
      severeServiceHours: Math.round(800 * severeDutyFactor),
    };

    // Cas spécifique 1 : SNVI (Rouïba)
    if (wmi === 'DZ1' || wmi === 'SNV' || wmi === 'DSN') {
      if (vds.includes('K66')) {
        model = 'K66 Porteur Polyvalent';
        recommendedTemplateCode = 'OEM_SNVI_K66_STD';
        recommendedTemplateName = 'Plan Constructeur SNVI Rouïba K66 (25 000 km / 500h)';
        intervals = {
          firstServiceKm: 25000,
          firstServiceHours: 500,
          severeServiceKm: Math.round(25000 * severeDutyFactor),
          severeServiceHours: Math.round(500 * severeDutyFactor),
        };
      } else if (vds.includes('K120')) {
        model = 'K120 Benne / Plateau';
        recommendedTemplateCode = 'OEM_SNVI_K120_STD';
        recommendedTemplateName = 'Plan Constructeur SNVI Rouïba K120 (30 000 km / 600h)';
        intervals = {
          firstServiceKm: 30000,
          firstServiceHours: 600,
          severeServiceKm: Math.round(30000 * severeDutyFactor),
          severeServiceHours: Math.round(600 * severeDutyFactor),
        };
      } else if (vds.includes('B400') || vds.includes('TB400')) {
        model = 'Autocar / Autobus B400/TB400';
        recommendedTemplateCode = 'OEM_SNVI_B400_BUS';
        recommendedTemplateName = 'Plan Constructeur SNVI Autocar B400 (35 000 km / 700h)';
        intervals = {
          firstServiceKm: 35000,
          firstServiceHours: 700,
          severeServiceKm: Math.round(35000 * severeDutyFactor),
          severeServiceHours: Math.round(700 * severeDutyFactor),
        };
      } else {
        model = 'C260 / K120 Série Industrielle';
        recommendedTemplateCode = 'OEM_SNVI_HEAVY_TRUCK_STD';
        recommendedTemplateName = 'Plan Constructeur SNVI Rouïba Lourd (30 000 km / 600h)';
        intervals = {
          firstServiceKm: 30000,
          firstServiceHours: 600,
          severeServiceKm: Math.round(30000 * severeDutyFactor),
          severeServiceHours: Math.round(600 * severeDutyFactor),
        };
      }
    }
    // Cas spécifique 2 : Mercedes-Benz Algérie SAFMMA (Rouïba & Tiaret)
    else if (wmi === 'DZ2' || wmi === 'SMF') {
      if (vds.includes('SPR') || vds.includes('906') || vds.includes('907')) {
        model = 'Sprinter Fourgon / Châssis (Tiaret)';
        recommendedTemplateCode = 'OEM_SAFMMA_SPRINTER_STD';
        recommendedTemplateName = 'Plan SAFMMA Tiaret Sprinter VUL (20 000 km / 400h)';
        intervals = {
          firstServiceKm: 20000,
          firstServiceHours: 400,
          severeServiceKm: Math.round(20000 * severeDutyFactor),
          severeServiceHours: Math.round(400 * severeDutyFactor),
        };
      } else if (vds.includes('ZET') || vds.includes('ZETROS')) {
        model = 'Zetros 6x6 / 4x4 Tout-Terrain (Rouïba)';
        recommendedTemplateCode = 'OEM_SAFMMA_ZETROS_SEVERE';
        recommendedTemplateName = 'Plan SAFMMA Rouïba Zetros Tout-Terrain (25 000 km / 500h)';
        intervals = {
          firstServiceKm: 25000,
          firstServiceHours: 500,
          severeServiceKm: Math.round(25000 * severeDutyFactor),
          severeServiceHours: Math.round(500 * severeDutyFactor),
        };
      } else {
        model = 'Actros 3340 / 4140 Benne/Tracteur (Rouïba)';
        recommendedTemplateCode = 'OEM_SAFMMA_MERCEDES_ACTROS';
        recommendedTemplateName = 'Plan SAFMMA Rouïba Actros OM501LA (40 000 km / 800h)';
        intervals = {
          firstServiceKm: 40000,
          firstServiceHours: 800,
          severeServiceKm: Math.round(40000 * severeDutyFactor),
          severeServiceHours: Math.round(800 * severeDutyFactor),
        };
      }
    }
    // Cas spécifique 3 : Cirta / PMA Constantine (Tracteurs agricoles)
    else if (wmi === 'DZ3' || wmi === 'PMA' || wmiEntry.category === 'AGRICULTURAL_MACHINERY') {
      model = wmiEntry.make.includes('Cirta') ? 'Tracteur Cirta C6807 / C4807' : 'Tracteur Agricole Spécifique';
      recommendedTemplateCode = 'OEM_CIRTA_PMA_TRACTOR_STD';
      recommendedTemplateName = 'Plan Constructeur Matériel Agricole (250h / 500h)';
      intervals = {
        firstServiceHours: 250,
        severeServiceHours: Math.round(250 * severeDutyFactor),
      };
    }
    // Cas spécifique 4 : Poids Lourds Chinois (Shacman, Sinotruk Howo, Dongfeng)
    else if (wmi === 'LZG' || wmi === 'LZZ' || wmi === 'LDF' || wmi === 'LFD') {
      model = wmi === 'LZG' ? 'X3000 / F3000 Weichai WP12' : wmi === 'LZZ' ? 'Howo A7 / T7H 8x4' : 'Poids Lourd Chinois';
      recommendedTemplateCode = 'OEM_CHINESE_HEAVY_TRUCK_WP12';
      recommendedTemplateName = 'Plan Constructeur Moteur Weichai WP12 / Sinotruk (30 000 km / 600h)';
      intervals = {
        firstServiceKm: 30000,
        firstServiceHours: 600,
        severeServiceKm: Math.round(30000 * severeDutyFactor),
        severeServiceHours: Math.round(600 * severeDutyFactor),
      };
    }
    // Cas spécifique 5 : Engins BTP & Mines
    else if (wmiEntry.category === 'CONSTRUCTION_MACHINERY_BTP') {
      model = `${wmiEntry.make} Engin de Chantier`;
      recommendedTemplateCode = 'OEM_BTP_CAT_PM1_PM4';
      recommendedTemplateName = `Cycle Constructeur BTP PM1-PM4 (${wmiEntry.make})`;
      intervals = {
        firstServiceHours: 250,
        severeServiceHours: Math.round(250 * severeDutyFactor),
      };
    }
    // Cas spécifique 6 : Utilitaires et Pick-ups (VUL)
    else if (wmiEntry.category === 'LIGHT_COMMERCIAL') {
      model = `${wmiEntry.make} Utilitaire`;
      recommendedTemplateCode = 'OEM_VUL_PICKUP_SEVERE_STD';
      recommendedTemplateName = `Plan Constructeur Utilitaires & Pick-ups (${wmiEntry.make}) (15 000 km / 350h)`;
      intervals = {
        firstServiceKm: 15000,
        firstServiceHours: 350,
        severeServiceKm: Math.round(15000 * severeDutyFactor),
        severeServiceHours: Math.round(350 * severeDutyFactor),
      };
    }

    return {
      vin: cleanVin,
      wmi,
      make: wmiEntry.make,
      model,
      country: wmiEntry.country,
      modelYear,
      assetCategory: wmiEntry.category,
      defaultProtocol: wmiEntry.protocol,
      operatingZone,
      severeDutyFactor,
      recommendedTemplateCode,
      recommendedTemplateName,
      recommendedIntervals: intervals,
    };
  }
}

// ---------------------------------------------------------------------------
// 6. Estimateur Cinématique Mode 0 & Réconciliation Naftal / DVIR
// ---------------------------------------------------------------------------
export interface ModeZeroEstimateInput {
  fuelVolumeLiters: number;
  referenceConsumptionLitersPer100Km: number;
  wilayaCode?: string | number;
  operatingZone?: OperatingZone;
  loadFactor?: number; // gamma_charge in [1.0, 1.35] (1.0 = vide, 1.35 = pleine charge)
  customAlphaDz?: number;
}

export interface ModeZeroFuelDistanceEstimate {
  estimatedDistanceKm: number;
  fuelVolumeLiters: number;
  referenceConsumptionLitersPer100Km: number;
  alphaDz: number;
  loadFactor: number;
  wilayaCode?: string;
  wilayaNameFr?: string;
  operatingZone: string;
  formulaProof: string; // Preuve explicable (XAI)
  calculatedAt: string;
}

export interface OdometerReconciliationInput {
  lastKnownOdometerKm: number;
  virtualOdometerKm: number;
  physicalDvirOdometerKm: number;
  dvirTimestamp?: string | Date;
  maxAcceptableDriftPercent?: number; // Par défaut 10 %
}

export interface OdometerReconciliationResult {
  lastKnownOdometerKm: number;
  virtualOdometerKm: number;
  physicalDvirOdometerKm: number;
  driftKm: number; // physique - virtuel
  driftPercentage: number;
  adjustedOdometerKm: number;
  status: 'ALIGNED' | 'ACCEPTABLE_DRIFT' | 'INVESTIGATION_REQUIRED' | 'NEGATIVE_DRIFT_ANOMALY';
  proof: string;
  reconciledAt: string;
}

export class ModeZeroKinematicEstimator {
  /**
   * Formule Maîtresse d'estimation kilométrique par réconciliation Naftal :
   * Delta D_carburant = (V_plein * 100) / (C_ref * (2 - alpha_dz)) * (1 / gamma_charge)
   */
  static estimateFuelDistanceKm(input: ModeZeroEstimateInput): ModeZeroFuelDistanceEstimate {
    const { fuelVolumeLiters, referenceConsumptionLitersPer100Km } = input;

    if (fuelVolumeLiters <= 0 || referenceConsumptionLitersPer100Km <= 0) {
      throw new Error(
        `Volume de carburant (${fuelVolumeLiters} L) et consommation de référence (${referenceConsumptionLitersPer100Km} L/100km) doivent être strictement positifs.`
      );
    }

    // Résolution alpha_dz
    let alphaDz = 0.75;
    let wilayaCode: string | undefined;
    let wilayaNameFr: string | undefined;
    let operatingZone = 'ZONE_1_TELL_COASTAL';

    if (input.customAlphaDz !== undefined && input.customAlphaDz > 0 && input.customAlphaDz <= 1.0) {
      alphaDz = input.customAlphaDz;
      operatingZone = 'CUSTOM_ALPHA';
    } else if (input.wilayaCode !== undefined) {
      const wilaya = getWilayaInfo(input.wilayaCode);
      if (wilaya) {
        alphaDz = wilaya.alphaDz;
        wilayaCode = wilaya.code;
        wilayaNameFr = wilaya.nameFr;
        operatingZone = wilaya.zone;
      }
    } else if (input.operatingZone) {
      operatingZone = input.operatingZone;
      alphaDz = SEVERE_DUTY_FACTORS[input.operatingZone] || 0.75;
    }

    // Facteur de charge gamma_charge (borné entre 0.85 et 1.45, nominal [1.0, 1.35])
    const rawLoad = input.loadFactor ?? 1.0;
    const loadFactor = Math.min(1.45, Math.max(0.85, rawLoad));

    // Formule corrigée v3.0
    // Delta D = (V * 100) / [C_ref * (2 - alpha_dz) * gamma_charge]
    const effectiveConsumption = referenceConsumptionLitersPer100Km * (2 - alphaDz) * loadFactor;
    const rawDistanceKm = (fuelVolumeLiters * 100) / effectiveConsumption;
    const estimatedDistanceKm = Math.round(rawDistanceKm * 100) / 100;

    const proof =
      `ΔD_carburant = (${fuelVolumeLiters} L × 100) / [${referenceConsumptionLitersPer100Km} L/100km × (2 - ${alphaDz.toFixed(2)}) × ${loadFactor.toFixed(2)}] ` +
      `= ${estimatedDistanceKm.toFixed(2)} km ` +
      `(Zone: ${wilayaNameFr ? `${wilayaNameFr} (${wilayaCode})` : operatingZone}, Conso réelle ajustée: ${(effectiveConsumption).toFixed(2)} L/100km)`;

    return {
      estimatedDistanceKm,
      fuelVolumeLiters,
      referenceConsumptionLitersPer100Km,
      alphaDz: Number(alphaDz.toFixed(3)),
      loadFactor: Number(loadFactor.toFixed(3)),
      wilayaCode,
      wilayaNameFr,
      operatingZone,
      formulaProof: proof,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Recalage bayésien / déterministe entre l'odomètre virtuel et le relevé physique DVIR
   */
  static reconcileOdometerWithDvir(input: OdometerReconciliationInput): OdometerReconciliationResult {
    const {
      lastKnownOdometerKm,
      virtualOdometerKm,
      physicalDvirOdometerKm,
      maxAcceptableDriftPercent = 10.0,
    } = input;

    // Dérive absolue en km
    const driftKm = Math.round((physicalDvirOdometerKm - virtualOdometerKm) * 100) / 100;
    const deltaTripPhysical = physicalDvirOdometerKm - lastKnownOdometerKm;

    // Détection de fraude ou recul compteur
    if (physicalDvirOdometerKm < lastKnownOdometerKm) {
      return {
        lastKnownOdometerKm,
        virtualOdometerKm,
        physicalDvirOdometerKm,
        driftKm,
        driftPercentage: -100,
        adjustedOdometerKm: virtualOdometerKm, // Rejet du relevé frauduleux
        status: 'NEGATIVE_DRIFT_ANOMALY',
        proof: `ALERTE FRAUDE : Odomètre DVIR physique (${physicalDvirOdometerKm} km) inférieur au dernier relevé certifié (${lastKnownOdometerKm} km). Recul de ${Math.abs(driftKm)} km détecté.`,
        reconciledAt: new Date().toISOString(),
      };
    }

    // Calcul du pourcentage de dérive par rapport au trajet parcouru
    let driftPercentage = 0;
    if (deltaTripPhysical > 0) {
      driftPercentage = Math.round((Math.abs(driftKm) / deltaTripPhysical) * 10000) / 100;
    }

    let status: OdometerReconciliationResult['status'] = 'ALIGNED';
    let proof = `Odomètre physique (${physicalDvirOdometerKm} km) aligné avec l odomètre virtuel (${virtualOdometerKm} km). Écart négligeable (${driftKm} km).`;

    if (Math.abs(driftKm) < 5 || driftPercentage <= 2.5) {
      status = 'ALIGNED';
    } else if (driftPercentage <= maxAcceptableDriftPercent) {
      status = 'ACCEPTABLE_DRIFT';
      proof = `Dérive tolérable de ${driftPercentage}% (${driftKm} km) entre odomètre physique DVIR (${physicalDvirOdometerKm} km) et virtuel (${virtualOdometerKm} km). Recalage appliqué.`;
    } else {
      status = 'INVESTIGATION_REQUIRED';
      proof = `Divergence critique de ${driftPercentage}% (${driftKm} km) > seuil ${maxAcceptableDriftPercent}%. Vérification terrain requise pour vol carburant ou mission non déclarée.`;
    }

    return {
      lastKnownOdometerKm,
      virtualOdometerKm,
      physicalDvirOdometerKm,
      driftKm,
      driftPercentage,
      adjustedOdometerKm: physicalDvirOdometerKm,
      status,
      proof,
      reconciledAt: new Date().toISOString(),
    };
  }
}
