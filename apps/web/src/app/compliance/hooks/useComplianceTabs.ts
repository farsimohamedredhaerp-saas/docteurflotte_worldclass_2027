'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ComplianceTab } from '../types';

export function useComplianceTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTab = searchParams.get('tab')?.toUpperCase();
  const activeTab: ComplianceTab =
    rawTab === 'INSURANCE' || rawTab === 'WILAYAS' || rawTab === 'TAXES'
      ? (rawTab as ComplianceTab)
      : 'ENACTA';

  const setActiveTab = useCallback(
    (tab: ComplianceTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { activeTab, setActiveTab };
}

