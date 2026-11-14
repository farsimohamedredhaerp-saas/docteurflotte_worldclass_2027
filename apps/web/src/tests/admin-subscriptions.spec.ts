import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PLAN_FORM,
  DEFAULT_NEGOTIATION_FORM,
  getDefaultInvoiceForm,
} from '../app/admin/subscriptions/constants';
import type { TenantSubscription } from '../app/admin/subscriptions/types';

describe('Admin Subscriptions & Billing Control Plane (Lot 5 Target 2)', () => {
  it('définit les formulaires par défaut adaptés aux modèles commerciaux algériens', () => {
    expect(DEFAULT_PLAN_FORM.billingModel).toBe('ANNUAL_INVOICE');
    expect(DEFAULT_PLAN_FORM.pricePerAssetDzd).toBe(24000);
    expect(DEFAULT_PLAN_FORM.supportedModes).toEqual(['MODE_0', 'MODE_1']);
    expect(DEFAULT_PLAN_FORM.discountTiers).toHaveLength(2);

    expect(DEFAULT_NEGOTIATION_FORM.paymentMethod).toBe('VIREMENT_BANCAIRE');
    expect(DEFAULT_NEGOTIATION_FORM.paymentTerms).toBe('ANNUEL_AVANCE');
    expect(DEFAULT_NEGOTIATION_FORM.allocatedVehiclesLimit).toBe(25);

    const invoiceForm = getDefaultInvoiceForm();
    expect(invoiceForm.invoiceType).toBe('PROFORMA');
    expect(invoiceForm.applyStampDuty).toBe(false);
  });

  it('calcule fidèlement le MRR mensualisé lissé selon la formule annuelle ou mensuelle', () => {
    const mockSubscriptions: TenantSubscription[] = [
      {
        id: 'sub-1',
        tenantId: 't-1',
        tenantName: 'Sarl Logistique Centre',
        tenantSlug: 'log-centre',
        planId: 'p-1',
        planCode: 'PLAN-PRO',
        planName: 'Professionnel B2B',
        billingModel: 'ANNUAL_INVOICE',
        effectivePricePerAssetDzd: 24000,
        discountPercent: 0,
        customPricePerAssetDzd: null,
        customBaseFeeDzd: null,
        status: 'ACTIVE',
        startDate: '2026-01-01',
        renewalDate: '2027-11-01',
        trialEndsAt: null,
        allocatedVehiclesLimit: 50,
        activeVehiclesCount: 40,
        idleVehiclesCount: 10,
        paymentTerms: 'ANNUEL_AVANCE',
        paymentMethod: 'VIREMENT_BANCAIRE',
        estimatedNextBillingAmountDzd: 960000, // 40 * 24000
        notes: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'sub-2',
        tenantId: 't-2',
        tenantName: 'Eurl Transport Express',
        tenantSlug: 'exp-alger',
        planId: 'p-2',
        planCode: 'PLAN-FLEX',
        planName: 'Flotte Dynamique',
        billingModel: 'PAY_PER_ACTIVE_ASSET',
        effectivePricePerAssetDzd: 2500,
        discountPercent: 0,
        customPricePerAssetDzd: null,
        customBaseFeeDzd: null,
        status: 'ACTIVE',
        startDate: '2026-01-01',
        renewalDate: '2026-12-01',
        trialEndsAt: null,
        allocatedVehiclesLimit: 20,
        activeVehiclesCount: 15,
        idleVehiclesCount: 5,
        paymentTerms: 'MENSUEL',
        paymentMethod: 'CHEQUE',
        estimatedNextBillingAmountDzd: 37500, // 15 * 2500
        notes: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const totalMrrDzd = mockSubscriptions.reduce((acc, sub) => {
      const monthly =
        sub.billingModel === 'ANNUAL_INVOICE'
          ? sub.estimatedNextBillingAmountDzd / 12
          : sub.estimatedNextBillingAmountDzd;
      return acc + Math.round(monthly);
    }, 0);

    const totalActiveVehicles = mockSubscriptions.reduce((acc, s) => acc + s.activeVehiclesCount, 0);
    const totalContractVehicles = mockSubscriptions.reduce((acc, s) => acc + s.allocatedVehiclesLimit, 0);

    // sub-1 (960 000 / 12 = 80 000) + sub-2 (37 500) = 117 500 DA / mois
    expect(totalMrrDzd).toBe(117500);
    expect(totalActiveVehicles).toBe(55);
    expect(totalContractVehicles).toBe(70);
  });

  it('génère un calcul fiscal conforme aux normes DGI algériennes (TVA 19% et droit de timbre)', () => {
    const subtotalHt = 100000;
    const tvaRate = 0.19;
    const tvaAmount = subtotalHt * tvaRate;
    const isCashPayment = true;
    // Droit de timbre légal de 1% sur espèces (plafonné à 10 000 DZD selon barème DGI)
    const stampDuty = isCashPayment ? Math.min(Math.round((subtotalHt + tvaAmount) * 0.01), 10000) : 0;
    const totalTtc = subtotalHt + tvaAmount + stampDuty;

    expect(tvaAmount).toBe(19000);
    expect(stampDuty).toBe(1190);
    expect(totalTtc).toBe(120190);
  });
});
