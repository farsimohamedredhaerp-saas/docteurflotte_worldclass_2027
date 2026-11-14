'use client';

import React from 'react';
import Link from 'next/link';
import { IconTruck } from '@/components/navigation/TechIcons';

export function DispatchEmptyFleetBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <IconTruck size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Votre parc d&apos;exploitation est vierge
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Aucun véhicule n&apos;est enregistré dans votre organisation. Pour planifier un ordre de
          mission réglementaire, ajoutez un véhicule dans l&apos;inventaire ou activez le mode démo.
        </p>
      </div>
      <Link
        href="/assets"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
      >
        + Ajouter un véhicule
      </Link>
    </div>
  );
}

