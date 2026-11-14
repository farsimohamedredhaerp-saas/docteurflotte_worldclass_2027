'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useCopilotFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const initialQuery = searchParams.get('q') || '';

  const setQueryParam = useCallback(
    (query: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query && query.trim() !== '') {
        params.set('q', query.trim());
      } else {
        params.delete('q');
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  return {
    initialQuery,
    setQueryParam,
  };
}

