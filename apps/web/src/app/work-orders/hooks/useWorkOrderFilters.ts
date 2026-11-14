'use client';

import { useMemo, useState } from 'react';
import { WorkOrder, WorkOrderPriority, WorkOrderStatus } from '@docteurflotte/contracts';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { WorkOrderSourceFilter, WorkOrdersKpiSummary } from '../types';

export function useWorkOrderFilters(workOrders: WorkOrder[]) {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<WorkOrderSourceFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debouncedSearch = useDebounce(searchQuery, 200);

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

