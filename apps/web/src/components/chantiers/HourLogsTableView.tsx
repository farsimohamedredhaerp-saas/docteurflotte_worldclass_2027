'use client';

import React from 'react';
import { IconActivity } from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import { AssetEngineHourLog, Asset, ConsumableType } from '@docteurflotte/contracts';
import { CONSUMABLE_CONFIG } from './constants';

interface HourLogsTableViewProps {
  hourLogs: AssetEngineHourLog[];
  assetMap: Map<string, Asset>;
}

export function HourLogsTableView({ hourLogs, assetMap }: HourLogsTableViewProps) {
  return (
    <div className="space-y-4">
      {hourLogs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
          <IconActivity
            size={36}
            className="mx-auto text-[var(--df-text-muted)] opacity-60"
          />
          <p className="text-base font-semibold text-[var(--df-text-main)]">
            Aucun relevé horaire enregistré
          </p>
          <p className="text-xs text-[var(--df-text-muted)]">
            Les relevés déclaratifs Mode 0 et les télémétries CAN J1939 s’afficheront ici avec le contrôle anti-dérive et les coûts multi-consommables.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Actif</th>
                <th className="py-3 px-4 text-right">Compteur</th>
                <th className="py-3 px-4 text-right">Delta Heures</th>
                <th className="py-3 px-4">Carburant Principal</th>
                <th className="py-3 px-4 text-right">Fluides Complémentaires</th>
                <th className="py-3 px-4 text-right">Coût Total Fluides</th>
                <th className="py-3 px-4 text-center">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--df-border-subtle)]">
              {hourLogs.map((log) => {
                const asset = assetMap.get(log.assetId);
                const fuelConf = log.fuelType
                  ? CONSUMABLE_CONFIG[log.fuelType as ConsumableType] ||
                    CONSUMABLE_CONFIG[ConsumableType.GASOIL]
                  : CONSUMABLE_CONFIG[ConsumableType.GASOIL];
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-[var(--df-bg-surface)] transition-colors"
                  >
                    <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                      {new Date(log.recordedAt).toLocaleString('fr-DZ')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">
                      {asset ? `${asset.code} — ${asset.name}` : log.assetId.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[var(--df-text-main)]">
                      {log.hoursValue} h
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +{log.deltaHoursSinceLast} h
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${fuelConf.badgeClass}`}
                        >
                          {fuelConf.label}
                        </span>
                        <span className="text-xs font-mono font-medium">
                          {log.fuelConsumedLiters ? `${log.fuelConsumedLiters} L` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[var(--df-text-muted)]">
                      {log.hydraulicOilLiters ? (
                        <div className="text-purple-600 dark:text-purple-400 font-medium">
                          Hydr: {log.hydraulicOilLiters} L
                        </div>
                      ) : null}
                      {log.adblueLiters ? (
                        <div className="text-cyan-600 dark:text-cyan-400 font-medium">
                          AdBlue: {log.adblueLiters} L
                        </div>
                      ) : null}
                      {log.engineOilLiters ? (
                        <div className="text-blue-600 dark:text-blue-400 font-medium">
                          Moteur: {log.engineOilLiters} L
                        </div>
                      ) : null}
                      {!log.hydraulicOilLiters && !log.adblueLiters && !log.engineOilLiters && (
                        <span>—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--df-text-main)]">
                      {log.totalConsumablesCostDzd
                        ? formatCurrency(Number(log.totalConsumablesCostDzd))
                        : log.fuelCostDzd
                          ? formatCurrency(Number(log.fuelCostDzd))
                          : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]">
                        {log.source}
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

