'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconTruck,
  IconShieldCheck,
  IconPlus,
} from '@/components/navigation/TechIcons';

export interface DriversHeaderProps {
  onOpenAdd: () => void;
  totalDrivers: number;
  onDutyCount: number;
}

export const DriversHeader: React.FC<DriversHeaderProps> = ({
  onOpenAdd,
  totalDrivers,
  onDutyCount,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="ok" pulse>
              Ressources Humaines &amp; Équipages de Flotte
            </Badge>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Loi 18-07 ANPDP • Données Pseudonymisées • Code de la Route DZ
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Conducteurs, Permis &amp; Éco-Conduite
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Gestion des habilitations chauffeurs, suivi de validité des visites médicales obligatoires, éco-scores de conduite et affectation en temps réel aux corridors logistiques nationaux.
          </p>

          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAdd}
              className="inline-flex items-center gap-1.5"
            >
              <IconPlus size={14} />
              <span>Nouveau Conducteur</span>
            </Button>
            <Link
              href="/dispatch"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconTruck size={13} className="text-blue-500" />
              <span>Dispatching TOPSIS</span>
            </Link>
            <Link
              href="/eco-driving"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconShieldCheck size={13} className="text-emerald-500" />
              <span>Éco-Conduite</span>
            </Link>
          </div>
        </div>

        {/* HUD STATUT EFFECTIF */}
        <div className="w-full lg:w-auto min-w-[260px] p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] flex flex-col gap-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Disponibilité Effectif</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Total Conducteurs</span>
            <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {totalDrivers} Actifs
            </strong>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">En Mission / Route</span>
            <strong className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {onDutyCount} en cours
            </strong>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Conformité Loi 18-07</span>
            <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Pseudonymisé ANPDP
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
};
