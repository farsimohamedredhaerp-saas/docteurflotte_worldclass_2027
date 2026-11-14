'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useAiObservabilityFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const moduleFilter = searchParams.get('module') || 'ALL';

  const setModuleFilter = useCallback(
    (moduleName: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (moduleName && moduleName !== 'ALL') {
        params.set('module', moduleName);
      } else {
        params.delete('module');
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  return {
    moduleFilter,
    setModuleFilter,
  };
}
