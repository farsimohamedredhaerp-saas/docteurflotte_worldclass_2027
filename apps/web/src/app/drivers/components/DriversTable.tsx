'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  IconEdit,
  IconTrash,
  IconUsers,
} from '@/components/navigation/TechIcons';
import { DriverRecord } from '../types';
import { getDriverStatusBadgeConfig } from '../lib/driverSelectors';

export interface DriversTableProps {
  drivers: DriverRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onOpenEdit: (driver: DriverRecord) => void;
  onOpenDelete: (id: string, name: string) => void;
  onOpenAdd: () => void;
}

export const DriversTable: React.FC<DriversTableProps> = ({
  drivers,
  searchQuery,
  onSearchChange,
  isLoading,
  onOpenEdit,
  onOpenDelete,
  onOpenAdd,
}) => {
  return (
    <section className="lg:col-span-3">
      {/* RECHERCHE ET TOTAL */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Rechercher par chauffeur, matricule, véhicule..."
            shortcutKey="/"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 px-1 self-center whitespace-nowrap">
          <strong className="font-mono text-slate-900 dark:text-slate-100">{drivers.length}</strong> conducteur
          {drivers.length > 1 ? 's' : ''} filtré{drivers.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* TABLEAU DES CONDUCTEURS */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-12 text-center text-slate-500 text-xs">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent align-[-0.125em] mb-2" />
          <p>Chargement de l’effectif...</p>
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title="Aucun conducteur trouvé"
          description={
            searchQuery
              ? 'Aucun profil chauffeur ne correspond à vos critères de recherche actuels.'
              : 'Votre effectif de chauffeurs est actuellement vierge. Enregistrez votre premier conducteur.'
          }
          action={{
            label: 'Ajouter un Conducteur',
            onClick: onOpenAdd,
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-3 px-4">Conducteur &amp; Contact</th>
                  <th className="py-3 px-4">Permis &amp; Validité</th>
                  <th className="py-3 px-4">Visite Médicale</th>
                  <th className="py-3 px-4">Véhicule Affecté</th>
                  <th className="py-3 px-4">Score Éco</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {drivers.map((d) => {
                  const badge = getDriverStatusBadgeConfig(d.status);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{d.name}</div>
                        <div className="font-mono text-[10.5px] text-slate-500">
                          {d.matriculeNumber} • {d.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="neutral">Permis {d.licenseCategory}</Badge>
                        </div>
                        <div className="font-mono text-[10.5px] text-slate-400 mt-0.5">
                          Exp : {d.licenseExpiry}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`text-xs ${
                            d.status === 'LICENSE_WARNING'
                              ? 'font-bold text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {d.medicalCheckExpiry}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {d.assignedVehiclePlate}
                        </div>
                        <div className="text-[10.5px] text-slate-500 truncate max-w-[140px]">
                          {d.assignedVehicleModel}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold text-xs ${
                            d.ecoDrivingScore >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {d.ecoDrivingScore} / 100
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.containerClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenEdit(d)}
                            title="Modifier ce conducteur"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDelete(d.id, d.name)}
                            title="Supprimer ce conducteur"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
