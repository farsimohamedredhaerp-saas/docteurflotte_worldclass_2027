'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { IconAlertTriangle } from '@/components/navigation/TechIcons';
import { WILAYA_RESTRICTIONS } from '../types';

export function WilayaRestrictionsGrid() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Arrêtés Préfectoraux de Circulation Poids Lourds
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dérogations et fenêtres horaires d&apos;interdiction de traversée urbaine pour les 58
          Wilayas d&apos;Algérie.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WILAYA_RESTRICTIONS.map((wil) => (
          <div
            key={wil.wilayaCode}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  Wilaya de {wil.wilayaName} ({wil.wilayaCode})
                </div>
                <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {wil.legalReference}
                </div>
              </div>
              <Badge
                variant={wil.activeStatus === 'STRICT_PEAK' ? 'warning' : 'ok'}
                pulse
              >
                {wil.activeStatus === 'STRICT_PEAK' ? 'HEURES DE POINTE' : 'DÉROGATION 24/7'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <IconAlertTriangle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
              <span>
                Interdiction : &gt; {wil.tonnageLimit}T de {wil.restrictedHours}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Déviation obligatoire : </span>
              <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                {wil.bypassRoute}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
