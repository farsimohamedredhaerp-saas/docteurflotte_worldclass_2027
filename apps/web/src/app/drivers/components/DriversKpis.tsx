'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { DriversKpiSummary } from '../types';

export interface DriversKpisProps {
  kpis: DriversKpiSummary;
}

export const DriversKpis: React.FC<DriversKpisProps> = ({ kpis }) => {
  return (
    <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Total Effectif
        </span>
        <div className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
          {kpis.totalCount}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
          Conducteurs &amp; opérateurs inscrits
        </span>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          En Route / Mission
        </span>
        <div className="font-mono text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
          {kpis.onDutyCount}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
          Actuellement sur les corridors
        </span>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Disponibles
        </span>
        <div className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
          {kpis.availableCount}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
          Prêts pour nouvel ordre de mission
        </span>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Alerte Permis / Visite
        </span>
        <div className="font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
          {kpis.warningCount}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
          Échéance légale imminente ou dépassée
        </span>
      </Card>
    </section>
  );
};
