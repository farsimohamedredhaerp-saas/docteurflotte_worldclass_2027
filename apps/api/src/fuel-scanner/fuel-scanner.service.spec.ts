import { Test, TestingModule } from '@nestjs/testing';
import { FuelScannerService } from './fuel-scanner.service';
import { DatabaseService } from '../database/database.service';
import { OllamaSovereignService } from '../copilot/ollama-sovereign.service';

describe('FuelScannerService', () => {
  let service: FuelScannerService;
  let ollamaService: OllamaSovereignService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'ast-01',
            code: 'VEH-016-ALG',
            name: 'Renault Kangoo 1.5 dCi',
            category: 'LIGHT_COMMERCIAL',
            status: 'ACTIVE',
          },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FuelScannerService,
        OllamaSovereignService,
        {
          provide: DatabaseService,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<FuelScannerService>(FuelScannerService);
    ollamaService = module.get<OllamaSovereignService>(OllamaSovereignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should scan Naftal ticket and reconcile perfectly when volume matches', async () => {
    const res = await service.scanAndReconcile(
      {
        assetId: 'ast-01',
        receiptTextRaw: 'STATION NAFTAL CHERAGA\nGASOIL\n48.5 LITRES\nTOTAL: 1407 DA',
      },
      'tenant-test',
    );

    expect(res.fuelType).toBe('Gasoil');
    expect(res.reconciliation.reconciliationStatus).toBe('VERIFIED');
    expect(res.reconciliation.isLocationVerified).toBe(true);
    expect(res.status).toBe('APPROVED');
  });

  it('should fallback to Qwen JSON extraction when OCR text has non-standard formatting', async () => {
    jest.spyOn(ollamaService, 'extractNaftalReceiptJson').mockResolvedValue({
      liters: 49.0,
      fuelType: 'Gasoil',
      stationName: 'Station Naftal Rouiba Est',
      stationWilaya: '16 - Alger',
      totalAmountDzd: 1421,
    });

    const res = await service.scanAndReconcile(
      {
        assetId: 'ast-01',
        receiptTextRaw: 'TICKET TPE ILLISIBLE VOL=49,00 CARBURANT GO MONTANT 1421 DZD',
      },
      'tenant-test',
    );

    expect(res.liters).toBe(49.0);
    expect(res.stationName).toBe('Station Naftal Rouiba Est');
    expect(res.totalAmountDzd).toBe(1421);
    expect(res.reconciliation.reconciliationStatus).toBe('VERIFIED');
  });

  it('should flag suspicious volume if variance exceeds threshold', async () => {
    const res = await service.scanAndReconcile(
      {
        assetId: 'ast-01',
        manualOverrides: {
          liters: 95.0, // Réservoir Kangoo = 60L max
          totalAmountDzd: 2755,
        },
      },
      'tenant-test',
    );

    expect(res.reconciliation.reconciliationStatus).toBe('SUSPICIOUS_VOLUME');
    expect(res.reconciliation.fraudRiskProbability).toBeGreaterThan(0.7);
    expect(res.status).toBe('PENDING_APPROVAL');
  });

  it('should return recent receipts list', async () => {
    const list = await service.listRecentReceipts('tenant-test');
    expect(list.length).toBeGreaterThan(0);
  });
});
