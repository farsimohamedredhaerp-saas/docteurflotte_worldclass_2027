/**
 * Types & Contrats pour le Simulateur d'Arbitrage des Régimes Fiscaux et Juridiques Algériens
 * Auto-Entrepreneur (ANAE) vs IFU vs Réel IRG vs SARL/EURL IBS
 */

export type ActivitySectorCategory = 'SERVICES' | 'COMMERCE' | 'PRODUCTION' | 'BTPH';

export interface RegimeArbitrageInputDto {
  fiscalYear?: number;
  activityCategory: ActivitySectorCategory;
  projectedAnnualRevenueGoods: string;
  projectedAnnualRevenueServices: string;
  operatingExpenses: string;
  employeeCount: number;
  totalGrossPayroll: string;
  desiredManagerRemuneration?: string;
}

export type RegimeCode =
  | 'AUTO_ENTREPRENEUR'
  | 'IFU_FORFAITAIRE'
  | 'REEL_SIMPLIFIE'
  | 'SARL_EURL_IBS';

export interface RegimeComparisonItem {
  regimeCode: RegimeCode;
  labelFr: string;
  personalityType: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  isEligible: boolean;
  ineligibilityReasonFr: string | null;
  taxAmountDzd: string;
  socialContributionsDzd: string;
  totalLeviesDzd: string;
  netDisposableIncomeDzd: string;
  effectiveTaxRatePct: string;
  administrativeBurden: 'TRES_FAIBLE' | 'FAIBLE' | 'MOYENNE' | 'ELEVEE';
  accountingRequirementsFr: string;
  breakdown: Record<string, string>;
}

export interface RegimeArbitrageEvaluation {
  fiscalYear: number;
  totalTurnoverDzd: string;
  operatingExpensesDzd: string;
  grossPayrollDzd: string;
  employeeCount: number;
  regimes: RegimeComparisonItem[];
  recommendedRegime: RegimeCode;
  recommendedRegimeLabelFr: string;
  annualSavingsVsWorstDzd: string;
  actionableSummaryFr: string;
}

