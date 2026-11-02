import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { DatabaseService } from '../database/database.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockDatabaseService: {
    query: jest.Mock;
    queryInTenant: jest.Mock;
    withTenantContext: jest.Mock;
  };

  beforeEach(async () => {
    mockDatabaseService = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      queryInTenant: jest.fn().mockResolvedValue({ rows: [] }),
      withTenantContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait retourner les plans de référence algériens par défaut', async () => {
    const plans = await service.getAllPlans();
    expect(plans.length).toBeGreaterThanOrEqual(4);
    const mode0 = plans.find((p) => p.code === 'PLAN-MODE0-STARTER');
    expect(mode0).toBeDefined();
    expect(mode0?.billingModel).toBe('ANNUAL_INVOICE');
    expect(mode0?.pricePerAssetDzd).toBe(12000);
  });

  it('devrait permettre au SuperAdmin de créer un plan sur-mesure pour grand compte', async () => {
    const newPlan = await service.createPlan({
      code: 'PLAN-SONATRACH-SPECIAL',
      name: 'Formule Sonatrach Grand Sud 6x6',
      description: 'Offre sur-mesure pour 120 camions avec assistance désertique',
      billingModel: 'CAPEX_TMA',
      pricePerAssetDzd: 38000,
      baseFeeDzd: 150000,
      supportedModes: ['MODE_1', 'MODE_2'],
      features: ['Corridors Hassi Messaoud', 'Huissier CUSUM'],
    });

    expect(newPlan.code).toBe('PLAN-SONATRACH-SPECIAL');
    expect(newPlan.pricePerAssetDzd).toBe(38000);

    const retrieved = await service.getPlanById('PLAN-SONATRACH-SPECIAL');
    expect(retrieved.name).toBe('Formule Sonatrach Grand Sud 6x6');
  });

  it('devrait permettre de modifier les tarifs et conditions d un plan spécifique', async () => {
    const updated = await service.updatePlan('PLAN-MODE1-STANDARD', {
      pricePerAssetDzd: 22000,
      name: 'Mode 1 — GPS & Télémétrie 58 Wilayas (Tarif Négocié)',
    });

    expect(updated.pricePerAssetDzd).toBe(22000);
    expect(updated.name).toContain('Tarif Négocié');
  });

  it('devrait accorder une marge de manœuvre au SuperAdmin pour négocier un prix par tenant', async () => {
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const sub = await service.getTenantSubscription(tenantId);
    expect(sub).toBeDefined();

    const negotiated = await service.updateTenantSubscription(tenantId, {
      customPricePerAssetDzd: 18000, // prix dérogatoire
      discountPercent: 10,           // remise 10%
      paymentMethod: 'CHEQUE',
      paymentTerms: 'BON_DE_COMMANDE_60J',
      notes: 'Remise autorisée par la Direction Générale suite à engagement 3 ans',
    });

    expect(negotiated.customPricePerAssetDzd).toBe(18000);
    expect(negotiated.effectivePricePerAssetDzd).toBe(16200); // 18 000 * 0.90
    expect(negotiated.paymentMethod).toBe('CHEQUE');
    expect(negotiated.paymentTerms).toBe('BON_DE_COMMANDE_60J');
  });

  it('devrait générer une facture proforma conforme DGI avec TVA 19% et droit de timbre', async () => {
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const invoice = await service.generateInvoice(tenantId, {
      invoiceType: 'PROFORMA',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
      applyStampDuty: true,
      notes: 'Proforma pour engagement budgétaire',
    });

    expect(invoice.invoiceNumber).toMatch(/^PRO-2026-DZ-/);
    expect(invoice.tvaRate).toBe(0.19);
    expect(invoice.tvaAmountDzd).toBe(Math.round(invoice.subtotalHtDzd * 0.19));
    expect(invoice.totalTtcDzd).toBe(invoice.subtotalHtDzd + invoice.tvaAmountDzd + invoice.stampDutyDzd);
  });

  it('devrait enregistrer une demande de devis client sans erreur', async () => {
    const res = await service.submitQuoteRequest('00000000-0000-0000-0000-000000000001', {
      desiredVehicleCount: 35,
      preferredBillingModel: 'PAY_PER_ACTIVE_ASSET',
      preferredPaymentMethod: 'VIREMENT_BANCAIRE',
      contactName: 'Mohamed Benali',
      contactPhone: '0550123456',
      notes: 'Flotte mixte BTP et citernes',
    });

    expect(res.success).toBe(true);
    expect(res.quoteRef).toMatch(/^DEV-2026-/);
  });
});

