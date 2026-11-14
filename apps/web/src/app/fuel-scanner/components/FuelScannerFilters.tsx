'use client';

import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { IconFilter } from '@/components/navigation/TechIcons';
import { FuelStatusFilter } from '../types';

export interface FuelScannerFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: FuelStatusFilter;
  onStatusChange: (status: FuelStatusFilter) => void;
  fuelTypeFilter: string;
  onFuelTypeChange: (fuel: string) => void;
  totalFiltered: number;
}

const statusOptions: { id: FuelStatusFilter; label: string }[] = [
  { id: 'ALL', label: 'Tous les pleins' },
  { id: 'VERIFIED', label: 'Pleins Conformes' },
  { id: 'ANOMALY', label: 'Anomalies CUSUM' },
];

export const FuelScannerFilters: React.FC<FuelScannerFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  fuelTypeFilter,
  onFuelTypeChange,
  totalFiltered,
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-4 shadow-2xs space-y-3.5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Rechercher par station, véhicule, Wilaya..."
            shortcutKey="/"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* SÉLECTEUR DE TYPE DE CARBURANT */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <IconFilter size={13} className="text-slate-400" />
            <select
              value={fuelTypeFilter}
              onChange={(e) => onFuelTypeChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les carburants</option>
              <option value="Gasoil">Gasoil</option>
              <option value="Super">Super</option>
              <option value="Sans Plomb">Sans Plomb</option>
              <option value="GPL">GPL / Sirghaz</option>
            </select>
          </div>
        </div>
      </div>

      {/* ONGLETS DE STATUTS RAPIDES */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStatusChange(opt.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === opt.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-semibold text-slate-400">
          {totalFiltered} reçu{totalFiltered > 1 ? 's' : ''} réconcilié{totalFiltered > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

