'use client';

import React from 'react';
import { FuelReceiptScanResult } from '@docteurflotte/contracts';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/ui/Card';
import {
  IconTruck,
  IconFuel,
  IconShieldCheck,
  IconAlertTriangle,
  IconEdit,
  IconTrash,
  IconFileText,
} from '@/components/navigation/TechIcons';

export interface FuelReceiptCardProps {
  receipt: FuelReceiptScanResult;
  onOpenProof: (rcpt: FuelReceiptScanResult) => void;
  onOpenDossier: (rcpt: FuelReceiptScanResult) => void;
  onOpenLegalReport: (rcpt: FuelReceiptScanResult) => void;
  onOpenEdit: (rcpt: FuelReceiptScanResult) => void;
  onOpenDelete: (id: string, label: string) => void;
}

export const FuelReceiptCard: React.FC<FuelReceiptCardProps> = React.memo(({
  receipt: r,
  onOpenProof,
  onOpenDossier,
  onOpenLegalReport,
  onOpenEdit,
  onOpenDelete,
}) => {
  const isOk = r.reconciliation.reconciliationStatus === 'VERIFIED';
  const deltaV = r.reconciliation.telematicsLevelDeltaLiters;
  const variance = r.reconciliation.varianceLiters;

  return (
    <Card
      variant="default"
      padding="none"
      className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
    >
      <div className="p-4 sm:p-5 flex-1">
        {/* EN-TÊTE : BADGE STATUT & DATE */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isOk ? (
              <Badge variant="ok">Conforme (ΔV validé)</Badge>
            ) : (
              <Badge variant="danger" pulse>
                Alerte CUSUM Anti-Fraude
              </Badge>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {r.fuelType}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(r.dateTime || r.createdAt || Date.now()).toLocaleDateString('fr-DZ')}
          </span>
        </div>

        {/* STATION ET VÉHICULE */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1 leading-snug">
          {r.stationName}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
          <IconTruck size={13} className="text-blue-500 flex-shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {r.assetName || r.assetCode || 'Actif non identifié'}
          </span>
          {r.stationWilaya && (
            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300">
              Wilaya {r.stationWilaya}
            </span>
          )}
        </div>

        {/* CHIFFRES CLÉS : LITRES & MONTANT */}
        <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 mb-3">
          <div>
            <span className="text-slate-400 block text-[10px]">Volume Ticket</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {r.liters} L
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Montant DGI</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
              {r.totalAmountDzd.toLocaleString('fr-DZ')} DA
            </span>
          </div>
        </div>

        {/* TÉLÉMÉTRIE & ÉCART */}
        <div className="text-[11px] space-y-1 text-slate-500">
          <div className="flex justify-between">
            <span>Hausse Jauge Constatée :</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              +{deltaV.toFixed(1)} L
            </span>
          </div>
          <div className="flex justify-between">
            <span>Écart Volumique Absolu :</span>
            <span
              className={`font-mono font-bold ${
                variance > 5 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {variance.toFixed(1)} L
            </span>
          </div>
        </div>
      </div>

      {/* PIED DE CARTE & ACTIONS OPÉRATEUR */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenProof(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
          >
            <IconShieldCheck size={12} />
            <span>Preuve</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDossier(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Dossier Technique & Export ERP"
          >
            <IconFileText size={12} />
            <span>Dossier</span>
          </button>

          {!isOk && (
            <button
              type="button"
              onClick={() => onOpenLegalReport(r)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
              title="Procès-Verbal Judiciaire CUSUM"
            >
              <IconAlertTriangle size={12} />
              <span>PV CUSUM</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenEdit(r)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Modifier ce reçu"
          >
            <IconEdit size={13} />
          </button>
          <button
            type="button"
            onClick={() => onOpenDelete(r.receiptId, r.stationName)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            aria-label="Supprimer ce reçu"
          >
            <IconTrash size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
});

FuelReceiptCard.displayName = 'FuelReceiptCard';

