import {
  DigitalTwinAsset,
  DigitalTwinOrganStatus,
  DigitalTwinFinancialArbitrage,
  ALGERIA_58_WILAYAS_PROFILES,
  AlgeriaWilayaProfile,
  TelemetryTier,
} from '@docteurflotte/contracts';
import { MOCK_SANDBOX_ASSETS } from './assets.mock';

function getWilayaProfile(code?: number): AlgeriaWilayaProfile {
  const profile = ALGERIA_58_WILAYAS_PROFILES.find((w) => w.code === code);
  return profile || ALGERIA_58_WILAYAS_PROFILES[15]; // Alger (16) par défaut
}

export function buildDeterministicSandboxTwin(
  assetId: string,
  name: string,
  code: string,
  brand: string,
  model: string,
  year: number,
  odometer: number,
  wilayaCode: number = 16,
  climateMultiplier: number = 1.15,
  driverMultiplier: number = 1.1,
  isDesertTransit: boolean = false,
  economicRates?: {
    towingBaseRateTellDzd?: number;
    towingSurchargeSaharaDzd?: number;
    dailyImmobilizationCostDzd?: number;
  }
): DigitalTwinAsset {
  const wilaya = getWilayaProfile(wilayaCode);
  const effectiveClimate = isDesertTransit ? Math.max(climateMultiplier, 1.75) : climateMultiplier;
  const stressFactor = effectiveClimate * driverMultiplier;

  // 1. Huile Moteur (Loi d'Arrhenius : Ea/R = 6500 K)
  const oilDegradationMult = Number((wilaya.oilArrheniusFactor * stressFactor).toFixed(2));
  const rawOilKmRemaining = Math.max(0, Math.round(15000 - (odometer % 15000)));
  const actualOilKmRemaining = Math.round(rawOilKmRemaining / Math.max(0.5, oilDegradationMult));
  const oilHealth = Math.min(100, Math.max(10, Math.round((actualOilKmRemaining / 15000) * 100)));

  // 2. Batterie Cranking (CVHI & Évaporation électrolyte saharienne)
  const baseVoltage = 9.85 - (stressFactor - 1) * 0.65 - (wilaya.batteryEvapFactor - 1) * 0.35;
  const crankingVoltage = Number(Math.max(8.35, baseVoltage).toFixed(2));
  const batteryStartsRemaining = Math.max(4, Math.round(120 / (stressFactor * wilaya.batteryEvapFactor)));
  const batteryHealth =
    crankingVoltage < 9.6 ? 38 : Math.min(100, Math.round((crankingVoltage / 10.2) * 100));

  // 3. Freins & Ralentisseur (Loi d'Archard avec déclivité)
  const brakeWearFactor = stressFactor * wilaya.brakeGradientFactor;
  const brakePadThicknessMm = Number(
    Math.max(2.6, 12.0 - ((odometer % 40000) / 4000) * brakeWearFactor).toFixed(1)
  );
  const brakeKmRemaining = Math.round(
    Math.max(0, ((brakePadThicknessMm - 3.0) * 4500) / Math.max(0.5, brakeWearFactor))
  );
  const brakeHealth = Math.min(100, Math.max(5, Math.round((brakePadThicknessMm / 12.0) * 100)));

  // 4. Refroidissement & Culasse (Modèle Thermique Différentiel EWMA)
  const tempDelta = Number((11.5 * stressFactor + (wilaya.ambientTempSummerC - 30) * 0.25).toFixed(1));
  const coolingHealth = tempDelta > 16.5 ? 42 : tempDelta > 14.5 ? 68 : 92;

  // 5. Filtre à Particules FAP & Admission d'Air (Poussière silice)
  const dustImpact = wilaya.dustSilicaFactor;
  const sootGrams = Number(Math.min(72, 22.0 * stressFactor * dustImpact * 0.75).toFixed(1));
  const fapHealth = sootGrams > 45.0 ? 32 : Math.round(100 - (sootGrams / 45.0) * 55);

  // 6. Transmission & Pont Arrière (Micro-Glissement J1939)
  const transmissionSlipPct = Number((0.65 * stressFactor).toFixed(2));
  const transmissionKmRemaining = Math.max(5000, Math.round((80000 - (odometer % 80000)) / stressFactor));
  const transmissionHealth = transmissionSlipPct > 1.2 ? 45 : transmissionSlipPct > 0.9 ? 70 : 94;

  const organs: DigitalTwinOrganStatus[] = [
    {
      organ: 'ENGINE_OIL',
      name: 'Huile Moteur & Viscosité',
      icon: 'Droplet',
      healthPercent: oilHealth,
      remainingUsefulLifeValue: actualOilKmRemaining,
      remainingUsefulLifeUnit: 'KM',
      status: oilHealth < 30 ? 'CRITICAL' : oilHealth < 60 ? 'PRE_CRITICAL' : 'HEALTHY',
      physicsAlgorithm: 'Arrhenius Kinematic Viscosity (Ea/R = 6 500 K)',
      algorithmShortName: 'Arrhenius',
      observedMetrics: [
        { label: 'Facteur de sévérité thermique', value: `${oilDegradationMult}x`, threshold: '1.40x', valueNumeric: oilDegradationMult, thresholdNumeric: 1.4 },
        { label: 'Viscosité cinématique estimée', value: `${(14.2 - (1 - oilHealth / 100) * 3.5).toFixed(1)} cSt`, threshold: '11.5 cSt' },
      ],
      explanation: `Dégradation de viscosité accélérée par le profil thermique de la Wilaya de ${wilaya.name}.`,
    },
    {
      organ: 'BATTERY_CRANKING',
      name: 'Batterie & Démarrage (CVHI)',
      icon: 'Zap',
      healthPercent: batteryHealth,
      remainingUsefulLifeValue: batteryStartsRemaining,
      remainingUsefulLifeUnit: 'STARTS',
      status: batteryHealth < 40 ? 'CRITICAL' : batteryHealth < 65 ? 'PRE_CRITICAL' : 'HEALTHY',
      physicsAlgorithm: 'Cranking Voltage Health Index (CVHI)',
      algorithmShortName: 'CVHI',
      observedMetrics: [
        { label: 'Tension résiduelle au démarrage', value: `${crankingVoltage} V`, threshold: '9.60 V', valueNumeric: crankingVoltage, thresholdNumeric: 9.6 },
        { label: 'Démarrages viables estimés', value: `${batteryStartsRemaining}`, threshold: '15' },
      ],
      explanation: `Stress thermique élevé sur l’électrolyte (+${wilaya.ambientTempSummerC}°C estival).`,
    },
    {
      organ: 'BRAKE_PADS',
      name: 'Garnitures de Freins & Disques',
      icon: 'Disc',
      healthPercent: brakeHealth,
      remainingUsefulLifeValue: brakeKmRemaining,
      remainingUsefulLifeUnit: 'KM',
      status: brakeHealth < 25 ? 'CRITICAL' : brakeHealth < 50 ? 'PRE_CRITICAL' : 'HEALTHY',
      physicsAlgorithm: 'Archard Tribological Friction Energy Law',
      algorithmShortName: 'Archard',
      observedMetrics: [
        { label: 'Épaisseur restante de garniture', value: `${brakePadThicknessMm} mm`, threshold: '3.0 mm', valueNumeric: brakePadThicknessMm, thresholdNumeric: 3.0 },
        { label: 'Autonomie kilométrique estimée', value: `${brakeKmRemaining} km`, threshold: '2 500 km' },
      ],
      explanation: `Usure tribologique pondérée par le relief et les dévers de ${wilaya.name}.`,
    },
    {
      organ: 'COOLING_SYSTEM',
      name: 'Circuit de Refroidissement & Culasse',
      icon: 'Thermometer',
      healthPercent: coolingHealth,
      remainingUsefulLifeValue: Math.round(coolingHealth * 120),
      remainingUsefulLifeUnit: 'KM',
      status: coolingHealth < 50 ? 'CRITICAL' : coolingHealth < 75 ? 'PRE_CRITICAL' : 'HEALTHY',
      physicsAlgorithm: 'Differential Heat Transfer EWMA Model',
      algorithmShortName: 'EWMA Thermique',
      observedMetrics: [
        { label: 'Déphasage thermique bloc/radiateur', value: `ΔT = ${tempDelta}°C`, threshold: '15.0°C', valueNumeric: tempDelta, thresholdNumeric: 15.0 },
      ],
      explanation: 'Écart de température différentiel sous couple soutenu et canicule.',
    },
    {
      organ: 'DPF_FILTER',
      name: 'Filtre à Particules (FAP) & Suie',
      icon: 'Filter',
      healthPercent: fapHealth,
      remainingUsefulLifeValue: Math.max(500, Math.round((70 - sootGrams) * 180)),
      remainingUsefulLifeUnit: 'KM',
      status: fapHealth < 40 ? 'CRITICAL' : fapHealth < 70 ? 'PRE_CRITICAL' : 'HEALTHY',
      physicsAlgorithm: 'Soot Mass Balance & Differential Backpressure',
      algorithmShortName: 'Contre-pression',
      observedMetrics: [
        { label: 'Accumulation massique de suie', value: `${sootGrams} g`, threshold: '45.0 g', valueNumeric: sootGrams, thresholdNumeric: 45.0 },
      ],
      explanation: `Exposition à la poussière de silice désertique (Facteur: ${dustImpact}x).`,
    },
    {
      organ: 'TRANSMISSION_DRIVETRAIN',
      name: 'Transmission, Embrayage & Pont',
      icon: 'Cog',
      healthPercent: transmissionHealth,
      remainingUsefulLifeValue: transmissionKmRemaining,
      remainingUsefulLifeUnit: 'KM',
      status: transmissionHealth < 50 ? 'CRITICAL' : transmissionHealth < 75 ? 'PRE_CRITICAL' : 'HEALTHY',
      physicsAlgorithm: 'Micro-Slip Drivetrain Kinematics & Thermal Shear',
      algorithmShortName: 'Micro-Glissement',
      observedMetrics: [
        { label: 'Taux de micro-glissement embrayage', value: `${transmissionSlipPct}%`, threshold: '0.90%', valueNumeric: transmissionSlipPct, thresholdNumeric: 0.90 },
      ],
      explanation: 'Contrainte de couple J1939 et cisaillement de l’huile 80W90.',
    },
  ];

  // Calcul du score global VHI (Vehicle Health Index)
  const healthScores = organs.map((o) => o.healthPercent);
  const minHealth = Math.min(...healthScores);
  const avgHealth = Math.round(healthScores.reduce((acc, v) => acc + v, 0) / healthScores.length);
  const currentVhi = Math.round(minHealth * 0.6 + avgHealth * 0.4);

  const bottleneck = organs.reduce((prev, curr) =>
    curr.healthPercent < prev.healthPercent ? curr : prev
  );

  const isSud = wilaya.zone === 'ZONE_3_SAHARA' || isDesertTransit;
  const tellRate = Number(economicRates?.towingBaseRateTellDzd) || 35000;
  const saharaRate = Number(economicRates?.towingSurchargeSaharaDzd) || 75000;
  const towingForfait = isSud ? saharaRate : tellRate;
  const dailyImmob = Number(economicRates?.dailyImmobilizationCostDzd) || 25000;
  const immediateCost = bottleneck.organ === 'ENGINE_OIL' ? 28000 : 45000;
  const breakdownCost = 420000 + towingForfait;
  const failureProb = Math.min(95, Math.round((100 - bottleneck.healthPercent) * 0.95));
  const expectedLoss = Math.round(breakdownCost * (failureProb / 100));
  const netBenefitDzd = Math.max(0, expectedLoss - immediateCost);

  const financialArbitrage: DigitalTwinFinancialArbitrage = {
    preventiveInterventionCostDzd: immediateCost,
    unplannedBreakdownRiskDzd: breakdownCost,
    desertTowingCostDzd: towingForfait,
    dailyImmobilizationLossDzd: dailyImmob,
    netBenefitDzd,
    roiRatio: Number((expectedLoss / immediateCost).toFixed(1)),
    recommendedAction: bottleneck.healthPercent < 40 ? 'MAINTENANCE_IMMÉDIATE' : bottleneck.healthPercent < 70 ? 'SURVEILLANCE_APPROFONDIE' : 'OPÉRATIONNEL_NOMINAL',
    actionDeadlineDays: bottleneck.healthPercent < 40 ? 2 : 14,
  };

  return {
    assetId,
    assetCode: code,
    assetName: name,
    category: 'HEAVY_TRUCK',
    telemetryTier: TelemetryTier.MODE_2_CAN_J1939,
    brand,
    model,
    year,
    currentOdometerKm: odometer,
    currentVhi,
    wilayaLocation: wilaya.name,
    wilayaCode,
    driverAggressivenessScore: driverMultiplier,
    climateSeverityFactor: effectiveClimate,
    organs,
    financialArbitrage,
    projectionTrajectory: {
      day0Vhi: currentVhi,
      day30VhiWithoutAction: Math.max(10, currentVhi - 15),
      day60VhiWithoutAction: Math.max(5, currentVhi - 28),
      day90VhiWithoutAction: Math.max(2, currentVhi - 42),
      day30VhiWithAction: Math.min(98, currentVhi + 20),
    },
  };
}

export function getSimulationDigitalTwin(
  assetId?: string,
  wilayaCode: number = 16,
  climateMultiplier: number = 1.15,
  driverMultiplier: number = 1.1,
  isDesertTransit: boolean = false,
  economicRates?: {
    towingBaseRateTellDzd?: number;
    towingSurchargeSaharaDzd?: number;
    dailyImmobilizationCostDzd?: number;
  }
): DigitalTwinAsset {
  const asset =
    MOCK_SANDBOX_ASSETS.find((a) => a.id === assetId) || MOCK_SANDBOX_ASSETS[0];

  return buildDeterministicSandboxTwin(
    asset.id,
    asset.name,
    asset.code,
    asset.brand || 'Renault Trucks',
    asset.model || 'K 480 6x4',
    asset.year || 2022,
    asset.currentMeterValue || 284150,
    wilayaCode,
    climateMultiplier,
    driverMultiplier,
    isDesertTransit,
    economicRates
  );
}

export function getSimulationDigitalTwinsList(economicRates?: {
  towingBaseRateTellDzd?: number;
  towingSurchargeSaharaDzd?: number;
  dailyImmobilizationCostDzd?: number;
}): DigitalTwinAsset[] {
  return MOCK_SANDBOX_ASSETS.map((asset, idx) => {
    const wilayas = [16, 30, 31, 19, 25];
    const wCode = wilayas[idx % wilayas.length];
    return buildDeterministicSandboxTwin(
      asset.id,
      asset.name,
      asset.code,
      asset.brand || 'Marque',
      asset.model || 'Modèle',
      asset.year || 2021,
      asset.currentMeterValue || 150000,
      wCode,
      wCode === 30 ? 1.65 : 1.15,
      idx % 2 === 0 ? 0.95 : 1.3,
      false,
      economicRates
    );
  });
}
