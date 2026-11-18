'use client';

import React from 'react';
import { formatCurrency } from '@/lib/currency-formatter';

interface ChantiersMetrics {
  activeSitesCount: number;
  totalSites: number;
  activeAssignmentsCount: number;
  totalHoursRun: number;
  lowStockTanksCount: number;
  totalWorkSituationsDzd: number;
}

interface ChantiersKpiHeaderProps {
  metrics: ChantiersMetrics;
  tanksCount: number;
  workSituationsCount: number;
}

export function ChantiersKpiHeader({
  metrics,
  tanksCount,
  workSituationsCount,
}: ChantiersKpiHeaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
        <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
          Chantiers Actifs
        </span>
        <div className="text-2xl font-bold text-[var(--df-text-main)]">
          {metrics.activeSitesCount}
        </div>
        <p className="text-xs text-[var(--df-text-muted)]">{metrics.totalSites} sites au total</p>
      </div>

      <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Engins Déployés
        </span>
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {metrics.activeAssignmentsCount}
        </div>
        <p className="text-xs text-[var(--df-text-muted)]">Affectations actives terrain</p>
      </div>

      <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Heures Travaillées
        </span>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {metrics.totalHoursRun.toLocaleString()} h
        </div>
        <p className="text-xs text-[var(--df-text-muted)]">Relevés cumulés</p>
      </div>

      <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Cuves & Fluides
        </span>
        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{tanksCount}</div>
        <p className="text-xs text-[var(--df-text-muted)]">
          {metrics.lowStockTanksCount > 0 ? (
            <span className="text-red-500 font-semibold">
              {metrics.lowStockTanksCount} en alerte bas niveau
            </span>
          ) : (
            'Niveaux sous contrôle'
          )}
        </p>
      </div>

      <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
          Situations (DPM)
        </span>
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {formatCurrency(metrics.totalWorkSituationsDzd)}
        </div>
        <p className="text-xs text-[var(--df-text-muted)]">
          {workSituationsCount} décomptes émis
        </p>
      </div>
    </div>
  );
}

