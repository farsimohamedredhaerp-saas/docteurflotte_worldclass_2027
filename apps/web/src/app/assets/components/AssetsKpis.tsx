'use client';

import React from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import { AssetsKpiSummary } from '../types';

export interface AssetsKpisProps {
  kpis: AssetsKpiSummary;
}

export const AssetsKpis: React.FC<AssetsKpisProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      <KpiCard
        label="Total Actifs"
        value={kpis.totalCount}
        unit="unités"
        status="neutral"
        sparklineData={[
          Math.max(1, kpis.totalCount - 4),
          Math.max(1, kpis.totalCount - 2),
          kpis.totalCount,
        ]}
      />

      <KpiCard
        label="En Service"
        value={kpis.operationalCount}
        unit="actifs"
        status="nominal"
        sparklineData={[
          Math.max(0, kpis.operationalCount - 3),
          Math.max(0, kpis.operationalCount - 1),
          kpis.operationalCount,
        ]}
      />

      <KpiCard
        label="Maintenance Requise"
        value={kpis.maintenanceCount}
        unit="échéances"
        status={kpis.maintenanceCount > 0 ? 'warning' : 'nominal'}
        sparklineData={[
          Math.max(0, kpis.maintenanceCount + 1),
          kpis.maintenanceCount,
        ]}
      />

      <KpiCard
        label="Arrêt Critique"
        value={kpis.downCount}
        unit="veto"
        status={kpis.downCount > 0 ? 'critical' : 'nominal'}
        sparklineData={[
          Math.max(0, kpis.downCount + 2),
          kpis.downCount,
        ]}
      />

      <KpiCard
        label="Télémétrie Mode 2 (CAN)"
        value={kpis.canJ1939Count}
        unit="J1939"
        status="nominal"
        className="col-span-2 md:col-span-1"
        sparklineData={[
          Math.max(0, kpis.canJ1939Count - 2),
          kpis.canJ1939Count,
        ]}
      />
    </div>
  );
};
