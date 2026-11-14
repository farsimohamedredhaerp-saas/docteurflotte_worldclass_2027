'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SearchMode, BulkCategory } from '../types';

export function useOemScraperFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const searchMode: SearchMode = (searchParams.get('mode') as SearchMode) || 'VIN';
  const vinParam = searchParams.get('vin') || '';
  const makeParam = searchParams.get('make') || '';
  const modelParam = searchParams.get('model') || '';
  const categoryParam: BulkCategory = (searchParams.get('category') as BulkCategory) || 'TRUCKS_BUSES';

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value.trim() !== '') {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const setSearchMode = useCallback(
    (mode: SearchMode) => {
      updateParam('mode', mode === 'VIN' ? null : mode);
    },
    [updateParam]
  );

  const setVinParam = useCallback(
    (vin: string) => {
      updateParam('vin', vin || null);
    },
    [updateParam]
  );

  const setCategoryParam = useCallback(
    (cat: BulkCategory) => {
      updateParam('category', cat === 'TRUCKS_BUSES' ? null : cat);
    },
    [updateParam]
  );

  return {
    searchMode,
    vinParam,
    makeParam,
    modelParam,
    categoryParam,
    setSearchMode,
    setVinParam,
    setCategoryParam,
    updateParam,
  };
}
