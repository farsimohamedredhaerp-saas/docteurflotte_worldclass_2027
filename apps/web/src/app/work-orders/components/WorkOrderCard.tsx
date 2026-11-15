'use client';

import React from 'react';
import Link from 'next/link';
import { WorkOrder, WorkOrderPriority, WorkOrderStatus } from '@docteurflotte/contracts';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/ui/Card';
import { SovereigntySeal } from '@/components/ui/SovereigntySeal';
import {
  IconTruck,
  IconClock,
  IconShieldCheck,
  IconFileText,
  IconCheck,
  IconEdit,
  IconTrash,
} from '@/components/navigation/TechIcons';

export interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onOpenInvoice: (wo: WorkOrder) => void;
  onOpenComplete: (wo: WorkOrder) => void;
  onOpenEdit: (wo: WorkOrder) => void;
  onOpenDelete: (id: string, label: string) => void;
}

const getPriorityBadge = (p: WorkOrderPriority) => {
  switch (p) {
    case WorkOrderPriority.CRITICAL:
      return <Badge variant="danger" pulse>Critique</Badge>;
    case WorkOrderPriority.HIGH:
      return <Badge variant="warning">Haute</Badge>;
    case WorkOrderPriority.MEDIUM:
      return <Badge variant="info">Moyenne</Badge>;
    case WorkOrderPriority.LOW:
      return <Badge variant="ok">Basse</Badge>;
    default:
      return <Badge variant="neutral">Normal</Badge>;
  }
};

const getStatusBadge = (s: WorkOrderStatus) => {
  switch (s) {
    case WorkOrderStatus.COMPLETED:
      return <Badge variant="ok">Clôturé</Badge>;
    case WorkOrderStatus.IN_PROGRESS:
      return <Badge variant="info">En cours</Badge>;
    case WorkOrderStatus.SCHEDULED:
      return <Badge variant="warning">Planifié</Badge>;
    case WorkOrderStatus.DRAFT:
      return <Badge variant="neutral">Brouillon</Badge>;
    case WorkOrderStatus.CANCELLED:
      return <Badge variant="neutral">Annulé</Badge>;
    default:
      return <Badge variant="neutral">{s}</Badge>;
  }
};

export const WorkOrderCard: React.FC<WorkOrderCardProps> = React.memo(({
  workOrder: wo,
  onOpenInvoice,
  onOpenComplete,
  onOpenEdit,
  onOpenDelete,
}) => {
  const isDvirOrder = wo.id.startsWith('ot-dvir') || wo.title.includes('DVIR');
  const isCompleted = wo.status === WorkOrderStatus.COMPLETED;

  return (
    <Card
      variant="default"
      padding="none"
      className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
    >
      <div className="p-4 sm:p-5 flex-1">
        {/* EN-TÊTE DE CARTE : BADGES & RÉFÉRENCE */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getStatusBadge(wo.status)}
            {getPriorityBadge(wo.priority)}
            {isDvirOrder && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900">
                <IconShieldCheck size={10} />
                TOPSIS LOCK
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            #{wo.id.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* TITRE ET ACTIF CONCERNÉ */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1.5 leading-snug">
          {wo.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
          <IconTruck size={13} className="text-blue-500 flex-shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {wo.assetName || 'Actif non spécifié'}
          </span>
          {wo.assetCode && (
            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300">
              {wo.assetCode}
            </span>
          )}
        </div>

        {wo.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {wo.description}
          </p>
        )}

        {/* MÉTADONNÉES D'EXPLOITATION */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-slate-400 block text-[10px]">Affectation</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
              {wo.assignedTo || 'Non assigné'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Temps Main d'Œuvre</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <IconClock size={11} className="text-slate-400" />
              {isCompleted ? `${wo.actualLaborHours || 0}h effectives` : `~${wo.estimatedLaborHours || 2}h estimées`}
            </span>
          </div>
        </div>

        {/* COÛT TOTAL SI CLÔTURÉ */}
        {isCompleted && (
          <div className="mt-3 p-2 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-ok-bg)] border border-[var(--df-status-ok-border)] flex items-center justify-between text-xs">
            <span className="text-[var(--df-status-ok-text)] text-[11px] font-semibold">
              Coût Total Facturable DGI
            </span>
            <span className="font-mono font-bold text-[var(--df-status-ok-text)] tabular-nums">
              {(wo.totalCost || 0).toLocaleString('fr-FR')} DZD
            </span>
          </div>
        )}
      </div>

      {/* PIED DE CARTE & ACTIONS OPÉRATEUR */}
      <div className="p-3 bg-[var(--df-bg-surface-2)] border-t border-[var(--df-border-subtle)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenInvoice(wo)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--df-radius-xs,4px)] text-xs font-semibold text-[var(--df-accent-blue)] bg-[var(--df-accent-blue-subtle)] hover:bg-[var(--df-bg-surface-3)] transition-colors"
            title="Générer Facture DGI A4"
          >
            <IconFileText size={12} />
            <span>Facture</span>
          </button>

          {!isCompleted && (
            <button
              type="button"
              onClick={() => onOpenComplete(wo)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--df-radius-xs,4px)] text-xs font-semibold text-[var(--df-status-ok-text)] bg-[var(--df-status-ok-bg)] hover:bg-[var(--df-bg-surface-3)] border border-[var(--df-status-ok-border)] transition-colors"
              title="Clôturer l'intervention"
            >
              <IconCheck size={12} />
              <span>Clôturer</span>
            </button>
          )}

          <SovereigntySeal type="DGI_FISCAL" size="xs" />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenEdit(wo)}
            className="p-1.5 text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] rounded-[var(--df-radius-xs,4px)] hover:bg-[var(--df-bg-surface-3)] transition-colors"
            aria-label="Modifier cet ordre"
          >
            <IconEdit size={13} />
          </button>
          <button
            type="button"
            onClick={() => onOpenDelete(wo.id, wo.title)}
            className="p-1.5 text-[var(--df-text-muted)] hover:text-[var(--df-status-danger-text)] rounded-[var(--df-radius-xs,4px)] hover:bg-[var(--df-status-danger-bg)] transition-colors"
            aria-label="Supprimer cet ordre"
          >
            <IconTrash size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
});

WorkOrderCard.displayName = 'WorkOrderCard';

