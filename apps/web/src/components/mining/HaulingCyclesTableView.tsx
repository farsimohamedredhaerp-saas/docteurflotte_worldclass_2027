'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconBarChart3,
  IconPlus,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import { DumperHaulingCycle, MiningSite } from '@/lib/api-mining';

interface HaulingCyclesTableViewProps {
  filteredCycles: DumperHaulingCycle[];
  sites: MiningSite[];
  onOpenRecordCycle: () => void;
}

export function HaulingCyclesTableView({
  filteredCycles,
  sites,
  onOpenRecordCycle,
}: HaulingCyclesTableViewProps) {
  return (
    <div className="space-y-4">
      {filteredCycles.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <IconBarChart3 size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Aucun cycle de roulage enregistré</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Enregistrez un cycle de dumper minier pour calculer le TKPH effectif et le coût par tonne transportée en DZD.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenRecordCycle}
            className="mt-4 gap-2 bg-orange-600 hover:bg-orange-500 text-white"
          >
            <IconPlus size={14} /> Saisir un cycle
          </Button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Horodatage / Site</th>
                  <th className="py-3 px-4">Dumper &amp; Chauffeur</th>
                  <th className="py-3 px-4">Charge &amp; Distance</th>
                  <th className="py-3 px-4">TKPH Effectif vs Admissible</th>
                  <th className="py-3 px-4">Gasoil Cycle</th>
                  <th className="py-3 px-4">Coût de Revient Tonne</th>
                  <th className="py-3 px-4">Statut &amp; Standby</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCycles.map((c) => {
                  const site = sites.find((s) => s.id === c.siteId);

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{site?.name || 'Site Minier'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          W.{site?.wilayaCode} — {new Date(c.cycleTimestamp).toLocaleTimeString('fr-FR')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-orange-400 font-bold">{c.assetId}</div>
                        <div className="text-[11px] text-slate-400">{c.driverId || 'Opérateur dumper'}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-white font-semibold">{c.payloadMetricTons} Tonnes</div>
                        <div className="text-[11px] text-slate-500">
                          {c.cycleDistanceKm} km en {c.cycleDurationMinutes} min
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className={`font-bold ${c.isTkphExceeded ? 'text-red-400' : 'text-emerald-400'}`}>
                          {c.calculatedTkph} TKPH
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Max Admissible : {c.tkphAdmissible} TKPH
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-amber-400">{c.fuelConsumedLiters} L</div>
                        <div className="text-[10px] text-slate-500">
                          {formatCurrency(c.fuelConsumedLiters * 29.0)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-emerald-400 font-bold text-sm">
                          {c.costPerTonDzd} DZD/T
                        </div>
                        <div className="text-[10px] text-slate-500">Carburant + Pneus OTR</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {c.coolingStandbyRecommended ? (
                          <Badge variant="danger" className="text-[10px] font-mono">
                            STANDBY RECOMMANDÉ
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] font-mono">
                            CONFORME
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

