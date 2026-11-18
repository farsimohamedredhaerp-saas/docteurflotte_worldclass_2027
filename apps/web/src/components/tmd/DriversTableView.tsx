'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { TmdDriverCertification } from '@/lib/api-tmd';

interface DriversTableViewProps {
  drivers: TmdDriverCertification[];
}

export function DriversTableView({ drivers }: DriversTableViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drivers.map((d) => (
          <div
            key={d.id}
            className={`bg-slate-900/60 border rounded-xl p-5 space-y-3 ${
              d.isValid ? 'border-slate-800' : 'border-red-500/40 bg-red-950/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-red-400">
                  {d.tmdCertificateNumber}
                </span>
                <h3 className="text-sm font-semibold text-white mt-1">{d.driverName}</h3>
                <div className="text-xs text-slate-400">{d.driverLicenseNumber}</div>
              </div>
              <Badge variant={d.isValid ? 'success' : 'danger'} className="text-[10px] font-mono">
                {d.isValid ? 'HABILITÉ' : 'ÉCHU / SUSPENDU'}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Classes Autoroutières :</span>
                <span className="text-slate-200 font-mono font-semibold">{d.hazardClasses}</span>
              </div>
              <div className="flex justify-between">
                <span>Autorité :</span>
                <span className="text-slate-300">{d.issuingAuthority}</span>
              </div>
              <div className="flex justify-between">
                <span>Validité :</span>
                <span className={`font-mono ${d.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  Jusqu&apos;au {d.expiryDate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

