'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { DvirKpiSummary, DvirLanguage } from '../types';
import { DVIR_I18N } from '../lib/dvirConstants';

export interface DvirKpisProps {
  kpis: DvirKpiSummary;
  language: DvirLanguage;
}

export const DvirKpis: React.FC<DvirKpisProps> = ({ kpis, language }) => {
  const t = DVIR_I18N[language];

  return (
    <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.statTotal}
        </span>
        <div className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
          {kpis.totalCount}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
          {t.statTotalDesc}
        </span>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          {t.statPass}
        </span>
        <div className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
          {kpis.passCount}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
          {t.statPassDesc}
        </span>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          {t.statCritical}
        </span>
        <div className="font-mono text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
          {kpis.criticalCount}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
          {t.statCriticalDesc}
        </span>
      </Card>
    </section>
  );
};
