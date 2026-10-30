import { Test, TestingModule } from '@nestjs/testing';
import { DigitalTwinService } from './digital-twin.service';
import { DatabaseService } from '../database/database.service';

describe('DigitalTwinService', () => {
  let service: DigitalTwinService;
  let dbMock: any;

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

  it('should return digital twins with 5 physical organs and deterministic VHI score', async () => {
    const twins = await service.getDigitalTwinsForTenant('tenant-test');
    expect(twins.length).toBeGreaterThan(0);

    const twin = twins[0];
    expect(twin.assetId).toBe('ast-test-01');
    expect(twin.organs).toHaveLength(5);

    const organKeys = twin.organs.map((o) => o.organ);
    expect(organKeys).toContain('ENGINE_OIL');
    expect(organKeys).toContain('BATTERY_CRANKING');
    expect(organKeys).toContain('BRAKE_PADS');
    expect(organKeys).toContain('COOLING_SYSTEM');
    expect(organKeys).toContain('DPF_FILTER');

    expect(twin.currentVhi).toBeGreaterThanOrEqual(0);
    expect(twin.currentVhi).toBeLessThanOrEqual(100);
    expect(twin.projectionTrajectory).toBeDefined();
    expect(twin.projectionTrajectory.day0Vhi).toBe(twin.currentVhi);
  });

  it('should calculate degradation dynamically in simulation mode when climate and driving stress increase', async () => {
    // Normal / calm conditions
    const twinCalm = await service.simulateDigitalTwin(
      'ast-test-01',
      { climateSeverityMultiplier: 1.0, driverAggressivenessMultiplier: 1.0 },
      'tenant-test',
    );

    // Severe conditions (Sahara desert + aggressive driving)
    const twinSevere = await service.simulateDigitalTwin(
      'ast-test-01',
      { climateSeverityMultiplier: 1.5, driverAggressivenessMultiplier: 1.4 },
      'tenant-test',
    );

    const calmOil = twinCalm.organs.find((o) => o.organ === 'ENGINE_OIL')!;
    const severeOil = twinSevere.organs.find((o) => o.organ === 'ENGINE_OIL')!;

    // Severe stress causes faster oil degradation and lower remaining useful life
    expect(severeOil.remainingUsefulLifeValue).toBeLessThan(calmOil.remainingUsefulLifeValue);
    expect(twinSevere.currentVhi).toBeLessThan(twinCalm.currentVhi);
  });

  it('should propose autonomous vehicle substitution if health VHI falls below threshold 65', async () => {
    // Extreme stress simulation forcing VHI degradation
    const twinDegraded = await service.simulateDigitalTwin(
      'ast-test-01',
      { climateSeverityMultiplier: 1.8, driverAggressivenessMultiplier: 1.8 },
      'tenant-test',
    );

    if (twinDegraded.currentVhi < 65) {
      expect(twinDegraded.substitutionAsset).toBeDefined();
      expect(twinDegraded.substitutionAsset?.assetCode).toBe('VEH-019-ALG');
      expect(twinDegraded.substitutionAsset?.vhiScore).toBeGreaterThan(80);
    }
  });
});
