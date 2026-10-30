/**
 * physics-engine.ts — Moteur de Physique Prédictive & Détection de Fraude (6 Modèles Déterministes)
 * Conforme à MASTER_SPEC v3.0, Lois d'Arrhenius, Archard, EWMA, CUSUM de Page-Hinkley & Score VHI
 * 100% Déterministe, Traçable et Explicable (XAI)
 */

import { getWilayaAlphaDz } from './local-oem-resolver';

// ============================================================================
// 1. MODÈLE 1 : DÉGRADATION D'HUILE MOTEUR (LOI CINÉTIQUE D'ARRHENIUS)
// ============================================================================

export interface ArrheniusOilInput {
  deltaTripKm: number;
  idleHours: number;
  ptoOrAcEngaged?: boolean;
  oilTempC: number;
  engineLoadPct?: number;
  wilayaCodeOrName?: string | number;
  customAlphaDzOil?: number;
  nominalIntervalKm?: number;
}

export interface ArrheniusOilResult {
  effectiveWearKm: number;
  thermalArrheniusFactor: number;
  loadFactor: number;
  alphaDzOil: number;
  nominalIntervalKm: number;
  wearRatio: number;
  oilHealthScore: number; // 0 à 100
  remainingOilLifeKm: number;
  proof: string;
}

export function calculateArrheniusOilDegradation(input: ArrheniusOilInput): ArrheniusOilResult {
  const nominalIntervalKm = input.nominalIntervalKm ?? 30000;
  const deltaKm = Math.max(0, input.deltaTripKm);
  const idleHours = Math.max(0, input.idleHours);

  // Équivalence ralenti saharien : 40 km/h si clim/PTO active, 33 km/h standard
  const vEquiv = input.ptoOrAcEngaged ? 40.0 : 33.0;
  const idleEquivalentKm = idleHours * vEquiv;

  // Température de référence : 90°C = 363.15 K
  // Énergie d'activation Ea / R ≈ 4200 K pour huiles moteurs synthétiques/minérales Naftal
  const tRefK = 90.0 + 273.15;
  const tOilK = Math.max(50.0, input.oilTempC) + 273.15;
  const thermalArrheniusFactor = Math.exp(4200.0 * (1.0 / tRefK - 1.0 / tOilK));

  // Facteur de charge moteur phi_charge (nominal 1.0 à 50% de charge)
  const rawLoad = input.engineLoadPct ?? 50.0;
  const loadFactor = 1.0 + Math.max(0, (rawLoad - 50.0) / 100.0) * 0.6;

  // Résolution coefficient géoclimatique saharien alpha_dz_huile
  let alphaDzOil = 0.75;
  if (input.customAlphaDzOil && input.customAlphaDzOil > 0) {
    alphaDzOil = input.customAlphaDzOil;
  } else if (input.wilayaCodeOrName !== undefined) {
    alphaDzOil = getWilayaAlphaDz(input.wilayaCodeOrName, 'oil');
  }

  // Formule Maîtresse Arrhenius v3.0 :
  // Delta D_eff = (Delta d + v_equiv * t_idle) * exp[Ea/R * (1/T_ref - 1/T_oil)] * (phi_charge / alpha_dz_huile)
  const effectiveWearKm = Math.round(
    ((deltaKm + idleEquivalentKm) * thermalArrheniusFactor * loadFactor) / alphaDzOil
  );

  const wearRatio = Math.min(1.0, effectiveWearKm / nominalIntervalKm);
  const oilHealthScore = Math.max(0, Math.round((1.0 - wearRatio) * 100));
  const remainingOilLifeKm = Math.max(0, nominalIntervalKm - effectiveWearKm);

  const proof =
    `ΔD_eff = (${deltaKm} km + ${vEquiv} km/h × ${idleHours}h) × exp[4200 × (1/363.15 - 1/${tOilK.toFixed(1)})] ` +
    `× (${loadFactor.toFixed(2)} / ${alphaDzOil.toFixed(2)}) = ${effectiveWearKm} km éq. ` +
    `(Score: ${oilHealthScore}/100, Reste: ${remainingOilLifeKm} km)`;

  return {
    effectiveWearKm,
    thermalArrheniusFactor: Number(thermalArrheniusFactor.toFixed(3)),
    loadFactor: Number(loadFactor.toFixed(3)),
    alphaDzOil: Number(alphaDzOil.toFixed(2)),
    nominalIntervalKm,
    wearRatio: Number(wearRatio.toFixed(3)),
    oilHealthScore,
    remainingOilLifeKm,
    proof,
  };
}

// ============================================================================
// 2. MODÈLE 2 : SANTÉ BATTERIE & DÉMARREUR (CRANKING DROP & SOH)
// ============================================================================

export interface BatteryHealthInput {
  systemVoltage: 12 | 24;
  minCrankingVoltageV: number;
  crankingDurationMs?: number;
  ambientTempC: number;
  chargingVoltageV: number;
}

export interface BatteryHealthResult {
  sohPercent: number; // 0 à 100
  compensatedCrankVoltageV: number;
  status: 'OPTIMAL' | 'GOOD' | 'WEAK_REPLACEMENT_ADVISED' | 'CRITICAL_FAILURE_IMMINENT';
  alternatorStatus: 'HEALTHY' | 'UNDERCHARGING' | 'OVERCHARGING';
  predictedRulDays: number;
  proof: string;
}

export function evaluateBatteryHealth(input: BatteryHealthInput): BatteryHealthResult {
  const is24V = input.systemVoltage === 24;

  // Compensation thermique au démarrage : +15 mV/°C en 12V, +30 mV/°C en 24V sous 25°C
  const tempDelta = 25.0 - input.ambientTempC;
  const tempCompensationMv = tempDelta * (is24V ? 30.0 : 15.0);
  const compensatedCrankVoltageV = Number(
    (input.minCrankingVoltageV + tempCompensationMv / 1000.0).toFixed(2)
  );

  // Seuils de référence
  const nominalCrank = is24V ? 21.0 : 10.5;
  const warningCrank = is24V ? 19.2 : 9.6;
  const criticalCrank = is24V ? 17.0 : 8.5;

  let sohPercent = 100;
  let status: BatteryHealthResult['status'] = 'OPTIMAL';
  let predictedRulDays = 365;

  if (compensatedCrankVoltageV >= nominalCrank) {
    sohPercent = Math.min(100, Math.round(85 + ((compensatedCrankVoltageV - nominalCrank) / 2.0) * 15));
    status = 'OPTIMAL';
    predictedRulDays = 365;
  } else if (compensatedCrankVoltageV >= warningCrank) {
    const ratio = (compensatedCrankVoltageV - warningCrank) / (nominalCrank - warningCrank);
    sohPercent = Math.round(60 + ratio * 24);
    status = 'GOOD';
    predictedRulDays = 180;
  } else if (compensatedCrankVoltageV >= criticalCrank) {
    const ratio = (compensatedCrankVoltageV - criticalCrank) / (warningCrank - criticalCrank);
    sohPercent = Math.round(25 + ratio * 34);
    status = 'WEAK_REPLACEMENT_ADVISED';
    predictedRulDays = 21;
  } else {
    sohPercent = Math.max(5, Math.round((compensatedCrankVoltageV / criticalCrank) * 20));
    status = 'CRITICAL_FAILURE_IMMINENT';
    predictedRulDays = 3;
  }

  // Diagnostic de l'alternateur en roulage
  let alternatorStatus: BatteryHealthResult['alternatorStatus'] = 'HEALTHY';
  const minCharging = is24V ? 27.2 : 13.6;
  const maxCharging = is24V ? 29.8 : 14.9;

  if (input.chargingVoltageV < minCharging) {
    alternatorStatus = 'UNDERCHARGING';
  } else if (input.chargingVoltageV > maxCharging) {
    alternatorStatus = 'OVERCHARGING';
  }

  const proof =
    `V_crank_compensé = ${input.minCrankingVoltageV}V + (${tempDelta}°C × ${is24V ? '30' : '15'} mV/°C) = ${compensatedCrankVoltageV}V. ` +
    `SOH: ${sohPercent}% (${status}). Alternateur: ${input.chargingVoltageV}V (${alternatorStatus}).`;

  return {
    sohPercent,
    compensatedCrankVoltageV,
    status,
    alternatorStatus,
    predictedRulDays,
    proof,
  };
}

// ============================================================================
// 3. MODÈLE 3 : MODÈLE THERMIQUE RÉSIDUEL (ENTARTRAGE RADIATEUR & CULASSE)
// ============================================================================

export interface ThermalResidualInput {
  measuredCoolantTempC: number;
  engineLoadPct: number;
  ambientTempC: number;
  speedKmh: number;
  roadSlopePct?: number;
  previousEwmaResidual?: number;
}

export interface ThermalResidualResult {
  expectedTempC: number;
  measuredTempC: number;
  rawResidualC: number;
  ewmaResidualC: number;
  thermalHealthScore: number; // 0 à 100
  diagnosis:
    | 'NORMAL_THERMAL_EQUILIBRIUM'
    | 'THERMOSTAT_STUCK_OPEN'
    | 'RADIATOR_SCALING_OR_VISCO_COUPLING_FAILURE'
    | 'CRITICAL_HEAD_GASKET_RISK';
  proof: string;
}

export function evaluateThermalResidual(input: ThermalResidualInput): ThermalResidualResult {
  const slope = input.roadSlopePct ?? 0;
  const speed = Math.min(100.0, Math.max(0, input.speedKmh));

  // Modèle thermique attendu :
  // T_attendu = 85.0 + 0.12 * Load + 0.25 * max(0, T_amb - 25) - 0.05 * v_air + 0.8 * max(0, Pente)
  const expectedTempC = Number(
    (
      85.0 +
      0.12 * input.engineLoadPct +
      0.25 * Math.max(0, input.ambientTempC - 25.0) -
      0.05 * speed +
      0.8 * Math.max(0, slope)
    ).toFixed(2)
  );

  const rawResidualC = Number((input.measuredCoolantTempC - expectedTempC).toFixed(2));

  // Lissage EWMA (alpha = 0.15)
  const prevEwma = input.previousEwmaResidual ?? rawResidualC;
  const ewmaResidualC = Number((0.15 * rawResidualC + 0.85 * prevEwma).toFixed(2));

  let diagnosis: ThermalResidualResult['diagnosis'] = 'NORMAL_THERMAL_EQUILIBRIUM';
  let thermalHealthScore = 100;

  if (ewmaResidualC >= 15.0) {
    diagnosis = 'CRITICAL_HEAD_GASKET_RISK';
    thermalHealthScore = Math.max(5, Math.round(100 - ewmaResidualC * 5.0));
  } else if (ewmaResidualC >= 7.5) {
    diagnosis = 'RADIATOR_SCALING_OR_VISCO_COUPLING_FAILURE';
    thermalHealthScore = Math.round(75 - (ewmaResidualC - 7.5) * 6.0);
  } else if (ewmaResidualC <= -12.0) {
    diagnosis = 'THERMOSTAT_STUCK_OPEN';
    thermalHealthScore = 65;
  } else {
    diagnosis = 'NORMAL_THERMAL_EQUILIBRIUM';
    thermalHealthScore = Math.min(100, Math.round(100 - Math.abs(ewmaResidualC) * 2.0));
  }

  const proof =
    `T_attendu = 85.0 + (0.12 × ${input.engineLoadPct}%) + (0.25 × ${Math.max(0, input.ambientTempC - 25)}°C) - (0.05 × ${speed}) + (0.8 × ${Math.max(0, slope)}) = ${expectedTempC}°C. ` +
    `Résidu EWMA: ${ewmaResidualC > 0 ? '+' : ''}${ewmaResidualC}°C. Diagnostic: ${diagnosis} (Score: ${thermalHealthScore}/100).`;

  return {
    expectedTempC,
    measuredTempC: input.measuredCoolantTempC,
    rawResidualC,
    ewmaResidualC,
    thermalHealthScore,
    diagnosis,
    proof,
  };
}

// ============================================================================
// 4. MODÈLE 4 : CAPTEUR VIRTUEL D'USURE DES FREINS (LOI D'ARCHARD)
// ============================================================================

export interface ArchardBrakeInput {
  vehicleMassKg: number;
  initialSpeedKmh: number;
  finalSpeedKmh: number;
  downhillElevationDeltaM?: number;
  retarderTorquePct?: number; // 0 à 100 %
  currentPadThicknessMm?: number;
  minPadThicknessMm?: number;
}

export interface ArchardBrakeResult {
  dissipatedKineticJoules: number;
  dissipatedPotentialJoules: number;
  totalMechanicalFrictionJoules: number;
  retarderAbsorbedRatio: number;
  estimatedWearMm: number;
  currentPadThicknessMm: number;
  brakeHealthScore: number; // 0 à 100
  remainingBrakeKm: number;
  proof: string;
}

export function calculateArchardBrakeWear(input: ArchardBrakeInput): ArchardBrakeResult {
  const currentThickness = input.currentPadThicknessMm ?? 22.0; // Neuve = 24mm, Témoin = 4mm
  const minThickness = input.minPadThicknessMm ?? 4.0;
  const massKg = input.vehicleMassKg;

  // Conversion km/h -> m/s
  const v1 = (input.initialSpeedKmh * 1000.0) / 3600.0;
  const v2 = (input.finalSpeedKmh * 1000.0) / 3600.0;

  // 1. Énergie cinétique dissipée lors de la décélération
  const dissipatedKineticJoules = Math.max(0, 0.5 * massKg * (v1 * v1 - v2 * v2));

  // 2. Énergie potentielle gravitationnelle en descente prolongée (g = 9.81 m/s²)
  const deltaH = Math.max(0, input.downhillElevationDeltaM ?? 0);
  const dissipatedPotentialJoules = massKg * 9.81 * deltaH;

  // 3. Déduction du ralentisseur (Retarder J1939) : absorbe jusqu'à 85% de l'effort
  const retarderRatio = Math.min(0.85, Math.max(0, (input.retarderTorquePct ?? 0) / 100.0));
  const totalMechanicalFrictionJoules = Math.round(
    (dissipatedKineticJoules + dissipatedPotentialJoules) * (1.0 - retarderRatio)
  );

  // 4. Loi d'Archard : Usure (mm) = k_archard * E_frottement (k_archard ≈ 1.2e-9 mm/Joule pour plaquettes poids lourds)
  const kArchard = 1.2e-9;
  const estimatedWearMm = Number((totalMechanicalFrictionJoules * kArchard).toFixed(5));

  const remainingUsableMm = Math.max(0, currentThickness - minThickness);
  const nominalUsableMm = 20.0; // 24mm - 4mm
  const brakeHealthScore = Math.max(0, Math.min(100, Math.round((remainingUsableMm / nominalUsableMm) * 100)));

  // Estimation RUL km restant (moyenne 80 000 km pour 20mm utilisables en conditions mixtes)
  const remainingBrakeKm = Math.round((remainingUsableMm / nominalUsableMm) * 80000);

  const proof =
    `E_cinétique = ${Math.round(dissipatedKineticJoules / 1000)} kJ, E_pente = ${Math.round(dissipatedPotentialJoules / 1000)} kJ. ` +
    `Ralentisseur absorbé: ${(retarderRatio * 100).toFixed(0)}%. Énergie frottement disques: ${Math.round(totalMechanicalFrictionJoules / 1000)} kJ. ` +
    `Usure Archard: ${estimatedWearMm} mm. Épaisseur: ${currentThickness} mm (Score: ${brakeHealthScore}/100, Reste: ${remainingBrakeKm} km).`;

  return {
    dissipatedKineticJoules,
    dissipatedPotentialJoules,
    totalMechanicalFrictionJoules,
    retarderAbsorbedRatio: retarderRatio,
    estimatedWearMm,
    currentPadThicknessMm: currentThickness,
    brakeHealthScore,
    remainingBrakeKm,
    proof,
  };
}

// ============================================================================
// 5. MODÈLE 5 : COLMATAGE FAP & DÉRIVE INJECTEURS
// ============================================================================

export interface DpfInjectorHealthInput {
  fuelRateLPerHour: number;
  engineRpm: number;
  engineLoadPct: number;
  nominalSpecificConsumption?: number; // L/(1000 RPM * 100% load * h)
  failedRegenCount?: number;
  diffPressureKpa?: number;
}

export interface DpfInjectorHealthResult {
  specificConsumption: number;
  injectorDriftPct: number;
  dpfHealthScore: number; // 0 à 100
  status: 'NORMAL' | 'INJECTOR_DRIFT_OR_DIRTY_FUEL' | 'DPF_REGENERATION_URGENT' | 'DPF_CLOGGED_RESTRICTED';
  proof: string;
}

export function evaluateDpfAndInjectorHealth(input: DpfInjectorHealthInput): DpfInjectorHealthResult {
  const nominal = input.nominalSpecificConsumption ?? 28.5; // Consommation nominale par unité d'effort
  const rpmFactor = Math.max(600, input.engineRpm) / 1000.0;
  const loadFactor = Math.max(10, input.engineLoadPct) / 100.0;

  // Rendement spécifique observé : Débit carburant rapporté à l'effort moteur
  const specificConsumption = Number((input.fuelRateLPerHour / (rpmFactor * loadFactor)).toFixed(2));
  const injectorDriftPct = Number((((specificConsumption - nominal) / nominal) * 100.0).toFixed(1));

  const diffPressure = input.diffPressureKpa ?? 12.0; // Pression différentielle FAP normale: 5-15 kPa
  const failedRegens = input.failedRegenCount ?? 0;

  let status: DpfInjectorHealthResult['status'] = 'NORMAL';
  let dpfHealthScore = 100;

  if (diffPressure > 35.0 || failedRegens >= 3) {
    status = 'DPF_CLOGGED_RESTRICTED';
    dpfHealthScore = 20;
  } else if (diffPressure > 22.0 || failedRegens >= 2) {
    status = 'DPF_REGENERATION_URGENT';
    dpfHealthScore = 50;
  } else if (injectorDriftPct > 7.0) {
    status = 'INJECTOR_DRIFT_OR_DIRTY_FUEL';
    dpfHealthScore = Math.max(55, Math.round(100 - injectorDriftPct * 3.0));
  } else {
    status = 'NORMAL';
    dpfHealthScore = Math.max(80, Math.round(100 - Math.max(0, injectorDriftPct) * 2.0));
  }

  const proof =
    `Conso spécifique: ${specificConsumption} L/h/effort (Nominal: ${nominal}). Dérive: ${injectorDriftPct > 0 ? '+' : ''}${injectorDriftPct}%. ` +
    `FAP P_diff: ${diffPressure} kPa (Échecs régénération: ${failedRegens}). Statut: ${status} (Score: ${dpfHealthScore}/100).`;

  return {
    specificConsumption,
    injectorDriftPct,
    dpfHealthScore,
    status,
    proof,
  };
}

// ============================================================================
// 6. MODÈLE 6 : DÉTECTION DE FRAUDE CARBURANT & CUSUM DE PAGE-HINKLEY
// ============================================================================

export interface FuelTheftDetectionInput {
  fuelTankCapacityLiters: number;
  rawLevelsLiters: number[];
  canConsumedLitersTotal?: number;
  ignitionOn: boolean;
  vehicleSpeedKmh: number;
  previousCusumScore?: number;
}

export interface FuelTheftDetectionResult {
  theftDetected: boolean;
  theftType: 'NONE' | 'STATIONARY_SIPHONING' | 'SLOW_BLEEDING_IN_TRANSIT';
  stolenVolumeLiters: number;
  cusumCumulativeScore: number;
  filteredFuelLevelLiters: number;
  fuelSecurityScore: number; // 0 à 100
  proof: string;
}

export function detectFuelTheftCusum(input: FuelTheftDetectionInput): FuelTheftDetectionResult {
  const capacity = input.fuelTankCapacityLiters;

  // 1. Filtre Anti-Ballottement (Sloshing Filter) : Médiane mobile sur les derniers échantillons
  const levels = input.rawLevelsLiters.slice(-5);
  const sorted = [...levels].sort((a, b) => a - b);
  const filteredLevel = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

  // 2. Détection de Siphonnage à l'Arrêt (Stationary Siphoning)
  // Chute nette > 4% de la capacité totale contact coupé et vitesse nulle
  if (!input.ignitionOn && input.vehicleSpeedKmh < 1.0 && levels.length >= 2) {
    const initialLevel = levels[0];
    const finalLevel = levels[levels.length - 1];
    const dropLiters = initialLevel - finalLevel;
    const dropPct = (dropLiters / capacity) * 100.0;

    if (dropPct >= 4.0 && dropLiters >= 15.0) {
      const stolenVolumeLiters = Math.round(dropLiters);
      return {
        theftDetected: true,
        theftType: 'STATIONARY_SIPHONING',
        stolenVolumeLiters,
        cusumCumulativeScore: 0,
        filteredFuelLevelLiters: filteredLevel,
        fuelSecurityScore: 10,
        proof: `ALERTE FRAUDE : Siphonnage à l'arrêt détecté. Chute nette stabilisée de ${stolenVolumeLiters} L (${dropPct.toFixed(1)}% du réservoir) contact coupé.`,
      };
    }
  }

  // 3. Détection de Piquage Lent en Mission (Slow Bleeding) via CUSUM de Page-Hinkley
  // Compare la baisse de la jauge réservoir avec le volume injecté J1939 CAN
  const prevCusum = input.previousCusumScore ?? 0.0;
  let cusumCumulativeScore = prevCusum;
  let theftDetected = false;
  let theftType: FuelTheftDetectionResult['theftType'] = 'NONE';
  let stolenVolumeLiters = 0;

  if (input.canConsumedLitersTotal !== undefined && levels.length >= 2) {
    const gaugeDelta = levels[0] - levels[levels.length - 1]; // Baisse jauge
    const canDelta = input.canConsumedLitersTotal; // Consommation moteur officielle

    // Écart de consommation après marge de tolérance topographique (1.5 L)
    const discrepancy = gaugeDelta - canDelta - 1.5;
    cusumCumulativeScore = Math.max(0, Number((prevCusum + Math.max(0, discrepancy)).toFixed(2)));

    // Seuil de déclenchement CUSUM h = 8.0 Litres
    if (cusumCumulativeScore >= 8.0) {
      theftDetected = true;
      theftType = 'SLOW_BLEEDING_IN_TRANSIT';
      stolenVolumeLiters = Math.round(cusumCumulativeScore);
    }
  }

  const fuelSecurityScore = theftDetected ? 20 : Math.max(70, Math.round(100 - cusumCumulativeScore * 3.0));

  const proof = theftDetected
    ? `ALERTE FRAUDE : Piquage lent en roulage (Slow Bleeding). Écart cumulé CUSUM de ${cusumCumulativeScore} L > seuil 8.0 L.`
    : `Surveillance carburant nominale. Écart CUSUM cumulé : ${cusumCumulativeScore} L (Score sécurité: ${fuelSecurityScore}/100).`;

  return {
    theftDetected,
    theftType,
    stolenVolumeLiters,
    cusumCumulativeScore,
    filteredFuelLevelLiters: filteredLevel,
    fuelSecurityScore,
    proof,
  };
}

// ============================================================================
// 7. SCORE UNIFIÉ VHI (VEHICLE HEALTH INDEX) 0-100
// ============================================================================

export interface UnifiedVhiInput {
  oilHealthScore: number;     // 25%
  batteryHealthScore: number; // 20%
  thermalHealthScore: number; // 20%
  brakeHealthScore: number;   // 15%
  dpfHealthScore: number;     // 10%
  fuelSecurityScore: number;  // 10%
}

export interface UnifiedVhiResult {
  vhiScore: number; // 0 à 100
  rating: 'EXCELLENT' | 'GOOD' | 'MONITORING_REQUIRED' | 'CRITICAL_ACTION_REQUIRED';
  subsystemBreakdown: {
    oil: number;
    battery: number;
    thermal: number;
    brakes: number;
    dpf: number;
    fuelSecurity: number;
  };
  proof: string;
}

export function calculateUnifiedVhi(input: UnifiedVhiInput): UnifiedVhiResult {
  // Pondération canonique Master Spec v3.0 :
  // VHI = 0.25*Oil + 0.20*Battery + 0.20*Thermal + 0.15*Brakes + 0.10*DPF + 0.10*Fuel
  const weightedScore =
    0.25 * input.oilHealthScore +
    0.20 * input.batteryHealthScore +
    0.20 * input.thermalHealthScore +
    0.15 * input.brakeHealthScore +
    0.10 * input.dpfHealthScore +
    0.10 * input.fuelSecurityScore;

  const vhiScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

  let rating: UnifiedVhiResult['rating'] = 'EXCELLENT';
  if (vhiScore < 50) {
    rating = 'CRITICAL_ACTION_REQUIRED';
  } else if (vhiScore < 70) {
    rating = 'MONITORING_REQUIRED';
  } else if (vhiScore < 85) {
    rating = 'GOOD';
  } else {
    rating = 'EXCELLENT';
  }

  const proof =
    `VHI = (0.25 × ${input.oilHealthScore}) + (0.20 × ${input.batteryHealthScore}) + (0.20 × ${input.thermalHealthScore}) + ` +
    `(0.15 × ${input.brakeHealthScore}) + (0.10 × ${input.dpfHealthScore}) + (0.10 × ${input.fuelSecurityScore}) = ` +
    `${vhiScore}/100 [${rating}].`;

  return {
    vhiScore,
    rating,
    subsystemBreakdown: {
      oil: input.oilHealthScore,
      battery: input.batteryHealthScore,
      thermal: input.thermalHealthScore,
      brakes: input.brakeHealthScore,
      dpf: input.dpfHealthScore,
      fuelSecurity: input.fuelSecurityScore,
    },
    proof,
  };
}

