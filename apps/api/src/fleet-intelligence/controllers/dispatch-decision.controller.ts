import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  FinancialArbitrageDecision,
  RegulatoryMissionOrderData,
} from '@docteurflotte/contracts';
import {
  DispatchDecisionResult,
  DispatchEvaluationPayloadDto,
  FinancialArbitragePayloadDto,
  MissionOrderIssuanceDto,
  VerifyMissionOrderDto,
  ViolationDetail,
  WorkOrderGenerated,
} from '../dto/dispatch-decision.dto';
import { AlgerianRegulatoryGateService } from '../services/regulatory-gate.service';
import { SubstitutionOptimizerService } from '../services/substitution-optimizer.service';
import { FinancialArbitrageService } from '../services/financial-arbitrage.service';
import {
  RegulatoryMissionOrderService,
  MissionOrderIssuanceRequest,
  VerificationResult,
} from '../services/regulatory-mission-order.service';

export {
  FinancialArbitragePayloadDto,
  MissionOrderIssuanceDto,
  VerifyMissionOrderDto,
};

@Controller('api/v1/dispatch')
export class DispatchDecisionController {
  constructor(
    private readonly gateService: AlgerianRegulatoryGateService,
    private readonly optimizerService: SubstitutionOptimizerService,
    private readonly arbitrageService: FinancialArbitrageService,
    private readonly missionOrderService: RegulatoryMissionOrderService,
  ) {}

  @Post('evaluate-and-assign')
  evaluateAndAssign(@Body() payload: DispatchEvaluationPayloadDto): DispatchDecisionResult {
    const { mission, fleetVehicles, fleetDrivers } = payload;
    const vehiclesMap = new Map(fleetVehicles.map((v) => [v.vehicleId, v]));
    const driversMap = new Map(fleetDrivers.map((d) => [d.driverId, d]));

    const reqVehicle = vehiclesMap.get(mission.requestedVehicleId);
    const reqDriver = driversMap.get(mission.requestedDriverId);

    const allViolations: ViolationDetail[] = [];
    const generatedWorkOrders: WorkOrderGenerated[] = [];

    if (reqVehicle) {
      const vReg = this.gateService.evaluateVehicleRegulatoryCompliance(reqVehicle, mission);
      const vTech = this.gateService.evaluatePredictiveAndTechnicalReadiness(reqVehicle, mission);
      const combined = [...vReg, ...vTech];
      allViolations.push(...combined);

      if (combined.length > 0) {
        generatedWorkOrders.push(
          ...this.gateService.generateAutomatedWorkOrders(reqVehicle, combined),
        );
      }
    }

    if (reqDriver && reqVehicle) {
      allViolations.push(
        ...this.gateService.evaluateDriverCompliance(reqDriver, reqVehicle, mission),
      );
    }

    // Cas A : 0 violation sur le couple demandé -> Autorisation directe (+ ajustement Wilayas)
    if (allViolations.length === 0 && reqVehicle && reqDriver) {
      const wilayaCheck = this.gateService.evaluateWilayaRestrictions(reqVehicle, mission);
      const hasShift =
        wilayaCheck.recommendedEtdUtc !== mission.plannedDepartureUtc ||
        wilayaCheck.avoidPolygons.length > 0;

      return {
        missionId: mission.missionId,
        decisionTimestampUtc: new Date().toISOString(),
        decisionOutcome: hasShift ? 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' : 'APPROVED_AS_REQUESTED',
        assignedVehicleId: reqVehicle.vehicleId,
        assignedRegistrationPlate: reqVehicle.registrationPlate,
        assignedDriverId: reqDriver.driverId,
        assignedDriverName: reqDriver.fullName,
        originalEtdUtc: mission.plannedDepartureUtc,
        recommendedEtdUtc: wilayaCheck.recommendedEtdUtc,
        valhallaAvoidPolygons: wilayaCheck.avoidPolygons,
        routeAdvisoryNotes: wilayaCheck.advisoryNotes,
        violationsDetected: [],
        generatedWorkOrders: [],
        rankedSubstitutions: [],
      };
    }

    // Cas B : Violation détectée -> Substitution automatique multicritère (TOPSIS / Score Pondéré)
    const substitutions = this.optimizerService.findOptimalSubstitutions(
      mission,
      fleetVehicles,
      fleetDrivers,
    );

    if (substitutions.length > 0) {
      const best = substitutions[0];
      const subVehicle = vehiclesMap.get(best.vehicleId)!;
      const wilayaCheck = this.gateService.evaluateWilayaRestrictions(subVehicle, mission);

      return {
        missionId: mission.missionId,
        decisionTimestampUtc: new Date().toISOString(),
        decisionOutcome: 'SUBSTITUTED_AUTOMATICALLY',
        assignedVehicleId: best.vehicleId,
        assignedRegistrationPlate: best.registrationPlate,
        assignedDriverId: best.driverId,
        assignedDriverName: best.driverName,
        originalEtdUtc: mission.plannedDepartureUtc,
        recommendedEtdUtc: wilayaCheck.recommendedEtdUtc,
        valhallaAvoidPolygons: wilayaCheck.avoidPolygons,
        routeAdvisoryNotes: wilayaCheck.advisoryNotes,
        violationsDetected: allViolations,
        generatedWorkOrders,
        rankedSubstitutions: substitutions,
      };
    }

    // Cas C : Aucun véhicule de remplacement éligible
    return {
      missionId: mission.missionId,
      decisionTimestampUtc: new Date().toISOString(),
      decisionOutcome: 'REJECTED_NO_ELIGIBLE_ASSET',
      assignedVehicleId: null,
      assignedRegistrationPlate: null,
      assignedDriverId: null,
      assignedDriverName: null,
      originalEtdUtc: mission.plannedDepartureUtc,
      recommendedEtdUtc: mission.plannedDepartureUtc,
      valhallaAvoidPolygons: [],
      routeAdvisoryNotes: [],
      violationsDetected: allViolations,
      generatedWorkOrders,
      rankedSubstitutions: [],
    };
  }

  /**
   * Évalue le Risque d Inaction vs Action Préventive (SAD -> ADS)
   */
  @Post('financial-arbitrage')
  evaluateFinancialArbitrage(
    @Body() payload: FinancialArbitragePayloadDto,
  ): FinancialArbitrageDecision {
    if (!payload.vehicle || !payload.mission) {
      throw new BadRequestException('Payload invalide : vehicle et mission obligatoires');
    }

    return this.arbitrageService.evaluateArbitrage(payload.vehicle, payload.mission, {
      hourlyLaborRateDzd: payload.hourlyLaborRateDzd,
      clientPenaltyPerHourDzd: payload.clientPenaltyPerHourDzd,
    });
  }

  /**
   * Émet un Ordre de Mission (OM) bilingue FR/AR avec signature hors-ligne HMAC-SHA256
   */
  @Post('mission-order')
  issueMissionOrder(@Body() payload: MissionOrderIssuanceDto): RegulatoryMissionOrderData {
    if (!payload.vehicle || !payload.mission || !payload.driver) {
      throw new BadRequestException('Payload invalide : vehicle, mission et driver obligatoires');
    }

    return this.missionOrderService.issueRegulatoryMissionOrder(
      payload as MissionOrderIssuanceRequest,
    );
  }

  /**
   * Vérifie un Ordre de Mission en mode hors-ligne pour les contrôles routiers
   */
  @Post('verify-mission-order')
  verifyMissionOrder(@Body() payload: VerifyMissionOrderDto): VerificationResult {
    if (!payload.qrPayload || !payload.signatureToken) {
      throw new BadRequestException('qrPayload et signatureToken sont obligatoires');
    }

    return this.missionOrderService.verifyMissionOrderOfflineToken(
      payload.qrPayload,
      payload.signatureToken,
    );
  }
}
