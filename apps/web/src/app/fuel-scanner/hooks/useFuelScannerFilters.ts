'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FuelReceiptScanResult } from '@docteurflotte/contracts';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { FuelStatusFilter, FuelScannerKpiSummary } from '../types';

export function useFuelScannerFilters(receipts: FuelReceiptScanResult[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStatus = (searchParams?.get('status') as FuelStatusFilter) || 'ALL';
  const initialQuery = searchParams?.get('q') || '';
  const initialFuelType = searchParams?.get('fuelType') || 'ALL';

  const [filterStatus, setFilterStatusState] = useState<FuelStatusFilter>(initialStatus);
  const [searchQuery, setSearchQueryState] = useState<string>(initialQuery);
  const [fuelTypeFilter, setFuelTypeFilterState] = useState<string>(initialFuelType);

  const debouncedSearch = useDebounce(searchQuery, 200);

  // Synchronisation avec les paramètres d'URL (URLSearchParams)
  const updateUrl = useCallback(
    (newParams: { status?: string; q?: string; fuelType?: string }) => {
      if (!pathname) return;
      const current = new URLSearchParams(searchParams ? searchParams.toString() : '');

      const status = newParams.status !== undefined ? newParams.status : filterStatus;
      const q = newParams.q !== undefined ? newParams.q : searchQuery;
      const fuelType = newParams.fuelType !== undefined ? newParams.fuelType : fuelTypeFilter;

      if (status && status !== 'ALL') current.set('status', status);
      else current.delete('status');

      if (q && q.trim()) current.set('q', q.trim());
      else current.delete('q');

      if (fuelType && fuelType !== 'ALL') current.set('fuelType', fuelType);
      else current.delete('fuelType');

      const qs = current.toString();
      const targetUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router, searchParams, filterStatus, searchQuery, fuelTypeFilter]
  );

  const setFilterStatus = useCallback(
    (status: FuelStatusFilter) => {
      setFilterStatusState(status);
      updateUrl({ status });
    },
    [updateUrl]
  );

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
  }, []);

  const setFuelTypeFilter = useCallback(
    (fuelType: string) => {
      setFuelTypeFilterState(fuelType);
      updateUrl({ fuelType });
    },
    [updateUrl]
  );

  useEffect(() => {
    updateUrl({ q: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const statusMatches =
        filterStatus === 'ALL' ||
        (filterStatus === 'VERIFIED' && r.reconciliation.reconciliationStatus === 'VERIFIED') ||
        (filterStatus === 'ANOMALY' && r.reconciliation.reconciliationStatus !== 'VERIFIED');

      const fuelMatches =
        fuelTypeFilter === 'ALL' ||
        (r.fuelType && r.fuelType.toLowerCase() === fuelTypeFilter.toLowerCase());

      const query = debouncedSearch.trim().toLowerCase();
      const searchMatches =
        query === '' ||
        r.stationName.toLowerCase().includes(query) ||
        r.assetCode?.toLowerCase().includes(query) ||
        r.assetName?.toLowerCase().includes(query) ||
        (r.stationWilaya && r.stationWilaya.toLowerCase().includes(query));

      return statusMatches && fuelMatches && searchMatches;
    });
  }, [receipts, filterStatus, fuelTypeFilter, debouncedSearch]);

  const kpis: FuelScannerKpiSummary = useMemo(() => {
    const totalCount = receipts.length;
    const verifiedCount = receipts.filter(
      (r) => r.reconciliation.reconciliationStatus === 'VERIFIED'
    ).length;
    const anomalyCount = receipts.filter(
      (r) => r.reconciliation.reconciliationStatus !== 'VERIFIED'
    ).length;
    const totalLiters = receipts.reduce((acc, r) => acc + (r.liters || 0), 0);
    const totalSpentDzd = receipts.reduce((acc, r) => acc + (r.totalAmountDzd || 0), 0);
    const gasoilLiters = receipts
      .filter((r) => (r.fuelType || '').toLowerCase().includes('gasoil'))
      .reduce((acc, r) => acc + (r.liters || 0), 0);

    // Calcul de l'économie estimée Sirghaz vs Essence (70% d'économie unitaire)
    const sirghazLiters = receipts
      .filter((r) => (r.fuelType || '').toLowerCase().includes('gpl'))
      .reduce((acc, r) => acc + (r.liters || 0), 0);
    const sirghazEconomyDzd = Math.round(sirghazLiters * (47 - 12 * 1.2));

    return {
      totalCount,
      verifiedCount,
      anomalyCount,
      totalLiters,
      totalSpentDzd,
      gasoilLiters,
      sirghazEconomyDzd,
    };
  }, [receipts]);

  return {
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    fuelTypeFilter,
    setFuelTypeFilter,
    filteredReceipts,
    kpis,
  };
}

