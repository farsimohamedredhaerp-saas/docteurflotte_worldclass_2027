'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconTruck,
  IconChevronLeft,
  IconAlertTriangle,
  IconCheck,
  IconRefreshCw,
  IconLock,
  IconFileText,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { RentalClient } from '@/lib/api-rental';
import { AssetClient } from '@/lib/api-assets';
import { formatCurrency } from '@/lib/currency-formatter';
import type {
  AssetRentalContract,
  AssetRentalCheckInOut,
  AssetRentalInvoice,
  Asset,
} from '@docteurflotte/contracts';

interface PageProps {
  params: Promise<{ contractId: string }>;
}

export default function RentalDetailPage({ params }: PageProps) {
  const { contractId } = use(params);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<AssetRentalContract | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [inspections, setInspections] = useState<AssetRentalCheckInOut[]>([]);
  const [invoices, setInvoices] = useState<AssetRentalInvoice[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      const [ctrData, chkData, invData, assetsList] = await Promise.all([
        RentalClient.getContract(contractId, jwt),
        RentalClient.listCheckInOuts(jwt, contractId),
        RentalClient.listInvoices(jwt, contractId),
        AssetClient.listAssets(jwt).catch(() => []),
      ]);

      setContract(ctrData);
      setInspections(chkData);
      setInvoices(invData);
      const foundAsset = assetsList.find((a) => a.id === ctrData.assetId) || null;
      setAsset(foundAsset);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement du contrat de location.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token, contractId]);

  const handleGenerateInvoice = async () => {
    if (!token) return;
    try {
      await RentalClient.generateInvoice(contractId, token);
      setSuccessMsg(
        'Facture émise avec succès — Document fiscal CONTRAT_LOCATION généré & TVA 19% collectée (Compte SCF 445700).'
      );
      loadData(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de génération de la facture.';
      setErrorMsg(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* RETOUR & TITRE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-6">
          <div className="space-y-1">
            <Link
              href="/rental"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--df-brand-primary)] hover:underline mb-2"
            >
              <IconChevronLeft size={14} /> Retour aux Contrats de Location
            </Link>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconTruck size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  {contract?.contractNumber} — {contract?.customerName}
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Actif : {asset ? `${asset.code} (${asset.name})` : contract?.assetId.slice(0, 8)} • Période : du {contract?.startDate} au {contract?.endDate}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {contract?.status === 'RETURNED' && (
              <button
                onClick={handleGenerateInvoice}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-[var(--df-brand-primary)] text-white hover:opacity-90 shadow-sm transition-all"
              >
                <IconFileText size={16} />
                <span>Générer Facture (TVA 19%)</span>
              </button>
            )}
            <button
              onClick={() => token && loadData(token)}
              disabled={loading}
              className="p-2 rounded-lg border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface-elevated)]"
              title="Rafraîchir"
            >
              <IconRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ALERTE ERREUR / SUCCÈS */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <IconAlertTriangle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-3">
            <IconCheck size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CONDITIONS DU CONTRAT */}
        {contract && (
          <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-4">
              <h2 className="text-base font-bold text-[var(--df-text-main)]">Conditions Financières & Opérationnelles</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
                Statut : {contract.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-[var(--df-text-muted)]">Tarif Journalier HT</span>
                <p className="font-bold text-base text-[var(--df-text-main)] mt-0.5">
                  {formatCurrency(contract.dailyRateDzd)}
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--df-text-muted)]">Caution (Dépôt de Garantie)</span>
                <p className="font-bold text-base text-blue-600 dark:text-blue-400 mt-0.5">
                  {formatCurrency(contract.depositAmountDzd)}
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--df-text-muted)]">Inclus par Jour</span>
                <p className="font-bold text-base text-[var(--df-text-main)] mt-0.5">
                  {contract.includedKmOrHoursPerDay} km / h
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--df-text-muted)]">Unité Supplémentaire</span>
                <p className="font-bold text-base text-[var(--df-text-main)] mt-0.5">
                  {formatCurrency(contract.extraUnitRateDzd)} / unité
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ÉTATS DES LIEUX (CHECK-IN / OUT) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--df-text-main)]">
                États des Lieux Contradictoires (Scellés SHA-256)
              </h3>
              <p className="text-xs text-[var(--df-text-muted)]">
                PV numériques de mise à disposition et de restitution opposables juridiquement.
              </p>
            </div>
          </div>

          {inspections.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--df-border-subtle)] rounded-2xl text-[var(--df-text-muted)] text-sm">
              Aucun état des lieux enregistré pour ce contrat.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspections.map((chk) => (
                <div
                  key={chk.id}
                  className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        chk.type === 'CHECK_OUT'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {chk.type === 'CHECK_OUT' ? 'Check-Out (Départ)' : 'Check-In (Retour)'}
                    </span>
                    <span className="text-xs text-[var(--df-text-muted)]">
                      {new Date(chk.performedAt).toLocaleString('fr-DZ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                    <div>
                      <span className="text-[var(--df-text-muted)]">Compteur Relevé</span>
                      <p className="font-mono font-bold text-[var(--df-text-main)] text-sm">{chk.meterValue} km</p>
                    </div>
                    <div>
                      <span className="text-[var(--df-text-muted)]">Niveau Carburant</span>
                      <p className="font-bold text-[var(--df-text-main)] text-sm">{chk.fuelLevelQuarter}/4 plein</p>
                    </div>
                    <div>
                      <span className="text-[var(--df-text-muted)]">Signé Par</span>
                      <p className="font-semibold text-[var(--df-text-main)]">{chk.customerSignatoryName}</p>
                    </div>
                    <div>
                      <span className="text-[var(--df-text-muted)]">État Propreté</span>
                      <p className="font-semibold text-[var(--df-text-main)]">{chk.cleanlinessState}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--df-border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--df-text-muted)]">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <IconLock size={12} /> Scellé SHA-256
                    </span>
                    <span>{chk.sha256Proof.slice(0, 16)}...</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FACTURES DU CONTRAT */}
        {invoices.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[var(--df-text-main)]">Facturation Émise</h3>
            <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                  <tr>
                    <th className="py-3 px-4">N° Facture</th>
                    <th className="py-3 px-4 text-center">Jours</th>
                    <th className="py-3 px-4 text-right">Base HT</th>
                    <th className="py-3 px-4 text-right">Dépassements</th>
                    <th className="py-3 px-4 text-right">TVA (19%)</th>
                    <th className="py-3 px-4 text-right">Total TTC</th>
                    <th className="py-3 px-4 text-center">Conformité Fiscale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--df-border-subtle)]">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-mono font-bold text-[var(--df-brand-primary)]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-[var(--df-text-muted)]">
                        {inv.baseDaysBilled} j
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                        {formatCurrency(Number(inv.baseRentalHtDzd))}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                        {formatCurrency(Number(inv.extraUnitsAmountDzd) + Number(inv.fuelPenaltyAmountDzd))}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(inv.vatAmountDzd))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[var(--df-text-main)]">
                        {formatCurrency(Number(inv.totalTtcDzd))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href="/fiscal/documents"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          title="Pièce fiscale CONTRAT_LOCATION générée et intégrée au G50"
                        >
                          <IconShieldCheck size={12} />
                          <span>SCF 445700</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

