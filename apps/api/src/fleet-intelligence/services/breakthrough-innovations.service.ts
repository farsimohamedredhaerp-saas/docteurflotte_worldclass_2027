import { Injectable, Logger } from '@nestjs/common';
import {
  calculateHydraulicWorkAndFraud,
  evaluateScrAdblueIntegrity,
  calculateKinematicMicroSlipTire,
  calculateBrakeEnergyPartitioning,
  analyzeCrankingImpedanceCompression,
  HydraulicWorkAuditInput,
  HydraulicWorkAuditResult,
  ScrAdblueAuditInput,
  ScrAdblueAuditResult,
  KinematicMicroSlipInput,
  KinematicMicroSlipResult,
  BrakeEnergyPartitioningInput,
  BrakeEnergyPartitioningResult,
  CrankingCompressionInput,
  CrankingCompressionResult,
} from '@docteurflotte/contracts';

export interface ComprehensiveBreakthroughAuditResult {
  vehicleId: string;
  registrationPlate: string;
  timestampUtc: string;
  hydraulicWorkAudit?: HydraulicWorkAuditResult;
  scrAdblueAudit?: ScrAdblueAuditResult;
  kinematicTireAudit?: KinematicMicroSlipResult;
  brakeEnergyAudit?: BrakeEnergyPartitioningResult;
  crankingCompressionAudit?: CrankingCompressionResult;
  totalFinancialRiskDzd: number;
  totalUnjustifiedCostDzd: number;
  recommendedUrgentActions: string[];
}

@Injectable()
export class BreakthroughInnovationsService {
  private readonly logger = new Logger(BreakthroughInnovationsService.name);

  /**
   * Innovation 1 : Audit Travail Hydraulique Réel vs Heures Fantômes (BTPH / Pelles)
   */
  evaluateHydraulicWork(input: HydraulicWorkAuditInput): HydraulicWorkAuditResult {
    const res = calculateHydraulicWorkAndFraud(input);
    if (res.isFraudulentHoursBilled) {
      this.logger.warn(
        `[HWFA FRAUDE DÉTECTÉE] Surfacturation arrêtée : ${res.unjustifiedBilledCostDzd} DZD. Preuve: ${res.proof}`,
      );
    }
    return res;
  }

  /**
   * Innovation 2 : Détection Émulateur SCR / Dilution AdBlue (Poids Lourds / BTPH)
   */
  evaluateScrIntegrity(input: ScrAdblueAuditInput): ScrAdblueAuditResult {
    const res = evaluateScrAdblueIntegrity(input);
    if (res.fraudDetected) {
      this.logger.warn(
        `[SES-UEB ALERTE FRAUDE DÉPOLLUTION] Statut: ${res.systemIntegrity}. Risque: ${res.riskDamageCostDzd} DZD. Preuve: ${res.tamperingEvidence}`,
      );
    }
    return res;
  }

  /**
   * Innovation 3 : Capteur Virtuel de Sous-Gonflage & Risque Éclatement (0 TPMS)
   */
  evaluateKinematicTire(input: KinematicMicroSlipInput): KinematicMicroSlipResult {
    const res = calculateKinematicMicroSlipTire(input);
    if (res.burstRiskAlert) {
      this.logger.error(
        `[KMSO DANGER ÉCLATEMENT PNEUMATIQUE] Écart: ${res.relativeSpeedDeltaPct}% | Déficit: -${res.estimatedPressureDeficitBar} bar`,
      );
    }
    return res;
  }

  /**
   * Innovation 4 : Partitionnement Calorimétrique Descente & Usure Disques (Voith Retarder)
   */
  evaluateBrakeEnergy(input: BrakeEnergyPartitioningInput): BrakeEnergyPartitioningResult {
    const res = calculateBrakeEnergyPartitioning(input);
    if (res.fadeRiskAlert) {
      this.logger.error(
        `[BEP-VCO SURCHAUFFE FREINS / FADE IMMINENT] T_disques: ${res.estimatedDiscTempC}°C | P_freins: ${res.frictionBrakesPowerKw} kW`,
      );
    }
    return res;
  }

  /**
   * Innovation 5 : Oscilloscope Virtuel de Compression Cylindres par ADC 24V (250 Hz)
   */
  evaluateCrankingCompression(input: CrankingCompressionInput): CrankingCompressionResult {
    const res = analyzeCrankingImpedanceCompression(input);
    if (res.needsImmediateWorkshop) {
      this.logger.warn(
        `[CSIS FUITE COMPRESSION CRITIQUE] Cylindre #${res.weakestCylinderIndex} à ${res.minCompressionRatioPct}%. Économie évitée: ${res.estimatedAvoidedEngineCostDzd} DZD`,
      );
    }
    return res;
  }

  /**
   * Bilan d'audit consolidé multi-technologies pour le cockpit décisionnel
   */
  runConsolidatedAudit(payload: {
    vehicleId: string;
    registrationPlate: string;
    hydraulic?: HydraulicWorkAuditInput;
    scr?: ScrAdblueAuditInput;
    tire?: KinematicMicroSlipInput;
    brake?: BrakeEnergyPartitioningInput;
    cranking?: CrankingCompressionInput;
  }): ComprehensiveBreakthroughAuditResult {
    let totalRiskDzd = 0;
    let totalUnjustifiedDzd = 0;
    const actions: string[] = [];

    const hydraulicRes = payload.hydraulic ? this.evaluateHydraulicWork(payload.hydraulic) : undefined;
    if (hydraulicRes) {
      totalUnjustifiedDzd += hydraulicRes.unjustifiedBilledCostDzd;
      if (hydraulicRes.isFraudulentHoursBilled) {
        actions.push(`Émettre un avis de rejet pour surfacturation de ralenti forcé (${hydraulicRes.unjustifiedBilledCostDzd.toLocaleString('fr-DZ')} DZD).`);
      }
    }

    const scrRes = payload.scr ? this.evaluateScrIntegrity(payload.scr) : undefined;
    if (scrRes) {
      totalRiskDzd += scrRes.riskDamageCostDzd;
      if (scrRes.fraudDetected) {
        actions.push(`Inspection physique immédiate : ${scrRes.tamperingEvidence}`);
      }
    }

    const tireRes = payload.tire ? this.evaluateKinematicTire(payload.tire) : undefined;
    if (tireRes) {
      if (tireRes.burstRiskAlert) {
        actions.push(`Arrêt d'urgence recommandé : pneu sous-gonflé critique (-${tireRes.estimatedPressureDeficitBar} bar, risque d'éclatement).`);
      }
    }

    const brakeRes = payload.brake ? this.evaluateBrakeEnergy(payload.brake) : undefined;
    if (brakeRes) {
      totalRiskDzd += brakeRes.estimatedFinancialLossPerDescentDzd;
      if (brakeRes.fadeRiskAlert) {
        actions.push(`Alerte sécurité chauffeur : disques à ${brakeRes.estimatedDiscTempC}°C, engager immédiatement le ralentisseur Voith.`);
      }
    }

    const crankingRes = payload.cranking ? this.evaluateCrankingCompression(payload.cranking) : undefined;
    if (crankingRes) {
      if (crankingRes.needsImmediateWorkshop) {
        actions.push(`Planifier un contrôle des jeux aux soupapes / injecteur sur le cylindre #${crankingRes.weakestCylinderIndex} (déficit de ${100 - crankingRes.minCompressionRatioPct}%).`);
      }
    }

    return {
      vehicleId: payload.vehicleId,
      registrationPlate: payload.registrationPlate,
      timestampUtc: new Date().toISOString(),
      hydraulicWorkAudit: hydraulicRes,
      scrAdblueAudit: scrRes,
      kinematicTireAudit: tireRes,
      brakeEnergyAudit: brakeRes,
      crankingCompressionAudit: crankingRes,
      totalFinancialRiskDzd: totalRiskDzd,
      totalUnjustifiedCostDzd: totalUnjustifiedDzd,
      recommendedUrgentActions: actions,
    };
  }
}

