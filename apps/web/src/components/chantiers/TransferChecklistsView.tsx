'use client';

import React from 'react';
import { IconFileText, IconAlertTriangle } from '@/components/navigation/TechIcons';
import { AssetTransferChecklist, Asset } from '@docteurflotte/contracts';

interface TransferChecklistsViewProps {
  checklists: AssetTransferChecklist[];
  assetMap: Map<string, Asset>;
}

export function TransferChecklistsView({
  checklists,
  assetMap,
}: TransferChecklistsViewProps) {
  return (
    <div className="space-y-4">
      {checklists.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
          <IconFileText
            size={36}
            className="mx-auto text-[var(--df-text-muted)] opacity-60"
          />
          <p className="text-base font-semibold text-[var(--df-text-main)]">
            Aucun transfert inter-chantiers
          </p>
          <p className="text-xs text-[var(--df-text-muted)]">
            Les mouvements d’engins entre chantiers avec états des lieux, photos et signatures numériques s’enregistreront ici.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Actif</th>
                <th className="py-3 px-4">Transféré Par</th>
                <th className="py-3 px-4 text-right">Compteur Départ</th>
                <th className="py-3 px-4 text-right">Compteur Arrivée</th>
                <th className="py-3 px-4">État Constaté</th>
                <th className="py-3 px-4 text-center">Ordre de Travail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--df-border-subtle)]">
              {checklists.map((chk) => {
                const asset = assetMap.get(chk.assetId);
                return (
                  <tr
                    key={chk.id}
                    className="hover:bg-[var(--df-bg-surface)] transition-colors"
                  >
                    <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                      {new Date(chk.transferDate).toLocaleDateString('fr-DZ')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">
                      {asset ? `${asset.code} — ${asset.name}` : chk.assetId.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-[var(--df-text-main)]">{chk.transferredBy}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[var(--df-text-main)]">
                      {chk.meterHoursDeparture} h
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[var(--df-text-main)]">
                      {chk.meterHoursArrival ? `${chk.meterHoursArrival} h` : 'En transit'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          chk.generalState === 'REQUIRES_REPAIR'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {chk.generalState}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {chk.generatedWorkOrderId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                          <IconAlertTriangle size={12} /> OT Auto Déclenché
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--df-text-muted)]">—</span>
                      )}
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

