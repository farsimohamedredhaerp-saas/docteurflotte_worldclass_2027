'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconFileText,
  IconPlus,
  IconUsers,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import {
  HarvestCampaignLog,
  FarmProperty,
} from '@/lib/api-agriculture';

interface HarvestTableViewProps {
  filteredHarvest: HarvestCampaignLog[];
  farms: FarmProperty[];
  onOpenRecordHarvest: () => void;
}

export function HarvestTableView({
  filteredHarvest,
  farms,
  onOpenRecordHarvest,
}: HarvestTableViewProps) {
  return (
    <div className="space-y-4">
      {filteredHarvest.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <IconFileText size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Aucune campagne moisson-battage enregistrée</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Enregistrez une campagne de récolte avec le bon de livraison CCLS et la formule de rémunération à la tâche des chauffeurs (DZD/Ha + DZD/Qx).
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenRecordHarvest}
            className="mt-4 gap-2 bg-amber-600 hover:bg-amber-500 text-white"
          >
            <IconPlus size={14} /> Saisir un bon moisson
          </Button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Campagne / Travail</th>
                  <th className="py-3 px-4">Exploitation</th>
                  <th className="py-3 px-4">Engin & Chauffeur</th>
                  <th className="py-3 px-4">Surface & Récolte</th>
                  <th className="py-3 px-4">Rémunération Tâche</th>
                  <th className="py-3 px-4">Gasoil Utilisé</th>
                  <th className="py-3 px-4">Réf CCLS / Sceau SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHarvest.map((h) => {
                  const farm = farms.find((f) => f.id === h.farmId);
                  const yieldPerHa = h.areaWorkedHectares > 0
                    ? (h.yieldQuintals / h.areaWorkedHectares).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{h.taskType}</div>
                        <div className="text-[11px] text-amber-400 font-mono">
                          Année {h.campaignYear} • {h.cropType}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{farm?.name || 'Domaine N/A'}</div>
                        <div className="text-[11px] text-slate-500">
                          W.{farm?.wilayaCode} — {farm?.commune || 'Sahara'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-200">{h.assetId}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <IconUsers size={12} />
                          {h.driverId || 'Chauffeur non renseigné'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-100 font-semibold">
                          {h.areaWorkedHectares} Ha
                          {h.yieldQuintals > 0 && ` • ${h.yieldQuintals.toLocaleString('fr-FR')} Qx`}
                        </div>
                        {h.yieldQuintals > 0 && (
                          <div className="text-[11px] text-cyan-400">
                            Rendement : {yieldPerHa} Qx/Ha
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-emerald-400 font-bold">
                          {formatCurrency(h.driverPayoutDzd)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {h.driverRatePerHectareDzd} DA/Ha + {h.driverRatePerQuintalDzd} DA/Qx
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-amber-400">{h.fuelConsumedLiters} L</div>
                        <div className="text-[10px] text-slate-500">
                          {formatCurrency(h.fuelCostDzd)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {h.cclsDeliveryNoteRef ? (
                          <Badge variant="neutral" className="font-mono text-[10px] mb-1">
                            {h.cclsDeliveryNoteRef}
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic block">Sans bon CCLS</span>
                        )}
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90">
                          <IconShieldCheck size={12} />
                          <span className="truncate max-w-[120px]" title={h.sha256Proof}>
                            {h.sha256Proof.slice(0, 14)}...
                          </span>
                        </div>
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

