import type {
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

export type {
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
};

export type SubscriptionsTab = 'plans' | 'tenants' | 'invoices';
