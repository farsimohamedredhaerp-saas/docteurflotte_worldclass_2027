'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useGuideFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeSection = searchParams.get('section') || 'vision';
  const searchQuery = searchParams.get('q') || '';

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

  const setActiveSection = useCallback(
    (sectionId: string) => {
      updateParam('section', sectionId === 'vision' ? null : sectionId);
    },
    [updateParam]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      updateParam('q', query || null);
    },
    [updateParam]
  );

  return {
    activeSection,
    searchQuery,
    setActiveSection,
    setSearchQuery,
  };
}

