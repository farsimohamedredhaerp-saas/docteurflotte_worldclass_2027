import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { CostTwinService } from './cost-twin.service';
import { AssetCategory } from '@docteurflotte/contracts';

describe('CostTwinService — Jumeau Numérique de Coût (DZD/km & DZD/h) Mode 0 & Mode 1', () => {
  let service: CostTwinService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const assetId = '11111111-1111-1111-1111-111111111111';

  const mockDb: any = {
    query: jest.fn(),
    withTenantContext: jest.fn((tId: string, cb: (c: any) => any) => cb(mockDb)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostTwinService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<CostTwinService>(CostTwinService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  it('doit calculer le jumeau de coût d\'un camion en Mode 0 (Zéro Capteur) avec score de confiance', async () => {
    // 1. Actif racine
    mockDb.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: assetId,
          code: 'CAM-ACTROS-01',
          name: 'Mercedes Actros 3340',
          category: AssetCategory.HEAVY_TRUCK,
          telemetry_tier: 'MODE_0_DECLARATIVE',
          status: 'ACTIVE',
        },
      ],
    });

    // 2. Kilomètres relevés (delta 3000 km, 2 relevés)
    mockDb.query.mockResolvedValueOnce({
      rows: [{ delta_km: '3000', readings_count: '2' }],
    });

    // 3. Heures moteur
    mockDb.query.mockResolvedValueOnce({
      rows: [{ total_hours: '75' }],
    });

    // 4. Carburant Naftal (3 tickets, 120 000 DZD, 4100 L)
    mockDb.query.mockResolvedValueOnce({
      rows: [{ fuel_amount: '120000', fuel_liters: '4100', tickets_count: '3' }],
    });

    // 5. Maintenance / Work orders
    mockDb.query.mockResolvedValueOnce({
      rows: [{ parts_cost: '45000' }],
    });

    const twin = await service.getAssetCostTwin(tenantId, assetId, '2026-11');

    expect(twin.assetId).toBe(assetId);
    expect(twin.assetCode).toBe('CAM-ACTROS-01');
    expect(twin.telemetryTier).toBe('MODE_0_DECLARATIVE');
    expect(twin.distanceKm).toBe(3000);
    expect(twin.operatingHours).toBe(75);
    expect(twin.fuelCostDzd).toBe(120000);
    expect(twin.maintenanceCostDzd).toBe(45000);
    expect(twin.fixedOverheadCostDzd).toBeGreaterThan(0);
    expect(twin.totalCostDzd).toBe(120000 + 45000 + twin.fixedOverheadCostDzd);
    expect(twin.costPerKmDzd).toBeGreaterThan(0);
    expect(twin.costPerHourDzd).toBeGreaterThan(0);
    expect(twin.modeZeroConfidenceScore).toBe(100); // 20 base + 40 readings + 40 fuel
    expect(twin.actionableRecommendations.length).toBeGreaterThan(0);
  });

  it('doit lever une alerte de dérive critique si le coût/km dépasse le barème de référence de >30%', async () => {
    mockDb.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: assetId,
          code: 'CAM-CHOC-02',
          name: 'Shacman F3000',
          category: AssetCategory.HEAVY_TRUCK,
          telemetry_tier: 'MODE_1_GNSS',
          status: 'ACTIVE',
        },
      ],
    });

    // Petit kilométrage (500 km)
    mockDb.query.mockResolvedValueOnce({
      rows: [{ delta_km: '500', readings_count: '10' }],
    });

    // Heures
    mockDb.query.mockResolvedValueOnce({
      rows: [{ total_hours: '40' }],
    });

    // Fort carburant (150 000 DZD)
    mockDb.query.mockResolvedValueOnce({
      rows: [{ fuel_amount: '150000', fuel_liters: '5000', tickets_count: '5' }],
    });

    // Forte maintenance (200 000 DZD)
    mockDb.query.mockResolvedValueOnce({
      rows: [{ parts_cost: '200000' }],
    });

    const twin = await service.getAssetCostTwin(tenantId, assetId, '2026-11');

    expect(twin.driftSeverity).toBe('CRITICAL');
    expect(twin.driftPercentage).toBeGreaterThan(30);
    expect(twin.savingsOpportunityDzd).toBeGreaterThan(0);
    expect(twin.actionableRecommendations.some((r) => r.includes('Dérive critique'))).toBe(true);
  });
});
