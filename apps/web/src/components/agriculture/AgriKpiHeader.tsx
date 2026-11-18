'use client';

import React from 'react';
import {
  IconSun,
  IconGauge,
  IconZap,
  IconBarChart3,
  IconUsers,
  IconMapPin,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';

interface AgriKpiHeaderProps {
  totalHectaresFarms: number;
  activePivotsCount: number;
  totalPivotsCount: number;
  totalWaterVolume: number;
  totalHarvestYieldQx: number;
  totalDriverPayoutsDzd: number;
  farmsCount: number;
}

export function AgriKpiHeader({
  totalHectaresFarms,
  activePivotsCount,
  totalPivotsCount,
  totalWaterVolume,
  totalHarvestYieldQx,
  totalDriverPayoutsDzd,
  farmsCount,
}: AgriKpiHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Superficie Cadastrée</span>
          <IconMapPin size={16} className="text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white">
            {totalHectaresFarms.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs text-slate-400">Hectares</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">{farmsCount} Domaines Céréaliers</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Pivots Albiens Actifs</span>
          <IconZap size={16} className="text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {activePivotsCount}
          </span>
          <span className="text-xs text-slate-400">/ {totalPivotsCount} pivots</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Pompage continu 24h/24</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Volume Eau Exhaure</span>
          <IconGauge size={16} className="text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-cyan-400">
            {(totalWaterVolume / 1000).toFixed(1)}k
          </span>
          <span className="text-xs text-slate-400">m³ pompés</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Nappe Albienne Profonde</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Moisson Livrée CCLS</span>
          <IconBarChart3 size={16} className="text-yellow-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-yellow-400">
            {totalHarvestYieldQx.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs text-slate-400">Quintaux</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Sécurité Céréalière DZ</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Rémunération Tâche</span>
          <IconUsers size={16} className="text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-lg font-bold font-mono text-indigo-300">
            {formatCurrency(totalDriverPayoutsDzd)}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Chauffeurs & Opérateurs</div>
      </div>
    </div>
  );
}

