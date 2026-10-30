import {
  Asset,
  AssetCategory,
  DecisionUrgency,
  MeterType,
} from '@docteurflotte/contracts';

export interface EvaluatedRecommendation {
  ruleId: string;
  ruleVersion: string;
  urgency: DecisionUrgency;
  title: string;
  description: string;
  estimatedActionCost: number;
  costInactionRisk: number;
  netExpectedSavings: number;
  confidenceScore: number;
  explanationDossier: {
    inputMetrics: Record<string, any>;
    economicHypotheses: Record<string, any>;
    potentialFailureModes: string[];
    mitigationAction: string;
  };
}

export class DecisionRulesEngine {
  /**
   * Évalue un actif opérationnel et produit des recommandations déterministes explicables.
   * Conforme à AGENTS.md (Section 5.4) & Skill maintenance-economics-decision.
   */
  static evaluateAsset(
    asset: Asset,
    economicRates: {
      hourlyLaborRate?: number;
      inactionRiskMultiplier?: number;
      referenceFuelPricePerLiter?: number;
    } = {},
  ): EvaluatedRecommendation | null {
    const hourlyRate = economicRates.hourlyLaborRate || 1500; // DZD/h par défaut si non paramétré
    const riskMultiplier = economicRates.inactionRiskMultiplier || 3.5;

    const currentVal = Number(asset.currentMeterValue);
    const nextVal = asset.nextMaintenanceMeterValue ? Number(asset.nextMaintenanceMeterValue) : null;

    if (!nextVal) return null;

    // RÈGLE 1 : Échéance kilométrique ou horaire dépassée (Critique)
    if (currentVal >= nextVal) {
      const deltaOverdue = currentVal - nextVal;
      const isOdometer = asset.primaryMeterType === MeterType.ODOMETER_KM;
      const unit = isOdometer ? 'km' : 'heures';

      // Chiffrage de l'intervention préventive programmée
      const estimatedLaborHours = asset.category === AssetCategory.HEAVY_TRUCK ? 4 : 2.5;
      const estimatedPartsCost = asset.category === AssetCategory.HEAVY_TRUCK ? 45000 : 25000;
      const estimatedActionCost = Math.round(estimatedPartsCost + estimatedLaborHours * hourlyRate);

      // Évaluation du risque économique de l'inaction (panne en ligne)
      // Panne sur autoroute/chantier = Remorquage (40k) + Casse mécanique majeure (180k) + Perte exploitation (2j * 60k)
      const costInactionRisk = Math.round(estimatedActionCost * riskMultiplier + (asset.category === AssetCategory.HEAVY_TRUCK ? 120000 : 60000));
      const netExpectedSavings = costInactionRisk - estimatedActionCost;

      return {
        ruleId: 'RULE-DEC-001',
        ruleVersion: '1.2',
        urgency: DecisionUrgency.CRITICAL,
        title: `Échéance de révision critique dépassée (+${deltaOverdue.toLocaleString()} ${unit})`,
        description: `Le compteur validé (${currentVal.toLocaleString()} ${unit}) a franchi le seuil d'intervention (${nextVal.toLocaleString()} ${unit}). Risque de casse composant majeur et immobilisation imprévue en exploitation.`,
        estimatedActionCost,
        costInactionRisk,
        netExpectedSavings,
        confidenceScore: 98,
        explanationDossier: {
          inputMetrics: {
            currentMeterValue: currentVal,
            nextMaintenanceMeterValue: nextVal,
            deltaOverdue,
            meterType: asset.primaryMeterType,
          },
          economicHypotheses: {
            hourlyLaborRateApplied: hourlyRate,
            estimatedLaborHours,
            estimatedPartsCost,
            inactionMultiplier: riskMultiplier,
          },
          potentialFailureModes: [
            'Casse turbocompresseur ou grippage paliers moteur',
            'Arrêt d exploitation non programmé en mission',
            'Frais de remorquage lourd et pénalités de retard client',
          ],
          mitigationAction: `Planifier immédiatement une vidange et révision générale atelier (${estimatedLaborHours}h MO).`,
        },
      };
    }

    // RÈGLE 2 : Préavis d'échéance proche (> 85% de l'intervalle atteint)
    const interval = asset.maintenanceIntervalValue ? Number(asset.maintenanceIntervalValue) : 10000;
    const previousTarget = nextVal - interval;
    const progressPercent = Math.round(((currentVal - previousTarget) / interval) * 100);

    if (progressPercent >= 85) {
      const remaining = nextVal - currentVal;
      const estimatedActionCost = Math.round(22000 + 2 * hourlyRate);
      const costInactionRisk = Math.round(estimatedActionCost * 2.2);

      return {
        ruleId: 'RULE-DEC-002',
        ruleVersion: '1.0',
        urgency: DecisionUrgency.WARNING,
        title: `Préavis d'entretien préventif (${progressPercent}% de cycle atteint)`,
        description: `Il reste ${remaining.toLocaleString()} unités avant l'échéance de maintenance. Approvisionnement des pièces conseillé sous 7 jours ouvrés pour éviter l'arrêt imprévu.`,
        estimatedActionCost,
        costInactionRisk,
        netExpectedSavings: costInactionRisk - estimatedActionCost,
        confidenceScore: 94,
        explanationDossier: {
          inputMetrics: {
            currentMeterValue: currentVal,
            nextMaintenanceMeterValue: nextVal,
            remainingUnits: remaining,
            progressPercentage: progressPercent,
          },
          economicHypotheses: {
            hourlyLaborRateApplied: hourlyRate,
            safetyStockDays: 7,
          },
          potentialFailureModes: [
            'Rupture de stock consommables au franchissement du seuil',
            'Surcoût d approvisionnement en urgence',
          ],
          mitigationAction: 'Pré-commander les filtres et lubrifiants homologués.',
        },
      };
    }

    return null;
  }
}
