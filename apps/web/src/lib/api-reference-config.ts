import { ALGERIA_FISCAL_RATES } from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DynamicReferenceTariffs {
  fuelPrices: {
    gasoil: number;
    sansPlomb: number;
    super: number;
    gpl: number;
  };
  fiscal: {
    tvaStandardRate: number;
    tvaReducedRate: number;
    timbreFiscalRate: number;
    timbreFiscalMinDzd: number;
    timbreFiscalMaxDzd: number;
  };
  economicRates: {
    hourlyLaborRateDzd: number;
    downtimeCostPerHourDzd: number;
    fuelCostPerLiterDzd: number;
    substituteRentalCostPerDayDzd: number;
  };
  source: 'database' | 'fallback_regulatory';
}

const DEFAULT_TARIFFS: DynamicReferenceTariffs = {
  fuelPrices: {
    gasoil: 31.00,
    sansPlomb: 47.00,
    super: 45.97,
    gpl: 12.00,
  },
  fiscal: {
    tvaStandardRate: ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE,
    tvaReducedRate: ALGERIA_FISCAL_RATES.REDUCED_VAT_RATE,
    timbreFiscalRate: 0.01,
    timbreFiscalMinDzd: 10,
    timbreFiscalMaxDzd: 10000,
  },
  economicRates: {
    hourlyLaborRateDzd: 1500,
    downtimeCostPerHourDzd: 3500,
    fuelCostPerLiterDzd: 31.00,
    substituteRentalCostPerDayDzd: 12000,
  },
  source: 'fallback_regulatory',
};

export class ReferenceConfigClient {
  private static cachedConfig: DynamicReferenceTariffs | null = null;
  private static lastFetchTime = 0;
  private static CACHE_TTL_MS = 60000; // 1 minute

  static async getReferenceTariffs(token?: string, forceRefresh = false): Promise<DynamicReferenceTariffs> {
    const now = Date.now();
    if (!forceRefresh && this.cachedConfig && (now - this.lastFetchTime < this.CACHE_TTL_MS)) {
      return this.cachedConfig;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/config/reference-tariffs`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const raw = await res.json();
        const normalized: DynamicReferenceTariffs = {
          fuelPrices: {
            gasoil: raw.fuelPrices?.diesel ?? raw.fuelPrices?.gasoil ?? 31.00,
            sansPlomb: raw.fuelPrices?.gasolineSansPlomb ?? raw.fuelPrices?.sansPlomb ?? 47.00,
            super: raw.fuelPrices?.super ?? 45.97,
            gpl: raw.fuelPrices?.sirghazGpl ?? raw.fuelPrices?.gpl ?? 12.00,
          },
          fiscal: {
            tvaStandardRate: (raw.fiscalRates?.standardVatPercent ? raw.fiscalRates.standardVatPercent / 100 : ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE),
            tvaReducedRate: (raw.fiscalRates?.reducedVatPercent ? raw.fiscalRates.reducedVatPercent / 100 : ALGERIA_FISCAL_RATES.REDUCED_VAT_RATE),
            timbreFiscalRate: (raw.fiscalRates?.cashStampDutyPercent ? raw.fiscalRates.cashStampDutyPercent / 100 : 0.01),
            timbreFiscalMinDzd: raw.fiscalRates?.minStampDutyDzd ?? 10,
            timbreFiscalMaxDzd: raw.fiscalRates?.maxStampDutyDzd ?? 10000,
          },
          economicRates: {
            hourlyLaborRateDzd: raw.economicRates?.hourlyLaborRateDzd ?? 1500,
            downtimeCostPerHourDzd: raw.economicRates?.downtimeCostPerHourDzd ?? 3500,
            fuelCostPerLiterDzd: raw.fuelPrices?.diesel ?? 31.00,
            substituteRentalCostPerDayDzd: raw.economicRates?.substituteRentalCostPerDayDzd ?? 12000,
          },
          source: raw.source || 'database',
        };
        this.cachedConfig = normalized;
        this.lastFetchTime = now;
        return normalized;
      }
    } catch {
      // API non joignable ou erreur réseau
    }

    return this.cachedConfig || DEFAULT_TARIFFS;
  }
}
