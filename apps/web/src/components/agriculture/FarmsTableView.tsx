'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { FarmProperty } from '@/lib/api-agriculture';

interface FarmsTableViewProps {
  farms: FarmProperty[];
}

export function FarmsTableView({ farms }: FarmsTableViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {farms.map((f) => (
          <div
            key={f.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {f.code}
                </span>
                <h3 className="text-sm font-semibold text-white mt-1">{f.name}</h3>
              </div>
              <Badge variant="neutral" className="font-mono text-xs">
                Wilaya {f.wilayaCode}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Commune :</span>
                <span className="text-slate-200">{f.commune || 'Grand Sud'}</span>
              </div>
              <div className="flex justify-between">
                <span>Surface Totale :</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {f.totalSurfaceHectares} Ha
                </span>
              </div>
              <div className="flex justify-between">
                <span>Agrément CCLS / OAIC :</span>
                <span className="text-slate-200 font-mono">
                  {f.cclsCode || 'En cours d’homologation'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

