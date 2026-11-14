'use client';

import { useCallback, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { DecisionsTab, UrgencyFilter } from '../types';

export function useDecisionsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeTab: DecisionsTab = (searchParams.get('tab') as DecisionsTab) || 'MAINTENANCE';
  const selectedUrgency: UrgencyFilter = (searchParams.get('urgency') as UrgencyFilter) || 'ALL';

  const updateParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== defaultValue) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(targetUrl, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const setActiveTab = useCallback(
    (tab: DecisionsTab) => {
      updateParam('tab', tab, 'MAINTENANCE');
    },
    [updateParam]
  );

  const setSelectedUrgency = useCallback(
    (urgency: UrgencyFilter) => {
      updateParam('urgency', urgency, 'ALL');
    },
    [updateParam]
  );

  return {
    activeTab,
    setActiveTab,
    selectedUrgency,
    setSelectedUrgency,
  };
}
