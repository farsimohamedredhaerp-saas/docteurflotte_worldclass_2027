'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { FuelScannerKpiSummary } from '../types';

export interface FuelScannerKpisProps {
  kpis: FuelScannerKpiSummary;
}

export const FuelScannerKpis: React.FC<FuelScannerKpisProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Reçus Scannés
        </div>
        <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-50">
          {kpis.totalCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Tickets &amp; cartes Naftal</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Pleins Conformes
        </div>
        <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
          {kpis.verifiedCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">&Delta;V jauge validé &le; 5 L</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          Anomalies CUSUM
        </div>
        <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
          {kpis.anomalyCount}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Siphonnage ou écart station</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827]">
        <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Volume Total Scanné
        </div>
        <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
          {kpis.totalLiters.toLocaleString('fr-DZ')} <span className="text-xs font-bold text-slate-400">L</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Gasoil : {kpis.gasoilLiters} L</div>
      </Card>

      <Card variant="subtle" padding="sm" className="bg-white dark:bg-[#111827] col-span-2 md:col-span-1">
        <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Dépenses Naftal DGI
        </div>
        <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400 truncate">
          {kpis.totalSpentDzd.toLocaleString('fr-DZ')} <span className="text-xs font-bold text-slate-400">DA</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Éco Sirghaz : ~{kpis.sirghazEconomyDzd.toLocaleString('fr-DZ')} DA
        </div>
      </Card>
    </div>
  );
};

