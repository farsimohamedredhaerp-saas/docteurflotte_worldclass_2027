/**
 * Pilier D2 : Score de Risque Global Multi-Impôts & Synthèse Actuarielle
 * 
 * Spécifications formelles :
 * 1. Agrégation pondérée des alertes issues des piliers SCF, DGI et Audit.
 * 2. Poids par sévérité et plafonds par famille configurables dans le pack.
 * 3. Note globale normalisée de 0 à 100.
 * 4. Fourchette chiffrée en Dinars Algériens (DZD) distincte par impôt :
 *    - IBS (droits et majorations)
 *    - TVA (rejet de déductibilité et droits)
 *    - Pénalités fiscales, droits d enregistrement & timbre
 * 5. Explication détaillée par contribution.
 * 6. Déterminisme absolu (score identique à chaque rejeu).
 * 7. Compatibilité exécution asynchrone / workers d arrière-plan (pg-boss).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export type TaxCategoryType = 'IBS' | 'TVA' | 'TAP' | 'TIMBRE_PENALTIES' | 'GENERAL';

export interface AuditAlertInput {
  alertId: string;
  ruleCode: string;
  familyCode: string; // Ex: 'SCF', 'DGI_IBS', 'DGI_TVA', 'AUD_CASH', 'AUD_BENFORD', 'AUD_SUPPLIER', 'AUD_RECON'
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  taxCategory?: TaxCategoryType;
  taxExposure?: {
    lowEstimateDzd: DecimalValue | string;
    highEstimateDzd: DecimalValue | string;
  };
  customPoints?: number;
  messageFr: string;
}

export interface SeverityWeightConfig {
  bloquant: number; // ex: 25
  majeur: number; // ex: 10
  mineur: number; // ex: 3
  info: number; // ex: 0
}

export interface FamilyCapConfig {
  [familyCode: string]: number; // Plafond maximal de points par famille
}

export interface GlobalRiskScorerOptions {
  severityWeights?: SeverityWeightConfig;
  familyCaps?: FamilyCapConfig;
  packVersion?: string;
}

export interface TaxExposureBreakdown {
  taxCategory: TaxCategoryType;
  lowEstimateDzd: string;
  highEstimateDzd: string;
  alertCount: number;
}

export interface FamilyScoreContribution {
  familyCode: string;
  rawPoints: number;
  cappedPoints: number;
  capLimit: number;
  alertCount: number;
  taxExposure: {
    lowDzd: string;
    highDzd: string;
  };
  explanationFr: string;
}

export interface GlobalRiskScoreResult {
  overallRiskScore: number; // 0 à 100
  riskLevel: 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE';
  totalAlertsCount: number;
  taxExposureTotal: {
    lowEstimateDzd: string;
    highEstimateDzd: string;
  };
  taxBreakdowns: TaxExposureBreakdown[];
  familyContributions: FamilyScoreContribution[];
  humanReviewRequired: boolean;
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  legalRef: string;
  explanationFr: string;
  trace: RuleExecutionTrace;
}

export class GlobalRiskScorer {
  /**
   * Calcule le score de risque global agrégé de manière déterministe
   */
  public static calculateScore(
    alerts: AuditAlertInput[],
    options: GlobalRiskScorerOptions = {}
  ): GlobalRiskScoreResult {
    const startTime = Date.now();
    const packVersion = options.packVersion ?? 'DZ_AUDIT_2026_V1';

    const severityWeights: SeverityWeightConfig = options.severityWeights ?? {
      bloquant: 25,
      majeur: 10,
      mineur: 3,
      info: 0,
    };

    const familyCaps: FamilyCapConfig = options.familyCaps ?? {
      SCF: 30,
      DGI_IBS: 35,
      DGI_TVA: 25,
      AUD_CASH: 30,
      AUD_BENFORD: 20,
      AUD_SUPPLIER: 25,
      AUD_RECON: 30,
    };

    // Regrouper par famille
    const byFamily = new Map<string, AuditAlertInput[]>();
    for (const a of alerts) {
      const list = byFamily.get(a.familyCode) ?? [];
      list.push(a);
      byFamily.set(a.familyCode, list);
    }

    // Calcul des points par famille avec application des plafonds
    let totalScore = 0;
    const familyContributions: FamilyScoreContribution[] = [];

    // Tri stable des familles pour garantir le déterminisme strict
    const sortedFamilies = Array.from(byFamily.keys()).sort();

    for (const famCode of sortedFamilies) {
      const famAlerts = byFamily.get(famCode)!;
      let rawPoints = 0;
      let famLow = new EngineDecimal('0');
      let famHigh = new EngineDecimal('0');

      for (const alert of famAlerts) {
        if (alert.customPoints !== undefined) {
          rawPoints += alert.customPoints;
        } else {
          switch (alert.severity) {
            case Severity.BLOQUANT:
              rawPoints += severityWeights.bloquant;
              break;
            case Severity.MAJEUR:
              rawPoints += severityWeights.majeur;
              break;
            case Severity.MINEUR:
              rawPoints += severityWeights.mineur;
              break;
            case Severity.INFO:
              rawPoints += severityWeights.info;
              break;
          }
        }

        if (alert.taxExposure) {
          famLow = famLow.plus(EngineMath.asAmount(alert.taxExposure.lowEstimateDzd));
          famHigh = famHigh.plus(EngineMath.asAmount(alert.taxExposure.highEstimateDzd));
        }
      }

      const cap = familyCaps[famCode] ?? 30;
      const capped = Math.min(rawPoints, cap);
      totalScore += capped;

      familyContributions.push({
        familyCode: famCode,
        rawPoints,
        cappedPoints: capped,
        capLimit: cap,
        alertCount: famAlerts.length,
        taxExposure: {
          lowDzd: famLow.toFixed(2),
          highDzd: famHigh.toFixed(2),
        },
        explanationFr: `${famAlerts.length} alerte(s) générant ${rawPoints} pts (plafonné à ${capped}/${cap} pts).`,
      });
    }

    const overallScore = Math.min(100, Math.max(0, totalScore));

    // Décomposition de l'exposition par impôt
    const taxMap = new Map<TaxCategoryType, { low: DecimalValue; high: DecimalValue; count: number }>();
    const knownTaxTypes: TaxCategoryType[] = ['IBS', 'TVA', 'TAP', 'TIMBRE_PENALTIES', 'GENERAL'];

    for (const t of knownTaxTypes) {
      taxMap.set(t, { low: new EngineDecimal('0'), high: new EngineDecimal('0'), count: 0 });
    }

    let grandTotalLow = new EngineDecimal('0');
    let grandTotalHigh = new EngineDecimal('0');

    for (const alert of alerts) {
      if (alert.taxExposure) {
        const cat = alert.taxCategory ?? 'GENERAL';
        const entry = taxMap.get(cat) ?? { low: new EngineDecimal('0'), high: new EngineDecimal('0'), count: 0 };
        const l = EngineMath.asAmount(alert.taxExposure.lowEstimateDzd);
        const h = EngineMath.asAmount(alert.taxExposure.highEstimateDzd);

        entry.low = entry.low.plus(l);
        entry.high = entry.high.plus(h);
        entry.count++;
        taxMap.set(cat, entry);

        grandTotalLow = grandTotalLow.plus(l);
        grandTotalHigh = grandTotalHigh.plus(h);
      }
    }

    const taxBreakdowns: TaxExposureBreakdown[] = knownTaxTypes.map((cat) => {
      const d = taxMap.get(cat)!;
      return {
        taxCategory: cat,
        lowEstimateDzd: d.low.toFixed(2),
        highEstimateDzd: d.high.toFixed(2),
        alertCount: d.count,
      };
    });

    let riskLevel: 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE' = 'FAIBLE';
    if (overallScore >= 75) {
      riskLevel = 'CRITIQUE';
    } else if (overallScore >= 50) {
      riskLevel = 'ELEVE';
    } else if (overallScore >= 25) {
      riskLevel = 'MODERE';
    }

    const hasBlocking = alerts.some((a) => a.severity === Severity.BLOQUANT);
    const humanReviewRequired = overallScore >= 40 || hasBlocking;

    const explanationFr = `Synthèse d audit fiscal et comptable : note de risque globale ${overallScore}/100 (niveau ${riskLevel}), basée sur ${alerts.length} alerte(s). Exposition financière estimée en fourchette : [${grandTotalLow.toFixed(2)} - ${grandTotalHigh.toFixed(2)} DA].`;

    const trace: RuleExecutionTrace = {
      ruleCode: 'AUD-GLOBAL-RISK-SCORE',
      packVersion,
      packHash: 'IN_MEMORY',
      inputs: {
        totalAlerts: alerts.length,
        familiesActive: familyContributions.length,
      },
      parametersRead: {
        severityWeights,
        familyCaps,
      },
      legalRef: 'Code des Procédures Fiscales & Normes d audit',
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
      evaluationTimestamp: new Date().toISOString(),
      executionDurationUs: (Date.now() - startTime) * 1000,
      outcome: overallScore > 0 ? 'RISK_DETECTED' : 'COMPLIANT',
      humanReviewRequired,
      notes: explanationFr,
    };

    return {
      overallRiskScore: overallScore,
      riskLevel,
      totalAlertsCount: alerts.length,
      taxExposureTotal: {
        lowEstimateDzd: grandTotalLow.toFixed(2),
        highEstimateDzd: grandTotalHigh.toFixed(2),
      },
      taxBreakdowns,
      familyContributions,
      humanReviewRequired,
      severity: riskLevel === 'CRITIQUE' || hasBlocking ? Severity.BLOQUANT : riskLevel === 'ELEVE' ? Severity.MAJEUR : Severity.INFO,
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      legalRef: 'Code des Procédures Fiscales & Normes d audit',
      explanationFr,
      trace,
    };
  }

  /**
   * Signature de traitement asynchrone prête pour l intégration dans pg-boss
   */
  public static async evaluateAsyncJob(
    payload: { alerts: AuditAlertInput[]; options?: GlobalRiskScorerOptions }
  ): Promise<GlobalRiskScoreResult> {
    return Promise.resolve(GlobalRiskScorer.calculateScore(payload.alerts, payload.options));
  }
}
