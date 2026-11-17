'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconTruck,
  IconFileText,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconRefreshCw,
  IconLock,
  IconSearch,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { RentalClient } from '@/lib/api-rental';
import { AssetClient } from '@/lib/api-assets';
import { formatCurrency } from '@/lib/currency-formatter';
import type {
  AssetRentalContract,
  AssetRentalCheckInOut,
  AssetRentalInvoice,
  AssetRentalDispute,
  Asset,
} from '@docteurflotte/contracts';

export default function RentalPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<AssetRentalContract[]>([]);
  const [checkInOuts, setCheckInOuts] = useState<AssetRentalCheckInOut[]>([]);
  const [invoices, setInvoices] = useState<AssetRentalInvoice[]>([]);
  const [disputes, setDisputes] = useState<AssetRentalDispute[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<'contracts' | 'inspections' | 'invoices' | 'disputes'>('contracts');
  const [searchQuery, setSearchQuery] = useState('');
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
      const [ctrData, chkData, invData, dispData, assetsData] = await Promise.all([
        RentalClient.listContracts(jwt).catch(() => []),
        RentalClient.listCheckInOuts(jwt).catch(() => []),
        RentalClient.listInvoices(jwt).catch(() => []),
        RentalClient.listDisputes(jwt).catch(() => []),
        AssetClient.listAssets(jwt).catch(() => []),
      ]);

      setContracts(ctrData);
      setCheckInOuts(chkData);
      setInvoices(invData);
      setDisputes(dispData);
      setAssets(assetsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des locations.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token]);

  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  // Métriques globales
  const metrics = useMemo(() => {
    const activeContracts = contracts.filter((c) => c.status === 'ACTIVE').length;
    let totalInvoicedDzd = 0;
    invoices.forEach((inv) => {
      totalInvoicedDzd += Number(inv.totalTtcDzd || 0);
    });

    let totalDepositsDzd = 0;
    contracts
      .filter((c) => c.status === 'ACTIVE' || c.status === 'RESERVED')
      .forEach((c) => {
        totalDepositsDzd += Number(c.depositAmountDzd || 0);
      });

    return {
      activeContracts,
      totalContracts: contracts.length,
      totalInvoicedDzd,
      totalDepositsDzd,
      disputesCount: disputes.filter((d) => d.status === 'OPEN').length,
    };
  }, [contracts, invoices, disputes]);

  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return contracts;
    const q = searchQuery.toLowerCase();
    return contracts.filter((c) => {
      const asset = assetMap.get(c.assetId);
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        (asset?.name && asset.name.toLowerCase().includes(q)) ||
        (asset?.code && asset.code.toLowerCase().includes(q))
      );
    });
  }, [contracts, searchQuery, assetMap]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* EN-TÊTE PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconTruck size={26} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  Location de Véhicules & Engins (Rental Flotte)
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Gestion des contrats, check-in/out numériques scellés SHA-256 et facturation conforme DGI (TVA 19%).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => token && loadData(token)}
              disabled={loading}
              className="p-2 rounded-lg border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface-elevated)] transition-all"
              title="Rafraîchir"
            >
              <IconRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
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

        {/* CARTES DE SYNTHÈSE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
              Contrats Actifs
            </span>
            <div className="text-2xl font-bold text-[var(--df-text-main)]">{metrics.activeContracts}</div>
            <p className="text-xs text-[var(--df-text-muted)]">{metrics.totalContracts} contrats au total</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Chiffre d’Affaires Facturé
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.totalInvoicedDzd)}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Facturation TVA 19% comprise</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Cautions en Cours
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(metrics.totalDepositsDzd)}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Dépôts de garantie retenus</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Litiges Ouverts
            </span>
            <div className={`text-2xl font-bold ${metrics.disputesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {metrics.disputesCount}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Dossiers d’expertise sous scellé</p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="flex border-b border-[var(--df-border-subtle)] gap-2 overflow-x-auto scrollbar-none max-w-full whitespace-nowrap">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'contracts'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Contrats de Location ({contracts.length})
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'inspections'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            États des Lieux & Scellés ({checkInOuts.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'invoices'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Factures de Location ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'disputes'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Litiges & Contentieux ({disputes.length})
          </button>
        </div>

        {/* ONGLET CONTRATS */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <IconSearch size={16} className="absolute left-3 top-3 text-[var(--df-text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, client ou actif..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                />
              </div>
            </div>

            {filteredContracts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconTruck size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucun contrat de location</p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Créez des contrats de location pour vos véhicules et engins avec contrôle du garage à 0 DA et facturation TVA intégrée.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">N° Contrat</th>
                      <th className="py-3 px-4">Actif Loué</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Période</th>
                      <th className="py-3 px-4 text-right">Tarif / jour</th>
                      <th className="py-3 px-4 text-right">Caution</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {filteredContracts.map((c) => {
                      const asset = assetMap.get(c.assetId);
                      return (
                        <tr key={c.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--df-brand-primary)]">
                            {c.contractNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--df-text-main)]">
                              {asset ? `${asset.code} — ${asset.name}` : c.assetCode || c.assetId.slice(0, 8)}
                            </div>
                            <span className="text-xs text-[var(--df-text-muted)]">
                              {asset?.category || 'Véhicule'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[var(--df-text-main)]">{c.customerName}</div>
                            <span className="text-xs text-[var(--df-text-muted)]">{c.customerPhoneDz}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                            {c.startDate} au {c.endDate}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {formatCurrency(Number(c.dailyRateDzd))}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {formatCurrency(Number(c.depositAmountDzd))}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : c.status === 'RESERVED'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : c.status === 'INVOICED'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/rental/${c.id}`}
                              className="text-xs font-semibold text-[var(--df-brand-primary)] hover:underline"
                            >
                              Gérer →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET ÉTATS DES LIEUX */}
        {activeTab === 'inspections' && (
          <div className="space-y-4">
            {checkInOuts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconShieldCheck size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucun état des lieux enregistré</p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Les PV de départ (Check-Out) et de retour (Check-In) avec signatures et scellés SHA-256 apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">Date & Heure</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Signataire Client</th>
                      <th className="py-3 px-4 text-right">Compteur</th>
                      <th className="py-3 px-4 text-center">Carburant</th>
                      <th className="py-3 px-4">Propreté</th>
                      <th className="py-3 px-4 text-center">Empreinte SHA-256</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {checkInOuts.map((chk) => (
                      <tr key={chk.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                        <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                          {new Date(chk.performedAt).toLocaleString('fr-DZ')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              chk.type === 'CHECK_OUT'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {chk.type === 'CHECK_OUT' ? 'DÉPART (Check-Out)' : 'RETOUR (Check-In)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">
                          {chk.customerSignatoryName}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[var(--df-text-main)]">
                          {chk.meterValue} km
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[var(--df-text-main)]">
                          {chk.fuelLevelQuarter}/4
                        </td>
                        <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">{chk.cleanlinessState}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-xs text-[var(--df-text-muted)]" title={chk.sha256Proof}>
                            {chk.sha256Proof.slice(0, 10)}...
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET FACTURES */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconFileText size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucune facture émise</p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Les factures générées à la clôture des contrats avec ventilation HT, TVA 19% et droit de timbre s’afficheront ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">N° Facture</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4 text-center">Jours</th>
                      <th className="py-3 px-4 text-right">Montant HT</th>
                      <th className="py-3 px-4 text-right">TVA (19%)</th>
                      <th className="py-3 px-4 text-right">Total TTC</th>
                      <th className="py-3 px-4 text-center">Paiement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[var(--df-brand-primary)]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">{inv.customerName}</td>
                        <td className="py-3 px-4 text-center text-xs text-[var(--df-text-muted)]">
                          {inv.baseDaysBilled} j
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                          {formatCurrency(Number(inv.totalHtDzd))}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(inv.vatAmountDzd))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[var(--df-text-main)]">
                          {formatCurrency(Number(inv.totalTtcDzd))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {inv.isPaid ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <IconCheck size={12} /> Réglée
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">En attente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET LITIGES */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconShieldCheck size={36} className="mx-auto text-emerald-500 opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Zéro litige ouvert</p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Tous les retours de location sont conformes. Aucun contentieux ni retenue de caution en cours.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-5 rounded-2xl border border-red-500/20 bg-[var(--df-bg-surface-elevated)] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <IconAlertTriangle size={18} className="text-red-500" />
                        <span className="font-mono font-bold text-[var(--df-text-main)]">{disp.disputeRef}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-600">
                          {disp.status}
                        </span>
                      </div>
                      <div className="text-right text-xs font-mono text-[var(--df-text-muted)]">
                        SHA-256: {disp.sha256LegalDossier.slice(0, 16)}...
                      </div>
                    </div>

                    <p className="text-sm text-[var(--df-text-main)]">{disp.disputeReason}</p>

                    <div className="pt-2 border-t border-[var(--df-border-subtle)] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--df-text-muted)]">Partie Demandresse</span>
                        <p className="font-semibold text-[var(--df-text-main)]">{disp.claimant}</p>
                      </div>
                      <div>
                        <span className="text-[var(--df-text-muted)]">Montant Réclamé</span>
                        <p className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(Number(disp.claimedAmountDzd))}
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--df-text-muted)]">Caution Retenue</span>
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(Number(disp.retainedDepositDzd))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

