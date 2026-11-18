'use client';

import React from 'react';
import {
  IconFuel,
  IconDatabase,
  IconPlus,
  IconFileText,
  IconAlertTriangle,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import {
  SiteConsumableTank,
  SiteConsumableDelivery,
  SiteWorkspace,
  ConsumableType,
} from '@docteurflotte/contracts';
import { CONSUMABLE_CONFIG } from './constants';

interface TanksConsumablesViewProps {
  tanks: SiteConsumableTank[];
  deliveries: SiteConsumableDelivery[];
  siteMap: Map<string, SiteWorkspace>;
  onOpenDeliveryModal: () => void;
  onOpenTankModal: () => void;
}

export function TanksConsumablesView({
  tanks,
  deliveries,
  siteMap,
  onOpenDeliveryModal,
  onOpenTankModal,
}: TanksConsumablesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--df-text-main)] flex items-center gap-2">
            <IconFuel size={20} className="text-amber-500" />
            Cuves de Chantier & Stocks de Fluides Industriels
          </h2>
          <p className="text-xs text-[var(--df-text-muted)]">
            Suivi des réserves fixes, citernes mobiles et fûts d’atelier (Gasoil, GPLc, Essence,
            Huiles ISO 46/68, AdBlue).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDeliveryModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface)] transition-all"
          >
            <IconFileText size={15} />
            Réceptionner BL Naftal
          </button>
          <button
            onClick={onOpenTankModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--df-brand-primary)] text-white hover:bg-[var(--df-brand-primary)]/90 transition-all shadow-sm"
          >
            <IconPlus size={15} />
            Nouvelle Cuve
          </button>
        </div>
      </div>

      {tanks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
          <IconDatabase
            size={36}
            className="mx-auto text-[var(--df-text-muted)] opacity-60"
          />
          <p className="text-base font-semibold text-[var(--df-text-main)]">
            Aucune cuve de stockage enregistrée
          </p>
          <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
            Ajoutez vos cuves fixes, citernes mobiles ravitailleuses ou parcs de fûts pour contrôler
            les niveaux de fluides et rapprocher les bons de livraison Naftal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tanks.map((tank) => {
            const conf =
              CONSUMABLE_CONFIG[tank.consumableType] ||
              CONSUMABLE_CONFIG[ConsumableType.GASOIL];
            const site = siteMap.get(tank.siteId);
            const pct = Math.min(
              100,
              Math.max(0, (tank.currentLevelLiters / tank.capacityLiters) * 100),
            );
            const isLow = pct <= tank.alertLowLevelPct;

            return (
              <div
                key={tank.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 bg-[var(--df-bg-surface-elevated)] ${
                  isLow
                    ? 'border-red-500/50 shadow-sm shadow-red-500/10'
                    : 'border-[var(--df-border-subtle)] hover:border-[var(--df-brand-primary)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--df-brand-primary)]">
                        {tank.tankCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${conf.badgeClass}`}
                      >
                        {conf.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[var(--df-text-main)] mt-1">
                      {tank.name}
                    </h3>
                    <p className="text-xs text-[var(--df-text-muted)]">
                      {site ? site.name : `Chantier ${tank.siteId.slice(0, 8)}`}
                    </p>
                  </div>

                  {isLow && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1 shrink-0">
                      <IconAlertTriangle size={12} /> Stock Bas
                    </span>
                  )}
                </div>

                {/* Jauge graphique */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[var(--df-text-muted)]">Niveau actuel</span>
                    <span className="font-mono font-bold text-[var(--df-text-main)]">
                      {tank.currentLevelLiters.toLocaleString()} L /{' '}
                      {tank.capacityLiters.toLocaleString()} L ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[var(--df-bg-base)] overflow-hidden border border-[var(--df-border-subtle)]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isLow ? 'bg-red-500' : conf.barColor
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--df-text-muted)]">
                    <span>Alerte à {tank.alertLowLevelPct}%</span>
                    <span>Réf: {formatCurrency(Number(tank.unitCostRefDzd))}/L</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--df-border-subtle)] flex items-center justify-between text-xs text-[var(--df-text-muted)]">
                  <span>
                    Dernier BL:{' '}
                    {tank.lastDeliveryDate
                      ? new Date(tank.lastDeliveryDate).toLocaleDateString('fr-DZ')
                      : 'Aucun'}
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Val: {formatCurrency(tank.currentLevelLiters * Number(tank.unitCostRefDzd))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLEAU DES LIVRAISONS & APPROVISIONNEMENTS */}
      <div className="space-y-3 pt-6 border-t border-[var(--df-border-subtle)]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
            <IconFileText size={18} className="text-blue-500" />
            Bons de Livraison Naftal & Distributeurs Réceptionnés
          </h3>
          <span className="text-xs text-[var(--df-text-muted)] font-mono">
            {deliveries.length} BL enregistrés avec intégrité SHA-256
          </span>
        </div>

        {deliveries.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--df-border-subtle)] rounded-xl text-xs text-[var(--df-text-muted)]">
            Aucun bon de livraison enregistré pour l’instant.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Réf. Bon de Livraison</th>
                  <th className="py-3 px-4">Fournisseur</th>
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4 text-right">Volume (L)</th>
                  <th className="py-3 px-4 text-right">Densité (15°C)</th>
                  <th className="py-3 px-4 text-right">Montant HT</th>
                  <th className="py-3 px-4 text-right">TVA (19%)</th>
                  <th className="py-3 px-4 text-right">Total TTC</th>
                  <th className="py-3 px-4 text-center">Sceau SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--df-border-subtle)]">
                {deliveries.map((del) => {
                  const conf =
                    CONSUMABLE_CONFIG[del.consumableType] ||
                    CONSUMABLE_CONFIG[ConsumableType.GASOIL];
                  return (
                    <tr
                      key={del.id}
                      className="hover:bg-[var(--df-bg-surface)] transition-colors"
                    >
                      <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                        {new Date(del.deliveryDate).toLocaleDateString('fr-DZ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[var(--df-text-main)]">
                        {del.deliveryNoteRef}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-[var(--df-text-main)]">
                          {del.supplierName}
                        </div>
                        <span className="text-[var(--df-text-muted)] font-mono">
                          {del.supplierNif || 'NIF NAFTAL'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${conf.badgeClass}`}
                        >
                          {conf.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--df-text-main)]">
                        {del.volumeLiters.toLocaleString()} L
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-[var(--df-text-muted)]">
                        {del.density ? del.density.toFixed(3) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                        {formatCurrency(Number(del.totalHtDzd))}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--df-text-muted)]">
                        {formatCurrency(Number(del.vatAmountDzd))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(del.totalTtcDzd))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          title={del.sha256Proof}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--df-text-muted)] px-1.5 py-0.5 rounded bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]"
                        >
                          <IconShieldCheck size={12} className="text-emerald-500" />
                          {del.sha256Proof ? del.sha256Proof.slice(0, 8) + '…' : 'Validé'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

