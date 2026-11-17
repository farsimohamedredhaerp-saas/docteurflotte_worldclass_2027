import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { ScfGeneralLedgerService } from './scf-general-ledger.service';
import { FiscalDocumentType } from '@docteurflotte/contracts';

describe('ScfGeneralLedgerService — Cœur Comptable Grand Livre & Balance Générale SCF', () => {
  let service: ScfGeneralLedgerService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const assetId = '11111111-1111-1111-1111-111111111111';
  const documentId = '22222222-2222-2222-2222-222222222222';

  const mockDb: any = {
    query: jest.fn(),
    withTenantContext: jest.fn((tId: string, cb: (c: any) => any) => cb(mockDb)),
    withSystemContext: jest.fn((cb: (c: any) => any) => cb(mockDb)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScfGeneralLedgerService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<ScfGeneralLedgerService>(ScfGeneralLedgerService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  it('doit transformer une facture d\'achat Naftal en écritures équilibrées (Partie double stricte)', async () => {
    // 1. Aucune écriture existante
    mockDb.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    // 2. Document fiscal source (Gasoil Naftal 100 000 DA HT + 19 000 TVA = 119 000 TTC)
    mockDb.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: documentId,
          tenant_id: tenantId,
          asset_id: assetId,
          asset_code: 'CAM-01-RENAULT',
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FAC-NAFTAL-9988',
          document_date: '2026-11-01',
          third_party_name: 'NAFTAL DISTRICT ALGER',
          third_party_nif: '000016001234567',
          amount_ht_dzd: '100000',
          vat_rate_pct: '19',
          vat_amount_dzd: '19000',
          stamp_duty_dzd: '0',
          total_ttc_dzd: '119000',
          is_vat_deductible: true,
          cost_center_type: 'FLEET_ASSET',
        },
      ],
    });

    // 3. Dernier hash chaîné
    mockDb.query.mockResolvedValueOnce({ rows: [{ sha256_hash: 'prev_hash_123' }] });

    // 4. Compte séquentiel de pièces
    mockDb.query.mockResolvedValueOnce({ rows: [{ count: '10' }] });

    // 5. Insertions des 3 lignes (Charge 606100, TVA 445600, Fournisseur 401000)
    mockDb.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'l-1', tenant_id: tenantId, entry_number: 'ACH-2026-00011-1', journal_code: 'ACH',
          entry_date: '2026-11-01', fiscal_document_id: documentId, asset_id: assetId,
          account_code: '606100', account_label: 'Carburant Naftal', description: '[CAM-01-RENAULT] Charge',
          debit_dzd: '100000', credit_dzd: '0', third_party_name: 'NAFTAL', is_validated: true,
          sha256_hash: 'hash1', previous_entry_hash: 'prev_hash_123', created_at: new Date(),
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'l-2', tenant_id: tenantId, entry_number: 'ACH-2026-00011-2', journal_code: 'ACH',
          entry_date: '2026-11-01', fiscal_document_id: documentId, asset_id: assetId,
          account_code: '445600', account_label: 'TVA déductible', description: '[CAM-01-RENAULT] TVA',
          debit_dzd: '19000', credit_dzd: '0', third_party_name: 'NAFTAL', is_validated: true,
          sha256_hash: 'hash2', previous_entry_hash: 'hash1', created_at: new Date(),
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'l-3', tenant_id: tenantId, entry_number: 'ACH-2026-00011-3', journal_code: 'ACH',
          entry_date: '2026-11-01', fiscal_document_id: documentId, asset_id: assetId,
          account_code: '401000', account_label: 'Fournisseurs', description: '[CAM-01-RENAULT] Fournisseur',
          debit_dzd: '0', credit_dzd: '119000', third_party_name: 'NAFTAL', is_validated: true,
          sha256_hash: 'hash3', previous_entry_hash: 'hash2', created_at: new Date(),
        }],
      });

    const entries = await service.postDocumentToLedger(tenantId, documentId);

    expect(entries.length).toBe(3);
    const totalDebit = entries.reduce((s, e) => s + e.debitDzd, 0);
    const totalCredit = entries.reduce((s, e) => s + e.creditDzd, 0);

    expect(totalDebit).toBe(119000);
    expect(totalCredit).toBe(119000);
    expect(totalDebit).toBe(totalCredit); // Équilibre parfait Débit = Crédit
    expect(entries[0].accountCode).toBe('606100');
    expect(entries[1].accountCode).toBe('445600');
    expect(entries[2].accountCode).toBe('401000');
  });

  it('doit générer une Balance Générale des Comptes SCF équilibrée', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { account_code: '401000', account_label: 'Fournisseurs', total_debit: '0', total_credit: '500000' },
        { account_code: '411000', account_label: 'Clients', total_debit: '800000', total_credit: '0' },
        { account_code: '445600', account_label: 'TVA déductible', total_debit: '80000', total_credit: '0' },
        { account_code: '445700', account_label: 'TVA collectée', total_debit: '0', total_credit: '128000' },
        { account_code: '606100', account_label: 'Carburant Naftal', total_debit: '420000', total_credit: '0' },
        { account_code: '706000', account_label: 'Prestations transport', total_debit: '0', total_credit: '672000' },
      ],
    });

    const balance = await service.getTrialBalance(tenantId, 2026, 11);

    expect(balance.isBalanced).toBe(true);
    expect(balance.totalDebitSumDzd).toBe(800000 + 80000 + 420000); // 1 300 000
    expect(balance.totalCreditSumDzd).toBe(500000 + 128000 + 672000); // 1 300 000
    expect(balance.discrepancyDzd).toBe(0);
    expect(balance.accounts.length).toBe(6);
  });
});

