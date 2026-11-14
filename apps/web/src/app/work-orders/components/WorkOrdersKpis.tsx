'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { WorkOrdersKpiSummary } from '../types';

export interface WorkOrdersKpisProps {
  kpis: WorkOrdersKpiSummary;
}

export const WorkOrdersKpis: React.FC<WorkOrdersKpisProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Ordres
        </div>
        <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-50">
          {kpis.totalCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
          <span>Historique complet</span>
        </div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          En Attente
        </div>
        <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
          {kpis.scheduledCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Planifiés / À débuter</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          En Intervention
        </div>
        <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
          {kpis.inProgressCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Actuellement sous le pont</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Clôturés
        </div>
        <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
          {kpis.completedCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Requalifiés en service</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827] col-span-2 md:col-span-1">
        <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Dépenses Atelier
        </div>
        <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400 truncate">
          {kpis.totalSpentDzd.toLocaleString('fr-DZ')} <span className="text-xs font-bold text-slate-400">DA</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Main d’œuvre + Pièces OEM</div>
      </Card>
    </div>
  );
};

