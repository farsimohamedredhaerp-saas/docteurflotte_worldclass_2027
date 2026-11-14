'use client';

import React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { CalculationProofButton } from './decisions/CalculationProofButton';
import { IconCpu, IconActivity, IconZap } from './navigation/TechIcons';

export interface DecisionCardProps {
  assetId: string;
  assetName: string;
  assetCategory: string;
  urgency: 'warning' | 'danger' | 'info';
  anomalyTitle: string;
  anomalyDescription: string;
  costEstimate: string;
  costInactionEstimate?: string;
  confidenceScore: number;
  isDemo?: boolean;
  telemetryDetails?: {
    lastPing?: string;
    ignition?: 'ON' | 'OFF';
    gpsFix?: boolean;
    currentSpeed?: number;
  };
  onShowProof?: () => void;
  onApprove?: () => void;
  onDismiss?: () => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  assetId,
  assetName,
  assetCategory,
  urgency,
  anomalyTitle,
  anomalyDescription,
  costEstimate,
  costInactionEstimate,
  confidenceScore,
  isDemo = false,
  telemetryDetails = {
    lastPing: '< 2 min',
    ignition: 'ON',
    gpsFix: true,
    currentSpeed: 0,
  },
  onShowProof,
  onApprove,
  onDismiss,
}) => {
  const isDanger = urgency === 'danger';
  const isWarning = urgency === 'warning';

  const statusBorderClass = isDanger
    ? 'border-rose-500/40 dark:border-rose-500/30'
    : isWarning
      ? 'border-amber-500/40 dark:border-amber-500/30'
      : 'border-blue-500/30 dark:border-blue-500/25';

  const statusDotColor = isDanger
    ? 'bg-rose-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-blue-500';

  return (
    <div
      className={`group relative rounded-xl border ${statusBorderClass} bg-white dark:bg-[#111827] p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-150 flex flex-col justify-between`}
    >
      <div>
        {/* EN-TÊTE : NOM DU VÉHICULE, MATRICULE & BADGES */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="relative flex h-2 w-2 shrink-0">
                {isDanger && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDotColor}`} />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {assetName}
              </h3>
              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/60">
                {assetId}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Catégorie : <span className="text-slate-700 dark:text-slate-300">{assetCategory}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isDemo && <Badge variant="demo">DEMO</Badge>}
            <Badge variant={urgency} pulse={isDanger}>
              {isDanger ? 'Critique' : isWarning ? 'À Prévoir' : 'Recommandation'}
            </Badge>
          </div>
        </div>

        {/* BANDEAU TÉLÉMATIQUE HAUTE PRÉCISION (STYLE CONSOLE FLESPI / TRACCAR) */}
        <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#161F30] border border-slate-200/80 dark:border-[#1F2937] text-slate-600 dark:text-slate-400 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>Traccar IoT : {telemetryDetails.lastPing}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Contact :{' '}
              <strong
                className={
                  telemetryDetails.ignition === 'ON'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500'
                }
              >
                {telemetryDetails.ignition}
              </strong>
            </span>
            <span>
              GPS Fix :{' '}
              <strong
                className={
                  telemetryDetails.gpsFix
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400'
                }
              >
                {telemetryDetails.gpsFix ? '14 sats' : 'Perdu'}
              </strong>
            </span>
          </div>
        </div>

        {/* DIAGNOSTIC MÉCANIQUE DÉTERMINISTE */}
        <div className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-[#161F30]/60 border border-slate-200/80 dark:border-[#1F2937] mb-3.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <IconCpu size={14} className="text-blue-500 shrink-0" />
            <span>{anomalyTitle}</span>
          </h4>
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {anomalyDescription}
          </p>
        </div>

        {/* ARBITRAGE FINANCIER EN DINARS ALGÉRIENS (SAD -> ADS) */}
        <div className={`grid ${costInactionEstimate ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 mb-4`}>
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/70 dark:border-blue-800/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Coût Estimé Action
            </div>
            <div className="font-mono text-base font-bold text-blue-800 dark:text-blue-300 mt-0.5">
              {costEstimate}
            </div>
          </div>

          {costInactionEstimate && (
            <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-800/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Risque Financier Inaction
              </div>
              <div className="font-mono text-base font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                {costInactionEstimate}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PIED DE CARTE : GAUGE D'EXPLICABILITÉ XAI & ACTIONS */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, confidenceScore))}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Fiabilité :{' '}
            <strong className="font-mono text-slate-900 dark:text-slate-200">
              {confidenceScore}%
            </strong>
          </span>
          {onShowProof && (
            <CalculationProofButton
              label="Preuve XAI"
              size="xs"
              variant="cyan"
              onClick={onShowProof}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Différer
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onApprove}>
            Créer l&apos;Ordre (OR)
          </Button>
        </div>
      </div>
    </div>
  );
};
