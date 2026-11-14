'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { WorkOrder, WorkOrderPriority, WorkOrderStatus } from '@docteurflotte/contracts';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { WorkOrderSourceFilter, WorkOrdersKpiSummary } from '../types';

export function useWorkOrderFilters(workOrders: WorkOrder[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStatus = searchParams?.get('status') || 'ALL';
  const initialPriority = searchParams?.get('priority') || 'ALL';
  const initialSource = (searchParams?.get('source') as WorkOrderSourceFilter) || 'ALL';
  const initialQuery = searchParams?.get('q') || '';

  const [selectedStatus, setSelectedStatusState] = useState<string>(initialStatus);
  const [selectedPriority, setSelectedPriorityState] = useState<string>(initialPriority);
  const [selectedSource, setSelectedSourceState] = useState<WorkOrderSourceFilter>(initialSource);
  const [searchQuery, setSearchQueryState] = useState<string>(initialQuery);

  const debouncedSearch = useDebounce(searchQuery, 200);

  // Synchronisation avec les paramètres d'URL (URLSearchParams)
  const updateUrl = useCallback(
    (newParams: { status?: string; priority?: string; source?: string; q?: string }) => {
      if (!pathname) return;
      const current = new URLSearchParams(searchParams ? searchParams.toString() : '');

      const status = newParams.status !== undefined ? newParams.status : selectedStatus;
      const priority = newParams.priority !== undefined ? newParams.priority : selectedPriority;
      const source = newParams.source !== undefined ? newParams.source : selectedSource;
      const q = newParams.q !== undefined ? newParams.q : searchQuery;

      if (status && status !== 'ALL') current.set('status', status);
      else current.delete('status');

      if (priority && priority !== 'ALL') current.set('priority', priority);
      else current.delete('priority');

      if (source && source !== 'ALL') current.set('source', source);
      else current.delete('source');

      if (q && q.trim()) current.set('q', q.trim());
      else current.delete('q');

      const qs = current.toString();
      const targetUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router, searchParams, selectedStatus, selectedPriority, selectedSource, searchQuery]
  );

  const setSelectedStatus = useCallback(
    (status: string) => {
      setSelectedStatusState(status);
      updateUrl({ status });
    },
    [updateUrl]
  );

  const setSelectedPriority = useCallback(
    (priority: string) => {
      setSelectedPriorityState(priority);
      updateUrl({ priority });
    },
    [updateUrl]
  );

  const setSelectedSource = useCallback(
    (source: WorkOrderSourceFilter) => {
      setSelectedSourceState(source);
      updateUrl({ source });
    },
    [updateUrl]
  );

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
  }, []);

  // Met à jour l'URL lorsque la recherche debouncée change
  useEffect(() => {
    updateUrl({ q: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesStatus = selectedStatus === 'ALL' || wo.status === selectedStatus;
      const matchesPriority = selectedPriority === 'ALL' || wo.priority === selectedPriority;
      const isDvirOrder = wo.id.startsWith('ot-dvir') || wo.title.includes('DVIR');
      const matchesSource =
        selectedSource === 'ALL' ||
        (selectedSource === 'DVIR' && isDvirOrder) ||
        (selectedSource === 'PREDICTIVE' && Boolean(wo.resetAlgorithmKey) && !isDvirOrder);

      const query = debouncedSearch.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        wo.title.toLowerCase().includes(query) ||
        wo.assetCode?.toLowerCase().includes(query) ||
        wo.assetName?.toLowerCase().includes(query) ||
        (wo.assignedTo && wo.assignedTo.toLowerCase().includes(query));

      return matchesStatus && matchesPriority && matchesSource && matchesSearch;
    });
  }, [workOrders, selectedStatus, selectedPriority, selectedSource, debouncedSearch]);

  const kpis: WorkOrdersKpiSummary = useMemo(() => {
    const totalCount = workOrders.length;
    const scheduledCount = workOrders.filter((w) => w.status === WorkOrderStatus.SCHEDULED).length;
    const inProgressCount = workOrders.filter((w) => w.status === WorkOrderStatus.IN_PROGRESS).length;
    const completedCount = workOrders.filter((w) => w.status === WorkOrderStatus.COMPLETED).length;
    const criticalCount = workOrders.filter((w) => w.priority === WorkOrderPriority.CRITICAL).length;
    const totalSpentDzd = workOrders.reduce((acc, w) => acc + (w.totalCost || 0), 0);

    return {
      totalCount,
      scheduledCount,
      inProgressCount,
      completedCount,
      criticalCount,
      totalSpentDzd,
    };
  }, [workOrders]);

  return {
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    selectedSource,
    setSelectedSource,
    searchQuery,
    setSearchQuery,
    filteredOrders,
    kpis,
  };
}
