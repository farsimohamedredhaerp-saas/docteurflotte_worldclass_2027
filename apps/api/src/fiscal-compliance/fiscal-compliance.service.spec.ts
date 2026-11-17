import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FiscalProfileService } from './services/fiscal-profile.service';
import { FiscalDocumentService } from './services/fiscal-document.service';
import { FiscalEventService } from './services/fiscal-event.service';
import { DeclarationDraftService } from './services/declaration-draft.service';
import { FiscalAuditService } from './services/fiscal-audit.service';
import { FiscalProfileConfiguredGuard } from './guards/fiscal-profile.guard';
import {
  FiscalDocumentType,
  TaxRegimeDZ,
  FiscalDeclarationStatus,
  AssetCategory,
} from '@docteurflotte/contracts';

describe('Module G — Fiscal Compliance & Ledger (Porte 1)', () => {
  let profileService: FiscalProfileService;
  let documentService: FiscalDocumentService;
  let eventService: FiscalEventService;
  let draftService: DeclarationDraftService;
  let auditService: FiscalAuditService;
  let guard: FiscalProfileConfiguredGuard;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const otherTenantId = '22222222-2222-2222-2222-222222222222';
  const mockAssetId = '33333333-3333-3333-3333-333333333333';
  const mockDocId = '44444444-4444-4444-4444-444444444444';
  const mockDraftId = '55555555-5555-5555-5555-555555555555';

  const mockDbClient = {
    query: jest.fn(),
  };

  const mockDatabaseService = {
    withTenantContext: jest.fn((tenantId, cb) => cb(mockDbClient)),
    getPool: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalProfileService,
        FiscalDocumentService,
        FiscalEventService,
        DeclarationDraftService,
        FiscalAuditService,
        FiscalProfileConfiguredGuard,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    profileService = module.get<FiscalProfileService>(FiscalProfileService);
    documentService = module.get<FiscalDocumentService>(FiscalDocumentService);
    eventService = module.get<FiscalEventService>(FiscalEventService);
    draftService = module.get<DeclarationDraftService>(DeclarationDraftService);
    auditService = module.get<FiscalAuditService>(FiscalAuditService);
    guard = module.get<FiscalProfileConfiguredGuard>(FiscalProfileConfiguredGuard);
  });

  describe('1. Cartographie & Intégrité Asset-Centric', () => {
    it('refuse la création d\'un document fiscal sans asset_id', async () => {
      await expect(
        documentService.createDocument(mockTenantId, {
          documentType: FiscalDocumentType.TICKET_NAFTAL,
          documentNumber: 'NFT-2026-001',
          documentDate: '2026-11-16',
          amountHtDzd: 3100,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse la création si asset_id est inconnu en base', async () => {
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(
        documentService.createDocument(mockTenantId, {
          assetId: '00000000-0000-0000-0000-000000000000',
          documentType: FiscalDocumentType.TICKET_NAFTAL,
          documentNumber: 'NFT-2026-002',
          documentDate: '2026-11-16',
          amountHtDzd: 3100,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuse la création si asset_id appartient à un autre tenant (fuite inter-tenant bloquée)', async () => {
      // Simule que la requête filtrée par WHERE id = $1 AND tenant_id = $2 renvoie 0 lignes
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(
        documentService.createDocument(mockTenantId, {
          assetId: mockAssetId, // Appartient en réalité à otherTenantId
          documentType: FiscalDocumentType.TICKET_NAFTAL,
          documentNumber: 'NFT-2026-003',
          documentDate: '2026-11-16',
          amountHtDzd: 3100,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuse d\'enregistrer une dépense sur un actif décommissionné', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: '00412-116-17', status: 'DECOMMISSIONED' }],
      });

      await expect(
        documentService.createDocument(mockTenantId, {
          assetId: mockAssetId,
          documentType: FiscalDocumentType.TICKET_NAFTAL,
          documentNumber: 'NFT-2026-004',
          documentDate: '2026-11-16',
          amountHtDzd: 3100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Ingestion Document & Qualification Fiscale Déterministe', () => {
    it('qualifie la TVA gazole comme 100% déductible pour un HEAVY_TRUCK (Poids Lourd)', async () => {
      // 1. Asset check
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: '00412-116-17', category: AssetCategory.HEAVY_TRUCK, status: 'OPERATIONAL' }],
      });
      // 2. Duplicate check
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      // 3. Insert doc
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.TICKET_NAFTAL,
          document_number: 'NFT-2026-100',
          document_date: '2026-11-16',
          amount_ht_dzd: '10000.00',
          vat_rate_pct: '19.00',
          vat_amount_dzd: '1900.00',
          stamp_duty_dzd: '0.00',
          total_ttc_dzd: '11900.00',
          is_vat_deductible: true,
          verification_status: 'VALIDATED',
          sha256_fingerprint: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.TICKET_NAFTAL,
        documentNumber: 'NFT-2026-100',
        documentDate: '2026-11-16',
        amountHtDzd: 10000,
      });

      expect(doc.isVatDeductible).toBe(true);
      expect(doc.vatAmountDzd).toBe(1900);
    });

    it('exclut la déductibilité de la TVA sur carburant pour un ROAD_VEHICLE (Art. 30 Code TCA)', async () => {
      // 1. Asset check
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: '01894-112-16', category: AssetCategory.ROAD_VEHICLE, status: 'OPERATIONAL' }],
      });
      // 2. Duplicate check
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      // 3. Insert doc
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.TICKET_NAFTAL,
          document_number: 'NFT-VP-001',
          document_date: '2026-11-16',
          amount_ht_dzd: '5000.00',
          vat_rate_pct: '19.00',
          vat_amount_dzd: '950.00',
          stamp_duty_dzd: '0.00',
          total_ttc_dzd: '5950.00',
          is_vat_deductible: false, // EXCLU !
          deductibility_rationale: 'Art. 30 Code TCA : Exclusion du droit à déduction',
          verification_status: 'VALIDATED',
          sha256_fingerprint: '123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef1234',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.TICKET_NAFTAL,
        documentNumber: 'NFT-VP-001',
        documentDate: '2026-11-16',
        amountHtDzd: 5000,
      });

      expect(doc.isVatDeductible).toBe(false);
      expect(doc.deductibilityRationale).toContain('Art. 30 Code TCA');
    });

    it('qualifie les amendes routières comme non déductibles de l\'IBS (Art. 169 CIDTA)', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: '00412-116-17', category: AssetCategory.HEAVY_TRUCK, status: 'OPERATIONAL' }],
      });
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.AMENDE,
          document_number: 'PV-RADAR-2026-99',
          document_date: '2026-11-16',
          amount_ht_dzd: '10000.00',
          vat_rate_pct: '0.00',
          vat_amount_dzd: '0.00',
          stamp_duty_dzd: '0.00',
          total_ttc_dzd: '10000.00',
          is_vat_deductible: false,
          deductibility_rationale: 'Art. 169 CIDTA : Amendes non déductibles',
          verification_status: 'VALIDATED',
          sha256_fingerprint: '999999abcdef',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.AMENDE,
        documentNumber: 'PV-RADAR-2026-99',
        documentDate: '2026-11-16',
        amountHtDzd: 10000,
      });

      expect(doc.isVatDeductible).toBe(false);
      expect(doc.vatAmountDzd).toBe(0);
    });

    it('applique la dérogation VP (Art. 41 TCA & 141-2 CIDTA) lorsque le véhicule de tourisme est un outil de travail principal', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockAssetId,
          code: '01894-112-16',
          category: AssetCategory.ROAD_VEHICLE,
          status: 'OPERATIONAL',
          physics_state: { is_core_business_tool: true, fiscal_usage_purpose: 'EXPLOITATION_PRINCIPALE' },
        }],
      });
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.TICKET_NAFTAL,
          document_number: 'NFT-VP-DEROG-001',
          document_date: '2026-11-16',
          amount_ht_dzd: '8000.00',
          vat_rate_pct: '19.00',
          vat_amount_dzd: '1520.00',
          stamp_duty_dzd: '0.00',
          total_ttc_dzd: '9520.00',
          is_vat_deductible: true,
          deductibility_rationale: 'Art. 41 TCA & Art. 141-2 CIDTA : Dérogation outil de travail principal (Location / Auto-école / Transport) - TVA 100% déductible.',
          verification_status: 'VALIDATED',
          sha256_fingerprint: 'abcdef9876543210abcdef9876543210',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.TICKET_NAFTAL,
        documentNumber: 'NFT-VP-DEROG-001',
        documentDate: '2026-11-16',
        amountHtDzd: 8000,
      });

      expect(doc.isVatDeductible).toBe(true);
      expect(doc.vatAmountDzd).toBe(1520);
      expect(doc.deductibilityRationale).toContain('Art. 41 TCA & Art. 141-2 CIDTA');
    });

    it('exclut la déductibilité de la TVA et de la charge en cas de paiement en espèces dépassant 1 000 000 DZD TTC', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: '00412-116-17', category: AssetCategory.HEAVY_TRUCK, status: 'OPERATIONAL' }],
      });
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FACT-CASH-OVERLIMIT',
          document_date: '2026-11-16',
          payment_method: 'CASH',
          amount_ht_dzd: '1200000.00',
          vat_rate_pct: '19.00',
          vat_amount_dzd: '228000.00',
          stamp_duty_dzd: '0.00',
          total_ttc_dzd: '1428000.00',
          is_vat_deductible: false,
          deductibility_rationale: 'Art. 30 TCA & CIDTA : Plafond espèces dépassé (> 1 000 000 DZD TTC). Exclusion du droit à déduction TVA et charge.',
          verification_status: 'VALIDATED',
          sha256_fingerprint: 'cashlimitfingerprint1234567890',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.FACTURE_FOURNISSEUR,
        documentNumber: 'FACT-CASH-OVERLIMIT',
        documentDate: '2026-11-16',
        amountHtDzd: 1200000,
        paymentMethod: 'CASH',
      });

      expect(doc.isVatDeductible).toBe(false);
      expect(doc.deductibilityRationale).toContain('Plafond espèces dépassé');
    });

    it('applique l\'exonération d\'achat en franchise de TVA sous attestation F20/F21', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: '00412-116-17', category: AssetCategory.HEAVY_TRUCK, status: 'OPERATIONAL' }],
      });
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FACT-F20-AAPI',
          document_date: '2026-11-16',
          amount_ht_dzd: '500000.00',
          vat_rate_pct: '0.00',
          vat_amount_dzd: '0.00',
          stamp_duty_dzd: '0.00',
          total_ttc_dzd: '500000.00',
          is_vat_exempt_f20: true,
          f20_certificate_number: 'F20-AAPI-2026-088',
          is_vat_deductible: false,
          deductibility_rationale: 'Attestation F20/F21 n°F20-AAPI-2026-088 : Achat en franchise de TVA.',
          verification_status: 'VALIDATED',
          sha256_fingerprint: 'f20fingerprint1234567890',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.FACTURE_FOURNISSEUR,
        documentNumber: 'FACT-F20-AAPI',
        documentDate: '2026-11-16',
        amountHtDzd: 500000,
        isVatExemptF20: true,
        f20CertificateNumber: 'F20-AAPI-2026-088',
      });

      expect(doc.vatRatePct).toBe(0);
      expect(doc.vatAmountDzd).toBe(0);
      expect(doc.isVatExemptF20).toBe(true);
      expect(doc.deductibilityRationale).toContain('F20/F21');
    });

    it('autorise la création d\'un document fiscal hors-flotte sans asset_id avec cost_center_type', async () => {
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: null,
          cost_center_type: 'ADMINISTRATIVE_OVERHEAD',
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FACT-LOYER-SIEGE-2026',
          document_date: '2026-11-16',
          amount_ht_dzd: '150000.00',
          vat_rate_pct: '19.00',
          vat_amount_dzd: '28500.00',
          stamp_duty_dzd: '0.00',
          total_ttc_dzd: '178500.00',
          is_vat_deductible: true,
          verification_status: 'VALIDATED',
          sha256_fingerprint: 'overheadfingerprint1234567890',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        costCenterType: 'ADMINISTRATIVE_OVERHEAD' as any,
        documentType: FiscalDocumentType.FACTURE_FOURNISSEUR,
        documentNumber: 'FACT-LOYER-SIEGE-2026',
        documentDate: '2026-11-16',
        amountHtDzd: 150000,
      });

      expect(doc.assetId).toBeUndefined();
      expect(doc.costCenterType).toBe('ADMINISTRATIVE_OVERHEAD');
      expect(doc.vatAmountDzd).toBe(28500);
    });
  });

  describe('3. Intégration Moteur Décisionnel packages/decision-engine & Événements Fiscaux', () => {
    it('génère un événement fiscal qualifié avec rule_id et rule_version stockés', async () => {
      // 1. Doc query
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          asset_code: '00412-116-17',
          asset_category: AssetCategory.HEAVY_TRUCK,
          document_type: FiscalDocumentType.TICKET_NAFTAL,
          document_number: 'NFT-2026-100',
          document_date: '2026-11-16',
          amount_ht_dzd: '10000.00',
          vat_rate_pct: '19.00',
          vat_amount_dzd: '1900.00',
          is_vat_deductible: true,
        }],
      });
      // 2. Rule query
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ rule_code: 'TVA_DEDUCTIBLE_CARBURANT_UTILITAIRE', tax_type: 'TVA_DEDUCTIBLE' }],
      });
      // 3. Event insert
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'event-uuid-1',
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          fiscal_document_id: mockDocId,
          event_type: 'TVA_DEDUCTION',
          tax_category: 'TVA',
          taxable_base_dzd: '10000.00',
          applied_rate_pct: '19.00',
          tax_amount_dzd: '1900.00',
          accounting_account: '445600',
          period_year: 2026,
          period_month: 11,
          fiscal_rule_id: 'TVA_DEDUCTIBLE_CARBURANT_UTILITAIRE',
          rule_version: '1.0',
          engine_used: 'TVA_ENGINE',
          sha256_seal: 'seal-sha256-abcdef',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const event = await eventService.createEventFromDocument(mockTenantId, mockDocId);

      expect(event.eventType).toBe('TVA_DEDUCTION');
      expect(event.accountingAccount).toBe('445600');
      expect(event.taxAmountDzd).toBe(1900);
      expect(event.taxCategory).toBe('TVA');
    });
  });

  describe('4. Déclarations G50 & Scellement SHA-256 Immuable', () => {
    it('consolide les montants par actif dans le brouillon G50', async () => {
      // 1. Events query
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          {
            asset_id: mockAssetId,
            asset_code: '00412-116-17',
            event_type: 'TVA_DEDUCTION',
            taxable_base_dzd: '10000.00',
            tax_amount_dzd: '1900.00',
          },
          {
            asset_id: mockAssetId,
            asset_code: '00412-116-17',
            event_type: 'TVA_NON_DEDUCTIBLE',
            taxable_base_dzd: '5000.00',
            tax_amount_dzd: '950.00',
          },
        ],
      });
      // 2. Missing receipts check (0 missing)
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ count: '0' }],
      });
      // 3. Insert or update draft
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDraftId,
          tenant_id: mockTenantId,
          period_year: 2026,
          period_month: 11,
          declaration_type: 'G50_MONTHLY',
          total_taxable_revenue_dzd: '0.00',
          total_vat_collected_dzd: '0.00',
          total_vat_deductible_dzd: '1900.00',
          net_vat_payable_dzd: '0.00',
          tap_amount_dzd: '0.00',
          stamp_duty_total_dzd: '0.00',
          total_due_dzd: '0.00',
          status: 'VALIDATED',
          breakdown_by_asset: {
            [mockAssetId]: {
              assetCode: '00412-116-17',
              vatDeductibleDzd: 1900,
              vatExcludedDzd: 950,
              totalExpenseDzd: 15000,
              itemsCount: 2,
            },
          },
          missing_receipts_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const draft = await draftService.generateMonthlyDraft(mockTenantId, 2026, 11);

      expect(draft.status).toBe(FiscalDeclarationStatus.VALIDATED);
      expect(draft.totalVatDeductibleDzd).toBe(1900);
      expect(draft.breakdownByAsset[mockAssetId].vatDeductibleDzd).toBe(1900);
    });

    it('interdit le scellement d\'une déclaration si des pièces justificatives sont manquantes', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDraftId,
          tenant_id: mockTenantId,
          status: 'DRAFT',
          missing_receipts_count: 3, // 3 pièces manquantes !
        }],
      });

      await expect(
        draftService.sealDeclaration(mockTenantId, mockDraftId, 'auditor@farsi.dz'),
      ).rejects.toThrow(BadRequestException);
    });

    it('scelle avec empreinte SHA-256 et Merkle leaf si 0 pièce manquante', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDraftId,
          tenant_id: mockTenantId,
          period_year: 2026,
          period_month: 11,
          declaration_type: 'G50_MONTHLY',
          total_taxable_revenue_dzd: '100000.00',
          total_vat_collected_dzd: '19000.00',
          total_vat_deductible_dzd: '15000.00',
          net_vat_payable_dzd: '4000.00',
          total_due_dzd: '4000.00',
          breakdown_by_asset: {},
          missing_receipts_count: 0,
          status: 'VALIDATED',
        }],
      });

      // Insert seal
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'seal-uuid-1',
          sealed_at: new Date(),
        }],
      });

      // Update draft
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDraftId,
          tenant_id: mockTenantId,
          period_year: 2026,
          period_month: 11,
          status: 'SEALED',
          total_due_dzd: '4000.00',
          missing_receipts_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const res = await draftService.sealDeclaration(mockTenantId, mockDraftId, 'auditor@farsi.dz');

      expect(res.draft.status).toBe(FiscalDeclarationStatus.SEALED);
      expect(res.seal.sha256Hash).toBeDefined();
      expect(res.seal.sha256Hash.length).toBe(64);
      expect(res.seal.merkleLeaf.length).toBe(64);
    });
  });

  describe('5. Guard de Profil Fiscal (Mode Lecture Seule)', () => {
    it('autorise les requêtes GET même si le profil fiscal n\'est pas encore configuré', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            tenantId: mockTenantId,
          }),
        }),
      } as any;

      const canActivate = await guard.canActivate(mockContext);
      expect(canActivate).toBe(true);
    });

    it('bloque les mutations POST si le profil fiscal n\'est pas configuré', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ is_configured: false }],
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            tenantId: mockTenantId,
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow();
    });
  });

  describe('6. Multi-Activités CNRC & Gestion des Régimes', () => {
    it('récupère la liste des activités CNRC déclarées pour le tenant', async () => {
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          {
            id: 'cnrc-1',
            tenant_id: mockTenantId,
            cnrc_code: '601.101',
            activity_label: 'Transport public routier de marchandises',
            fiscal_segment: 'COMMERCE_SERVICES',
            ifu_segment: null,
            is_subject_to_tls: false,
            is_primary: true,
            created_at: new Date(),
          },
          {
            id: 'cnrc-2',
            tenant_id: mockTenantId,
            cnrc_code: '109.201',
            activity_label: 'Travaux publics et terrassement',
            fiscal_segment: 'BTPH_HYDRAULIQUE',
            ifu_segment: null,
            is_subject_to_tls: false,
            is_primary: false,
            created_at: new Date(),
          },
        ],
      });

      const list = await profileService.getCnrcActivities(mockTenantId);
      expect(list).toHaveLength(2);
      expect(list[0].cnrcCode).toBe('601.101');
      expect(list[0].isPrimary).toBe(true);
      expect(list[1].fiscalSegment).toBe('BTPH_HYDRAULIQUE');
    });

    it('ajoute une activité CNRC avec mise à jour du statut d\'activité primaire', async () => {
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 1 });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'cnrc-new',
          tenant_id: mockTenantId,
          cnrc_code: '101.101',
          activity_label: 'Extraction et raffinage',
          fiscal_segment: 'PRODUCTION_BIENS',
          ifu_segment: null,
          is_subject_to_tls: true,
          is_primary: true,
          created_at: new Date(),
        }],
      });

      const res = await profileService.createCnrcActivity(mockTenantId, {
        cnrcCode: '101.101',
        activityLabel: 'Extraction et raffinage',
        fiscalSegment: 'PRODUCTION_BIENS',
        isSubjectToTls: true,
        isPrimary: true,
      });

      expect(res.cnrcCode).toBe('101.101');
      expect(res.isPrimary).toBe(true);
      expect(res.isSubjectToTls).toBe(true);
      expect(res.fiscalSegment).toBe('PRODUCTION_BIENS');
    });

    it('supprime une activité CNRC existante', async () => {
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 1 });

      const success = await profileService.deleteCnrcActivity(mockTenantId, 'cnrc-1');
      expect(success).toBe(true);
    });
  });

  describe('7. Règles de Contrôle Section 5 (Règles 5 à 8)', () => {
    it('Règle 5 : Plafond espèces > 1 000 000 DZD lève CASH_THRESHOLD_EXCEEDED, exclut la TVA et génère IBS_TAX_REINTEGRATION', async () => {
      // Actif camion lourd
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: 'ACT-01', category: AssetCategory.HEAVY_TRUCK, physics_state: {} }],
      });
      // Pas de doublon
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      // Insert doc avec statut SUSPICIOUS
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FAC-CASH-OVER',
          document_date: '2026-11-16',
          payment_method: 'CASH',
          amount_ht_dzd: '1200000',
          vat_rate_pct: '19',
          vat_amount_dzd: '228000',
          stamp_duty_dzd: '0',
          total_ttc_dzd: '1428000',
          is_vat_deductible: false,
          verification_status: 'SUSPICIOUS',
          rejection_reason: 'CASH_THRESHOLD_EXCEEDED: Facture réglée en espèces excédant le seuil légal de 1 000 000 DZD TTC',
          sha256_fingerprint: 'hash-cash',
          created_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.FACTURE_FOURNISSEUR,
        documentNumber: 'FAC-CASH-OVER',
        documentDate: '2026-11-16',
        paymentMethod: 'CASH',
        amountHtDzd: 1200000,
        vatRatePct: 19,
        totalTtcDzd: 1428000,
        thirdPartyNif: '00012345678901234567',
        thirdPartyRc: '16/00-1234567B16',
        articleImpositionThirdParty: '16010012345',
      });

      expect(doc.isVatDeductible).toBe(false);
      expect(doc.verificationStatus).toBe('SUSPICIOUS');
      expect(doc.rejectionReason).toContain('CASH_THRESHOLD_EXCEEDED');

      // Qualification événement fiscal -> doit générer IBS_TAX_REINTEGRATION
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          ...doc,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          asset_code: 'ACT-01',
          asset_category: AssetCategory.HEAVY_TRUCK,
          rejection_reason: doc.rejectionReason,
        }],
      });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ rule_code: 'IBS_REINTEGRATION_RULE' }],
      });
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'ev-reint-cash',
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          fiscal_document_id: mockDocId,
          event_type: 'IBS_TAX_REINTEGRATION',
          tax_category: 'IBS',
          taxable_base_dzd: '1200000',
          applied_rate_pct: '0',
          tax_amount_dzd: '1200000',
          accounting_account: '658000',
          period_year: 2026,
          period_month: 11,
          fiscal_rule_id: 'IBS_REINTEGRATION_RULE',
          rule_version: '1.0',
          engine_used: 'IBS_ENGINE',
          reintegration_type: 'CASH_PAYMENT_EXCESS_ART_30',
          sha256_seal: 'seal-reint-cash',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const event = await eventService.createEventFromDocument(mockTenantId, mockDocId);
      expect(event.eventType).toBe('IBS_TAX_REINTEGRATION');
      expect(event.taxCategory).toBe('IBS');
      expect(event.accountingAccount).toBe('658000');
    });

    it('Règle 6 : Mentions légales obligatoires du Tiers invalides (NIF/RC/Article - Art. 64 CPF) suspendent la déduction TVA', async () => {
      // Actif camion
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: mockAssetId, code: 'ACT-01', category: AssetCategory.HEAVY_TRUCK, physics_state: {} }],
      });
      // Pas de doublon
      mockDbClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      // Insert doc rejeté selon Art. 64 CPF
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDocId,
          tenant_id: mockTenantId,
          asset_id: mockAssetId,
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FAC-FOURN-NON-CONFORME',
          document_date: '2026-11-16',
          amount_ht_dzd: '50000',
          vat_rate_pct: '19',
          vat_amount_dzd: '9500',
          total_ttc_dzd: '59500',
          is_vat_deductible: false,
          verification_status: 'SUSPICIOUS',
          rejection_reason: 'MISSING_LEGAL_MENTIONS_ART_64_CPF: Mentions légales du tiers non conformes',
          sha256_fingerprint: 'hash-nif-invalid',
          created_at: new Date(),
        }],
      });

      const doc = await documentService.createDocument(mockTenantId, {
        assetId: mockAssetId,
        documentType: FiscalDocumentType.FACTURE_FOURNISSEUR,
        documentNumber: 'FAC-FOURN-NON-CONFORME',
        documentDate: '2026-11-16',
        paymentMethod: 'BANK_TRANSFER',
        amountHtDzd: 50000,
        vatRatePct: 19,
        thirdPartyNif: '12345', // Invalide : ni 15 ni 20 chiffres
        thirdPartyRc: '', // Manquant
        articleImpositionThirdParty: '', // Manquant
      });

      expect(doc.isVatDeductible).toBe(false);
      expect(doc.verificationStatus).toBe('SUSPICIOUS');
      expect(doc.rejectionReason).toContain('MISSING_LEGAL_MENTIONS_ART_64_CPF');
    });

    it('Règle 7 : Fait générateur hybride (Prestation BTP non encore encaissée non exigible sur G50 courante)', async () => {
      // 1. Agrégation des événements avec une situation BTP non encaissée (is_settled = false)
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          {
            id: 'ev-1',
            asset_id: mockAssetId,
            asset_code: 'ACT-01',
            event_type: 'TVA_DEDUCTION',
            tax_amount_dzd: '1900',
            taxable_base_dzd: '10000',
            vat_tax_point: 'DEBIT',
            is_settled: true,
          },
          {
            id: 'ev-2',
            asset_id: mockAssetId,
            asset_code: 'ACT-01',
            event_type: 'TVA_COLLECTED',
            tax_amount_dzd: '95000',
            taxable_base_dzd: '500000',
            vat_tax_point: 'ENCAISSEMENT',
            is_settled: false, // NON ENCAISSÉ -> TVA non encore exigible selon Art. 14 TCA
          },
        ],
      });

      // 2. Pièces manquantes (0)
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ count: 0 }],
      });

      // 3. Sauvegarde du brouillon
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: mockDraftId,
          tenant_id: mockTenantId,
          period_year: 2026,
          period_month: 11,
          declaration_type: 'G50_MONTHLY',
          total_taxable_revenue_dzd: '0', // Car situation non encaissée non appelée
          total_vat_collected_dzd: '0',   // 0 DZD exigible
          total_vat_deductible_dzd: '1900',
          net_vat_payable_dzd: '0',       // Crédit reportable
          tap_amount_dzd: '0',
          stamp_duty_total_dzd: '0',
          total_due_dzd: '0',
          status: 'VALIDATED',
          breakdown_by_asset: {},
          missing_receipts_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const draft = await draftService.generateMonthlyDraft(mockTenantId, 2026, 11);
      expect(draft.totalVatCollectedDzd).toBe(0); // TVA sur situation non encaissée n'a pas été appelée
      expect(draft.totalVatDeductibleDzd).toBe(1900);
      expect(draft.netVatPayableDzd).toBe(0);
    });

    it('Règle 8 : Génération automatique du Tableau 9 SCF avec réintégration des amendes et de l\'amortissement excédentaire VP > 3 000 000 DZD', async () => {
      // 1. Profil fiscal
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ tenant_id: mockTenantId, legal_name: 'SARL LOGISTIQUE DZ', nif: '000123456789012', tax_regime: 'REEL_NORMAL' }],
      });

      // 2. Activités CNRC
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ fiscal_segment: 'BTPH_TOURISME' }], // Taux IBS 23%
      });

      // 3. Événements fiscaux de l'exercice avec amende (Art. 169 CIDTA) et cash excess
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          {
            event_type: 'IBS_TAX_REINTEGRATION',
            reintegration_type: 'AMENDE_PENALITE_ART_169',
            taxable_base_dzd: '25000', // 25 000 DZD d'amende
            tax_amount_dzd: '25000',
          },
          {
            event_type: 'IBS_TAX_REINTEGRATION',
            reintegration_type: 'CASH_PAYMENT_EXCESS_ART_30',
            taxable_base_dzd: '1200000', // 1 200 000 DZD en espèces
            tax_amount_dzd: '1200000',
          },
        ],
      });

      // 4. Actifs VP pour calcul de l'excédent d'amortissement (> 3 000 000 DZD, Art. 141-2 CIDTA)
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'asset-vp-1',
          code: 'VP-PASSAT',
          category: 'ROAD_VEHICLE',
          physics_state: {
            acquisition_cost_dzd: 5000000, // 5 000 000 DZD (plafond 3 000 000 DZD)
            is_core_business_tool: false,  // Non dérogatoire
          },
        }],
      });

      // 5. CA total de l'exercice
      mockDbClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ total_rev: '20000000' }], // 20 000 000 DZD de CA
      });

      const tab9 = await draftService.generateTableau9(mockTenantId, 2026);

      // Amortissement excédentaire : (5 000 000 - 3 000 000) / 5 ans = 400 000 DZD/an
      expect(tab9.reintegrations.penaltiesAndFinesDzd).toBe(25000);
      expect(tab9.reintegrations.cashPaymentsOverCeilingDzd).toBe(1200000);
      expect(tab9.reintegrations.excessDepreciationVpDzd).toBe(400000);
      expect(tab9.reintegrations.totalReintegrationsDzd).toBe(25000 + 1200000 + 400000);
      expect(tab9.appliedIbsRatePct).toBe(23); // BTPH_TOURISME
      expect(tab9.sha256Seal).toBeDefined();
    });
  });
});

