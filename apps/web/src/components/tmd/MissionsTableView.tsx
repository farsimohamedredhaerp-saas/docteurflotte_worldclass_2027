'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconFlame,
  IconPlus,
  IconShieldCheck,
  IconZap,
} from '@/components/navigation/TechIcons';
import { TmdTransportMission, TmdMissionStatus } from '@/lib/api-tmd';

interface MissionsTableViewProps {
  filteredMissions: TmdTransportMission[];
  onOpenAddMission: () => void;
  onShowMissionProof: (mission: TmdTransportMission) => void;
}

export function MissionsTableView({
  filteredMissions,
  onOpenAddMission,
  onShowMissionProof,
}: MissionsTableViewProps) {
  return (
    <div className="space-y-4">
      {filteredMissions.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <IconFlame size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Aucune mission TMD en cours</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Déclarez une mission de transport hydrocarbures au départ d&apos;un dépôt Naftal ou Sonatrach pour lancer la vérification des verrous de sécurité.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddMission}
            className="mt-4 gap-2 bg-red-600 hover:bg-red-500 text-white"
          >
            <IconPlus size={14} /> Créer une mission
          </Button>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mission / Statut</th>
                  <th className="py-3 px-4">Camion-Citerne</th>
                  <th className="py-3 px-4">Dépôt Départ &rarr; Destination</th>
                  <th className="py-3 px-4">Volume Hydrocarbures</th>
                  <th className="py-3 px-4">Sécurité Incendie &amp; Masse</th>
                  <th className="py-3 px-4">Alerte Dépotage / Vanne</th>
                  <th className="py-3 px-4">Sceau SHA-256 / Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMissions.map((m) => {
                  const isAlert = m.unauthorizedValveOpened;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{m.missionCode}</div>
                        <Badge
                          variant={
                            m.status === TmdMissionStatus.IN_TRANSIT
                              ? 'warning'
                              : m.status === TmdMissionStatus.DELIVERED
                              ? 'success'
                              : m.status === TmdMissionStatus.BLOCKED_NON_COMPLIANT
                              ? 'danger'
                              : 'neutral'
                          }
                          className="text-[10px] uppercase font-mono mt-1"
                        >
                          {m.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-red-400 font-bold">{m.assetId}</div>
                        <div className="text-[11px] text-slate-400">
                          Chauffeur Certifié DTW
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{m.originDepotName}</div>
                        <div className="text-[11px] text-cyan-400">
                          &rarr; {m.destinationStationName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-white font-bold text-sm">
                          {m.totalVolumeLiters.toLocaleString('fr-FR')} L
                        </div>
                        <div className="text-[10px] text-slate-500">Hydrocarbures Class 3</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <IconShieldCheck size={14} />
                          <span>Extincteurs 6kg Poudre OK</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <IconZap size={12} className="text-amber-400" />
                          <span>Tresse Antistatique Reliée</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isAlert ? (
                          <Badge variant="danger" className="text-[10px] font-mono animate-pulse">
                            VANNE OUVERTE HORS-ZONE
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] font-mono">
                            VANNES SÉCURISÉES
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 mb-1">
                          <IconShieldCheck size={12} />
                          <span className="truncate max-w-[120px]" title={m.sha256AuditSeal}>
                            {m.sha256AuditSeal.slice(0, 14)}...
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onShowMissionProof(m)}
                          className="text-[10px] py-1 px-2"
                        >
                          Preuve ADS
                        </Button>
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

