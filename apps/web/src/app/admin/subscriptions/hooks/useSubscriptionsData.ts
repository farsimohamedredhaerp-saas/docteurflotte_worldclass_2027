'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthClient } from '@/lib/api-auth';
import { SubscriptionsClient } from '@/lib/api-subscriptions';
import type {
  SubscriptionPlan,
  TenantSubscription,
  SubscriptionInvoice,
  CreateSubscriptionPlanDto,
  UpdateTenantSubscriptionDto,
  GenerateInvoiceDto,
} from '../types';
import {
  DEFAULT_PLAN_FORM,
  DEFAULT_NEGOTIATION_FORM,
  getDefaultInvoiceForm,
} from '../constants';

export function useSubscriptionsData(onInvoiceGenerated?: () => void) {
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
  const [planForm, setPlanForm] = useState<CreateSubscriptionPlanDto>(DEFAULT_PLAN_FORM);
  const [negotiationForm, setNegotiationForm] = useState<UpdateTenantSubscriptionDto>(DEFAULT_NEGOTIATION_FORM);
  const [invoiceForm, setInvoiceForm] = useState<GenerateInvoiceDto>(getDefaultInvoiceForm());

  const token = useMemo(() => {
    return AuthClient.getSession().token || '';
  }, []);

  const loadData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPIs
  const totalMrrDzd = useMemo(() => {
    return tenantSubs.reduce((acc, sub) => {
      const monthly =
        sub.billingModel === 'ANNUAL_INVOICE'
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
  const handleOpenCreatePlan = useCallback(() => {
    setEditingPlan(null);
    setPlanForm(DEFAULT_PLAN_FORM);
    setIsPlanModalOpen(true);
  }, []);

  const handleOpenEditPlan = useCallback((plan: SubscriptionPlan) => {
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
  }, []);

  const handleSavePlan = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [editingPlan, loadData, planForm, token]
  );

  // --- Handlers Tenant Negotiation ---
  const handleOpenNegotiate = useCallback((sub: TenantSubscription) => {
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
  }, []);

  const handleSaveNegotiation = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTenantSub) return;
      try {
        await SubscriptionsClient.updateTenantSubscriptionAdmin(
          token,
          editingTenantSub.tenantId,
          negotiationForm
        );
        setSuccessMsg(`Abonnement personnalisé mis à jour pour le client.`);
        setIsNegotiationModalOpen(false);
        loadData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
      }
    },
    [editingTenantSub, loadData, negotiationForm, token]
  );

  // --- Handlers Invoice ---
  const handleOpenInvoice = useCallback((sub: TenantSubscription) => {
    setTargetInvoiceTenant(sub);
    setInvoiceForm({
      invoiceType: 'PROFORMA',
      periodStart: new Date().toISOString().substring(0, 10),
      periodEnd: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
      applyStampDuty: sub.paymentMethod === 'ESPECES',
      notes: `Facture émise sous formule ${sub.billingModel}`,
    });
    setIsInvoiceModalOpen(true);
  }, []);

  const handleGenerateInvoice = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetInvoiceTenant) return;
      try {
        const inv = await SubscriptionsClient.generateInvoiceAdmin(
          token,
          targetInvoiceTenant.tenantId,
          invoiceForm
        );
        setInvoices((prev) => [inv, ...prev]);
        setSuccessMsg(
          `Document ${inv.invoiceNumber} généré avec succès (Total TTC : ${inv.totalTtcDzd.toLocaleString(
            'fr-DZ'
          )} DZD).`
        );
        setIsInvoiceModalOpen(false);
        if (onInvoiceGenerated) {
          onInvoiceGenerated();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
      }
    },
    [invoiceForm, onInvoiceGenerated, targetInvoiceTenant, token]
  );

  return {
    plans,
    tenantSubs,
    invoices,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    totalMrrDzd,
    totalContractVehicles,
    totalActiveVehicles,
    isPlanModalOpen,
    setIsPlanModalOpen,
    editingPlan,
    planForm,
    setPlanForm,
    isNegotiationModalOpen,
    setIsNegotiationModalOpen,
    editingTenantSub,
    negotiationForm,
    setNegotiationForm,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    targetInvoiceTenant,
    invoiceForm,
    setInvoiceForm,
    loadData,
    handleOpenCreatePlan,
    handleOpenEditPlan,
    handleSavePlan,
    handleOpenNegotiate,
    handleSaveNegotiation,
    handleOpenInvoice,
    handleGenerateInvoice,
  };
}
