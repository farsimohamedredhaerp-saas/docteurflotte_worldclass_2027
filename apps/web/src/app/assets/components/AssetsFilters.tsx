'use client';

import React from 'react';
import { AssetCategory, AssetStatus } from '@docteurflotte/contracts';
import { SearchInput } from '@/components/ui/SearchInput';
import { IconFilter } from '@/components/navigation/TechIcons';

export interface AssetsFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  totalFiltered: number;
}

const statusOptions = [
  { id: 'ALL', label: 'Tous les statuts' },
  { id: AssetStatus.OPERATIONAL, label: 'En service' },
  { id: AssetStatus.MAINTENANCE_REQUIRED, label: 'Maintenance due' },
  { id: AssetStatus.DOWN, label: 'Hors service' },
];

export const AssetsFilters: React.FC<AssetsFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  totalFiltered,
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-4 shadow-2xs space-y-3.5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Rechercher par code, nom, marque, modèle..."
            shortcutKey="/"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* SÉLECTEUR DE CATÉGORIE */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <IconFilter size={13} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les catégories</option>
              <option value={AssetCategory.HEAVY_TRUCK}>Poids Lourds (Tracteur/Porteur)</option>
              <option value={AssetCategory.ROAD_VEHICLE}>Véhicules Utilitaires / Légers</option>
              <option value={AssetCategory.CONSTRUCTION_EQUIPMENT}>Engins BTP / Miniers</option>
              <option value={AssetCategory.INDUSTRIAL_MACHINE}>Machines Industrielles</option>
              <option value={AssetCategory.OTHER}>Autres Équipements</option>
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
          {totalFiltered} actif{totalFiltered > 1 ? 's' : ''} affiché{totalFiltered > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
