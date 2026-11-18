'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconTruck,
  IconGauge,
  IconClock,
  IconPlus,
  IconShieldCheck,
  IconThermometer,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import { OtrTire, OtrTireStatus } from '@/lib/api-mining';

interface OtrTiresTableViewProps {
  tires: OtrTire[];
  onOpenAddTire: () => void;
  onShowTireProof: (tire: OtrTire) => void;
}

export function OtrTiresTableView({
  tires,
  onOpenAddTire,
  onShowTireProof,
}: OtrTiresTableViewProps) {
  return (
    <div className="space-y-4">
      {tires.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <IconTruck size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Aucun pneumatique OTR enregistré</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Enregistrez un train de pneus pour dumper minier avec numéro de série et TKPH catalogue constructeur.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAddTire}
            className="mt-4 gap-2"
          >
            <IconPlus size={14} /> Enregistrer un pneu
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tires.map((tire) => {
            const isStandby = tire.status === OtrTireStatus.COOLING_STANDBY;
            const temp = tire.currentTempC ?? 65.0;
            const wearPct = Math.round(
              ((tire.treadDepthInitialMm - tire.treadDepthCurrentMm) / tire.treadDepthInitialMm) * 100,
            );

            return (
              <div
                key={tire.id}
                className={`bg-slate-900/60 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isStandby
                    ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* En-tête du pneu */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-orange-400">
                        {tire.position} — {tire.serialNumber}
                      </span>
                      <h3 className="text-sm font-semibold text-white mt-1">
                        {tire.brand} {tire.dimension}
                      </h3>
                      <div className="text-xs text-slate-400">
                        {tire.modelPattern || 'Motif Roche E4'}
                      </div>
                    </div>
                    <Badge
                      variant={isStandby ? 'danger' : 'neutral'}
                      className="font-mono text-[10px] uppercase"
                    >
                      {tire.status}
                    </Badge>
                  </div>

                  {/* Engin & TKPH Nominal */}
                  <div className="mt-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dumper affecté :</span>
                      <span className="font-mono text-slate-200">{tire.assetId || 'En Stock'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TKPH Constructeur :</span>
                      <span className="font-mono text-amber-400 font-semibold">{tire.nominalTkph}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coût Acquisition :</span>
                      <span className="font-mono text-slate-300">{formatCurrency(tire.purchaseCostDzd)}</span>
                    </div>
                  </div>

                  {/* Télémétrie TPMS Déterministe */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <IconThermometer size={14} className={isStandby ? 'text-red-400' : 'text-slate-400'} />
                        Température Interne
                      </span>
                      <span className={`font-mono font-bold ${isStandby ? 'text-red-400' : 'text-slate-200'}`}>
                        {temp}°C {isStandby && '(!)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <IconGauge size={14} className="text-cyan-400" />
                        Pression TPMS
                      </span>
                      <span className="font-mono text-cyan-300">
                        {tire.currentPressureBar ?? 7.2} Bar
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <IconClock size={14} className="text-slate-400" />
                        Sculpture mm (Usure)
                      </span>
                      <span className="font-mono text-slate-200">
                        {tire.treadDepthCurrentMm} mm ({wearPct}% usé)
                      </span>
                    </div>

                    {isStandby && (
                      <div className="p-2 rounded bg-red-950/50 border border-red-500/40 text-[11px] text-red-300 mt-2">
                        <span className="font-bold block">Surchauffe Nappe Critique</span>
                        Arrêt obligatoire dumper pour refroidissement gomme.
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowTireProof(tire)}
                    className="text-xs gap-1.5 w-full"
                  >
                    <IconShieldCheck size={14} />
                    Audit Thermique ADS
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

