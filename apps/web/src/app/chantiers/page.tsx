'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconTruck,
  IconWrench,
  IconActivity,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconRefreshCw,
  IconPlus,
  IconFileText,
  IconSearch,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { ChantiersClient } from '@/lib/api-chantiers';
import { AssetClient } from '@/lib/api-assets';
import { formatCurrency } from '@/lib/currency-formatter';
import type {
  SiteWorkspace,
  AssetSiteAssignment,
  AssetEngineHourLog,
  AssetTransferChecklist,
  Asset,
} from '@docteurflotte/contracts';

export default function ChantiersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SiteWorkspace[]>([]);
  const [assignments, setAssignments] = useState<AssetSiteAssignment[]>([]);
  const [hourLogs, setHourLogs] = useState<AssetEngineHourLog[]>([]);
  const [checklists, setChecklists] = useState<AssetTransferChecklist[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<'sites' | 'assignments' | 'hours' | 'transfers'>('sites');
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
      const [sitesData, assignmentsData, hoursData, checklistsData, assetsData] = await Promise.all([
        ChantiersClient.listSites(jwt).catch(() => []),
        ChantiersClient.listAssignments(jwt).catch(() => []),
        ChantiersClient.listEngineHourLogs(jwt, { limit: 50 }).catch(() => []),
        ChantiersClient.listTransferChecklists(jwt).catch(() => []),
        AssetClient.listAssets(jwt).catch(() => []),
      ]);

      setSites(sitesData);
      setAssignments(assignmentsData);
      setHourLogs(hoursData);
      setChecklists(checklistsData);
      setAssets(assetsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des chantiers.';
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
    const activeSitesCount = sites.filter((s) => s.status === 'ACTIVE').length;
    const activeAssignmentsCount = assignments.filter((a) => a.status === 'ACTIVE').length;
    let totalHoursRun = 0;
    hourLogs.forEach((l) => {
      totalHoursRun += Number(l.deltaHoursSinceLast || 0);
    });

    let totalBudget = 0;
    sites.forEach((s) => {
      totalBudget += Number(s.budgetAllocatedDzd || 0);
    });

    return {
      activeSitesCount,
      activeAssignmentsCount,
      totalHoursRun: Math.round(totalHoursRun),
      totalBudget,
      totalSites: sites.length,
    };
  }, [sites, assignments, hourLogs]);

  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return sites;
    const q = searchQuery.toLowerCase();
    return sites.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.clientName && s.clientName.toLowerCase().includes(q)),
    );
  }, [sites, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* EN-TÊTE PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconWrench size={26} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  Chantiers BTP, Carrières & Engins Lourds
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Affectations opérationnelles, suivi horaire anti-dérive (Mode 0 & Mode 2 CAN J1939) et rentabilité directe en DZD.
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
              Chantiers Actifs
            </span>
            <div className="text-2xl font-bold text-[var(--df-text-main)]">{metrics.activeSitesCount}</div>
            <p className="text-xs text-[var(--df-text-muted)]">{metrics.totalSites} sites enregistrés</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Engins Déployés
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.activeAssignmentsCount}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Affectations actives terrain</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Heures Travaillées
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalHoursRun.toLocaleString()} h
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Relevés cumulés (50 derniers)</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
              Budgets Alloués
            </span>
            <div className="text-2xl font-bold text-[var(--df-text-main)]">
              {formatCurrency(metrics.totalBudget)}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Consolidé 58 Wilayas</p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="flex border-b border-[var(--df-border-subtle)] gap-2 overflow-x-auto scrollbar-none max-w-full whitespace-nowrap">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'sites'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Chantiers & Sites ({sites.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'assignments'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Affectations Actives ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'hours'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Heures Moteur & Conso ({hourLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'transfers'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Transferts Inter-Chantiers ({checklists.length})
          </button>
        </div>

        {/* ONGLET CHANTIERS */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <IconSearch size={16} className="absolute left-3 top-3 text-[var(--df-text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher chantier par code, nom ou client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                />
              </div>
            </div>

            {filteredSites.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconWrench size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucun chantier enregistré</p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Déclarez vos zones de terrassement, carrières ou bases logistiques pour suivre les heures moteur et la rentabilité.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] flex flex-col justify-between space-y-4 hover:border-[var(--df-brand-primary)] transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--df-brand-primary)]">
                          {site.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            site.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {site.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-[var(--df-text-main)] line-clamp-1">
                        {site.name}
                      </h3>
                      <p className="text-xs text-[var(--df-text-muted)]">
                        Wilaya {site.wilayaCode.toString().padStart(2, '0')} • Client: {site.clientName || 'Interne'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--df-border-subtle)] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--df-text-muted)]">Engins Actifs</span>
                        <p className="font-bold text-[var(--df-text-main)]">{site.activeAssetsCount || 0}</p>
                      </div>
                      <div>
                        <span className="text-[var(--df-text-muted)]">Budget Alloué</span>
                        <p className="font-bold text-[var(--df-text-main)]">
                          {formatCurrency(Number(site.budgetAllocatedDzd))}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/chantiers/${site.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)] text-[var(--df-text-main)] hover:bg-[var(--df-brand-primary)] hover:text-white hover:border-transparent transition-all"
                      >
                        Bilan de Rentabilité & Engins →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET AFFECTATIONS */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconTruck size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucune affectation active</p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Les engins de chantier ou camions déployés sur site s’afficheront ici avec leur tarif interne.
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
                        <tr key={ass.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--df-text-main)]">
                              {asset ? `${asset.code} — ${asset.name}` : ass.assetCode || ass.assetId.slice(0, 8)}
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
        )}

        {/* ONGLET HEURES MOTEUR */}
        {activeTab === 'hours' && (
          <div className="space-y-4">
            {hourLogs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconActivity size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucun relevé horaire enregistré</p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Les relevés déclaratifs Mode 0 et les télémétries CAN J1939 s’afficheront ici avec le contrôle anti-dérive.
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
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4 text-right">Carburant</th>
                      <th className="py-3 px-4 text-right">Coût Carburant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {hourLogs.map((log) => {
                      const asset = assetMap.get(log.assetId);
                      return (
                        <tr key={log.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
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
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]">
                              {log.source}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {log.fuelConsumedLiters ? `${log.fuelConsumedLiters} L` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {log.fuelCostDzd ? formatCurrency(Number(log.fuelCostDzd)) : '—'}
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

        {/* ONGLET TRANSFERTS */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            {checklists.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconFileText size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucun transfert inter-chantiers</p>
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
                        <tr key={chk.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
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
        )}
      </main>
    </div>
  );
}

