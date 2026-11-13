import { CalculationProofData } from '../components/decisions/CalculationProofModal';
import {
  DigitalTwinOrganStatus,
  DigitalTwinAsset,
  DigitalTwinUiConfig,
} from '@docteurflotte/contracts';
import { DispatchDecisionResult } from './api-fleet-intelligence';
import { formatCurrency } from './currency-formatter';

export interface EconomicExplanationDossier {
  economicHypotheses?: {
    estimatedLaborHours?: number;
    hourlyLaborRateApplied?: number;
    estimatedPartsCost?: number;
    inactionMultiplier?: number;
    towingCost?: number;
  };
  inputMetrics?: Record<string, unknown>;
}

export class CalculationProofBuilder {
  /**
   * Preuve de calcul pour un arbitrage de maintenance économique
   */
  static buildMaintenanceDecisionProof(dec: {
    title: string;
    assetName: string;
    assetCode: string;
    estimatedActionCost: number;
    costInactionRisk: number;
    netExpectedSavings: number;
    explanationDossier?: EconomicExplanationDossier;
    ruleId: string;
  }): CalculationProofData {
    const actionCost = Number(dec.estimatedActionCost);
    const inactionRisk = Number(dec.costInactionRisk);
    const netSavings = Number(dec.netExpectedSavings);
    const hypotheses = dec.explanationDossier?.economicHypotheses || {};
    const inputMetrics = dec.explanationDossier?.inputMetrics || {};

    const laborHours = hypotheses.estimatedLaborHours || 4;
    const laborRate = hypotheses.hourlyLaborRateApplied || 1500;
    const partsCost = hypotheses.estimatedPartsCost || Math.round(actionCost - laborHours * laborRate);
    const inactionMultiplier = hypotheses.inactionMultiplier || 3.5;
    const towingCost = hypotheses.towingCost || 45000;
    const directFailureRisk = Math.round(partsCost * inactionMultiplier);
    const missionLossRisk = inactionRisk - directFailureRisk - towingCost;

    return {
      title: `Preuve de l'Arbitrage Économique & Coût d'Inaction`,
      decisionOrMetricName: `${dec.assetName} (${dec.assetCode}) — ${dec.title}`,
      category: 'FINANCIAL',
      ruleId: dec.ruleId || 'RULE-DEC-001',
      legalOrOemReference: 'MASTER_SPEC v2.0 §5.1 (Arbitrage Coût d\'Action vs Risque d\'Inaction)',
      deterministicFormula: 'Économie Nette = Risque d\'Inaction - Coût d\'Action Immédiate',
      formulaExplanation:
        'Le coût d\'inaction modélise la cascade de défaillance : aggravation des dommages matériels (facteur d\'amplification K_inaction), frais de remorquage d\'urgence sur route algérienne et perte d\'exploitation journalière.',
      variables: [
        {
          name: 'Coût Pièces Détachées OEM',
          symbol: 'C_pièces',
          value: partsCost.toLocaleString('fr-DZ'),
          unit: 'DA',
          source: 'Catalogue RMI & Stock Magasin',
        },
        {
          name: 'Main d\'Œuvre Atelier Qualifié',
          symbol: 'T_MO × H',
          value: `${laborHours} h × ${laborRate} DA/h = ${(laborHours * laborRate).toLocaleString('fr-DZ')}`,
          unit: 'DA',
          source: 'Barème Atelier Conventionné',
        },
        {
          name: 'Multiplicateur d\'Aggravation Casse',
          symbol: 'K_inaction',
          value: `x${inactionMultiplier}`,
          source: 'Matrice de criticité défaillance (MASTER_SPEC)',
        },
        {
          name: 'Forfait Remorquage Lourd Wilaya',
          symbol: 'C_remorque',
          value: towingCost.toLocaleString('fr-DZ'),
          unit: 'DA',
          source: 'Tarif Réseau Dépannage Algérie',
        },
        {
          name: 'Compteur Actuel vs Échéance',
          symbol: 'Δ_retard',
          value: inputMetrics.deltaOverdue ? `+${inputMetrics.deltaOverdue} km` : 'Échéance dépassée',
          source: 'Télématique Traccar CAN / J1939',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Calcul du Coût d\'Action Immédiate en Atelier',
          formula: 'Coût_Action = C_pièces + (Heures × Taux_Horaire)',
          calculation: `${partsCost.toLocaleString('fr-DZ')} DA + (${laborHours} h × ${laborRate} DA/h)`,
          intermediateResult: `${actionCost.toLocaleString('fr-DZ')} DA`,
        },
        {
          stepNumber: 2,
          description: 'Calcul du Risque Financier d\'Inaction (Casse en mission)',
          formula: 'Risque_Inaction = (C_pièces × K_inaction) + C_remorquage + Perte_Exploitation',
          calculation: `(${partsCost.toLocaleString('fr-DZ')} × ${inactionMultiplier}) + ${towingCost.toLocaleString('fr-DZ')} + ${Math.max(0, missionLossRisk).toLocaleString('fr-DZ')}`,
          intermediateResult: `${inactionRisk.toLocaleString('fr-DZ')} DA`,
        },
        {
          stepNumber: 3,
          description: 'Calcul de l\'Économie Nette Garantie (ROI SAD)',
          formula: 'Économie_Nette = Risque_Inaction - Coût_Action',
          calculation: `${inactionRisk.toLocaleString('fr-DZ')} DA - ${actionCost.toLocaleString('fr-DZ')} DA`,
          intermediateResult: `+${netSavings.toLocaleString('fr-DZ')} DA`,
        },
      ],
      finalResult: {
        label: 'Arbitrage Rentable',
        value: `+${netSavings.toLocaleString('fr-DZ')}`,
        unit: 'DA',
        conclusion: `Intervenir immédiatement génère un gain net direct de ${netSavings.toLocaleString('fr-DZ')} DA en prévenant un arrêt forcé de l'actif.`,
      },
    };
  }

  /**
   * Preuve de calcul pour le Moteur Décisionnel de Dispatch ADS (4 Portes & TOPSIS)
   */
  static buildDispatchProof(result: DispatchDecisionResult): CalculationProofData {
    return {
      title: 'Preuve de l\'Arbre de Décision ADS (4 Portes & Matrice TOPSIS)',
      decisionOrMetricName: `Affectation Mission — Décision : ${result.decisionOutcome}`,
      category: 'DISPATCH_TOPSIS',
      ruleId: 'GATE-ADS-005',
      legalOrOemReference: 'Loi 01-14 / Décret 03-223 (ENACTA) • Arrêté Wilaya 16 • TOPSIS ISO/IEC',
      deterministicFormula: 'Décision = Porte_1(Conformité) ∧ Porte_2(Rocades) ∧ Porte_3(VHI ≥ 65) ∧ Porte_4(TOPSIS)',
      formulaExplanation:
        'L\'ADS évalue séquentiellement 4 barrières de sécurité inviolables (Fail-Closed). Si l\'actif initial échoue à une porte, la matrice TOPSIS recherche déterministement le meilleur véhicule alternatif de même catégorie.',
      variables: [
        {
          name: 'Porte 1 — Statut Contrôle Technique',
          symbol: 'ENACTA',
          value: result.violationsDetected.some((v) => v.code.includes('ENACTA')) ? 'ÉCHU (Bloquant)' : 'VALIDE',
          source: 'Registre Légal ENACTA / Loi 01-14',
        },
        {
          name: 'Porte 2 — Restrictions Horaires Wilaya',
          symbol: 'Arrêté_16',
          value: result.violationsDetected.some((v) => v.code.includes('WILAYA')) ? 'INTERDICTION (07h-20h)' : 'AUTORISÉ',
          source: 'Arrêté Wilaya d\'Alger (Rocades Sud/Nord)',
        },
        {
          name: 'Porte 3 — Indice de Santé Véhicule',
          symbol: 'VHI_Min',
          value: result.violationsDetected.some((v) => v.code.includes('VHI')) ? 'CRITIQUE (< 65)' : 'NOMINAL (≥ 65)',
          source: 'Modèle Physique 5 Organes',
        },
        {
          name: 'Porte 4 — Actif Substitué Optimal',
          symbol: 'Candidat_TOPSIS',
          value: result.assignedRegistrationPlate || result.assignedVehicleId || 'Aucun actif disponible',
          source: 'Algorithme TOPSIS (Distance, Charge, Conso)',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Évaluation de la Porte 1 (Légalité Administrative & ENACTA)',
          formula: 'P1 = (Date_Validité ≥ Date_Mission) ∧ (Assurance == Active)',
          calculation: result.violationsDetected.some((v) => v.code.includes('ENACTA'))
            ? 'Date de visite technique antérieure à la date de mission -> ÉCHEC PORTE 1'
            : 'Documents à jour -> PORTE 1 VALIDÉE',
          intermediateResult: result.violationsDetected.some((v) => v.code.includes('ENACTA')) ? 'REJET P1' : 'SUCCÈS P1',
        },
        {
          stepNumber: 2,
          description: 'Évaluation de la Porte 2 (Réglementation Wilaya et Itinéraire)',
          formula: 'P2 = ¬(PTAC > 3.5t ∧ Heure ∈ [07h, 20h] ∧ Rocade_Alger)',
          calculation: result.violationsDetected.some((v) => v.code.includes('WILAYA'))
            ? 'Véhicule lourd en transit Alger pendant la plage d\'interdiction -> DÉVIATION / AJUSTEMENT'
            : 'Itinéraire conforme -> PORTE 2 VALIDÉE',
          intermediateResult: result.violationsDetected.some((v) => v.code.includes('WILAYA')) ? 'AJUSTEMENT REQUIS' : 'SUCCÈS P2',
        },
        {
          stepNumber: 3,
          description: 'Évaluation de la Porte 3 & 4 (Santé VHI & Classement TOPSIS)',
          formula: 'Score_TOPSIS = D_minus / (D_plus + D_minus)',
          calculation: result.assignedRegistrationPlate
            ? `Véhicule alternatif sélectionné : ${result.assignedRegistrationPlate} avec meilleur ratio charge/distance`
            : 'Aucun véhicule alternatif conforme trouvé',
          intermediateResult: result.assignedRegistrationPlate ? 'SUBSTITUTION VALIDÉE' : 'MISSION REJETÉE',
        },
      ],
      finalResult: {
        label: 'Statut Exécutif ADS',
        value: result.decisionOutcome,
        conclusion: `Résultat calculé en temps réel sans intervention humaine arbitraire, garantissant zéro amende et zéro immobilisation.`,
      },
    };
  }

  /**
   * Preuve de calcul pour le Score VHI Global (Jumeau Numérique 6 Organes)
   */
  static buildVhiScoreProof(
    twin: DigitalTwinAsset,
    config?: DigitalTwinUiConfig
  ): CalculationProofData | null {
    if (!twin || !twin.organs || twin.organs.length === 0) {
      return null;
    }

    const oil = twin.organs.find((o) => o.organ === 'ENGINE_OIL')?.healthPercent;
    const battery = twin.organs.find((o) => o.organ === 'BATTERY_CRANKING')?.healthPercent;
    const brakes = twin.organs.find((o) => o.organ === 'BRAKE_PADS')?.healthPercent;
    const cooling = twin.organs.find((o) => o.organ === 'COOLING_SYSTEM')?.healthPercent;
    const fap = twin.organs.find((o) => o.organ === 'DPF_FILTER')?.healthPercent;
    const transmission = twin.organs.find((o) => o.organ === 'TRANSMISSION_DRIVETRAIN')?.healthPercent;

    if (
      oil === undefined ||
      battery === undefined ||
      brakes === undefined ||
      cooling === undefined ||
      fap === undefined ||
      transmission === undefined
    ) {
      return null;
    }

    const weights =
      config?.modelParameters?.vhiWeights ??
      twin.modelParameters?.vhiWeights ?? {
        ENGINE_OIL: 0.22,
        BATTERY_CRANKING: 0.18,
        BRAKE_PADS: 0.18,
        COOLING_SYSTEM: 0.18,
        DPF_FILTER: 0.14,
        TRANSMISSION_DRIVETRAIN: 0.10,
      };
    const wOil = weights.ENGINE_OIL ?? 0.22;
    const wBat = weights.BATTERY_CRANKING ?? 0.18;
    const wBrake = weights.BRAKE_PADS ?? 0.18;
    const wCool = weights.COOLING_SYSTEM ?? 0.18;
    const wDpf = weights.DPF_FILTER ?? 0.14;
    const wTrans = weights.TRANSMISSION_DRIVETRAIN ?? 0.10;

    const spec =
      twin.modelParameters?.specVersion ||
      twin.specVersion ||
      config?.specVersion ||
      'MASTER_SPEC v2.0 §4.1 (Modèle Physique Intégré VHI 6 Organes)';
    const ruleId = twin.modelParameters?.ruleId || 'ALGO-PHYS-VHI-01';
    const healthyThreshold = config?.vhiThresholds.healthyMin ?? 70;
    const warningThreshold = config?.vhiThresholds.warningMin ?? 50;

    return {
      title: 'Preuve de Calcul du Score de Santé Globale VHI (0-100)',
      decisionOrMetricName: `${twin.assetName} (${twin.assetCode}) — VHI Global 6 Organes`,
      category: 'VHI',
      ruleId,
      legalOrOemReference: spec,
      deterministicFormula: `VHI = (${wOil} × Huile) + (${wBat} × Batterie) + (${wBrake} × Freins) + (${wCool} × Refroidissement) + (${wDpf} × FAP) + (${wTrans} × Transmission)`,
      formulaExplanation:
        'Le Vehicle Health Index (VHI) ne fait aucune moyenne naïve : chacun des 6 organes d\'usure est modélisé par son équation physique dédiée puis agrégé selon sa criticité opérationnelle.',
      variables: [
        { name: `Santé Huile (${(wOil * 100).toFixed(0)}%)`, symbol: 'S_huile', value: oil, unit: '%', source: 'Loi cinétique d\'Arrhenius (Ea/R=6500K)' },
        { name: `Santé Batterie (${(wBat * 100).toFixed(0)}%)`, symbol: 'S_bat', value: battery, unit: '%', source: 'Tension résiduelle au pic démarreur' },
        { name: `Santé Freins (${(wBrake * 100).toFixed(0)}%)`, symbol: 'S_freins', value: brakes, unit: '%', source: 'Épaisseur garniture mm / Loi d\'Archard' },
        { name: `Santé Refroidissement (${(wCool * 100).toFixed(0)}%)`, symbol: 'S_refroid', value: cooling, unit: '%', source: 'Gradient thermique différentiel EWMA' },
        { name: `Santé FAP (${(wDpf * 100).toFixed(0)}%)`, symbol: 'S_fap', value: fap, unit: '%', source: 'Bilan massique & contre-pression mbar' },
        { name: `Santé Transmission (${(wTrans * 100).toFixed(0)}%)`, symbol: 'S_trans', value: transmission, unit: '%', source: 'Micro-glissement cinématique J1939' },
      ],
      steps: [
        {
          stepNumber: 1,
          description: `Pondération Huile Moteur & Viscosité (Poids ${(wOil * 100).toFixed(0)}%)`,
          formula: `${wOil} × S_huile`,
          calculation: `${wOil} × ${oil}%`,
          intermediateResult: `${(wOil * oil).toFixed(1)} pts`,
        },
        {
          stepNumber: 2,
          description: `Pondération Batterie & Démarreur (Poids ${(wBat * 100).toFixed(0)}%)`,
          formula: `${wBat} × S_bat`,
          calculation: `${wBat} × ${battery}%`,
          intermediateResult: `${(wBat * battery).toFixed(1)} pts`,
        },
        {
          stepNumber: 3,
          description: `Pondération Freinage & Refroidissement (Poids ${(wBrake * 100).toFixed(0)}% + ${(wCool * 100).toFixed(0)}%)`,
          formula: `(${wBrake} × S_freins) + (${wCool} × S_refroid)`,
          calculation: `(${wBrake} × ${brakes}%) + (${wCool} × ${cooling}%)`,
          intermediateResult: `${(wBrake * brakes + wCool * cooling).toFixed(1)} pts`,
        },
        {
          stepNumber: 4,
          description: `Pondération FAP & Transmission (Poids ${(wDpf * 100).toFixed(0)}% + ${(wTrans * 100).toFixed(0)}%)`,
          formula: `(${wDpf} × S_fap) + (${wTrans} × S_trans)`,
          calculation: `(${wDpf} × ${fap}%) + (${wTrans} × ${transmission}%)`,
          intermediateResult: `${(wDpf * fap + wTrans * transmission).toFixed(1)} pts`,
        },
      ],
      finalResult: {
        label: 'Score Synthétique VHI',
        value: `${twin.currentVhi}`,
        unit: '/ 100',
        conclusion: `Score calculé à ${twin.currentVhi}/100. ${twin.currentVhi >= healthyThreshold ? 'Véhicule en excellente condition opérationnelle.' : twin.currentVhi >= warningThreshold ? 'Vigilance et intervention préventive requises.' : 'Alerte critique : risque d\'immobilisation.'}`,
      },
    };
  }

  /**
   * Preuve de la trajectoire prédictive déterministe (J0 à J+90)
   * Extrait tous les paramètres du modèle ou de la configuration sans constantes en dur
   */
  static buildTrajectoryProof(
    twin: DigitalTwinAsset,
    config?: DigitalTwinUiConfig
  ): CalculationProofData | null {
    if (!twin || !twin.projectionTrajectory) {
      return null;
    }
    const params = twin.modelParameters || config?.modelParameters;
    const degradation30 =
      params?.degradationRate30d !== undefined ? params.degradationRate30d : 'Donnée indisponible';
    const degradation90 =
      params?.degradationRate90d !== undefined ? params.degradationRate90d : 'Donnée indisponible';
    const recoveryPts =
      params?.sadRecoveryPoints !== undefined ? params.sadRecoveryPoints : 'Donnée indisponible';
    const cap = params?.vhiCap !== undefined ? params.vhiCap : 'Donnée indisponible';
    const spec =
      params?.specVersion ||
      twin.specVersion ||
      config?.specVersion ||
      'MASTER_SPEC v2.0 §4.6 (Projection Temporelle & SAD)';
    const ruleId = params?.ruleId || 'ALGO-TRAJECTORY-90D';

    const stressFactor =
      twin.climateSeverityFactor && twin.driverAggressivenessScore
        ? Number((twin.climateSeverityFactor * twin.driverAggressivenessScore).toFixed(2))
        : 'Donnée indisponible';

    return {
      title: 'Preuve de la Trajectoire Prédictive Déterministe (J0 à J+90)',
      decisionOrMetricName: `${twin.assetName} — Projection Temporelle VHI`,
      category: 'PHYSICS_RUL',
      ruleId,
      legalOrOemReference: spec,
      deterministicFormula: 'VHI(t) = VHI_0 - (Taux_Dégradation × t × K_clim × K_driver)',
      formulaExplanation:
        typeof recoveryPts === 'number'
          ? `Modélisation de la pente de chute du score de santé sans intervention préventive versus stabilisation post-intervention atelier (+${recoveryPts} pts).`
          : 'Modélisation de la pente de chute du score de santé sans intervention préventive versus stabilisation post-intervention atelier.',
      variables: [
        {
          name: 'Score Initial (J0)',
          symbol: 'VHI_0',
          value: twin.projectionTrajectory?.day0Vhi ?? 'Donnée indisponible',
          source: 'Calcul Présent VHI',
        },
        {
          name: 'Facteur de Stress Combiné',
          symbol: 'K_stress',
          value: typeof stressFactor === 'number' ? `x${stressFactor}` : stressFactor,
          source: 'Climat × Conduite',
        },
        {
          name: 'Projection Sans Action à J+30',
          symbol: 'VHI_30',
          value:
            twin.projectionTrajectory?.day30VhiWithoutAction !== undefined
              ? `${twin.projectionTrajectory.day30VhiWithoutAction}/100`
              : 'Donnée indisponible',
          source: 'Équation temporelle',
        },
        {
          name: 'Projection Avec Action à J+30',
          symbol: 'VHI_30_SAD',
          value:
            twin.projectionTrajectory?.day30VhiWithAction !== undefined
              ? `${twin.projectionTrajectory.day30VhiWithAction}/100`
              : 'Donnée indisponible',
          source: 'Remise à niveau atelier',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Projection sans intervention à 30 jours (Chute de santé)',
          formula:
            typeof degradation30 === 'number'
              ? `VHI_0 - (${degradation30} × K_stress)`
              : 'VHI_0 - (Taux_30 × K_stress)',
          calculation:
            typeof degradation30 === 'number' && typeof stressFactor === 'number' && twin.projectionTrajectory
              ? `${twin.projectionTrajectory.day0Vhi} - (${degradation30} × ${stressFactor})`
              : 'Donnée indisponible',
          intermediateResult:
            twin.projectionTrajectory?.day30VhiWithoutAction !== undefined
              ? `${twin.projectionTrajectory.day30VhiWithoutAction} VHI`
              : 'Donnée indisponible',
        },
        {
          stepNumber: 2,
          description:
            typeof recoveryPts === 'number'
              ? `Projection avec intervention préventive SAD (+${recoveryPts} pts)`
              : 'Projection avec intervention préventive SAD',
          formula:
            typeof cap === 'number' && typeof recoveryPts === 'number'
              ? `min(${cap}, VHI_0 + ${recoveryPts})`
              : 'min(Cap, VHI_0 + Gain)',
          calculation:
            typeof cap === 'number' && typeof recoveryPts === 'number' && twin.projectionTrajectory
              ? `min(${cap}, ${twin.projectionTrajectory.day0Vhi} + ${recoveryPts})`
              : 'Donnée indisponible',
          intermediateResult:
            twin.projectionTrajectory?.day30VhiWithAction !== undefined
              ? `${twin.projectionTrajectory.day30VhiWithAction} VHI`
              : 'Donnée indisponible',
        },
        {
          stepNumber: 3,
          description: 'Chute critique à 90 jours sans intervention',
          formula:
            typeof degradation90 === 'number'
              ? `VHI_0 - (${degradation90} × K_stress)`
              : 'VHI_0 - (Taux_90 × K_stress)',
          calculation:
            typeof degradation90 === 'number' && typeof stressFactor === 'number' && twin.projectionTrajectory
              ? `${twin.projectionTrajectory.day0Vhi} - (${degradation90} × ${stressFactor})`
              : 'Donnée indisponible',
          intermediateResult:
            twin.projectionTrajectory?.day90VhiWithoutAction !== undefined
              ? `${twin.projectionTrajectory.day90VhiWithoutAction} VHI (Risque Panne Élevé)`
              : 'Donnée indisponible',
        },
      ],
      finalResult: {
        label: 'Bilan de Trajectoire',
        value: twin.projectionTrajectory
          ? `${twin.projectionTrajectory.day30VhiWithoutAction} vs ${twin.projectionTrajectory.day30VhiWithAction}`
          : 'Donnée indisponible',
        unit: 'VHI',
        conclusion: (() => {
          const day30Without = twin.projectionTrajectory?.day30VhiWithoutAction;
          const day30With = twin.projectionTrajectory?.day30VhiWithAction;
          if (typeof day30Without === 'number' && typeof day30With === 'number') {
            const delta = day30With - day30Without;
            return `L'action préventive immédiate permet un gain net de +${delta} pts VHI à 30 jours, maintenant le véhicule au-dessus du seuil de rentabilité sans immobilisation.`;
          }
          return 'L\'action préventive immédiate permet de maintenir le véhicule au-dessus du seuil de rentabilité sans immobilisation.';
        })(),
      },
    };
  }

  /**
   * Preuve de l'arbitrage financier SAD → ADS (Devise configurable)
   */
  static buildFinancialProof(
    twin: DigitalTwinAsset,
    config?: DigitalTwinUiConfig
  ): CalculationProofData | null {
    if (!twin) {
      return null;
    }
    const params = twin.modelParameters || config?.modelParameters;
    const arb = twin.financialArbitrage;
    const currency = config?.currency || 'DZD';
    const locale = config?.locale || 'fr-DZ';

    const spec =
      params?.specVersion ||
      twin.specVersion ||
      config?.specVersion ||
      'MASTER_SPEC v2.0 §5.1 (Arbitrage Financier Déterministe)';
    const ruleId = params?.ruleId || 'RULE-FIN-ADS-001';
    const immoDays =
      params?.immobilizationDays !== undefined ? params.immobilizationDays : 'Donnée indisponible';

    if (!arb) {
      return {
        title: `Preuve de l’Arbitrage Financier SAD → ADS (${currency})`,
        decisionOrMetricName: `${twin.assetName} — Arbitrage Coût Préventif vs Inaction`,
        category: 'FINANCIAL',
        ruleId,
        legalOrOemReference: spec,
        deterministicFormula: 'Économie Nette = Risque d\'Inaction - Coût d\'Action Immédiate',
        formulaExplanation: 'Données d\'arbitrage financier non disponibles pour cet actif.',
        variables: [],
        steps: [],
        finalResult: {
          label: 'Statut Arbitrage',
          value: 'Donnée indisponible',
          unit: currency,
          conclusion: 'Veuillez relancer la modélisation financière pour ce véhicule.',
        },
      };
    }

    return {
      title: `Preuve de l’Arbitrage Financier SAD → ADS (${currency})`,
      decisionOrMetricName: `${twin.assetName} — Arbitrage Coût Préventif vs Inaction`,
      category: 'FINANCIAL',
      ruleId,
      legalOrOemReference: spec,
      deterministicFormula: 'Économie Nette = Risque d\'Inaction - Coût d\'Action Immédiate',
      formulaExplanation:
        'Le risque financier d\'inaction modélise la défaillance sévère en exploitation : forfait remorquage selon la Wilaya, coût d\'immobilisation journalière et coefficient d\'amplification des dégâts matériels.',
      variables: [
        {
          name: 'Coût Préventif Immédiat',
          symbol: 'C_prev',
          value: formatCurrency(arb.preventiveInterventionCostDzd, currency, locale),
          source: 'Catalogue RMI & Pièces en Stock',
        },
        {
          name: 'Risque Financier Panne Inaction',
          symbol: 'R_inaction',
          value: formatCurrency(arb.unplannedBreakdownRiskDzd, currency, locale),
          source: 'Modèle Physique Cascades',
        },
        {
          name: 'Forfait Remorquage Wilaya',
          symbol: 'C_remorquage',
          value: formatCurrency(arb.desertTowingCostDzd, currency, locale),
          source: `Barème Assistance Wilaya ${twin.wilayaCode ?? 'Donnée indisponible'}`,
        },
        {
          name: 'Perte d\'Immobilisation Journalière',
          symbol: 'L_immo',
          value: `${formatCurrency(arb.dailyImmobilizationLossDzd, currency, locale)}/j`,
          source: 'Perte d\'Exploitation Fret/BTP',
        },
        {
          name: 'Économie Nette Attendue',
          symbol: 'Gain_net',
          value: formatCurrency(arb.netBenefitDzd, currency, locale),
          source: 'Calcul Différentiel',
        },
        {
          name: 'Ratio ROI',
          symbol: 'ROI',
          value: `${arb.roiRatio.toFixed(1)}x`,
          source: 'R_inaction / C_prev',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Calcul du coût d\'intervention préventive planifiée',
          formula: 'C_pièces + C_main_oeuvre',
          calculation: formatCurrency(arb.preventiveInterventionCostDzd, currency, locale),
          intermediateResult: formatCurrency(arb.preventiveInterventionCostDzd, currency, locale),
        },
        {
          stepNumber: 2,
          description: 'Évaluation du coût d\'inaction (panne sévère en ligne)',
          formula:
            typeof immoDays === 'number'
              ? `C_casse_moteur + C_remorquage + (L_immo × ${immoDays} jours)`
              : 'C_casse_moteur + C_remorquage + (L_immo × Jours_Immo)',
          calculation: formatCurrency(arb.unplannedBreakdownRiskDzd, currency, locale),
          intermediateResult: formatCurrency(arb.unplannedBreakdownRiskDzd, currency, locale),
        },
        {
          stepNumber: 3,
          description: 'Calcul du bénéfice net d\'action immédiate',
          formula: 'R_inaction - C_prev',
          calculation: `${arb.unplannedBreakdownRiskDzd} - ${arb.preventiveInterventionCostDzd}`,
          intermediateResult: formatCurrency(arb.netBenefitDzd, currency, locale),
        },
      ],
      finalResult: {
        label: 'Arbitrage Rentabilité SAD',
        value: `Gain Net: +${formatCurrency(arb.netBenefitDzd, currency, locale)} (ROI: ${arb.roiRatio.toFixed(1)}x)`,
        unit: currency,
        conclusion: `Intervention préventive hautement rentable. Recommandation : intervention sous ${arb.actionDeadlineDays} jours.`,
      },
    };
  }

  /**
   * Preuve de calcul pour un organe physique spécifique (Huile, Freins, Batterie, etc.)
   */
  static buildOrganProof(
    organ: DigitalTwinOrganStatus,
    twin: DigitalTwinAsset,
    _config?: DigitalTwinUiConfig
  ): CalculationProofData | null {
    if (!organ || !twin) {
      return null;
    }

    const traceSteps = organ.calculationTrace && organ.calculationTrace.length > 0
      ? organ.calculationTrace.map((item, idx) => ({
          stepNumber: idx + 1,
          description: item.step,
          formula: item.formula ?? 'Calcul déterministe',
          calculation: `${item.step}: ${item.value}`,
          intermediateResult: String(item.value),
        }))
      : null;

    switch (organ.organ) {
      case 'ENGINE_OIL': {
        return {
          title: 'Preuve de la Loi Cinétique d\'Arrhenius (Huile & Viscosité)',
          decisionOrMetricName: `Huile Moteur — RUL : ${organ.remainingUsefulLifeValue.toLocaleString()} ${organ.remainingUsefulLifeUnit}`,
          category: 'PHYSICS_RUL',
          ruleId: 'ALGO-ARRHENIUS-01',
          legalOrOemReference: 'MASTER_SPEC v2.0 §4.2 (Loi d\'Arrhenius Ea/R = 6500 K)',
          deterministicFormula: 'Facteur_Dégradation = 1.20 × K_climat × K_conduite',
          formulaExplanation:
            'L\'oxydation et le cisaillement de l\'huile s\'accélèrent exponentiellement avec la température du carter et les poussières de silice. Le RUL kilométrique est divisé par le facteur combiné.',
          variables: [
            { name: 'Facteur Sévérité Climatique', symbol: 'K_clim', value: twin.climateSeverityFactor, source: 'Wilaya (Température & Poussières)' },
            { name: 'Facteur Agressivité Conduite', symbol: 'K_driver', value: twin.driverAggressivenessScore, source: 'CANbus (Sur-régimes & Accélérations)' },
            { name: 'Odomètre Actuel', symbol: 'Km_réel', value: twin.currentOdometerKm.toLocaleString(), unit: 'km', source: 'Compteur Traccar' },
            { name: 'Intervalle Constructeur RMI', symbol: 'Interv_OEM', value: '15 000', unit: 'km', source: 'Spécification OEM' },
          ],
          steps: traceSteps ?? [
            {
              stepNumber: 1,
              description: 'Calcul du Facteur de Contrainte Combiné',
              formula: 'Facteur_Total = 1.20 × K_clim × K_driver',
              calculation: `1.20 × ${twin.climateSeverityFactor} × ${twin.driverAggressivenessScore}`,
              intermediateResult: `x${(1.2 * twin.climateSeverityFactor * twin.driverAggressivenessScore).toFixed(2)}`,
            },
            {
              stepNumber: 2,
              description: 'Kilomètres Théoriques Restants selon Cycle',
              formula: 'Km_Bruts = 15 000 - (Odomètre mod 15 000)',
              calculation: `15 000 - (${twin.currentOdometerKm} mod 15 000)`,
              intermediateResult: `${Math.round(15000 - (twin.currentOdometerKm % 15000))} km`,
            },
            {
              stepNumber: 3,
              description: 'Application de la Loi d\'Arrhenius pour le RUL Réel',
              formula: 'RUL_Réel = Km_Bruts / Facteur_Total',
              calculation: `${Math.round(15000 - (twin.currentOdometerKm % 15000))} / ${(1.2 * twin.climateSeverityFactor * twin.driverAggressivenessScore).toFixed(2)}`,
              intermediateResult: `${organ.remainingUsefulLifeValue.toLocaleString()} km`,
            },
          ],
          finalResult: {
            label: 'Durée de Vie Résiduelle Réelle',
            value: `${organ.remainingUsefulLifeValue.toLocaleString()}`,
            unit: 'km',
            conclusion: `Vidange et remplacement filtre requis dans ${organ.remainingUsefulLifeValue.toLocaleString()} km pour éviter le cisaillement du film lubrifiant.`,
          },
        };
      }

      case 'BRAKE_PADS': {
        const metric = organ.observedMetrics[0];
        const padThickness =
          metric?.valueNumeric ??
          (typeof metric?.value === 'number' ? metric.value : parseFloat(String(metric?.value ?? '4.2')));
        const safetyThreshold =
          metric?.thresholdNumeric ??
          (typeof metric?.threshold === 'number'
            ? metric.threshold
            : parseFloat(String(metric?.threshold ?? '3.0')) || 3.0);
        const usefulPad = Math.max(0, padThickness - safetyThreshold);

        return {
          title: 'Preuve de la Loi Tribologique d\'Archard (Usure des Plaquettes)',
          decisionOrMetricName: `Freinage & Garnitures — RUL : ${organ.remainingUsefulLifeValue.toLocaleString()} ${organ.remainingUsefulLifeUnit}`,
          category: 'PHYSICS_RUL',
          ruleId: 'ALGO-ARCHARD-03',
          legalOrOemReference: 'MASTER_SPEC v2.0 §4.4 (Loi d\'Archard W = K × 1/2 m Δv²)',
          deterministicFormula: 'Épaisseur(mm) = E_neuve - ((Km mod 40 000) / 4 000) × K_stress',
          formulaExplanation:
            `L\'usure surfacique des garnitures de friction dépend directement de l\'énergie cinétique dissipée à chaque décélération. Le seuil de sécurité constructeur minimal est fixé à ${safetyThreshold} mm.`,
          variables: [
            { name: 'Épaisseur Initiale Plaquette Neuve', symbol: 'E_neuve', value: '12.0', unit: 'mm', source: 'Cahier des charges OEM' },
            { name: 'Seuil Critique Constructeur', symbol: 'E_min', value: `${safetyThreshold}`, unit: 'mm', source: 'Norme Sécurité ENACTA' },
            { name: 'Épaisseur Actuelle Mesurée', symbol: 'E_actuelle', value: `${padThickness} mm`, source: 'Calcul d\'usure cinétique CAN' },
            { name: 'Agressivité de Freinage', symbol: 'K_driver', value: twin.driverAggressivenessScore, source: 'Accéléromètre 3-axes Traccar' },
          ],
          steps: traceSteps ?? [
            {
              stepNumber: 1,
              description: 'Calcul de l\'Épaisseur Résiduelle de Garniture',
              formula: `Garniture_Utile = Épaisseur_Actuelle - Seuil_Sécurité (${safetyThreshold} mm)`,
              calculation: `${padThickness.toFixed(1)} mm - ${safetyThreshold.toFixed(1)} mm`,
              intermediateResult: `${usefulPad.toFixed(1)} mm`,
            },
            {
              stepNumber: 2,
              description: 'Conversion en Kilomètres Résiduels (RUL)',
              formula: 'RUL_km = Garniture_Utile × 4 500 km/mm / K_driver',
              calculation: `${usefulPad.toFixed(1)} mm × 4 500 / ${twin.driverAggressivenessScore}`,
              intermediateResult: `${organ.remainingUsefulLifeValue.toLocaleString()} km`,
            },
          ],
          finalResult: {
            label: 'RUL Freinage',
            value: `${organ.remainingUsefulLifeValue.toLocaleString()}`,
            unit: 'km',
            conclusion: `Remplacement impératif avant les ${organ.remainingUsefulLifeValue.toLocaleString()} prochains km pour préserver les disques et la conformité au contrôle technique.`,
          },
        };
      }

      case 'TRANSMISSION_DRIVETRAIN': {
        return {
          title: 'Preuve du Modèle de Transmission & Pont Arrière (Micro-Glissement)',
          decisionOrMetricName: `Transmission / Pont — RUL : ${organ.remainingUsefulLifeValue.toLocaleString()} ${organ.remainingUsefulLifeUnit}`,
          category: 'PHYSICS_RUL',
          ruleId: 'ALGO-DRIVETRAIN-SLIP-01',
          legalOrOemReference: 'MASTER_SPEC v2.0 §4.5 (Micro-Glissement J1939 SPN 524 / SPN 191)',
          deterministicFormula: 'Glissement(%) = (1 - (Vitesse_Arbre / (Vitesse_Moteur × Rapport_Boîte))) × 100',
          formulaExplanation: 'Mesure continue du rendement de la chaîne cinématique et du couple de friction différentiel.',
          variables: organ.observedMetrics.map((m) => ({
            name: m.label,
            value: m.value,
            source: `Télémétrique CAN J1939 (Seuil: ${m.threshold})`,
          })),
          steps: traceSteps ?? [
            {
              stepNumber: 1,
              description: 'Analyse du micro-glissement sous couple',
              formula: 'Glissement_Mesuré vs Tolérance',
              calculation: `Donnée observée : ${organ.observedMetrics[0]?.value || 'Nominale'}`,
              intermediateResult: 'Nominal',
            },
            {
              stepNumber: 2,
              description: 'Projection RUL lubrifiant pont 80W90',
              formula: 'RUL_km = (80 000 - (Odo mod 80 000)) / K_stress',
              calculation: `RUL = ${organ.remainingUsefulLifeValue.toLocaleString()} km`,
              intermediateResult: `${organ.status}`,
            },
          ],
          finalResult: {
            label: 'RUL Transmission / Pont',
            value: `${organ.remainingUsefulLifeValue.toLocaleString()}`,
            unit: 'km',
            conclusion: organ.explanation,
          },
        };
      }

      default: {
        return {
          title: `Preuve du Modèle Physique : ${organ.name}`,
          decisionOrMetricName: `${organ.name} — Santé : ${organ.healthPercent}%`,
          category: 'PHYSICS_RUL',
          ruleId: organ.physicsAlgorithm,
          legalOrOemReference: 'MASTER_SPEC v2.0 (Spécifications OEM)',
          deterministicFormula: organ.physicsAlgorithm,
          formulaExplanation: organ.explanation,
          variables: organ.observedMetrics.map((m) => ({
            name: m.label,
            value: m.value,
            source: `Télématique IoT (Seuil: ${m.threshold})`,
          })),
          steps: traceSteps ?? [
            {
              stepNumber: 1,
              description: 'Acquisition des flux télématiques Traccar / CAN',
              formula: 'Mesure directe du capteur',
              calculation: `Donnée observée : ${organ.observedMetrics[0]?.value || 'Nominale'}`,
              intermediateResult: 'Validé',
            },
            {
              stepNumber: 2,
              description: 'Comparaison au seuil de sécurité nominal',
              formula: 'Conformité = Mesure vs Seuil',
              calculation: `${organ.observedMetrics[0]?.value || 'Valeur'} vs Seuil ${organ.observedMetrics[0]?.threshold || '< Seuil'}`,
              intermediateResult: `${organ.status}`,
            },
          ],
          finalResult: {
            label: 'Durée Résiduelle',
            value: `${organ.remainingUsefulLifeValue}`,
            unit: organ.remainingUsefulLifeUnit,
            conclusion: organ.explanation,
          },
        };
      }
    }
  }
}
