/**
 * Moteur de Calcul du Seuil de Rentabilité & Point Mort (Break-Even Analysis)
 * 
 * Permet l'analyse de profitabilité opérationnelle et du risque d'exploitation :
 * - Séparation Charges Fixes (CF) et Charges Variables (CV)
 * - Marge sur Coûts Variables (MCV) et Taux de Marge (TMCV)
 * - Seuil de Rentabilité en Dinars Algériens (SR)
 * - Point Mort en jours d'activité et projection de date calendaire exacte
 * - Marge de Sécurité (MS), Indice de Sécurité (IS) et Levier Opérationnel (LO)
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export interface BreakEvenInputs {
  revenueHt: DecimalValue | string; // Chiffre d'affaires HT
  variableCosts: DecimalValue | string; // Total charges variables
  fixedCosts: DecimalValue | string; // Total charges fixes
  operatingDaysInYear?: number; // ex: 365 jours calendaires ou 260 jours ouvrés
  fiscalYear?: number; // ex: 2026
}

export interface BreakEvenResult {
  revenueHt: string;
  variableCosts: string;
  fixedCosts: string;
  grossMarginVariable: string; // MCV = CA - CV
  variableMarginRatio: string; // TMCV = MCV / CA
  operatingResult: string; // Résultat = MCV - CF
  breakEvenRevenueDzd: string; // Seuil de Rentabilité en DA = CF / TMCV
  breakEvenDays: number; // Point Mort en jours = (SR / CA) * jours
  breakEvenCalendarDate?: string; // Date calendaire exacte (YYYY-MM-DD)
  safetyMarginDzd: string; // MS = CA - SR
  safetyIndexRatio: string; // IS = MS / CA
  operatingLeverage: string; // LO = MCV / Résultat
  isProfitable: boolean;
  hasReachableBreakEven: boolean;
  severity: Severity;
  summaryFr: string;
}

export class BreakEvenEngine {
  /**
   * Calcule le seuil de rentabilité et le point mort
   */
  public static calculate(
    inputs: BreakEvenInputs,
    packVersion = 'DZ_MANAGEMENT_2026_V1'
  ): {
    result: BreakEvenResult;
    trace: RuleExecutionTrace;
  } {
    const startTime = Date.now();
    const ca = EngineMath.from(inputs.revenueHt);
    const cv = EngineMath.from(inputs.variableCosts);
    const cf = EngineMath.from(inputs.fixedCosts);
    const daysInYear = inputs.operatingDaysInYear ?? 365;
    const year = inputs.fiscalYear ?? new Date().getFullYear();

    // 1. Marge sur Coûts Variables (MCV = CA - CV)
    const mcv = ca.minus(cv);

    // 2. Taux de Marge sur Coûts Variables (TMCV = MCV / CA)
    const tmcv = ca.isZero() ? new EngineDecimal('0') : EngineMath.divide(mcv, ca, 'ERROR')!;

    // 3. Résultat d'exploitation (R = MCV - CF)
    const operatingResult = mcv.minus(cf);
    const isProfitable = operatingResult.greaterThan(new EngineDecimal('0'));

    let breakEvenDzd = new EngineDecimal('0');
    let breakEvenDays = 0;
    let breakEvenDate: string | undefined;
    let hasReachable = false;
    let safetyMargin = new EngineDecimal('0');
    let safetyIndex = new EngineDecimal('0');
    let operatingLeverage = new EngineDecimal('0');

    if (tmcv.greaterThan(new EngineDecimal('0'))) {
      hasReachable = true;
      // SR = CF / TMCV
      breakEvenDzd = EngineMath.divide(cf, tmcv, 'ERROR')!.toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

      if (ca.greaterThan(new EngineDecimal('0'))) {
        // Point mort en jours = (SR / CA) * daysInYear
        const daysExact = breakEvenDzd.times(daysInYear).div(ca);
        breakEvenDays = Math.min(daysInYear, Math.max(1, Math.round(daysExact.toNumber())));

        // Projection de la date calendaire
        const startDate = new Date(Date.UTC(year, 0, 1)); // 1er Janvier
        const targetDate = new Date(startDate.getTime() + (breakEvenDays - 1) * 24 * 3600 * 1000);
        breakEvenDate = targetDate.toISOString().substring(0, 10);

        // Marge de sécurité (MS = CA - SR)
        safetyMargin = ca.minus(breakEvenDzd);
        // Indice de sécurité (IS = MS / CA)
        safetyIndex = EngineMath.divide(safetyMargin, ca, 'ERROR')!;
      }

      // Levier Opérationnel = MCV / Résultat
      if (operatingResult.greaterThan(new EngineDecimal('0'))) {
        operatingLeverage = EngineMath.divide(mcv, operatingResult, 'ERROR')!;
      }
    }

    let severity = Severity.INFO;
    if (!hasReachable || mcv.lessThanOrEqualTo(new EngineDecimal('0'))) {
      severity = Severity.BLOQUANT; // Marge sur coûts variables négative : chaque vente aggrave la perte
    } else if (!isProfitable) {
      severity = Severity.MAJEUR; // Activité déficitaire (seuil supérieur au CA réalisé)
    }

    const summaryFr = !hasReachable
      ? `Activité structurellement déficitaire : Marge sur coûts variables négative (${mcv.toFixed(2)} DA). Le seuil de rentabilité ne peut être atteint.`
      : isProfitable
      ? `Seuil de rentabilité atteint à ${breakEvenDzd.toFixed(2)} DA (Point mort : jour ${breakEvenDays}, soit le ${breakEvenDate}). Marge de sécurité : ${safetyMargin.toFixed(2)} DA (Indice: ${safetyIndex.times(100).toFixed(1)}%).`
      : `Seuil de rentabilité non atteint (${breakEvenDzd.toFixed(2)} DA requis vs ${ca.toFixed(2)} DA réalisés). Déficit opérationnel de ${operatingResult.abs().toFixed(2)} DA.`;

    return {
      result: {
        revenueHt: ca.toFixed(2),
        variableCosts: cv.toFixed(2),
        fixedCosts: cf.toFixed(2),
        grossMarginVariable: mcv.toFixed(2),
        variableMarginRatio: tmcv.toFixed(4),
        operatingResult: operatingResult.toFixed(2),
        breakEvenRevenueDzd: breakEvenDzd.toFixed(2),
        breakEvenDays,
        breakEvenCalendarDate: breakEvenDate,
        safetyMarginDzd: safetyMargin.toFixed(2),
        safetyIndexRatio: safetyIndex.toFixed(4),
        operatingLeverage: operatingLeverage.toFixed(2),
        isProfitable,
        hasReachableBreakEven: hasReachable,
        severity,
        summaryFr,
      },
      trace: {
        ruleCode: 'BREAK_EVEN_ANALYSIS',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          revenueHt: ca.toFixed(2),
          variableCosts: cv.toFixed(2),
          fixedCosts: cf.toFixed(2),
          operatingDaysInYear: daysInYear,
        },
        parametersRead: {},
        legalRef: 'Gestion financière & Modèles d exploitation / SCF',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: isProfitable ? 'COMPLIANT' : 'RISK_DETECTED',
        humanReviewRequired: !isProfitable,
        notes: summaryFr,
      },
    };
  }
}

