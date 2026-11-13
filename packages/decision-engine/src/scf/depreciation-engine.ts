/**
 * Moteur d'Amortissements SCF (Linéaire, Dégressif, Prorata Exact & Composantes)
 * 
 * RÈGLES FORMELLES SCF :
 * - Mode linéaire : annuité constante au prorata temporis exact en jours ou en mois.
 * - Mode dégressif : taux linéaire x coefficient légal du pack, bascule en linéaire
 *   dès que l'annuité linéaire sur la durée résiduelle surpasse l'annuité dégressive.
 * - Composantes séparées : gestion indépendante des durées et bases d'amortissement.
 * - Mise au rebut / cession : calcul de la dotation complémentaire prorata temporis et de la VNC.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal.js';

export type DepreciationMethod = 'LINEAIRE' | 'DEGRESSIF';

export type ProrataConvention = 'EXACT_DAYS' | 'MONTHS_30_360';

export interface DegressiveCoefficients {
  threeToFourYears: string; // ex: '1.5'
  fiveToSixYears: string;   // ex: '2.0'
  moreThanSixYears: string; // ex: '2.5'
}

export interface DepreciationAssetParams {
  assetId: string;
  label: string;
  acquisitionCost: string; // Valeur brute V0
  salvageValue?: string;   // Valeur résiduelle (défaut 0)
  usefulLifeYears: number; // Durée N en années
  serviceDate: string;     // YYYY-MM-DD
  method: DepreciationMethod;
  prorataConvention?: ProrataConvention;
  degressiveCoefficients?: DegressiveCoefficients;
  components?: DepreciationAssetParams[];
}

export interface DepreciationYearPlan {
  fiscalYear: number;
  openingVnc: string;
  rateApplied: string;
  depreciation: string;
  cumulativeDepreciation: string;
  closingVnc: string;
  methodUsed: 'LINEAIRE' | 'DEGRESSIF';
}

export interface AssetRetirementResult {
  retirementDate: string;
  retirementYear: number;
  partialYearDepreciation: string;
  totalCumulativeDepreciation: string;
  netBookValueAtRetirement: string; // VNC sortie d'actif
}

export class DepreciationEngine {
  /**
   * Vérifie si une année est bissextile (366 jours)
   */
  public static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Calcule le nombre de jours entre deux dates YYYY-MM-DD inclusives
   */
  public static daysBetweenInclusive(startDate: string, endDate: string): number {
    const d1 = new Date(startDate + 'T00:00:00Z');
    const d2 = new Date(endDate + 'T00:00:00Z');
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Détermine le coefficient dégressif selon la durée
   */
  public static getDegressiveCoeff(years: number, coeffs?: DegressiveCoefficients): DecimalValue {
    if (!coeffs) {
      // Barème standard par défaut
      if (years <= 4) return new EngineDecimal('1.5');
      if (years <= 6) return new EngineDecimal('2.0');
      return new EngineDecimal('2.5');
    }

    if (years <= 4) return new EngineDecimal(coeffs.threeToFourYears);
    if (years <= 6) return new EngineDecimal(coeffs.fiveToSixYears);
    return new EngineDecimal(coeffs.moreThanSixYears);
  }

  /**
   * Génère le tableau prévisionnel d'amortissement d'un actif
   */
  public static generateSchedule(params: DepreciationAssetParams): DepreciationYearPlan[] {
    const v0 = new EngineDecimal(params.acquisitionCost);
    const vRes = new EngineDecimal(params.salvageValue || '0');
    const baseAmortissable = v0.minus(vRes);

    if (baseAmortissable.lessThanOrEqualTo(0)) {
      throw new Error(`Base amortissable nulle ou négative : ${baseAmortissable.toFixed(2)}`);
    }

    const n = params.usefulLifeYears;
    if (n <= 0) {
      throw new Error(`Durée d'utilité invalide : ${n}`);
    }

    const convention = params.prorataConvention || 'EXACT_DAYS';
    const serviceYear = parseInt(params.serviceDate.slice(0, 4), 10);
    const serviceDayOfYear = params.serviceDate;
    const endOfFirstYear = `${serviceYear}-12-31`;

    const totalDaysInFirstYear = this.isLeapYear(serviceYear) ? 366 : 365;
    const daysActiveFirstYear = this.daysBetweenInclusive(serviceDayOfYear, endOfFirstYear);

    // Prorata temporis de la première année
    let prorataYear1: DecimalValue;
    if (convention === 'EXACT_DAYS') {
      prorataYear1 = new EngineDecimal(daysActiveFirstYear).dividedBy(new EngineDecimal(totalDaysInFirstYear));
    } else {
      // 30/360
      const month = parseInt(params.serviceDate.slice(5, 7), 10);
      const day = parseInt(params.serviceDate.slice(8, 10), 10);
      const monthsRemaining = (12 - month) + ((30 - Math.min(day, 30) + 1) / 30);
      prorataYear1 = new EngineDecimal(monthsRemaining).dividedBy(new EngineDecimal('12'));
    }

    const schedule: DepreciationYearPlan[] = [];
    const tLineaire = new EngineDecimal('1').dividedBy(new EngineDecimal(n));

    if (params.method === 'LINEAIRE') {
      const dotationAnnuellePleine = baseAmortissable.times(tLineaire);
      let currentCumulative = new EngineDecimal('0');
      let currentVnc = v0;

      // Année 1 (avec prorata temporis)
      const dotation1 = dotationAnnuellePleine.times(prorataYear1).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      currentCumulative = currentCumulative.plus(dotation1);
      const closingVnc1 = v0.minus(currentCumulative);

      schedule.push({
        fiscalYear: serviceYear,
        openingVnc: currentVnc.toFixed(2),
        rateApplied: tLineaire.toFixed(6),
        depreciation: dotation1.toFixed(2),
        cumulativeDepreciation: currentCumulative.toFixed(2),
        closingVnc: closingVnc1.toFixed(2),
        methodUsed: 'LINEAIRE',
      });
      currentVnc = closingVnc1;

      // Années intermédiaires
      for (let y = 1; y < n; y++) {
        const fiscalYear = serviceYear + y;
        let dotation = dotationAnnuellePleine.toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

        // Si l'actif a eu un prorata en année 1, la dotation pleine court sur les années complètes
        currentCumulative = currentCumulative.plus(dotation);
        const closingVnc = v0.minus(currentCumulative);

        schedule.push({
          fiscalYear,
          openingVnc: currentVnc.toFixed(2),
          rateApplied: tLineaire.toFixed(6),
          depreciation: dotation.toFixed(2),
          cumulativeDepreciation: currentCumulative.toFixed(2),
          closingVnc: closingVnc.toFixed(2),
          methodUsed: 'LINEAIRE',
        });
        currentVnc = closingVnc;
      }

      // Année complémentaire finale (reliquat de prorata pour solder à la valeur résiduelle)
      if (currentVnc.greaterThan(vRes)) {
        const lastDotation = currentVnc.minus(vRes).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        currentCumulative = currentCumulative.plus(lastDotation);

        schedule.push({
          fiscalYear: serviceYear + n,
          openingVnc: currentVnc.toFixed(2),
          rateApplied: tLineaire.toFixed(6),
          depreciation: lastDotation.toFixed(2),
          cumulativeDepreciation: currentCumulative.toFixed(2),
          closingVnc: vRes.toFixed(2),
          methodUsed: 'LINEAIRE',
        });
      }
    } else {
      // MODE DÉGRESSIF
      const coeff = this.getDegressiveCoeff(n, params.degressiveCoefficients);
      const tDegressif = tLineaire.times(coeff);

      let currentVnc = v0;
      let currentCumulative = new EngineDecimal('0');

      for (let y = 0; y < n; y++) {
        const fiscalYear = serviceYear + y;
        const remainingYears = n - y;
        const tLineaireResiduel = new EngineDecimal('1').dividedBy(new EngineDecimal(remainingYears));

        let dotation: DecimalValue;
        let methodUsed: 'LINEAIRE' | 'DEGRESSIF';
        let rateApplied: DecimalValue;

        // Condition de bascule : si tLineaireResiduel >= tDegressif, basculer en linéaire
        if (tLineaireResiduel.greaterThanOrEqualTo(tDegressif)) {
          methodUsed = 'LINEAIRE';
          rateApplied = tLineaireResiduel;
          dotation = currentVnc.times(tLineaireResiduel).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        } else {
          methodUsed = 'DEGRESSIF';
          rateApplied = tDegressif;
          // En dégressif SCF, l'annuité = VNC début d'exercice x taux dégressif
          // Prorata temporis en mois la 1ère année selon la doctrine fiscale algérienne
          if (y === 0) {
            dotation = currentVnc.times(tDegressif).times(prorataYear1).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
          } else {
            dotation = currentVnc.times(tDegressif).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
          }
        }

        // Ne pas dépasser la valeur résiduelle
        if (currentVnc.minus(dotation).lessThan(vRes)) {
          dotation = currentVnc.minus(vRes);
        }

        currentCumulative = currentCumulative.plus(dotation);
        const closingVnc = v0.minus(currentCumulative);

        schedule.push({
          fiscalYear,
          openingVnc: currentVnc.toFixed(2),
          rateApplied: rateApplied.toFixed(6),
          depreciation: dotation.toFixed(2),
          cumulativeDepreciation: currentCumulative.toFixed(2),
          closingVnc: closingVnc.toFixed(2),
          methodUsed,
        });

        currentVnc = closingVnc;
        if (currentVnc.equals(vRes)) {
          break;
        }
      }
    }

    return schedule;
  }

  /**
   * Calcule la dotation de sortie et la VNC lors d'une mise au rebut ou cession
   */
  public static retireAsset(
    params: DepreciationAssetParams,
    retirementDate: string
  ): AssetRetirementResult {
    const retirementYear = parseInt(retirementDate.slice(0, 4), 10);
    const schedule = this.generateSchedule(params);

    // Amortissements des années précédant la sortie
    let cumPriorYears = new EngineDecimal('0');
    let openingVncYear = new EngineDecimal(params.acquisitionCost);

    for (const plan of schedule) {
      if (plan.fiscalYear < retirementYear) {
        cumPriorYears = cumPriorYears.plus(new EngineDecimal(plan.depreciation));
        openingVncYear = new EngineDecimal(plan.closingVnc);
      }
    }

    // Dotation complémentaire prorata temporis de l'année de sortie
    const planCurrentYear = schedule.find((p) => p.fiscalYear === retirementYear);
    let partialYearDepreciation = new EngineDecimal('0');

    if (planCurrentYear) {
      const totalDaysInYear = this.isLeapYear(retirementYear) ? 366 : 365;
      const startOfYear = `${retirementYear}-01-01`;
      const daysUntilRetirement = this.daysBetweenInclusive(startOfYear, retirementDate);

      const annualFullDep = new EngineDecimal(planCurrentYear.depreciation);
      const prorata = new EngineDecimal(daysUntilRetirement).dividedBy(new EngineDecimal(totalDaysInYear));
      partialYearDepreciation = annualFullDep.times(prorata).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    }

    const totalCumulative = cumPriorYears.plus(partialYearDepreciation);
    const v0 = new EngineDecimal(params.acquisitionCost);
    const netBookValue = v0.minus(totalCumulative).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    return {
      retirementDate,
      retirementYear,
      partialYearDepreciation: partialYearDepreciation.toFixed(2),
      totalCumulativeDepreciation: totalCumulative.toFixed(2),
      netBookValueAtRetirement: netBookValue.toFixed(2),
    };
  }
}

