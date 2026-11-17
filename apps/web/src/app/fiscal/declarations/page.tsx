'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconFileText,
  IconLock,
  IconAlertTriangle,
  IconCheck,
  IconRefreshCw,
  IconChevronLeft,
  IconTruck,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { FiscalClient } from '@/lib/api-fiscal';
import { formatCurrency } from '@/lib/currency-formatter';
import type { FiscalDeclarationDraft, FiscalAuditSeal } from '@docteurflotte/contracts';

export default function FiscalDeclarationsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<FiscalDeclarationDraft | null>(null);
  const [seal, setSeal] = useState<FiscalAuditSeal | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sealingInProgress, setSealingInProgress] = useState(false);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  useEffect(() => {
    const session = AuthClient.getSession();
    if (session?.token) {
      setToken(session.token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadDraft = async (jwt: string, y: number, m: number) => {
    setLoading(true);
    setErrorMsg(null);
    setSeal(null);
    try {
      const data = await FiscalClient.getDeclarationDraft(y, m, jwt);
      setDraft(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement du brouillon G50.';
      setErrorMsg(msg);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDraft(token, selectedYear, selectedMonth);
    }
  }, [token, selectedYear, selectedMonth]);

  const handleSeal = async () => {
    if (!token) return;
    setSealingInProgress(true);
    setErrorMsg(null);
    try {
      const res = await FiscalClient.sealDeclaration(selectedYear, selectedMonth, token);
      setSeal(res);
      // Recharger le draft pour voir le statut SEALED
      await loadDraft(token, selectedYear, selectedMonth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec du scellement de la déclaration.';
      setErrorMsg(msg);
    } finally {
      setSealingInProgress(false);
    }
  };

  const isSealed = draft?.status === 'SEALED';
  const hasMissingPieces = (draft?.missingReceiptsCount || 0) > 0;

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
            <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
              Brouillon G50 & Scellement Immuable SHA-256
            </h1>
            <p className="text-sm text-[var(--df-text-muted)]">
              Ventilation par actif et scellement cryptographique opposable DGI (Code TCA / CIDTA).
            </p>
          </div>

          {/* SÉLECTEUR DE PÉRIODE */}
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Mois {m.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)]"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => token && loadDraft(token, selectedYear, selectedMonth)}
              disabled={loading}
              className="p-2 rounded-lg border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface-elevated)]"
              title="Actualiser"
            >
              <IconRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ALERTE ERREUR */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <IconAlertTriangle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* BANNIÈRE SCELLEMENT RÉUSSI */}
        {seal && (
          <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <IconCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span>Déclaration G50 Scellée avec Succès (Opposable DGI)</span>
            </div>
            <p className="text-xs font-mono break-all opacity-90">
              SHA-256: {seal.sha256Hash}
            </p>
            <p className="text-xs font-mono break-all opacity-80">
              Merkle Leaf: {seal.merkleLeaf}
            </p>
          </div>
        )}

        {/* CONTENU PRINCIPAL DU BROUILLON */}
        {draft && (
          <div className="space-y-6">
            {/* EN-TÊTE DÉCLARATION */}
            <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-[var(--df-text-muted)]">
                    Déclaration Mensuelle Série G N° 50
                  </span>
                  <h2 className="text-xl font-bold text-[var(--df-text-main)] mt-0.5">
                    Période {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
                  </h2>
                </div>

                <div>
                  {isSealed ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                      <IconLock size={14} /> SCELLÉ & INTÈGRE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30">
                      BROUILLON ÉDITABLE
                    </span>
                  )}
                </div>
              </div>

              {/* GRILLE DES LIGNES G50 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[var(--df-border-subtle)] text-sm">
                <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                  <span className="text-xs text-[var(--df-text-muted)]">TVA Déductible Validée</span>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(draft.totalVatDeductibleDzd)}
                  </div>
                  <span className="text-xs text-[var(--df-text-muted)]">Poids Lourds & Utilitaires</span>
                </div>

                <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                  <span className="text-xs text-[var(--df-text-muted)]">TVA Collectée (Facturations)</span>
                  <div className="text-lg font-bold text-[var(--df-text-main)] mt-1">
                    {formatCurrency(draft.totalVatCollectedDzd)}
                  </div>
                  <span className="text-xs text-[var(--df-text-muted)]">Prestations de transport</span>
                </div>

                <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                  <span className="text-xs text-[var(--df-text-muted)]">TVA Nette Due à Reverser</span>
                  <div className="text-lg font-bold text-[var(--df-brand-primary)] mt-1">
                    {formatCurrency(draft.netVatPayableDzd)}
                  </div>
                  <span className="text-xs text-[var(--df-text-muted)]">Collectée - Déductible</span>
                </div>

                <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                  <span className="text-xs text-[var(--df-text-muted)]">Droit de Timbre &amp; TLS (ex-TAP)</span>
                  <div className="text-lg font-bold text-[var(--df-text-main)] mt-1">
                    {formatCurrency(draft.stampDutyTotalDzd + (draft.tlsAmountDzd ?? draft.tapAmountDzd ?? 0))}
                  </div>
                  <span className="text-xs text-[var(--df-text-muted)]">Art. 14 LF 2024 / LF 2025</span>
                </div>
              </div>
            </div>

            {/* TABLEAU VENTILATION PAR ACTIF */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--df-text-main)]">
                    Ventilation des Dépenses & Déductions par Actif
                  </h3>
                  <p className="text-xs text-[var(--df-text-muted)]">
                    Traçabilité individuelle pour justification auprès de l’inspecteur DGI lors des vérifications sur pièces.
                  </p>
                </div>
              </div>

              {(!draft.breakdownByAsset || Object.keys(draft.breakdownByAsset).length === 0) ? (
                <div className="text-center py-12 border border-dashed border-[var(--df-border-subtle)] rounded-2xl text-[var(--df-text-muted)] text-sm">
                  Aucune dépense imputée à un actif pour cette période.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                      <tr>
                        <th className="py-3 px-4">Actif</th>
                        <th className="py-3 px-4 text-center">Nb Pièces</th>
                        <th className="py-3 px-4 text-right">Dépenses Totales</th>
                        <th className="py-3 px-4 text-right">TVA Déduite</th>
                        <th className="py-3 px-4 text-right">TVA Non Déductible</th>
                        <th className="py-3 px-4 text-center">Fiche Fiscale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--df-border-subtle)]">
                      {Object.entries(draft.breakdownByAsset).map(([assetId, data]) => (
                        <tr key={assetId} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">
                            <div className="flex items-center gap-2">
                              <IconTruck size={14} className="text-[var(--df-text-muted)]" />
                              <span>{data.assetCode || assetId.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-[var(--df-text-muted)]">
                            {data.itemsCount}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {formatCurrency(data.totalExpenseDzd)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(data.vatDeductibleDzd)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                            {formatCurrency(data.vatExcludedDzd)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/fiscal/assets/${assetId}`}
                              className="text-xs font-semibold text-[var(--df-brand-primary)] hover:underline"
                            >
                              Détails →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ACTION DE SCELLEMENT */}
            <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-[var(--df-text-main)]">
                    Scellement Déclaratif Immuable (SHA-256)
                  </h4>
                  <p className="text-xs text-[var(--df-text-muted)] mt-1">
                    Garantit l’intégrité mathématique de la liasse. Rend les écritures non modifiables et génère un jeton opposable.
                  </p>
                </div>

                <div>
                  {isSealed ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <IconCheck size={16} /> Déclaration déjà scellée
                    </div>
                  ) : (
                    <button
                      onClick={handleSeal}
                      disabled={hasMissingPieces || sealingInProgress}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
                        hasMissingPieces
                          ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-60'
                          : 'bg-[var(--df-brand-primary)] hover:opacity-90'
                      }`}
                    >
                      <IconLock size={16} />
                      <span>{sealingInProgress ? 'Scellement en cours...' : 'Sceller Déclaration G50'}</span>
                    </button>
                  )}
                </div>
              </div>

              {hasMissingPieces && !isSealed && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <IconAlertTriangle size={16} className="shrink-0" />
                  <span>
                    Scellement bloqué : il y a {draft.missingReceiptsCount} pièce(s) justificative(s) manquante(s).
                    Toutes les factures doivent être rattachées avant certification.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
