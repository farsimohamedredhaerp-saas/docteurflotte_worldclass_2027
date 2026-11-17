import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { OperationalFiscalBridgeService } from './operational-fiscal-bridge.service';
import { FiscalDocumentService } from './fiscal-document.service';
import { FiscalEventService } from './fiscal-event.service';
import { FiscalProfileService } from './fiscal-profile.service';
import {
  AssetRentalInvoice,
  AssetEngineHourLog,
  EngineHourSource,
  FiscalDocumentType,
  FiscalVerificationStatus,
  SiteStatus,
} from '@docteurflotte/contracts';

describe('OperationalFiscalBridgeService — Pontage Métier Automatique Opérations / Fiscalité', () => {
  let bridgeService: OperationalFiscalBridgeService;
  let fiscalDocService: FiscalDocumentService;
  let fiscalEventService: FiscalEventService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const assetId = '11111111-1111-1111-1111-111111111111';
  const siteId = '22222222-2222-2222-2222-222222222222';
  const docId = '33333333-3333-3333-3333-333333333333';
  const eventId = '44444444-4444-4444-4444-444444444444';

  const mockDb: any = {
    query: jest.fn(),
    withTenantContext: jest.fn((tId: string, cb: (c: any) => any) => cb(mockDb)),
  };

  const mockFiscalDocService = {
    createDocument: jest.fn(),
    listDocuments: jest.fn(),
  };

  const mockFiscalEventService = {
    createEventFromDocument: jest.fn(),
    listEvents: jest.fn(),
  };

  const mockFiscalProfileService = {
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationalFiscalBridgeService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: FiscalDocumentService, useValue: mockFiscalDocService },
        { provide: FiscalEventService, useValue: mockFiscalEventService },
        { provide: FiscalProfileService, useValue: mockFiscalProfileService },
      ],
    }).compile();

    bridgeService = module.get<OperationalFiscalBridgeService>(OperationalFiscalBridgeService);
    fiscalDocService = module.get<FiscalDocumentService>(FiscalDocumentService);
    fiscalEventService = module.get<FiscalEventService>(FiscalEventService);
  });

  describe('1. Factures de Location (Module Rental -> Module Fiscal)', () => {
    it('génère automatiquement la pièce CONTRAT_LOCATION et l’événement fiscal TVA_COLLECTED (445700)', async () => {
      // 1. Mock CNRC query
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'cnrc-loc-id' }],
      });

      const invoice: AssetRentalInvoice = {
        id: 'inv-101',
        tenantId,
        invoiceNumber: 'FAC-LOC-2026-0001',
        contractId: 'contract-01',
        assetId,
        customerName: 'SARL Logistique Centre',
        customerNif: '001216000000001',
        baseDaysBilled: 5,
        baseRentalHtDzd: 100000,
        extraKmOrHoursBilled: 0,
        extraUnitsAmountDzd: 0,
        fuelPenaltyAmountDzd: 0,
        damagesDeductionsDzd: 0,
        totalHtDzd: 100000,
        vatRatePct: 19.0,
        vatAmountDzd: 19000,
        stampDutyDzd: 1190,
        totalTtcDzd: 120190,
        isPaid: false,
        issuedAt: '2026-11-16T10:00:00Z',
        createdAt: '2026-11-16T10:00:00Z',
      };

      const expectedDoc = {
        id: docId,
        tenantId,
        assetId,
        documentType: FiscalDocumentType.CONTRAT_LOCATION,
        documentNumber: 'FAC-LOC-2026-0001',
        documentDate: '2026-11-16',
        amountHtDzd: 100000,
        vatRatePct: 19.0,
        vatAmountDzd: 19000,
        stampDutyDzd: 1190,
        totalTtcDzd: 120190,
        isVatDeductible: false,
        verificationStatus: FiscalVerificationStatus.VALIDATED,
        sha256Fingerprint: 'mock-sha256',
        createdAt: '2026-11-16',
      };

      const expectedEvent = {
        id: eventId,
        tenantId,
        assetId,
        documentId: docId,
        eventType: 'TVA_COLLECTED',
        taxCategory: 'TVA',
        taxableBaseDzd: 100000,
        appliedRatePct: 19.0,
        taxAmountDzd: 19000,
        accountingAccount: '445700',
        periodYear: 2026,
        periodMonth: 11,
        createdAt: '2026-11-16',
      };

      mockFiscalDocService.createDocument.mockResolvedValueOnce(expectedDoc);
      mockFiscalEventService.createEventFromDocument.mockResolvedValueOnce(expectedEvent);

      const result = await bridgeService.bridgeRentalInvoice(tenantId, invoice);

      expect(mockFiscalDocService.createDocument).toHaveBeenCalledWith(tenantId, expect.objectContaining({
        assetId,
        documentType: FiscalDocumentType.CONTRAT_LOCATION,
        documentNumber: 'FAC-LOC-2026-0001',
        paymentMethod: 'CASH', // Car droit de timbre > 0
        amountHtDzd: 100000,
        vatAmountDzd: 19000,
        totalTtcDzd: 120190,
        isVatDeductible: false,
      }));

      expect(mockFiscalEventService.createEventFromDocument).toHaveBeenCalledWith(tenantId, docId);
      expect(result.fiscalDocument).toEqual(expectedDoc);
      expect(result.fiscalEvent).toEqual(expectedEvent);
    });
  });

  describe('2. Consommation Carburant Chantier (Module Chantiers -> Module Fiscal)', () => {
    it('ignore les relevés sans carburant consommé', async () => {
      const log: AssetEngineHourLog = {
        id: 'log-01',
        tenantId,
        assetId,
        siteId,
        recordedAt: '2026-11-16T12:00:00Z',
        hoursValue: 250,
        deltaHoursSinceLast: 8,
        source: EngineHourSource.MANUAL,
        fuelConsumedLiters: 0,
        isValidated: true,
        createdAt: '2026-11-16T12:00:00Z',
      };

      const result = await bridgeService.bridgeEngineHoursFuel(tenantId, log);
      expect(result).toBeNull();
      expect(mockFiscalDocService.createDocument).not.toHaveBeenCalled();
    });

    it('génère un ticket Naftal 100% déductible (Art. 30 TCA) et met à jour les dépenses du chantier', async () => {
      // 1. Mock CNRC
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'cnrc-btp-id' }] });
      // 2. Mock UPDATE site_workspaces
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: siteId }] });

      const log: AssetEngineHourLog = {
        id: 'log-02-abc',
        tenantId,
        assetId,
        siteId,
        recordedAt: '2026-11-16T12:00:00Z',
        hoursValue: 260,
        deltaHoursSinceLast: 10,
        source: EngineHourSource.CAN_J1939,
        fuelConsumedLiters: 100, // 100 L Gasoil
        fuelCostDzd: 2901,       // 2901 DZD TTC (29.01 DZD/L)
        isValidated: true,
        createdAt: '2026-11-16T12:00:00Z',
      };

      const expectedDoc = {
        id: docId,
        tenantId,
        assetId,
        documentType: FiscalDocumentType.TICKET_NAFTAL,
        documentNumber: 'BON-CARB-LOG-02-A',
        documentDate: '2026-11-16',
        amountHtDzd: 2437.82,
        vatRatePct: 19.0,
        vatAmountDzd: 463.18,
        totalTtcDzd: 2901,
        isVatDeductible: true,
      };

      const expectedEvent = {
        id: eventId,
        eventType: 'TVA_DEDUCTION',
        taxCategory: 'TVA',
        accountingAccount: '445600',
      };

      mockFiscalDocService.createDocument.mockResolvedValueOnce(expectedDoc);
      mockFiscalEventService.createEventFromDocument.mockResolvedValueOnce(expectedEvent);

      const result = await bridgeService.bridgeEngineHoursFuel(tenantId, log);

      expect(result).not.toBeNull();
      expect(mockFiscalDocService.createDocument).toHaveBeenCalledWith(tenantId, expect.objectContaining({
        assetId,
        costCenterType: 'BTP_CHANTIER',
        documentType: FiscalDocumentType.TICKET_NAFTAL,
        isVatDeductible: true,
        totalTtcDzd: 2901,
      }));

      // Vérification mise à jour dépenses directes chantier
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('total_expenses_dzd = total_expenses_dzd + $1'),
        [2901, siteId, tenantId],
      );
    });
  });

  describe('3. Situation de Travaux BTPH (Module Chantiers -> Module Fiscal)', () => {
    it('génère la pièce SITUATION_TRAVAUX avec retenue de garantie et incrémente le chiffre d’affaires chantier', async () => {
      // 1. Site query
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: siteId,
            code: 'CHANTIER-A1',
            name: 'Pénétrante Tipaza',
            client_name: 'DTP Tipaza',
            wilaya_code: 42,
            status: SiteStatus.ACTIVE,
            total_revenue_dzd: '5000000',
          },
        ],
      });
      // 2. Active asset query for the site
      mockDb.query.mockResolvedValueOnce({
        rows: [{ asset_id: assetId }],
      });
      // 3. CNRC query
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'cnrc-btp-id' }],
      });
      // 4. Update site revenue
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: siteId,
            tenant_id: tenantId,
            code: 'CHANTIER-A1',
            name: 'Pénétrante Tipaza',
            wilaya_code: 42,
            status: SiteStatus.ACTIVE,
            budget_allocated_dzd: 20000000,
            total_expenses_dzd: 3000000,
            total_revenue_dzd: 8000000,
            start_date: '2026-01-01',
            created_at: '2026-01-01',
            updated_at: '2026-11-16',
          },
        ],
      });

      const dto = {
        siteId,
        situationNumber: 'SIT-2026-03',
        situationDate: '2026-11-16',
        amountHtDzd: 3000000, // 3 000 000 DZD HT
        vatRatePct: 19.0,
        withholdingTaxRatePct: 5.0, // 5% retenue de garantie CMP
        clientName: 'DTP Tipaza',
        clientNif: '000142010000089',
      };

      const expectedDoc = {
        id: docId,
        documentType: FiscalDocumentType.SITUATION_TRAVAUX,
        documentNumber: 'SIT-2026-03',
        amountHtDzd: 3000000,
        vatAmountDzd: 570000,
        totalTtcDzd: 3570000,
        withholdingTaxRatePct: 5.0,
        withholdingTaxAmountDzd: 150000,
      };

      const expectedEvent = {
        id: eventId,
        eventType: 'TVA_COLLECTED',
        taxCategory: 'TVA',
        accountingAccount: '445700',
      };

      mockFiscalDocService.createDocument.mockResolvedValueOnce(expectedDoc);
      mockFiscalEventService.createEventFromDocument.mockResolvedValueOnce(expectedEvent);

      const result = await bridgeService.bridgeSiteSituation(tenantId, dto);

      expect(mockFiscalDocService.createDocument).toHaveBeenCalledWith(tenantId, expect.objectContaining({
        assetId,
        costCenterType: 'BTP_CHANTIER',
        documentType: FiscalDocumentType.SITUATION_TRAVAUX,
        documentNumber: 'SIT-2026-03',
        amountHtDzd: 3000000,
        vatAmountDzd: 570000,
        totalTtcDzd: 3570000,
        withholdingTaxRatePct: 5.0,
        withholdingTaxAmountDzd: 150000,
        isVatDeductible: false,
      }));

      expect(result.updatedSite.totalRevenueDzd).toBe(8000000);
    });

    it('rejette la situation si le chantier est introuvable', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        bridgeService.bridgeSiteSituation(tenantId, {
          siteId: 'unknown-site',
          situationNumber: 'SIT-01',
          amountHtDzd: 500000,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
