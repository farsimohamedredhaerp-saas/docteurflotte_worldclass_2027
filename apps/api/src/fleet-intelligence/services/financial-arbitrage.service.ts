import { Injectable, Logger } from '@nestjs/common';
import {
  ClimateZoneDZType,
  FinancialArbitrageDecision,
  InactionRiskCalculationInput,
  evaluateFinancialArbitrageDzd,
  computeFailureProbability,
  DAILY_DOWNTIME_COST_DZD,
  REGIONAL_TOWING_RATES_DZD,
  PREDICTIVE_FAILURE_MODES_CATALOG,
} from '@docteurflotte/contracts';
import {
  ClimateZoneDZ,
  MissionRequestDto,
  VehicleStateDto,
} from '../dto/dispatch-decision.dto';

export interface VehicleFinancialArbitrageRequest {
  vehicle: VehicleStateDto;
  mission: MissionRequestDto;
  hourlyLaborRateDzd?: number;
  clientPenaltyPerHourDzd?: number;
}

@Injectable()
export class FinancialArbitrageService {
  private readonly logger = new Logger(FinancialArbitrageService.name);

  /**
   * Mappe la zone climatique du DTO vers l enum du pack réglementaire
   */
  mapClimateZone(zone: ClimateZoneDZ): ClimateZoneDZType {
    switch (zone) {
      case ClimateZoneDZ.SAHARA_SOUTH:
        return ClimateZoneDZType.SAHARA_SOUTH;
      case ClimateZoneDZ.HIGH_PLATEAUS:
        return ClimateZoneDZType.HIGH_PLATEAUS;
      case ClimateZoneDZ.TELL_URBAN:
      default:
        return ClimateZoneDZType.TELL_URBAN;
    }
  }

  /**
   * Évalue l arbitrage financier prédictif en Dinars Algériens (DZD) pour une mission donnée
   * Formule : Risque_Inaction = P_panne(d_M) * (C_casse + C_remorquage + C_immob * J + C_penalite)
   * Net Savings = Risque_Inaction - C_action
   */
  evaluateArbitrage(
    vehicle: VehicleStateDto,
    mission: MissionRequestDto,
    options?: {
      hourlyLaborRateDzd?: number;
      clientPenaltyPerHourDzd?: number;
    },
  ): FinancialArbitrageDecision {
    const climateZone = this.mapClimateZone(mission.targetClimateZone);

    // Calcul du ratio d usure maximale des sous-systèmes critiques
    let maxOilDegradation = 0.5;
    let maxBrakeWear = 0.4;
    for (const sub of vehicle.subsystemRuls || []) {
      if (sub.taskCode.toLowerCase().includes('oil') || sub.taskCode.toLowerCase().includes('vidange')) {
        maxOilDegradation = Math.max(maxOilDegradation, sub.wearRatioPct / 100.0);
      }
      if (sub.taskCode.toLowerCase().includes('brake') || sub.taskCode.toLowerCase().includes('frein')) {
        maxBrakeWear = Math.max(maxBrakeWear, sub.wearRatioPct / 100.0);
      }
    }

    const input: InactionRiskCalculationInput = {
      missionDistanceKm: mission.routeDistanceKm,
      climateZone,
      vehicleCategory: vehicle.category,
      vehicleHealthIndex: vehicle.vehicleHealthIndex,
      coolingResidualC: vehicle.coolingEwmaResidualC,
      batterySohPct: vehicle.batterySohPct,
      oilDegradationRatio: maxOilDegradation,
      brakeWearRatio: maxBrakeWear,
      hourlyLaborRateDzd: options?.hourlyLaborRateDzd,
      clientPenaltyPerHourDzd: options?.clientPenaltyPerHourDzd,
    };

    const decision = evaluateFinancialArbitrageDzd(
      input,
      vehicle.vehicleId,
      mission.missionId,
    );

    this.logger.log(
      `[Arbitrage DZD] Véhicule ${vehicle.registrationPlate} (VHI=${vehicle.vehicleHealthIndex}) : ` +
        `P_panne=${(decision.inactionRisk.failureProbability * 100).toFixed(1)}% | ` +
        `Risque Inaction=${decision.inactionRisk.totalInactionRiskDzd} DZD | ` +
        `Action Préventive=${decision.preventiveAction.totalPreventiveActionCostDzd} DZD | ` +
        `Économie Nette=${decision.netExpectedSavingsDzd} DZD (ROI x${decision.roiRatio})`,
    );

    return decision;
  }

  /**
   * Analyse comparative multi-actifs au sein d une flotte
   */
  evaluateFleetArbitrage(
    vehicles: VehicleStateDto[],
    mission: MissionRequestDto,
  ): FinancialArbitrageDecision[] {
    return vehicles.map((v) => this.evaluateArbitrage(v, mission));
  }
}

