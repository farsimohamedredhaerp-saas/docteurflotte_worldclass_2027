'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconWrench,
  IconTruck,
  IconChevronLeft,
  IconAlertTriangle,
  IconRefreshCw,
  IconActivity,
  IconFileText,
  IconCheck,
  IconPlus,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { ChantiersClient } from '@/lib/api-chantiers';
import { formatCurrency } from '@/lib/currency-formatter';
import type { SiteProfitabilitySummary, SiteWorkspace } from '@docteurflotte/contracts';

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default function SiteDetailPage({ params }: PageProps) {
  const { siteId } = use(params);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteWorkspace | null>(null);
  const [profitability, setProfitability] = useState<SiteProfitabilitySummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSituationModal, setShowSituationModal] = useState(false);
  const [submittingSit, setSubmittingSit] = useState(false);
  const [sitSuccess, setSitSuccess] = useState<string | null>(null);
  const [sitForm, setSitForm] = useState({
    situationNumber: '',
    amountHtDzd: '',
    vatRatePct: '19',
    withholdingTaxRatePct: '5',
    clientName: '',
    clientNif: '',
  });

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
      const [siteData, profData] = await Promise.all([
        ChantiersClient.getSite(siteId, jwt),
        ChantiersClient.getSiteProfitability(siteId, jwt),
      ]);
      setSite(siteData);
      setProfitability(profData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement du chantier.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token, siteId]);

  const handleRecordSituation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !site) return;
    const amountHt = parseFloat(sitForm.amountHtDzd);
    if (isNaN(amountHt) || amountHt <= 0) {
      setErrorMsg('Veuillez saisir un montant HT valide.');
      return;
    }
    const vatRate = parseFloat(sitForm.vatRatePct) || 19;
    const withholdingRate = parseFloat(sitForm.withholdingTaxRatePct) || 0;

    setSubmittingSit(true);
    setErrorMsg(null);
    try {
      const res = await ChantiersClient.recordSiteSituation(
        siteId,
        {
          situationNumber: sitForm.situationNumber.trim() || `SIT-${site.code}-${Date.now().toString().slice(-4)}`,
          amountHtDzd: amountHt,
          vatRatePct: vatRate,
          withholdingTaxRatePct: withholdingRate,
          clientName: sitForm.clientName.trim() || site.clientName || undefined,
          clientNif: sitForm.clientNif.trim() || undefined,
        },
        token
      );
      setSitSuccess(
        `Situation validée avec succès ! N° Document fiscal : ${res.fiscalDocument?.documentNumber || 'Généré'} (TVA 19% collectée : ${formatCurrency(res.fiscalDocument?.vatAmountDzd || 0)}, Retenue RAS ${withholdingRate}% : ${formatCurrency(res.fiscalDocument?.withholdingTaxAmountDzd || 0)})`
      );
      setShowSituationModal(false);
      setSitForm({
        situationNumber: '',
        amountHtDzd: '',
        vatRatePct: '19',
        withholdingTaxRatePct: '5',
        clientName: '',
        clientNif: '',
      });
      await loadData(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'émission de la situation de travaux.";
      setErrorMsg(msg);
    } finally {
      setSubmittingSit(false);
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
              href="/chantiers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--df-brand-primary)] hover:underline mb-2"
            >
              <IconChevronLeft size={14} /> Retour aux Chantiers
            </Link>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconWrench size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  {site ? `${site.code} — ${site.name}` : `Chantier ${siteId.slice(0, 8)}`}
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Wilaya {site ? site.wilayaCode.toString().padStart(2, '0') : ''} • Client : {site?.clientName || 'Interne'} • Durée : {profitability?.durationDays || 0} jours
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowSituationModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--df-brand-primary)] text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <IconPlus size={14} /> Émettre Situation BTPH
            </button>
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

        {/* ALERTE ERREUR */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <IconAlertTriangle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ALERTE SUCCÈS FISCAL */}
        {sitSuccess && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconShieldCheck size={18} className="text-emerald-500 shrink-0" />
              <span>{sitSuccess}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/fiscal/declarations"
                className="text-xs font-semibold underline hover:no-underline text-emerald-700 dark:text-emerald-300"
              >
                Voir G50 consolidée →
              </Link>
              <button onClick={() => setSitSuccess(null)} className="text-xs font-bold hover:opacity-75">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* CARTES FINANCIÈRES DU CHANTIER */}
        {profitability && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
                <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
                  Chiffre d’Affaires / Facturé
                </span>
                <div className="text-xl font-bold text-[var(--df-text-main)]">
                  {formatCurrency(profitability.billedRevenueDzd)}
                </div>
                <p className="text-xs text-[var(--df-text-muted)]">Valorisation contractuelle</p>
              </div>

              <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
                <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Coûts Directs Totaux
                </span>
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(profitability.totalDirectCostDzd)}
                </div>
                <p className="text-xs text-[var(--df-text-muted)]">Engins + Carburant + OTs</p>
              </div>

              <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Marge Brute Dégagée
                </span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(profitability.grossMarginDzd)}
                </div>
                <p className="text-xs text-[var(--df-text-muted)]">Taux de marge : {profitability.grossMarginPct}%</p>
              </div>

              <div className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Refacturation Interne Flotte
                </span>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(profitability.internalAssetBillingDzd)}
                </div>
                <p className="text-xs text-[var(--df-text-muted)]">Tarifs journaliers d’actifs</p>
              </div>
            </div>

            {/* DÉCOMPOSITION DES COÛTS */}
            <div className="p-6 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-4">
              <h3 className="text-base font-bold text-[var(--df-text-main)]">
                Décomposition des Coûts Directs du Chantier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                  <span className="text-xs text-[var(--df-text-muted)]">Carburant Chantier</span>
                  <div className="text-lg font-bold text-[var(--df-text-main)] mt-1">
                    {formatCurrency(profitability.fuelCostDzd)}
                  </div>
                  <span className="text-xs text-[var(--df-text-muted)]">Heures moteur enregistrées</span>
                </div>

                <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                  <span className="text-xs text-[var(--df-text-muted)]">Maintenance & Réparations (OT)</span>
                  <div className="text-lg font-bold text-[var(--df-text-main)] mt-1">
                    {formatCurrency(profitability.maintenanceCostDzd)}
                  </div>
                  <span className="text-xs text-[var(--df-text-muted)]">Imputées aux engins du site</span>
                </div>

                <div className="p-4 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)]">
                  <span className="text-xs text-[var(--df-text-muted)]">Engins Affectés</span>
                  <div className="text-lg font-bold text-[var(--df-text-main)] mt-1">
                    {profitability.assignedAssetsSummary.length} engin(s)
                  </div>
                  <span className="text-xs text-[var(--df-text-muted)]">Engins ayant travaillé sur le site</span>
                </div>
              </div>
            </div>

            {/* TABLEAU DES ENGINS AFFECTÉS */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--df-text-main)]">
                Bilan d’Activité par Engin sur ce Chantier
              </h3>

              {profitability.assignedAssetsSummary.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[var(--df-border-subtle)] rounded-2xl text-[var(--df-text-muted)] text-sm">
                  Aucun engin n’a encore enregistré d’heures ou de consommation sur ce chantier.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                      <tr>
                        <th className="py-3 px-4">Engin</th>
                        <th className="py-3 px-4 text-right">Heures Tournées</th>
                        <th className="py-3 px-4 text-right">Litres Gazole</th>
                        <th className="py-3 px-4 text-right">Coût Carburant DZD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--df-border-subtle)]">
                      {profitability.assignedAssetsSummary.map((item) => (
                        <tr key={item.assetId} className="hover:bg-[var(--df-bg-surface)] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">
                            <div className="flex items-center gap-2">
                              <IconTruck size={14} className="text-[var(--df-text-muted)]" />
                              <span>{item.assetCode}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--df-text-main)]">
                            {item.hoursRun} h
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {item.fuelLiters} L
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[var(--df-brand-primary)]">
                            {formatCurrency(item.costDzd)}
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

        {/* MODAL ÉMISSION SITUATION BTPH */}
        {showSituationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
                <div className="flex items-center gap-2 text-[var(--df-text-main)]">
                  <IconFileText size={20} className="text-[var(--df-brand-primary)]" />
                  <h3 className="font-bold text-base">Émettre une Situation de Travaux (Attachement)</h3>
                </div>
                <button
                  onClick={() => setShowSituationModal(false)}
                  className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <IconShieldCheck size={14} /> Traçabilité Fiscale Souveraine (Art. 21/30 TCA)
                </div>
                <p>
                  Génère automatiquement une pièce fiscale <code className="font-mono font-bold">SITUATION_TRAVAUX</code>,
                  comptabilise la TVA collectée (compte SCF 445700) et la Retenue de Garantie RAS (compte SCF 411700),
                  puis incrémente le CA facturé du chantier.
                </p>
              </div>

              <form onSubmit={handleRecordSituation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--df-text-muted)] mb-1">
                    N° Situation / Attachement
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`SIT-${site?.code || 'SITE'}-01`}
                    value={sitForm.situationNumber}
                    onChange={(e) => setSitForm({ ...sitForm, situationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-[var(--df-text-muted)] mb-1">
                      Montant Travaux HT (DZD)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      placeholder="Ex: 4500000"
                      value={sitForm.amountHtDzd}
                      onChange={(e) => setSitForm({ ...sitForm, amountHtDzd: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--df-text-muted)] mb-1">
                      Taux TVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={sitForm.vatRatePct}
                      onChange={(e) => setSitForm({ ...sitForm, vatRatePct: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--df-text-muted)] mb-1">
                      Retenue RAS (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={sitForm.withholdingTaxRatePct}
                      onChange={(e) => setSitForm({ ...sitForm, withholdingTaxRatePct: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[var(--df-text-muted)] mb-1">
                      Client / Maître d’Ouvrage
                    </label>
                    <input
                      type="text"
                      placeholder={site?.clientName || 'Nom du client'}
                      value={sitForm.clientName}
                      onChange={(e) => setSitForm({ ...sitForm, clientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--df-text-muted)] mb-1">
                      NIF Client
                    </label>
                    <input
                      type="text"
                      placeholder="000123456789012"
                      value={sitForm.clientNif}
                      onChange={(e) => setSitForm({ ...sitForm, clientNif: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--df-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setShowSituationModal(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:bg-[var(--df-bg-base)] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-[var(--df-brand-primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {submittingSit ? (
                      <>
                        <IconRefreshCw size={14} className="animate-spin" />
                        <span>Validation fiscale...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck size={14} />
                        <span>Enregistrer & Générer Fiscalité</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

