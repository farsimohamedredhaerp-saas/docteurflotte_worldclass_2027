'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconTruck,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconChevronLeft,
  IconRefreshCw,
  IconFileText,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { FiscalClient } from '@/lib/api-fiscal';
import { AssetClient } from '@/lib/api-assets';
import { formatCurrency } from '@/lib/currency-formatter';
import type {
  AssetFiscalSummary,
  FiscalDocument,
  Asset,
} from '@docteurflotte/contracts';

interface PageProps {
  params: Promise<{ assetId: string }>;
}

export default function AssetFiscalDetailPage({ params }: PageProps) {
  const { assetId } = use(params);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AssetFiscalSummary | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const session = AuthClient.getSession();
    if (session?.token) {
      setToken(session.token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (jwt: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sumData, docsData, assetsList] = await Promise.all([
        FiscalClient.getAssetFiscalSummary(assetId, jwt).catch(() => null),
        FiscalClient.listDocuments(jwt, { assetId }).catch(() => []),
        AssetClient.listAssets(jwt).catch(() => []),
      ]);

      setSummary(sumData);
      setDocuments(docsData);
      const found = assetsList.find((a) => a.id === assetId) || null;
      setAsset(found);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement du dossier fiscal de l’actif.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token, assetId]);

  const isTourisme = asset?.category === 'ROAD_VEHICLE';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* RETOUR & TITRE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-6">
          <div className="space-y-1">
            <Link
              href="/fiscal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--df-brand-primary)] hover:underline mb-2"
            >
              <IconChevronLeft size={14} /> Retour au Registre Fiscal
            </Link>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconTruck size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  Fiche Fiscale : {asset ? `${asset.code} — ${asset.name}` : `Actif ${assetId.slice(0, 8)}`}
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Historique fiscal, déductibilité TVA (Art. 30 Code TCA) et statut de régularisation quinquennale.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => token && loadData(token)}
            disabled={loading}
            className="p-2 rounded-lg border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface-elevated)] self-start sm:self-auto"
            title="Rafraîchir"
          >
            <IconRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ALERTE ERREUR */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <IconAlertTriangle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* BANNIÈRE DE QUALIFICATION FISCALE */}
        <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-2">
          <div className="flex items-center gap-2">
            <IconShieldCheck size={18} className={isTourisme ? 'text-amber-500' : 'text-emerald-500'} />
            <h2 className="text-sm font-bold text-[var(--df-text-main)]">
              {isTourisme
                ? 'Véhicule de Tourisme (VP) — Exclusion Art. 30 Code TCA'
                : 'Véhicule Utilitaire / Industriel / Engin — Éligible à Déduction Intégrale'}
            </h2>
          </div>
          <p className="text-xs text-[var(--df-text-muted)] leading-relaxed">
            {isTourisme
              ? 'Conformément aux dispositions de l’Article 30 du Code TCA algérien, la TVA grevant l’acquisition, l’entretien, les pièces et le carburant de ce véhicule ne peut être déduite. Le moteur fiscal incorpore automatiquement la TVA au coût de revient déductible de l’IBS.'
              : 'Cet actif ouvre droit à la récupération intégrale de la TVA sur pièces, entretien, et carburant gazole (barème légal DGI). La déduction est traçable et rattachée à chaque déclaration mensuelle G50.'}
          </p>
        </div>

        {/* MÉTRIQUES SYNTHÉTIQUES DE L'ACTIF */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
              <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
                Total Dépenses Rattachées
              </span>
              <div className="text-xl font-bold text-[var(--df-text-main)]">
                {formatCurrency(summary.totalExpensesDzd)}
              </div>
              <p className="text-xs text-[var(--df-text-muted)]">{summary.documentsCount} pièce(s) au registre</p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                TVA Récupérée (Déduite)
              </span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.vatDeductedDzd)}
              </div>
              <p className="text-xs text-[var(--df-text-muted)]">Imputée sur déclarations G50</p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                TVA Non Déductible
              </span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(summary.vatNonDeductibleDzd)}
              </div>
              <p className="text-xs text-[var(--df-text-muted)]">Exclue selon Art. 30 Code TCA</p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Régul. Quinquennale
              </span>
              <div className="text-sm font-bold text-[var(--df-text-main)] mt-1">
                {summary.quinquennialAdjustmentRequired ? (
                  <span className="text-amber-600 dark:text-amber-400">Reversement applicable si cession</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">Délai 5 ans expiré</span>
                )}
              </div>
              <p className="text-xs text-[var(--df-text-muted)]">Code TCA (Biens amortissables)</p>
            </div>
          </div>
        )}

        {/* HISTORIQUE DES PIÈCES COMPTABLES */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[var(--df-text-main)]">
            Pièces Justificatives Rattachées à cet Actif
          </h3>

          {documents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--df-border-subtle)] rounded-2xl text-[var(--df-text-muted)] text-sm">
              Aucune pièce justificative rattachée à cet actif.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Réf Pièce</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Montant HT</th>
                    <th className="py-3 px-4 text-right">TVA</th>
                    <th className="py-3 px-4">Statut Déductibilité</th>
                    <th className="py-3 px-4 text-center">Empreinte SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--df-border-subtle)]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                      <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">{doc.documentDate}</td>
                      <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">{doc.documentNumber}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]">
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                        {formatCurrency(Number(doc.amountHtDzd))}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                        {formatCurrency(Number(doc.vatAmountDzd))}
                      </td>
                      <td className="py-3 px-4">
                        {doc.documentType === 'CONTRAT_LOCATION' ||
                        doc.documentType === 'FACTURE_CLIENT' ||
                        doc.documentType === 'SITUATION_TRAVAUX' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <IconShieldCheck size={12} /> TVA Collectée (445700)
                          </span>
                        ) : doc.isVatDeductible ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <IconCheck size={12} /> Déductible (445600)
                          </span>
                        ) : doc.isVatExemptF20 ? (
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            Franchise F20/AAPI
                          </span>
                        ) : (
                          <span
                            className="text-xs font-medium text-amber-600 dark:text-amber-400"
                            title={doc.deductibilityRationale || undefined}
                          >
                            {doc.documentType === 'AMENDE' ? 'Non déductible (Art. 169)' : 'Exclue (Art. 30)'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-xs text-[var(--df-text-muted)]" title={doc.sha256Fingerprint}>
                          {doc.sha256Fingerprint.slice(0, 10)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
