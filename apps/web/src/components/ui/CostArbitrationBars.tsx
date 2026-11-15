'use client';

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CostArbitrationItem {
  id: string;
  assetLabel: string;
  actionCostDzd: number;
  inactionRiskDzd: number;
  breakdown?: {
    mechanicalDamageDzd: number;
    towingCostDzd: number;
    downtimeLossDzd: number;
  };
  preventiveActionLabel: string;
}

export interface CostArbitrationBarsProps {
  items: CostArbitrationItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function CostArbitrationBars({
  items,
  title = 'Preuve Actuarielle : Arbitrage Financier Prescriptif (SAD ➔ ADS)',
  subtitle = 'Comparatif immédiat : Coût d\'action préventive vs Risque financier d\'inaction en Dinars Algériens (DZD)',
  className,
}: CostArbitrationBarsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  // Calcul du total cumulé de la sélection
  const totalActionCost = items.reduce((acc, it) => acc + it.actionCostDzd, 0);
  const totalInactionRisk = items.reduce((acc, it) => acc + it.inactionRiskDzd, 0);
  const totalNetSavings = Math.max(0, totalInactionRisk - totalActionCost);
  const roiMultiplier = totalActionCost > 0 ? (totalInactionRisk / totalActionCost).toFixed(1) : '10+';

  return (
    <div
      className={cn(
        'rounded-[var(--df-radius-lg,10px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-5 shadow-[var(--df-shadow-sm)] flex flex-col justify-between relative',
        'before:content-[""] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-[var(--df-border-card-top,#ffffff)] before:opacity-10 before:pointer-events-none',
        className
      )}
    >
      {/* En-tête : Titre & Badge ROI Global */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--df-border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-ok-bg)] text-[var(--df-status-ok-text)] border border-[var(--df-status-ok-border)]">
              Principe P3 : Preuve Avant l&apos;Action
            </span>
            <span className="text-[10px] font-mono text-[var(--df-text-muted)]">
              Norme Financière DGI / ENACTA
            </span>
          </div>
          <h3 className="text-[14px] font-bold text-[var(--df-text-main)] font-sans">
            {title}
          </h3>
          <p className="text-[11.5px] text-[var(--df-text-muted)] mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Synthèse Macro Chiffrée */}
        <div className="flex items-center gap-4 bg-[var(--df-bg-surface-2)] p-2.5 px-3.5 rounded-[var(--df-radius-md,8px)] border border-[var(--df-border-subtle)] shrink-0">
          <div>
            <div className="text-[10px] font-mono uppercase text-[var(--df-text-muted)]">
              Économie Nette Flotte
            </div>
            <div className="text-[15px] font-mono font-bold text-[var(--df-status-ok-text)] tabular-nums">
              +{totalNetSavings.toLocaleString('fr-FR')} DZD
            </div>
          </div>
          <div className="w-[1px] h-7 bg-[var(--df-border-subtle)]" />
          <div>
            <div className="text-[10px] font-mono uppercase text-[var(--df-text-muted)]">
              Facteur ROI
            </div>
            <div className="text-[15px] font-mono font-bold text-[var(--df-accent-blue)] tabular-nums">
              {roiMultiplier}x
            </div>
          </div>
        </div>
      </div>

      {/* Liste des barres comparatives par actif */}
      <div className="space-y-4">
        {items.map((item) => {
          const maxVal = Math.max(item.inactionRiskDzd, item.actionCostDzd) || 1;
          const actionPct = Math.max(6, Math.min(100, (item.actionCostDzd / maxVal) * 100));
          const inactionPct = Math.max(6, Math.min(100, (item.inactionRiskDzd / maxVal) * 100));
          const netItemSavings = Math.max(0, item.inactionRiskDzd - item.actionCostDzd);

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-[var(--df-radius-md,8px)] bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] space-y-2.5"
            >
              {/* Ligne 1 : Intitulé Actif & Action */}
              <div className="flex items-center justify-between text-[12px] gap-2 flex-wrap">
                <span className="font-semibold text-[var(--df-text-main)] font-sans">
                  {item.assetLabel}
                </span>
                <span className="text-[11px] font-mono font-medium text-[var(--df-text-secondary)]">
                  {item.preventiveActionLabel}
                </span>
              </div>

              {/* Ligne 2 : Barre Coût Action Immédiate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="text-[var(--df-text-secondary)]">
                    Coût Préventif Immédiat (Pièces &amp; Main d&apos;œuvre)
                  </span>
                  <span className="font-bold tabular-nums text-[var(--df-text-main)]">
                    {item.actionCostDzd.toLocaleString('fr-FR')} DZD
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--df-bg-surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--df-chart-1)] rounded-full transition-all duration-[var(--df-dur-slow,320ms)] ease-[var(--df-ease-out-quint)]"
                    style={{ width: `${actionPct}%` }}
                  />
                </div>
              </div>

              {/* Ligne 3 : Barre Risque d'Inaction */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="text-[var(--df-status-danger-text)] font-semibold">
                    Risque Financier d&apos;Inaction (Casse + Remorquage + Arrêt)
                  </span>
                  <span className="font-bold tabular-nums text-[var(--df-status-danger-text)]">
                    {item.inactionRiskDzd.toLocaleString('fr-FR')} DZD
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--df-bg-surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--df-status-danger)] rounded-full transition-all duration-[var(--df-dur-slow,320ms)] ease-[var(--df-ease-out-quint)]"
                    style={{ width: `${inactionPct}%` }}
                  />
                </div>
              </div>

              {/* Ligne 4 : Sous-détails sahariens & Gain Net */}
              <div className="pt-1.5 flex items-center justify-between text-[10.5px] font-mono border-t border-[var(--df-border-subtle)] text-[var(--df-text-muted)] flex-wrap gap-2">
                {item.breakdown ? (
                  <div className="flex items-center gap-3">
                    <span>Casse: {item.breakdown.mechanicalDamageDzd.toLocaleString('fr-FR')} DZD</span>
                    <span>•</span>
                    <span>Remorquage: {item.breakdown.towingCostDzd.toLocaleString('fr-FR')} DZD</span>
                    <span>•</span>
                    <span>Immo: {item.breakdown.downtimeLossDzd.toLocaleString('fr-FR')} DZD</span>
                  </div>
                ) : (
                  <span>Arbitrage physique certifié</span>
                )}

                <div className="font-bold text-[var(--df-status-ok-text)]">
                  Gain Net : +{netItemSavings.toLocaleString('fr-FR')} DZD
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

