import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { EInvoicingReadinessService } from './e-invoicing-readiness.service';
import { FiscalDocumentType, ALGERIA_FISCAL_RATES } from '@docteurflotte/contracts';

describe('EInvoicingReadinessService — Audit de Préparation Facturation Électronique DGI 2027', () => {
  let service: EInvoicingReadinessService;

  const tenantId = '00000000-0000-0000-0000-000000000001';

  const mockDb: any = {
    query: jest.fn(),
    withTenantContext: jest.fn((tId: string, cb: (c: any) => any) => cb(mockDb)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EInvoicingReadinessService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<EInvoicingReadinessService>(EInvoicingReadinessService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  it('doit certifier un parc 100% prêt à l\'e-facturation DGI 2027 si aucune anomalie', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'doc-1',
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FAC-2026-001',
          document_date: '2026-11-01',
          payment_method: 'BANK_TRANSFER',
          third_party_name: 'SARL TOTAL ENERGIES DZ',
          third_party_nif: '000116001234567', // 15 chiffres valide
          third_party_rc: '16/00-0123456B16',
          article_imposition_third_party: '16012345678',
          amount_ht_dzd: '500000',
          vat_amount_dzd: '95000',
          total_ttc_dzd: '595000',
          is_vat_deductible: true,
          vat_tax_point: 'DEBIT',
          is_settled: true,
          verification_status: 'VALIDATED',
          rejection_reason: null,
          sha256_fingerprint: 'abcdef123456',
        },
      ],
    });

    const report = await service.getReadinessReport(tenantId);

    expect(report.status).toBe('PRET_E_FACTURATION_2027');
    expect(report.readinessScore).toBe(100);
    expect(report.anomaliesCount).toBe(0);
    expect(report.suppliersSummary.compliantNifCount).toBe(1);
    expect(report.suppliersSummary.invalidOrMissingNifCount).toBe(0);
    expect(report.executiveChecklist.every((c) => c.status === 'CONFORME')).toBe(true);
  });

  it('doit détecter un dépassement de plafond espèces (> 1M DZD) comme bloquant DGI (Règle 5)', async () => {
    const cashCeiling = ALGERIA_FISCAL_RATES.CASH_PAYMENT_LEGAL_CEILING_DZD; // 1 000 000 DZD
    const cashTotalTtc = cashCeiling + 450_000; // 1 450 000 DZD

    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'doc-cash-fail',
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FAC-CASH-999',
          document_date: '2026-11-05',
          payment_method: 'CASH',
          third_party_name: 'ETS MECANIQUE INDUSTRIELLE',
          third_party_nif: '000116001234567',
          third_party_rc: '16/00-0123456B16',
          article_imposition_third_party: '16012345678',
          amount_ht_dzd: '1218487.39',
          vat_amount_dzd: '231512.61',
          total_ttc_dzd: String(cashTotalTtc),
          is_vat_deductible: true,
          vat_tax_point: 'DEBIT',
          is_settled: true,
          verification_status: 'SUSPICIOUS',
          rejection_reason: 'CASH_THRESHOLD_EXCEEDED',
          sha256_fingerprint: '123456abcdef',
        },
      ],
    });

    const report = await service.getReadinessReport(tenantId);

    expect(report.status).toBe('NON_CONFORME_CRITIQUE');
    expect(report.totalCashOverCeilingDzd).toBe(450_000);
    expect(report.totalVatAtRiskDzd).toBe(231512.61);

    const cashAnomaly = report.anomalies.find((a) => a.anomalyType === 'CASH_LIMIT_EXCEEDED');
    expect(cashAnomaly).toBeDefined();
    expect(cashAnomaly?.severity).toBe('BLOCKING_DGI');

    const checklistItem = report.executiveChecklist.find((c) => c.rule.includes('espèces'));
    expect(checklistItem?.status).toBe('ACTION_REQUISE');
  });

  it('doit détecter un NIF fournisseur invalide ou manquant comme bloquant DGI (Règle 6)', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'doc-nif-fail',
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FAC-NIF-000',
          document_date: '2026-11-08',
          payment_method: 'BANK_TRANSFER',
          third_party_name: 'SOCIETE SANS NIF',
          third_party_nif: '12345', // Invalide (doit être 15 ou 20 chiffres)
          third_party_rc: '',
          article_imposition_third_party: '',
          amount_ht_dzd: '100000',
          vat_amount_dzd: '19000',
          total_ttc_dzd: '119000',
          is_vat_deductible: true,
          vat_tax_point: 'DEBIT',
          is_settled: true,
          verification_status: 'SUSPICIOUS',
          rejection_reason: 'MISSING_LEGAL_MENTIONS_ART_64_CPF',
          sha256_fingerprint: '987654fedcba',
        },
      ],
    });

    const report = await service.getReadinessReport(tenantId);

    expect(report.status).toBe('NON_CONFORME_CRITIQUE');
    expect(report.suppliersSummary.invalidOrMissingNifCount).toBe(1);

    const nifAnomaly = report.anomalies.find((a) => a.anomalyType === 'INVALID_NIF');
    expect(nifAnomaly).toBeDefined();
    expect(nifAnomaly?.severity).toBe('BLOCKING_DGI');
  });
});
