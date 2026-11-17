import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { PartnerAccountingExportService } from './partner-accounting-export.service';
import { FiscalDocumentType } from '@docteurflotte/contracts';

describe('PartnerAccountingExportService — Passerelle d\'Export Comptable Partenaire 1-Clic', () => {
  let service: PartnerAccountingExportService;

  const tenantId = '00000000-0000-0000-0000-000000000001';

  const mockDb: any = {
    query: jest.fn(),
    withTenantContext: jest.fn((tId: string, cb: (c: any) => any) => cb(mockDb)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerAccountingExportService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<PartnerAccountingExportService>(PartnerAccountingExportService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  it('doit générer un fichier PC Compta DGI conforme avec les comptes SCF algériens', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'doc-ach-1',
          document_type: FiscalDocumentType.FACTURE_FOURNISSEUR,
          document_number: 'FAC-NAFTAL-2026',
          document_date: '2026-11-10',
          third_party_name: 'NAFTAL SPA DISTRICT ALGER',
          third_party_nif: '000016001234567',
          third_party_rc: '16/00-0001234B16',
          article_imposition_third_party: '16012345678',
          amount_ht_dzd: '100000',
          vat_rate_pct: '19',
          vat_amount_dzd: '19000',
          stamp_duty_dzd: '0',
          total_ttc_dzd: '119000',
          is_vat_deductible: true,
          cost_center_type: 'FLEET_ASSET',
          asset_code: 'CAM-01',
          sha256_fingerprint: 'abcdef1234567890',
        },
        {
          id: 'doc-vte-1',
          document_type: FiscalDocumentType.CONTRAT_LOCATION,
          document_number: 'LOC-CLIENT-001',
          document_date: '2026-11-12',
          third_party_name: 'COSIDER TP',
          third_party_nif: '000116009876543',
          third_party_rc: '16/00-9876543B16',
          article_imposition_third_party: '16098765432',
          amount_ht_dzd: '400000',
          vat_rate_pct: '19',
          vat_amount_dzd: '76000',
          stamp_duty_dzd: '0',
          total_ttc_dzd: '476000',
          is_vat_deductible: false,
          cost_center_type: 'BTP_CHANTIER',
          asset_code: 'ENG-02',
          sha256_fingerprint: '1234567890abcdef',
        },
      ],
    });

    const exportResult = await service.exportAccounting(tenantId, 'PC_COMPTA_DGI', 2026, 11);

    expect(exportResult.format).toBe('PC_COMPTA_DGI');
    expect(exportResult.checksumSha256).toBeDefined();
    expect(exportResult.checksumSha256.length).toBe(64);
    expect(exportResult.entriesCount).toBeGreaterThan(0);

    const content = exportResult.rawContent;
    expect(content).toContain('Date;Journal;Compte;Piece;Libelle;Debit;Credit');
    expect(content).toContain('ACH;606100;FAC-NAFTAL-2026;[CAM-01] NAFTAL SPA DISTRICT ALGER;100000.00;0.00');
    expect(content).toContain('ACH;445600;FAC-NAFTAL-2026;[CAM-01] TVA Deductible;19000.00;0.00');
    expect(content).toContain('ACH;401000;FAC-NAFTAL-2026;[CAM-01] NAFTAL SPA DISTRICT ALGER;0.00;119000.00');
    expect(content).toContain('VTE;411000;LOC-CLIENT-001;[ENG-02] COSIDER TP;476000.00;0.00');
    expect(content).toContain('VTE;706000;LOC-CLIENT-001;[ENG-02] Prestations/Ventes;0.00;400000.00');
    expect(content).toContain('VTE;445700;LOC-CLIENT-001;[ENG-02] TVA Collectee;0.00;76000.00');
  });

  it('doit générer un payload JSON conforme pour Odoo et Almawarid', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'doc-1',
          document_type: FiscalDocumentType.FACTURE_CLIENT,
          document_number: 'FAC-CLI-2026',
          document_date: '2026-11-15',
          third_party_name: 'SONATRACH DP',
          third_party_nif: '000016009999999',
          third_party_rc: '16/00-9999999B16',
          article_imposition_third_party: '16099999999',
          amount_ht_dzd: '1500000',
          vat_rate_pct: '19',
          vat_amount_dzd: '285000',
          stamp_duty_dzd: '0',
          total_ttc_dzd: '1785000',
          is_vat_deductible: false,
          cost_center_type: 'FLEET_ASSET',
          asset_code: 'TRACT-01',
          sha256_fingerprint: 'abcdef0000111122',
        },
      ],
    });

    const exportResult = await service.exportAccounting(tenantId, 'ODOO_ALMAWARID_JSON', 2026, 11);

    expect(exportResult.format).toBe('ODOO_ALMAWARID_JSON');
    const parsed = JSON.parse(exportResult.rawContent);
    expect(parsed.meta.schema).toBe('ALMAWARID_ODOO_DZ_SCF_V1');
    expect(parsed.invoices.length).toBe(1);
    expect(parsed.invoices[0].move_type).toBe('out_invoice');
    expect(parsed.invoices[0].partner.vat_nif).toBe('000016009999999');
    expect(parsed.invoices[0].currency).toBe('DZD');
  });
});
