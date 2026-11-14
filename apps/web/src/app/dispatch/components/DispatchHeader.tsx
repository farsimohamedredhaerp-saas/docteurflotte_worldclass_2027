'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { IconCpu, IconShieldCheck } from '@/components/navigation/TechIcons';

export function DispatchHeader() {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="ok" pulse>
              Gate DZ Opposable
            </Badge>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              •
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Code de la Route (Loi 01-14 / Décret 04-415) • Signature Ed25519
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Cockpit de Dispatch & Ordres de Mission Réglementaires (OM)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Machine à états stricte validant en temps réel les 4 portes réglementaires (Véhicule,
            Chauffeur, Trajet 58 Wilayas, Cargaison) et génération de jetons QR cryptographiques
            opposables hors-ligne.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/preventive"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
          >
            <IconCpu size={14} className="text-indigo-500" />
            <span>Cockpit Maintenance</span>
          </Link>
          <Link
            href="/compliance"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <IconShieldCheck size={14} />
            <span>Portail Conformité DZ</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

