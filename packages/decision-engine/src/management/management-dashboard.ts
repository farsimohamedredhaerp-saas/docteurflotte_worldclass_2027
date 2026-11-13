/**
 * Cockpit Consolidé de Gestion & Contrôle de Gestion Opérationnel
 * 
 * Synthèse décisionnelle multi-dimensionnelle :
 * 1. Comptabilité Analytique (coûts ventilés par centres d activité).
 * 2. Suivi Budgétaire (taux de consommation, alertes de dépassement).
 * 3. Écarts sur Coûts Standards (productivité volume vs dérive tarifaire).
 * 4. Seuil de Rentabilité & Point Mort (marge de sécurité en DZD et jours).
 * 5. BFR Normatif & Trésorerie Prévisionnelle.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';
import { BudgetControlReport } from './budget-control-engine';
import { DirectCostVarianceResult } from './standard-cost-variance';
import { BreakEvenResult } from './break-even-engine';
import { NormativeWcrResult } from './normative-wcr-engine';

export type OperationalHealthStatus = 'EXCELLENT' | 'BON' | 'SOUS_TENSION' | 'CRITIQUE';

export interface ConsolidatedManagementDashboard {
  companyId: string;
  fiscalYear: number;
  period: string;
  healthStatus: OperationalHealthStatus;
  keyMetrics: {
    revenueHt: string;
    operatingResult: string;
    breakEvenRevenueDzd: string;
    safetyMarginDzd: string;
    netWcrDays: string;
    netWcrDzd: string;
    netForecastCashDzd?: string;
    budgetNetVarianceDzd: string;
    budgetOverrunsCount: number;
  };
  centerCostsSummary?: Record<string, string>;
  budgetSummary?: BudgetControlReport;
  breakEvenSummary?: BreakEvenResult;
  wcrSummary?: NormativeWcrResult;
  directCostVariances?: DirectCostVarianceResult[];
  actionRecommendationsFr: string[];
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export interface ManagementDashboardInputs {
  companyId: string;
  fiscalYear: number;
  period: string;
  centerCosts?: Map<string, string>;
  budgetReport?: BudgetControlReport;
  breakEvenResult?: BreakEvenResult;
  wcrResult?: NormativeWcrResult;
  directCostVariances?: DirectCostVarianceResult[];
}

export class ManagementDashboardEngine {
  /**
   * Consolide les différents piliers du contrôle de gestion
   */
  public static generate(
    inputs: ManagementDashboardInputs,
    packVersion = 'DZ_MANAGEMENT_2026_V1'
  ): ConsolidatedManagementDashboard {
    const startTime = Date.now();
    const recommendations: string[] = [];

    // 1. Analyse du seuil de rentabilité
    let revHt = '0.00';
    let opResult = '0.00';
    let beDzd = '0.00';
    let safetyMargin = '0.00';

    if (inputs.breakEvenResult) {
      revHt = inputs.breakEvenResult.revenueHt;
      opResult = inputs.breakEvenResult.operatingResult;
      beDzd = inputs.breakEvenResult.breakEvenRevenueDzd;
      safetyMargin = inputs.breakEvenResult.safetyMarginDzd;

      if (!inputs.breakEvenResult.isProfitable) {
        recommendations.push(
          `Activité déficitaire : engager un plan de réduction des charges fixes ou d optimisation des marges variables (déficit actuel : ${inputs.breakEvenResult.operatingResult} DA).`
        );
      }
    }

    // 2. Analyse budgétaire
    let budgetNetVariance = '0.00';
    let budgetOverruns = 0;

    if (inputs.budgetReport) {
      budgetNetVariance = inputs.budgetReport.netVariance;
      budgetOverruns = inputs.budgetReport.linesOverBudgetCount;

      if (inputs.budgetReport.hasCriticalOverruns) {
        recommendations.push('Gel immédiat des dépenses sur les lignes budgétaires ayant dépassé leur plafond bloquant.');
      } else if (budgetOverruns > 0) {
        recommendations.push(`${budgetOverruns} ligne(s) budgétaire(s) en dépassement : audit des engagements requis.`);
      }
    }

    // 3. Analyse du BFR et Trésorerie
    let netWcrDays = '0.00';
    let netWcrDzd = '0.00';
    let forecastCash: string | undefined;

    if (inputs.wcrResult) {
      netWcrDays = inputs.wcrResult.netWcrDays;
      netWcrDzd = inputs.wcrResult.netWcrDzd;
      forecastCash = inputs.wcrResult.netForecastCashDzd;

      if (inputs.wcrResult.isDeficitRisk) {
        recommendations.push(
          `BFR normatif élevé (${inputs.wcrResult.netWcrDays} jours de CA) entraînant un risque de tension de trésorerie (${inputs.wcrResult.netForecastCashDzd} DA). Négocier les délais clients ou mobiliser du crédit court terme.`
        );
      }
    }

    // 4. Analyse des écarts sur coûts
    if (inputs.directCostVariances && inputs.directCostVariances.length > 0) {
      for (const v of inputs.directCostVariances) {
        if (!v.isTotalFavorable && v.severity === Severity.MAJEUR) {
          recommendations.push(`Surcoût majeur sur ${v.labelFr} (${v.totalVariance} DA) : vérifier le prix unitaire et la consommation.`);
        }
      }
    }

    // 5. Statut de santé globale
    let healthStatus: OperationalHealthStatus = 'BON';
    const isProfitable = inputs.breakEvenResult ? inputs.breakEvenResult.isProfitable : true;
    const isWcrDeficit = inputs.wcrResult ? inputs.wcrResult.isDeficitRisk : false;
    const hasCriticalBudget = inputs.budgetReport ? inputs.budgetReport.hasCriticalOverruns : false;

    if (!isProfitable && isWcrDeficit) {
      healthStatus = 'CRITIQUE';
    } else if (!isProfitable || isWcrDeficit || hasCriticalBudget) {
      healthStatus = 'SOUS_TENSION';
    } else if (budgetOverruns === 0 && inputs.breakEvenResult && parseFloat(inputs.breakEvenResult.safetyIndexRatio) > 0.20) {
      healthStatus = 'EXCELLENT';
    }

    const centerCostsSummary: Record<string, string> = {};
    if (inputs.centerCosts) {
      for (const [code, amt] of inputs.centerCosts.entries()) {
        centerCostsSummary[code] = amt;
      }
    }

    const summaryFr = `Cockpit de gestion ${inputs.period} : Statut ${healthStatus}. CA: ${revHt} DA, Résultat: ${opResult} DA, BFR: ${netWcrDays}j, Dépassements budgétaires: ${budgetOverruns}.`;

    return {
      companyId: inputs.companyId,
      fiscalYear: inputs.fiscalYear,
      period: inputs.period,
      healthStatus,
      keyMetrics: {
        revenueHt: revHt,
        operatingResult: opResult,
        breakEvenRevenueDzd: beDzd,
        safetyMarginDzd: safetyMargin,
        netWcrDays,
        netWcrDzd,
        netForecastCashDzd: forecastCash,
        budgetNetVarianceDzd: budgetNetVariance,
        budgetOverrunsCount: budgetOverruns,
      },
      centerCostsSummary: Object.keys(centerCostsSummary).length > 0 ? centerCostsSummary : undefined,
      budgetSummary: inputs.budgetReport,
      breakEvenSummary: inputs.breakEvenResult,
      wcrSummary: inputs.wcrResult,
      directCostVariances: inputs.directCostVariances,
      actionRecommendationsFr: recommendations,
      trace: {
        ruleCode: 'MANAGEMENT_DASHBOARD_CONSOLIDATION',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          companyId: inputs.companyId,
          period: inputs.period,
          healthStatus,
        },
        parametersRead: {},
        legalRef: 'Tableaux de bord de gestion d entreprise / SCF',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: healthStatus === 'CRITIQUE' ? 'BLOCKED' : healthStatus === 'SOUS_TENSION' ? 'RISK_DETECTED' : 'COMPLIANT',
        humanReviewRequired: healthStatus === 'CRITIQUE' || healthStatus === 'SOUS_TENSION',
        notes: summaryFr,
      },
      summaryFr,
    };
  }
}

