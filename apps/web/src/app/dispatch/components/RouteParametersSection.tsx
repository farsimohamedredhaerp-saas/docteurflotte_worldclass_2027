'use client';

import React from 'react';
import { IconCompass } from '@/components/navigation/TechIcons';

interface RouteParametersSectionProps {
  originName: string;
  setOriginName: (s: string) => void;
  originWilaya: number;
  setOriginWilaya: (w: number) => void;
  destinationName: string;
  setDestinationName: (s: string) => void;
  destinationWilaya: number;
  setDestinationWilaya: (w: number) => void;
  transitWilayas: string;
  setTransitWilayas: (s: string) => void;
}

export function RouteParametersSection({
  originName,
  setOriginName,
  originWilaya,
  setOriginWilaya,
  destinationName,
  setDestinationName,
  destinationWilaya,
  setDestinationWilaya,
  transitWilayas,
  setTransitWilayas,
}: RouteParametersSectionProps) {
  return (
    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
        <IconCompass size={14} className="text-emerald-500" />
        <span>Itinéraire National (58 Wilayas)</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Origine (Départ)
          </label>
          <input
            type="text"
            value={originName}
            onChange={(e) => setOriginName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Wilaya
          </label>
          <input
            type="number"
            min="1"
            max="58"
            value={originWilaya}
            onChange={(e) => setOriginWilaya(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Destination (Arrivée)
          </label>
          <input
            type="text"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div>
          <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Wilaya
          </label>
          <input
            type="number"
            min="1"
            max="58"
            value={destinationWilaya}
            onChange={(e) => setDestinationWilaya(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
          Wilayas de Transit Autorisées
        </label>
        <input
          type="text"
          value={transitWilayas}
          onChange={(e) => setTransitWilayas(e.target.value)}
          placeholder="Ex: 09, 28, 47"
          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
    </div>
  );
}

