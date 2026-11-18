'use client';

import React from 'react';
import { IconTruck } from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import { AssetSiteAssignment, Asset } from '@docteurflotte/contracts';

interface AssignmentsTableViewProps {
  assignments: AssetSiteAssignment[];
  assetMap: Map<string, Asset>;
}

export function AssignmentsTableView({
  assignments,
  assetMap,
}: AssignmentsTableViewProps) {
  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
          <IconTruck size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
          <p className="text-base font-semibold text-[var(--df-text-main)]">
            Aucune affectation active
          </p>
          <p className="text-xs text-[var(--df-text-muted)]">
            Les engins de chantier ou camions déployés sur site s’afficheront ici avec leur tarif interne journalier.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
              <tr>
                <th className="py-3 px-4">Engin / Actif</th>
                <th className="py-3 px-4">Chantier</th>
                <th className="py-3 px-4">Date Début</th>
                <th className="py-3 px-4 text-right">Compteur Début</th>
                <th className="py-3 px-4 text-right">Tarif Interne / j</th>
                <th className="py-3 px-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--df-border-subtle)]">
              {assignments.map((ass) => {
                const asset = assetMap.get(ass.assetId);
                return (
                  <tr
                    key={ass.id}
                    className="hover:bg-[var(--df-bg-surface)] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--df-text-main)]">
                        {asset
                          ? `${asset.code} — ${asset.name}`
                          : ass.assetCode || ass.assetId.slice(0, 8)}
                      </div>
                      <span className="text-xs text-[var(--df-text-muted)]">
                        {asset?.category || 'Engin BTP'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--df-text-main)]">
                      {ass.siteName || ass.siteId.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                      {new Date(ass.startDate).toLocaleDateString('fr-DZ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[var(--df-text-main)]">
                      {ass.startMeterHours} h
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                      {formatCurrency(Number(ass.internalDailyRateDzd))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          ass.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {ass.status}
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
  );
}

