'use client';

import { useCallback, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useDecisionEngineFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedConfigId = searchParams.get('configId') || '';

  const setSelectedConfigId = useCallback(
    (configId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (configId) {
        params.set('configId', configId);
      } else {
        params.delete('configId');
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
    selectedConfigId,
    setSelectedConfigId,
  };
}
