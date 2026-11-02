/**
 * Contrats & Types du Système d'Abonnement Souverain DocteurFlotte
 * Modèles flexibles pour le marché algérien : Annuel, CapEx + TMA, À l'Actif Roulant, Pack Audit.
 */

export type SubscriptionBillingModel =
  | 'ANNUAL_INVOICE'        // Facture annuelle unique B2B (Chèque / Virement avec TVA DGI)
  | 'CAPEX_TMA'             // Droit d'usage / Licence perpétuelle + Contrat annuel de maintenance (15-18%)
  | 'PAY_PER_ACTIVE_ASSET'  // Flotte Dynamique : facturation uniquement des véhicules ayant roulé (>100 km/mois)
  | 'AUDIT_TRIAL'           // Pack Choc Anti-Fraude 90 Jours avec garantie de résultat
  | 'MONTHLY_FLEX';         // Mensuel sans engagement

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIAL'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'PENDING_PAYMENT';

export type SubscriptionPaymentMethod =
  | 'VIREMENT_BANCAIRE'
  | 'CHEQUE'
  | 'ESPECES'
  | 'CIB_EDAHABIA';

export type SubscriptionPaymentTerms =
  | 'ANNUEL_AVANCE'
  | 'SEMESTRIEL'
  | 'TRIMESTRIEL'
  | 'MENSUEL'
  | 'BON_DE_COMMANDE_60J';

export type SubscriptionInvoiceType =
  | 'PROFORMA'
  | 'FACTURE_DEFINITIVE'
  | 'AVOIR';

export type SubscriptionInvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'CANCELLED';

export interface SubscriptionDiscountTier {
  minVehicles: number;
  discountPercent: number;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  billingModel: SubscriptionBillingModel;
  pricePerAssetDzd: number;
  baseFeeDzd: number;
  billingIntervalMonths: number;
  minAssets: number;
  maxAssets: number | null;
  supportedModes: ('MODE_0' | 'MODE_1' | 'MODE_2')[];
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  discountTiers: SubscriptionDiscountTier[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
  planId: string;
  planName?: string;
  planCode?: string;
  billingModel: SubscriptionBillingModel;
  customPricePerAssetDzd: number | null;
  customBaseFeeDzd: number | null;
  discountPercent: number;
  effectivePricePerAssetDzd: number;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate: string;
  trialEndsAt: string | null;
  allocatedVehiclesLimit: number;
  activeVehiclesCount: number;
  idleVehiclesCount: number;
  estimatedNextBillingAmountDzd: number;
  paymentTerms: SubscriptionPaymentTerms;
  paymentMethod: SubscriptionPaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  invoiceType: SubscriptionInvoiceType;
  tenantId: string;
  tenantName?: string;
  periodStart: string;
  periodEnd: string;
  totalVehiclesBilled: number;
  unitPriceDzd: number;
  subtotalHtDzd: number;
  tvaRate: number;
  tvaAmountDzd: number;
  stampDutyDzd: number;
  totalTtcDzd: number;
  status: SubscriptionInvoiceStatus;
  paymentReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface CreateSubscriptionPlanDto {
  code: string;
  name: string;
  description: string;
  billingModel: SubscriptionBillingModel;
  pricePerAssetDzd: number;
  baseFeeDzd?: number;
  billingIntervalMonths?: number;
  minAssets?: number;
  maxAssets?: number | null;
  supportedModes?: ('MODE_0' | 'MODE_1' | 'MODE_2')[];
  features?: string[];
  isActive?: boolean;
  isPublic?: boolean;
  discountTiers?: SubscriptionDiscountTier[];
}

export interface UpdateSubscriptionPlanDto extends Partial<CreateSubscriptionPlanDto> {}

export interface UpdateTenantSubscriptionDto {
  planId?: string;
  billingModel?: SubscriptionBillingModel;
  customPricePerAssetDzd?: number | null;
  customBaseFeeDzd?: number | null;
  discountPercent?: number;
  status?: SubscriptionStatus;
  renewalDate?: string;
  allocatedVehiclesLimit?: number;
  paymentTerms?: SubscriptionPaymentTerms;
  paymentMethod?: SubscriptionPaymentMethod;
  notes?: string;
}

export interface GenerateInvoiceDto {
  invoiceType: SubscriptionInvoiceType;
  periodStart: string;
  periodEnd: string;
  applyStampDuty?: boolean;
  notes?: string;
}

export interface ClientQuoteRequestDto {
  targetPlanId?: string;
  desiredVehicleCount: number;
  preferredBillingModel: SubscriptionBillingModel;
  preferredPaymentMethod: SubscriptionPaymentMethod;
  contactName: string;
  contactPhone: string;
  notes?: string;
}

