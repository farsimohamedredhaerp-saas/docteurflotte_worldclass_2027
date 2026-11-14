'use client';

import React from 'react';
import { WorkOrderStatus } from '@docteurflotte/contracts';
import { SearchInput } from '@/components/ui/SearchInput';
import { IconFilter, IconShieldCheck, IconCpu } from '@/components/navigation/TechIcons';
import { WorkOrderSourceFilter } from '../types';

export interface WorkOrdersFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedSource: WorkOrderSourceFilter;
  onSourceChange: (source: WorkOrderSourceFilter) => void;
  totalFiltered: number;
}

const statusOptions = [
  { id: 'ALL', label: 'Tous les statuts' },
  { id: WorkOrderStatus.SCHEDULED, label: 'Planifiés' },
  { id: WorkOrderStatus.IN_PROGRESS, label: 'En cours' },
  { id: WorkOrderStatus.COMPLETED, label: 'Clôturés' },
];

export const WorkOrdersFilters: React.FC<WorkOrdersFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  selectedSource,
  onSourceChange,
  totalFiltered,
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-4 shadow-2xs space-y-3.5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Rechercher par titre, immatriculation, désignation..."
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* SÉLECTEUR DE PRIORITÉ */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <IconFilter size={13} className="text-slate-400" />
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les priorités</option>
              <option value="CRITICAL">Critique</option>
              <option value="HIGH">Haute</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="LOW">Basse</option>
            </select>
          </div>

          {/* SÉLECTEUR DE SOURCE D'ORIGINE */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
            <button
              type="button"
              onClick={() => onSourceChange('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSource === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => onSourceChange('DVIR')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSource === 'DVIR'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <IconShieldCheck size={12} />
              <span>DVIR</span>
            </button>
            <button
              type="button"
              onClick={() => onSourceChange('PREDICTIVE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSource === 'PREDICTIVE'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <IconCpu size={12} />
              <span>Prédictif</span>
            </button>
          </div>
        </div>
      </div>

      {/* ONGLET DE STATUTS RAPIDES */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStatusChange(opt.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === opt.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-semibold text-slate-400">
          {totalFiltered} ordre{totalFiltered > 1 ? 's' : ''} affiché{totalFiltered > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

