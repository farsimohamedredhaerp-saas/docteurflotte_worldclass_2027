'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconSun,
  IconGauge,
  IconFlame,
  IconAlertTriangle,
  IconClock,
  IconPlus,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import {
  IrrigationPivot,
  FarmProperty,
  PivotStatus,
} from '@/lib/api-agriculture';

interface PivotsTableViewProps {
  filteredPivots: IrrigationPivot[];
  farms: FarmProperty[];
  onOpenAddPivot: () => void;
  onShowPivotProof: (pivot: IrrigationPivot) => void;
}

export function PivotsTableView({
  filteredPivots,
  farms,
  onOpenAddPivot,
  onShowPivotProof,
}: PivotsTableViewProps) {
  return (
    <div className="space-y-4">
      {filteredPivots.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <IconSun size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Aucun pivot d’irrigation enregistré</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Déclarez un pivot central circulaire alimenté par forage profond et groupe électrogène pour démarrer le suivi déterministe en L/h.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAddPivot}
            className="mt-4 gap-2"
          >
            <IconPlus size={14} /> Créer un pivot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPivots.map((pivot) => {
            const isFault = pivot.status === PivotStatus.FAULT;
            const isRunning = pivot.status === PivotStatus.RUNNING;
            const farm = farms.find((f) => f.id === pivot.farmId);

            return (
              <div
                key={pivot.id}
                className={`bg-slate-900/60 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isFault
                    ? 'border-red-500/40 bg-red-950/10 shadow-lg shadow-red-950/20'
                    : isRunning
                    ? 'border-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* En-tête de la carte */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {pivot.pivotCode}
                        </span>
                        <Badge
                          variant={
                            pivot.status === PivotStatus.RUNNING
                              ? 'success'
                              : pivot.status === PivotStatus.FAULT
                              ? 'danger'
                              : 'warning'
                          }
                          className="text-[10px] uppercase font-mono"
                        >
                          {pivot.status}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-medium text-slate-200 mt-1 line-clamp-1">
                        {pivot.name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {farm ? `${farm.name} (W.${farm.wilayaCode})` : 'Domaine non lié'}
                      </div>
                    </div>
                  </div>

                  {/* Caractéristiques Techniques */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Culture</span>
                      <span className="font-medium text-slate-200 font-mono">
                        {pivot.cropType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Superficie</span>
                      <span className="font-medium text-slate-200 font-mono">
                        {pivot.surfaceHectares} Hectares
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Forage Albien</span>
                      <span className="font-medium text-cyan-400 font-mono">
                        {pivot.boreholeDepthMeters} m
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Groupe / Réf</span>
                      <span className="font-medium text-slate-300 font-mono truncate block">
                        {pivot.generatorAssetId || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Métrologie & Télémétrie Déterministe en Litres/Heure */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <IconFlame size={14} className={isFault ? 'text-red-400' : 'text-amber-400'} />
                        Conso Déterministe L/h
                      </span>
                      <span className={`font-mono font-bold ${isFault ? 'text-red-400' : 'text-amber-400'}`}>
                        {pivot.nominalFuelBurnRateLH} L/h nominal
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <IconGauge size={14} className="text-cyan-400" />
                        Débit Pompe Exhaure
                      </span>
                      <span className="font-mono text-cyan-300">
                        {pivot.nominalFlowM3H} m³/h
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <IconClock size={14} className="text-slate-400" />
                        Heures de Pompage Cumulées
                      </span>
                      <span className="font-mono text-slate-300">
                        {Number(pivot.totalRunningHours).toFixed(1)} h
                      </span>
                    </div>

                    {isFault && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 mt-2">
                        <IconAlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block">Surconsommation Albienne Critique</span>
                          Débit horaire excédant le seuil nominal (+54%). Risque d’encrassement injecteurs ou siphonnage.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowPivotProof(pivot)}
                    className="text-xs gap-1.5 w-full"
                  >
                    <IconShieldCheck size={14} />
                    Audit Énergétique ADS
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

