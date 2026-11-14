'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconPlus,
  IconTruck,
  IconWrench,
  IconShieldCheck,
  IconCpu,
} from '@/components/navigation/TechIcons';

export interface WorkOrdersHeaderProps {
  onOpenCreate: () => void;
  inProgressCount: number;
  criticalCount: number;
}

export const WorkOrdersHeader: React.FC<WorkOrdersHeaderProps> = ({
  onOpenCreate,
  inProgressCount,
  criticalCount,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="ok" pulse>
              Atelier Connecté &amp; Maintenance Curative
            </Badge>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              GMAO Temps Réel • Suivi MO &amp; Pièces OEM • Factures DGI A4
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Ordres de Travail &amp; Interventions d’Atelier
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Orchestration complète des opérations de maintenance, calcul automatique du coût horaire barème DGI, enregistrement des temps d’arrêt et levée certifiée des verrous de sécurité DVIR.
          </p>

          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5"
            >
              <IconPlus size={14} />
              <span>Créer un Ordre de Travail</span>
            </Button>
            <Link
              href="/assets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconTruck size={13} className="text-blue-500" />
              <span>Parc d’Actifs</span>
            </Link>
            <Link
              href="/preventive"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconWrench size={13} className="text-amber-500" />
              <span>Plans Préventifs OEM</span>
            </Link>
            <Link
              href="/dvir"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconShieldCheck size={13} className="text-rose-500" />
              <span>Verrous DVIR</span>
            </Link>
          </div>
        </div>

        {/* WIDGET HUD STATUT ATELIER */}
        <div className="w-full lg:w-auto min-w-[260px] p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] flex flex-col gap-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Capacité Atelier Actuelle</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Actif
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                {inProgressCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Ponts Occupés</div>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
              <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                {criticalCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Urgences DVIR</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <IconCpu size={12} className="text-blue-500" />
            <span>Moteur Prescriptif SAD $\to$ ADS</span>
          </div>
        </div>
      </div>
    </section>
  );
};

