'use client';

import React from 'react';
import {
  IconGauge,
  IconFlame,
  IconZap,
  IconBarChart3,
  IconMapPin,
} from '@/components/navigation/TechIcons';

interface MiningKpiHeaderProps {
  sitesCount: number;
  tiresCount: number;
  standbyTiresCount: number;
  totalTonsHauled: number;
  avgCostPerTon: string;
}

export function MiningKpiHeader({
  sitesCount,
  tiresCount,
  standbyTiresCount,
  totalTonsHauled,
  avgCostPerTon,
}: MiningKpiHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Gisements &amp; Carrières</span>
          <IconMapPin size={16} className="text-orange-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white">
            {sitesCount}
          </span>
          <span className="text-xs text-slate-400">Sites Actifs</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Fer, Phosphate, Ciment</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Pneus OTR en Service</span>
          <IconGauge size={16} className="text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {tiresCount}
          </span>
          <span className="text-xs text-slate-400">Pneus Géants</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">27.00R49 à 33.00R51</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Standby Refroidissement</span>
          <IconFlame size={16} className="text-red-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-red-400">
            {standbyTiresCount}
          </span>
          <span className="text-xs text-slate-400">en alerte</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Surchauffe &gt; 90°C</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Tonnage Transporté</span>
          <IconBarChart3 size={16} className="text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-cyan-400">
            {totalTonsHauled.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs text-slate-400">Tonnes</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Dumpers Rigides 100T</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Coût Moyen au Roulage</span>
          <IconZap size={16} className="text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-emerald-400">
            {avgCostPerTon}
          </span>
          <span className="text-xs text-slate-400">DZD / Tonne</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Gasoil + Pneus OTR</div>
      </div>
    </div>
  );
}

