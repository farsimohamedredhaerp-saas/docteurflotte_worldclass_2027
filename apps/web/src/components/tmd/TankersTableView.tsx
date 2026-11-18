'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { FuelTankerCompartment, ValveStatus } from '@/lib/api-tmd';

interface TankersTableViewProps {
  filteredComps: FuelTankerCompartment[];
}

export function TankersTableView({ filteredComps }: TankersTableViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredComps.map((comp) => {
          const isExpired = new Date(comp.apaveTestExpiryDate) < new Date();

          return (
            <div
              key={comp.id}
              className={`bg-slate-900/60 border rounded-xl p-5 space-y-3 ${
                isExpired ? 'border-red-500/50 bg-red-950/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-red-400">
                    Comp. {comp.compartmentNumber} — {comp.assetId}
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-1">
                    {comp.currentProductType}
                  </h3>
                </div>
                <Badge
                  variant={comp.bottomValveStatus === ValveStatus.CLOSED ? 'success' : 'danger'}
                  className="font-mono text-[10px]"
                >
                  Vanne {comp.bottomValveStatus}
                </Badge>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Capacité :</span>
                  <span className="font-mono text-slate-200">{comp.capacityLiters.toLocaleString('fr-FR')} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Volume Actuel :</span>
                  <span className="font-mono text-amber-400 font-semibold">{comp.currentVolumeLiters.toLocaleString('fr-FR')} L</span>
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Épreuve APAVE :</span>
                  <span className="font-mono text-slate-300">{comp.apaveHydrostaticTestDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expiration :</span>
                  <span className={`font-mono font-semibold ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                    {comp.apaveTestExpiryDate} {isExpired && '(ÉCHU)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Conformité ADR :</span>
                  <span className="text-cyan-400 font-semibold">{comp.isAdrCompliant ? 'Certifié ADR' : 'Non Conforme'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

