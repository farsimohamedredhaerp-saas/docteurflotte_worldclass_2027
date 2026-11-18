'use client';

import React from 'react';
import {
  IconFileText,
  IconPlus,
  IconShieldCheck,
  IconCheck,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import { SiteWorkSituation, SiteWorkspace } from '@docteurflotte/contracts';

interface WorkSituationsViewProps {
  workSituations: SiteWorkSituation[];
  siteMap: Map<string, SiteWorkspace>;
  actionLoading: string | null;
  onOpenSituationModal: () => void;
  onApproveSituation: (id: string) => void;
  onBillSituation: (id: string) => void;
  onSettleSituation: (id: string) => void;
}

export function WorkSituationsView({
  workSituations,
  siteMap,
  actionLoading,
  onOpenSituationModal,
  onApproveSituation,
  onBillSituation,
  onSettleSituation,
}: WorkSituationsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--df-text-main)] flex items-center gap-2">
            <IconFileText size={20} className="text-purple-500" />
            Situations de Travaux & Décomptes Provisoires Mensuels (DPM)
          </h2>
          <p className="text-xs text-[var(--df-text-muted)]">
            Conformité stricte Marchés Publics BTPH (Décret 15-247) : Déduction automatique de la
            retenue de garantie de 5% (compte 411700) et TVA exigible à l’encaissement (compte 445780,
            Art. 14 CTCA).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSituationModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--df-brand-primary)] text-white hover:bg-[var(--df-brand-primary)]/90 transition-all shadow-sm"
          >
            <IconPlus size={15} />
            Nouvelle Situation (DPM)
          </button>
        </div>
      </div>

      {/* Bannière explicative fiscale & juridique */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-[var(--df-text-muted)] space-y-1">
        <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
          <IconShieldCheck size={16} />
          <span>Régime Juridique & Comptable Algérien des Travaux BTPH</span>
        </div>
        <p>
          1. <strong>Retenue de Garantie (5%)</strong> : Déduite du montant brut HT et isolée au compte
          de tiers <code>411700</code> jusqu’à la réception définitive des travaux (Art. 132 Décret
          15-247).
        </p>
        <p>
          2. <strong>Fait Générateur TVA (Encaissement)</strong> : Pour les prestations de travaux et
          services (Art. 14 CTCA), la TVA collectée n’est pas exigible à la facturation. Elle reste
          cantonnée au compte d’attente <code>445780</code> et n’est transférée au compte{' '}
          <code>445710</code> (G50 exigible) que lors de l’encaissement bancaire effectif.
        </p>
      </div>

      {workSituations.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
          <IconFileText
            size={36}
            className="mx-auto text-[var(--df-text-muted)] opacity-60"
          />
          <p className="text-base font-semibold text-[var(--df-text-main)]">
            Aucune situation de travaux enregistrée
          </p>
          <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
            Émettez vos décomptes provisoires mensuels (DPM) pour chaque chantier BTPH afin de générer
            automatiquement les écritures SCF et contrôler les encaissements.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
              <tr>
                <th className="py-3 px-4">N° Situation</th>
                <th className="py-3 px-4">Chantier & Client</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4 text-right">Travaux Brut HT</th>
                <th className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">
                  Retenue 5% (411700)
                </th>
                <th className="py-3 px-4 text-right">Net Travaux HT</th>
                <th className="py-3 px-4 text-right text-purple-600 dark:text-purple-400">
                  TVA 19% (445780)
                </th>
                <th className="py-3 px-4 text-right font-bold">Total TTC à Payer</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions & Écritures SCF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--df-border-subtle)]">
              {workSituations.map((sit) => {
                const site = siteMap.get(sit.siteId);
                const isPending = actionLoading === sit.id;

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                    Brouillon (DRAFT)
                  </span>
                );
                if (sit.status === 'APPROVED') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      Approuvé (CTC/MO)
                    </span>
                  );
                } else if (sit.status === 'BILLED') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      Facturé & SCF
                    </span>
                  );
                } else if (sit.status === 'PAID') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Encaissé & TVA Transférée
                    </span>
                  );
                }

                return (
                  <tr
                    key={sit.id}
                    className="hover:bg-[var(--df-bg-surface)] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {sit.situationNumber}
                      </span>
                      <div className="text-[10px] text-[var(--df-text-muted)] font-mono">
                        Sceau:{' '}
                        {sit.sha256Seal ? sit.sha256Seal.slice(0, 8) + '…' : 'Sécurisé'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--df-text-main)]">
                        {site ? site.name : sit.siteId.slice(0, 8)}
                      </div>
                      <span className="text-xs text-[var(--df-text-muted)]">
                        Client: {sit.clientName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                      Du {new Date(sit.periodStart).toLocaleDateString('fr-DZ')} au{' '}
                      {new Date(sit.periodEnd).toLocaleDateString('fr-DZ')}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                      {formatCurrency(Number(sit.monthWorkAmountHtDzd))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                      -{formatCurrency(Number(sit.withholdingGuaranteeAmountDzd))}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                      {formatCurrency(Number(sit.netWorkAmountHtDzd))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
                      {formatCurrency(Number(sit.vatAmountDzd))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Number(sit.totalPayableTtcDzd))}
                    </td>
                    <td className="py-3 px-4 text-center">{statusBadge}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {sit.status === 'DRAFT' && (
                          <button
                            onClick={() => onApproveSituation(sit.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                            title="Valider visa ordonnateur / CTC"
                          >
                            {isPending ? '…' : 'Approuver (CTC)'}
                          </button>
                        )}

                        {sit.status === 'APPROVED' && (
                          <button
                            onClick={() => onBillSituation(sit.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 transition-all"
                            title="Générer facture client et passer l’écriture comptable SCF"
                          >
                            {isPending ? '…' : 'Facturer & Écriture SCF'}
                          </button>
                        )}

                        {sit.status === 'BILLED' && (
                          <button
                            onClick={() => onSettleSituation(sit.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                            title="Encaisser le règlement et transférer la TVA au compte 445710"
                          >
                            {isPending ? '…' : 'Encaisser (Art. 14)'}
                          </button>
                        )}

                        {sit.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <IconCheck size={14} /> Réglé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

