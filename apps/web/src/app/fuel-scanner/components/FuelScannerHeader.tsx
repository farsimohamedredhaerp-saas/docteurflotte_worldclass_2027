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

export interface FuelScannerHeaderProps {
  onOpenManualModal: () => void;
  verifiedCount: number;
  anomalyCount: number;
}

export const FuelScannerHeader: React.FC<FuelScannerHeaderProps> = ({
  onOpenManualModal,
  verifiedCount,
  anomalyCount,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="ok" pulse>
              Réconciliation Carburant &amp; Algorithme CUSUM
            </Badge>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit Naftal • Compensation Valhalla • Huissier Judiciaire CUSUM
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Scanner Naftal &amp; Détection des Siphonnages
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Ingestion par OCR des reçus Naftal, confrontation géodésique à la jauge CAN/Traccar, détection des pertes avec compensation du dévers topographique et constitution du dossier technique opposable.
          </p>

          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenManualModal}
              className="inline-flex items-center gap-1.5"
            >
              <IconPlus size={14} />
              <span>Saisir un Plein Manuel</span>
            </Button>
            <Link
              href="/assets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconTruck size={13} className="text-blue-500" />
              <span>Parc d’Actifs</span>
            </Link>
            <Link
              href="/work-orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconWrench size={13} className="text-amber-500" />
              <span>Ordres d’Atelier</span>
            </Link>
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconShieldCheck size={13} className="text-rose-500" />
              <span>Conformité 58 Wilayas</span>
            </Link>
          </div>
        </div>

        {/* WIDGET HUD STATUT CUSUM */}
        <div className="w-full lg:w-auto min-w-[260px] p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] flex flex-col gap-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Contrôle Anti-Fraude CUSUM</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Actif
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {verifiedCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Pleins Vérifiés</div>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
              <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                {anomalyCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Alertes Litige</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <IconCpu size={12} className="text-blue-500" />
            <span>Tolérance : &plusmn;5,0 L (Flotteur CAN)</span>
          </div>
        </div>
      </div>
    </section>
  );
};

