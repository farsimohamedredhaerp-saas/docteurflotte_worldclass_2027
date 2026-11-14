'use client';

import React from 'react';
import { IconFilter } from '@/components/navigation/TechIcons';
import { DriversKpiSummary } from '../types';

export interface DriversSidebarFiltersProps {
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  kpis: DriversKpiSummary;
}

const categoryOptions = [
  { id: 'ALL', label: 'Toutes Catégories' },
  { id: 'HEAVY', label: 'Poids Lourds (C/E)' },
  { id: 'BTP', label: 'Engins BTP (CACES)' },
  { id: 'LIGHT', label: 'Utilitaires (B)' },
];

export const DriversSidebarFilters: React.FC<DriversSidebarFiltersProps> = ({
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  kpis,
}) => {
  const statusItems = [
    { id: 'ALL', label: 'Tout l’Effectif', count: kpis.totalCount },
    { id: 'ON_DUTY', label: 'En Mission', count: kpis.onDutyCount },
    { id: 'AVAILABLE', label: 'Disponibles', count: kpis.availableCount },
    { id: 'LICENSE_WARNING', label: 'Alerte Visite / Permis', count: kpis.warningCount },
  ];

  return (
    <aside className="lg:col-span-1 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Filtres Équipage
        </span>
        <IconFilter size={14} className="text-slate-400" />
      </div>

      {/* STATUT OPÉRATIONNEL */}
      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Statut Opérationnel
        </div>
        <div className="flex flex-col gap-1">
          {statusItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onStatusChange(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === item.id
                  ? item.id === 'LICENSE_WARNING'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  statusFilter === item.id
                    ? 'bg-black/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-200/80 dark:bg-slate-800 mb-5" />

      {/* CATÉGORIE PERMIS */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Catégorie de Permis DZ
        </div>
        <div className="flex flex-col gap-1">
          {categoryOptions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onCategoryChange(f.id)}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === f.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
