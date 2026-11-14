'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/navigation/Navbar';
import { AuthClient } from '../../../lib/api-auth';
import { SubscriptionsClient } from '../../../lib/api-subscriptions';
import {
  SubscriptionPlan,
  TenantSubscription,
  SubscriptionInvoice,
  ClientQuoteRequestDto,
  SubscriptionBillingModel,
  SubscriptionPaymentMethod,
} from '@docteurflotte/contracts';
import {
  IconCreditCard,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
} from '../../../components/navigation/TechIcons';

export default function ClientSubscriptionPage() {
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [publicPlans, setPublicPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Modal devis
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState<ClientQuoteRequestDto>({
    desiredVehicleCount: 20,
    preferredBillingModel: 'ANNUAL_INVOICE',
    preferredPaymentMethod: 'VIREMENT_BANCAIRE',
    contactName: '',
    contactPhone: '',
    notes: '',
  });

  const session = useMemo(() => AuthClient.getSession(), []);
  const token = session.token || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sub, plans, invs] = await Promise.all([
          SubscriptionsClient.getCurrentSubscription(token),
          SubscriptionsClient.getPublicPlans(),
          SubscriptionsClient.getTenantInvoices(token),
        ]);
        setSubscription(sub);
        setPublicPlans(plans);
        setInvoices(invs);
      } catch (err) {
        console.error('Erreur de chargement des abonnements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleOpenQuoteModal = (targetPlan?: SubscriptionPlan) => {
    setQuoteForm({
      targetPlanId: targetPlan?.id,
      desiredVehicleCount: subscription?.allocatedVehiclesLimit || 20,
      preferredBillingModel: targetPlan?.billingModel || 'ANNUAL_INVOICE',
      preferredPaymentMethod: subscription?.paymentMethod || 'VIREMENT_BANCAIRE',
      contactName: session.user ? `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() : '',
      contactPhone: '',
      notes: targetPlan ? `Intéressé par la formule ${targetPlan.name}` : '',
    });
    setIsQuoteModalOpen(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError(null);
    try {
      const res = await SubscriptionsClient.submitQuoteRequest(token, quoteForm);
      setQuoteSuccess(res.message);
      setIsQuoteModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setQuoteError(msg);
    }
  };

  const getBillingModelLabel = (model?: SubscriptionBillingModel) => {
    switch (model) {
      case 'ANNUAL_INVOICE':
        return 'Facturation Annuelle B2B (1 fois / an avec TVA 19%)';
      case 'PAY_PER_ACTIVE_ASSET':
        return 'Flotte Dynamique — À l Actif Roulant (0 DA pour véhicule au garage)';
      case 'CAPEX_TMA':
        return 'Licence CapEx + Contrat Annuel de Maintenance TMA';
      case 'AUDIT_TRIAL':
        return 'Pack Choc Audit Anti-Fraude 90 Jours';
      default:
        return 'Mensuel Flexible';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        {/* FIL D'ARIANE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--df-text-muted)', marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--df-text-muted)', textDecoration: 'none' }}>
            Accueil
          </Link>
          <span>/</span>
          <Link href="/settings" style={{ color: 'var(--df-text-muted)', textDecoration: 'none' }}>
            Paramètres
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--df-text-main)', fontWeight: 600 }}>Abonnement & Facturation DGI</span>
        </div>

        {/* ENTÊTE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <IconCreditCard size={20} />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                Mon Abonnement & Facturation Flotte
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#86efac',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                {subscription?.status || 'ACTIF'}
              </span>
            </div>
            <p style={{ color: 'var(--df-text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Tarification en Dinars Algériens (DZD), conformité fiscale DGI (NIF/NIS/TVA 19%) et décompte équitable de vos actifs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenQuoteModal()}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconFileText size={14} />
            Demander un Devis d'Ajustement
          </button>
        </div>

        {quoteSuccess && (
          <div style={{ padding: '0.85rem 1.15rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#86efac', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconCheck size={14} className="text-emerald-400" />
            <span>{quoteSuccess}</span>
          </div>
        )}

        {/* 1. CARTE RÉCAPITULATIVE DE L'ABONNEMENT ACTIF */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Colonne 1 : Plan & Formule */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Formule Souscrite
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#60a5fa' }}>
                {subscription?.planName || 'Mode 1 — GPS & Télémétrie 58 Wilayas'}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', marginBottom: '0.75rem' }}>
                {getBillingModelLabel(subscription?.billingModel)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                Règlement : <strong>{subscription?.paymentMethod || 'Virement Bancaire'}</strong> ({subscription?.paymentTerms || 'Annuel Avance'})
              </div>
            </div>

            {/* Colonne 2 : Tarifs & Montants DZD */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Tarif Unitaire Net Négocié
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--df-text-main)' }} className="df-mono">
                  {subscription?.effectivePricePerAssetDzd.toLocaleString('fr-DZ')} DA
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)' }}>
                  / véhicule {subscription?.billingModel === 'ANNUAL_INVOICE' ? '/ an' : '/ mois'}
                </span>
              </div>
              {subscription && subscription.discountPercent > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                  Remise commerciale partenaire : -{subscription.discountPercent}%
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginTop: '0.4rem' }}>
                Prochaine échéance :{' '}
                <strong style={{ color: 'var(--df-text-main)' }}>
                  {subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString('fr-DZ') : 'Annuelle'}
                </strong>
              </div>
            </div>

            {/* Colonne 3 : Décompte Équitable Flotte Roulante */}
            <div
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '10px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Décompte Équitable des Actifs
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)' }}>Véhicules en Circulation :</span>
                <span style={{ fontWeight: 800, color: '#34d399' }} className="df-mono">
                  {subscription?.activeVehiclesCount || 0} facturés
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)' }}>Véhicules au Garage / Révision :</span>
                <span style={{ fontWeight: 800, color: '#38bdf8' }} className="df-mono">
                  {subscription?.idleVehiclesCount || 0} camions à 0 DA
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--df-text-muted)', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '0.4rem' }}>
                Note de doctrine : en Algérie, un camion en panne ne doit pas peser sur votre trésorerie. Seuls vos camions roulants sont décomptés.
              </div>
            </div>
          </div>
        </div>

        {/* 2. FACTURES DGI & PROFORMAS */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Factures Proformas & Reçus Fiscaux DGI
              </h3>
              <p style={{ color: 'var(--df-text-muted)', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                Factures acquittées avec TVA 19% déductible, NIF, NIS, RC et Article d'Imposition pour votre expert-comptable.
              </p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--df-text-muted)', fontSize: '0.85rem' }}>
              Aucun document fiscal émis pour le moment. Votre prochaine facture proforma sera générée avant l'échéance de renouvellement.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>N° Document</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Période Couverte</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Véhicules</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Montant HT</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TVA (19%)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Total TTC (DZD)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }} className="df-mono">
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--df-bg-surface-2)' }}>
                          {inv.invoiceType}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--df-text-muted)' }}>
                        {inv.periodStart} au {inv.periodEnd}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.totalVehiclesBilled}</td>
                      <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.subtotalHtDzd.toLocaleString('fr-DZ')} DA</td>
                      <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.tvaAmountDzd.toLocaleString('fr-DZ')} DA</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#38bdf8' }} className="df-mono">
                        {inv.totalTtcDzd.toLocaleString('fr-DZ')} DA
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. COMPARATIF DES FORMULES DISPONIBLES */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
              Faites Évoluer Votre Parc avec les 3 Modes DocteurFlotte
            </h2>
            <p style={{ color: 'var(--df-text-muted)', fontSize: '0.82rem', margin: 0 }}>
              Du zéro boîtier au diagnostic moteur J1939 en boucle fermée, choisissez la formule adaptée à vos camions et engins.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {publicPlans.map((plan) => {
              const isCurrent = subscription?.planCode === plan.code;
              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'var(--df-bg-surface-1)',
                    border: isCurrent ? '2px solid #2563eb' : '1px solid var(--df-border-subtle)',
                    borderRadius: '14px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '20px',
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: '10px',
                      }}
                    >
                      VOTRE PLAN ACTUEL
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem 0' }}>{plan.name}</h3>
                    <p style={{ color: 'var(--df-text-muted)', fontSize: '0.78rem', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                      {plan.description}
                    </p>

                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--df-border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800 }} className="df-mono">
                          {plan.pricePerAssetDzd.toLocaleString('fr-DZ')} DA
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)' }}>
                          / véhicule {plan.billingModel === 'ANNUAL_INVOICE' ? '/ an' : '/ mois'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 600, marginTop: '0.25rem' }}>
                        {plan.billingModel === 'ANNUAL_INVOICE' ? 'Facturation Annuelle B2B' : 'Flotte Dynamique'}
                      </div>
                    </div>

                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {plan.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenQuoteModal(plan)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: isCurrent ? '1px solid var(--df-border-subtle)' : 'none',
                      background: isCurrent ? 'var(--df-bg-surface-2)' : '#2563eb',
                      color: isCurrent ? 'var(--df-text-main)' : '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isCurrent ? 'Ajuster les Véhicules' : 'Migrer vers cette Formule'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MODAL : DEMANDE DE DEVIS / EXTENSION */}
      {isQuoteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '14px', maxWidth: '520px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
              Demande d'Ajustement / Devis Sur-Mesure
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
              Notre équipe commerciale vous adressera une proposition officielle sous 24h avec remise grand compte.
            </p>

            {quoteError && (
              <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontSize: '0.78rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconAlertTriangle size={14} />
                <span>{quoteError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitQuote}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Nombre de Véhicules Envisagé
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quoteForm.desiredVehicleCount}
                  onChange={(e) => setQuoteForm({ ...quoteForm, desiredVehicleCount: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Formule Souhaitée
                  </label>
                  <select
                    value={quoteForm.preferredBillingModel}
                    onChange={(e) => setQuoteForm({ ...quoteForm, preferredBillingModel: e.target.value as SubscriptionBillingModel })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="ANNUAL_INVOICE">Annuelle B2B (Chèque / Virement)</option>
                    <option value="PAY_PER_ACTIVE_ASSET">Flotte Dynamique (Actifs Roulants)</option>
                    <option value="CAPEX_TMA">Licence CapEx + TMA</option>
                    <option value="AUDIT_TRIAL">Audit Anti-Fraude 90 Jours</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Mode de Paiement
                  </label>
                  <select
                    value={quoteForm.preferredPaymentMethod}
                    onChange={(e) => setQuoteForm({ ...quoteForm, preferredPaymentMethod: e.target.value as SubscriptionPaymentMethod })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
                    <option value="CHEQUE">Chèque Certifié</option>
                    <option value="CIB_EDAHABIA">CIB / Edahabia</option>
                    <option value="ESPECES">Espèces</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Nom du Responsable
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteForm.contactName}
                    onChange={(e) => setQuoteForm({ ...quoteForm, contactName: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Téléphone de Contact
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="05XX XX XX XX"
                    value={quoteForm.contactPhone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, contactPhone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Précisions Éventuelles (Parc mixte, Wilayas, remorques...)
                </label>
                <textarea
                  rows={2}
                  value={quoteForm.notes || ''}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Envoyer la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

