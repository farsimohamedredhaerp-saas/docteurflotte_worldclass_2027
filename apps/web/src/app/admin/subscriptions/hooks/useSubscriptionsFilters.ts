'use client';

import { useCallback, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { SubscriptionsTab } from '../types';

export function useSubscriptionsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeTab: SubscriptionsTab =
    (searchParams.get('tab') as SubscriptionsTab) || 'plans';

  const setActiveTab = useCallback(
    (tab: SubscriptionsTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab && tab !== 'plans') {
        params.set('tab', tab);
      } else {
        params.delete('tab');
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(targetUrl, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  return {
    activeTab,
    setActiveTab,
  };
}
