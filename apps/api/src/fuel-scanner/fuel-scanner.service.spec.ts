import { Test, TestingModule } from '@nestjs/testing';
import { FuelScannerService } from './fuel-scanner.service';
import { DatabaseService } from '../database/database.service';

describe('FuelScannerService', () => {
  let service: FuelScannerService;
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
        {
          provide: DatabaseService,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<FuelScannerService>(FuelScannerService);
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
