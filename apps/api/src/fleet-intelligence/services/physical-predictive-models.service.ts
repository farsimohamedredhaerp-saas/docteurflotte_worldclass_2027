import { Injectable, Logger } from '@nestjs/common';
import {
  calculateArrheniusOilDegradation,
  evaluateBatteryHealth,
  evaluateThermalResidual,
  calculateArchardBrakeWear,
  evaluateDpfAndInjectorHealth,
  detectFuelTheftCusum,
  calculateUnifiedVhi,
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
    } = {}
  ): FullVehiclePhysicalHealthReport {
    // 1. Modèle Huile Arrhenius
    const oilTemp = event.coolantTempC !== null ? event.coolantTempC + 8 : 95; // Si capteur huile absent, approximation thermodynamique coolant+8°C
    const oil = this.computeOilDegradation({
      deltaTripKm: event.odometerKm ?? 200,
      idleHours: event.engineHoursSec ? event.engineHoursSec / 3600.0 * 0.25 : 2.0,
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
    const rawLevels = context.historicalFuelLevels && context.historicalFuelLevels.length > 0
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

