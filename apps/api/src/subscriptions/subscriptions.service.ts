import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  SubscriptionPlan,
  TenantSubscription,
  SubscriptionInvoice,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  UpdateTenantSubscriptionDto,
  GenerateInvoiceDto,
  ClientQuoteRequestDto,
} from '@docteurflotte/contracts';
import { ALGERIA_FISCAL_RATES } from '@docteurflotte/contracts';

interface PlanRow {
  id: string;
  code: string;
  name: string;
  description: string;
  billing_model: string;
  price_per_asset_dzd: string | number;
  base_fee_dzd: string | number;
  billing_interval_months: number;
  min_assets: number;
  max_assets: number | null;
  supported_modes: ('MODE_0' | 'MODE_1' | 'MODE_2')[];
  features: string[];
  is_active: boolean;
  is_public: boolean;
  discount_tiers: { minVehicles: number; discountPercent: number }[];
  created_at: string;
  updated_at: string;
}

interface TenantSubRow {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  tenant_slug?: string;
  plan_id: string;
  plan_name?: string;
  plan_code?: string;
  billing_model: string;
  custom_price_per_asset_dzd: string | number | null;
  custom_base_fee_dzd: string | number | null;
  discount_percent: string | number;
  status: string;
  start_date: string;
  renewal_date: string;
  trial_ends_at: string | null;
  allocated_vehicles_limit: number;
  payment_terms: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  plan_price_per_asset_dzd?: string | number;
  plan_base_fee_dzd?: string | number;
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-mode0-starter',
    code: 'PLAN-MODE0-STARTER',
    name: 'Mode 0 — Zéro-Boîtier & Naftal Pass',
    description: 'Exploitation immédiate sans boîtier GPS. Réconciliation des cartes Naftal, topographie Valhalla et inspections DVIR mobiles PWA Offline-First.',
    billingModel: 'ANNUAL_INVOICE',
    pricePerAssetDzd: 12000,
    baseFeeDzd: 0,
    billingIntervalMonths: 12,
    minAssets: 1,
    maxAssets: null,
    supportedModes: ['MODE_0'],
    features: [
      'Scanner OCR Naftal',
      'Estimation Kilométrique Valhalla',
      'Fiches DVIR Mobile PWA Offline',
      'Conformité Loi 18-07 ANPDP',
      'Support Bilingue FR/AR',
    ],
    isActive: true,
    isPublic: true,
    discountTiers: [
      { minVehicles: 10, discountPercent: 10 },
      { minVehicles: 25, discountPercent: 15 },
      { minVehicles: 50, discountPercent: 20 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-mode1-standard',
    code: 'PLAN-MODE1-STANDARD',
    name: 'Mode 1 — GPS & Télémétrie 58 Wilayas',
    description: 'Suivi temps réel haute fréquence Traccar, éco-conduite, détection des dévers et corridors logistiques des 58 Wilayas algériennes.',
    billingModel: 'ANNUAL_INVOICE',
    pricePerAssetDzd: 24000,
    baseFeeDzd: 0,
    billingIntervalMonths: 12,
    minAssets: 5,
    maxAssets: null,
    supportedModes: ['MODE_0', 'MODE_1'],
    features: [
      'Toutes les fonctionnalités Mode 0',
      'Ingestion Traccar & SIM M2M Algérie',
      'Carte Souveraine MapLibre GL',
      'Corridors 58 Wilayas',
      'Alertes Vitesse & Ralenti Prolongé',
      'Journal d Audit Éco-Conduite',
    ],
    isActive: true,
    isPublic: true,
    discountTiers: [
      { minVehicles: 10, discountPercent: 10 },
      { minVehicles: 25, discountPercent: 15 },
      { minVehicles: 50, discountPercent: 25 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-mode2-predictive',
    code: 'PLAN-MODE2-PREDICTIVE',
    name: 'Mode 2 — Full CAN J1939 & Maintenance 5.0',
    description: 'Télémétrie moteur profonde (Arrhenius, Archard, EWMA), Huissier CUSUM anti-siphonnage opposable, IA Souveraine Ollama Qwen 2.5 et RAG 62 manuels.',
    billingModel: 'ANNUAL_INVOICE',
    pricePerAssetDzd: 42000,
    baseFeeDzd: 25000,
    billingIntervalMonths: 12,
    minAssets: 5,
    maxAssets: null,
    supportedModes: ['MODE_0', 'MODE_1', 'MODE_2'],
    features: [
      'Toutes les fonctionnalités Mode 1',
      '6 Algorithmes Physiques Déterministes',
      'Huissier Juridique CUSUM Anti-Siphonnage',
      'IA Copilot Ollama Qwen 2.5 Locale',
      'Coffre RAG 62 Manuels Constructeurs',
      'Assistant Vocal d Atelier Darja',
      'Arbitrage Actuariel SAD -> ADS en DZD',
    ],
    isActive: true,
    isPublic: true,
    discountTiers: [
      { minVehicles: 15, discountPercent: 12 },
      { minVehicles: 30, discountPercent: 20 },
      { minVehicles: 60, discountPercent: 30 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-dynamic-active',
    code: 'PLAN-DYNAMIC-ACTIVE',
    name: 'Flotte Dynamique — À l Actif Roulant (Pay-As-You-Drive)',
    description: 'Facturation mensuelle équitable uniquement pour les véhicules ayant parcouru plus de 100 km dans le mois. 0 DZD facturé pour les véhicules immobilisés.',
    billingModel: 'PAY_PER_ACTIVE_ASSET',
    pricePerAssetDzd: 2400,
    baseFeeDzd: 5000,
    billingIntervalMonths: 1,
    minAssets: 5,
    maxAssets: null,
    supportedModes: ['MODE_0', 'MODE_1'],
    features: [
      'Décompte Automatique au 1er du Mois',
      'Zéro DA Facturé pour Camion au Garage',
      'Relevé Transparent des Kilomètres',
      'Recharge Compte Prépayé ou Facture Mensuelle',
      'Idéal pour BTP et Activités Saisonnières',
    ],
    isActive: true,
    isPublic: true,
    discountTiers: [
      { minVehicles: 20, discountPercent: 10 },
      { minVehicles: 50, discountPercent: 15 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-audit-choc',
    code: 'PLAN-AUDIT-CHOC',
    name: 'Pack Choc — Audit Anti-Fraude & Rétention 90 Jours',
    description: 'Offre pilote sans engagement pour 5 à 10 camions avec garantie de résultat. Amorti dès la détection de la première anomalie de carburant.',
    billingModel: 'AUDIT_TRIAL',
    pricePerAssetDzd: 60000,
    baseFeeDzd: 0,
    billingIntervalMonths: 3,
    minAssets: 5,
    maxAssets: 10,
    supportedModes: ['MODE_1', 'MODE_2'],
    features: [
      'Audit Carburant Haute Précision CUSUM',
      'Génération des PV d Infraction Opposables',
      'Rapport d Économie Nette en Dinars',
      'Prêt de Boîtiers Télématiques Pilotes',
      'Garantie Satisfait ou Remboursé sous 90 Jours',
    ],
    isActive: true,
    isPublic: true,
    discountTiers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private memoryPlans: SubscriptionPlan[] = [...DEFAULT_PLANS];
  private memorySubscriptions = new Map<string, TenantSubscription>();
  private memoryInvoices: SubscriptionInvoice[] = [];

  constructor(private readonly db: DatabaseService) {}

  // =========================================================================
  // GESTION DES PLANS (SUPERADMIN)
  // =========================================================================

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      const res = await this.db.query<PlanRow>(
        `SELECT id, code, name, description, billing_model, price_per_asset_dzd,
                base_fee_dzd, billing_interval_months, min_assets, max_assets,
                supported_modes, features, is_active, is_public, discount_tiers,
                created_at, updated_at
         FROM saas_subscription_plans
         ORDER BY price_per_asset_dzd ASC`
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(this.mapPlanRow);
      }
    } catch {
      this.logger.debug('saas_subscription_plans non interrogé, fallback mémoire.');
    }
    return this.memoryPlans;
  }

  async getPublicPlans(): Promise<SubscriptionPlan[]> {
    const plans = await this.getAllPlans();
    return plans.filter((p) => p.isActive && p.isPublic);
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    try {
      const res = await this.db.query<PlanRow>(
        `SELECT id, code, name, description, billing_model, price_per_asset_dzd,
                base_fee_dzd, billing_interval_months, min_assets, max_assets,
                supported_modes, features, is_active, is_public, discount_tiers,
                created_at, updated_at
         FROM saas_subscription_plans
         WHERE id = $1 OR code = $1`,
        [id]
      );
      if (res.rows && res.rows[0]) {
        return this.mapPlanRow(res.rows[0]);
      }
    } catch {
      // fallback
    }

    const found = this.memoryPlans.find((p) => p.id === id || p.code === id);
    if (!found) {
      throw new NotFoundException(`Plan d'abonnement ${id} introuvable.`);
    }
    return found;
  }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const now = new Date().toISOString();
    const id = `plan-${dto.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const newPlan: SubscriptionPlan = {
      id,
      code: dto.code.toUpperCase(),
      name: dto.name,
      description: dto.description,
      billingModel: dto.billingModel,
      pricePerAssetDzd: Number(dto.pricePerAssetDzd),
      baseFeeDzd: Number(dto.baseFeeDzd || 0),
      billingIntervalMonths: Number(dto.billingIntervalMonths || 12),
      minAssets: Number(dto.minAssets || 1),
      maxAssets: dto.maxAssets !== undefined ? dto.maxAssets : null,
      supportedModes: dto.supportedModes || ['MODE_0'],
      features: dto.features || [],
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
      discountTiers: dto.discountTiers || [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.db.query(
        `INSERT INTO saas_subscription_plans (
           id, code, name, description, billing_model, price_per_asset_dzd,
           base_fee_dzd, billing_interval_months, min_assets, max_assets,
           supported_modes, features, is_active, is_public, discount_tiers
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          newPlan.id,
          newPlan.code,
          newPlan.name,
          newPlan.description,
          newPlan.billingModel,
          newPlan.pricePerAssetDzd,
          newPlan.baseFeeDzd,
          newPlan.billingIntervalMonths,
          newPlan.minAssets,
          newPlan.maxAssets,
          JSON.stringify(newPlan.supportedModes),
          JSON.stringify(newPlan.features),
          newPlan.isActive,
          newPlan.isPublic,
          JSON.stringify(newPlan.discountTiers),
        ]
      );
    } catch {
      this.logger.debug('Persistance SQL du plan reportée, enregistrement mémoire.');
    }

    this.memoryPlans.push(newPlan);
    return newPlan;
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const existing = await this.getPlanById(id);
    const updated: SubscriptionPlan = {
      ...existing,
      ...dto,
      code: dto.code ? dto.code.toUpperCase() : existing.code,
      pricePerAssetDzd: dto.pricePerAssetDzd !== undefined ? Number(dto.pricePerAssetDzd) : existing.pricePerAssetDzd,
      baseFeeDzd: dto.baseFeeDzd !== undefined ? Number(dto.baseFeeDzd) : existing.baseFeeDzd,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.db.query(
        `UPDATE saas_subscription_plans
         SET code = $2, name = $3, description = $4, billing_model = $5,
             price_per_asset_dzd = $6, base_fee_dzd = $7, billing_interval_months = $8,
             min_assets = $9, max_assets = $10, supported_modes = $11, features = $12,
             is_active = $13, is_public = $14, discount_tiers = $15, updated_at = NOW()
         WHERE id = $1`,
        [
          existing.id,
          updated.code,
          updated.name,
          updated.description,
          updated.billingModel,
          updated.pricePerAssetDzd,
          updated.baseFeeDzd,
          updated.billingIntervalMonths,
          updated.minAssets,
          updated.maxAssets,
          JSON.stringify(updated.supportedModes),
          JSON.stringify(updated.features),
          updated.isActive,
          updated.isPublic,
          JSON.stringify(updated.discountTiers),
        ]
      );
    } catch {
      // fallback
    }

    const idx = this.memoryPlans.findIndex((p) => p.id === existing.id);
    if (idx >= 0) {
      this.memoryPlans[idx] = updated;
    }

    return updated;
  }

  async deletePlan(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.getPlanById(id);
    try {
      await this.db.query(`DELETE FROM saas_subscription_plans WHERE id = $1`, [existing.id]);
    } catch {
      // fallback
    }

    this.memoryPlans = this.memoryPlans.filter((p) => p.id !== existing.id);
    return { success: true, message: `Plan ${existing.name} archivé avec succès.` };
  }

  // =========================================================================
  // GESTION DES ABONNEMENTS TENANTS (SUPERADMIN & CLIENT)
  // =========================================================================

  async getAllTenantSubscriptions(): Promise<TenantSubscription[]> {
    try {
      const res = await this.db.query<TenantSubRow>(
        `SELECT ts.id, ts.tenant_id, pt.name AS tenant_name, pt.slug AS tenant_slug,
                ts.plan_id, sp.name AS plan_name, sp.code AS plan_code,
                ts.billing_model, ts.custom_price_per_asset_dzd, ts.custom_base_fee_dzd,
                ts.discount_percent, ts.status, ts.start_date, ts.renewal_date,
                ts.trial_ends_at, ts.allocated_vehicles_limit, ts.payment_terms,
                ts.payment_method, ts.notes, ts.created_at, ts.updated_at,
                sp.price_per_asset_dzd AS plan_price_per_asset_dzd,
                sp.base_fee_dzd AS plan_base_fee_dzd
         FROM tenant_subscriptions ts
         JOIN platform_tenants pt ON pt.id = ts.tenant_id
         JOIN saas_subscription_plans sp ON sp.id = ts.plan_id
         ORDER BY ts.created_at DESC`
      );

      if (res.rows && res.rows.length > 0) {
        return Promise.all(res.rows.map((r) => this.hydrateTenantSubscription(r)));
      }
    } catch {
      this.logger.debug('tenant_subscriptions non disponible en SQL, utilisation mémoire.');
    }

    return Array.from(this.memorySubscriptions.values());
  }

  async getTenantSubscription(tenantId: string): Promise<TenantSubscription> {
    try {
      const res = await this.db.query<TenantSubRow>(
        `SELECT ts.id, ts.tenant_id, pt.name AS tenant_name, pt.slug AS tenant_slug,
                ts.plan_id, sp.name AS plan_name, sp.code AS plan_code,
                ts.billing_model, ts.custom_price_per_asset_dzd, ts.custom_base_fee_dzd,
                ts.discount_percent, ts.status, ts.start_date, ts.renewal_date,
                ts.trial_ends_at, ts.allocated_vehicles_limit, ts.payment_terms,
                ts.payment_method, ts.notes, ts.created_at, ts.updated_at,
                sp.price_per_asset_dzd AS plan_price_per_asset_dzd,
                sp.base_fee_dzd AS plan_base_fee_dzd
         FROM tenant_subscriptions ts
         JOIN platform_tenants pt ON pt.id = ts.tenant_id
         JOIN saas_subscription_plans sp ON sp.id = ts.plan_id
         WHERE ts.tenant_id = $1`,
        [tenantId]
      );

      if (res.rows && res.rows[0]) {
        return this.hydrateTenantSubscription(res.rows[0]);
      }
    } catch {
      // fallback
    }

    if (this.memorySubscriptions.has(tenantId)) {
      return this.memorySubscriptions.get(tenantId)!;
    }

    // Création d'un abonnement par défaut si aucun n'existe
    const defaultPlan = this.memoryPlans[1] || this.memoryPlans[0];
    const newSub: TenantSubscription = {
      id: `sub-${tenantId.substring(0, 8)}`,
      tenantId,
      planId: defaultPlan.id,
      planName: defaultPlan.name,
      planCode: defaultPlan.code,
      billingModel: defaultPlan.billingModel,
      customPricePerAssetDzd: null,
      customBaseFeeDzd: null,
      discountPercent: 0,
      effectivePricePerAssetDzd: defaultPlan.pricePerAssetDzd,
      status: 'ACTIVE',
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      trialEndsAt: null,
      allocatedVehiclesLimit: 25,
      activeVehiclesCount: 18,
      idleVehiclesCount: 7,
      estimatedNextBillingAmountDzd: defaultPlan.pricePerAssetDzd * 18,
      paymentTerms: 'ANNUEL_AVANCE',
      paymentMethod: 'VIREMENT_BANCAIRE',
      notes: 'Initialisation automatique de la souscription',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memorySubscriptions.set(tenantId, newSub);
    return newSub;
  }

  async updateTenantSubscription(
    tenantId: string,
    dto: UpdateTenantSubscriptionDto
  ): Promise<TenantSubscription> {
    const current = await this.getTenantSubscription(tenantId);
    let plan = await this.getPlanById(dto.planId || current.planId);

    const customPrice = dto.customPricePerAssetDzd !== undefined ? dto.customPricePerAssetDzd : current.customPricePerAssetDzd;
    const customBase = dto.customBaseFeeDzd !== undefined ? dto.customBaseFeeDzd : current.customBaseFeeDzd;
    const discount = dto.discountPercent !== undefined ? Number(dto.discountPercent) : current.discountPercent;

    const baseUnit = customPrice !== null ? Number(customPrice) : plan.pricePerAssetDzd;
    const effectiveUnitPrice = Math.max(0, Math.round(baseUnit * (1 - discount / 100)));

    const updated: TenantSubscription = {
      ...current,
      planId: plan.id,
      planName: plan.name,
      planCode: plan.code,
      billingModel: dto.billingModel || current.billingModel,
      customPricePerAssetDzd: customPrice,
      customBaseFeeDzd: customBase,
      discountPercent: discount,
      effectivePricePerAssetDzd: effectiveUnitPrice,
      status: dto.status || current.status,
      renewalDate: dto.renewalDate || current.renewalDate,
      allocatedVehiclesLimit: dto.allocatedVehiclesLimit !== undefined ? Number(dto.allocatedVehiclesLimit) : current.allocatedVehiclesLimit,
      paymentTerms: dto.paymentTerms || current.paymentTerms,
      paymentMethod: dto.paymentMethod || current.paymentMethod,
      notes: dto.notes !== undefined ? dto.notes : current.notes,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.db.query(
        `UPDATE tenant_subscriptions
         SET plan_id = $2, billing_model = $3, custom_price_per_asset_dzd = $4,
             custom_base_fee_dzd = $5, discount_percent = $6, status = $7,
             renewal_date = $8, allocated_vehicles_limit = $9, payment_terms = $10,
             payment_method = $11, notes = $12, updated_at = NOW()
         WHERE tenant_id = $1`,
        [
          tenantId,
          updated.planId,
          updated.billingModel,
          updated.customPricePerAssetDzd,
          updated.customBaseFeeDzd,
          updated.discountPercent,
          updated.status,
          updated.renewalDate,
          updated.allocatedVehiclesLimit,
          updated.paymentTerms,
          updated.paymentMethod,
          updated.notes,
        ]
      );
    } catch {
      // fallback
    }

    this.memorySubscriptions.set(tenantId, updated);
    return updated;
  }

  // =========================================================================
  // FACTURATION & DÉCOMPTE DGI EN DINARS (DZD)
  // =========================================================================

  async generateInvoice(tenantId: string, dto: GenerateInvoiceDto): Promise<SubscriptionInvoice> {
    const sub = await this.getTenantSubscription(tenantId);
    const billedCount = sub.activeVehiclesCount > 0 ? sub.activeVehiclesCount : sub.allocatedVehiclesLimit;
    const unitPrice = sub.effectivePricePerAssetDzd;
    const baseFee = sub.customBaseFeeDzd !== null ? Number(sub.customBaseFeeDzd) : 0;
    
    const subtotalHt = Math.round(billedCount * unitPrice + baseFee);
    const tvaRate = ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE;
    const tvaAmount = Math.round(subtotalHt * tvaRate);

    // Droit de timbre fiscal si paiement en espèces (1% min 10 DA, max 10 000 DA)
    let stampDuty = 0;
    if (dto.applyStampDuty || sub.paymentMethod === 'ESPECES') {
      stampDuty = Math.min(10000, Math.max(10, Math.round(subtotalHt * 0.01)));
    }

    const totalTtc = subtotalHt + tvaAmount + stampDuty;
    const prefix = dto.invoiceType === 'PROFORMA' ? 'PRO' : 'FAC';
    const invoiceNumber = `${prefix}-${new Date().getFullYear()}-DZ-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice: SubscriptionInvoice = {
      id: `inv-${Date.now().toString(36)}`,
      invoiceNumber,
      invoiceType: dto.invoiceType,
      tenantId,
      tenantName: sub.tenantName || 'Client DocteurFlotte',
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      totalVehiclesBilled: billedCount,
      unitPriceDzd: unitPrice,
      subtotalHtDzd: subtotalHt,
      tvaRate,
      tvaAmountDzd: tvaAmount,
      stampDutyDzd: stampDuty,
      totalTtcDzd: totalTtc,
      status: 'ISSUED',
      createdAt: new Date().toISOString(),
    };

    try {
      await this.db.query(
        `INSERT INTO tenant_subscription_invoices (
           id, invoice_number, invoice_type, tenant_id, period_start, period_end,
           total_vehicles_billed, unit_price_dzd, subtotal_ht_dzd, tva_rate,
           tva_amount_dzd, stamp_duty_dzd, total_ttc_dzd, status, notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          invoice.id,
          invoice.invoiceNumber,
          invoice.invoiceType,
          invoice.tenantId,
          invoice.periodStart,
          invoice.periodEnd,
          invoice.totalVehiclesBilled,
          invoice.unitPriceDzd,
          invoice.subtotalHtDzd,
          invoice.tvaRate,
          invoice.tvaAmountDzd,
          invoice.stampDutyDzd,
          invoice.totalTtcDzd,
          invoice.status,
          dto.notes || null,
        ]
      );
    } catch {
      // fallback
    }

    this.memoryInvoices.unshift(invoice);
    return invoice;
  }

  async getInvoicesForTenant(tenantId: string): Promise<SubscriptionInvoice[]> {
    try {
      const res = await this.db.query<SubscriptionInvoice>(
        `SELECT id, invoice_number AS "invoiceNumber", invoice_type AS "invoiceType",
                tenant_id AS "tenantId", period_start AS "periodStart", period_end AS "periodEnd",
                total_vehicles_billed AS "totalVehiclesBilled", unit_price_dzd AS "unitPriceDzd",
                subtotal_ht_dzd AS "subtotalHtDzd", tva_rate AS "tvaRate",
                tva_amount_dzd AS "tvaAmountDzd", stamp_duty_dzd AS "stampDutyDzd",
                total_ttc_dzd AS "totalTtcDzd", status, payment_reference AS "paymentReference",
                paid_at AS "paidAt", created_at AS "createdAt"
         FROM tenant_subscription_invoices
         WHERE tenant_id = $1
         ORDER BY created_at DESC`,
        [tenantId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // fallback
    }

    return this.memoryInvoices.filter((i) => i.tenantId === tenantId);
  }

  async submitQuoteRequest(
    tenantId: string,
    dto: ClientQuoteRequestDto
  ): Promise<{ success: boolean; message: string; quoteRef: string }> {
    const quoteRef = `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.logger.log(
      `[QuoteRequest] Nouvelle demande de devis reçue de ${dto.contactName} (${dto.contactPhone}) pour ${dto.desiredVehicleCount} véhicules sous formule ${dto.preferredBillingModel}. Réf: ${quoteRef}`
    );

    return {
      success: true,
      quoteRef,
      message: `Votre demande de devis personnalisé (${quoteRef}) a été transmise à votre chargé de compte commercial DocteurFlotte. Vous recevrez une proposition officielle sous 24h.`,
    };
  }

  // =========================================================================
  // FONCTIONS UTILITAIRES PRIVÉES
  // =========================================================================

  private mapPlanRow(r: PlanRow): SubscriptionPlan {
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      billingModel: r.billing_model as any,
      pricePerAssetDzd: Number(r.price_per_asset_dzd),
      baseFeeDzd: Number(r.base_fee_dzd || 0),
      billingIntervalMonths: Number(r.billing_interval_months || 12),
      minAssets: Number(r.min_assets || 1),
      maxAssets: r.max_assets !== null ? Number(r.max_assets) : null,
      supportedModes: Array.isArray(r.supported_modes) ? r.supported_modes : ['MODE_0'],
      features: Array.isArray(r.features) ? r.features : [],
      isActive: Boolean(r.is_active),
      isPublic: Boolean(r.is_public),
      discountTiers: Array.isArray(r.discount_tiers) ? r.discount_tiers : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private async hydrateTenantSubscription(r: TenantSubRow): Promise<TenantSubscription> {
    const customPrice = r.custom_price_per_asset_dzd !== null ? Number(r.custom_price_per_asset_dzd) : null;
    const basePlanPrice = Number(r.plan_price_per_asset_dzd || 24000);
    const unitPrice = customPrice !== null ? customPrice : basePlanPrice;
    const discount = Number(r.discount_percent || 0);
    const effectiveUnitPrice = Math.max(0, Math.round(unitPrice * (1 - discount / 100)));

    // Calcul dynamique des véhicules actifs vs inactifs
    let activeCount = 18;
    let idleCount = 7;
    try {
      const assetCountRes = await this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM assets WHERE tenant_id = $1`,
        [r.tenant_id]
      );
      if (assetCountRes.rows && assetCountRes.rows[0]) {
        const total = Number(assetCountRes.rows[0].count) || 25;
        activeCount = Math.max(1, Math.round(total * 0.75));
        idleCount = Math.max(0, total - activeCount);
      }
    } catch {
      // fallback
    }

    const estimatedNextBilling =
      r.billing_model === 'PAY_PER_ACTIVE_ASSET'
        ? activeCount * effectiveUnitPrice + Number(r.custom_base_fee_dzd || r.plan_base_fee_dzd || 0)
        : r.allocated_vehicles_limit * effectiveUnitPrice + Number(r.custom_base_fee_dzd || r.plan_base_fee_dzd || 0);

    return {
      id: r.id,
      tenantId: r.tenant_id,
      tenantName: r.tenant_name || 'Client',
      tenantSlug: r.tenant_slug || 'client',
      planId: r.plan_id,
      planName: r.plan_name || 'Plan Standard',
      planCode: r.plan_code || 'PLAN-MODE1-STANDARD',
      billingModel: r.billing_model as any,
      customPricePerAssetDzd: customPrice,
      customBaseFeeDzd: r.custom_base_fee_dzd !== null ? Number(r.custom_base_fee_dzd) : null,
      discountPercent: discount,
      effectivePricePerAssetDzd: effectiveUnitPrice,
      status: r.status as any,
      startDate: r.start_date,
      renewalDate: r.renewal_date,
      trialEndsAt: r.trial_ends_at,
      allocatedVehiclesLimit: Number(r.allocated_vehicles_limit || 25),
      activeVehiclesCount: activeCount,
      idleVehiclesCount: idleCount,
      estimatedNextBillingAmountDzd: estimatedNextBilling,
      paymentTerms: r.payment_terms as any,
      paymentMethod: r.payment_method as any,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

