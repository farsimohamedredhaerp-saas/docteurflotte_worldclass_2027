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

// ============================================================================
// 7. CORRECTION TOPOGRAPHIQUE DU RÉSERVOIR (PENTE VALHALLA & DÉVERS)
// ============================================================================

export interface TankSlopeCorrectionInput {
  roadGradePercent: number; // Pente en % lue sur le graphe routier (ex: 8% = 8.0, descente = -8.0)
  tankCapacityLiters: number;
  measuredDropLiters: number;
  tankLengthMeters?: number; // Longueur cuve (défaut: 1.6m pour PL 400L)
  sensorOffsetRatio?: number; // Décalage jauge / milieu cuve (-0.5 à +0.5, défaut: 0.25 vers l'arrière)
}

export interface TankSlopeCorrectionResult {
  slopeAngleDeg: number;
  apparentDropDueToSlopeLiters: number;
  correctedTrueDropLiters: number;
  isFalsePositiveSlope: boolean;
  explanation: string;
}

export function calculateTankSlopeCorrection(input: TankSlopeCorrectionInput): TankSlopeCorrectionResult {
  const gradePct = input.roadGradePercent;
  const gradeRad = Math.atan(gradePct / 100.0);
  const slopeAngleDeg = Number(((gradeRad * 180.0) / Math.PI).toFixed(2));

  // Effet d'inclinaison sur le niveau de jauge décentrée
  const offset = input.sensorOffsetRatio ?? 0.25;
  const lengthFactor = (input.tankLengthMeters ?? 1.6) / 0.6; // ratio longueur / hauteur
  const apparentDeltaLiters = Number(
    (input.tankCapacityLiters * 0.12 * Math.sin(gradeRad) * lengthFactor * Math.sign(offset || 1.0)).toFixed(2),
  );

  const apparentDropDueToSlopeLiters = Math.abs(apparentDeltaLiters);
  const rawDrop = Math.max(0, input.measuredDropLiters);

  // Le volume réellement manquant après compensation de la pente
  let correctedTrueDropLiters = Number(Math.max(0, rawDrop - apparentDropDueToSlopeLiters).toFixed(2));

  // Si la pente explique à plus de 85% la baisse constatée, c'est un faux positif de dévers !
  const isFalsePositiveSlope =
    Math.abs(gradePct) >= 2.5 &&
    (rawDrop <= apparentDropDueToSlopeLiters * 1.15 || correctedTrueDropLiters < 12.0);

  if (isFalsePositiveSlope) {
    correctedTrueDropLiters = 0.0;
  }

  const explanation = isFalsePositiveSlope
    ? `DÉVERS TOPOGRAPHIQUE : Pente routière de ${gradePct}% (${slopeAngleDeg}°) expliquant une distorsion apparente de ${apparentDropDueToSlopeLiters} L. Fausse alerte confirmée (Perte nette compensée = 0 L).`
    : `Pente routière de ${gradePct}% (${slopeAngleDeg}°). Biais géométrique compensé : ${apparentDropDueToSlopeLiters} L. Perte nette suspecte résiduelle : ${correctedTrueDropLiters} L.`;

  return {
    slopeAngleDeg,
    apparentDropDueToSlopeLiters,
    correctedTrueDropLiters,
    isFalsePositiveSlope,
    explanation,
  };
}

// ============================================================================
// 8. CONTRATS PRE-COMPUTED CONTEXT GRAPH & GREFFIER JURIDIQUE CUSUM
// ============================================================================

export interface PreComputedContextGraphPayload {
  eventId: string;
  timestamp: string;
  vehicleId: string;
  vehiclePlate: string;
  driverPseudonym: string;
  location: {
    latitude: number;
    longitude: number;
    wilayaCode: number;
    wilayaName: string;
    roadName: string;
    roadGradePercent: number;
  };
  telemetry: {
    speedKmh: number;
    engineRpm: number;
    ignitionOn: boolean;
    idleHoursToday: number;
    durationStationarySeconds: number;
  };
  fuelData: {
    tankCapacityLiters: number;
    rawDropLiters: number;
    slopeCorrectionLiters: number;
    correctedNetDropLiters: number;
    fuelPriceDzdPerLiter: number;
    directLossDzd: number;
    cusumScore: number;
  };
  environmentalEvidence: {
    nearestNaftalStationKm: number;
    hasLegitimateFuelReceipt: boolean;
    confidenceScore: number;
    qualification: 'SIPHONNAGE_AVÉRÉ' | 'PIQUAGE_LENT_EN_ROUTE' | 'FAUSSE_ALERTE_PENTE_DÉVERS' | 'NOMINAL';
  };
  hmacSignature: string;
}

export interface BilingualLegalAuditReport {
  reportId: string;
  generatedAt: string;
  qualification: string;
  confidenceScore: number;
  status: 'OPPOSABLE_DISCIPLINAIRE' | 'CLASSEMENT_SANS_SUITE' | 'ENQUETE_COMPLEMENTAIRE';
  frenchReport: {
    titre: string;
    preambule: string;
    constatationsTechniques: string;
    analysePhysiqueEtPente: string;
    prejudiceFinancierDzd: string;
    qualificationJuridique: string;
    recommandationDecisionnelle: string;
  };
  arabicReport: {
    titre: string;
    preambule: string;
    constatationsTechniques: string;
    analysePhysiqueEtPente: string;
    prejudiceFinancierDzd: string;
    qualificationJuridique: string;
    recommandationDecisionnelle: string;
  };
  preComputedGraph: PreComputedContextGraphPayload;
  hmacSignature: string;
}

// ============================================================================
// 7. INNOVATION R&D 1 : HWFA — HYDRAULIC-WORK-FRAUD-AUDITOR (0 CAPTEUR)
// ============================================================================

export interface HydraulicWorkAuditInput {
  engineRpm: number;
  actualTorquePct: number;
  frictionTorquePct?: number;
  fuelRateLh: number;
  coolantTempC: number;
  hydraulicTempC: number;
  boostPressureKpa: number;
  groundSpeedKmh: number;
  durationSeconds: number;
  nominalMaxTorqueNm: number;
  nominalPowerKw: number;
  ambientTempC?: number;
  hourlyRentalRateDzd?: number;
}

export interface HydraulicWorkAuditResult {
  shaftPowerKw: number;
  hydraulicPowerKw: number;
  energyWorkKwh: number;
  caloricEfficiencyEta: number;
  workClassification: 'EXCAVATION_FORTE_CHARGE' | 'MANUTENTION_LEGERE' | 'ATTENTE_ACTIVE' | 'RALENTI_FORCÉ_FRAUDE';
  isFraudulentHoursBilled: boolean;
  unjustifiedBilledCostDzd: number;
  confidenceScore: number;
  proof: string;
}

export function calculateHydraulicWorkAndFraud(input: HydraulicWorkAuditInput): HydraulicWorkAuditResult {
  const rpm = Math.max(0, input.engineRpm);
  const torquePct = Math.max(0, input.actualTorquePct);
  const frictionPct = input.frictionTorquePct ?? 8.0;
  const netTorquePct = Math.max(0, torquePct - frictionPct);
  const fuelRateLh = Math.max(0.1, input.fuelRateLh);
  const durationH = Math.max(1, input.durationSeconds) / 3600.0;
  const hourlyRateDzd = input.hourlyRentalRateDzd ?? 6500;

  // Puissance au volant (Shaft Power) en kW
  const shaftTorqueNm = (netTorquePct / 100.0) * input.nominalMaxTorqueNm;
  const shaftPowerKw = Math.min(input.nominalPowerKw * 1.15, (2 * Math.PI * rpm * shaftTorqueNm) / 60000.0);

  // Pertes parasitaires (climatisation, alternateur, ventilateur visco-coupleur)
  const auxParasiticKw = 6.5 + (rpm / 2000.0) * 8.0;
  const hydraulicPowerKw = Math.max(0, shaftPowerKw - auxParasiticKw);
  const energyWorkKwh = Number((hydraulicPowerKw * durationH).toFixed(2));

  // Puissance calorifique du carburant consommé (PCI gasoil = 42.6 MJ/kg, rho = 0.84 kg/L => 35.784 MJ/L = 9.94 kWh/L)
  const fuelCaloricPowerKw = fuelRateLh * 9.94;
  const caloricEfficiencyEta = fuelCaloricPowerKw > 0 ? Number((hydraulicPowerKw / fuelCaloricPowerKw).toFixed(3)) : 0;

  let classification: HydraulicWorkAuditResult['workClassification'] = 'ATTENTE_ACTIVE';
  let isFraud = false;
  let unjustifiedCostDzd = 0;
  let confidenceScore = 92;

  if (input.groundSpeedKmh > 3.0) {
    classification = 'MANUTENTION_LEGERE';
  } else if (hydraulicPowerKw >= input.nominalPowerKw * 0.40 && caloricEfficiencyEta >= 0.22) {
    classification = 'EXCAVATION_FORTE_CHARGE';
    confidenceScore = 98;
  } else if (hydraulicPowerKw >= input.nominalPowerKw * 0.15 && caloricEfficiencyEta >= 0.10) {
    classification = 'MANUTENTION_LEGERE';
    confidenceScore = 94;
  } else if (rpm >= 1050 && torquePct < 25.0 && hydraulicPowerKw < input.nominalPowerKw * 0.12) {
    classification = 'RALENTI_FORCÉ_FRAUDE';
    isFraud = true;
    confidenceScore = 96;
    // Surcoût = heure de location indue + carburant gaspillé (29.01 DZD/L Naftal)
    unjustifiedCostDzd = Math.round((hourlyRateDzd * durationH) + (fuelRateLh * durationH * 29.01));
  } else {
    classification = 'ATTENTE_ACTIVE';
    confidenceScore = 90;
  }

  const proof = `HWFA: N=${rpm} tr/min, T_net=${netTorquePct.toFixed(1)}%, P_hyd=${hydraulicPowerKw.toFixed(1)} kW ` +
    `(η_calorifique=${caloricEfficiencyEta}, W_hyd=${energyWorkKwh} kWh). Statut: [${classification}] ` +
    (isFraud ? `-> Surfacturation arrêtée: ${unjustifiedCostDzd} DZD` : '');

  return {
    shaftPowerKw: Number(shaftPowerKw.toFixed(1)),
    hydraulicPowerKw: Number(hydraulicPowerKw.toFixed(1)),
    energyWorkKwh,
    caloricEfficiencyEta,
    workClassification: classification,
    isFraudulentHoursBilled: isFraud,
    unjustifiedBilledCostDzd: unjustifiedCostDzd,
    confidenceScore,
    proof,
  };
}

// ============================================================================
// 8. INNOVATION R&D 2 : SES-UEB — SCR-EMULATOR-SNIFFER (0 CAPTEUR CHIMIQUE)
// ============================================================================

export interface ScrAdblueAuditInput {
  exhaustTempInC: number;
  scrTempInC: number;
  scrTempOutC: number;
  defDosingRateGh: number;
  defTankLevelPct: number;
  defConcentrationPct: number;
  fuelRateLh: number;
  engineRpm: number;
  boostPressureKpa: number;
  intakeTempC: number;
  engineDisplacementLiters: number;
  canFrameJitterVarianceMs2?: number;
}

export interface ScrAdblueAuditResult {
  exhaustMassFlowKgs: number;
  theoreticalTempDropC: number;
  measuredTempDropC: number;
  tempDropDiscrepancyC: number;
  systemIntegrity: 'SCR_CONFORME' | 'UREE_ALTEREE_EAU_DETECTEE' | 'EMULATEUR_SCR_PIRATE_ACTIF' | 'INJECTEUR_DEF_COLMATE';
  fraudDetected: boolean;
  tamperingEvidence: string;
  riskDamageCostDzd: number;
  proof: string;
}

export function evaluateScrAdblueIntegrity(input: ScrAdblueAuditInput): ScrAdblueAuditResult {
  const rpm = Math.max(0, input.engineRpm);
  const boostKpa = Math.max(0, input.boostPressureKpa);
  const intakeTk = Math.max(0, input.intakeTempC) + 273.15;
  const fuelRateLh = Math.max(0, input.fuelRateLh);
  const defRateGh = Math.max(0, input.defDosingRateGh);
  const jitterVar = input.canFrameJitterVarianceMs2 ?? 2.8;

  // Calcul du débit massique d'échappement par rendement volumétrique (m_dot_air + m_dot_fuel)
  const pAbsKpa = boostKpa + 101.325;
  const rhoAir = (pAbsKpa * 1000.0) / (287.058 * intakeTk);
  const sweptVolumeM3 = (input.engineDisplacementLiters * 1e-3) / 2.0; // 4 temps
  const airMassFlowKgs = (sweptVolumeM3 * (rpm / 60.0) * 0.88 * rhoAir);
  const fuelMassFlowKgs = (fuelRateLh * 0.84) / 3600.0;
  const exhaustMassFlowKgs = Math.max(0.01, airMassFlowKgs + fuelMassFlowKgs);

  // Bilan calorifique endothermique : évaporation eau (2257 kJ/kg) + thermolyse urée (31.7 kJ/mol / 60g/mol ≈ 528 kJ/kg)
  const qAbsorbedKw = (defRateGh / 3.6e6) * 2650.0; // kW
  const cpExhaust = 1.08; // kJ/(kg·K)
  const theoreticalTempDropC = Number((qAbsorbedKw / (exhaustMassFlowKgs * cpExhaust)).toFixed(2));
  const measuredTempDropC = Number(Math.max(0, input.scrTempInC - input.scrTempOutC).toFixed(2));
  const tempDropDiscrepancyC = Number((measuredTempDropC - theoreticalTempDropC).toFixed(2));

  let integrity: ScrAdblueAuditResult['systemIntegrity'] = 'SCR_CONFORME';
  let isFraud = false;
  let evidence = 'Fonctionnement nominal : abaissement thermique conforme à la stœchiométrie AdBlue.';
  const damageCostDzd = 1850000; // Coût moyen remplacement catalyseur SCR détruit

  // Détection émulateur pirate (trame CAN déclare injection mais delta T mesuré nul, ou jitter figé)
  if (defRateGh > 150.0 && measuredTempDropC < 0.25 && input.exhaustTempInC > 240.0) {
    integrity = 'EMULATEUR_SCR_PIRATE_ACTIF';
    isFraud = true;
    evidence = `Émulateur SCR détecté : Injection déclarée (${defRateGh} g/h) mais abaissement thermique réel nul (mesuré ${measuredTempDropC}°C vs théorique ${theoreticalTempDropC}°C).`;
  } else if (jitterVar < 0.05 && input.defConcentrationPct === 32.5) {
    integrity = 'EMULATEUR_SCR_PIRATE_ACTIF';
    isFraud = true;
    evidence = `Cryptanalyse CAN : Gigue de transmission nulle (Var=${jitterVar} ms²) et concentration statique artificielle (32.500%). Boîtier pirate actif.`;
  } else if (defRateGh > 150.0 && measuredTempDropC > theoreticalTempDropC * 1.85 && input.exhaustTempInC > 240.0) {
    integrity = 'UREE_ALTEREE_EAU_DETECTEE';
    isFraud = true;
    evidence = `Urée altérée : Abaissement thermique excessif (${measuredTempDropC}°C > 1.85x attendu) caractéristique de l'injection d'eau pure non additivée.`;
  } else if (defRateGh === 0 && input.exhaustTempInC > 280.0 && input.fuelRateLh > 15.0) {
    integrity = 'INJECTEUR_DEF_COLMATE';
    evidence = 'Défaut de dosage DEF sous forte charge : injecteur SCR colmaté ou cristallisé.';
  }

  const proof = `SES-UEB: Débit gaz=${exhaustMassFlowKgs.toFixed(3)} kg/s, DEF=${defRateGh} g/h. ` +
    `ΔT_théorique=${theoreticalTempDropC}°C vs ΔT_mesuré=${measuredTempDropC}°C. Statut: [${integrity}] -> ${evidence}`;

  return {
    exhaustMassFlowKgs: Number(exhaustMassFlowKgs.toFixed(3)),
    theoreticalTempDropC,
    measuredTempDropC,
    tempDropDiscrepancyC,
    systemIntegrity: integrity,
    fraudDetected: isFraud,
    tamperingEvidence: evidence,
    riskDamageCostDzd: isFraud ? damageCostDzd : 0,
    proof,
  };
}

// ============================================================================
// 9. INNOVATION R&D 3 : KMSO — KINEMATIC-MICRO-SLIP (0 CAPTEUR TPMS)
// ============================================================================

export interface KinematicMicroSlipInput {
  wheelSpeedLeftKmh: number;
  wheelSpeedRightKmh: number;
  gnssDopplerSpeedKmh: number;
  yawRateDegS: number;
  lateralAccelMs2: number;
  nominalTireRadiusMm?: number;
  engineTorquePct: number;
  nominalColdPressureBar?: number;
}

export interface KinematicMicroSlipResult {
  relativeSpeedDeltaPct: number;
  estimatedDynamicRadiusMm: { left: number; right: number };
  estimatedPressureDeficitBar: number;
  tireIntegrityStatus: 'PRESSION_OPTIMALE' | 'SOUS_GONFLAGE_LEGER' | 'DANGER_ECLATEMENT_IMMINENT' | 'SURCHARGE_ASYMETRIQUE';
  burstRiskAlert: boolean;
  excessFuelLossPer1000KmDzd: number;
  proof: string;
}

export function calculateKinematicMicroSlipTire(input: KinematicMicroSlipInput): KinematicMicroSlipResult {
  const vLeft = Math.max(0.1, input.wheelSpeedLeftKmh);
  const vRight = Math.max(0.1, input.wheelSpeedRightKmh);
  const vGnss = Math.max(0.1, input.gnssDopplerSpeedKmh);
  const r0 = input.nominalTireRadiusMm ?? 518.0; // 315/80 R22.5
  const isStraightLine = Math.abs(input.yawRateDegS) < 0.25 && Math.abs(input.lateralAccelMs2) < 0.20;

  // Écart relatif inter-roues d'un même essieu
  const meanSpeed = (vLeft + vRight) / 2.0;
  const rawDeltaPct = Number((((vLeft - vRight) / meanSpeed) * 100.0).toFixed(3));
  const absDeltaPct = Math.abs(rawDeltaPct);

  // Estimation du rayon dynamique sous charge
  const rLeft = Number((r0 * (vGnss / vLeft)).toFixed(1));
  const rRight = Number((r0 * (vGnss / vRight)).toFixed(1));

  // Affaissement : environ 3.4 mm de rayon perdu par bar de sous-gonflage
  const deltaRadiusMm = Math.abs(rLeft - rRight);
  const estimatedPressureDeficitBar = Number((deltaRadiusMm / 3.4).toFixed(1));

  let status: KinematicMicroSlipResult['tireIntegrityStatus'] = 'PRESSION_OPTIMALE';
  let burstAlert = false;
  let fuelLossDzd = 0;

  if (!isStraightLine) {
    status = 'PRESSION_OPTIMALE'; // Filtre de rejet en virage
  } else if (absDeltaPct >= 1.25 || estimatedPressureDeficitBar >= 1.8) {
    status = 'DANGER_ECLATEMENT_IMMINENT';
    burstAlert = true;
    fuelLossDzd = Math.round(18.5 * 29.01 * 1.5); // +1.5 L/100km sur 1000 km
  } else if (absDeltaPct >= 0.55 || estimatedPressureDeficitBar >= 0.8) {
    status = 'SOUS_GONFLAGE_LEGER';
    fuelLossDzd = Math.round(10.0 * 29.01);
  } else if (absDeltaPct >= 0.35 && Math.abs(input.engineTorquePct) > 60.0) {
    status = 'SURCHARGE_ASYMETRIQUE';
  }

  const proof = `KMSO: V_sol=${vGnss.toFixed(1)} km/h, Δω_relatif=${rawDeltaPct}%, ΔR_dyn=${deltaRadiusMm.toFixed(1)} mm ` +
    `-> Déficit estimé: -${estimatedPressureDeficitBar} bar. Statut: [${status}]`;

  return {
    relativeSpeedDeltaPct: rawDeltaPct,
    estimatedDynamicRadiusMm: { left: rLeft, right: rRight },
    estimatedPressureDeficitBar,
    tireIntegrityStatus: status,
    burstRiskAlert: burstAlert,
    excessFuelLossPer1000KmDzd: fuelLossDzd,
    proof,
  };
}

// ============================================================================
// 10. INNOVATION R&D 4 : BEP-VCO — BRAKE-ENERGY-PARTITIONING (0 DÉMONTAGE)
// ============================================================================

export interface BrakeEnergyPartitioningInput {
  vehicleTotalMassKg: number;
  vehicleSpeedKmh: number;
  roadGradePercent: number;
  retarderTorquePct: number;
  retarderMaxTorqueNm: number;
  brakePedalPositionPct: number;
  durationSeconds: number;
  discHardnessBrinell?: number;
}

export interface BrakeEnergyPartitioningResult {
  gravitationalPowerKw: number;
  retarderPowerKw: number;
  aeroAndRollingPowerKw: number;
  frictionBrakesPowerKw: number;
  retarderUsageRatio: number;
  totalThermalEnergyDissipatedJoules: number;
  estimatedDiscTempC: number;
  archardWearVolumeMm3: number;
  drivingSafetyStatus: 'CONDUITE_EXEMPLAIRE_DISQUES_FROIDS' | 'USURE_ACCELEREE_AVERTISSEMENT' | 'SURCHAUFFE_DANGER_FADE' | 'FACTURE_ATELIER_INJUSTIFIEE';
  fadeRiskAlert: boolean;
  estimatedFinancialLossPerDescentDzd: number;
  proof: string;
}

export function calculateBrakeEnergyPartitioning(input: BrakeEnergyPartitioningInput): BrakeEnergyPartitioningResult {
  const massKg = Math.max(1000, input.vehicleTotalMassKg);
  const vMs = Math.max(0.1, input.vehicleSpeedKmh / 3.6);
  const gradePct = input.roadGradePercent; // négatif en descente (ex: -6%)
  const slopeAngleRad = Math.atan(gradePct / 100.0);
  const dt = Math.max(1, input.durationSeconds);

  // Puissance gravitationnelle en descente (positive si pente descendante)
  const isDownhill = slopeAngleRad < -0.01;
  const gravitationalPowerKw = isDownhill
    ? (massKg * 9.81 * vMs * Math.sin(Math.abs(slopeAngleRad))) / 1000.0
    : 0;

  // Résistance aérodynamique & roulement (Scania R450 ensemble semi-remorque)
  const aeroKw = (0.5 * 1.225 * 6.8 * Math.pow(vMs, 3)) / 1000.0;
  const rollingKw = (0.0055 * massKg * 9.81 * vMs * Math.cos(slopeAngleRad)) / 1000.0;
  const aeroAndRollingKw = Number((aeroKw + rollingKw).toFixed(1));

  // Puissance absorbée par le ralentisseur hydraulique / électromagnétique (Voith / Jake)
  const retarderNm = (Math.max(0, input.retarderTorquePct) / 100.0) * input.retarderMaxTorqueNm;
  // Vitesse de rotation arbre de transmission estimée à cette vitesse (pont 3.08, pneus 518 mm)
  const propShaftRpm = (vMs / (2 * Math.PI * 0.518)) * 60.0 * 3.08;
  const retarderPowerKw = Number(((2 * Math.PI * propShaftRpm * retarderNm) / 60000.0).toFixed(1));

  // Puissance thermique dissipée dans les disques et plaquettes à friction
  const residualPowerKw = Math.max(0, gravitationalPowerKw - aeroAndRollingKw - retarderPowerKw);
  const frictionBrakesPowerKw = Number(residualPowerKw.toFixed(1));

  // Ratio d'usage du ralentisseur (Phi_retarder)
  const totalBrakingKw = retarderPowerKw + frictionBrakesPowerKw;
  const retarderUsageRatio = totalBrakingKw > 0 ? Number((retarderPowerKw / totalBrakingKw).toFixed(2)) : 1.0;

  // Énergie thermique dissipée en Joules
  const totalJoules = Math.round(frictionBrakesPowerKw * 1000.0 * dt);

  // Température estimée des disques de frein (masse disques ~180 kg fonte, Cp=460 J/(kg·K))
  const estimatedDiscTempC = Math.round(70.0 + (totalJoules / (180.0 * 460.0)));

  // Volume d'usure d'Archard (k=1.2e-4, H=210 HB)
  const archardWearVolumeMm3 = Math.round((1.2e-4 * (totalJoules / 210.0)));

  let status: BrakeEnergyPartitioningResult['drivingSafetyStatus'] = 'CONDUITE_EXEMPLAIRE_DISQUES_FROIDS';
  let fadeAlert = false;
  let lossDzd = 0;

  if (estimatedDiscTempC >= 380 || (frictionBrakesPowerKw > 100.0 && dt >= 25)) {
    status = 'SURCHAUFFE_DANGER_FADE';
    fadeAlert = true;
    lossDzd = 145000; // Risque casse disques voilés
  } else if (retarderUsageRatio < 0.65 && isDownhill) {
    status = 'USURE_ACCELEREE_AVERTISSEMENT';
    lossDzd = 35000;
  } else if (retarderUsageRatio >= 0.88) {
    status = 'CONDUITE_EXEMPLAIRE_DISQUES_FROIDS';
  }

  const proof = `BEP-VCO: P_pente=${gravitationalPowerKw.toFixed(1)} kW, P_ralentisseur=${retarderPowerKw} kW, ` +
    `P_freins=${frictionBrakesPowerKw} kW (Φ_retarder=${retarderUsageRatio}, T_disques=${estimatedDiscTempC}°C). Statut: [${status}]`;

  return {
    gravitationalPowerKw: Number(gravitationalPowerKw.toFixed(1)),
    retarderPowerKw,
    aeroAndRollingPowerKw: aeroAndRollingKw,
    frictionBrakesPowerKw,
    retarderUsageRatio,
    totalThermalEnergyDissipatedJoules: totalJoules,
    estimatedDiscTempC,
    archardWearVolumeMm3,
    drivingSafetyStatus: status,
    fadeRiskAlert: fadeAlert,
    estimatedFinancialLossPerDescentDzd: lossDzd,
    proof,
  };
}

// ============================================================================
// 11. INNOVATION R&D 5 : CSIS — CRANKING-SUB-CYCLE-IMPEDANCE (0 CAPTEUR MOTEUR)
// ============================================================================

export interface CrankingCompressionInput {
  engineDisplacementLiters: number;
  cylinderCount: number;
  batteryVoltageSamples250Hz: number[];
  coolantTempC: number;
  crankingRpm: number;
}

export interface CrankingCompressionResult {
  averageCrankingVoltage: number;
  cylinderVoltageDips: { cylinderIndex: number; voltageDipV: number; compressionBalancePct: number }[];
  weakestCylinderIndex: number;
  minCompressionRatioPct: number;
  engineCompressionHealth: 'EQUILIBRAGE_PARFAIT_NEUF' | 'DEGRADATION_LENTE_AVERTISSEMENT' | 'FUITE_CRITIQUE_SOUPAPE_SEGMENT' | 'CONTROLE_BATTERIE_REQUIS';
  needsImmediateWorkshop: boolean;
  estimatedAvoidedEngineCostDzd: number;
  proof: string;
}

export function analyzeCrankingImpedanceCompression(input: CrankingCompressionInput): CrankingCompressionResult {
  const samples = input.batteryVoltageSamples250Hz;
  const cylCount = Math.max(4, Math.min(12, input.cylinderCount));

  if (!samples || samples.length < 20) {
    return {
      averageCrankingVoltage: 24.0,
      cylinderVoltageDips: [],
      weakestCylinderIndex: 1,
      minCompressionRatioPct: 100,
      engineCompressionHealth: 'EQUILIBRAGE_PARFAIT_NEUF',
      needsImmediateWorkshop: false,
      estimatedAvoidedEngineCostDzd: 0,
      proof: 'CSIS: Échantillons insuffisants pour analyse spectrale.',
    };
  }

  const vBaseline = Math.max(...samples);
  const sumV = samples.reduce((acc, v) => acc + v, 0);
  const avgV = Number((sumV / samples.length).toFixed(2));

  // Isoler le début effectif du cranking (dès la première chute de tension)
  const dropIdx = samples.findIndex((v) => v < vBaseline - 1.0);
  const crankingSamples = dropIdx >= 0 && dropIdx < samples.length - cylCount * 4
    ? samples.slice(dropIdx)
    : samples;

  // Détection des creux de tension individuels (minima locaux)
  const windowPerCyl = Math.floor(crankingSamples.length / cylCount);
  const cylinderDips: { cylinderIndex: number; voltageDipV: number; compressionBalancePct: number }[] = [];

  for (let c = 0; c < cylCount; c++) {
    const segment = crankingSamples.slice(c * windowPerCyl, (c + 1) * windowPerCyl);
    const minVal = segment.length > 0 ? Math.min(...segment) : avgV;
    const dip = Math.max(0.1, vBaseline - minVal);
    cylinderDips.push({
      cylinderIndex: c + 1,
      voltageDipV: Number(dip.toFixed(2)),
      compressionBalancePct: 100,
    });
  }

  // Calcul du taux d'équilibrage relatif par rapport à la moyenne des creux
  const avgDip = cylinderDips.reduce((acc, d) => acc + d.voltageDipV, 0) / cylCount;
  let minRatio = Infinity;
  let weakestIdx = 1;

  for (const d of cylinderDips) {
    const ratio = Math.round((d.voltageDipV / avgDip) * 100);
    d.compressionBalancePct = ratio;
    if (ratio < minRatio) {
      minRatio = ratio;
      weakestIdx = d.cylinderIndex;
    }
  }

  let health: CrankingCompressionResult['engineCompressionHealth'] = 'EQUILIBRAGE_PARFAIT_NEUF';
  let workshopAlert = false;
  let avoidedCostDzd = 0;

  if (vBaseline < 21.0) {
    health = 'CONTROLE_BATTERIE_REQUIS';
  } else if (minRatio < 80) {
    health = 'FUITE_CRITIQUE_SOUPAPE_SEGMENT';
    workshopAlert = true;
    avoidedCostDzd = 2200000; // Casse moteur évitée
  } else if (minRatio < 92) {
    health = 'DEGRADATION_LENTE_AVERTISSEMENT';
    avoidedCostDzd = 450000;
  } else {
    health = 'EQUILIBRAGE_PARFAIT_NEUF';
  }

  const proof = `CSIS: ${cylCount} cylindres analysés à 250 Hz. V_base=${vBaseline.toFixed(2)}V, V_moy=${avgV}V. ` +
    `Cylindre le plus faible: #${weakestIdx} (${minRatio}% d'équilibrage relatif). Statut: [${health}]`;

  return {
    averageCrankingVoltage: avgV,
    cylinderVoltageDips: cylinderDips,
    weakestCylinderIndex: weakestIdx,
    minCompressionRatioPct: minRatio,
    engineCompressionHealth: health,
    needsImmediateWorkshop: workshopAlert,
    estimatedAvoidedEngineCostDzd: avoidedCostDzd,
    proof,
  };
}



