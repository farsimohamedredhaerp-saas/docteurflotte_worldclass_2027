'use client';

import React from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import { WorkOrdersKpiSummary } from '../types';

export interface WorkOrdersKpisProps {
  kpis: WorkOrdersKpiSummary;
}

export const WorkOrdersKpis: React.FC<WorkOrdersKpisProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      <KpiCard
        label="Total Ordres"
        value={kpis.totalCount}
        unit="OT"
        status="neutral"
        sparklineData={[
          Math.max(1, kpis.totalCount - 3),
          Math.max(1, kpis.totalCount - 1),
          kpis.totalCount,
        ]}
      />

      <KpiCard
        label="En Attente"
        value={kpis.scheduledCount}
        unit="planifiés"
        status={kpis.scheduledCount > 0 ? 'warning' : 'nominal'}
        sparklineData={[
          Math.max(0, kpis.scheduledCount + 1),
          kpis.scheduledCount,
        ]}
      />

      <KpiCard
        label="En Intervention"
        value={kpis.inProgressCount}
        unit="en cours"
        status="nominal"
        sparklineData={[
          Math.max(0, kpis.inProgressCount - 1),
          kpis.inProgressCount,
        ]}
      />

      <KpiCard
        label="Clôturés"
        value={kpis.completedCount}
        unit="validés"
        status="nominal"
        sparklineData={[
          Math.max(0, kpis.completedCount - 2),
          kpis.completedCount,
        ]}
      />

      <KpiCard
        label="Dépenses Atelier"
        value={Math.round(kpis.totalSpentDzd).toLocaleString('fr-FR')}
        unit="DA"
        status="nominal"
        className="col-span-2 md:col-span-1"
        sparklineData={[
          Math.max(0, kpis.totalSpentDzd * 0.7),
          Math.max(0, kpis.totalSpentDzd * 0.85),
          kpis.totalSpentDzd,
        ]}
      />
    </div>
  );
};
