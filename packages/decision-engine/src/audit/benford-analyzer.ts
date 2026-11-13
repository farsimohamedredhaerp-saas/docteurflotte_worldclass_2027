/**
 * Moteur d'Audit Statistique : Analyse de Conformité à la Loi de Benford
 * 
 * RÈGLE 5 : Explicabilité & Traçabilité intégrale.
 * RÈGLE 6 : Indicateurs et signaux de risque, AUCUNE accusation.
 * 
 * Tests supportés :
 * - 1er chiffre (First digit : 1 à 9)
 * - 2 premiers chiffres (First-two digits : 10 à 99)
 * - 2e chiffre (Second digit : 0 à 9)
 * - 2 derniers chiffres (Last-two digits : 00 à 99, distribution uniforme)
 * 
 * Métrique : Mean Absolute Deviation (MAD) selon les seuils de Drake & Nigrini.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export type BenfordTestType = 'FIRST_DIGIT' | 'FIRST_TWO_DIGITS' | 'SECOND_DIGIT' | 'LAST_TWO_DIGITS';

export type BenfordConformityLevel = 
  | 'CLOSE_CONFORMITY'
  | 'ACCEPTABLE_CONFORMITY'
  | 'MARGINALLY_ACCEPTABLE'
  | 'NON_CONFORMITY_RISK';

export interface BenfordThresholds {
  close: DecimalValue | string;
  acceptable: DecimalValue | string;
  marginal: DecimalValue | string;
}

export interface BenfordConfig {
  testType: BenfordTestType;
  minSampleSize?: number;
  thresholds?: BenfordThresholds;
}

export interface BenfordBinResult {
  digit: number;
  observedCount: number;
  observedProportion: string;
  expectedProportion: string;
  absoluteDeviation: string;
  isSignificantDeviation: boolean;
}

export interface BenfordAnalysisResult {
  testType: BenfordTestType;
  sampleSize: number;
  isApplicable: boolean;
  inapplicabilityReason?: string;
  mad: string;
  conformityLevel: BenfordConformityLevel;
  bins: BenfordBinResult[];
  suspectDigits: number[];
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class BenfordAnalyzer {
  /**
   * Calcule la probabilité théorique de Benford pour le premier chiffre (1..9)
   */
  public static theoreticalFirstDigit(d: number): number {
    if (d < 1 || d > 9) return 0;
    return Math.log10(1 + 1 / d);
  }

  /**
   * Calcule la probabilité théorique de Benford pour les deux premiers chiffres (10..99)
   */
  public static theoreticalFirstTwoDigits(d: number): number {
    if (d < 10 || d > 99) return 0;
    return Math.log10(1 + 1 / d);
  }

  /**
   * Calcule la probabilité théorique de Benford pour le deuxième chiffre (0..9)
   */
  public static theoreticalSecondDigit(d: number): number {
    if (d < 0 || d > 9) return 0;
    let sum = 0;
    for (let k = 1; k <= 9; k++) {
      sum += Math.log10(1 + 1 / (10 * k + d));
    }
    return sum;
  }

  /**
   * Probabilité théorique pour les deux derniers chiffres (uniforme 1/100)
   */
  public static theoreticalLastTwoDigits(): number {
    return 1 / 100;
  }

  /**
   * Extrait le chiffre ou les chiffres ciblés selon le type de test
   */
  public static extractDigits(amount: DecimalValue | string, testType: BenfordTestType): number | null {
    const dec = EngineMath.from(amount).abs();
    if (dec.isZero()) return null;

    // Représentation chaîne sans point ni signe
    const numStr = dec.toString().replace(/[^0-9]/g, '');
    if (!numStr || numStr.length === 0) return null;

    // Élimination des zéros initiaux
    const cleanStr = numStr.replace(/^0+/, '');
    if (cleanStr.length === 0) return null;

    switch (testType) {
      case 'FIRST_DIGIT':
        return parseInt(cleanStr[0], 10);

      case 'FIRST_TWO_DIGITS':
        if (cleanStr.length < 2) return null;
        return parseInt(cleanStr.substring(0, 2), 10);

      case 'SECOND_DIGIT':
        if (cleanStr.length < 2) return null;
        return parseInt(cleanStr[1], 10);

      case 'LAST_TWO_DIGITS': {
        const parts = dec.toFixed(2).replace(/[^0-9]/g, '');
        if (parts.length < 2) return null;
        return parseInt(parts.substring(parts.length - 2), 10);
      }
    }
  }

  /**
   * Analyse une série de montants selon la loi de Benford
   */
  public static analyze(
    amounts: (DecimalValue | string)[],
    config: BenfordConfig,
    packVersion = 'DZ_AUDIT_2026_V1'
  ): BenfordAnalysisResult {
    const startTime = Date.now();
    const minSample = config.minSampleSize ?? 50;

    // Filtrer les montants positifs non nuls
    const validAmounts: (DecimalValue | string)[] = amounts.filter((a) => {
      try {
        const d = EngineMath.from(a);
        return !d.isZero() && d.isPositive();
      } catch {
        return false;
      }
    });

    const N = validAmounts.length;

    // 1. Contrôle des prérequis
    if (N < minSample) {
      return {
        testType: config.testType,
        sampleSize: N,
        isApplicable: false,
        inapplicabilityReason: `Taille d'échantillon insuffisante (${N} montants validés pour un minimum requis de ${minSample}).`,
        mad: '0.000000',
        conformityLevel: 'ACCEPTABLE_CONFORMITY',
        bins: [],
        suspectDigits: [],
        trace: {
          ruleCode: `BENFORD_${config.testType}`,
          packVersion,
          packHash: 'IN_MEMORY',
          inputs: { sampleSize: N, minSampleRequired: minSample },
          parametersRead: {},
          legalRef: 'Normes internationales d audit ISA 240 / Pratiques statistiques Nigrini',
          evidenceLevel: EvidenceLevel.STATISTICAL,
          verificationStatus: VerificationStatus.SOURCED_SECONDARY,
          evaluationTimestamp: new Date().toISOString(),
          executionDurationUs: (Date.now() - startTime) * 1000,
          outcome: 'NOT_APPLICABLE',
          humanReviewRequired: false,
          notes: 'Échantillon trop restreint pour une inférence statistique Benford fiable.',
        },
        summaryFr: `Analyse Benford non applicable : effectif de ${N} insuffisant.`,
      };
    }

    // Définir la plage de chiffres selon le test
    let startDigit = 1;
    let endDigit = 9;
    let getTheoretical = (d: number) => BenfordAnalyzer.theoreticalFirstDigit(d);

    if (config.testType === 'FIRST_TWO_DIGITS') {
      startDigit = 10;
      endDigit = 99;
      getTheoretical = (d: number) => BenfordAnalyzer.theoreticalFirstTwoDigits(d);
    } else if (config.testType === 'SECOND_DIGIT') {
      startDigit = 0;
      endDigit = 9;
      getTheoretical = (d: number) => BenfordAnalyzer.theoreticalSecondDigit(d);
    } else if (config.testType === 'LAST_TWO_DIGITS') {
      startDigit = 0;
      endDigit = 99;
      getTheoretical = () => BenfordAnalyzer.theoreticalLastTwoDigits();
    }

    const binCounts = new Map<number, number>();
    for (let d = startDigit; d <= endDigit; d++) {
      binCounts.set(d, 0);
    }

    let extractedCount = 0;
    for (const amt of validAmounts) {
      const digit = BenfordAnalyzer.extractDigits(amt, config.testType);
      if (digit !== null && binCounts.has(digit)) {
        binCounts.set(digit, (binCounts.get(digit) ?? 0) + 1);
        extractedCount++;
      }
    }

    if (extractedCount < minSample) {
      return {
        testType: config.testType,
        sampleSize: extractedCount,
        isApplicable: false,
        inapplicabilityReason: `Nombre de chiffres exploitables (${extractedCount}) insuffisant.`,
        mad: '0.000000',
        conformityLevel: 'ACCEPTABLE_CONFORMITY',
        bins: [],
        suspectDigits: [],
        trace: {
          ruleCode: `BENFORD_${config.testType}`,
          packVersion,
          packHash: 'IN_MEMORY',
          inputs: { extractedCount },
          parametersRead: {},
          legalRef: 'Normes ISA 240 / Pratiques Nigrini',
          evidenceLevel: EvidenceLevel.STATISTICAL,
          verificationStatus: VerificationStatus.SOURCED_SECONDARY,
          evaluationTimestamp: new Date().toISOString(),
          executionDurationUs: (Date.now() - startTime) * 1000,
          outcome: 'NOT_APPLICABLE',
          humanReviewRequired: false,
        },
        summaryFr: 'Analyse Benford non applicable.',
      };
    }

    // 2. Calcul des proportions et du MAD (Mean Absolute Deviation)
    let totalAbsoluteDeviation = new EngineDecimal('0');
    const bins: BenfordBinResult[] = [];
    const suspectDigits: number[] = [];
    const numBins = endDigit - startDigit + 1;

    for (let d = startDigit; d <= endDigit; d++) {
      const count = binCounts.get(d) ?? 0;
      const countDec = new EngineDecimal(String(count));
      const extractedDec = new EngineDecimal(String(extractedCount));
      const obsProp = EngineMath.divide(countDec, extractedDec, 'ERROR')!;
      const expPropVal = getTheoretical(d);
      const expProp = EngineMath.from(expPropVal.toFixed(8));
      const absDev = obsProp.minus(expProp).abs();

      totalAbsoluteDeviation = totalAbsoluteDeviation.plus(absDev);

      const relativeRatio = expProp.isZero() ? new EngineDecimal('0') : obsProp.div(expProp);
      const isSignificant = relativeRatio.greaterThan('2.0') && count >= 5;
      if (isSignificant) {
        suspectDigits.push(d);
      }

      bins.push({
        digit: d,
        observedCount: count,
        observedProportion: obsProp.toFixed(6),
        expectedProportion: expProp.toFixed(6),
        absoluteDeviation: absDev.toFixed(6),
        isSignificantDeviation: isSignificant,
      });
    }

    const mad = totalAbsoluteDeviation.div(numBins);

    // 3. Évaluation des seuils de Nigrini
    const thresholds: BenfordThresholds = config.thresholds ?? BenfordAnalyzer.getDefaultThresholds(config.testType);
    const closeThreshold = EngineMath.from(thresholds.close);
    const acceptableThreshold = EngineMath.from(thresholds.acceptable);
    const marginalThreshold = EngineMath.from(thresholds.marginal);

    let conformityLevel: BenfordConformityLevel = 'CLOSE_CONFORMITY';
    if (mad.greaterThan(marginalThreshold)) {
      conformityLevel = 'NON_CONFORMITY_RISK';
    } else if (mad.greaterThan(acceptableThreshold)) {
      conformityLevel = 'MARGINALLY_ACCEPTABLE';
    } else if (mad.greaterThan(closeThreshold)) {
      conformityLevel = 'ACCEPTABLE_CONFORMITY';
    }

    const outcome = conformityLevel === 'NON_CONFORMITY_RISK' ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      testType: config.testType,
      sampleSize: extractedCount,
      isApplicable: true,
      mad: mad.toFixed(6),
      conformityLevel,
      bins,
      suspectDigits,
      trace: {
        ruleCode: `BENFORD_${config.testType}`,
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: { sampleSize: extractedCount, testType: config.testType },
        parametersRead: {
          closeThreshold: closeThreshold.toFixed(6),
          acceptableThreshold: acceptableThreshold.toFixed(6),
          marginalThreshold: marginalThreshold.toFixed(6),
        },
        legalRef: 'Normes internationales d audit ISA 240 / Détection d anomalies numériques Nigrini',
        evidenceLevel: EvidenceLevel.STATISTICAL,
        verificationStatus: VerificationStatus.SOURCED_SECONDARY,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: conformityLevel === 'NON_CONFORMITY_RISK',
        notes: `MAD calculé: ${mad.toFixed(6)}. Conformité: ${conformityLevel}.`,
      },
      summaryFr: `Test Benford (${config.testType}) sur ${extractedCount} montants : MAD = ${mad.toFixed(6)} (${conformityLevel}).${
        suspectDigits.length > 0 ? ` Chiffres atypiques : [${suspectDigits.join(', ')}].` : ''
      }`,
    };
  }

  /**
   * Seuils standards Drake & Nigrini par type de test
   */
  public static getDefaultThresholds(testType: BenfordTestType): BenfordThresholds {
    switch (testType) {
      case 'FIRST_DIGIT':
        return {
          close: '0.006000',
          acceptable: '0.012000',
          marginal: '0.015000',
        };
      case 'FIRST_TWO_DIGITS':
        return {
          close: '0.001200',
          acceptable: '0.001800',
          marginal: '0.002200',
        };
      case 'SECOND_DIGIT':
        return {
          close: '0.008000',
          acceptable: '0.010000',
          marginal: '0.012000',
        };
      case 'LAST_TWO_DIGITS':
        return {
          close: '0.005000',
          acceptable: '0.008000',
          marginal: '0.011000',
        };
    }
  }
}
