import { Test, TestingModule } from '@nestjs/testing';
import { DigitalTwinService } from './digital-twin.service';
import { DatabaseService } from '../database/database.service';

describe('DigitalTwinService', () => {
  let service: DigitalTwinService;
  let dbMock: { query: jest.Mock; withTenantContext?: jest.Mock; queryInTenant?: jest.Mock };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'ast-test-01',
            code: 'VEH-016-ALG',
            name: 'Renault Kangoo 1.5 dCi',
            category: 'LIGHT_COMMERCIAL',
            status: 'ACTIVE',
            brand: 'Renault',
            model: 'Kangoo Express',
            year: 2022,
            current_meter_value: 120500,
          },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigitalTwinService,
        {
          provide: DatabaseService,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<DigitalTwinService>(DigitalTwinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return digital twins with 6 physical organs, financial arbitrage and deterministic VHI score', async () => {
    const twins = await service.getDigitalTwinsForTenant('tenant-test');
    expect(twins.length).toBeGreaterThan(0);

    const twin = twins[0];
    expect(twin.assetId).toBe('ast-test-01');
    expect(twin.organs).toHaveLength(6);

    const organKeys = twin.organs.map((o) => o.organ);
    expect(organKeys).toContain('ENGINE_OIL');
    expect(organKeys).toContain('BATTERY_CRANKING');
    expect(organKeys).toContain('BRAKE_PADS');
    expect(organKeys).toContain('COOLING_SYSTEM');
    expect(organKeys).toContain('DPF_FILTER');
    expect(organKeys).toContain('TRANSMISSION_DRIVETRAIN');

    expect(twin.currentVhi).toBeGreaterThanOrEqual(0);
    expect(twin.currentVhi).toBeLessThanOrEqual(100);
    expect(twin.projectionTrajectory).toBeDefined();
    expect(twin.projectionTrajectory.day0Vhi).toBe(twin.currentVhi);

    // Arbitrage Financier DZD
    expect(twin.financialArbitrage).toBeDefined();
    expect(twin.financialArbitrage.preventiveInterventionCostDzd).toBeGreaterThan(0);
    expect(twin.financialArbitrage.unplannedBreakdownRiskDzd).toBeGreaterThanOrEqual(0);
  });

  it('should calculate degradation dynamically based on 58 Wilayas profiles (Alger vs Ouargla)', async () => {
    // Wilaya 16 (Alger - Tell)
    const twinAlger = await service.simulateDigitalTwin(
      'ast-test-01',
      { wilayaCode: 16, climateSeverityMultiplier: 1.0, driverAggressivenessMultiplier: 1.0 },
      'tenant-test',
    );

    // Wilaya 30 (Ouargla - Sahara Bassin Pétrolier Hassi Messaoud)
    const twinOuargla = await service.simulateDigitalTwin(
      'ast-test-01',
      { wilayaCode: 30, climateSeverityMultiplier: 1.7, driverAggressivenessMultiplier: 1.2, isDesertTransitScenario: true },
      'tenant-test',
    );

    const algerOil = twinAlger.organs.find((o) => o.organ === 'ENGINE_OIL')!;
    const ouarglaOil = twinOuargla.organs.find((o) => o.organ === 'ENGINE_OIL')!;

    // La chaleur saharienne et les poussières de silice accélèrent l'oxydation de l'huile
    expect(ouarglaOil.remainingUsefulLifeValue).toBeLessThan(algerOil.remainingUsefulLifeValue);
    expect(twinOuargla.currentVhi).toBeLessThan(twinAlger.currentVhi);
    expect(twinOuargla.financialArbitrage.desertTowingCostDzd).toBe(75000); // Forfait remorquage désertique
  });

  it('should propose autonomous vehicle substitution if health VHI falls below threshold 65', async () => {
    // Extreme stress simulation forcing VHI degradation
    const twinDegraded = await service.simulateDigitalTwin(
      'ast-test-01',
      { climateSeverityMultiplier: 1.85, driverAggressivenessMultiplier: 1.85, isDesertTransitScenario: true },
      'tenant-test',
    );

    if (twinDegraded.currentVhi < 65) {
      expect(twinDegraded.substitutionAsset).toBeDefined();
      expect(twinDegraded.substitutionAsset?.assetCode).toBe('VEH-019-ALG');
      expect(twinDegraded.substitutionAsset?.vhiScore).toBeGreaterThan(80);
    }
  });
});
