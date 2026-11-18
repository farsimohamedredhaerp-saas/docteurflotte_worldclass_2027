'use client';

import React from 'react';
import {
  IconFlame,
  IconShieldCheck,
  IconAlertTriangle,
  IconTruck,
  IconUsers,
} from '@/components/navigation/TechIcons';

interface TmdKpiHeaderProps {
  totalVolumeInTransitLiters: number;
  validDriversCount: number;
  totalDriversCount: number;
  compliantCompsCount: number;
  totalCompsCount: number;
  alertMissionsCount: number;
  inTransitMissionsCount: number;
}

export function TmdKpiHeader({
  totalVolumeInTransitLiters,
  validDriversCount,
  totalDriversCount,
  compliantCompsCount,
  totalCompsCount,
  alertMissionsCount,
  inTransitMissionsCount,
}: TmdKpiHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Carburant en Transit</span>
          <IconFlame size={16} className="text-red-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white">
            {(totalVolumeInTransitLiters / 1000).toFixed(1)}k
          </span>
          <span className="text-xs text-slate-400">Litres</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Gasoil, Sans Plomb, GPL</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Chauffeurs Habilités TMD</span>
          <IconUsers size={16} className="text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {validDriversCount}
          </span>
          <span className="text-xs text-slate-400">/ {totalDriversCount} chauffeurs</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Brevets DTW Valides</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Cuves Conformes APAVE</span>
          <IconShieldCheck size={16} className="text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-cyan-400">
            {compliantCompsCount}
          </span>
          <span className="text-xs text-slate-400">/ {totalCompsCount} comp.</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Épreuves &lt; 3 ans</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Alertes Vannes / Piquage</span>
          <IconAlertTriangle size={16} className="text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`text-2xl font-bold font-mono ${alertMissionsCount > 0 ? 'text-red-400' : 'text-slate-200'}`}>
            {alertMissionsCount}
          </span>
          <span className="text-xs text-slate-400">anomalies</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Vannes ouvertes hors géofence</div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Missions en Cours</span>
          <IconTruck size={16} className="text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-indigo-300">
            {inTransitMissionsCount}
          </span>
          <span className="text-xs text-slate-400">en rotation</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Dépôts Naftal / Sonatrach</div>
      </div>
    </div>
  );
}

