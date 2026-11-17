'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconFileText,
  IconLock,
  IconCheck,
  IconRefreshCw,
  IconTruck,
  IconSearch,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { FiscalClient } from '@/lib/api-fiscal';
import { AssetClient } from '@/lib/api-assets';
import { formatCurrency } from '@/lib/currency-formatter';
import type {
  TenantFiscalProfile,
  TenantCnrcActivity,
  FiscalDocument,
  FiscalDeclarationDraft,
  FiscalAuditSeal,
  Asset,
} from '@docteurflotte/contracts';

export default function FiscalCompliancePage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TenantFiscalProfile | null>(null);
  const [cnrcActivities, setCnrcActivities] = useState<TenantCnrcActivity[]>([]);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [draft, setDraft] = useState<FiscalDeclarationDraft | null>(null);
  const [seals, setSeals] = useState<FiscalAuditSeal[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'profile' | 'seals'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAddingCnrc, setIsAddingCnrc] = useState(false);
  const [newCnrcCode, setNewCnrcCode] = useState('');
  const [newCnrcLabel, setNewCnrcLabel] = useState('');
  const [newFiscalSegment, setNewFiscalSegment] = useState<'PRODUCTION' | 'BTPH_TOURISME' | 'COMMERCE_SERVICES'>('COMMERCE_SERVICES');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    const session = AuthClient.getSession();
    if (session?.token) {
      setToken(session.token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadAllData = async (jwt: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [profData, cnrcData, docsData, assetsData, draftData, sealsData] = await Promise.all([
        FiscalClient.getProfile(jwt).catch(() => null),
        FiscalClient.getCnrcActivities(jwt).catch(() => []),
        FiscalClient.listDocuments(jwt).catch(() => []),
        AssetClient.listAssets(jwt).catch(() => []),
        FiscalClient.getDeclarationDraft(currentYear, currentMonth, jwt).catch(() => null),
        FiscalClient.listSeals(jwt).catch(() => []),
      ]);

      setProfile(profData);
      setCnrcActivities(cnrcData);
      setDocuments(docsData);
      setAssets(assetsData);
      setDraft(draftData);
      setSeals(sealsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des données fiscales.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllData(token);
    }
  }, [token]);

  const metrics = useMemo(() => {
    let totalDzd = 0;
    let tvaDeductibleDzd = 0;
    let tvaExcludedDzd = 0;
    let tvaCollecteeDzd = 0;
    const missingPiecesCount = draft?.missingReceiptsCount || 0;

    documents.forEach((doc) => {
      const isSales =
        doc.documentType === 'CONTRAT_LOCATION' ||
        doc.documentType === 'FACTURE_CLIENT' ||
        doc.documentType === 'SITUATION_TRAVAUX';

      if (isSales) {
        tvaCollecteeDzd += Number(doc.vatAmountDzd || 0);
      } else {
        totalDzd += Number(doc.totalTtcDzd || 0);
        if (doc.isVatDeductible) {
          tvaDeductibleDzd += Number(doc.vatAmountDzd || 0);
        } else {
          tvaExcludedDzd += Number(doc.vatAmountDzd || 0);
        }
      }
    });

    return {
      totalDzd,
      tvaDeductibleDzd,
      tvaExcludedDzd,
      tvaCollecteeDzd,
      missingPiecesCount,
      totalCount: documents.length,
    };
  }, [documents, draft]);

  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((doc) => {
      const asset = doc.assetId ? assetMap.get(doc.assetId) : null;
      return (
        doc.documentNumber.toLowerCase().includes(q) ||
        doc.documentType.toLowerCase().includes(q) ||
        (asset?.name && asset.name.toLowerCase().includes(q)) ||
        (asset?.code && asset.code.toLowerCase().includes(q))
      );
    });
  }, [documents, searchQuery, assetMap]);

  const handleAddCnrc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCnrcCode.trim() || !newCnrcLabel.trim()) return;
    try {
      const created = await FiscalClient.createCnrcActivity(
        {
          cnrcCode: newCnrcCode.trim(),
          activityLabel: newCnrcLabel.trim(),
          fiscalSegment: newFiscalSegment,
          isPrimary: cnrcActivities.length === 0,
        },
        token,
      );
      setCnrcActivities((prev) => [...prev, created]);
      setNewCnrcCode('');
      setNewCnrcLabel('');
      setIsAddingCnrc(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l\'ajout de l\'activité CNRC';
      setErrorMsg(msg);
    }
  };

  const handleDeleteCnrc = async (id: string) => {
    if (!token) return;
    try {
      await FiscalClient.deleteCnrcActivity(id, token);
      setCnrcActivities((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Ignorer silencieusement
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* EN-TÊTE PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconShieldCheck size={26} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  Conformité Fiscale & Registre G50 (Algérie)
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Qualification déterministe Loi de Finances, CIDTA & Code TCA. Zéro taux codé en dur. Scellements immuables SHA-256.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/fiscal/declarations"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--df-brand-primary)] text-white hover:opacity-90 shadow-sm transition-all"
            >
              <IconFileText size={16} />
              <span>Brouillon G50 & Scellement</span>
            </Link>
            <button
              onClick={() => token && loadAllData(token)}
              disabled={loading}
              className="p-2 rounded-lg border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface-elevated)] transition-all"
              title="Rafraîchir"
            >
              <IconRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* MESSAGES D'ALERTE */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <IconAlertTriangle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ALERTE PROFIL FISCAL NON CONFIGURÉ */}
        {!loading && !profile && (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <IconAlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">Profil fiscal non configuré (Mode Lecture Seule)</p>
                <p className="text-xs opacity-90 mt-1">
                  Veuillez renseigner votre NIF, NIS, RC et régime fiscal pour activer l’ingestion et le scellement opposable des déclarations G50.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all shrink-0"
            >
              Configurer le NIF
            </button>
          </div>
        )}

        {/* CARTES DE MÉTRIQUES SYNTHÉTIQUES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-2">
            <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
              Total Dépenses & Charges
            </span>
            <div className="text-2xl font-bold text-[var(--df-text-main)]">
              {formatCurrency(metrics.totalDzd)}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">{metrics.totalCount} pièces enregistrées</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-2">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              TVA Collectée (Facturations)
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(metrics.tvaCollecteeDzd)}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Compte SCF 445700 • Travaux & Locations</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-2">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              TVA Déductible (Art. 30 TCA)
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.tvaDeductibleDzd)}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Compte SCF 445600 • Poids Lourds & Utilitaires</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-2">
            <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
              Pièces Manquantes
            </span>
            <div className={`text-2xl font-bold ${metrics.missingPiecesCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {metrics.missingPiecesCount}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Bloque le scellement officiel de la liasse</p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="flex border-b border-[var(--df-border-subtle)] gap-2 overflow-x-auto scrollbar-none max-w-full whitespace-nowrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === 'overview'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
              }`}
          >
            Vue d’Ensemble & Échéances
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === 'documents'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
              }`}
          >
            Pièces Comptables par Actif ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === 'profile'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
              }`}
          >
            Profil Fiscal & NIF
          </button>
          <button
            onClick={() => setActiveTab('seals')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === 'seals'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
              }`}
          >
            Journal des Scellés SHA-256 ({seals.length})
          </button>
        </div>

        {/* CONTENU ONGLETS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--df-text-main)]">
                    Déclaration G50 — Période {currentMonth.toString().padStart(2, '0')}/{currentYear}
                  </h2>
                  <p className="text-xs text-[var(--df-text-muted)]">
                    Échéance légale DGI : le 20 du mois M+1. Calculs déterminés par le moteur fiscal souverain.
                  </p>
                </div>
                {draft?.status === 'SEALED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <IconLock size={12} />
                    Scellé & Immuable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    Brouillon Ouvert
                  </span>
                )}
              </div>

              {draft && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--df-border-subtle)]">
                  <div>
                    <span className="text-xs text-[var(--df-text-muted)]">TVA Déductible Validée</span>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(draft.totalVatDeductibleDzd)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--df-text-muted)]">Pièces Manquantes</span>
                    <p className={`text-lg font-bold ${draft.missingReceiptsCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {draft.missingReceiptsCount} pièce(s)
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--df-text-muted)]">Actifs Concernés</span>
                    <p className="text-lg font-bold text-[var(--df-text-main)]">
                      {draft.breakdownByAsset ? Object.keys(draft.breakdownByAsset).length : 0} actif(s)
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/fiscal/declarations"
                  className="text-xs font-semibold text-[var(--df-brand-primary)] hover:underline inline-flex items-center gap-1"
                >
                  Ouvrir la ventilation détaillée par actif et sceller la liasse →
                </Link>
              </div>
            </div>

            {/* AVERTISSEMENTS RÉGLEMENTAIRES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--df-text-main)]">
                  <IconShieldCheck size={16} className="text-blue-500" />
                  <span>Règle d’Exclusion Art. 30 Code TCA</span>
                </div>
                <p className="text-xs text-[var(--df-text-muted)] leading-relaxed">
                  Conformément à l’Art. 30 du Code des Taxes sur le Chiffre d’Affaires algérien, la TVA grevant les dépenses des véhicules de tourisme (catégorie <code>ROAD_VEHICLE</code>) n’ouvre pas droit à déduction. Le moteur qualifie automatiquement ces montants en charge déductible brute sans TVA récupérable.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--df-text-main)]">
                  <IconShieldCheck size={16} className="text-purple-500" />
                  <span>Régularisation Quinquennale (Biens Amortissables)</span>
                </div>
                <p className="text-xs text-[var(--df-text-muted)] leading-relaxed">
                  En vertu du Code TCA algérien, toute cession ou sortie d’actif immobilisé avant l’expiration du délai quinquennal (5 ans) entraîne le reversement d’une fraction de la TVA initialement déduite au prorata des années restantes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <IconSearch size={16} className="absolute left-3 top-3 text-[var(--df-text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, actif ou type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                />
              </div>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconFileText size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">Aucune pièce fiscale trouvée</p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Les factures de carburant Naftal, ordres de réparation et primes d’assurance rattachés à un actif apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">Date & Réf</th>
                      <th className="py-3 px-4">Actif Lié</th>
                      <th className="py-3 px-4">Type Pièce</th>
                      <th className="py-3 px-4 text-right">Montant HT</th>
                      <th className="py-3 px-4 text-right">TVA</th>
                      <th className="py-3 px-4">Statut TVA</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {filteredDocuments.map((doc) => {
                      const asset = doc.assetId ? assetMap.get(doc.assetId) : null;
                      return (
                        <tr key={doc.id} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--df-text-main)]">{doc.documentNumber}</div>
                            <div className="text-xs text-[var(--df-text-muted)]">{doc.documentDate}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <IconTruck size={14} className="text-[var(--df-text-muted)]" />
                              <span className="font-medium text-[var(--df-text-main)]">
                                {asset ? `${asset.code} — ${asset.name}` : (doc.assetId ? doc.assetId.slice(0, 8) : 'Général')}
                              </span>
                            </div>
                            <span className="text-xs text-[var(--df-text-muted)]">
                              {asset?.category || 'Non renseigné'}
                            </span>
                          </td>
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
                            {doc.assetId ? (
                              <Link
                                href={`/fiscal/assets/${doc.assetId}`}
                                className="text-xs font-semibold text-[var(--df-brand-primary)] hover:underline"
                              >
                                Fiche Fiscale →
                              </Link>
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

        {/* ONGLET PROFIL FISCAL */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl space-y-6">
            <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-6">
              <h2 className="text-lg font-bold text-[var(--df-text-main)]">
                Profil Fiscal du Contribuable (Conformité DGI Algérie &amp; Multi-Régimes)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Raison Sociale</span>
                  <p className="font-bold text-base text-[var(--df-text-main)]">
                    {profile?.legalName || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Forme Juridique</span>
                  <p className="font-bold text-base text-[var(--df-text-main)]">
                    {profile?.legalForm || 'SARL'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Impôt sur les Bénéfices</span>
                  <p className="font-bold text-base text-[var(--df-brand-primary)]">
                    {profile?.profitTaxType || 'IBS (19% / 23% / 26%)'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">NIF (15 à 20 chiffres)</span>
                  <p className="font-mono font-bold text-base text-[var(--df-text-main)]">
                    {profile?.nif || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">NIS (Statistique)</span>
                  <p className="font-mono font-bold text-base text-[var(--df-text-main)]">
                    {profile?.nis || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Registre du Commerce (RC)</span>
                  <p className="font-mono font-bold text-base text-[var(--df-text-main)]">
                    {profile?.rcNumber || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Article d’Imposition (AI)</span>
                  <p className="font-mono font-bold text-base text-[var(--df-text-main)]">
                    {profile?.articleImposition || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Régime Fiscal</span>
                  <p className="font-bold text-[var(--df-text-main)]">
                    {profile?.taxRegime || 'RÉEL NORMAL'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Prorata de Déduction TVA</span>
                  <p className="font-bold text-[var(--df-text-main)]">
                    {profile?.vatProrataPct ?? 100}% (Art. 38 TCA)
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Agrément AAPI / ANDI</span>
                  <p className="font-bold text-[var(--df-text-main)]">
                    {profile?.aapiExemptionActive ? 'Oui (Franchise F20/F21)' : 'Non (Régime Droit Commun)'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--df-text-muted)]">Wilaya &amp; CDI de rattachement</span>
                  <p className="font-bold text-[var(--df-text-main)]">
                    Wilaya {profile?.wilayaCode ? profile.wilayaCode.toString().padStart(2, '0') : '16 (Alger)'} — CDI
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION ACTIVITÉS CNRC & VENTILATION MULTI-ACTIVITÉS */}
            <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--df-text-main)]">
                    Activités Économiques CNRC &amp; Ventilation Fiscale (Art. 150 CIDTA)
                  </h3>
                  <p className="text-xs text-[var(--df-text-muted)]">
                    Ventilation du chiffre d’affaires et du résultat fiscal selon les segments (Production 19%, BTPH 23%, Services 26%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCnrc(!isAddingCnrc)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--df-brand-primary)] text-white hover:opacity-90 transition-all shrink-0"
                >
                  {isAddingCnrc ? 'Annuler' : '+ Ajouter Activité CNRC'}
                </button>
              </div>

              {isAddingCnrc && (
                <form onSubmit={handleAddCnrc} className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--df-text-muted)] mb-1">
                        Code CNRC (ex: 406101)
                      </label>
                      <input
                        type="text"
                        value={newCnrcCode}
                        onChange={(e) => setNewCnrcCode(e.target.value)}
                        placeholder="Ex: 406101"
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] text-[var(--df-text-main)] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--df-text-muted)] mb-1">
                        Libellé de l’Activité
                      </label>
                      <input
                        type="text"
                        value={newCnrcLabel}
                        onChange={(e) => setNewCnrcLabel(e.target.value)}
                        placeholder="Ex: Transport public routier de marchandises"
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] text-[var(--df-text-main)] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--df-text-muted)] mb-1">
                        Segment Fiscal IBS
                      </label>
                      <select
                        value={newFiscalSegment}
                        onChange={(e) => setNewFiscalSegment(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] text-[var(--df-text-main)] focus:outline-hidden"
                      >
                        <option value="PRODUCTION">Production de biens (IBS 19%)</option>
                        <option value="BTPH_TOURISME">BTPH, Travaux Publics &amp; Tourisme (IBS 23%)</option>
                        <option value="COMMERCE_SERVICES">Commerce, Services &amp; Transport (IBS 26%)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--df-brand-primary)] text-white hover:opacity-90 transition-all"
                    >
                      Enregistrer Activité
                    </button>
                  </div>
                </form>
              )}

              {cnrcActivities.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[var(--df-border-subtle)] text-center text-xs text-[var(--df-text-muted)]">
                  Aucune activité CNRC déclarée. Ajoutez vos codes pour ventiler automatiquement le chiffre d’affaires.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--df-border-subtle)] text-[var(--df-text-muted)]">
                        <th className="py-2 px-3">Code CNRC</th>
                        <th className="py-2 px-3">Libellé d’Activité</th>
                        <th className="py-2 px-3">Segment Fiscal (IBS)</th>
                        <th className="py-2 px-3 text-center">Taxe Locale Solidarité (TLS)</th>
                        <th className="py-2 px-3 text-center">Rôle</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--df-border-subtle)]">
                      {cnrcActivities.map((act) => (
                        <tr key={act.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-[var(--df-text-main)]">{act.cnrcCode}</td>
                          <td className="py-2.5 px-3 font-medium text-[var(--df-text-main)]">{act.activityLabel}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {act.fiscalSegment === 'PRODUCTION'
                                ? 'Production (19%)'
                                : act.fiscalSegment === 'BTPH_TOURISME'
                                  ? 'BTPH (23%)'
                                  : 'Commerce / Services (26%)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {act.isSubjectToTls ? (
                              <span className="text-[10px] font-bold text-amber-600">Assujetti TLS</span>
                            ) : (
                              <span className="text-[10px] text-[var(--df-text-muted)]">Non (Exonéré)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {act.isPrimary ? (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                                Principale
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--df-text-muted)]">Secondaire</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteCnrc(act.id)}
                              className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET SCELLES SHA-256 */}
        {activeTab === 'seals' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--df-text-main)]">
              Journal des Scellés Cryptographiques Immuables
            </h2>
            <p className="text-xs text-[var(--df-text-muted)]">
              Toutes les déclarations scellées génèrent une empreinte SHA-256 et une Merkle leaf rendant le dossier opposable en cas de contrôle fiscal DGI.
            </p>

            {seals.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[var(--df-border-subtle)] rounded-2xl text-[var(--df-text-muted)] text-sm">
                Aucun scellé fiscal n’a encore été généré.
              </div>
            ) : (
              <div className="space-y-3">
                {seals.map((seal) => (
                  <div
                    key={seal.id}
                    className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <IconLock size={14} className="text-emerald-500" />
                        <span className="font-bold text-[var(--df-text-main)]">Déclaration G50</span>
                        <span className="text-xs font-mono text-[var(--df-text-muted)]">ID: {seal.declarationId}</span>
                      </div>
                      <div className="text-xs font-mono text-[var(--df-text-muted)] mt-1 break-all">
                        SHA-256: {seal.sha256Hash}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-[var(--df-text-muted)]">Scellé le {new Date(seal.sealedAt).toLocaleString('fr-DZ')}</span>
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
