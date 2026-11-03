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

  it('should process stream telemetry frame with 12 physical models and persist VHI in assets', async () => {
    // 1. SELECT asset
    dbMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'ast-test-01',
          code: 'VEH-016-ALG',
          category: 'HEAVY_TRUCK',
          physics_state: {},
          vhi_score: 95.0,
          status: 'OPERATIONAL',
        },
      ],
    });
    // 2. UPDATE assets
    dbMock.query.mockResolvedValueOnce({ rowCount: 1 });

    const result = await service.processTelemetryFrame('tenant-test', 'ast-test-01', {
      timestamp: 1730006000,
      dt: 1.0,
      rpm: 1450,
      speed_kmh: 85,
      engine_load_pct: 45,
      coolant_temp_c: 88,
      oil_temp_c: 94,
      ambient_temp_c: 25,
      battery_voltage_v: 28.0,
      cranking_v_min: null,
      map_kpa: 140,
      maf_gs: 120,
      dpf_delta_p_kpa: 0.20,
      fuel_level_pct: 75,
      fuel_rate_lh: 24,
      rail_pressure_bar: 1650,
      stft_pct: 0,
      ltft_pct: 0,
      imu_ax: 0,
      imu_ay: 0,
      imu_az: 9.81,
      ignition_on: true,
      vehicle_mass_kg: 26000,
    });

    expect(result.vhiReport).toBeDefined();
    expect(result.vhiReport.vhiFinal).toBeGreaterThanOrEqual(90);
    expect(result.vhiReport.operationalStatus).toBe('OPTIMAL');
    expect(result.nextState).toBeDefined();
    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE assets'),
      expect.arrayContaining([expect.any(Number), 'OPTIMAL', expect.any(String)]),
    );
  });
});
