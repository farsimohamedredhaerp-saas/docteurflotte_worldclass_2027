'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ALGERIA_FISCAL_RATES } from '@docteurflotte/contracts';
import { ReferenceConfigClient, DynamicReferenceTariffs } from '../lib/api-reference-config';
import { useDemoMode } from './DemoModeContext';

interface SystemConfigContextType {
  tariffs: DynamicReferenceTariffs;
  loading: boolean;
  refreshTariffs: () => Promise<void>;
  getFuelPrice: (type: 'gasoil' | 'sansPlomb' | 'super' | 'gpl') => number;
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

const SystemConfigContext = createContext<SystemConfigContextType>({
  tariffs: DEFAULT_TARIFFS,
  loading: false,
  refreshTariffs: async () => {},
  getFuelPrice: (type) => DEFAULT_TARIFFS.fuelPrices[type] ?? 31.00,
});

export function SystemConfigProvider({ children }: { children: ReactNode }) {
  const { session } = useDemoMode();
  const [tariffs, setTariffs] = useState<DynamicReferenceTariffs>(DEFAULT_TARIFFS);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTariffs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ReferenceConfigClient.getReferenceTariffs(session?.token || undefined, true);
      setTariffs(data);
    } catch {
      // Garder les tarifs actuels ou par défaut
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    fetchTariffs();
  }, [fetchTariffs]);

  const getFuelPrice = useCallback(
    (type: 'gasoil' | 'sansPlomb' | 'super' | 'gpl'): number => {
      return tariffs.fuelPrices[type] ?? 31.00;
    },
    [tariffs],
  );

  return (
    <SystemConfigContext.Provider
      value={{
        tariffs,
        loading,
        refreshTariffs: fetchTariffs,
        getFuelPrice,
      }}
    >
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (!context) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
}

