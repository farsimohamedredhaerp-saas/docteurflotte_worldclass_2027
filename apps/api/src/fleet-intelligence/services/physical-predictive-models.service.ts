import { Injectable, Logger } from '@nestjs/common';
import {
  calculateArrheniusOilDegradation,
  evaluateBatteryHealth,
  evaluateThermalResidual,
  calculateArchardBrakeWear,
  evaluateDpfAndInjectorHealth,
  detectFuelTheftCusum,
  calculateUnifiedVhi,
  calculateTankSlopeCorrection,
  ArrheniusOilInput,
  ArrheniusOilResult,
  BatteryHealthInput,
  BatteryHealthResult,
  ThermalResidualInput,
  ThermalResidualResult,
  ArchardBrakeInput,
  ArchardBrakeResult,
  DpfInjectorHealthInput,
  DpfInjectorHealthResult,
  FuelTheftDetectionInput,
  FuelTheftDetectionResult,
  UnifiedVhiInput,
  UnifiedVhiResult,
  TelemetryTier,
  assertTierSupportsFeature,
  NAFTAL_FUEL_PRICES_DZD,
  ALGERIA_58_WILAYAS_PROFILES,
} from '@docteurflotte/contracts';
import { CanonicalTelemetryEvent } from '../dto/telemetry-ingestion.dto';

export interface FullVehiclePhysicalHealthReport {
  vehicleId: string;
  calculatedAt: string;
  vhiScore: number;
  rating: UnifiedVhiResult['rating'];
  oil: ArrheniusOilResult;
  battery: BatteryHealthResult;
  thermal: ThermalResidualResult;
  brakes: ArchardBrakeResult;
  dpf: DpfInjectorHealthResult;
  fuelSecurity: FuelTheftDetectionResult;
  globalProof: string;
}

export interface CorridorArrheniusInput {
  telemetryTier: TelemetryTier;
  assetCode: string;
  currentKm: number;
  baselineIntervalKm: number;
  wilayaCode: number;
  corridorSilicaFactor?: number; // e.g. 1.45 pour Sahara / RN1 Sud
  engineProfile?: 'SHACMAN_WEICHAI' | 'RENAULT_DXI' | 'MAN_D26' | 'MERCEDES_OM501' | 'STANDARD';
  ambientTempC?: number;
  canMeasuredOilTempC?: number; // Requis en Mode 2
  engineLoadPct?: number;
  idleHours?: number;
}

export interface CorridorArrheniusResult {
  assetCode: string;
  telemetryTier: TelemetryTier;
  rulRemainingKm: number;
  effectiveWearMultiplier: number;
  oilDegradationScore: number;
  isSaharaSevereCondition: boolean;
  wilayaSevereFactor: number;
  silicaSevereFactor: number;
  engineProfileMultiplier: number;
  thermalKineticMultiplier: number;
  nextRecommendedOilChangeKm: number;
  calculationProof: string;
}

export interface TopographicCusumInput {
  telemetryTier: TelemetryTier;
  assetCode: string;
  fuelTankCapacityLiters: number;
  rawLevelsLiters: number[];
  roadGradePercent: number; // Valhalla elevation grade (ex: 7.5%)
  tankLengthMeters?: number;
  sensorOffsetRatio?: number;
  fuelUnitPriceDzd?: number;
  previousCusumScore?: number;
}

export interface TopographicCusumResult {
  assetCode: string;
  telemetryTier: TelemetryTier;
  isTheftConfirmed: boolean;
  isFalsePositiveSlope: boolean;
  apparentDropDueToSlopeLiters: number;
  netLossCompensatedLiters: number;
  financialPrejudiceDzd: number;
  cusumScore: number;
  slopeAngleDeg: number;
  confidenceScore: number;
  explanation: string;
}

@Injectable()
export class PhysicalPredictiveModelsService {
  private readonly logger = new Logger(PhysicalPredictiveModelsService.name);

  computeOilDegradation(input: ArrheniusOilInput): ArrheniusOilResult {
    return calculateArrheniusOilDegradation(input);
  }

  computeBatteryHealth(input: BatteryHealthInput): BatteryHealthResult {
    return evaluateBatteryHealth(input);
  }

  computeThermalResidual(input: ThermalResidualInput): ThermalResidualResult {
    return evaluateThermalResidual(input);
  }

  computeBrakeWear(input: ArchardBrakeInput): ArchardBrakeResult {
    return calculateArchardBrakeWear(input);
  }

  computeDpfInjectorHealth(input: DpfInjectorHealthInput): DpfInjectorHealthResult {
    return evaluateDpfAndInjectorHealth(input);
  }

  detectFuelTheft(input: FuelTheftDetectionInput): FuelTheftDetectionResult {
    return detectFuelTheftCusum(input);
  }

  evaluateVehicleHealthIndex(input: UnifiedVhiInput): UnifiedVhiResult {
    return calculateUnifiedVhi(input);
  }

  /**
   * Calcul déterministe du Remaining Useful Life (RUL) de l'huile et des filtres
   * pondéré par le corridor, la silice abrasive, le profil moteur et le palier télématique.
   */
  computeCorridorArrheniusRul(input: CorridorArrheniusInput): CorridorArrheniusResult {
    const wilayaProfile =
      ALGERIA_58_WILAYAS_PROFILES.find((w) => w.code === input.wilayaCode) ||
      ALGERIA_58_WILAYAS_PROFILES[15]; // Alger (code 16)
    const isSahara =
      [1, 11, 30, 33, 37, 47, 49, 53, 54].includes(input.wilayaCode) ||
      (wilayaProfile && wilayaProfile.ambientTempSummerC >= 42);

    const wilayaSevereFactor = wilayaProfile ? wilayaProfile.oilArrheniusFactor : 1.1;
    const silicaSevereFactor =
      input.corridorSilicaFactor ??
      (wilayaProfile ? wilayaProfile.dustSilicaFactor : isSahara ? 1.4 : 1.05);

    // Multiplicateur profil moteur
    let engineMultiplier = 1.0;
    switch (input.engineProfile) {
      case 'SHACMAN_WEICHAI':
        engineMultiplier = 1.20; // Plus fort jeu de dilatation et contraintes poussière
        break;
      case 'MERCEDES_OM501':
        engineMultiplier = 1.10;
        break;
      case 'RENAULT_DXI':
      case 'MAN_D26':
      default:
        engineMultiplier = 1.0;
        break;
    }

    // Cinétique d'Arrhenius (Ea/R = 6500 K)
    let effectiveOilTempC = 92;
    if (input.telemetryTier === TelemetryTier.MODE_2_CAN_J1939 && input.canMeasuredOilTempC !== undefined) {
      effectiveOilTempC = input.canMeasuredOilTempC;
    } else {
      // En Mode 0 ou Mode 1, estimation basée sur température ambiante de la Wilaya
      const ambient = input.ambientTempC ?? wilayaProfile.ambientTempSummerC;
      effectiveOilTempC = 88 + (ambient - 25) * 0.45;
    }

    const tKelvin = effectiveOilTempC + 273.15;
    const tRefKelvin = 90 + 273.15;
    const thermalKineticMultiplier = Math.exp(6500 * (1 / tRefKelvin - 1 / tKelvin));

    const totalWearMultiplier = Math.max(
      1.0,
      Math.round(thermalKineticMultiplier * wilayaSevereFactor * silicaSevereFactor * engineMultiplier * 100) / 100,
    );

    // Calcul RUL restant
    const kmDriven = input.currentKm;
    const equivalentKmDriven = kmDriven * totalWearMultiplier;
    const rulRemainingKm = Math.max(0, Math.round(input.baselineIntervalKm - equivalentKmDriven));
    const nextRecommendedKm = kmDriven + rulRemainingKm;

    const oilScore = Math.max(0, Math.min(100, Math.round(100 * (1 - equivalentKmDriven / input.baselineIntervalKm))));

    const calculationProof = `Arrhenius XAI: T_huile=${effectiveOilTempC.toFixed(1)}°C (k_th=${thermalKineticMultiplier.toFixed(2)}) * Wilaya_${input.wilayaCode}(${wilayaSevereFactor.toFixed(2)}) * Silice(${silicaSevereFactor.toFixed(2)}) * Moteur_${input.engineProfile || 'STD'}(${engineMultiplier.toFixed(2)}) = Multiplicateur ${totalWearMultiplier.toFixed(2)}x. RUL restant: ${rulRemainingKm} km.`;

    return {
      assetCode: input.assetCode,
      telemetryTier: input.telemetryTier,
      rulRemainingKm,
      effectiveWearMultiplier: totalWearMultiplier,
      oilDegradationScore: oilScore,
      isSaharaSevereCondition: isSahara,
      wilayaSevereFactor,
      silicaSevereFactor,
      engineProfileMultiplier: engineMultiplier,
      thermalKineticMultiplier: Math.round(thermalKineticMultiplier * 100) / 100,
      nextRecommendedOilChangeKm: nextRecommendedKm,
      calculationProof,
    };
  }

  /**
   * CUSUM carburant compensé par la pente routière Valhalla
   * avec garde-fou d'honnêteté fonctionnelle sur le palier d'équipement.
   */
  computeTopographicCompensatedCusum(input: TopographicCusumInput): TopographicCusumResult {
    // 1. Honnêteté de palier : Pas de détection fine en Mode 0
    if (input.telemetryTier === TelemetryTier.MODE_0_DECLARATIVE) {
      return {
        assetCode: input.assetCode,
        telemetryTier: input.telemetryTier,
        isTheftConfirmed: false,
        isFalsePositiveSlope: false,
        apparentDropDueToSlopeLiters: 0,
        netLossCompensatedLiters: 0,
        financialPrejudiceDzd: 0,
        cusumScore: 0,
        slopeAngleDeg: 0,
        confidenceScore: 0.1,
        explanation: 'Indisponible en Mode 0 (Déclaratif pur sans sonde de jauge temps réel). Équipement Mode 2 requis.',
      };
    }

    const levels = input.rawLevelsLiters;
    const first = levels[0] ?? 0;
    const last = levels[levels.length - 1] ?? first;
    const rawDrop = Math.max(0, first - last);

    // 2. Correction physique de déclivite via Valhalla
    const slopeCorrection = calculateTankSlopeCorrection({
      tankCapacityLiters: input.fuelTankCapacityLiters,
      roadGradePercent: input.roadGradePercent,
      measuredDropLiters: rawDrop,
      tankLengthMeters: input.tankLengthMeters ?? 1.8,
      sensorOffsetRatio: input.sensorOffsetRatio ?? 0.25,
    });

    const netLoss = slopeCorrection.correctedTrueDropLiters;
    const unitPrice = input.fuelUnitPriceDzd ?? NAFTAL_FUEL_PRICES_DZD.GASOIL;
    const isTheft = netLoss >= 15.0 && !slopeCorrection.isFalsePositiveSlope;
    const financialPrejudice = isTheft ? Math.round(netLoss * unitPrice * 100) / 100 : 0;

    const cusumScore = isTheft ? Math.min(100, Math.round(netLoss * 2.5)) : 0;

    return {
      assetCode: input.assetCode,
      telemetryTier: input.telemetryTier,
      isTheftConfirmed: isTheft,
      isFalsePositiveSlope: slopeCorrection.isFalsePositiveSlope,
      apparentDropDueToSlopeLiters: slopeCorrection.apparentDropDueToSlopeLiters,
      netLossCompensatedLiters: netLoss,
      financialPrejudiceDzd: financialPrejudice,
      cusumScore,
      slopeAngleDeg: slopeCorrection.slopeAngleDeg,
      confidenceScore: slopeCorrection.isFalsePositiveSlope ? 0.98 : isTheft ? 0.94 : 0.90,
      explanation: slopeCorrection.explanation,
    };
  }

  /**
   * Orchestration complète des 6 modèles physiques à partir de la télémétrie temps réel
   */
  evaluateFullVehiclePhysicalHealth(
    event: CanonicalTelemetryEvent,
    context: {
      vehicleMassKg?: number;
      fuelTankCapacityLiters?: number;
      nominalOilIntervalKm?: number;
      wilayaCode?: string;
      previousThermalEwma?: number;
      previousCusumScore?: number;
      historicalFuelLevels?: number[];
    } = {},
  ): FullVehiclePhysicalHealthReport {
    // 1. Modèle Huile Arrhenius
    const oilTemp = event.coolantTempC !== null ? event.coolantTempC + 8 : 95;
    const oil = this.computeOilDegradation({
      deltaTripKm: event.odometerKm ?? 200,
      idleHours: event.engineHoursSec ? (event.engineHoursSec / 3600.0) * 0.25 : 2.0,
      ptoOrAcEngaged: event.ptoEngaged,
      oilTempC: oilTemp,
      engineLoadPct: event.engineLoadPct ?? 50,
      wilayaCodeOrName: context.wilayaCode,
      nominalIntervalKm: context.nominalOilIntervalKm ?? 30000,
    });

    // 2. Modèle Batterie Cranking & SOH
    const batteryMv = event.batteryMv ?? 24200;
    const is24V = batteryMv > 16000;
    const battery = this.computeBatteryHealth({
      systemVoltage: is24V ? 24 : 12,
      minCrankingVoltageV: is24V ? 20.2 : 10.1,
      ambientTempC: event.ambientTempC ?? 32,
      chargingVoltageV: batteryMv / 1000.0,
    });

    // 3. Modèle Thermique Résiduel (EWMA)
    const thermal = this.computeThermalResidual({
      measuredCoolantTempC: event.coolantTempC ?? 88,
      engineLoadPct: event.engineLoadPct ?? 50,
      ambientTempC: event.ambientTempC ?? 32,
      speedKmh: event.speedKmh,
      previousEwmaResidual: context.previousThermalEwma,
    });

    // 4. Modèle Freins Archard
    const brakes = this.computeBrakeWear({
      vehicleMassKg: context.vehicleMassKg ?? 26000,
      initialSpeedKmh: event.speedKmh > 20 ? event.speedKmh : 70,
      finalSpeedKmh: 0,
      retarderTorquePct: event.retarderTorquePct ?? 50,
    });

    // 5. Modèle FAP & Dérive Injecteurs
    const dpf = this.computeDpfInjectorHealth({
      fuelRateLPerHour: event.fuelRateLPerHour ?? 24.5,
      engineRpm: event.engineRpm ?? 1450,
      engineLoadPct: event.engineLoadPct ?? 60,
    });

    // 6. Modèle Sécurité Carburant CUSUM
    const rawLevels =
      context.historicalFuelLevels && context.historicalFuelLevels.length > 0
        ? context.historicalFuelLevels
        : [350, 349, 348, 348, 347];
    const fuelSecurity = this.detectFuelTheft({
      fuelTankCapacityLiters: context.fuelTankCapacityLiters ?? 400,
      rawLevelsLiters: rawLevels,
      canConsumedLitersTotal: event.fuelUsedTotalL ?? undefined,
      ignitionOn: event.ignitionOn,
      vehicleSpeedKmh: event.speedKmh,
      previousCusumScore: context.previousCusumScore,
    });

    // Synthèse VHI 0-100
    const vhi = this.evaluateVehicleHealthIndex({
      oilHealthScore: oil.oilHealthScore,
      batteryHealthScore: battery.sohPercent,
      thermalHealthScore: thermal.thermalHealthScore,
      brakeHealthScore: brakes.brakeHealthScore,
      dpfHealthScore: dpf.dpfHealthScore,
      fuelSecurityScore: fuelSecurity.fuelSecurityScore,
    });

    return {
      vehicleId: event.vehicleId,
      calculatedAt: new Date().toISOString(),
      vhiScore: vhi.vhiScore,
      rating: vhi.rating,
      oil,
      battery,
      thermal,
      brakes,
      dpf,
      fuelSecurity,
      globalProof: vhi.proof,
    };
  }
}
