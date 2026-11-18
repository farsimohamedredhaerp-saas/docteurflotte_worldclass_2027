'use client';

import React from 'react';
import {
  IconShieldCheck,
  IconFileText,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import { ReeferHaccpCertificate } from '@/lib/api-fleet-intelligence';

interface HaccpCertificatesTableViewProps {
  certificates: ReeferHaccpCertificate[];
  onSelectCertificate: (cert: ReeferHaccpCertificate) => void;
}

export function HaccpCertificatesTableView({
  certificates,
  onSelectCertificate,
}: HaccpCertificatesTableViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--df-text-main)] flex items-center gap-2">
            <IconShieldCheck size={20} className="text-emerald-500" />
            Certificats Sanitaires de Traçabilité Thermique &amp; ATP
          </h2>
          <p className="text-xs text-[var(--df-text-muted)]">
            Documents juridiques et sanitaires scellés par empreinte cryptographique SHA-256,
            opposables à la Direction des Services Vétérinaires (DSV) et aux compagnies d’assurance.
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
          <IconFileText size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
          <p className="text-base font-semibold text-[var(--df-text-main)]">
            Aucun certificat HACCP émis pour le moment
          </p>
          <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
            Générez un certificat officiel de fin de mission depuis l’onglet flotte frigorifique.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
              <tr>
                <th className="py-3 px-4">Réf. Certificat</th>
                <th className="py-3 px-4">Trajet (Wilayas)</th>
                <th className="py-3 px-4">Cargaison</th>
                <th className="py-3 px-4 text-center">Températures (Min/Moy/Max)</th>
                <th className="py-3 px-4 text-right">Carburant Groupe Auxiliaire</th>
                <th className="py-3 px-4 text-center">Verdict Sanitaire</th>
                <th className="py-3 px-4 text-center">Scellé SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--df-border-subtle)]">
              {certificates.map((cert) => (
                <tr
                  key={cert.id}
                  className="hover:bg-[var(--df-bg-surface-2)] transition-colors cursor-pointer"
                  onClick={() => onSelectCertificate(cert)}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {cert.certificateRef}
                    </span>
                    <div className="text-[10px] text-[var(--df-text-muted)]">
                      {new Date(cert.departureTime).toLocaleDateString('fr-DZ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span className="font-semibold text-[var(--df-text-main)]">
                      Wilaya {cert.departureWilaya.toString().padStart(2, '0')} → Wilaya{' '}
                      {cert.arrivalWilaya.toString().padStart(2, '0')}
                    </span>
                    <div className="text-[10px] text-[var(--df-text-muted)]">
                      {cert.missionRef || 'Mission Régulière'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span className="font-semibold">{cert.cargoType}</span>
                    <div className="text-[11px] text-[var(--df-text-muted)] line-clamp-1">
                      {cert.cargoDescription}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs">
                    <span className="text-blue-500">+{cert.minTempRecordedC}°C</span> /{' '}
                    <span className="font-bold">+{cert.averageTempC}°C</span> /{' '}
                    <span className="text-red-500">+{cert.maxTempRecordedC}°C</span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs">
                    <div className="font-mono font-bold">
                      {cert.auxiliaryFuelConsumedLiters} L
                    </div>
                    <div className="text-[10px] text-[var(--df-text-muted)]">
                      {formatCurrency(cert.auxiliaryFuelCostDzd)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        cert.complianceStatus === 'CONFORME_HACCP'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                      }`}
                    >
                      {cert.complianceStatus === 'CONFORME_HACCP'
                        ? 'CONFORME DSV'
                        : 'NON CONFORME'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      title={cert.sha256Hash}
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--df-text-muted)] px-1.5 py-0.5 rounded bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]"
                    >
                      <IconShieldCheck size={12} className="text-emerald-500" />
                      {cert.sha256Hash.slice(0, 8)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

