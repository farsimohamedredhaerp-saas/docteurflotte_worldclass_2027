'use client';

import { useMemo, useTransition, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type {
  OemMaintenanceTemplate,
  UpcomingPreventiveDue,
  ClimateZone,
} from '../types';

interface UsePreventiveFiltersProps {
  templates: OemMaintenanceTemplate[];
  upcoming: UpcomingPreventiveDue[];
}

export function usePreventiveFilters({ templates, upcoming }: UsePreventiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'ALL';
  const selectedUrgency = searchParams.get('urgency') || 'ALL';
  const climateZone = (searchParams.get('climate') as ClimateZone) || 'SAHARA';

  const updateParam = useCallback(
    (name: string, value: string, defaultValue: string = '') => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== defaultValue) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      updateParam('q', query, '');
    },
    [updateParam]
  );

  const setSelectedCategory = useCallback(
    (cat: string) => {
      updateParam('category', cat, 'ALL');
    },
    [updateParam]
  );

  const setSelectedUrgency = useCallback(
    (urg: string) => {
      updateParam('urgency', urg, 'ALL');
    },
    [updateParam]
  );

  const setClimateZone = useCallback(
    (zone: ClimateZone) => {
      updateParam('climate', zone, 'SAHARA');
    },
    [updateParam]
  );

  const filteredUpcoming = useMemo(() => {
    return upcoming.filter((due) => {
      const matchesSearch =
        searchQuery === '' ||
        due.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        due.makeModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        due.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        due.assignedSite.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUrgency = selectedUrgency === 'ALL' || due.urgency === selectedUrgency;

      return matchesSearch && matchesUrgency;
    });
  }, [upcoming, searchQuery, selectedUrgency]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesCategory = selectedCategory === 'ALL' || tpl.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        tpl.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.engineOilSpec.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedUrgency,
    setSelectedUrgency,
    climateZone,
    setClimateZone,
    filteredUpcoming,
    filteredTemplates,
  };
}

