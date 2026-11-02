export type DigitalTwinOrganType =
  | 'ENGINE_OIL'
  | 'BATTERY_CRANKING'
  | 'BRAKE_PADS'
  | 'COOLING_SYSTEM'
  | 'DPF_FILTER'
  | 'TRANSMISSION_DRIVETRAIN';

export interface DigitalTwinOrganStatus {
  organ: DigitalTwinOrganType;
  name: string;
  icon: string;
  healthPercent: number; // 0 - 100
  remainingUsefulLifeValue: number;
  remainingUsefulLifeUnit: 'KM' | 'DAYS' | 'STARTS' | 'PERCENT';
  status: 'HEALTHY' | 'PRE_CRITICAL' | 'CRITICAL';
  physicsAlgorithm: string;
  observedMetrics: {
    label: string;
    value: string | number;
    threshold: string | number;
  }[];
  explanation: string;
}

export interface AlgeriaWilayaProfile {
  code: number;
  name: string;
  nameAr: string;
  zone: 'ZONE_1_TELL' | 'ZONE_2_STEPPES' | 'ZONE_3_SAHARA';
  zoneLabel: string;
  ambientTempSummerC: number;
  ambientTempWinterC: number;
  oilArrheniusFactor: number;
  dustSilicaFactor: number;
  brakeGradientFactor: number;
  batteryEvapFactor: number;
  description: string;
}

export const ALGERIA_58_WILAYAS_PROFILES: AlgeriaWilayaProfile[] = [
  { code: 1, name: 'Adrar', nameAr: 'أدرار', zone: 'ZONE_3_SAHARA', zoneLabel: 'Sahara Profond', ambientTempSummerC: 48, ambientTempWinterC: 12, oilArrheniusFactor: 1.65, dustSilicaFactor: 2.2, brakeGradientFactor: 1.0, batteryEvapFactor: 1.8, description: 'Chaleur extrême (>48°C), ensablement fin et pistes isolées' },
  { code: 2, name: 'Chlef', nameAr: 'الشلف', zone: 'ZONE_1_TELL', zoneLabel: 'Tell Intérieur', ambientTempSummerC: 38, ambientTempWinterC: 8, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.1, brakeGradientFactor: 1.1, batteryEvapFactor: 1.2, description: 'Cuve thermique estivale, corridor autoroutier A1' },
  { code: 3, name: 'Laghouat', nameAr: 'الأغواط', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux Sud', ambientTempSummerC: 40, ambientTempWinterC: 4, oilArrheniusFactor: 1.35, dustSilicaFactor: 1.4, brakeGradientFactor: 1.15, batteryEvapFactor: 1.3, description: 'Transition désertique RN1, forte amplitude thermique' },
  { code: 4, name: 'Oum El Bouaghi', nameAr: 'أم البواقي', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux Est', ambientTempSummerC: 36, ambientTempWinterC: 1, oilArrheniusFactor: 1.2, dustSilicaFactor: 1.2, brakeGradientFactor: 1.2, batteryEvapFactor: 1.1, description: 'Hiver rigoureux, gelées, poussières calcaires' },
  { code: 5, name: 'Batna', nameAr: 'باتنة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Massif des Aurès', ambientTempSummerC: 37, ambientTempWinterC: 0, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.2, brakeGradientFactor: 1.45, batteryEvapFactor: 1.15, description: 'Relief montagneux prononcé, fortes sollicitations de freinage' },
  { code: 6, name: 'Béjaïa', nameAr: 'بجاية', zone: 'ZONE_1_TELL', zoneLabel: 'Littoral Babors', ambientTempSummerC: 32, ambientTempWinterC: 10, oilArrheniusFactor: 1.1, dustSilicaFactor: 0.9, brakeGradientFactor: 1.35, batteryEvapFactor: 1.05, description: 'Humidité saline côtière, trafic portuaire lourd et routes sinueuses' },
  { code: 7, name: 'Biskra', nameAr: 'بسكرة', zone: 'ZONE_3_SAHARA', zoneLabel: 'Porte du Sud', ambientTempSummerC: 45, ambientTempWinterC: 11, oilArrheniusFactor: 1.55, dustSilicaFactor: 1.8, brakeGradientFactor: 1.1, batteryEvapFactor: 1.6, description: 'Canicules estivales intenses, carrefour agro-logistique phœnicicole' },
  { code: 8, name: 'Béchar', nameAr: 'بشار', zone: 'ZONE_3_SAHARA', zoneLabel: 'Sahara Occidental', ambientTempSummerC: 46, ambientTempWinterC: 9, oilArrheniusFactor: 1.6, dustSilicaFactor: 2.0, brakeGradientFactor: 1.1, batteryEvapFactor: 1.7, description: 'Climat aride sévère, carrières de calcaire et vents de sable' },
  { code: 9, name: 'Blida', nameAr: 'البليدة', zone: 'ZONE_1_TELL', zoneLabel: 'Tell / Atlas Mitidja', ambientTempSummerC: 36, ambientTempWinterC: 7, oilArrheniusFactor: 1.2, dustSilicaFactor: 1.0, brakeGradientFactor: 1.4, batteryEvapFactor: 1.15, description: 'Gorges de la Chiffa (déclivité 8%), trafic dense axe Nord-Sud' },
  { code: 10, name: 'Bouira', nameAr: 'البويرة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Atlas Tellien', ambientTempSummerC: 37, ambientTempWinterC: 2, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.1, brakeGradientFactor: 1.4, batteryEvapFactor: 1.15, description: 'Cols montagneux de Ben Haroun, fortes montées et verglas d’hiver' },
  { code: 11, name: 'Tamanrasset', nameAr: 'تمنراست', zone: 'ZONE_3_SAHARA', zoneLabel: 'Grand Sud Hoggar', ambientTempSummerC: 44, ambientTempWinterC: 8, oilArrheniusFactor: 1.75, dustSilicaFactor: 2.5, brakeGradientFactor: 1.3, batteryEvapFactor: 1.9, description: 'Pistes rocheuses abrasives, zones blanches radio > 300 km' },
  { code: 12, name: 'Tébessa', nameAr: 'تبسة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Frontière Minière Est', ambientTempSummerC: 38, ambientTempWinterC: 1, oilArrheniusFactor: 1.3, dustSilicaFactor: 1.6, brakeGradientFactor: 1.25, batteryEvapFactor: 1.2, description: 'Poussières minières abrasives de phosphate/fer, hivers rigoureux' },
  { code: 13, name: 'Tlemcen', nameAr: 'تلمسان', zone: 'ZONE_1_TELL', zoneLabel: 'Tell Monts de Tlemcen', ambientTempSummerC: 35, ambientTempWinterC: 6, oilArrheniusFactor: 1.15, dustSilicaFactor: 1.0, brakeGradientFactor: 1.3, batteryEvapFactor: 1.1, description: 'Relief accidenté, trafic frontalier et humidité modérée' },
  { code: 14, name: 'Tiaret', nameAr: 'تيارت', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux Centre', ambientTempSummerC: 38, ambientTempWinterC: 2, oilArrheniusFactor: 1.3, dustSilicaFactor: 1.3, brakeGradientFactor: 1.2, batteryEvapFactor: 1.2, description: 'Pôle industriel SAFMMA, rigueur hivernale et poussières steppiques' },
  { code: 15, name: 'Tizi Ouzou', nameAr: 'تيزي وزو', zone: 'ZONE_1_TELL', zoneLabel: 'Massif du Djurdjura', ambientTempSummerC: 35, ambientTempWinterC: 5, oilArrheniusFactor: 1.15, dustSilicaFactor: 0.9, brakeGradientFactor: 1.5, batteryEvapFactor: 1.1, description: 'Routes très sinueuses, forte sollicitation des freins et de la transmission' },
  { code: 16, name: 'Alger', nameAr: 'الجزائر', zone: 'ZONE_1_TELL', zoneLabel: 'Capitale & Littoral', ambientTempSummerC: 33, ambientTempWinterC: 10, oilArrheniusFactor: 1.3, dustSilicaFactor: 1.1, brakeGradientFactor: 1.2, batteryEvapFactor: 1.1, description: 'Ralenti urbain excessif (>45% du temps moteur) et arrêts fréquents' },
  { code: 17, name: 'Djelfa', nameAr: 'الجلفة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux RN1', ambientTempSummerC: 39, ambientTempWinterC: 1, oilArrheniusFactor: 1.35, dustSilicaFactor: 1.5, brakeGradientFactor: 1.2, batteryEvapFactor: 1.25, description: 'Pôle carrefour transsaharien RN1, amplitudes thermiques de 40°C' },
  { code: 18, name: 'Jijel', nameAr: 'جيجل', zone: 'ZONE_1_TELL', zoneLabel: 'Littoral Corniche', ambientTempSummerC: 31, ambientTempWinterC: 10, oilArrheniusFactor: 1.1, dustSilicaFactor: 0.8, brakeGradientFactor: 1.35, batteryEvapFactor: 1.05, description: 'Corrosion saline marine, port de Djen Djen et routes de montagne' },
  { code: 19, name: 'Sétif', nameAr: 'سطيف', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux Pôle Est', ambientTempSummerC: 37, ambientTempWinterC: 0, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.2, brakeGradientFactor: 1.25, batteryEvapFactor: 1.15, description: 'Carrefour logistique national, verglas hivernal et climat continental' },
  { code: 20, name: 'Saïda', nameAr: 'سعيدة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux Ouest', ambientTempSummerC: 38, ambientTempWinterC: 3, oilArrheniusFactor: 1.3, dustSilicaFactor: 1.3, brakeGradientFactor: 1.2, batteryEvapFactor: 1.2, description: 'Relief semi-aride, pistes de carrières et transport lourd' },
  { code: 21, name: 'Skikda', nameAr: 'سكيكدة', zone: 'ZONE_1_TELL', zoneLabel: 'Pétrochimie & Port', ambientTempSummerC: 33, ambientTempWinterC: 10, oilArrheniusFactor: 1.15, dustSilicaFactor: 1.0, brakeGradientFactor: 1.2, batteryEvapFactor: 1.1, description: 'Transport citernes HAZMAT continu, vapeurs chimiques et humidité' },
  { code: 22, name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', zone: 'ZONE_1_TELL', zoneLabel: 'Plaine Tellienne', ambientTempSummerC: 37, ambientTempWinterC: 6, oilArrheniusFactor: 1.2, dustSilicaFactor: 1.1, brakeGradientFactor: 1.1, batteryEvapFactor: 1.15, description: 'Grand bassin agro-industriel, étés chauds et poussière végétale' },
  { code: 23, name: 'Annaba', nameAr: 'عنابة', zone: 'ZONE_1_TELL', zoneLabel: 'Pôle Sidérurgique', ambientTempSummerC: 33, ambientTempWinterC: 10, oilArrheniusFactor: 1.2, dustSilicaFactor: 1.3, brakeGradientFactor: 1.15, batteryEvapFactor: 1.1, description: 'Poussières d’acier El Hadjar, port minéralier et humidité saline' },
  { code: 24, name: 'Guelma', nameAr: 'قالمة', zone: 'ZONE_1_TELL', zoneLabel: 'Tell Intérieur Est', ambientTempSummerC: 38, ambientTempWinterC: 7, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.1, brakeGradientFactor: 1.2, batteryEvapFactor: 1.2, description: 'Bassin thermique estival fermé, agro-transport lourd' },
  { code: 25, name: 'Constantine', nameAr: 'قسنطينة', zone: 'ZONE_1_TELL', zoneLabel: 'Métropole des Ponts', ambientTempSummerC: 37, ambientTempWinterC: 4, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.1, brakeGradientFactor: 1.45, batteryEvapFactor: 1.15, description: 'Pentes urbaines escarpées, freinage permanent et fort trafic' },
  { code: 26, name: 'Médéa', nameAr: 'المدية', zone: 'ZONE_2_STEPPES', zoneLabel: 'Atlas Tellien Sud', ambientTempSummerC: 37, ambientTempWinterC: 2, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.1, brakeGradientFactor: 1.5, batteryEvapFactor: 1.15, description: 'Descente du col de Chréa, ralentisseur hydraulique impératif' },
  { code: 27, name: 'Mostaganem', nameAr: 'مستغانم', zone: 'ZONE_1_TELL', zoneLabel: 'Littoral Ouest', ambientTempSummerC: 32, ambientTempWinterC: 9, oilArrheniusFactor: 1.1, dustSilicaFactor: 0.9, brakeGradientFactor: 1.1, batteryEvapFactor: 1.05, description: 'Corridor logistique A1, transport maraîcher et embruns marins' },
  { code: 28, name: 'M\'Sila', nameAr: 'المسيلة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Bassin du Hodna', ambientTempSummerC: 41, ambientTempWinterC: 3, oilArrheniusFactor: 1.4, dustSilicaFactor: 1.7, brakeGradientFactor: 1.15, batteryEvapFactor: 1.35, description: 'Vents de poussière (Sirocco), chaleur estivale et steppe sèche' },
  { code: 29, name: 'Mascara', nameAr: 'معسكر', zone: 'ZONE_1_TELL', zoneLabel: 'Béni Chougrane', ambientTempSummerC: 37, ambientTempWinterC: 6, oilArrheniusFactor: 1.2, dustSilicaFactor: 1.1, brakeGradientFactor: 1.2, batteryEvapFactor: 1.15, description: 'Relief vallonné, transport agricole et fortes chaleurs estivales' },
  { code: 30, name: 'Ouargla', nameAr: 'ورقلة', zone: 'ZONE_3_SAHARA', zoneLabel: 'Pôle Pétrolier HMD', ambientTempSummerC: 48, ambientTempWinterC: 10, oilArrheniusFactor: 1.7, dustSilicaFactor: 2.3, brakeGradientFactor: 1.05, batteryEvapFactor: 1.85, description: 'Bassin pétrolier Hassi Messaoud, température sol >65°C, convois hors-gabarit' },
  { code: 31, name: 'Oran', nameAr: 'وهران', zone: 'ZONE_1_TELL', zoneLabel: 'Métropole Économique Ouest', ambientTempSummerC: 33, ambientTempWinterC: 10, oilArrheniusFactor: 1.2, dustSilicaFactor: 1.0, brakeGradientFactor: 1.15, batteryEvapFactor: 1.1, description: 'Trafic portuaire lourd, raffinerie Arzew/Bethioua et autoroute A1' },
  { code: 32, name: 'El Bayadh', nameAr: 'البيض', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux Sud-Ouest', ambientTempSummerC: 39, ambientTempWinterC: -1, oilArrheniusFactor: 1.35, dustSilicaFactor: 1.5, brakeGradientFactor: 1.2, batteryEvapFactor: 1.25, description: 'Altitude > 1000m, hivers glacials avec gel prolongé, étés arides' },
  { code: 33, name: 'Illizi', nameAr: 'إيليزي', zone: 'ZONE_3_SAHARA', zoneLabel: 'Grand Sud In Amenas', ambientTempSummerC: 47, ambientTempWinterC: 11, oilArrheniusFactor: 1.7, dustSilicaFactor: 2.4, brakeGradientFactor: 1.2, batteryEvapFactor: 1.85, description: 'Bassin gazier d’In Amenas, isolement extrême, pistes corrosives' },
  { code: 34, name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج', zone: 'ZONE_2_STEPPES', zoneLabel: 'Portes de Fer', ambientTempSummerC: 37, ambientTempWinterC: 1, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.2, brakeGradientFactor: 1.35, batteryEvapFactor: 1.15, description: 'Passage montagneux des Portes de Fer, pôle logistique électroménager' },
  { code: 35, name: 'Boumerdès', nameAr: 'بومرداس', zone: 'ZONE_1_TELL', zoneLabel: 'Littoral Centre', ambientTempSummerC: 32, ambientTempWinterC: 10, oilArrheniusFactor: 1.15, dustSilicaFactor: 1.0, brakeGradientFactor: 1.2, batteryEvapFactor: 1.1, description: 'Carrières de granulats, embruns salins et trafic banlieue Est' },
  { code: 36, name: 'El Tarf', nameAr: 'الطارف', zone: 'ZONE_1_TELL', zoneLabel: 'Littoral Frontière Est', ambientTempSummerC: 32, ambientTempWinterC: 10, oilArrheniusFactor: 1.1, dustSilicaFactor: 0.9, brakeGradientFactor: 1.15, batteryEvapFactor: 1.05, description: 'Humidité très élevée (>85%), zones forestières et trafic frontalier' },
  { code: 37, name: 'Tindouf', nameAr: 'تندوف', zone: 'ZONE_3_SAHARA', zoneLabel: 'Gara Djebilet Sud-Ouest', ambientTempSummerC: 48, ambientTempWinterC: 9, oilArrheniusFactor: 1.75, dustSilicaFactor: 2.6, brakeGradientFactor: 1.1, batteryEvapFactor: 1.9, description: 'Projet minier stratégique Gara Djebilet, pistes ultra-abrasives' },
  { code: 38, name: 'Tissemsilt', nameAr: 'تيسمسيلت', zone: 'ZONE_2_STEPPES', zoneLabel: 'Massif de l\'Ouarsenis', ambientTempSummerC: 38, ambientTempWinterC: 3, oilArrheniusFactor: 1.3, dustSilicaFactor: 1.2, brakeGradientFactor: 1.35, batteryEvapFactor: 1.2, description: 'Routes secondaires sinueuses, hivers froids et relief marqué' },
  { code: 39, name: 'El Oued', nameAr: 'الوادي', zone: 'ZONE_3_SAHARA', zoneLabel: 'Grand Erg Oriental', ambientTempSummerC: 47, ambientTempWinterC: 10, oilArrheniusFactor: 1.65, dustSilicaFactor: 2.4, brakeGradientFactor: 1.05, batteryEvapFactor: 1.8, description: 'Sables mouvants, agriculture sous serres géantes, chaleur torride' },
  { code: 40, name: 'Khenchela', nameAr: 'خنشلة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Aurès Forêts', ambientTempSummerC: 36, ambientTempWinterC: 0, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.2, brakeGradientFactor: 1.4, batteryEvapFactor: 1.15, description: 'Massif forestier escarpé, neige hivernale et fortes pentes' },
  { code: 41, name: 'Souk Ahras', nameAr: 'سوق أهراس', zone: 'ZONE_2_STEPPES', zoneLabel: 'Monts de la Medjerda', ambientTempSummerC: 37, ambientTempWinterC: 2, oilArrheniusFactor: 1.25, dustSilicaFactor: 1.1, brakeGradientFactor: 1.35, batteryEvapFactor: 1.15, description: 'Relief accidenté, hivers rudes et trafic agricole lourd' },
  { code: 42, name: 'Tipaza', nameAr: 'تيبازة', zone: 'ZONE_1_TELL', zoneLabel: 'Littoral Ouest Alger', ambientTempSummerC: 32, ambientTempWinterC: 10, oilArrheniusFactor: 1.1, dustSilicaFactor: 0.9, brakeGradientFactor: 1.2, batteryEvapFactor: 1.05, description: 'Port de Cherchell, humidité saline et relief côtier' },
  { code: 43, name: 'Mila', nameAr: 'ميلة', zone: 'ZONE_1_TELL', zoneLabel: 'Bassin de Beni Haroun', ambientTempSummerC: 37, ambientTempWinterC: 4, oilArrheniusFactor: 1.2, dustSilicaFactor: 1.0, brakeGradientFactor: 1.3, batteryEvapFactor: 1.15, description: 'Relief argileux instable, traversées de barrages et sinuosités' },
  { code: 44, name: 'Aïn Defla', nameAr: 'عين الدفلى', zone: 'ZONE_1_TELL', zoneLabel: 'Vallée du Chélif', ambientTempSummerC: 40, ambientTempWinterC: 6, oilArrheniusFactor: 1.3, dustSilicaFactor: 1.2, brakeGradientFactor: 1.2, batteryEvapFactor: 1.25, description: 'Foyer thermique estival (>42°C), axe A1 et fort tonnage agricole' },
  { code: 45, name: 'Naâma', nameAr: 'النعامة', zone: 'ZONE_2_STEPPES', zoneLabel: 'Hauts Plateaux Sud', ambientTempSummerC: 39, ambientTempWinterC: 0, oilArrheniusFactor: 1.35, dustSilicaFactor: 1.5, brakeGradientFactor: 1.2, batteryEvapFactor: 1.25, description: 'Axe logistique ferroviaire et routier Sud, gelée et steppe sableuse' },
  { code: 46, name: 'Aïn Témouchent', nameAr: 'عين تموشنت', zone: 'ZONE_1_TELL', zoneLabel: 'Littoral Ouest Tell', ambientTempSummerC: 32, ambientTempWinterC: 9, oilArrheniusFactor: 1.1, dustSilicaFactor: 0.9, brakeGradientFactor: 1.1, batteryEvapFactor: 1.05, description: 'Trafic agricole intensif, air marin et températures tempérées' },
  { code: 47, name: 'Ghardaïa', nameAr: 'غرداية', zone: 'ZONE_3_SAHARA', zoneLabel: 'Vallée du M\'Zab', ambientTempSummerC: 46, ambientTempWinterC: 9, oilArrheniusFactor: 1.6, dustSilicaFactor: 2.0, brakeGradientFactor: 1.15, batteryEvapFactor: 1.75, description: 'Carrefour national Nord-Sud, canicules estivales et plateaux rocheux' },
  { code: 48, name: 'Relizane', nameAr: 'غليزان', zone: 'ZONE_1_TELL', zoneLabel: 'Plaine de la Mina', ambientTempSummerC: 42, ambientTempWinterC: 7, oilArrheniusFactor: 1.35, dustSilicaFactor: 1.3, brakeGradientFactor: 1.1, batteryEvapFactor: 1.3, description: 'Températures parmi les plus chaudes du Nord (>45°C), corridor A1' },
  { code: 49, name: 'Timimoun', nameAr: 'تيميمون', zone: 'ZONE_3_SAHARA', zoneLabel: 'Oasis du Gourara', ambientTempSummerC: 48, ambientTempWinterC: 11, oilArrheniusFactor: 1.7, dustSilicaFactor: 2.5, brakeGradientFactor: 1.05, batteryEvapFactor: 1.85, description: 'Dunes de sable rouge, pistes isolées, températures extrêmes' },
  { code: 50, name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', zone: 'ZONE_3_SAHARA', zoneLabel: 'Frontière Mali / Sahel', ambientTempSummerC: 49, ambientTempWinterC: 14, oilArrheniusFactor: 1.85, dustSilicaFactor: 2.8, brakeGradientFactor: 1.1, batteryEvapFactor: 2.0, description: 'Piste transsaharienne extrême, zéro couverture réseau sur 400 km' },
  { code: 51, name: 'Ouled Djellal', nameAr: 'أولاد جلال', zone: 'ZONE_3_SAHARA', zoneLabel: 'Zibans Ouest', ambientTempSummerC: 44, ambientTempWinterC: 10, oilArrheniusFactor: 1.5, dustSilicaFactor: 1.7, brakeGradientFactor: 1.1, batteryEvapFactor: 1.55, description: 'Chaleur aride, carrefour d\'élevage et transport phœnicicole' },
  { code: 52, name: 'Béni Abbès', nameAr: 'بني عباس', zone: 'ZONE_3_SAHARA', zoneLabel: 'Grand Erg Occidental', ambientTempSummerC: 47, ambientTempWinterC: 10, oilArrheniusFactor: 1.7, dustSilicaFactor: 2.4, brakeGradientFactor: 1.1, batteryEvapFactor: 1.8, description: 'Désert rocheux et dunaire sévère, isolement logistique' },
  { code: 53, name: 'In Salah', nameAr: 'عين صالح', zone: 'ZONE_3_SAHARA', zoneLabel: 'Bassin Gazier Tidikelt', ambientTempSummerC: 49, ambientTempWinterC: 12, oilArrheniusFactor: 1.85, dustSilicaFactor: 2.6, brakeGradientFactor: 1.05, batteryEvapFactor: 1.95, description: 'Point le plus torride d’Algérie (>50°C), installations gazières critiques' },
  { code: 54, name: 'In Guezzam', nameAr: 'عين قزام', zone: 'ZONE_3_SAHARA', zoneLabel: 'Frontière Niger / Sahel', ambientTempSummerC: 47, ambientTempWinterC: 15, oilArrheniusFactor: 1.8, dustSilicaFactor: 2.7, brakeGradientFactor: 1.1, batteryEvapFactor: 1.9, description: 'Convois d’exportation transsahariens, chaleur saharienne permanente' },
  { code: 55, name: 'Touggourt', nameAr: 'تقرت', zone: 'ZONE_3_SAHARA', zoneLabel: 'Oued Righ Forages', ambientTempSummerC: 46, ambientTempWinterC: 9, oilArrheniusFactor: 1.6, dustSilicaFactor: 2.1, brakeGradientFactor: 1.05, batteryEvapFactor: 1.7, description: 'Forages pétroliers, routes secondaires ensablées et chaleur vive' },
  { code: 56, name: 'Djanet', nameAr: 'جانت', zone: 'ZONE_3_SAHARA', zoneLabel: 'Tassili n\'Ajjer', ambientTempSummerC: 44, ambientTempWinterC: 8, oilArrheniusFactor: 1.65, dustSilicaFactor: 2.3, brakeGradientFactor: 1.3, batteryEvapFactor: 1.75, description: 'Relief volcanique accidenté, canyons désertiques et isolement' },
  { code: 57, name: 'El M\'Ghair', nameAr: 'المغير', zone: 'ZONE_3_SAHARA', zoneLabel: 'Chott Melrhir', ambientTempSummerC: 45, ambientTempWinterC: 10, oilArrheniusFactor: 1.55, dustSilicaFactor: 1.9, brakeGradientFactor: 1.05, batteryEvapFactor: 1.65, description: 'Dépression saline corrosive, poussières de sel abrasives' },
  { code: 58, name: 'El Meniaa', nameAr: 'المنيعة', zone: 'ZONE_3_SAHARA', zoneLabel: 'Oasis Goléa', ambientTempSummerC: 46, ambientTempWinterC: 9, oilArrheniusFactor: 1.6, dustSilicaFactor: 2.1, brakeGradientFactor: 1.05, batteryEvapFactor: 1.7, description: 'Nappe albienne, pivot agro-industriel saharien, chaleur sèche intense' },
];

export interface DigitalTwinSimulationParams {
  wilayaCode?: number;
  climateSeverityMultiplier: number; // 1.0 (Alger) à 1.85 (In Salah / Grand Sud)
  driverAggressivenessMultiplier: number; // 0.8 (Éco) à 1.6 (Sportif)
  simulatedDailyKm?: number;
  ambientTempOverrideC?: number;
  isDesertTransitScenario?: boolean;
  fuelUnitPriceDzd?: number;
}

export interface DigitalTwinFinancialArbitrage {
  preventiveInterventionCostDzd: number;
  unplannedBreakdownRiskDzd: number;
  desertTowingCostDzd: number;
  dailyImmobilizationLossDzd: number;
  netBenefitDzd: number;
  roiRatio: number;
  recommendedAction: 'MAINTENANCE_IMMÉDIATE' | 'SURVEILLANCE_APPROFONDIE' | 'OPÉRATIONNEL_NOMINAL';
  actionDeadlineDays: number;
}

export interface DigitalTwinAsset {
  assetId: string;
  assetName: string;
  assetCode: string;
  category: string;
  brand: string;
  model: string;
  year: number;
  currentOdometerKm: number;
  currentVhi: number; // Score global 0 - 100
  wilayaLocation: string;
  wilayaCode: number;
  driverAggressivenessScore: number;
  climateSeverityFactor: number;
  organs: DigitalTwinOrganStatus[];
  financialArbitrage: DigitalTwinFinancialArbitrage;
  projectionTrajectory: {
    day0Vhi: number;
    day30VhiWithoutAction: number;
    day60VhiWithoutAction: number;
    day90VhiWithoutAction: number;
    day30VhiWithAction: number;
  };
  substitutionAsset?: {
    assetId: string;
    assetName: string;
    assetCode: string;
    vhiScore: number;
    locationWilaya: string;
    reason: string;
  };
  partsReservation?: {
    partNumber: string;
    partName: string;
    inStock: boolean;
    warehouseStockQty: number;
    estimatedCostDzd: number;
    oemHomologation: string;
  };
}
