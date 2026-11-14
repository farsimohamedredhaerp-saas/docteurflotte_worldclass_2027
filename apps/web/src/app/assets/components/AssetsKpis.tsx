'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { AssetsKpiSummary } from '../types';

export interface AssetsKpisProps {
  kpis: AssetsKpiSummary;
}

export const AssetsKpis: React.FC<AssetsKpisProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Actifs
        </div>
        <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-50">
          {kpis.totalCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Parc global supervisé</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          En Service
        </div>
        <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
          {kpis.operationalCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Requalifiés en mission</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Maintenance Requise
        </div>
        <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
          {kpis.maintenanceCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Échéance compteur échue</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          Arrêt Critique (Down)
        </div>
        <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
          {kpis.downCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Verrou DVIR ou panne</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827] col-span-2 md:col-span-1">
        <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Télémétrie Mode 2 (CAN)
        </div>
        <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
          {kpis.canJ1939Count}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">J1939 &amp; capteurs temps réel</div>
      </Card>
    </div>
  );
};
