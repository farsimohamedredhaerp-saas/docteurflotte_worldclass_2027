'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AuthClient } from '../../../lib/api-auth';
import { SubscriptionsClient } from '../../../lib/api-subscriptions';
import {
  SubscriptionPlan,
  TenantSubscription,
  SubscriptionInvoice,
  SubscriptionBillingModel,
  SubscriptionPaymentMethod,
  SubscriptionPaymentTerms,
  SubscriptionInvoiceType,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  UpdateTenantSubscriptionDto,
  GenerateInvoiceDto,
} from '@docteurflotte/contracts';
import {
  IconCreditCard,
  IconRefreshCw,
  IconPlus,
  IconAlertTriangle,
  IconCheck,
  IconFileText,
  IconLayers,
  IconEdit,
  IconSliders,
} from '../../../components/navigation/TechIcons';

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'tenants' | 'invoices'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [tenantSubs, setTenantSubs] = useState<TenantSubscription[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [editingTenantSub, setEditingTenantSub] = useState<TenantSubscription | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [targetInvoiceTenant, setTargetInvoiceTenant] = useState<TenantSubscription | null>(null);

  // Form states
  const [planForm, setPlanForm] = useState<CreateSubscriptionPlanDto>({
    code: '',
    name: '',
    description: '',
    billingModel: 'ANNUAL_INVOICE',
    pricePerAssetDzd: 24000,
    baseFeeDzd: 0,
    billingIntervalMonths: 12,
    minAssets: 1,
    maxAssets: null,
    supportedModes: ['MODE_0', 'MODE_1'],
    features: [],
    isActive: true,
    isPublic: true,
    discountTiers: [
      { minVehicles: 10, discountPercent: 10 },
      { minVehicles: 25, discountPercent: 15 },
    ],
  });

  const [negotiationForm, setNegotiationForm] = useState<UpdateTenantSubscriptionDto>({
    planId: '',
    billingModel: 'ANNUAL_INVOICE',
    customPricePerAssetDzd: null,
    customBaseFeeDzd: null,
    discountPercent: 0,
    status: 'ACTIVE',
    renewalDate: '',
    allocatedVehiclesLimit: 25,
    paymentTerms: 'ANNUEL_AVANCE',
    paymentMethod: 'VIREMENT_BANCAIRE',
    notes: '',
  });

  const [invoiceForm, setInvoiceForm] = useState<GenerateInvoiceDto>({
    invoiceType: 'PROFORMA',
    periodStart: new Date().toISOString().substring(0, 10),
    periodEnd: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
    applyStampDuty: false,
    notes: '',
  });

  const token = useMemo(() => {
    return AuthClient.getSession().token || '';
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedPlans, fetchedSubs] = await Promise.all([
        SubscriptionsClient.getAllPlansAdmin(token),
        SubscriptionsClient.getAllTenantSubscriptionsAdmin(token),
      ]);
      setPlans(fetchedPlans);
      setTenantSubs(fetchedSubs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Erreur de chargement: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // KPIs
  const totalMrrDzd = useMemo(() => {
    return tenantSubs.reduce((acc, sub) => {
      const monthly = sub.billingModel === 'ANNUAL_INVOICE'
        ? sub.estimatedNextBillingAmountDzd / 12
        : sub.estimatedNextBillingAmountDzd;
      return acc + Math.round(monthly);
    }, 0);
  }, [tenantSubs]);

  const totalContractVehicles = useMemo(() => {
    return tenantSubs.reduce((acc, sub) => acc + sub.allocatedVehiclesLimit, 0);
  }, [tenantSubs]);

  const totalActiveVehicles = useMemo(() => {
    return tenantSubs.reduce((acc, sub) => acc + sub.activeVehiclesCount, 0);
  }, [tenantSubs]);

  // --- Handlers Plan ---
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      code: '',
      name: '',
      description: '',
      billingModel: 'ANNUAL_INVOICE',
      pricePerAssetDzd: 24000,
      baseFeeDzd: 0,
      billingIntervalMonths: 12,
      minAssets: 1,
      maxAssets: null,
      supportedModes: ['MODE_0', 'MODE_1'],
      features: ['Gestion de Flotte', 'Rapports Naftal', 'Support Technique'],
      isActive: true,
      isPublic: true,
      discountTiers: [
        { minVehicles: 10, discountPercent: 10 },
        { minVehicles: 25, discountPercent: 15 },
      ],
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      billingModel: plan.billingModel,
      pricePerAssetDzd: plan.pricePerAssetDzd,
      baseFeeDzd: plan.baseFeeDzd,
      billingIntervalMonths: plan.billingIntervalMonths,
      minAssets: plan.minAssets,
      maxAssets: plan.maxAssets,
      supportedModes: plan.supportedModes,
      features: plan.features,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      discountTiers: plan.discountTiers,
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await SubscriptionsClient.updatePlanAdmin(token, editingPlan.id, planForm);
        setSuccessMsg(`Plan "${planForm.name}" mis à jour avec succès.`);
      } else {
        await SubscriptionsClient.createPlanAdmin(token, planForm);
        setSuccessMsg(`Nouveau plan "${planForm.name}" créé avec succès.`);
      }
      setIsPlanModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  // --- Handlers Tenant Negotiation ---
  const handleOpenNegotiate = (sub: TenantSubscription) => {
    setEditingTenantSub(sub);
    setNegotiationForm({
      planId: sub.planId,
      billingModel: sub.billingModel,
      customPricePerAssetDzd: sub.customPricePerAssetDzd,
      customBaseFeeDzd: sub.customBaseFeeDzd,
      discountPercent: sub.discountPercent,
      status: sub.status,
      renewalDate: sub.renewalDate ? sub.renewalDate.substring(0, 10) : '',
      allocatedVehiclesLimit: sub.allocatedVehiclesLimit,
      paymentTerms: sub.paymentTerms,
      paymentMethod: sub.paymentMethod,
      notes: sub.notes || '',
    });
    setIsNegotiationModalOpen(true);
  };

  const handleSaveNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenantSub) return;
    try {
      await SubscriptionsClient.updateTenantSubscriptionAdmin(token, editingTenantSub.tenantId, negotiationForm);
      setSuccessMsg(`Abonnement personnalisé mis à jour pour le client.`);
      setIsNegotiationModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  // --- Handlers Invoice ---
  const handleOpenInvoice = (sub: TenantSubscription) => {
    setTargetInvoiceTenant(sub);
    setInvoiceForm({
      invoiceType: 'PROFORMA',
      periodStart: new Date().toISOString().substring(0, 10),
      periodEnd: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
      applyStampDuty: sub.paymentMethod === 'ESPECES',
      notes: `Facture émise sous formule ${sub.billingModel}`,
    });
    setIsInvoiceModalOpen(true);
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceTenant) return;
    try {
      const inv = await SubscriptionsClient.generateInvoiceAdmin(token, targetInvoiceTenant.tenantId, invoiceForm);
      setInvoices((prev) => [inv, ...prev]);
      setSuccessMsg(`Document ${inv.invoiceNumber} généré avec succès (Total TTC : ${inv.totalTtcDzd.toLocaleString('fr-DZ')} DZD).`);
      setIsInvoiceModalOpen(false);
      setActiveTab('invoices');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. ENTÊTE PRINCIPALE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <IconCreditCard size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--df-text-main)' }}>
              Plans & Abonnements B2B Algérie
            </h1>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              CONTROL PLANE SUPERADMIN
            </span>
          </div>
          <p style={{ color: 'var(--df-text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Gestion commerciale flexible : Tarifs en Dinars (DZD), dérogations par tenant, formule Flotte Dynamique & facturation DGI.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--df-border-subtle)',
              background: 'var(--df-bg-surface-2)',
              color: 'var(--df-text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={handleOpenCreatePlan}
            style={{
              padding: '0.5rem 1rem',
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
            <IconPlus size={14} />
            Créer un Plan d'Abonnement
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconAlertTriangle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#86efac', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconCheck size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. BARRE DE KPIS COMMERCIAUX */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            MRR ESTIMÉ EN DINARS (DZD)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }} className="df-mono">
            {totalMrrDzd.toLocaleString('fr-DZ')} <span style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)' }}>DA / mois</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
            Revenu mensuel récurrent annualisé lissé
          </div>
        </div>

        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            PARC VÉHICULES ACTIFS / ENGAGÉS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }} className="df-mono">
            {totalActiveVehicles} <span style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)' }}>/ {totalContractVehicles} véhicules</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
            {totalContractVehicles > 0 ? Math.round((totalActiveVehicles / totalContractVehicles) * 100) : 0}% de flotte en circulation facturée
          </div>
        </div>

        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            PLANS STANDARDS & SUR-MESURE
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa' }} className="df-mono">
            {plans.length} <span style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)' }}>plans actifs</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
            Mode 0 (Zero-Hardware), Mode 1 (GPS), Mode 2 (Full CAN)
          </div>
        </div>

        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            MODES DE RÈGLEMENT B2B DZ
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.35rem' }}>
            Virement (65%) • Chèque (30%)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
            Conformité DGI (TVA 19% déductible, Timbre espèces)
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION PAR ONGLETS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--df-border-subtle)', marginBottom: '1.25rem', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'plans' ? '2px solid var(--df-accent-blue)' : '2px solid transparent',
            color: activeTab === 'plans' ? 'var(--df-text-main)' : 'var(--df-text-muted)',
            fontWeight: activeTab === 'plans' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconFileText size={15} />
          <span>Catalogue des Plans ({plans.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tenants')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tenants' ? '2px solid var(--df-accent-blue)' : '2px solid transparent',
            color: activeTab === 'tenants' ? 'var(--df-text-main)' : 'var(--df-text-muted)',
            fontWeight: activeTab === 'tenants' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconLayers size={15} />
          <span>Abonnements Tenants & Négociations ({tenantSubs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'invoices' ? '2px solid var(--df-accent-blue)' : '2px solid transparent',
            color: activeTab === 'invoices' ? 'var(--df-text-main)' : 'var(--df-text-muted)',
            fontWeight: activeTab === 'invoices' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconCreditCard size={15} />
          <span>Facturation & Proformas DGI ({invoices.length})</span>
        </button>
      </div>

      {/* 4. CONTENU ONGLET 1 : CATALOGUE DES PLANS */}
      {activeTab === 'plans' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--df-bg-surface-2)',
                          color: 'var(--df-text-muted)',
                          marginRight: '0.5rem',
                        }}
                        className="df-mono"
                      >
                        {plan.code}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: plan.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: plan.isActive ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {plan.isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {plan.supportedModes.map((mode) => (
                        <span
                          key={mode}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background:
                              mode === 'MODE_2'
                                ? 'rgba(168, 85, 247, 0.2)'
                                : mode === 'MODE_1'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(234, 179, 8, 0.2)',
                            color:
                              mode === 'MODE_2'
                                ? '#d8b4fe'
                                : mode === 'MODE_1'
                                ? '#93c5fd'
                                : '#fde047',
                          }}
                        >
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--df-text-main)' }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: 'var(--df-text-muted)', fontSize: '0.8rem', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                    {plan.description}
                  </p>

                  {/* PRIX ET FORMULE */}
                  <div
                    style={{
                      background: 'var(--df-bg-surface-2)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      border: '1px solid var(--df-border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--df-text-main)' }} className="df-mono">
                        {plan.pricePerAssetDzd.toLocaleString('fr-DZ')} DA
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                        / véhicule {plan.billingModel === 'ANNUAL_INVOICE' ? '/ an' : '/ mois'}
                      </span>
                    </div>
                    {plan.baseFeeDzd > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.2rem' }}>
                        + Frais fixe d'intégration : {plan.baseFeeDzd.toLocaleString('fr-DZ')} DA
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600, marginTop: '0.35rem' }}>
                      Modèle : {plan.billingModel}
                    </div>
                  </div>

                  {/* FONCTIONNALITÉS */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--df-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Inclus dans ce plan :
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                      {plan.features.slice(0, 5).map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                      {plan.features.length > 5 && (
                        <li style={{ color: 'var(--df-text-muted)', listStyle: 'none' }}>
                          + {plan.features.length - 5} autres fonctionnalités...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPlan(plan)}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      borderRadius: '6px',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <IconEdit size={13} />
                    Modifier ce plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CONTENU ONGLET 2 : TENANTS & NÉGOCIATIONS SUR-MESURE */}
      {activeTab === 'tenants' && (
        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--df-border-subtle)', background: 'var(--df-bg-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
              Portefeuille des Abonnements Clients & Surcharges Négociées
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
              Chaque client peut bénéficier d'un tarif unitaire dérogatoire ou d'une remise négociée
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Client / Organisation</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Plan Souscrit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Formule</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Véhicules (Actifs / Total)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tarif Unitaire Net</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Prochaine Échéance</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Règlement</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenantSubs.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--df-text-main)' }}>
                      <div>{sub.tenantName || sub.tenantSlug}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--df-text-muted)' }}>ID: {sub.tenantId.substring(0, 8)}...</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                        }}
                      >
                        {sub.planName}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>
                      {sub.billingModel}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: '#34d399' }} className="df-mono">{sub.activeVehiclesCount}</span>
                      <span style={{ color: 'var(--df-text-muted)' }}> / {sub.allocatedVehiclesLimit}</span>
                      <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>
                        ({sub.idleVehiclesCount} au garage à 0 DA)
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }} className="df-mono">
                        {sub.effectivePricePerAssetDzd.toLocaleString('fr-DZ')} DA
                      </div>
                      {sub.discountPercent > 0 && (
                        <div style={{ fontSize: '0.68rem', color: '#f59e0b' }}>
                          Remise {sub.discountPercent}% appliquée
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--df-text-main)' }}>
                        {sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('fr-DZ') : 'Indéterminée'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#38bdf8' }} className="df-mono">
                        ~{sub.estimatedNextBillingAmountDzd.toLocaleString('fr-DZ')} DA TTC
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                      <div>{sub.paymentMethod}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>{sub.paymentTerms}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenNegotiate(sub)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '5px',
                            background: 'var(--df-bg-surface-2)',
                            border: '1px solid var(--df-border-subtle)',
                            color: 'var(--df-text-main)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <IconSliders size={12} />
                          Négocier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(sub)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '5px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#93c5fd',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <IconFileText size={12} />
                          Facturer DGI
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CONTENU ONGLET 3 : FACTURATION & PROFORMAS */}
      {activeTab === 'invoices' && (
        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--df-text-main)' }}>
            Registre des Factures Officielles & Proformas DGI (TVA 19% & Timbre)
          </h3>
          {invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--df-text-muted)' }}>
              Aucune facture générée durant cette session. Utilisez le bouton « Facturer DGI » dans l'onglet des tenants pour émettre un proforma.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>N° Facture</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Période</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Véhicules</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Montant HT</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TVA (19%)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Timbre Fiscal</th>
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
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--df-text-main)' }}>{inv.tenantName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--df-text-muted)' }}>
                        {inv.periodStart} au {inv.periodEnd}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.totalVehiclesBilled}</td>
                      <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.subtotalHtDzd.toLocaleString('fr-DZ')} DA</td>
                      <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.tvaAmountDzd.toLocaleString('fr-DZ')} DA</td>
                      <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.stampDutyDzd.toLocaleString('fr-DZ')} DA</td>
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
      )}

      {/* MODAL 1 : CRÉER / MODIFIER UN PLAN D'ABONNEMENT */}
      {isPlanModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '14px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--df-text-main)' }}>
              {editingPlan ? `Modifier le Plan "${editingPlan.name}"` : "Créer un Nouveau Plan d'Abonnement"}
            </h3>

            <form onSubmit={handleSavePlan}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Code Unique (ex: PLAN-BTP-EXTRA)
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.code}
                    onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Nom Commercial
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Description de l'Offre
                </label>
                <textarea
                  rows={2}
                  required
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Modèle de Facturation
                  </label>
                  <select
                    value={planForm.billingModel}
                    onChange={(e) => setPlanForm({ ...planForm, billingModel: e.target.value as SubscriptionBillingModel })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="ANNUAL_INVOICE">Facturation Annuelle B2B (Standard DZ)</option>
                    <option value="PAY_PER_ACTIVE_ASSET">À l'Actif Roulant (Pay-as-you-drive)</option>
                    <option value="CAPEX_TMA">Licence CapEx + Contrat TMA</option>
                    <option value="AUDIT_TRIAL">Pack Audit Anti-Fraude 90 Jours</option>
                    <option value="MONTHLY_FLEX">Mensuel Flexible</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Tarif par Véhicule (DZD)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={planForm.pricePerAssetDzd}
                    onChange={(e) => setPlanForm({ ...planForm, pricePerAssetDzd: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Frais Fixe d'Intégration (DZD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.baseFeeDzd || 0}
                    onChange={(e) => setPlanForm({ ...planForm, baseFeeDzd: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Modes IoT Supportés
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    {(['MODE_0', 'MODE_1', 'MODE_2'] as const).map((mode) => (
                      <label key={mode} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--df-text-main)' }}>
                        <input
                          type="checkbox"
                          checked={planForm.supportedModes?.includes(mode)}
                          onChange={(e) => {
                            const cur = planForm.supportedModes || [];
                            const updated = e.target.checked ? [...cur, mode] : cur.filter((m) => m !== mode);
                            setPlanForm({ ...planForm, supportedModes: updated });
                          }}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Enregistrer le Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : NÉGOCIATION SUR-MESURE & DÉROGATION SUPERADMIN */}
      {isNegotiationModalOpen && editingTenantSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '14px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--df-text-main)' }}>
              Ajustement Sur-Mesure : {editingTenantSub.tenantName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
              Marge de manœuvre SuperAdmin : Surcharger le prix catalogue, accorder une remise en % ou changer les conditions de paiement.
            </p>

            <form onSubmit={handleSaveNegotiation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Plan de Référence
                  </label>
                  <select
                    value={negotiationForm.planId}
                    onChange={(e) => setNegotiationForm({ ...negotiationForm, planId: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pricePerAssetDzd.toLocaleString('fr-DZ')} DA)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Formule Économique
                  </label>
                  <select
                    value={negotiationForm.billingModel}
                    onChange={(e) => setNegotiationForm({ ...negotiationForm, billingModel: e.target.value as SubscriptionBillingModel })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="ANNUAL_INVOICE">Annuelle B2B (Chèque / Virement)</option>
                    <option value="PAY_PER_ACTIVE_ASSET">Flotte Dynamique (À l'Actif Roulant)</option>
                    <option value="CAPEX_TMA">CapEx + Contrat TMA</option>
                    <option value="AUDIT_TRIAL">Pack Audit 90 Jours</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Prix Négocié Dérogatoire (DZD)
                  </label>
                  <input
                    type="number"
                    placeholder="Laisser vide = prix catalogue"
                    value={negotiationForm.customPricePerAssetDzd !== null ? negotiationForm.customPricePerAssetDzd : ''}
                    onChange={(e) =>
                      setNegotiationForm({
                        ...negotiationForm,
                        customPricePerAssetDzd: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Remise Commerciale (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={negotiationForm.discountPercent || 0}
                    onChange={(e) => setNegotiationForm({ ...negotiationForm, discountPercent: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Mode de Règlement
                  </label>
                  <select
                    value={negotiationForm.paymentMethod}
                    onChange={(e) => setNegotiationForm({ ...negotiationForm, paymentMethod: e.target.value as SubscriptionPaymentMethod })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="VIREMENT_BANCAIRE">Virement Bancaire (Recommandé)</option>
                    <option value="CHEQUE">Chèque Certifié d'Entreprise</option>
                    <option value="BON_DE_COMMANDE_60J">Bon de Commande / Mandat Administratif</option>
                    <option value="ESPECES">Espèces (avec timbre fiscal DGI)</option>
                    <option value="CIB_EDAHABIA">CIB / Carte Edahabia</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Statut du Compte
                  </label>
                  <select
                    value={negotiationForm.status}
                    onChange={(e) => setNegotiationForm({ ...negotiationForm, status: e.target.value as any })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  >
                    <option value="ACTIVE">ACTIF (En règle)</option>
                    <option value="TRIAL">PÉRIODE D'ESSAI</option>
                    <option value="PENDING_PAYMENT">EN ATTENTE DE CHÈQUE</option>
                    <option value="SUSPENDED">SUSPENDU (Impayé)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Notes Commerciales (Justification de remise, N° contrat)
                </label>
                <textarea
                  rows={2}
                  value={negotiationForm.notes || ''}
                  onChange={(e) => setNegotiationForm({ ...negotiationForm, notes: e.target.value })}
                  placeholder="Ex: Négociation conclue avec DG Transport le 20/10/2026 - Paiement par chèque à 30 jours."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNegotiationModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Appliquer la Dérogation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 : ÉMISSION FACTURE PROFORMA / DGI */}
      {isInvoiceModalOpen && targetInvoiceTenant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '14px', maxWidth: '550px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--df-text-main)' }}>
              Émettre un Document Fiscal DGI : {targetInvoiceTenant.tenantName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
              Calcul automatique de la TVA légale algérienne (19 %) et du droit de timbre pour engagement comptable.
            </p>

            <form onSubmit={handleGenerateInvoice}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Nature du Document
                </label>
                <select
                  value={invoiceForm.invoiceType}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value as SubscriptionInvoiceType })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                >
                  <option value="PROFORMA">Facture Proforma (Devis engageant pour bon de commande)</option>
                  <option value="FACTURE_DEFINITIVE">Facture Définitive (Titre exécutoire fiscal)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Date Début Période
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.periodStart}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, periodStart: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                    Date Fin Période
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.periodEnd}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, periodEnd: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span>Base Véhicules Facturés :</span>
                  <span className="df-mono font-bold">{targetInvoiceTenant.activeVehiclesCount} véhicules</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span>Tarif Unitaire Net :</span>
                  <span className="df-mono font-bold">{targetInvoiceTenant.effectivePricePerAssetDzd.toLocaleString('fr-DZ')} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700 }}>
                  <span>Taux TVA Déductible :</span>
                  <span className="df-mono">19,00 %</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Générer le Document DGI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

