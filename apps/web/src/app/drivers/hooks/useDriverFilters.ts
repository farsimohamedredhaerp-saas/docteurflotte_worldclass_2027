'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DriverRecord, DriversKpiSummary } from '../types';
import { filterDrivers, computeDriversKpiSummary } from '../lib/driverSelectors';

export function useDriverFilters(drivers: DriverRecord[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const categoryFilter = searchParams.get('category') || 'ALL';
  const statusFilter = searchParams.get('status') || 'ALL';
  const searchQuery = searchParams.get('q') || '';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const setCategoryFilter = useCallback(
    (cat: string) => updateParam('category', cat),
    [updateParam]
  );

  const setStatusFilter = useCallback(
    (status: string) => updateParam('status', status),
    [updateParam]
  );

  const setSearchQuery = useCallback(
    (q: string) => updateParam('q', q),
    [updateParam]
  );

  const filteredDrivers = useMemo(() => {
    return filterDrivers(drivers, categoryFilter, statusFilter, searchQuery);
  }, [drivers, categoryFilter, statusFilter, searchQuery]);

  const kpis: DriversKpiSummary = useMemo(() => {
    return computeDriversKpiSummary(drivers);
  }, [drivers]);

  return {
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredDrivers,
    kpis,
  };
}
