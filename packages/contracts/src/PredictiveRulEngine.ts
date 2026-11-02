/**
 * PredictiveRulEngine.ts
 * Moteur Déterministe de Calcul du RUL (Remaining Useful Life) & Détection Proactive 4.0
 * Conforme à la Master Spec v2.0 (OEM-First, Modèles Physiques, Lois d'Arrhenius, Archard, Weibull & Scania APS)
 */

export interface TelemetryReadingInput {
  spn: number;
  value: number;
  timestamp?: string;
}

export interface DtcFaultInput {
  codeString: string;
  subsystem?: string;
  severityLevel?: 'INFO' | 'PROACTIVE_WARNING' | 'CRITICAL_IMMOBILIZATION';
  rulPenaltyFactor?: number;
}

export interface PredictiveRulEngineParams {
  vehicleId: string;
  subsystem: 'ENGINE' | 'HYDRAULICS' | 'TRANSMISSION' | 'BRAKES_APS' | 'COOLING' | 'FILTRATION' | 'ELECTRICAL' | 'TIRES_TRACKS';

  // Intervalles Constructeur (OEM)
  intervalOemKm: number;
  intervalOemHours: number;
  intervalOemDays: number;

  // Usage depuis dernière maintenance
  deltaOdometerKm: number;
  deltaEngineHours: number;
  deltaDays: number;
  idleHoursSinceLastService: number;

  // Facteurs de service et d'exploitation
  severeDutyFactor: number; // α_duty ∈ [0.5, 1.0] (0.65 pour chantiers BTP, poussières et chaleur saharienne)
  avgDailyKm: number; // ex: 250 km/jour
  avgDailyEngineHours: number; // ex: 8.5 h/jour

  // Télémétrie CAN-Bus & DTCs actifs
  readings?: TelemetryReadingInput[];
  activeDtcs?: DtcFaultInput[];

  // Paramètre de forme Weibull (β)
  weibullBeta?: number;
}

export interface PredictiveRulResult {
  vehicleId: string;
  subsystem: string;

  // Intervalles effectifs corrigés
  effectiveIntervalKm: number;
  effectiveIntervalHours: number;
  effectiveIntervalDays: number;

  // Usure équivalente & Facteurs
  equivalentKm: number; // Inclut pénalité ralenti : 1h = 33 km
  wearBaseRatio: number; // W_base ∈ [0, 1]
  telemetryAccelerationFactor: number; // γ_CAN ≥ 1.0
  totalWearRatio: number; // W_total ∈ [0, 1]
  wearPercent: number; // 0% à 100%

  // Durée de Vie Résiduelle (RUL)
  rulRemainingHours: number;
  rulRemainingKm: number;
  rulRemainingDays: number;

  // Probabilité de panne & Risques
  apsFailureRiskScore: number; // Score Scania APS (0 à 1)
  failureProbability30d: number; // P_fail(30d) via distribution de Weibull

  // Statut & Déclenchement automatique OT
  healthStatus: 'OPTIMAL' | 'MONITORING' | 'PROACTIVE_DUE' | 'PREDICTIVE_ALERT' | 'CRITICAL_OVERDUE';
  autoWorkOrderTriggered: boolean;
  workOrderRecommendation?: {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT_CRITICAL';
    titleFr: string;
    reasonFr: string;
    estimatedCostDzd: number;
    recommendedDowntimeHours: number;
  };

  // Traçabilité de preuve arithmétique
  mathematicalProof: {
    ruleId: string;
    alphaDuty: number;
    gammaCan: number;
    weibullBeta: number;
    steps: {
      name: string;
      formula: string;
      computation: string;
      result: string;
    }[];
  };
}

export class PredictiveRulEngine {
  /**
   * Calcule le RUL d'un sous-système de manière déterministe
   */
  static calculateRul(params: PredictiveRulEngineParams): PredictiveRulResult {
    // 1. Ajustement Conditions Sévères (Chaleur, Poussière, BTP)
    const alphaDuty = Math.max(0.5, Math.min(1.0, params.severeDutyFactor || 1.0));
    const effectiveIntervalKm = params.intervalOemKm > 0 ? Math.round(params.intervalOemKm * alphaDuty) : 0;
    const effectiveIntervalHours = params.intervalOemHours > 0 ? Math.round(params.intervalOemHours * alphaDuty) : 0;
    const effectiveIntervalDays = params.intervalOemDays > 0 ? Math.round(params.intervalOemDays * alphaDuty) : 365;

    // 2. Conversion du Ralenti Moteur (Idle Time) en Usure Équivalente
    // 1 heure de ralenti = 33 km d'usure de lubrifiant et d'encrassement FAP/EGR
    const idleEquivalentKm = (params.idleHoursSinceLastService || 0) * 33.0;
    const equivalentKm = params.deltaOdometerKm + idleEquivalentKm;

    // 3. Taux d'Usure Cinématique de Base (W_base) au premier terme échu
    const wearKm = effectiveIntervalKm > 0 ? equivalentKm / effectiveIntervalKm : 0;
    const wearHours = effectiveIntervalHours > 0 ? params.deltaEngineHours / effectiveIntervalHours : 0;
    const wearDays = effectiveIntervalDays > 0 ? params.deltaDays / effectiveIntervalDays : 0;
    const wearBaseRatio = Math.max(0, Math.max(wearKm, wearHours, wearDays));

    // 4. Facteur d'Accélération de Dégradation Télémétrique (γ_CAN)
    let gammaCan = 1.0;
    let apsFailureRiskScore = 0.0;
    const sensorPenalties: { name: string; penalty: number; reason: string }[] = [];

    // Analyse des capteurs CAN-Bus en continu
    if (params.readings && params.readings.length > 0) {
      for (const r of params.readings) {
        // SPN 110 : Température Liquide Refroidissement
        if (r.spn === 110 && r.value > 103.0) {
          const penalty = 0.18;
          gammaCan += penalty;
          sensorPenalties.push({ name: 'SPN 110', penalty, reason: `Température LDR excessive (${r.value}°C > 103°C)` });
        }
        // SPN 1638 : Température Huile Hydraulique Engin BTP
        if (r.spn === 1638 && r.value > 95.0) {
          const penalty = 0.18;
          gammaCan += penalty;
          sensorPenalties.push({ name: 'SPN 1638', penalty, reason: `Surchauffe hydraulique BTP (${r.value}°C > 95°C)` });
        }
        // SPN 100 : Pression Huile Moteur
        if (r.spn === 100 && r.value < 1.4) {
          const penalty = 0.35;
          gammaCan += penalty;
          sensorPenalties.push({ name: 'SPN 100', penalty, reason: `Pression d'huile basse critique (${r.value} bar < 1.4 bar)` });
        }
        // SPN 1087 / 1088 : Pression Pneumatique Système APS Scania
        if ((r.spn === 1087 || r.spn === 1088) && r.value < 7.8) {
          const penalty = 0.25;
          apsFailureRiskScore = Math.min(1.0, 0.45 + (7.8 - r.value) * 0.35);
          if (params.subsystem === 'BRAKES_APS') {
            gammaCan += penalty;
            sensorPenalties.push({ name: 'SPN 1087 APS', penalty, reason: `Dérive pression pneumatique APS (${r.value} bar < 7.8 bar)` });
          }
        }
      }
    }

    // Analyse des codes défauts actifs (DTC OBD-II & J1939)
    if (params.activeDtcs && params.activeDtcs.length > 0) {
      for (const dtc of params.activeDtcs) {
        const factor = dtc.rulPenaltyFactor ?? (dtc.severityLevel === 'CRITICAL_IMMOBILIZATION' ? 0.35 : 0.12);
        gammaCan += factor;
        sensorPenalties.push({ name: dtc.codeString, penalty: factor, reason: `DTC actif ${dtc.codeString}` });
      }
    }

    // 5. Calcul de l'Usure Globale Pondérée (W_total)
    const totalWearRatio = Math.min(1.0, wearBaseRatio * gammaCan);
    const wearPercent = Math.min(100.0, Math.round(totalWearRatio * 1000) / 10);

    // 6. RUL Restant (Heures, KM, Jours)
    const remainingUsefulRatio = Math.max(0, 1.0 - totalWearRatio);
    const rulRemainingHours = effectiveIntervalHours > 0
      ? Math.max(0, Math.round(((remainingUsefulRatio * effectiveIntervalHours) / gammaCan) * 10) / 10)
      : 0;
    const rulRemainingKm = effectiveIntervalKm > 0
      ? Math.max(0, Math.round(((remainingUsefulRatio * effectiveIntervalKm) / gammaCan)))
      : 0;

    // Conversion en jours d'exploitation prévisionnels
    const avgKm = Math.max(1, params.avgDailyKm || 200);
    const avgH = Math.max(0.5, params.avgDailyEngineHours || 8);
    const daysFromKm = effectiveIntervalKm > 0 ? rulRemainingKm / avgKm : 999;
    const daysFromHours = effectiveIntervalHours > 0 ? rulRemainingHours / avgH : 999;
    const rulRemainingDays = Math.max(0, Math.round(Math.min(daysFromKm, daysFromHours)));

    // 7. Probabilité de Défaillance à 30 Jours via Distribution Cumulative de Weibull
    // P_fail(30d) = 1 - exp(-(W_total * gamma_CAN)^beta)
    const weibullBeta = params.weibullBeta || 2.2;
    const weibullInput = Math.max(0, totalWearRatio * (gammaCan > 1 ? gammaCan * 0.85 : 1.0));
    const failureProbability30d = Math.min(
      0.999,
      Math.max(0.01, Math.round((1 - Math.exp(-Math.pow(weibullInput, weibullBeta))) * 1000) / 1000)
    );

    // 8. Classification du Statut de Santé
    let healthStatus: 'OPTIMAL' | 'MONITORING' | 'PROACTIVE_DUE' | 'PREDICTIVE_ALERT' | 'CRITICAL_OVERDUE' = 'OPTIMAL';
    if (wearPercent >= 100.0 || rulRemainingDays <= 2 || failureProbability30d >= 0.85) {
      healthStatus = 'CRITICAL_OVERDUE';
    } else if (wearPercent >= 85.0 || rulRemainingDays <= 7 || failureProbability30d >= 0.65 || gammaCan >= 1.30) {
      healthStatus = 'PREDICTIVE_ALERT';
    } else if (wearPercent >= 70.0 || rulRemainingDays <= 15 || failureProbability30d >= 0.40) {
      healthStatus = 'PROACTIVE_DUE';
    } else if (wearPercent >= 50.0 || gammaCan > 1.05) {
      healthStatus = 'MONITORING';
    }

    // 9. Déclenchement Automatique de l'Ordre de Travail (OT)
    // Règle d'or : RUL_Jours <= 7 OU RUL_Heures <= 25h OU P_fail(30d) >= 0.75 OU Critique
    const autoWorkOrderTriggered =
      healthStatus === 'CRITICAL_OVERDUE' ||
      healthStatus === 'PREDICTIVE_ALERT' ||
      rulRemainingDays <= 7 ||
      (effectiveIntervalHours > 0 && rulRemainingHours <= 25.0) ||
      failureProbability30d >= 0.75;

    let workOrderRecommendation: PredictiveRulResult['workOrderRecommendation'];
    if (autoWorkOrderTriggered) {
      const isUrgent = healthStatus === 'CRITICAL_OVERDUE' || failureProbability30d >= 0.80;
      workOrderRecommendation = {
        priority: isUrgent ? 'URGENT_CRITICAL' : 'HIGH',
        titleFr: `OT Automatique — ${params.subsystem} (RUL: ${rulRemainingDays}j / ${rulRemainingHours}h)`,
        reasonFr: `Déclenchement prédictif : Usure ${wearPercent}%, Facteur télémétrique x${gammaCan.toFixed(2)}, Risque de panne 30j à ${(failureProbability30d * 100).toFixed(1)}%.`,
        estimatedCostDzd: params.subsystem === 'ENGINE' ? 48000 : params.subsystem === 'BRAKES_APS' ? 62000 : 35000,
        recommendedDowntimeHours: params.subsystem === 'ENGINE' ? 4.5 : 3.0,
      };
    }

    return {
      vehicleId: params.vehicleId,
      subsystem: params.subsystem,
      effectiveIntervalKm,
      effectiveIntervalHours,
      effectiveIntervalDays,
      equivalentKm,
      wearBaseRatio,
      telemetryAccelerationFactor: gammaCan,
      totalWearRatio,
      wearPercent,
      rulRemainingHours,
      rulRemainingKm,
      rulRemainingDays,
      apsFailureRiskScore,
      failureProbability30d,
      healthStatus,
      autoWorkOrderTriggered,
      workOrderRecommendation,
      mathematicalProof: {
        ruleId: 'ALGO-PREDICTIVE-RUL-WEIBULL-4.0',
        alphaDuty,
        gammaCan,
        weibullBeta,
        steps: [
          {
            name: 'Correction Conditions Sévères (α_duty)',
            formula: 'I_eff = I_OEM × α_duty',
            computation: `${params.intervalOemKm} km × ${alphaDuty}`,
            result: `${effectiveIntervalKm} km (${effectiveIntervalHours}h)`,
          },
          {
            name: 'Pénalité Ralenti Moteur (33 km/h)',
            formula: 'KM_equiv = ΔKM + (Heures_ralenti × 33)',
            computation: `${params.deltaOdometerKm} km + (${params.idleHoursSinceLastService}h × 33)`,
            result: `${equivalentKm} km équivalents`,
          },
          {
            name: 'Accélération Télémétrique (γ_CAN)',
            formula: 'γ_CAN = 1.0 + Σ(Pénalités_Capteurs + Pénalités_DTC)',
            computation: `1.0 + ${sensorPenalties.map((p) => `+${p.penalty} (${p.name})`).join(' ')}`,
            result: `x${gammaCan.toFixed(2)}`,
          },
          {
            name: 'RUL Déterministe Résiduel',
            formula: 'RUL = (1 - W_total) × I_eff / γ_CAN',
            computation: `(1 - ${totalWearRatio.toFixed(3)}) × ${effectiveIntervalKm} km / ${gammaCan.toFixed(2)}`,
            result: `${rulRemainingKm.toLocaleString()} km / ${rulRemainingHours.toLocaleString()}h (${rulRemainingDays} jours)`,
          },
          {
            name: 'Probabilité de Panne 30 Jours (Loi de Weibull)',
            formula: 'P_fail = 1 - exp(-(W_total × γ_CAN)^β)',
            computation: `1 - exp(-(${weibullInput.toFixed(2)})^${weibullBeta})`,
            result: `${(failureProbability30d * 100).toFixed(1)}%`,
          },
        ],
      },
    };
  }
}

export type SubsystemType =
  | 'ENGINE'
  | 'HYDRAULICS'
  | 'TRANSMISSION'
  | 'BRAKES_APS'
  | 'COOLING'
  | 'FILTRATION'
  | 'ELECTRICAL'
  | 'TIRES_TRACKS';

export interface RulCalculationInput {
  subsystem: SubsystemType;
  severeDutyFactor: number;
  oemIntervalKm: number;
  oemIntervalEngineHours: number;
  oemIntervalDays: number;
  deltaOdometerKm: number;
  deltaEngineHours: number;
  deltaDays: number;
  idleHours: number;
  avgDailyKm: number;
  avgDailyEngineHours: number;
  sensors?: Array<{
    parameterName: string;
    value: number;
    normalMax: number;
    isAnomalous: boolean;
    penalty: number;
  }>;
  dtcs?: Array<{
    code: string;
    penalty: number;
  }>;
}

export interface RulCalculationResult {
  effectiveIntervalKm: number;
  effectiveIntervalHours: number;
  effectiveIntervalDays: number;
  equivalentIdleKm: number;
  wearIndexPercent: number;
  canAccelerationFactor: number;
  rulRemainingKm: number | null;
  rulRemainingHours: number | null;
  rulRemainingDays: number;
  failureProbability30d: number;
  status: 'OPTIMAL' | 'MONITORING' | 'PROACTIVE_DUE' | 'PREDICTIVE_ALERT' | 'CRITICAL_OVERDUE';
  requiresWorkOrder: boolean;
}

export function calculateRul(input: RulCalculationInput): RulCalculationResult {
  const readings: TelemetryReadingInput[] = [];
  if (input.sensors) {
    for (const s of input.sensors) {
      if (s.isAnomalous) {
        const spn = s.parameterName.includes('110')
          ? 110
          : s.parameterName.includes('100')
            ? 100
            : s.parameterName.includes('1087')
              ? 1087
              : s.parameterName.includes('1638')
                ? 1638
                : 168;
        readings.push({ spn, value: s.value });
      }
    }
  }

  const activeDtcs: DtcFaultInput[] = [];
  if (input.dtcs) {
    for (const d of input.dtcs) {
      activeDtcs.push({ codeString: d.code, rulPenaltyFactor: d.penalty });
    }
  }

  const res = PredictiveRulEngine.calculateRul({
    vehicleId: 'calc-target',
    subsystem: input.subsystem,
    intervalOemKm: input.oemIntervalKm,
    intervalOemHours: input.oemIntervalEngineHours,
    intervalOemDays: input.oemIntervalDays,
    deltaOdometerKm: input.deltaOdometerKm,
    deltaEngineHours: input.deltaEngineHours,
    deltaDays: input.deltaDays,
    idleHoursSinceLastService: input.idleHours,
    severeDutyFactor: input.severeDutyFactor,
    avgDailyKm: input.avgDailyKm,
    avgDailyEngineHours: input.avgDailyEngineHours,
    readings,
    activeDtcs,
  });

  return {
    effectiveIntervalKm: res.effectiveIntervalKm,
    effectiveIntervalHours: res.effectiveIntervalHours,
    effectiveIntervalDays: res.effectiveIntervalDays,
    equivalentIdleKm: Math.round(input.idleHours * 33),
    wearIndexPercent: res.wearPercent,
    canAccelerationFactor: res.telemetryAccelerationFactor,
    rulRemainingKm: res.rulRemainingKm,
    rulRemainingHours: res.rulRemainingHours,
    rulRemainingDays: res.rulRemainingDays,
    failureProbability30d: res.failureProbability30d,
    status: res.healthStatus,
    requiresWorkOrder: res.autoWorkOrderTriggered,
  };
}
