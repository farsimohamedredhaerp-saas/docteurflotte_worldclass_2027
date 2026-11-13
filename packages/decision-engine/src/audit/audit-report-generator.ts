/**
 * Générateur de Rapport d'Audit & Synthèse de Risque Légal Consolidé
 * 
 * RÈGLE 5 : Explicabilité & Traçabilité intégrale.
 * RÈGLE 6 : Indicateurs et signaux de risque, AUCUNE accusation.
 * 
 * Regroupe l'ensemble des modules d'audit de la Phase 6 :
 * - Analyse de Benford (anomalies statistiques numériques)
 * - Détection de fractionnement de factures (art. 19 bis CPF)
 * - Contrôle d'intégrité de caisse (solde créditeur art. 43 CPF & ordre intra-journalier)
 * - Seuils de paiements en espèces (IBS art. 169 CIDTA, TVA, secteurs interdits)
 * - Validation syntaxique des identifiants fiscaux (NIF, NIS, AI, RC)
 * - Incohérences de ratios de gestion (marge brute, rotation stock, DSO)
 */

import { DecimalValue, EngineDecimal, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';
import { BenfordAnalysisResult } from './benford-analyzer';
import { SplittingDetectionResult } from './invoice-splitting-detector';
import { CashAuditResult } from './cash-register-auditor';
import { CashThresholdCheckResult } from './cash-threshold-checker';
import { IdentifierValidationResult } from './identifier-syntax-validator';
import { RatioAnalysisResult } from './ratio-anomaly-detector';

export type GlobalRiskLevel = 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';

export interface AuditFinding {
  code: string;
  category: 'STATISTICAL' | 'SPLITTING' | 'CASH_REGISTER' | 'CASH_THRESHOLD' | 'IDENTIFIER' | 'RATIO';
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  legalReference: string;
  titleFr: string;
  detailsFr: string;
  recommendedActionFr: string;
  financialExposureDzd?: string;
}

export interface ConsolidatedAuditReport {
  companyId: string;
  fiscalYear: number;
  reportDate: string;
  overallRiskLevel: GlobalRiskLevel;
  totalFindingsCount: number;
  findingsBySeverity: {
    bloquant: number;
    majeur: number;
    mineur: number;
    info: number;
  };
  totalEstimatedExposureDzd: string;
  findings: AuditFinding[];
  benfordSummary?: string;
  splittingSummary?: string;
  cashRegisterSummary?: string;
  cashThresholdSummary?: string;
  identifierSummary?: string;
  ratioSummary?: string;
  trace: RuleExecutionTrace;
  globalConclusionFr: string;
}

export interface AuditReportInputs {
  companyId: string;
  fiscalYear: number;
  highRiskExposureThreshold?: DecimalValue | string;
  benfordResults?: BenfordAnalysisResult[];
  splittingResult?: SplittingDetectionResult;
  cashAuditResult?: CashAuditResult;
  cashThresholdResult?: CashThresholdCheckResult;
  identifierResults?: IdentifierValidationResult[];
  ratioResult?: RatioAnalysisResult;
}

export class AuditReportGenerator {
  /**
   * Consolide l'ensemble des résultats d'audit en un rapport d'audit exhaustif
   */
  public static generate(
    inputs: AuditReportInputs,
    packVersion = 'DZ_AUDIT_2026_V1'
  ): ConsolidatedAuditReport {
    const startTime = Date.now();
    const findings: AuditFinding[] = [];
    let totalExposure = new EngineDecimal('0');

    // 1. Analyse Benford
    let benfordSummary: string | undefined;
    if (inputs.benfordResults && inputs.benfordResults.length > 0) {
      for (const res of inputs.benfordResults) {
        if (res.isApplicable && res.conformityLevel === 'NON_CONFORMITY_RISK') {
          findings.push({
            code: `BENFORD_${res.testType}_ANOMALY`,
            category: 'STATISTICAL',
            severity: Severity.MAJEUR,
            evidenceLevel: EvidenceLevel.STATISTICAL,
            legalReference: 'Normes ISA 240 / Détection d anomalies numériques',
            titleFr: `Écart statistique significatif sur test Benford (${res.testType})`,
            detailsFr: `MAD calculé de ${res.mad} excédant le seuil de non-conformité. Chiffres sur-représentés : [${res.suspectDigits.join(', ')}].`,
            recommendedActionFr: 'Réaliser un sondage substantif ciblé sur les factures débutant par les chiffres signalés.',
          });
        }
      }
      benfordSummary = inputs.benfordResults.map((r) => r.summaryFr).join(' | ');
    }

    // 2. Fractionnement de factures (Abus de droit art. 19 bis CPF)
    let splittingSummary: string | undefined;
    if (inputs.splittingResult) {
      splittingSummary = inputs.splittingResult.summaryFr;
      if (inputs.splittingResult.hasSuspiciousSplitting) {
        for (const cluster of inputs.splittingResult.clusters) {
          const exp = EngineMath.from(cluster.totalCumulativeAmount);
          totalExposure = totalExposure.plus(exp);

          findings.push({
            code: `SPLITTING_${cluster.clusterId}`,
            category: 'SPLITTING',
            severity: cluster.riskSeverity,
            evidenceLevel: EvidenceLevel.LEGAL_TEXT,
            legalReference: 'Article 19 bis du Code des Procédures Fiscales (CPF)',
            titleFr: `Indice de fractionnement de facturation (${cluster.partnerName ?? cluster.partnerId})`,
            detailsFr: `${cluster.invoiceCount} facture(s) émises sur ${cluster.timeSpanDays} jours pour un total de ${cluster.totalCumulativeAmount} DA à proximité du seuil légal de ${cluster.suspectedTargetThreshold} DA.`,
            recommendedActionFr: 'Engager un examen contradictoire de la réalité économique des opérations sans réintégration automatique préalable.',
            financialExposureDzd: cluster.totalCumulativeAmount,
          });
        }
      }
    }

    // 3. Contrôle de Caisse (Art. 43 CPF)
    let cashRegisterSummary: string | undefined;
    if (inputs.cashAuditResult) {
      cashRegisterSummary = inputs.cashAuditResult.summaryFr;
      if (!inputs.cashAuditResult.isCompliant) {
        for (const anom of inputs.cashAuditResult.anomalies) {
          findings.push({
            code: `CASH_ANOMALY_${anom.date}_${anom.mode}`,
            category: 'CASH_REGISTER',
            severity: anom.severity,
            evidenceLevel: EvidenceLevel.LEGAL_TEXT,
            legalReference: 'Article 43 du Code des Procédures Fiscales (CPF)',
            titleFr: anom.hasNegativeBalance ? 'Solde créditeur de caisse' : 'Sensibilité à l ordre de saisie de caisse',
            detailsFr: anom.descriptionFr,
            recommendedActionFr: anom.hasNegativeBalance
              ? 'Rapprocher immédiatement les brouillards de caisse et justificatifs physiques sous peine de rejet de comptabilité.'
              : 'Classer et horodater chronologiquement les pièces de dépenses et d encaissement de la journée.',
          });
        }
      }
    }

    // 4. Seuils d'espèces (IBS art. 169 CIDTA, TVA, Secteurs)
    let cashThresholdSummary: string | undefined;
    if (inputs.cashThresholdResult) {
      cashThresholdSummary = inputs.cashThresholdResult.summaryFr;
      if (inputs.cashThresholdResult.hasViolations) {
        const reintIbs = EngineMath.from(inputs.cashThresholdResult.totalReintegratedIbs);
        const deniedVat = EngineMath.from(inputs.cashThresholdResult.totalDeniedVat);
        totalExposure = totalExposure.plus(reintIbs).plus(deniedVat);

        for (const viol of inputs.cashThresholdResult.violations) {
          findings.push({
            code: `CASH_THRESHOLD_${viol.invoiceNumber}`,
            category: 'CASH_THRESHOLD',
            severity: viol.severity,
            evidenceLevel: EvidenceLevel.LEGAL_TEXT,
            legalReference: viol.legalReference,
            titleFr: `Non-respect du seuil de règlement en espèces (${viol.invoiceNumber})`,
            detailsFr: viol.explanationFr,
            recommendedActionFr: 'Privilégier le règlement par chèque barré ou virement bancaire pour préserver la déductibilité fiscale.',
            financialExposureDzd: EngineMath.from(viol.reintegratedAmountIbs).plus(EngineMath.from(viol.deniedVatAmount)).toFixed(2),
          });
        }
      }
    }

    // 5. Identifiants syntaxiques
    let identifierSummary: string | undefined;
    if (inputs.identifierResults && inputs.identifierResults.length > 0) {
      const invalidOnes = inputs.identifierResults.filter((r) => !r.isValid);
      for (const inv of invalidOnes) {
        findings.push({
          code: `INVALID_IDENTIFIER_${inv.identifierType}`,
          category: 'IDENTIFIER',
          severity: Severity.MAJEUR,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          legalReference: 'Nomenclature fiscale et commerciale algérienne (DGI/CNRC)',
          titleFr: `Identifiant ${inv.identifierType} non conforme`,
          detailsFr: inv.rejectionReason ?? 'Syntaxe invalide.',
          recommendedActionFr: 'Mettre à jour la fiche tiers avec l attestation d immatriculation officielle.',
        });
      }
      identifierSummary = `${inputs.identifierResults.length - invalidOnes.length}/${inputs.identifierResults.length} identifiant(s) valide(s).`;
    }

    // 6. Ratios de gestion
    let ratioSummary: string | undefined;
    if (inputs.ratioResult) {
      ratioSummary = inputs.ratioResult.summaryFr;
      if (inputs.ratioResult.hasAnomalies) {
        for (const anom of inputs.ratioResult.anomalies) {
          findings.push({
            code: `RATIO_ANOMALY_${anom.ratioCode}`,
            category: 'RATIO',
            severity: anom.severity,
            evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
            legalReference: 'Ratios d analyse financière et références sectorielles DGI',
            titleFr: `Anomalie sur ratio ${anom.ratioCode}`,
            detailsFr: anom.explanationFr,
            recommendedActionFr: 'Analyser la décomposition analytique des postes de charges et d encours.',
          });
        }
      }
    }

    // Décompte par sévérité
    const counts = {
      bloquant: findings.filter((f) => f.severity === Severity.BLOQUANT).length,
      majeur: findings.filter((f) => f.severity === Severity.MAJEUR).length,
      mineur: findings.filter((f) => f.severity === Severity.MINEUR).length,
      info: findings.filter((f) => f.severity === Severity.INFO).length,
    };

    const exposureThreshold = inputs.highRiskExposureThreshold
      ? EngineMath.from(inputs.highRiskExposureThreshold)
      : null;

    // Niveau de risque global
    let overallRisk: GlobalRiskLevel = 'FAIBLE';
    if (counts.bloquant > 0) {
      overallRisk = 'CRITIQUE';
    } else if (counts.majeur >= 3 || (exposureThreshold && totalExposure.greaterThan(exposureThreshold))) {
      overallRisk = 'ELEVE';
    } else if (counts.majeur > 0 || counts.mineur >= 2) {
      overallRisk = 'MOYEN';
    }

    const globalConclusionFr = overallRisk === 'CRITIQUE'
      ? `Niveau de risque CRITIQUE : ${counts.bloquant} anomalie(s) bloquante(s) identifiée(s) (notamment caisse créditrice ou infraction sectorielle grave). Traitement immédiat requis.`
      : overallRisk === 'ELEVE'
      ? `Niveau de risque ÉLEVÉ : ${counts.majeur} anomalie(s) majeure(s) détectée(s) pour une exposition financière estimée de ${totalExposure.toFixed(2)} DA.`
      : overallRisk === 'MOYEN'
      ? `Niveau de risque MOYEN : quelques points d attention relevés (${counts.majeur} majeur(s), ${counts.mineur} mineur(s)).`
      : 'Niveau de risque FAIBLE : comptabilité et opérations conformes aux standards d audit.';

    return {
      companyId: inputs.companyId,
      fiscalYear: inputs.fiscalYear,
      reportDate: new Date().toISOString().substring(0, 10),
      overallRiskLevel: overallRisk,
      totalFindingsCount: findings.length,
      findingsBySeverity: counts,
      totalEstimatedExposureDzd: totalExposure.toFixed(2),
      findings,
      benfordSummary,
      splittingSummary,
      cashRegisterSummary,
      cashThresholdSummary,
      identifierSummary,
      ratioSummary,
      trace: {
        ruleCode: 'CONSOLIDATED_AUDIT_REPORT',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          companyId: inputs.companyId,
          fiscalYear: inputs.fiscalYear,
          findingsCount: findings.length,
        },
        parametersRead: {},
        legalRef: 'Normes d audit légales algériennes (CPF / CIDTA / CTCA / ISA)',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: overallRisk === 'CRITIQUE' ? 'BLOCKED' : overallRisk === 'ELEVE' ? 'RISK_DETECTED' : 'COMPLIANT',
        humanReviewRequired: overallRisk !== 'FAIBLE',
        notes: globalConclusionFr,
      },
      globalConclusionFr,
    };
  }
}
