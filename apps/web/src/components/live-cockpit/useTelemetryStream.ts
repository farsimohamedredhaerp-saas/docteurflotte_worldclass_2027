'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AuthClient } from '../../lib/api-auth';
import { AssetClient } from '../../lib/api-assets';
import { TelematicsClient } from '../../lib/api-telematics';
import { FleetIntelligenceClient } from '../../lib/api-fleet-intelligence';
import { FleetLiveAsset, DVIRInspectionReport } from '@docteurflotte/contracts';
import {
  VehicleTelemetryState,
  VehicleCategory,
  FleetAggregateStats,
  CanRawFrame,
  DtcAlert,
  GeofenceZone,
} from './types';

// Zones de géorepérage souveraines en Algérie
export const SOVEREIGN_GEOFENCES: GeofenceZone[] = [
  {
    id: 'geo-rouiba',
    name: 'Base Centrale Logistique Rouiba (SNVI)',
    category: 'LOGISTICS_HUB',
    centerLat: 36.738,
    centerLng: 3.284,
    radiusKm: 4.5,
    colorHex: '#2563EB',
  },
  {
    id: 'geo-oran',
    name: 'Plateforme Multimodale Port d’Oran',
    category: 'PORT',
    centerLat: 35.708,
    centerLng: -0.635,
    radiusKm: 3.8,
    colorHex: '#10B981',
  },
  {
    id: 'geo-ghardaia',
    name: 'Poste Avancé RN1 Vallée du M’Zab',
    category: 'LOGISTICS_HUB',
    centerLat: 32.491,
    centerLng: 3.673,
    radiusKm: 6.0,
    colorHex: '#F59E0B',
  },
  {
    id: 'geo-hassi',
    name: 'Hub Pétrolier & Base Vie Hassi Messaoud',
    category: 'QUARRY_MINE',
    centerLat: 31.684,
    centerLng: 6.067,
    radiusKm: 8.5,
    colorHex: '#EF4444',
  },
  {
    id: 'geo-sba',
    name: 'Carrière & Concassage Sidi Bel Abbès',
    category: 'QUARRY_MINE',
    centerLat: 35.191,
    centerLng: -0.641,
    radiusKm: 4.2,
    colorHex: '#8B5CF6',
  },
];

// Itinéraires prédéfinis pour la cinématique réaliste (Algérie)
const CORRIDOR_RN1_WAYPOINTS = [
  { lat: 36.72, lng: 3.12 }, // Alger
  { lat: 36.47, lng: 2.83 }, // Blida
  { lat: 36.26, lng: 2.75 }, // Médéa
  { lat: 35.67, lng: 3.05 }, // Berrouaghia
  { lat: 34.67, lng: 3.25 }, // Djelfa
  { lat: 33.80, lng: 2.87 }, // Laghouat
  { lat: 32.49, lng: 3.67 }, // Ghardaïa
  { lat: 31.95, lng: 5.33 }, // Ouargla
  { lat: 31.68, lng: 6.06 }, // Hassi Messaoud
];

const AUTOROUTE_A1_WAYPOINTS = [
  { lat: 36.75, lng: 3.05 }, // Alger
  { lat: 36.45, lng: 2.38 }, // Tipaza / Cherchell
  { lat: 36.28, lng: 1.83 }, // Khemis Miliana
  { lat: 36.16, lng: 1.33 }, // Chlef
  { lat: 35.93, lng: 0.08 }, // Relizane
  { lat: 35.70, lng: -0.64 }, // Oran
];

export const ORGAN_META: Record<string, { fr: string; ar: string; law: string; unit: string; safetyVital: boolean }> = {
  engineOil: { fr: 'Huile Moteur', ar: 'زيت المحرك', law: 'Loi d\'Arrhenius (Cinétique thermique)', unit: 'h', safetyVital: true },
  batteryCranking: { fr: 'Batterie & Démarrage', ar: 'البطارية والتشغيل', law: 'Chute de tension minimale (CVHI)', unit: 'démarrages', safetyVital: true },
  cylinderHead: { fr: 'Culasse & Thermique', ar: 'رأس الأسطوانة والتبريد', law: 'Résidu thermique EWMA (ε-NTU)', unit: 'km', safetyVital: true },
  brakeTribology: { fr: 'Freins & Tribologie', ar: 'المكابح والفرامل', law: 'Loi d\'Archard (Énergie dissipée)', unit: 'km', safetyVital: true },
  dpfFilter: { fr: 'Filtre à Particules FAP', ar: 'فلتر الجسيمات FAP', law: 'Darcy-Forchheimer & Suie', unit: 'km', safetyVital: false },
  fuelAntiSiphon: { fr: 'Carburant CUSUM', ar: 'الوقود ومكافحة السرقة', law: 'Carte CUSUM Page-Hinkley', unit: 'L', safetyVital: false },
  chassisFatigue: { fr: 'Châssis & Fatigue', ar: 'الهيكل ومقاومة الإجهاد', law: 'Rainflow ASTM E1049 & Basquin', unit: 'km', safetyVital: false },
  tyreAbrasion: { fr: 'Pneumatiques', ar: 'الإطارات والتآكل', law: 'Loi de Schallamach (Glissement)', unit: 'km', safetyVital: false },
  clutchWear: { fr: 'Embrayage & Boîte', ar: 'القابض وناقل الحركة', law: 'Couple & Glissement J1939', unit: 'h', safetyVital: false },
  injectionDrift: { fr: 'Injection Common Rail', ar: 'الحقن والضغط العالي', law: 'Dérive Pression & STFT/LTFT', unit: 'km', safetyVital: false },
  turbocharger: { fr: 'Turbocompresseur & CHRA', ar: 'شاحن التوربو', law: 'Stress thermique CHRA & Arrêt chaud', unit: 'h', safetyVital: true },
  alternatorBelt: { fr: 'Courroie & Alternateur', ar: 'حزام المحرك والدينامو', law: 'Fatigue flexion & Régulation', unit: 'km', safetyVital: false },
};

export function buildOrganDetails(
  vhiScore: number,
  bottleneck: string = 'cylinderHead',
  hardVeto: boolean = false
): Record<string, {
  organId: string;
  nameFr: string;
  nameAr: string;
  degradationIndex: number;
  healthScore: number;
  weight: number;
  isVitalSafetyOrgan: boolean;
  rulEstimate: { value: number; unit: string };
  physicalSummary: string;
}> {
  const details: Record<string, any> = {};
  const organKeys = Object.keys(ORGAN_META);

  for (const key of organKeys) {
    const meta = ORGAN_META[key];
    const isBottleneck = key === bottleneck;
    let healthScore: number;

    if (isBottleneck) {
      healthScore = hardVeto ? Math.min(32, Math.round(vhiScore * 0.82)) : Math.max(8, Math.round(vhiScore * 0.90));
    } else {
      const offset = (key.charCodeAt(0) % 12);
      healthScore = Math.min(100, Math.round(vhiScore + offset));
    }
    healthScore = Math.max(5, Math.min(100, healthScore));
    const degradationIndex = +((100 - healthScore) / 100).toFixed(3);

    let rulVal = Math.round(healthScore * 180);
    if (meta.unit === 'h') rulVal = Math.round(healthScore * 6.5);
    if (meta.unit === 'démarrages') rulVal = Math.round(healthScore * 12);
    if (meta.unit === 'L') rulVal = Math.round(healthScore * 4);

    let summary = `Modèle : ${meta.law}. Indice d'usure D = ${degradationIndex}`;
    if (key === 'cylinderHead') {
      summary = healthScore < 50
        ? `Écart thermique anormal : Résidu coolant mesuré élevé, risque de voilage culasse.`
        : `Équilibre thermique stable : Résidu < 2.5°C avec convection radiateur nominale.`;
    } else if (key === 'engineOil') {
      summary = `Viscosité cinématique estimée : ${(14.5 - degradationIndex * 4).toFixed(1)} cSt. Facteur Arrhenius K = ${(1 + degradationIndex * 0.5).toFixed(2)}.`;
    } else if (key === 'batteryCranking') {
      summary = `Chute de tension au démarrage : ${(10.8 - degradationIndex * 2.2).toFixed(2)}V (SOH: ${healthScore}%).`;
    } else if (key === 'brakeTribology') {
      summary = `Énergie thermique dissipée cumulée : ${(degradationIndex * 3.5e8).toExponential(2)} J. Plaquettes : ${Math.max(2, Math.round(14 * (1 - degradationIndex)))} mm.`;
    } else if (key === 'fuelAntiSiphon') {
      summary = `Contrôle CUSUM S- = ${(degradationIndex * 8).toFixed(1)} L. Zéro anomalie de siphonnage stationnaire.`;
    }

    details[key] = {
      organId: key,
      nameFr: meta.fr,
      nameAr: meta.ar,
      degradationIndex,
      healthScore,
      weight: meta.safetyVital ? 0.12 : 0.06,
      isVitalSafetyOrgan: meta.safetyVital,
      rulEstimate: { value: rulVal, unit: meta.unit },
      physicalSummary: summary,
    };
  }

  return details;
}

const INITIAL_FLEET_UNITS: VehicleTelemetryState[] = [
  {
    id: 'unit-001',
    registrationNumber: '00421-116-16',
    vin: 'VF624GPA00004128',
    make: 'Renault Trucks',
    model: 'K 480 6x4 Heavy Tipper',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Benne Chantier',
    status: 'MOTION',
    driverName: 'Mourad Benali',
    driverPhone: '+213 550 12 34 56',
    currentSite: 'Corridor RN1 Ghardaïa',
    wilayaCode: '47',
    telemetryMode: 'MODE_2_FULL_CAN',
    odometerKm: 284150,
    engineHours: 4120,
    vhiHealthScore: 88,
    vhiStatus: 'OPTIMAL',
    bottleneckComponent: 'brakeTribology',
    bottleneckScore: 82,
    hardVetoTriggered: false,
    hardVetoOrgan: null,
    organDetails: buildOrganDetails(88, 'brakeTribology', false),
    rulKilometersRemaining: 18400,
    financialRiskDzd: 45000,
    preventiveCostDzd: 18500,
    arbitrageRecommendationFr: 'Remplacer filtre séparateur eau/gasoil sous 1 500 km pour préserver les injecteurs Common Rail.',
    arbitrageRecommendationAr: 'استبدال فلتر فاصل الماء/المازوت قبل 1,500 كم لحماية حاقنات الديزل.',
    gps: {
      latitude: 32.85,
      longitude: 3.52,
      altitudeMeters: 468,
      headingDegrees: 168,
      speedKmh: 76,
    },
    hardware: {
      satellitesCount: 16,
      hdop: 0.85,
      rssiGsmDbm: -68,
      cellularOperator: 'Mobilis 4G LTE-M',
      batteryVoltageV: 24.4,
      lastPingSecondsAgo: 0.8,
    },
    can: {
      engineRpm: 1420,
      wheelSpeedKmh: 75.8,
      engineLoadPercent: 64,
      throttlePercent: 48,
      coolantTempC: 92.5,
      oilPressureBar: 3.8,
      intakeAirTempC: 38,
      boostPressureBar: 1.45,
      fuelLevelPercent: 68,
      fuelLiters: 272,
      instantFuelConsumptionL100km: 32.4,
      fuelDropAnomalyDetected: false,
      adBlueLevelPercent: 84,
      transmissionGear: 'D10',
      parkingBrakeEngaged: false,
    },
    activeDtcs: [],
    dvirStatus: {
      isBlocked: false,
      latestReportId: 'dvir-demo-01',
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    breadcrumbs: [
      { latitude: 33.15, longitude: 3.38, altitudeMeters: 490, headingDegrees: 165, speedKmh: 78, timestamp: '12:00:15' },
      { latitude: 33.02, longitude: 3.44, altitudeMeters: 482, headingDegrees: 167, speedKmh: 76, timestamp: '12:02:40' },
      { latitude: 32.85, longitude: 3.52, altitudeMeters: 468, headingDegrees: 168, speedKmh: 76, timestamp: '12:05:00' },
    ],
  },
  {
    id: 'unit-002',
    registrationNumber: '01892-116-16',
    vin: 'WDB9634031L89214',
    make: 'Mercedes-Benz',
    model: 'Actros 3340 6x4 S',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Tracteur Routier',
    status: 'DTC_CRITICAL',
    driverName: 'Karim Bouzid',
    driverPhone: '+213 661 98 76 54',
    currentSite: 'Base Logistique Rouiba',
    wilayaCode: '16',
    telemetryMode: 'MODE_2_FULL_CAN',
    odometerKm: 342900,
    engineHours: 5890,
    vhiHealthScore: 42,
    vhiStatus: 'CRITIQUE_VETO',
    bottleneckComponent: 'cylinderHead',
    bottleneckScore: 32,
    hardVetoTriggered: true,
    hardVetoOrgan: 'cylinderHead',
    organDetails: buildOrganDetails(42, 'cylinderHead', true),
    rulKilometersRemaining: 420,
    financialRiskDzd: 420000,
    preventiveCostDzd: 32000,
    arbitrageRecommendationFr: 'IMMOBILISER 3h : Fuite sécheur d\'air APS et surchauffe 104.5°C. Risque de casse compresseur ou joint de culasse (420 000 DZD).',
    arbitrageRecommendationAr: 'توقيف عاجل 3 ساعات: تسريب مجفف الهواء وسخونة مفرطة 104.5°م. خطر تلف حشية رأس الأسطوانة (420,000 دج).',
    gps: {
      latitude: 36.735,
      longitude: 3.280,
      altitudeMeters: 38,
      headingDegrees: 45,
      speedKmh: 58,
    },
    hardware: {
      satellitesCount: 14,
      hdop: 1.1,
      rssiGsmDbm: -62,
      cellularOperator: 'Djezzy IoT',
      batteryVoltageV: 23.8,
      lastPingSecondsAgo: 0.5,
    },
    can: {
      engineRpm: 1380,
      wheelSpeedKmh: 57.6,
      engineLoadPercent: 78,
      throttlePercent: 62,
      coolantTempC: 104.5, // Surchauffe
      oilPressureBar: 1.45, // Pression basse
      intakeAirTempC: 46,
      boostPressureBar: 1.2,
      fuelLevelPercent: 42,
      fuelLiters: 168,
      instantFuelConsumptionL100km: 38.6,
      fuelDropAnomalyDetected: false,
      adBlueLevelPercent: 45,
      transmissionGear: 'D8',
      parkingBrakeEngaged: false,
    },
    activeDtcs: [
      {
        id: 'dtc-1087',
        codeString: 'SPN-1087-FMI-1',
        protocol: 'J1939',
        subsystem: 'BRAKES_APS',
        severity: 'CRITICAL_IMMOBILIZATION',
        titleFr: 'Défaut Sécheur d’Air APS — Fuite de Pression',
        technicalDescriptionFr: 'Pression de service circuit pneumatique < 8.0 bar. Risque de blocage sécurité des étriers.',
        timestamp: '12:04:18',
        recommendedWorkshopAction: 'Contrôler cartouche déshydratante et vanne de décharge sous 2h.',
      },
      {
        id: 'dtc-110',
        codeString: 'SPN-110-FMI-0',
        protocol: 'J1939',
        subsystem: 'COOLING',
        severity: 'WARNING',
        titleFr: 'Température Culasse Supérieure au Seuil Nominal',
        technicalDescriptionFr: 'Température liquide de refroidissement enregistrée à 104.5°C (> 100°C).',
        timestamp: '12:01:10',
        recommendedWorkshopAction: 'Vérifier débit visco-coupleur ventilateur et niveau vase d’expansion.',
      },
    ],
    dvirStatus: {
      isBlocked: true,
      latestReportId: 'dvir-demo-02',
      criticalFailureReason: 'Hernie pneu avant gauche & chute pression pneumatique freinage',
      generatedWorkOrderId: 'ot-dvir-99104',
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    breadcrumbs: [
      { latitude: 36.720, longitude: 3.250, altitudeMeters: 42, headingDegrees: 48, speedKmh: 64, timestamp: '12:00:30' },
      { latitude: 36.735, longitude: 3.280, altitudeMeters: 38, headingDegrees: 45, speedKmh: 58, timestamp: '12:04:45' },
    ],
  },
  {
    id: 'unit-003',
    registrationNumber: '00854-336-30',
    vin: 'CAT0336DLHEX9482',
    make: 'Caterpillar',
    model: '336D L Hydraulic Excavator',
    category: 'CONSTRUCTION_BTP',
    categoryLabel: 'Engin Pelle Chenille',
    status: 'IDLE_WARNING',
    driverName: 'Abdelkader Saïdi',
    driverPhone: '+213 770 45 67 89',
    currentSite: 'Base Sud Hassi Messaoud',
    wilayaCode: '30',
    telemetryMode: 'MODE_2_FULL_CAN',
    odometerKm: 42800,
    engineHours: 6840,
    vhiHealthScore: 79,
    vhiStatus: 'SURVEILLANCE',
    bottleneckComponent: 'engineOil',
    bottleneckScore: 68,
    hardVetoTriggered: false,
    hardVetoOrgan: null,
    organDetails: buildOrganDetails(79, 'engineOil', false),
    rulKilometersRemaining: 12500,
    financialRiskDzd: 95000,
    preventiveCostDzd: 28000,
    arbitrageRecommendationFr: 'Ralenti excessif (22% charge). Vidange huile hydraulique préventive recommandée à Hassi Messaoud.',
    arbitrageRecommendationAr: 'دوران بطيء مفرط. ينصح بتغيير الزيت الهيدروليكي الوقائي بقاعدة حاسي مسعود.',
    gps: {
      latitude: 31.692,
      longitude: 6.075,
      altitudeMeters: 148,
      headingDegrees: 0,
      speedKmh: 0,
    },
    hardware: {
      satellitesCount: 18,
      hdop: 0.72,
      rssiGsmDbm: -74,
      cellularOperator: 'Ooredoo Enterprise',
      batteryVoltageV: 24.8,
      lastPingSecondsAgo: 1.2,
    },
    can: {
      engineRpm: 820,
      wheelSpeedKmh: 0,
      engineLoadPercent: 22,
      throttlePercent: 0,
      coolantTempC: 86.0,
      oilPressureBar: 2.9,
      intakeAirTempC: 44,
      boostPressureBar: 0.1,
      fuelLevelPercent: 54,
      fuelLiters: 324,
      instantFuelConsumptionL100km: 9.8, // L/h ralenti
      fuelDropAnomalyDetected: false,
      adBlueLevelPercent: 62,
      transmissionGear: 'N',
      parkingBrakeEngaged: true,
    },
    activeDtcs: [],
    dvirStatus: {
      isBlocked: false,
      latestReportId: 'dvir-demo-01',
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    breadcrumbs: [
      { latitude: 31.692, longitude: 6.075, altitudeMeters: 148, headingDegrees: 0, speedKmh: 0, timestamp: '11:55:00' },
      { latitude: 31.692, longitude: 6.075, altitudeMeters: 148, headingDegrees: 0, speedKmh: 0, timestamp: '12:05:00' },
    ],
  },
  {
    id: 'unit-004',
    registrationNumber: '09814-118-16',
    vin: 'AHTFR22G90014829',
    make: 'Toyota',
    model: 'Hilux Double Cab 2.8 D-4D 4x4',
    category: 'LIGHT_COMMERCIAL',
    categoryLabel: 'VUL Pick-up Liaison',
    status: 'MOTION',
    driverName: 'Sofiane Larbi',
    driverPhone: '+213 555 77 88 99',
    currentSite: 'Autoroute Est-Ouest Chlef',
    wilayaCode: '02',
    telemetryMode: 'MODE_1_GPS_ONLY',
    odometerKm: 98450,
    engineHours: 1940,
    vhiHealthScore: 94,
    vhiStatus: 'OPTIMAL',
    bottleneckComponent: 'batteryCranking',
    bottleneckScore: 88,
    hardVetoTriggered: false,
    hardVetoOrgan: null,
    organDetails: buildOrganDetails(94, 'batteryCranking', false),
    rulKilometersRemaining: 34000,
    financialRiskDzd: 15000,
    preventiveCostDzd: 9500,
    arbitrageRecommendationFr: 'Vérification périodique plaquettes de frein avant mission Hauts-Plateaux.',
    arbitrageRecommendationAr: 'فحص دوري لصفائح الفرامل قبل الانطلاق نحو الهضاب العليا.',
    gps: {
      latitude: 36.18,
      longitude: 1.35,
      altitudeMeters: 124,
      headingDegrees: 245,
      speedKmh: 104,
    },
    hardware: {
      satellitesCount: 15,
      hdop: 0.9,
      rssiGsmDbm: -58,
      cellularOperator: 'Mobilis 4G LTE-M',
      batteryVoltageV: 13.9,
      lastPingSecondsAgo: 0.3,
    },
    can: {
      engineRpm: 1980,
      wheelSpeedKmh: 104.2,
      engineLoadPercent: 42,
      throttlePercent: 35,
      coolantTempC: 88.0,
      oilPressureBar: 4.2,
      intakeAirTempC: 32,
      boostPressureBar: 1.15,
      fuelLevelPercent: 78,
      fuelLiters: 62,
      instantFuelConsumptionL100km: 8.6,
      fuelDropAnomalyDetected: false,
      adBlueLevelPercent: 90,
      transmissionGear: 'D6',
      parkingBrakeEngaged: false,
    },
    activeDtcs: [],
    dvirStatus: {
      isBlocked: false,
      latestReportId: 'dvir-demo-01',
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    breadcrumbs: [
      { latitude: 36.24, longitude: 1.58, altitudeMeters: 138, headingDegrees: 245, speedKmh: 105, timestamp: '12:01:20' },
      { latitude: 36.18, longitude: 1.35, altitudeMeters: 124, headingDegrees: 245, speedKmh: 104, timestamp: '12:05:00' },
    ],
  },
  {
    id: 'unit-005',
    registrationNumber: '02410-117-22',
    vin: 'YS2R4X200028914',
    make: 'Scania',
    model: 'R 450 Highline Streamline',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Citerne Naftal',
    status: 'MOTION',
    driverName: 'Hamid Djemai',
    driverPhone: '+213 662 11 22 33',
    currentSite: 'Carrière Sidi Bel Abbès',
    wilayaCode: '22',
    telemetryMode: 'MODE_2_FULL_CAN',
    odometerKm: 215400,
    engineHours: 3620,
    vhiHealthScore: 91,
    vhiStatus: 'OPTIMAL',
    bottleneckComponent: 'clutchWear',
    bottleneckScore: 87,
    hardVetoTriggered: false,
    hardVetoOrgan: null,
    organDetails: buildOrganDetails(91, 'clutchWear', false),
    rulKilometersRemaining: 28000,
    financialRiskDzd: 38000,
    preventiveCostDzd: 24000,
    arbitrageRecommendationFr: 'Citerne Naftal : Contrôle vanne de fond et capteurs ADR conforme.',
    arbitrageRecommendationAr: 'شاحنة صهريج نفطال: فحص صمام القاع ومستشعرات المواد الخطرة مطابق.',
    gps: {
      latitude: 35.21,
      longitude: -0.62,
      altitudeMeters: 485,
      headingDegrees: 185,
      speedKmh: 68,
    },
    hardware: {
      satellitesCount: 16,
      hdop: 0.8,
      rssiGsmDbm: -66,
      cellularOperator: 'Djezzy IoT',
      batteryVoltageV: 24.6,
      lastPingSecondsAgo: 0.7,
    },
    can: {
      engineRpm: 1320,
      wheelSpeedKmh: 68.2,
      engineLoadPercent: 55,
      throttlePercent: 44,
      coolantTempC: 91.0,
      oilPressureBar: 4.1,
      intakeAirTempC: 36,
      boostPressureBar: 1.35,
      fuelLevelPercent: 82,
      fuelLiters: 328,
      instantFuelConsumptionL100km: 29.5,
      fuelDropAnomalyDetected: false,
      adBlueLevelPercent: 78,
      transmissionGear: 'D11',
      parkingBrakeEngaged: false,
    },
    activeDtcs: [],
    dvirStatus: {
      isBlocked: false,
      latestReportId: 'dvir-demo-01',
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    breadcrumbs: [
      { latitude: 35.25, longitude: -0.61, altitudeMeters: 470, headingDegrees: 182, speedKmh: 70, timestamp: '12:02:10' },
      { latitude: 35.21, longitude: -0.62, altitudeMeters: 485, headingDegrees: 185, speedKmh: 68, timestamp: '12:05:00' },
    ],
  },
  {
    id: 'unit-006',
    registrationNumber: '00312-320-30',
    vin: 'LZG183740019283',
    make: 'Shacman',
    model: 'F3000 8x4 Heavy Dumper',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Benne Carrière',
    status: 'PARKED_OFF',
    driverName: 'Rachid Belkacem',
    driverPhone: '+213 550 33 44 55',
    currentSite: 'Base Vie Gassi Touil',
    wilayaCode: '30',
    telemetryMode: 'MODE_2_FULL_CAN',
    odometerKm: 189200,
    engineHours: 4210,
    vhiHealthScore: 74,
    vhiStatus: 'SURVEILLANCE',
    bottleneckComponent: 'dpfFilter',
    bottleneckScore: 65,
    hardVetoTriggered: false,
    hardVetoOrgan: null,
    organDetails: buildOrganDetails(74, 'dpfFilter', false),
    rulKilometersRemaining: 6800,
    financialRiskDzd: 180000,
    preventiveCostDzd: 42000,
    arbitrageRecommendationFr: 'Tension de charge alternateur faible au repos. Remplacement préventif batterie 24V requis.',
    arbitrageRecommendationAr: 'جهد شحن المولد منخفض أثناء التوقف. استبدال وقائي للبطارية 24V مطلوب.',
    gps: {
      latitude: 31.42,
      longitude: 6.28,
      altitudeMeters: 160,
      headingDegrees: 0,
      speedKmh: 0,
    },
    hardware: {
      satellitesCount: 12,
      hdop: 1.3,
      rssiGsmDbm: -82,
      cellularOperator: 'Mobilis 4G',
      batteryVoltageV: 24.1,
      lastPingSecondsAgo: 8.5,
    },
    can: {
      engineRpm: 0,
      wheelSpeedKmh: 0,
      engineLoadPercent: 0,
      throttlePercent: 0,
      coolantTempC: 45.0,
      oilPressureBar: 0.0,
      intakeAirTempC: 38,
      boostPressureBar: 0.0,
      fuelLevelPercent: 35,
      fuelLiters: 140,
      instantFuelConsumptionL100km: 0.0,
      fuelDropAnomalyDetected: false,
      adBlueLevelPercent: 40,
      transmissionGear: 'N',
      parkingBrakeEngaged: true,
    },
    activeDtcs: [],
    dvirStatus: {
      isBlocked: false,
      latestReportId: 'dvir-demo-01',
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    breadcrumbs: [],
  },
  {
    id: 'unit-007',
    registrationNumber: '00789-114-16',
    vin: 'VF1FDC000583921',
    make: 'Renault',
    model: 'Master 2.3 dCi 150 L3H2',
    category: 'LIGHT_COMMERCIAL',
    categoryLabel: 'VUL Fourgon Froid',
    status: 'OFFLINE',
    driverName: 'Mustapha Cherif',
    driverPhone: '+213 771 22 33 44',
    currentSite: 'Dépôt Alger Ouest Zéralda',
    wilayaCode: '16',
    telemetryMode: 'MODE_0_ZERO_HARDWARE',
    odometerKm: 142100,
    engineHours: 3100,
    vhiHealthScore: 82,
    vhiStatus: 'OPTIMAL',
    bottleneckComponent: 'fuelAntiSiphon',
    bottleneckScore: 80,
    hardVetoTriggered: false,
    hardVetoOrgan: null,
    organDetails: buildOrganDetails(82, 'fuelAntiSiphon', false),
    rulKilometersRemaining: 9500,
    financialRiskDzd: 65000,
    preventiveCostDzd: 16000,
    arbitrageRecommendationFr: 'Mode 0 Sans Boîtier : Recalage odomètre DVIR requis lors du prochain plein carte Naftal Pass.',
    arbitrageRecommendationAr: 'نمط بدون جهاز: يلزم ضبط عداد الكيلومترات في الفحص القادم عند محطة نفطال.',
    gps: {
      latitude: 36.71,
      longitude: 2.84,
      altitudeMeters: 65,
      headingDegrees: 90,
      speedKmh: 0,
    },
    hardware: {
      satellitesCount: 0,
      hdop: 9.9,
      rssiGsmDbm: -112,
      cellularOperator: 'Aucun signal',
      batteryVoltageV: 12.1,
      lastPingSecondsAgo: 380,
    },
    can: {
      engineRpm: 0,
      wheelSpeedKmh: 0,
      engineLoadPercent: 0,
      throttlePercent: 0,
      coolantTempC: 22.0,
      oilPressureBar: 0.0,
      intakeAirTempC: 22,
      boostPressureBar: 0.0,
      fuelLevelPercent: 60,
      fuelLiters: 48,
      instantFuelConsumptionL100km: 0.0,
      fuelDropAnomalyDetected: false,
      adBlueLevelPercent: 70,
      transmissionGear: 'N',
      parkingBrakeEngaged: true,
    },
    activeDtcs: [],
    dvirStatus: {
      isBlocked: false,
      latestReportId: 'dvir-demo-01',
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    breadcrumbs: [],
  },
];

export function useTelemetryStream(options?: { isDemoMode?: boolean }) {
  const isDemoMode = options?.isDemoMode ?? true;
  const [fleet, setFleet] = useState<VehicleTelemetryState[]>(() => isDemoMode ? INITIAL_FLEET_UNITS : []);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => isDemoMode ? 'unit-001' : '');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [rawCanFrames, setRawCanFrames] = useState<CanRawFrame[]>([]);
  const [wsStats, setWsStats] = useState<{ latencyMs: number; msgPerSec: number }>({
    latencyMs: 24,
    msgPerSec: 128,
  });

  const waypointIndices = useRef<Record<string, number>>({
    'unit-001': 5,
    'unit-002': 0,
    'unit-004': 3,
    'unit-005': 0,
  });

  // Synchronisation dynamique : Démo vs Flotte Réelle
  useEffect(() => {
    if (isDemoMode) {
      setFleet(INITIAL_FLEET_UNITS);
      setSelectedVehicleId('unit-001');
      return;
    }

    let liveRefreshInterval: NodeJS.Timeout | null = null;

    const loadRealFleet = async () => {
      const token = AuthClient.getToken();
      if (!token) {
        setFleet([]);
        setSelectedVehicleId('');
        return;
      }

      try {
        const [assets, fleetLive, dvirReports] = await Promise.all([
          AssetClient.listAssets(token),
          TelematicsClient.getFleetLive(token).catch(() => []),
          FleetIntelligenceClient.getDvirReports(token).catch(() => []),
        ]);
        if (!assets || assets.length === 0) {
          setFleet([]);
          setSelectedVehicleId('');
          return;
        }

        const liveMap = new Map<string, FleetLiveAsset>();
        (fleetLive || []).forEach((item) => {
          if (item.assetId) liveMap.set(item.assetId, item);
        });

        const dvirMap = new Map<string, DVIRInspectionReport>();
        (dvirReports || []).forEach((r) => {
          if (r.assetId && !dvirMap.has(r.assetId)) {
            dvirMap.set(r.assetId, r);
          }
        });

        const realFleet: VehicleTelemetryState[] = assets.map((a, index) => {
          const live = liveMap.get(a.id);
          const dvir = dvirMap.get(a.id);
          const isTruck = a.category === 'HEAVY_TRUCK';
          const isMachinery = a.category === 'CONSTRUCTION_EQUIPMENT';
          const hasGps = live?.latitude != null && live?.longitude != null;
          const lat = hasGps ? Number(live!.latitude) : +(36.75 + (index * 0.015)).toFixed(5);
          const lng = hasGps ? Number(live!.longitude) : +(3.05 + (index * 0.015)).toFixed(5);
          const spd = live?.speed != null ? Number(live.speed) : (a.status === 'OPERATIONAL' ? 35 : 0);
          const ign = live?.ignition ?? (a.status === 'OPERATIONAL');

          const isBlockedByDvir = dvir?.hasCriticalFailures ?? false;

          const resolvedCategory: VehicleCategory = isMachinery
            ? 'CONSTRUCTION_BTP'
            : isTruck
              ? 'HEAVY_TRUCK'
              : 'LIGHT_COMMERCIAL';

          return {
            id: a.id,
            registrationNumber: a.code || `DZ-${a.id.slice(0, 8)}`,
            vin: a.code || 'NON DÉTECTÉ',
            make: a.brand || 'Constructeur',
            model: a.model || a.name,
            category: resolvedCategory,
            categoryLabel: isTruck ? 'Poids Lourd' : (isMachinery ? 'Engin Chantier' : 'Véhicule de Flotte'),
            status: isBlockedByDvir ? 'DTC_CRITICAL' : (ign && spd > 0 ? 'MOTION' : (ign ? 'IDLE_WARNING' : 'PARKED_OFF')),
            driverName: 'Conducteur Assigné',
            driverPhone: '+213 550 00 00 00',
            currentSite: 'Base Entreprise Réelle',
            wilayaCode: '16',
            telemetryMode: live?.deviceId ? 'MODE_1_GPS_ONLY' : 'MODE_0_ZERO_HARDWARE',
            odometerKm: a.currentMeterValue || 0,
            engineHours: isMachinery ? a.currentMeterValue || 0 : 0,
            vhiHealthScore: isBlockedByDvir
              ? 42
              : (live?.vhiScore != null ? Number(live.vhiScore) : ((a as any).vhi_score ? Number((a as any).vhi_score) : 100)),
            vhiStatus: isBlockedByDvir
              ? 'CRITIQUE_VETO'
              : (live?.vhiStatus || ((a as any).vhi_status as any) || 'OPTIMAL'),
            bottleneckComponent: isBlockedByDvir
              ? 'brakeTribology'
              : (live?.bottleneckComponent || ((a as any).bottleneck_component as any) || 'cylinderHead'),
            bottleneckScore: isBlockedByDvir ? 32 : (live?.vhiScore != null ? Math.round(Number(live.vhiScore) * 0.9) : 95),
            hardVetoTriggered: isBlockedByDvir || (live?.vhiScore != null && Number(live.vhiScore) <= 35),
            hardVetoOrgan: isBlockedByDvir ? 'brakeTribology' : (live?.bottleneckComponent || null),
            organDetails: buildOrganDetails(
              live?.vhiScore != null ? Number(live.vhiScore) : (isBlockedByDvir ? 42 : 100),
              isBlockedByDvir ? 'brakeTribology' : (live?.bottleneckComponent || 'cylinderHead'),
              isBlockedByDvir || (live?.vhiScore != null && Number(live.vhiScore) <= 35)
            ),
            rulKilometersRemaining: a.maintenanceIntervalValue || 15000,
            financialRiskDzd: isBlockedByDvir ? 150000 : 0,
            preventiveCostDzd: isBlockedByDvir ? 25000 : 0,
            arbitrageRecommendationFr: isBlockedByDvir
              ? 'CONSIGNATION SÉCURITÉ : Défaillance critique DVIR active. Réparation atelier requise avant affectation.'
              : 'Actif réel de production — Télémétrie Traccar / Mode Souverain synchronisée.',
            arbitrageRecommendationAr: isBlockedByDvir
              ? 'حجز أمني: فشل حرج في الفحص التقني. يلزم تصليح فوري قبل الانطلاق.'
              : 'مركبة إنتاجية حقيقية — اتصال التتبع المباشر متزامن.',
            dvirStatus: dvir
              ? {
                  isBlocked: isBlockedByDvir,
                  latestReportId: dvir.id,
                  criticalFailureReason: isBlockedByDvir ? 'Défaillance critique constatée lors du contrôle DVIR' : undefined,
                  generatedWorkOrderId: dvir.generatedWorkOrderId,
                  submittedAt: dvir.submittedAt,
                }
              : { isBlocked: false },
            gps: {
              latitude: lat,
              longitude: lng,
              altitudeMeters: 45,
              headingDegrees: 90,
              speedKmh: spd,
            },
            hardware: {
              satellitesCount: live?.deviceId ? 14 : 0,
              hdop: live?.deviceId ? 0.9 : 9.9,
              rssiGsmDbm: live?.deviceId ? -72 : -110,
              cellularOperator: live?.deviceId ? 'Mobilis 4G LTE-M' : 'Mode 0 Valhalla',
              batteryVoltageV: 24.2,
              lastPingSecondsAgo: live?.lastRecordedAt
                ? Math.max(0.1, (Date.now() - new Date(live.lastRecordedAt).getTime()) / 1000)
                : 2.5,
            },
            can: {
              engineRpm: ign ? (spd > 0 ? 1450 : 850) : 0,
              wheelSpeedKmh: spd,
              engineLoadPercent: spd > 0 ? 35 : 10,
              throttlePercent: spd > 0 ? 25 : 0,
              coolantTempC: ign ? 89.0 : 25.0,
              oilPressureBar: ign ? 3.8 : 0.0,
              intakeAirTempC: 28,
              boostPressureBar: spd > 0 ? 1.0 : 0.0,
              fuelLevelPercent: 78,
              fuelLiters: 160,
              instantFuelConsumptionL100km: spd > 0 ? 26.0 : 2.0,
              fuelDropAnomalyDetected: false,
              adBlueLevelPercent: 82,
              transmissionGear: spd > 0 ? 'D8' : (ign ? 'N' : 'P'),
              parkingBrakeEngaged: !ign,
            },
            activeDtcs: [],
            breadcrumbs: [
              { latitude: lat, longitude: lng, altitudeMeters: 45, headingDegrees: 90, speedKmh: spd, timestamp: '12:00:00' },
            ],
          };
        });

        setFleet(realFleet);
        if (realFleet.length > 0) {
          setSelectedVehicleId((prev) => prev || realFleet[0].id);
        }
      } catch (err) {
        console.warn('Mode Réel : Impossible de récupérer les actifs distants, affichage parc vide.', err);
        setFleet([]);
        setSelectedVehicleId('');
      }
    };

    loadRealFleet();

    // Rafraîchissement périodique du flux réel Traccar
    liveRefreshInterval = setInterval(() => {
      const token = AuthClient.getToken();
      if (!token) return;
      TelematicsClient.getFleetLive(token)
        .then((fleetLive) => {
          if (!fleetLive || fleetLive.length === 0) return;
          const liveMap = new Map<string, FleetLiveAsset>();
          fleetLive.forEach((item) => {
            if (item.assetId) liveMap.set(item.assetId, item);
          });
          setFleet((prev) =>
            prev.map((v) => {
              const live = liveMap.get(v.id);
              if (!live) return v;
              const hasGps = live.latitude != null && live.longitude != null;
              const spd = live.speed != null ? Number(live.speed) : v.gps.speedKmh;
              const ign = live.ignition ?? (spd > 0);
              const updatedVhi = live.vhiScore != null ? Number(live.vhiScore) : v.vhiHealthScore;
              const updatedStatus = live.vhiStatus || v.vhiStatus;
              const updatedBottleneck = live.bottleneckComponent || v.bottleneckComponent;
              const isVeto = updatedStatus === 'CRITIQUE_VETO' || updatedVhi <= 35;
              const updatedOrgans = live.vhiScore != null
                ? buildOrganDetails(updatedVhi, updatedBottleneck || 'cylinderHead', isVeto)
                : v.organDetails;

              return {
                ...v,
                vhiHealthScore: updatedVhi,
                vhiStatus: updatedStatus,
                bottleneckComponent: updatedBottleneck,
                bottleneckScore: updatedOrgans?.[updatedBottleneck || 'cylinderHead']?.healthScore ?? v.bottleneckScore,
                hardVetoTriggered: isVeto,
                hardVetoOrgan: isVeto ? (updatedBottleneck || 'cylinderHead') : null,
                organDetails: updatedOrgans,
                status: ign && spd > 0 ? 'MOTION' : (ign ? 'IDLE_WARNING' : 'PARKED_OFF'),
                gps: {
                  ...v.gps,
                  latitude: hasGps ? Number(live.latitude) : v.gps.latitude,
                  longitude: hasGps ? Number(live.longitude) : v.gps.longitude,
                  speedKmh: spd,
                },
                hardware: {
                  ...v.hardware,
                  lastPingSecondsAgo: live.lastRecordedAt
                    ? Math.max(0.1, (Date.now() - new Date(live.lastRecordedAt).getTime()) / 1000)
                    : v.hardware.lastPingSecondsAgo,
                },
                can: {
                  ...v.can,
                  wheelSpeedKmh: spd,
                  engineRpm: ign ? (spd > 0 ? 1450 : 850) : 0,
                },
              };
            })
          );
        })
        .catch(() => { });
    }, 5000);

    return () => {
      if (liveRefreshInterval) clearInterval(liveRefreshInterval);
    };
  }, [isDemoMode]);

  // Mise à jour de cinématique GPS et fluctuation réaliste des PIDs CAN
  useEffect(() => {
    if (!isPlaying || (!isDemoMode && fleet.length === 0)) return;

    const interval = setInterval(() => {
      // 1. Simuler latence WS avec micro-variation
      setWsStats({
        latencyMs: Math.floor(18 + Math.random() * 12),
        msgPerSec: Math.floor(115 + Math.random() * 25),
      });

      setFleet((prevFleet) => {
        return prevFleet.map((vehicle) => {
          if (vehicle.status === 'OFFLINE' || vehicle.status === 'PARKED_OFF') {
            return {
              ...vehicle,
              hardware: {
                ...vehicle.hardware,
                lastPingSecondsAgo: +(vehicle.hardware.lastPingSecondsAgo + 1).toFixed(1),
              },
            };
          }

          // Fluctuation RPM & Vitesse
          const speedDelta = (Math.random() - 0.48) * 2.2;
          const newSpeed = Math.max(
            vehicle.status === 'IDLE_WARNING' ? 0 : 45,
            Math.min(95, vehicle.gps.speedKmh + speedDelta)
          );

          // RPM synchronisé avec la vitesse
          const targetRpm =
            vehicle.status === 'IDLE_WARNING'
              ? Math.floor(780 + Math.random() * 60)
              : Math.floor(1100 + (newSpeed / 90) * 450 + (Math.random() - 0.5) * 40);

          // Déplacement cinématique le long des waypoints
          const wpList =
            vehicle.id === 'unit-004' ? AUTOROUTE_A1_WAYPOINTS : CORRIDOR_RN1_WAYPOINTS;
          let currentIdx = waypointIndices.current[vehicle.id] ?? 0;
          const currentWp = wpList[currentIdx];
          const nextIdx = (currentIdx + 1) % wpList.length;
          const nextWp = wpList[nextIdx];

          // Interpolation lerp (0.003 par tick pour mouvement continu fluide)
          const step = 0.003;
          const newLat = +(vehicle.gps.latitude + (nextWp.lat - vehicle.gps.latitude) * step).toFixed(5);
          const newLng = +(vehicle.gps.longitude + (nextWp.lng - vehicle.gps.longitude) * step).toFixed(5);

          // Distance résiduelle au waypoint suivant
          const distToNext = Math.hypot(nextWp.lat - newLat, nextWp.lng - newLng);
          if (distToNext < 0.05) {
            waypointIndices.current[vehicle.id] = nextIdx;
          }

          // Calcul cap dynamique
          const deltaLat = nextWp.lat - vehicle.gps.latitude;
          const deltaLng = nextWp.lng - vehicle.gps.longitude;
          const calculatedHeading = Math.floor((Math.atan2(deltaLng, deltaLat) * 180) / Math.PI + 360) % 360;

          // Température culasse qui réagit à la charge
          let newCoolant = vehicle.can.coolantTempC;
          if (vehicle.id === 'unit-002') {
            // Unité critique en surchauffe
            newCoolant = +(104.0 + Math.sin(Date.now() / 4000) * 1.5).toFixed(1);
          } else {
            newCoolant = +(91.5 + Math.sin(Date.now() / 5000) * 1.2).toFixed(1);
          }

          // Pression d'huile
          const newOilPressure = +(
            vehicle.can.oilPressureBar +
            (Math.random() - 0.5) * 0.08
          ).toFixed(2);

          // Horodatage trace
          const nowStr = new Date().toTimeString().split(' ')[0];
          const newPoint = {
            latitude: newLat,
            longitude: newLng,
            altitudeMeters: vehicle.gps.altitudeMeters,
            headingDegrees: calculatedHeading,
            speedKmh: Math.round(newSpeed),
            timestamp: nowStr,
          };

          const updatedBreadcrumbs = [...vehicle.breadcrumbs.slice(-25), newPoint];

          return {
            ...vehicle,
            odometerKm: vehicle.odometerKm + (newSpeed > 0 ? 0.02 : 0),
            gps: {
              ...vehicle.gps,
              latitude: newLat,
              longitude: newLng,
              headingDegrees: calculatedHeading,
              speedKmh: Math.round(newSpeed),
            },
            hardware: {
              ...vehicle.hardware,
              lastPingSecondsAgo: +(Math.random() * 0.9).toFixed(1),
              batteryVoltageV: +(vehicle.hardware.batteryVoltageV + (Math.random() - 0.5) * 0.05).toFixed(2),
            },
            can: {
              ...vehicle.can,
              engineRpm: targetRpm,
              wheelSpeedKmh: +(newSpeed + (Math.random() - 0.5) * 0.6).toFixed(1),
              engineLoadPercent: Math.min(95, Math.max(15, Math.floor(vehicle.can.engineLoadPercent + (Math.random() - 0.5) * 6))),
              throttlePercent: Math.min(100, Math.max(0, Math.floor(vehicle.can.throttlePercent + (Math.random() - 0.5) * 4))),
              coolantTempC: newCoolant,
              oilPressureBar: newOilPressure,
            },
            breadcrumbs: updatedBreadcrumbs,
          };
        });
      });

      // 2. Générer des trames CAN brutes en direct (J1939 / OBD-II)
      const nowHexTime = new Date().toISOString().substring(11, 23);
      const possibleFrames = [
        {
          canIdHex: '0x0CF00400',
          pgn: 61444,
          name: 'EEC1 (Electronic Engine Controller 1)',
          payloadHex: `00 ${(Math.floor(Math.random() * 255)).toString(16).padStart(2, '0').toUpperCase()} 50 1F 00 00 F0 FF`,
          decodedField: `SPN 190 RPM: ${Math.floor(1350 + Math.random() * 150)} tr/min • SPN 92 Load: ${Math.floor(55 + Math.random() * 20)}%`,
        },
        {
          canIdHex: '0x18FEEE00',
          pgn: 65262,
          name: 'ET1 (Engine Temperature 1)',
          payloadHex: `5C ${(Math.floor(90 + Math.random() * 15)).toString(16).padStart(2, '0').toUpperCase()} 82 00 00 00 00 00`,
          decodedField: `SPN 110 Coolant Temp: ${(91 + Math.random() * 3).toFixed(1)} °C`,
        },
        {
          canIdHex: '0x18FEEF00',
          pgn: 65263,
          name: 'EFL_P1 (Engine Fluid Level/Pressure 1)',
          payloadHex: `FF FF FF ${(Math.floor(60 + Math.random() * 20)).toString(16).padStart(2, '0').toUpperCase()} 00 7D 00 FF`,
          decodedField: `SPN 100 Oil Pressure: ${(3.6 + Math.random() * 0.4).toFixed(2)} bar`,
        },
        {
          canIdHex: '0x18FEAE00',
          pgn: 65198,
          name: 'AIR1 (Air Supply Pressure - APS Freinage)',
          payloadHex: `78 00 ${(Math.floor(80 + Math.random() * 20)).toString(16).padStart(2, '0').toUpperCase()} FF FF FF FF FF`,
          decodedField: `SPN 1087 Circuit 1 Air Pressure: ${(9.4 + Math.random() * 0.6).toFixed(1)} bar`,
        },
      ];

      const chosen = possibleFrames[Math.floor(Math.random() * possibleFrames.length)];
      setRawCanFrames((prev) => [
        {
          id: `frame-${Date.now()}-${Math.random()}`,
          timestamp: nowHexTime,
          ...chosen,
        },
        ...prev.slice(0, 40),
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Statistiques globales de flotte
  const aggregateStats: FleetAggregateStats = {
    totalVehicles: fleet.length,
    inMotion: fleet.filter((v) => v.status === 'MOTION').length,
    idling: fleet.filter((v) => v.status === 'IDLE_WARNING').length,
    dtcCritical: fleet.filter((v) => v.status === 'DTC_CRITICAL').length,
    dvirBlockedCount: fleet.filter((v) => v.dvirStatus?.isBlocked).length,
    offline: fleet.filter((v) => v.status === 'OFFLINE').length,
    wsLatencyMs: wsStats.latencyMs,
    msgPerSecond: wsStats.msgPerSec,
  };

  // Véhicule actif inspecté
  const selectedVehicle = fleet.find((v) => v.id === selectedVehicleId) || fleet[0];

  // Actions d'injection de scénarios (pour test et démonstration)
  const togglePlayPause = () => setIsPlaying((p) => !p);

  const injectCriticalDtc = useCallback((vehicleId: string) => {
    setFleet((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const newAlert: DtcAlert = {
            id: `dtc-sim-${Date.now()}`,
            codeString: 'SPN-100-FMI-1',
            protocol: 'J1939',
            subsystem: 'ENGINE',
            severity: 'CRITICAL_IMMOBILIZATION',
            titleFr: 'Pression d’Huile Moteur Extrêmement Basse',
            technicalDescriptionFr: 'Pression mesurée < 1.2 bar sous régime 1400 tr/min. Risque de coulage bielle imminent.',
            timestamp: new Date().toTimeString().split(' ')[0],
            recommendedWorkshopAction: 'Couper le moteur immédiatement. Dépêcher l’atelier mobile.',
          };
          return {
            ...v,
            status: 'DTC_CRITICAL',
            vhiHealthScore: Math.min(v.vhiHealthScore, 48),
            activeDtcs: [newAlert, ...v.activeDtcs],
            can: {
              ...v.can,
              oilPressureBar: 0.95,
            },
          };
        }
        return v;
      })
    );
  }, []);

  const triggerFuelTheftAnomaly = useCallback((vehicleId: string) => {
    setFleet((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const dropLiters = 45;
          const newLiters = Math.max(10, v.can.fuelLiters - dropLiters);
          const newPercent = Math.round((newLiters / 400) * 100);
          return {
            ...v,
            can: {
              ...v.can,
              fuelLiters: newLiters,
              fuelLevelPercent: newPercent,
              fuelDropAnomalyDetected: true,
            },
          };
        }
        return v;
      })
    );
  }, []);

  const toggleDvirBlock = useCallback((vehicleId: string) => {
    setFleet((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const currentlyBlocked = v.dvirStatus?.isBlocked ?? false;
          return {
            ...v,
            dvirStatus: {
              isBlocked: !currentlyBlocked,
              latestReportId: currentlyBlocked ? v.dvirStatus?.latestReportId : `dvir-sim-${Date.now().toString().slice(-4)}`,
              criticalFailureReason: currentlyBlocked
                ? undefined
                : 'Inspection terrain non conforme : anomalie critique signalée (freinage/pneumatique)',
              generatedWorkOrderId: currentlyBlocked ? undefined : `ot-dvir-${vehicleId}-${Date.now().toString().slice(-4)}`,
              submittedAt: new Date().toISOString(),
            },
          };
        }
        return v;
      })
    );
  }, []);

  return {
    fleet,
    selectedVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    aggregateStats,
    rawCanFrames,
    isPlaying,
    togglePlayPause,
    injectCriticalDtc,
    triggerFuelTheftAnomaly,
    toggleDvirBlock,
    geofences: SOVEREIGN_GEOFENCES,
  };
}
