'use client';

import React from 'react';
import { Asset, AssetStatus, MeterType } from '@docteurflotte/contracts';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/ui/Card';
import { VehicleSilhouette } from '@/components/ui/VehicleSilhouette';
import { SovereigntySeal } from '@/components/ui/SovereigntySeal';
import {
  IconTruck,
  IconClock,
  IconShieldCheck,
  IconAlertTriangle,
  IconEdit,
  IconTrash,
  IconWrench,
  IconActivity,
} from '@/components/navigation/TechIcons';
import {
  getTelemetryTier,
  formatMeterValue,
  formatCategoryLabel,
  isMaintenanceDue,
  computeMeterProgressPercent,
} from '../lib/assetSelectors';

export interface AssetCardProps {
  asset: Asset;
  onOpenMeterModal: (asset: Asset) => void;
  onOpenEditModal: (asset: Asset) => void;
  onOpenDeleteConfirm: (id: string, label: string) => void;
}

const getStatusBadge = (s: AssetStatus) => {
  switch (s) {
    case AssetStatus.OPERATIONAL:
      return <Badge variant="ok">En service</Badge>;
    case AssetStatus.MAINTENANCE_REQUIRED:
      return <Badge variant="warning">Maintenance due</Badge>;
    case AssetStatus.DOWN:
      return <Badge variant="danger" pulse>Hors service (Panne/DVIR)</Badge>;
    case AssetStatus.DECOMMISSIONED:
      return <Badge variant="neutral">Déclassé</Badge>;
    default:
      return <Badge variant="neutral">{s}</Badge>;
  }
};

export const AssetCard: React.FC<AssetCardProps> = React.memo(({
  asset: a,
  onOpenMeterModal,
  onOpenEditModal,
  onOpenDeleteConfirm,
}) => {
  const tier = getTelemetryTier(a);
  const maintenanceDue = isMaintenanceDue(a);
  const progressPercent = computeMeterProgressPercent(a);
  const meterType = a.primaryMeterType || MeterType.ODOMETER_KM;

  return (
    <Card
      variant="default"
      padding="none"
      className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
    >
      <div className="p-4 sm:p-5 flex-1">
        {/* EN-TÊTE : BADGES DE STATUT & PALIER TÉLÉMATIQUE */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getStatusBadge(a.status)}
            {tier === 'MODE_2_CAN_J1939' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                <IconActivity size={10} />
                Mode 2 CAN
              </span>
            ) : tier === 'MODE_1_GNSS' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Mode 1 GNSS
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Mode 0 Déclaratif
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            #{a.code}
          </span>
        </div>

        {/* NOM DE L'ACTIF, SILHOUETTE VECTORIELLE ALGÉRIENNE & MARQUE/MODÈLE */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--df-text-main)] line-clamp-1 mb-1 leading-snug">
              {a.name}
            </h3>

            <div className="flex items-center gap-2 text-xs text-[var(--df-text-secondary)] mb-1">
              <span className="font-semibold text-[var(--df-text-main)] truncate">
                {a.brand || 'Constructeur'} {a.model || ''}
              </span>
              {a.year && (
                <span className="px-1.5 py-0.2 rounded bg-[var(--df-bg-surface-2)] font-mono text-[10px] text-[var(--df-text-muted)] border border-[var(--df-border-subtle)]">
                  {a.year}
                </span>
              )}
            </div>

            <div className="text-[11px] text-[var(--df-text-muted)] font-mono">
              {formatCategoryLabel(a.category)}
            </div>
          </div>

          {/* Silhouette vectorielle réaliste DZ */}
          <VehicleSilhouette
            brand={a.brand}
            model={a.model}
            category={a.category}
            size="md"
            className="text-[var(--df-text-secondary)] opacity-85 hover:opacity-100 transition-opacity"
          />
        </div>

        {/* PROGRESSION DE L'ÉCHÉANCE D'ENTRETIEN */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Compteur Certifié</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {formatMeterValue(a.currentMeterValue, meterType)}
            </span>
          </div>

          {a.nextMaintenanceMeterValue && (
            <>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    progressPercent >= 100
                      ? 'bg-rose-500'
                      : progressPercent >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Échéance d'Atelier</span>
                <span className={maintenanceDue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                  {formatMeterValue(a.nextMaintenanceMeterValue, meterType)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PIED DE CARTE & ACTIONS OPÉRATEUR */}
      <div className="p-3 bg-[var(--df-bg-surface-2)] border-t border-[var(--df-border-subtle)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenMeterModal(a)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--df-radius-xs,4px)] text-xs font-semibold text-[var(--df-accent-blue)] bg-[var(--df-accent-blue-subtle)] hover:bg-[var(--df-bg-surface-3)] transition-colors"
            title="Enregistrer un nouveau relevé de compteur (Mode 0)"
          >
            <IconClock size={12} />
            <span>Relevé</span>
          </button>
          <SovereigntySeal type="ANPDP_18_07" size="xs" />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenEditModal(a)}
            className="p-1.5 text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] rounded-[var(--df-radius-xs,4px)] hover:bg-[var(--df-bg-surface-3)] transition-colors"
            aria-label="Modifier cet actif"
          >
            <IconEdit size={13} />
          </button>
          <button
            type="button"
            onClick={() => onOpenDeleteConfirm(a.id, `${a.code} — ${a.name}`)}
            className="p-1.5 text-[var(--df-text-muted)] hover:text-[var(--df-status-danger-text)] rounded-[var(--df-radius-xs,4px)] hover:bg-[var(--df-status-danger-bg)] transition-colors"
            aria-label="Supprimer cet actif"
          >
            <IconTrash size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
});

AssetCard.displayName = 'AssetCard';
