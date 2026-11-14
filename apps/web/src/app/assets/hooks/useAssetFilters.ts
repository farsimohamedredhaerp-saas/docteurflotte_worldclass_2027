'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Asset, AssetCategory, AssetStatus } from '@docteurflotte/contracts';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { getTelemetryTier } from '../lib/assetSelectors';
import { AssetsKpiSummary } from '../types';

export function useAssetFilters(assets: Asset[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCategory = searchParams?.get('category') || 'ALL';
  const initialStatus = searchParams?.get('status') || 'ALL';
  const initialQuery = searchParams?.get('q') || '';

  const [selectedCategory, setSelectedCategoryState] = useState<string>(initialCategory);
  const [selectedStatus, setSelectedStatusState] = useState<string>(initialStatus);
  const [searchQuery, setSearchQueryState] = useState<string>(initialQuery);

  const debouncedSearch = useDebounce(searchQuery, 200);

  // Synchronisation avec les paramètres d'URL (URLSearchParams)
  const updateUrl = useCallback(
    (newParams: { category?: string; status?: string; q?: string }) => {
      if (!pathname) return;
      const current = new URLSearchParams(searchParams ? searchParams.toString() : '');

      const category = newParams.category !== undefined ? newParams.category : selectedCategory;
      const status = newParams.status !== undefined ? newParams.status : selectedStatus;
      const q = newParams.q !== undefined ? newParams.q : searchQuery;

      if (category && category !== 'ALL') current.set('category', category);
      else current.delete('category');

      if (status && status !== 'ALL') current.set('status', status);
      else current.delete('status');

      if (q && q.trim()) current.set('q', q.trim());
      else current.delete('q');

      const qs = current.toString();
      const targetUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router, searchParams, selectedCategory, selectedStatus, searchQuery]
  );

  const setSelectedCategory = useCallback(
    (category: string) => {
      setSelectedCategoryState(category);
      updateUrl({ category });
    },
    [updateUrl]
  );

  const setSelectedStatus = useCallback(
    (status: string) => {
      setSelectedStatusState(status);
      updateUrl({ status });
    },
    [updateUrl]
  );

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
  }, []);

  useEffect(() => {
    updateUrl({ q: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;

      const query = debouncedSearch.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        a.code.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        (a.brand && a.brand.toLowerCase().includes(query)) ||
        (a.model && a.model.toLowerCase().includes(query));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [assets, selectedCategory, selectedStatus, debouncedSearch]);

  const kpis: AssetsKpiSummary = useMemo(() => {
    const totalCount = assets.length;
    const operationalCount = assets.filter((a) => a.status === AssetStatus.OPERATIONAL).length;
    const maintenanceCount = assets.filter(
      (a) => a.status === AssetStatus.MAINTENANCE_REQUIRED
    ).length;
    const downCount = assets.filter((a) => a.status === AssetStatus.DOWN).length;
    const canJ1939Count = assets.filter(
      (a) => getTelemetryTier(a) === 'MODE_2_CAN_J1939'
    ).length;

    return {
      totalCount,
      operationalCount,
      maintenanceCount,
      downCount,
      canJ1939Count,
    };
  }, [assets]);

  return {
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    filteredAssets,
    kpis,
  };
}
