'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { MiningSite } from '@/lib/api-mining';

interface SitesTableViewProps {
  sites: MiningSite[];
}

export function SitesTableView({ sites }: SitesTableViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sites.map((s) => (
          <div
            key={s.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-orange-400">
                  {s.code}
                </span>
                <h3 className="text-sm font-semibold text-white mt-1">{s.name}</h3>
              </div>
              <Badge variant="neutral" className="font-mono text-xs">
                Wilaya {s.wilayaCode}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Type d&apos;Exploitation :</span>
                <span className="text-slate-200 font-semibold">{s.siteType}</span>
              </div>
              <div className="flex justify-between">
                <span>T° Ambiante Estivale :</span>
                <span className="text-amber-400 font-mono">{s.ambientTempSummerC}°C</span>
              </div>
              <div className="flex justify-between">
                <span>Distance Moyenne Piste :</span>
                <span className="text-cyan-400 font-mono">{s.averageHaulDistanceKm} km</span>
              </div>
              <div className="flex justify-between">
                <span>Pente Descendante Max :</span>
                <span className="text-slate-200 font-mono">{s.pisteGradientMaxPct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

