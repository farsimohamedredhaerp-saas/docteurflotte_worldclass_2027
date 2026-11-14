import type {
  CreateSubscriptionPlanDto,
  UpdateTenantSubscriptionDto,
  GenerateInvoiceDto,
} from './types';

export const DEFAULT_PLAN_FORM: CreateSubscriptionPlanDto = {
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
};

export const DEFAULT_NEGOTIATION_FORM: UpdateTenantSubscriptionDto = {
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
};

export function getDefaultInvoiceForm(): GenerateInvoiceDto {
  return {
    invoiceType: 'PROFORMA',
    periodStart: new Date().toISOString().substring(0, 10),
    periodEnd: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
    applyStampDuty: false,
    notes: '',
  };
}
