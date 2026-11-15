/**
 * Registre Mondial des Packs Pays, Devises, Fiscalité & Conformité Réglementaire
 * Permet à DocteurFlotte 2027 d'opérer à l'échelle internationale (DZ, FR/EU, MA, TN, AE, SA, US)
 * sans constantes économiques ou réglementaires codées en dur dans les services métiers.
 */

export interface CountryEconomicDefaults {
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  measurementSystem: 'METRIC' | 'IMPERIAL';
  vatRatePct: number;
  hourlyLaborRate: number;
  approvalExpenseThreshold: number;
  inactionRiskMultiplier: number;
  referenceFuelPricePerLiter: number;
  defaultAnnualMaintenanceBudget: number;
  regulatoryInspectionAuthority: string;
  heavyInspectionPeriodicityMonths: number;
  lightInspectionPeriodicityMonths: number;
  towingBaseRateTellDzd?: number;
  towingSurchargeSaharaDzd?: number;
  dailyImmobilizationCostDzd?: number;
}

export const GLOBAL_COUNTRY_PACKS: Record<string, CountryEconomicDefaults> = {
  DZ: {
    currency: 'DZD',
    currencySymbol: 'DA',
    locale: 'fr-DZ',
    timezone: 'Africa/Algiers',
    measurementSystem: 'METRIC',
    vatRatePct: 19.0,
    hourlyLaborRate: 1500,
    approvalExpenseThreshold: 100 * 1000,
    inactionRiskMultiplier: 3.5,
    referenceFuelPricePerLiter: 31.0,
    defaultAnnualMaintenanceBudget: 1000 * 1000,
    regulatoryInspectionAuthority: 'ENACTA (Décret exécutif 03-223)',
    heavyInspectionPeriodicityMonths: 6,
    lightInspectionPeriodicityMonths: 12,
    towingBaseRateTellDzd: 35000,
    towingSurchargeSaharaDzd: 75000,
    dailyImmobilizationCostDzd: 25000,
  },
  FR: {
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    measurementSystem: 'METRIC',
    vatRatePct: 20.0,
    hourlyLaborRate: 85,
    approvalExpenseThreshold: 2500,
    inactionRiskMultiplier: 3.2,
    referenceFuelPricePerLiter: 1.72,
    defaultAnnualMaintenanceBudget: 45000,
    regulatoryInspectionAuthority: 'UTAC / DREAL (Contrôle Technique PL/VL)',
    heavyInspectionPeriodicityMonths: 12,
    lightInspectionPeriodicityMonths: 24,
  },
  MA: {
    currency: 'MAD',
    currencySymbol: 'DH',
    locale: 'fr-MA',
    timezone: 'Africa/Casablanca',
    measurementSystem: 'METRIC',
    vatRatePct: 20.0,
    hourlyLaborRate: 250,
    approvalExpenseThreshold: 15000,
    inactionRiskMultiplier: 3.4,
    referenceFuelPricePerLiter: 12.8,
    defaultAnnualMaintenanceBudget: 250000,
    regulatoryInspectionAuthority: 'NARSA (Agence Nationale de la Sécurité Routière)',
    heavyInspectionPeriodicityMonths: 6,
    lightInspectionPeriodicityMonths: 12,
  },
  TN: {
    currency: 'TND',
    currencySymbol: 'DT',
    locale: 'fr-TN',
    timezone: 'Africa/Tunis',
    measurementSystem: 'METRIC',
    vatRatePct: 19.0,
    hourlyLaborRate: 65,
    approvalExpenseThreshold: 4000,
    inactionRiskMultiplier: 3.4,
    referenceFuelPricePerLiter: 2.25,
    defaultAnnualMaintenanceBudget: 65000,
    regulatoryInspectionAuthority: 'ATTT (Agence Technique des Transports Terrestres)',
    heavyInspectionPeriodicityMonths: 6,
    lightInspectionPeriodicityMonths: 12,
  },
  AE: {
    currency: 'AED',
    currencySymbol: 'AED',
    locale: 'en-AE',
    timezone: 'Asia/Dubai',
    measurementSystem: 'METRIC',
    vatRatePct: 5.0,
    hourlyLaborRate: 180,
    approvalExpenseThreshold: 8000,
    inactionRiskMultiplier: 3.6,
    referenceFuelPricePerLiter: 3.05,
    defaultAnnualMaintenanceBudget: 120000,
    regulatoryInspectionAuthority: 'RTA / Tasjeel Vehicle Testing',
    heavyInspectionPeriodicityMonths: 6,
    lightInspectionPeriodicityMonths: 12,
  },
  SA: {
    currency: 'SAR',
    currencySymbol: 'SAR',
    locale: 'ar-SA',
    timezone: 'Asia/Riyadh',
    measurementSystem: 'METRIC',
    vatRatePct: 15.0,
    hourlyLaborRate: 160,
    approvalExpenseThreshold: 7500,
    inactionRiskMultiplier: 3.6,
    referenceFuelPricePerLiter: 1.15,
    defaultAnnualMaintenanceBudget: 110000,
    regulatoryInspectionAuthority: 'MVPI (Fahas) / TGA',
    heavyInspectionPeriodicityMonths: 6,
    lightInspectionPeriodicityMonths: 12,
  },
  US: {
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    timezone: 'America/New_York',
    measurementSystem: 'IMPERIAL',
    vatRatePct: 0.0,
    hourlyLaborRate: 115,
    approvalExpenseThreshold: 3000,
    inactionRiskMultiplier: 3.5,
    referenceFuelPricePerLiter: 1.02,
    defaultAnnualMaintenanceBudget: 50000,
    regulatoryInspectionAuthority: 'FMCSA / DOT Annual Inspection (49 CFR § 396.17)',
    heavyInspectionPeriodicityMonths: 12,
    lightInspectionPeriodicityMonths: 12,
  },
};

export function resolveCountryPack(
  countryCode?: string,
  currency?: string,
): CountryEconomicDefaults {
  const code = (countryCode || '').toUpperCase().trim();
  if (code && GLOBAL_COUNTRY_PACKS[code]) {
    return GLOBAL_COUNTRY_PACKS[code];
  }
  const curr = (currency || '').toUpperCase().trim();
  if (curr) {
    const match = Object.values(GLOBAL_COUNTRY_PACKS).find((p) => p.currency === curr);
    if (match) return match;
  }
  return GLOBAL_COUNTRY_PACKS.DZ;
}

export function formatCurrencyAmount(
  amount: number,
  currency = 'DZD',
  locale?: string,
): string {
  const pack = resolveCountryPack(undefined, currency);
  const resolvedLocale = locale || pack.locale || 'fr-DZ';
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: currency.toUpperCase() === 'DZD' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString()} ${currency.toUpperCase()}`;
  }
}
