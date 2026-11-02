import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
} from 'class-validator';
import {
  SubscriptionBillingModel,
  SubscriptionPaymentMethod,
  SubscriptionPaymentTerms,
  SubscriptionInvoiceType,
  SubscriptionStatus,
} from '@docteurflotte/contracts';

export class CreateSubscriptionPlanHttpDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsIn(['ANNUAL_INVOICE', 'CAPEX_TMA', 'PAY_PER_ACTIVE_ASSET', 'AUDIT_TRIAL', 'MONTHLY_FLEX'])
  billingModel!: SubscriptionBillingModel;

  @IsNumber()
  @Min(0)
  pricePerAssetDzd!: number;

  @IsNumber()
  @IsOptional()
  baseFeeDzd?: number;

  @IsNumber()
  @IsOptional()
  billingIntervalMonths?: number;

  @IsNumber()
  @IsOptional()
  minAssets?: number;

  @IsNumber()
  @IsOptional()
  maxAssets?: number | null;

  @IsArray()
  @IsOptional()
  supportedModes?: ('MODE_0' | 'MODE_1' | 'MODE_2')[];

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsArray()
  @IsOptional()
  discountTiers?: { minVehicles: number; discountPercent: number }[];
}

export class UpdateSubscriptionPlanHttpDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ANNUAL_INVOICE', 'CAPEX_TMA', 'PAY_PER_ACTIVE_ASSET', 'AUDIT_TRIAL', 'MONTHLY_FLEX'])
  billingModel?: SubscriptionBillingModel;

  @IsNumber()
  @IsOptional()
  @Min(0)
  pricePerAssetDzd?: number;

  @IsNumber()
  @IsOptional()
  baseFeeDzd?: number;

  @IsNumber()
  @IsOptional()
  billingIntervalMonths?: number;

  @IsNumber()
  @IsOptional()
  minAssets?: number;

  @IsNumber()
  @IsOptional()
  maxAssets?: number | null;

  @IsArray()
  @IsOptional()
  supportedModes?: ('MODE_0' | 'MODE_1' | 'MODE_2')[];

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsArray()
  @IsOptional()
  discountTiers?: { minVehicles: number; discountPercent: number }[];
}

export class UpdateTenantSubscriptionHttpDto {
  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ANNUAL_INVOICE', 'CAPEX_TMA', 'PAY_PER_ACTIVE_ASSET', 'AUDIT_TRIAL', 'MONTHLY_FLEX'])
  billingModel?: SubscriptionBillingModel;

  @IsNumber()
  @IsOptional()
  customPricePerAssetDzd?: number | null;

  @IsNumber()
  @IsOptional()
  customBaseFeeDzd?: number | null;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED', 'PENDING_PAYMENT'])
  status?: SubscriptionStatus;

  @IsString()
  @IsOptional()
  renewalDate?: string;

  @IsNumber()
  @IsOptional()
  allocatedVehiclesLimit?: number;

  @IsString()
  @IsOptional()
  @IsIn(['ANNUEL_AVANCE', 'SEMESTRIEL', 'TRIMESTRIEL', 'MENSUEL', 'BON_DE_COMMANDE_60J'])
  paymentTerms?: SubscriptionPaymentTerms;

  @IsString()
  @IsOptional()
  @IsIn(['VIREMENT_BANCAIRE', 'CHEQUE', 'ESPECES', 'CIB_EDAHABIA'])
  paymentMethod?: SubscriptionPaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class GenerateInvoiceHttpDto {
  @IsString()
  @IsIn(['PROFORMA', 'FACTURE_DEFINITIVE', 'AVOIR'])
  invoiceType!: SubscriptionInvoiceType;

  @IsString()
  @IsNotEmpty()
  periodStart!: string;

  @IsString()
  @IsNotEmpty()
  periodEnd!: string;

  @IsBoolean()
  @IsOptional()
  applyStampDuty?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ClientQuoteRequestHttpDto {
  @IsString()
  @IsOptional()
  targetPlanId?: string;

  @IsNumber()
  @Min(1)
  desiredVehicleCount!: number;

  @IsString()
  @IsIn(['ANNUAL_INVOICE', 'CAPEX_TMA', 'PAY_PER_ACTIVE_ASSET', 'AUDIT_TRIAL', 'MONTHLY_FLEX'])
  preferredBillingModel!: SubscriptionBillingModel;

  @IsString()
  @IsIn(['VIREMENT_BANCAIRE', 'CHEQUE', 'ESPECES', 'CIB_EDAHABIA'])
  preferredPaymentMethod!: SubscriptionPaymentMethod;

  @IsString()
  @IsNotEmpty()
  contactName!: string;

  @IsString()
  @IsNotEmpty()
  contactPhone!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

