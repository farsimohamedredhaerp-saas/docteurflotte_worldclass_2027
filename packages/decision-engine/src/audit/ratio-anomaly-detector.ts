/**
 * Détecteur d'Incohérences de Ratios de Gestion & d'Audit
 * 
 * Ratios analysés :
 * 1. Taux de Marge Brute commerciale / industrielle (détection de marge négative ou sous-calibrée).
 * 2. Taux de Rotation des Stocks & Délai d'écoulement en jours (détection de sur-stockage / dépréciation omise).
 * 3. Délai Moyen de Recouvrement des Créances Clients (DSO - Days Sales Outstanding).
 * 
 * RÈGLE NON NÉGOCIABLE :
 * Zéro seuil ni ratio en dur (profils sectoriels injectés depuis le pack réglementaire).
 * RÈGLE 6 : Indicateurs et signaux d'alerte, aucune affirmation péremptoire de fraude.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export interface SectorAuditProfile {
  sectorCode: string;
  sectorNameFr: string;
  minGrossMarginRatio: DecimalValue | string; // Taux de marge brute plancher attendu
  maxGrossMarginRatio?: DecimalValue | string; // Taux de marge plafond
  minStockTurnoverTimes?: DecimalValue | string; // Rotation minimale des stocks (en fois/an)
  maxDsoDays: number; // Seuil maximal acceptable de délai client (jours)
}

export interface RatioAnalysisInputs {
  revenueHt: DecimalValue | string; // Chiffre d'affaires HT
  revenueTtc?: DecimalValue | string; // Chiffre d'affaires TTC (si omis, dérivé)
  consumedPurchasesHt: DecimalValue | string; // Achats consommés HT (achats +/- variation de stock)
  averageStock: DecimalValue | string; // Stock moyen ((Stock initial + Stock final) / 2)
  clientReceivablesTtc: DecimalValue | string; // Encours clients TTC de fin de période
}

export interface RatioAnomaly {
  ratioCode: 'GROSS_MARGIN' | 'STOCK_TURNOVER' | 'DSO';
  observedValue: string;
  expectedBenchmark: string;
  deviationType: 'NEGATIVE_MARGIN' | 'BELOW_MINIMUM' | 'ABOVE_MAXIMUM' | 'EXCESSIVE_DSO';
  severity: Severity;
  explanationFr: string;
}

export interface RatioAnalysisResult {
  hasAnomalies: boolean;
  grossMarginAmount: string;
  grossMarginRatio: string;
  stockTurnoverTimes: string;
  stockDaysOfSupply: string;
  dsoDays: string;
  anomalies: RatioAnomaly[];
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class RatioAnomalyDetector {
  /**
   * Analyse les ratios d'un exercice par rapport au profil sectoriel de référence
   */
  public static analyze(
    inputs: RatioAnalysisInputs,
    profile: SectorAuditProfile,
    packVersion = 'DZ_AUDIT_2026_V1'
  ): RatioAnalysisResult {
    const startTime = Date.now();
    const revHt = EngineMath.from(inputs.revenueHt);
    const purchasesHt = EngineMath.from(inputs.consumedPurchasesHt);
    const avgStock = EngineMath.from(inputs.averageStock);
    const receivables = EngineMath.from(inputs.clientReceivablesTtc);

    const minMargin = EngineMath.from(profile.minGrossMarginRatio);
    const maxMargin = profile.maxGrossMarginRatio ? EngineMath.from(profile.maxGrossMarginRatio) : null;
    const minTurnover = profile.minStockTurnoverTimes ? EngineMath.from(profile.minStockTurnoverTimes) : null;

    const anomalies: RatioAnomaly[] = [];

    // 1. Marge Brute et Taux de Marge Brute
    const marginAmount = revHt.minus(purchasesHt);
    const marginRatio = revHt.isZero()
      ? new EngineDecimal('0')
      : EngineMath.divide(marginAmount, revHt, 'ERROR')!;

    if (marginAmount.isNegative()) {
      anomalies.push({
        ratioCode: 'GROSS_MARGIN',
        observedValue: marginRatio.toFixed(4),
        expectedBenchmark: `>= ${minMargin.toFixed(4)}`,
        deviationType: 'NEGATIVE_MARGIN',
        severity: Severity.BLOQUANT,
        explanationFr: `Marge brute commerciale négative (${marginAmount.toFixed(2)} DA, taux: ${marginRatio.times(100).toFixed(2)}%). Présomption de ventes à perte ou de minoration de recettes.`,
      });
    } else if (marginRatio.lessThan(minMargin)) {
      anomalies.push({
        ratioCode: 'GROSS_MARGIN',
        observedValue: marginRatio.toFixed(4),
        expectedBenchmark: `>= ${minMargin.toFixed(4)}`,
        deviationType: 'BELOW_MINIMUM',
        severity: Severity.MAJEUR,
        explanationFr: `Taux de marge brute (${marginRatio.times(100).toFixed(2)}%) significativement inférieur au seuil sectoriel de référence (${minMargin.times(100).toFixed(2)}%).`,
      });
    } else if (maxMargin && marginRatio.greaterThan(maxMargin)) {
      anomalies.push({
        ratioCode: 'GROSS_MARGIN',
        observedValue: marginRatio.toFixed(4),
        expectedBenchmark: `<= ${maxMargin.toFixed(4)}`,
        deviationType: 'ABOVE_MAXIMUM',
        severity: Severity.INFO,
        explanationFr: `Taux de marge brute (${marginRatio.times(100).toFixed(2)}%) exceptionnellement élevé par rapport au profil sectoriel (${maxMargin.times(100).toFixed(2)}%).`,
      });
    }

    // 2. Rotation des Stocks (Coût d'achat / Stock Moyen) et délai d'écoulement
    let stockTurnover = new EngineDecimal('0');
    let stockDays = new EngineDecimal('0');

    if (avgStock.greaterThan(new EngineDecimal('0')) && purchasesHt.greaterThan(new EngineDecimal('0'))) {
      stockTurnover = EngineMath.divide(purchasesHt, avgStock, 'ERROR')!;
      stockDays = EngineMath.divide(avgStock.times(365), purchasesHt, 'ERROR')!;

      if (minTurnover && stockTurnover.lessThan(minTurnover)) {
        anomalies.push({
          ratioCode: 'STOCK_TURNOVER',
          observedValue: stockTurnover.toFixed(2),
          expectedBenchmark: `>= ${minTurnover.toFixed(2)} fois/an`,
          deviationType: 'BELOW_MINIMUM',
          severity: Severity.MINEUR,
          explanationFr: `Rotation des stocks lente (${stockTurnover.toFixed(2)} fois/an, soit ${stockDays.toFixed(0)} jours d approvisionnement). Risque d immobilisation de trésorerie ou de dépréciation de stock omise.`,
        });
      }
    }

    // 3. Délai de Recouvrement Clients (DSO)
    const revTtc = inputs.revenueTtc ? EngineMath.from(inputs.revenueTtc) : revHt;
    let dsoDays = new EngineDecimal('0');

    if (revTtc.greaterThan(new EngineDecimal('0')) && receivables.greaterThan(new EngineDecimal('0'))) {
      dsoDays = EngineMath.divide(receivables.times(365), revTtc, 'ERROR')!;

      if (dsoDays.greaterThan(profile.maxDsoDays)) {
        anomalies.push({
          ratioCode: 'DSO',
          observedValue: dsoDays.toFixed(1),
          expectedBenchmark: `<= ${profile.maxDsoDays} jours`,
          deviationType: 'EXCESSIVE_DSO',
          severity: Severity.MAJEUR,
          explanationFr: `Délai moyen de recouvrement clients anormalement étendu (${dsoDays.toFixed(0)} jours vs seuil cible de ${profile.maxDsoDays} jours). Risque d impayés ou de créances douteuses non provisionnées.`,
        });
      }
    }

    const hasAnomalies = anomalies.length > 0;
    const outcome = hasAnomalies ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      hasAnomalies,
      grossMarginAmount: marginAmount.toFixed(2),
      grossMarginRatio: marginRatio.toFixed(4),
      stockTurnoverTimes: stockTurnover.toFixed(2),
      stockDaysOfSupply: stockDays.toFixed(2),
      dsoDays: dsoDays.toFixed(2),
      anomalies,
      trace: {
        ruleCode: 'AUDIT_RATIO_COHERENCE',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          revenueHt: revHt.toFixed(2),
          consumedPurchasesHt: purchasesHt.toFixed(2),
          averageStock: avgStock.toFixed(2),
          clientReceivablesTtc: receivables.toFixed(2),
          sectorCode: profile.sectorCode,
        },
        parametersRead: {
          minGrossMarginRatio: minMargin.toFixed(4),
          maxGrossMarginRatio: maxMargin ? maxMargin.toFixed(4) : null,
          minStockTurnoverTimes: minTurnover ? minTurnover.toFixed(2) : null,
          maxDsoDays: profile.maxDsoDays,
        },
        legalRef: 'Normes d analyse financière SCF / Ratios sectoriels DGI',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_SECONDARY,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: hasAnomalies,
        notes: hasAnomalies
          ? `${anomalies.length} anomalie(s) de ratio constatée(s) par rapport au profil sectoriel.`
          : 'Ensemble des ratios de gestion en ligne avec les standards sectoriels.',
      },
      summaryFr: hasAnomalies
        ? `${anomalies.length} incohérence(s) de ratios de gestion relevée(s) : Marge = ${marginRatio.times(100).toFixed(1)}%, DSO = ${dsoDays.toFixed(0)}j, Rotation stock = ${stockTurnover.toFixed(1)}x.`
        : `Ratios sectoriels cohérents (Marge: ${marginRatio.times(100).toFixed(1)}%, DSO: ${dsoDays.toFixed(0)}j).`,
    };
  }
}
