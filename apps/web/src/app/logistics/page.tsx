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
  IconActivity,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { LogisticsClient } from '@/lib/api-logistics';
import { AssetClient } from '@/lib/api-assets';
import { formatCurrency } from '@/lib/currency-formatter';
import type {
  ConsignmentNote,
  DeliveryDispute,
  OtifMetrics,
  Asset,
} from '@docteurflotte/contracts';

export default function LogisticsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lves, setLves] = useState<ConsignmentNote[]>([]);
  const [disputes, setDisputes] = useState<DeliveryDispute[]>([]);
  const [otif, setOtif] = useState<OtifMetrics | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<'lve' | 'disputes' | 'otif'>('lve');
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
      const [lveData, dispData, otifData, assetsData] = await Promise.all([
        LogisticsClient.listLve(jwt).catch(() => []),
        LogisticsClient.listDisputes(jwt).catch(() => []),
        LogisticsClient.getOtifMetrics(jwt).catch(() => null),
        AssetClient.listAssets(jwt).catch(() => []),
      ]);

      setLves(lveData);
      setDisputes(dispData);
      setOtif(otifData);
      setAssets(assetsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement logistique.';
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

  const metrics = useMemo(() => {
    const inTransitCount = lves.filter((l) => l.status === 'IN_TRANSIT').length;
    const blockedBillingCount = disputes.filter((d) => d.isBillingBlocked).length;
    return {
      inTransitCount,
      totalLves: lves.length,
      blockedBillingCount,
      otifRate: otif?.otifRatePct || 100,
      firstPassRate: otif?.firstPassDeliveryRatePct || 100,
    };
  }, [lves, disputes, otif]);

  const filteredLves = useMemo(() => {
    if (!searchQuery.trim()) return lves;
    const q = searchQuery.toLowerCase();
    return lves.filter((l) => {
      const asset = assetMap.get(l.assetId);
      return (
        l.lveNumber.toLowerCase().includes(q) ||
        l.consigneeName.toLowerCase().includes(q) ||
        l.shipperName.toLowerCase().includes(q) ||
        (asset?.code && asset.code.toLowerCase().includes(q))
      );
    });
  }, [lves, searchQuery, assetMap]);

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
                  Logistique, LVE (Décret 03-223) & Preuves de Livraison (POD)
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Lettres de voiture numériques, jetons QR HMAC-256 souverains et score d’excellence OTIF.
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
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Score OTIF Flotte
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.otifRate}%
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">On-Time & In-Full (Conformité)</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              1er Passage Réussi
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.firstPassRate}%
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Sans tentative réitérée</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
              LVEs en Transit
            </span>
            <div className="text-2xl font-bold text-[var(--df-text-main)]">{metrics.inTransitCount}</div>
            <p className="text-xs text-[var(--df-text-muted)]">{metrics.totalLves} expéditions au total</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Facturation Bloquée (Litiges)
            </span>
            <div className={`text-2xl font-bold ${metrics.blockedBillingCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {metrics.blockedBillingCount}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Blocage strict anti-erreur comptable</p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="flex border-b border-[var(--df-border-subtle)] gap-2">
          <button
            onClick={() => setActiveTab('lve')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'lve'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Lettres de Voiture Électroniques ({lves.length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'disputes'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Litiges & Avaries ({disputes.length})
          </button>
          <button
            onClick={() => setActiveTab('otif')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'otif'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Excellence OTIF
          </button>
        </div>

        {/* ONGLET LVE */}
        {activeTab === 'lve' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <IconSearch size={16} className="absolute left-3 top-3 text-[var(--df-text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher par LVE, expéditeur, destinataire ou actif..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                />
              </div>
            </div>

            {filteredLves.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconFileText size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucune Lettre de Voiture Électronique</p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Émettez des LVE conformes au Décret 03-223 avec jetons HMAC pour les contrôles sur les corridors des 58 Wilayas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">N° LVE</th>
                      <th className="py-3 px-4">Véhicule / Actif</th>
                      <th className="py-3 px-4">Trajet (Wilayas)</th>
                      <th className="py-3 px-4">Destinataire</th>
                      <th className="py-3 px-4 text-center">Colis / Poids</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-center">Contrôle QR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {filteredLves.map((lve) => {
                      const asset = assetMap.get(lve.assetId);
                      return (
                        <tr key={lve.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--df-brand-primary)]">
                            {lve.lveNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--df-text-main)]">
                              {asset ? `${asset.code} — ${asset.name}` : lve.assetCode || lve.assetId.slice(0, 8)}
                            </div>
                            <span className="text-xs text-[var(--df-text-muted)]">
                              Chauffeur: {lve.driverName || 'Non assigné'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--df-text-main)]">
                            W{lve.shipperWilayaCode.toString().padStart(2, '0')} ({lve.shipperName}) → W{lve.consigneeWilayaCode.toString().padStart(2, '0')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[var(--df-text-main)]">{lve.consigneeName}</div>
                            <span className="text-xs text-[var(--df-text-muted)]">{lve.consigneePhoneDz}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-[var(--df-text-main)]">
                            {lve.packagesCount} colis • {lve.totalWeightKg} kg
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-500/10 text-[var(--df-text-main)]">
                              {lve.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/logistics/${lve.id}`}
                              className="text-xs font-semibold text-[var(--df-brand-primary)] hover:underline inline-flex items-center gap-1"
                            >
                              <IconLock size={12} /> Voir LVE →
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

        {/* ONGLET LITIGES */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconShieldCheck size={36} className="mx-auto text-emerald-500 opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucun litige de livraison</p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Toutes les livraisons sont réceptionnées sans avarie ni manquant.
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
                        <span className="font-mono font-bold text-[var(--df-text-main)]">{disp.disputeNumber}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-600">
                          {disp.disputeType}
                        </span>
                        {disp.isBillingBlocked && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            FACTURATION CLIENT BLOQUÉE
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[var(--df-text-muted)]">Statut : {disp.status}</span>
                    </div>

                    <p className="text-sm text-[var(--df-text-main)]">{disp.description}</p>

                    <div className="pt-2 border-t border-[var(--df-border-subtle)] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[var(--df-text-muted)]">Montant du Préjudice Évalué</span>
                        <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                          {formatCurrency(Number(disp.estimatedClaimAmountDzd))}
                        </p>
                      </div>
                      {disp.status === 'OPEN' && (
                        <button
                          onClick={async () => {
                            if (!token) return;
                            await LogisticsClient.settleDispute(disp.id, token);
                            loadData(token);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                        >
                          Régler le Litige & Débloquer Facturation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET OTIF */}
        {activeTab === 'otif' && otif && (
          <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--df-text-main)]">
                Bilan de Ponctualité & Conformité Logistique (OTIF)
              </h2>
              <p className="text-xs text-[var(--df-text-muted)]">
                Indicateurs normés pour mesurer la satisfaction client et la fiabilité des expéditions sur le territoire algérien.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
              <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                <span className="text-xs text-[var(--df-text-muted)]">Taux OTIF Global</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {otif.otifRatePct}%
                </div>
                <p className="text-xs text-[var(--df-text-muted)] mt-1">Livrées à l’heure et intégrales</p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                <span className="text-xs text-[var(--df-text-muted)]">Livraisons 1er Passage</span>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {otif.firstPassDeliveryRatePct}%
                </div>
                <p className="text-xs text-[var(--df-text-muted)] mt-1">Sans retour ni re-livraison</p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                <span className="text-xs text-[var(--df-text-muted)]">Coût Moyen / Livraison</span>
                <div className="text-2xl font-bold text-[var(--df-text-main)] mt-1">
                  {formatCurrency(otif.averageCostPerDeliveryDzd)}
                </div>
                <p className="text-xs text-[var(--df-text-muted)] mt-1">Carburant, chauffeur et amortissement</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

