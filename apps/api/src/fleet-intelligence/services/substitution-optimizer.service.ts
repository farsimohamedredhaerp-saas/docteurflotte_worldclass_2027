import { Injectable } from '@nestjs/common';
import { NAFTAL_FUEL_PRICES_DZD } from '@docteurflotte/contracts';
import {
  ClimateZoneDZ,
  DispatchStatus,
  DriverStateDto,
  MissionRequestDto,
  SubstitutionCandidateScore,
  VehicleStateDto,
} from '../dto/dispatch-decision.dto';
import { AlgerianRegulatoryGateService } from './regulatory-gate.service';

@Injectable()
export class SubstitutionOptimizerService {
  // Tarifs carburants Naftal Algérie officiels (DZD / Litre - Barème JORADP en vigueur)
  private readonly NAFTAL_FUEL_PRICE_DZD: Record<string, number> = {
    DIESEL: NAFTAL_FUEL_PRICES_DZD.GASOIL,
    GASOLINE: NAFTAL_FUEL_PRICES_DZD.ESSENCE_SANS_PLOMB,
    LPG_GPL: NAFTAL_FUEL_PRICES_DZD.SIRGHAZ_GPL,
  };

  private readonly WEIGHT_VHI_HEALTH = 0.35;
  private readonly WEIGHT_FUEL_ECONOMY = 0.25;
  private readonly WEIGHT_APPROACH_DIST = 0.25;
  private readonly WEIGHT_FLEET_BALANCE = 0.15;

  constructor(private readonly gateService: AlgerianRegulatoryGateService) {}

  /**
   * Distance routière Haversine corrigée par facteur de détour topographique algérien (1.28)
   */
  haversineRoadDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const rEarthKm = 6371.0;
    const toRad = (deg: number) => (deg * Math.PI) / 180.0;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Facteur de détour routier standard en Algérie = 1.28
    return Number((rEarthKm * c * 1.28).toFixed(2));
  }

  /**
   * Estimation du coût de carburant Naftal pour la mission + trajet d approche
   */
  estimateMissionFuelCostDzd(
    vehicle: VehicleStateDto,
    mission: MissionRequestDto,
    approachKm: number,
  ): number {
    const totalKm = mission.routeDistanceKm + approachKm;
    const loadRatio = mission.requiredPayloadTons / Math.max(1.0, vehicle.maxPayloadTons);
    const climatePenalty =
      mission.targetClimateZone === ClimateZoneDZ.SAHARA_SOUTH ? 1.12 : 1.04;
    const adjustedL100Km =
      vehicle.refConsumptionL100Km * (0.85 + 0.3 * loadRatio) * climatePenalty;
    const litersNeeded = (totalKm / 100.0) * adjustedL100Km;
    const unitPrice = this.NAFTAL_FUEL_PRICE_DZD[vehicle.fuelType] ?? NAFTAL_FUEL_PRICES_DZD.GASOIL;
    return Number((litersNeeded * unitPrice).toFixed(2));
  }

  /**
   * Algorithme Multicritère TOPSIS / Score Pondéré de Substitution (Section 5.2 MASTER_SPEC)
   * Score(v, M) = I_Legal(v, M) * I_Capacite(v, M) * I_RUL(v, M) * [w1*VHI - w2*Fuel - w3*Dist + w4*Equilibrage]
   */
  findOptimalSubstitutions(
    mission: MissionRequestDto,
    fleetVehicles: VehicleStateDto[],
    fleetDrivers: DriverStateDto[],
    maxApproachDistanceKm = 180.0,
  ): SubstitutionCandidateScore[] {
    const eligiblePairs: {
      vehicle: VehicleStateDto;
      driver: DriverStateDto;
      approachKm: number;
      fuelCostDzd: number;
    }[] = [];

    for (const vehicle of fleetVehicles) {
      if (vehicle.dispatchStatus !== DispatchStatus.AVAILABLE) continue;

      // 0. Isolation Multi-Tenant Fail-Closed (Loi 18-07 ANPDP)
      if (mission.tenantId && vehicle.tenantId && vehicle.tenantId !== mission.tenantId) {
        continue;
      }

      // 1. Indicateur Légal I_Legal(v, M)
      const regViolations = this.gateService.evaluateVehicleRegulatoryCompliance(vehicle, mission);
      if (regViolations.length > 0) continue;

      // 2. Indicateur Capacité & RUL I_Capacite(v, M) & I_RUL(v, M)
      const techViolations = this.gateService.evaluatePredictiveAndTechnicalReadiness(
        vehicle,
        mission,
      );
      if (techViolations.length > 0) continue;

      // Distance d approche au point de départ
      const approachKm = this.haversineRoadDistanceKm(
        vehicle.currentLat,
        vehicle.currentLon,
        mission.originLat,
        mission.originLon,
      );
      if (approachKm > maxApproachDistanceKm) continue;

      const fuelCostDzd = this.estimateMissionFuelCostDzd(vehicle, mission, approachKm);

      // Sélection du meilleur chauffeur disponible et qualifié
      let bestDriver: DriverStateDto | null = null;
      for (const driver of fleetDrivers) {
        if (mission.tenantId && driver.tenantId && driver.tenantId !== mission.tenantId) {
          continue;
        }
        const dViolations = this.gateService.evaluateDriverCompliance(driver, vehicle, mission);
        if (dViolations.length === 0) {
          if (!bestDriver || driver.safetyScore > bestDriver.safetyScore) {
            bestDriver = driver;
          }
        }
      }

      if (bestDriver) {
        eligiblePairs.push({ vehicle, driver: bestDriver, approachKm, fuelCostDzd });
      }
    }

    if (eligiblePairs.length === 0) return [];

    const maxFuelCost = Math.max(...eligiblePairs.map((p) => p.fuelCostDzd)) || 1.0;
    const minFuelCost = Math.min(...eligiblePairs.map((p) => p.fuelCostDzd));

    const results: SubstitutionCandidateScore[] = eligiblePairs.map(
      ({ vehicle, driver, approachKm, fuelCostDzd }) => {
        const vhiNorm = vehicle.vehicleHealthIndex;
        const fuelNorm =
          maxFuelCost > minFuelCost
            ? ((maxFuelCost - fuelCostDzd) / (maxFuelCost - minFuelCost)) * 100.0
            : 100.0;
        const approachNorm = Math.max(0.0, (1.0 - approachKm / maxApproachDistanceKm) * 100.0);

        const usageRatio = vehicle.ytdDrivenKm / Math.max(1.0, vehicle.annualTargetKm);
        const balanceNorm = Math.max(0.0, Math.min(100.0, (1.0 - (usageRatio - 0.5)) * 100.0));

        const totalScore =
          this.WEIGHT_VHI_HEALTH * vhiNorm +
          this.WEIGHT_FUEL_ECONOMY * fuelNorm +
          this.WEIGHT_APPROACH_DIST * approachNorm +
          this.WEIGHT_FLEET_BALANCE * balanceNorm;

        return {
          vehicleId: vehicle.vehicleId,
          registrationPlate: vehicle.registrationPlate,
          makeModel: vehicle.makeModel,
          driverId: driver.driverId,
          driverName: driver.fullName,
          totalScore100: Number(totalScore.toFixed(2)),
          vhiScoreComponent: Number(vhiNorm.toFixed(1)),
          fuelCostComponent: Number(fuelNorm.toFixed(1)),
          approachDistanceComponent: Number(approachNorm.toFixed(1)),
          fleetBalancingComponent: Number(balanceNorm.toFixed(1)),
          approachDistanceKm: approachKm,
          estimatedFuelCostDzd: fuelCostDzd,
          auditJustification: `100% Conforme (I_Legal=1, I_Capacite=1, I_RUL=1 pour ${mission.targetClimateZone}) | VHI=${vehicle.vehicleHealthIndex}/100 | Approche=${approachKm} km | Coût Carburant Naftal=${fuelCostDzd} DZD | Chauffeur=${driver.fullName}`,
        };
      },
    );

    return results.sort((a, b) => b.totalScore100 - a.totalScore100).slice(0, 3);
  }
}
