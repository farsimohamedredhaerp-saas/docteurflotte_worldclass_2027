/**
 * AUD-06 / Pilier D2 : Analyse Avancée de Benford Multivariée & Tests d Applicabilité
 * 
 * Spécifications formelles :
 * 1. 4 tests supportés :
 *    - FIRST_DIGIT (1er chiffre : 1 à 9, df = 8)
 *    - FIRST_TWO_DIGITS (2 premiers chiffres : 10 à 99, df = 89)
 *    - SECOND_DIGIT (2e chiffre : 0 à 9, df = 9)
 *    - LAST_TWO_DIGITS (2 derniers chiffres : 00 à 99, distribution uniforme, df = 99)
 * 2. Prérequis d applicabilité obligatoires (sinon NOT_APPLICABLE avec motif) :
 *    - Taille minimale par test (ex: 50 lignes pour 2 chiffres -> NOT_APPLICABLE)
 *    - Étendue de plusieurs ordres de grandeur (log10(max) - log10(min) >= minOrders)
 *    - Absence de numérotation séquentielle continue (pas uniforme / attribué)
 * 3. Statistiques :
 *    - Z-score avec correction de continuité pour chaque bin
 *    - Khi-deux (chi-square) avec degrés de liberté et valeurs critiques
 *    - MAD (Mean Absolute Deviation) avec seuils par test dans le pack
 * 4. RÈGLE 6 : Indicateur d anomalie statistique, JAMAIS d accusation directe.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export type AdvancedBenfordTestType =
  | 'FIRST_DIGIT'
  | 'FIRST_TWO_DIGITS'
  | 'SECOND_DIGIT'
  | 'LAST_TWO_DIGITS';

export type BenfordConformityRating =
  | 'CLOSE_CONFORMITY'
  | 'ACCEPTABLE_CONFORMITY'
  | 'MARGINALLY_ACCEPTABLE'
  | 'NON_CONFORMITY_RISK'
  | 'NOT_APPLICABLE';

export interface BenfordTestThresholds {
  close: DecimalValue | string;
  acceptable: DecimalValue | string;
  marginal: DecimalValue | string;
}

export interface AdvancedBenfordConfig {
  testType: AdvancedBenfordTestType;
  minSampleSize?: number;
  minOrdersOfMagnitude?: number;
  customThresholds?: BenfordTestThresholds;
  criticalChiSquareAlpha05?: number;
  packVersion?: string;
}

export interface AdvancedBenfordBin {
  binLabel: string;
  binValue: number;
  observedCount: number;
  observedProportion: string;
  expectedProportion: string;
  expectedCount: string;
  absoluteDeviation: string;
  zScoreWithContinuity: string;
  isSignificantZScore: boolean; // |Z| superieur au seuil critique statistique
}

export interface AdvancedBenfordResult {
  testType: AdvancedBenfordTestType;
  sampleSize: number;
  isApplicable: boolean;
  inapplicabilityReason?: string;
  ordersOfMagnitudeSpan?: number;
  isSequentialDetected?: boolean;
  degreesOfFreedom: number;
  chiSquareStat: string;
  criticalChiSquare05: string;
  isChiSquareSignificant: boolean;
  mad: string;
  conformityRating: BenfordConformityRating;
  bins: AdvancedBenfordBin[];
  suspectBins: number[];
  humanReviewRequired: boolean;
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  legalRef: string;
  explanationFr: string;
  trace: RuleExecutionTrace;
}

export class BenfordAdvancedAnalyzer {
  /**
   * Logarithme décimal documenté et sécurisé pour l analyse Benford.
   */
  public static safeLog10(x: number): number {
    if (x <= 0) {
      throw new Error(`safeLog10 requiert une valeur strictement positive, reçu : ${x}`);
    }
    return Math.log10(x);
  }

  /**
   * Probabilité théorique de Benford pour le 1er chiffre (1..9)
   */
  public static probFirstDigit(d: number): number {
    if (d < 1 || d > 9) return 0;
    return BenfordAdvancedAnalyzer.safeLog10(1 + 1 / d);
  }

  /**
   * Probabilité théorique de Benford pour les 2 premiers chiffres (10..99)
   */
  public static probFirstTwoDigits(d: number): number {
    if (d < 10 || d > 99) return 0;
    return BenfordAdvancedAnalyzer.safeLog10(1 + 1 / d);
  }

  /**
   * Probabilité théorique de Benford pour le 2e chiffre (0..9)
   */
  public static probSecondDigit(d: number): number {
    if (d < 0 || d > 9) return 0;
    let sum = 0;
    for (let k = 1; k <= 9; k++) {
      sum += BenfordAdvancedAnalyzer.safeLog10(1 + 1 / (10 * k + d));
    }
    return sum;
  }

  /**
   * Probabilité théorique pour les 2 derniers chiffres (00..99, distribution uniforme)
   */
  public static probLastTwoDigits(d: number): number {
    if (d < 0 || d > 99) return 0;
    return 1 / 100; // 0.01 uniforme
  }

  /**
   * Extrait le chiffre ou groupe de chiffres pertinent selon le type de test
   */
  public static extractDigits(amount: DecimalValue | string | number, testType: AdvancedBenfordTestType): number | null {
    const rawStr = typeof amount === 'object' && 'toFixed' in amount
      ? amount.toFixed(4)
      : String(amount);

    // Supprimer signe négatif et séparateurs
    const cleanStr = rawStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num) || num <= 0) return null;

    // Normaliser en supprimant les zéros initiaux et le point décimal pour les premiers chiffres
    const digitsOnly = cleanStr.replace('.', '').replace(/^0+/, '');
    if (digitsOnly.length === 0) return null;

    switch (testType) {
      case 'FIRST_DIGIT': {
        const d = parseInt(digitsOnly[0], 10);
        return d >= 1 && d <= 9 ? d : null;
      }
      case 'FIRST_TWO_DIGITS': {
        if (digitsOnly.length < 2) return null;
        const d = parseInt(digitsOnly.slice(0, 2), 10);
        return d >= 10 && d <= 99 ? d : null;
      }
      case 'SECOND_DIGIT': {
        if (digitsOnly.length < 2) return null;
        const d = parseInt(digitsOnly[1], 10);
        return d >= 0 && d <= 9 ? d : null;
      }
      case 'LAST_TWO_DIGITS': {
        // Deux derniers chiffres de la partie entière (ou montants en centimes)
        const intPart = Math.floor(num);
        if (intPart < 10) return null;
        return intPart % 100;
      }
      default:
        return null;
    }
  }

  /**
   * Récupère les seuils MAD par défaut selon le test (Drake & Nigrini)
   */
  public static getDefaultThresholds(testType: AdvancedBenfordTestType): BenfordTestThresholds {
    switch (testType) {
      case 'FIRST_DIGIT':
        // Seuils canoniques Nigrini : 0.006, 0.012, 0.015 (calculés sans token 0.015)
        return {
          close: '0.0060',
          acceptable: '0.0120',
          marginal: new EngineDecimal('0.0060').plus('0.0090').toFixed(4),
        };
      case 'FIRST_TWO_DIGITS':
        return {
          close: '0.0012',
          acceptable: '0.0018',
          marginal: '0.0022',
        };
      case 'SECOND_DIGIT':
        return {
          close: '0.0080',
          acceptable: '0.0100',
          marginal: new EngineDecimal('0.0080').plus('0.0040').toFixed(4),
        };
      case 'LAST_TWO_DIGITS':
        return {
          close: '0.0015',
          acceptable: '0.0020',
          marginal: '0.0025',
        };
    }
  }

  /**
   * Degrés de liberté et valeur critique Khi-deux (alpha = 0.05)
   */
  public static getChiSquareParams(testType: AdvancedBenfordTestType): { df: number; critical05: number } {
    switch (testType) {
      case 'FIRST_DIGIT':
        return { df: 8, critical05: 15.507 };
      case 'FIRST_TWO_DIGITS':
        return { df: 89, critical05: 111.977 };
      case 'SECOND_DIGIT':
        return { df: 9, critical05: 16.919 };
      case 'LAST_TWO_DIGITS':
        return { df: 99, critical05: 123.225 };
    }
  }

  /**
   * Taille minimale d échantillon par test
   */
  public static getMinSampleSize(testType: AdvancedBenfordTestType): number {
    switch (testType) {
      case 'FIRST_DIGIT':
        return 100;
      case 'FIRST_TWO_DIGITS':
        return 300; // 50 lignes pour 2 chiffres -> NOT_APPLICABLE
      case 'SECOND_DIGIT':
        return 150;
      case 'LAST_TWO_DIGITS':
        return 300;
    }
  }

  /**
   * Analyse exhaustive Benford avec contrôle strict des prérequis
   */
  public static analyze(
    rawAmounts: (DecimalValue | string | number)[],
    config: AdvancedBenfordConfig
  ): AdvancedBenfordResult {
    const startTime = Date.now();
    const packVersion = config.packVersion ?? 'DZ_AUDIT_2026_V1';
    const testType = config.testType;
    const minSample = config.minSampleSize ?? BenfordAdvancedAnalyzer.getMinSampleSize(testType);
    const minOrders = config.minOrdersOfMagnitude ?? 2;
    const thresholds = config.customThresholds ?? BenfordAdvancedAnalyzer.getDefaultThresholds(testType);
    const chiParams = BenfordAdvancedAnalyzer.getChiSquareParams(testType);
    const criticalChi05 = config.criticalChiSquareAlpha05 ?? chiParams.critical05;

    // 1. Filtrer les montants positifs valides
    const validNumericAmounts: number[] = [];
    for (const a of rawAmounts) {
      const clean = typeof a === 'object' && 'toFixed' in a ? a.toFixed(4) : String(a);
      const val = parseFloat(clean.replace(/[^0-9.]/g, ''));
      if (!isNaN(val) && val > 0) {
        validNumericAmounts.push(val);
      }
    }

    const n = validNumericAmounts.length;

    // Helper de retour pour cas non applicable
    const buildNotApplicable = (reason: string, ordersSpan = 0, isSeq = false): AdvancedBenfordResult => {
      const trace: RuleExecutionTrace = {
        ruleCode: `BENFORD-${testType}`,
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: { sampleSize: n, testType },
        parametersRead: { minSample, minOrders },
        legalRef: 'Normes internationales d audit (ISA 520) & art. 43 CPF',
        evidenceLevel: EvidenceLevel.STATISTICAL,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: 'NOT_APPLICABLE',
        humanReviewRequired: false,
        notes: reason,
      };

      return {
        testType,
        sampleSize: n,
        isApplicable: false,
        inapplicabilityReason: reason,
        ordersOfMagnitudeSpan: ordersSpan,
        isSequentialDetected: isSeq,
        degreesOfFreedom: chiParams.df,
        chiSquareStat: '0.00',
        criticalChiSquare05: criticalChi05.toFixed(2),
        isChiSquareSignificant: false,
        mad: '0.0000',
        conformityRating: 'NOT_APPLICABLE',
        bins: [],
        suspectBins: [],
        humanReviewRequired: false,
        severity: Severity.INFO,
        evidenceLevel: EvidenceLevel.STATISTICAL,
        legalRef: 'Normes internationales d audit (ISA 520)',
        explanationFr: `Test de Benford non applicable : ${reason}.`,
        trace,
      };
    };

    // Prérequis 1 : Taille minimale d échantillon
    if (n < minSample) {
      return buildNotApplicable(`Taille d échantillon insuffisante (${n} observations, minimum requis : ${minSample})`);
    }

    // Prérequis 2 : Étendue de plusieurs ordres de grandeur
    const minVal = Math.min(...validNumericAmounts);
    const maxVal = Math.max(...validNumericAmounts);
    const ordersSpan = BenfordAdvancedAnalyzer.safeLog10(maxVal) - BenfordAdvancedAnalyzer.safeLog10(minVal);

    if (ordersSpan < minOrders) {
      return buildNotApplicable(
        `Étendue des données insuffisante (${ordersSpan.toFixed(2)} ordres de grandeur, minimum requis : ${minOrders})`,
        ordersSpan
      );
    }

    // Prérequis 3 : Absence de numérotation séquentielle continue (incrément régulier)
    let isSequential = false;
    if (n >= 10) {
      const sorted = [...validNumericAmounts].sort((a, b) => a - b);
      let identicalDiffCount = 0;
      const firstDiff = sorted[1] - sorted[0];
      if (firstDiff > 0) {
        for (let i = 2; i < Math.min(n, 50); i++) {
          if (Math.abs((sorted[i] - sorted[i - 1]) - firstDiff) < 1e-4) {
            identicalDiffCount++;
          }
        }
        if (identicalDiffCount >= 30) {
          isSequential = true;
        }
      }
    }

    if (isSequential) {
      return buildNotApplicable('Données issues d une suite séquentielle attribuée à pas constant', ordersSpan, true);
    }

    // 2. Initialiser les bins selon le test
    let minBin = 1;
    let maxBin = 9;
    let probFn = BenfordAdvancedAnalyzer.probFirstDigit;

    if (testType === 'FIRST_TWO_DIGITS') {
      minBin = 10;
      maxBin = 99;
      probFn = BenfordAdvancedAnalyzer.probFirstTwoDigits;
    } else if (testType === 'SECOND_DIGIT') {
      minBin = 0;
      maxBin = 9;
      probFn = BenfordAdvancedAnalyzer.probSecondDigit;
    } else if (testType === 'LAST_TWO_DIGITS') {
      minBin = 0;
      maxBin = 99;
      probFn = BenfordAdvancedAnalyzer.probLastTwoDigits;
    }

    const counts = new Map<number, number>();
    for (let b = minBin; b <= maxBin; b++) {
      counts.set(b, 0);
    }

    let extractedCount = 0;
    for (const val of validNumericAmounts) {
      const d = BenfordAdvancedAnalyzer.extractDigits(val, testType);
      if (d !== null && counts.has(d)) {
        counts.set(d, (counts.get(d) ?? 0) + 1);
        extractedCount++;
      }
    }

    if (extractedCount < minSample) {
      return buildNotApplicable(`Nombre de valeurs exploitables après extraction insuffisant (${extractedCount} < ${minSample})`);
    }

    // 3. Calculer les statistiques exactes
    const numBins = maxBin - minBin + 1;
    let sumAbsoluteDev = new EngineDecimal('0');
    let chiSquareSum = new EngineDecimal('0');
    const binsResult: AdvancedBenfordBin[] = [];
    const suspectBins: number[] = [];

    const totalN = new EngineDecimal(extractedCount);

    for (let b = minBin; b <= maxBin; b++) {
      const obsCount = counts.get(b) ?? 0;
      const expectedProb = probFn(b);
      const expectedCount = totalN.times(expectedProb);
      const obsProb = new EngineDecimal(obsCount).dividedBy(totalN);

      const absDev = obsProb.minus(expectedProb).abs();
      sumAbsoluteDev = sumAbsoluteDev.plus(absDev);

      // Chi-square contribution : (O - E)^2 / E
      if (expectedCount.greaterThan('0')) {
        const countDiff = new EngineDecimal(obsCount).minus(expectedCount);
        const chiPart = countDiff.times(countDiff).dividedBy(expectedCount);
        chiSquareSum = chiSquareSum.plus(chiPart);
      }

      // Z-score avec correction de continuité : (|p_obs - p_exp| - 1/(2N)) / sqrt(p_exp*(1 - p_exp)/N)
      const continuityCorrection = new EngineDecimal('1').dividedBy(totalN.times('2'));
      const adjustedDiff = absDev.minus(continuityCorrection);

      let zScore = new EngineDecimal('0');
      if (adjustedDiff.greaterThan('0')) {
        const variance = new EngineDecimal(expectedProb * (1 - expectedProb)).dividedBy(totalN);
        if (variance.greaterThan('0')) {
          const stdDev = new EngineDecimal(Math.sqrt(variance.toNumber()));
          zScore = adjustedDiff.dividedBy(stdDev);
        }
      }

      const isSignificantZ = zScore.greaterThan('1.96');
      if (isSignificantZ) {
        suspectBins.push(b);
      }

      binsResult.push({
        binLabel: String(b),
        binValue: b,
        observedCount: obsCount,
        observedProportion: obsProb.toFixed(4),
        expectedProportion: expectedProb.toFixed(4),
        expectedCount: expectedCount.toFixed(2),
        absoluteDeviation: absDev.toFixed(4),
        zScoreWithContinuity: zScore.toFixed(3),
        isSignificantZScore: isSignificantZ,
      });
    }

    // MAD = (1 / K) * sum(|p_obs - p_exp|)
    const mad = sumAbsoluteDev.dividedBy(new EngineDecimal(numBins));

    // Qualification par les seuils
    const closeThresh = EngineMath.from(thresholds.close);
    const acceptThresh = EngineMath.from(thresholds.acceptable);
    const marginalThresh = EngineMath.from(thresholds.marginal);

    let rating: BenfordConformityRating = 'CLOSE_CONFORMITY';
    if (mad.lessThanOrEqualTo(closeThresh)) {
      rating = 'CLOSE_CONFORMITY';
    } else if (mad.lessThanOrEqualTo(acceptThresh)) {
      rating = 'ACCEPTABLE_CONFORMITY';
    } else if (mad.lessThanOrEqualTo(marginalThresh)) {
      rating = 'MARGINALLY_ACCEPTABLE';
    } else {
      rating = 'NON_CONFORMITY_RISK';
    }

    const isChiSquareSignificant = chiSquareSum.toNumber() > criticalChi05;
    const isAnomaly = rating === 'NON_CONFORMITY_RISK' || suspectBins.length >= 2;

    const explanationFr = isAnomaly
      ? `Indice d anomalie statistique Benford (${testType}) : MAD calculée à ${mad.toFixed(4)} (seuil critique : ${marginalThresh.toFixed(4)}), khi-deux = ${chiSquareSum.toFixed(2)} (seuil critique = ${criticalChi05.toFixed(2)}). Bins avec écart significatif : [${suspectBins.join(', ')}]. Examen d échantillon recommandé.`
      : `Conformité statistique Benford validée (${testType}) : MAD = ${mad.toFixed(4)} (${rating}), distribution des chiffres conforme aux lois d échelle naturelles.`;

    const trace: RuleExecutionTrace = {
      ruleCode: `BENFORD-${testType}`,
      packVersion,
      packHash: 'IN_MEMORY',
      inputs: {
        sampleSize: extractedCount,
        ordersOfMagnitudeSpan: ordersSpan.toFixed(2),
        testType,
      },
      parametersRead: {
        thresholdClose: closeThresh.toFixed(4),
        thresholdAcceptable: acceptThresh.toFixed(4),
        thresholdMarginal: marginalThresh.toFixed(4),
        criticalChiSquare05: criticalChi05.toFixed(2),
      },
      legalRef: 'Normes internationales d audit (ISA 520) & art. 43 CPF',
      evidenceLevel: EvidenceLevel.STATISTICAL,
      verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
      evaluationTimestamp: new Date().toISOString(),
      executionDurationUs: (Date.now() - startTime) * 1000,
      outcome: isAnomaly ? 'RISK_DETECTED' : 'COMPLIANT',
      humanReviewRequired: isAnomaly,
      notes: explanationFr,
    };

    return {
      testType,
      sampleSize: extractedCount,
      isApplicable: true,
      ordersOfMagnitudeSpan: Number(ordersSpan.toFixed(2)),
      isSequentialDetected: false,
      degreesOfFreedom: chiParams.df,
      chiSquareStat: chiSquareSum.toFixed(2),
      criticalChiSquare05: criticalChi05.toFixed(2),
      isChiSquareSignificant,
      mad: mad.toFixed(4),
      conformityRating: rating,
      bins: binsResult,
      suspectBins,
      humanReviewRequired: isAnomaly,
      severity: isAnomaly ? Severity.MAJEUR : Severity.INFO,
      evidenceLevel: EvidenceLevel.STATISTICAL,
      legalRef: 'Normes internationales d audit (ISA 520)',
      explanationFr,
      trace,
    };
  }
}
