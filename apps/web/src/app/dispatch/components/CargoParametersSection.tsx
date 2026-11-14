'use client';

import React from 'react';
import { IconAlertTriangle, IconThermometer } from '@/components/navigation/TechIcons';

interface CargoParametersSectionProps {
  cargoNature: string;
  setCargoNature: (s: string) => void;
  payloadTons: number;
  setPayloadTons: (t: number) => void;
  routeKm: number;
  setRouteKm: (km: number) => void;
  requiresHazmat: boolean;
  setRequiresHazmat: (h: boolean) => void;
  requiresReefer: boolean;
  setRequiresReefer: (r: boolean) => void;
}

export function CargoParametersSection({
  cargoNature,
  setCargoNature,
  payloadTons,
  setPayloadTons,
  routeKm,
  setRouteKm,
  requiresHazmat,
  setRequiresHazmat,
  requiresReefer,
  setRequiresReefer,
}: CargoParametersSectionProps) {
  return (
    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Cargaison
          </label>
          <input
            type="text"
            value={cargoNature}
            onChange={(e) => setCargoNature(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Charge (T)
          </label>
          <input
            type="number"
            step="0.5"
            value={payloadTons}
            onChange={(e) => setPayloadTons(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Distance (km)
          </label>
          <input
            type="number"
            value={routeKm}
            onChange={(e) => setRouteKm(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap pt-1">
        <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={requiresHazmat}
            onChange={(e) => setRequiresHazmat(e.target.checked)}
            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
          />
          <span className="flex items-center gap-1">
            <IconAlertTriangle size={13} className="text-rose-500" />
            <span>HAZMAT / ADR</span>
          </span>
        </label>

        <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={requiresReefer}
            onChange={(e) => setRequiresReefer(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
          />
          <span className="flex items-center gap-1">
            <IconThermometer size={13} className="text-blue-500" />
            <span>Frigo / ATP</span>
          </span>
        </label>
      </div>
    </div>
  );
}

