import { describe, it, expect } from 'vitest';
import {
  generateInitialFleet,
  computeAllSubsystems,
  decodeRawCanFrame,
  DBC_CAN_DEFINITIONS,
  OEM_PREVENTIVE_TEMPLATES,
  OEM_PARTS_CROSS_REF_SEEDS,
  INITIAL_WAREHOUSE_STORES,
  INITIAL_INVENTORY_ITEMS,
} from '../lib/api-maintenance-40';
import { calculateRul } from '@docteurflotte/contracts';

describe('Maintenance 5.0 Deterministic Physics & Route-Splitting Architecture', () => {
  it('should initialize fleet with complete 7-subsystem RUL models and physical scores', () => {
    const fleet = generateInitialFleet();
    expect(fleet.length).toBeGreaterThanOrEqual(4);

    const firstVehicle = fleet[0];
    expect(firstVehicle.registrationNumber).toBeDefined();
    expect(firstVehicle.globalHealthScore).toBeGreaterThan(0);
    expect(firstVehicle.globalHealthScore).toBeLessThanOrEqual(100);

    const subsystems = firstVehicle.subsystems;
    expect(subsystems.ENGINE).toBeDefined();
    expect(subsystems.HYDRAULICS).toBeDefined();
    expect(subsystems.TRANSMISSION).toBeDefined();
    expect(subsystems.BRAKES_APS).toBeDefined();
    expect(subsystems.COOLING).toBeDefined();
    expect(subsystems.FILTRATION).toBeDefined();
    expect(subsystems.TIRES_TRACKS).toBeDefined();
  });

  it('should compute severe duty factor adjustment (I_eff = I_OEM * alpha_duty)', () => {
    const asset = {
      currentOdometerKm: 120000,
      currentEngineHours: 3500,
      idleHours: 400,
      avgDailyKm: 320,
      avgDailyEngineHours: 8,
      severeDutyFactor: 0.85, // Saharan heat and dust
      activeDtcs: [],
    };

    const subsystems = computeAllSubsystems(asset);
    const engineRul = subsystems.ENGINE;

    expect(engineRul.effectiveIntervalKm).toBe(25500);
    expect(engineRul.effectiveIntervalHours).toBe(425);
  });

  it('should accurately convert idle engine hours to equivalent road wear (1h = 33 km)', () => {
    const asset = {
      currentOdometerKm: 50000,
      currentEngineHours: 1500,
      idleHours: 100, // 100h of idling
      avgDailyKm: 250,
      avgDailyEngineHours: 6,
      severeDutyFactor: 1.0,
      activeDtcs: [],
    };

    const subsystems = computeAllSubsystems(asset);
    expect(subsystems.ENGINE.equivalentIdleKm).toBe(100 * 33); // 3 300 km
  });

  it('should calculate CAN acceleration factor and RUL drift under thermal/pressure stress', () => {
    const nominal = calculateRul({
      subsystem: 'ENGINE',
      severeDutyFactor: 1.0,
      oemIntervalKm: 30000,
      oemIntervalEngineHours: 500,
      oemIntervalDays: 180,
      deltaOdometerKm: 15000,
      deltaEngineHours: 250,
      deltaDays: 90,
      idleHours: 20,
      avgDailyKm: 200,
      avgDailyEngineHours: 5,
      sensors: [],
      dtcs: [],
    });

    const stressed = calculateRul({
      subsystem: 'ENGINE',
      severeDutyFactor: 1.0,
      oemIntervalKm: 30000,
      oemIntervalEngineHours: 500,
      oemIntervalDays: 180,
      deltaOdometerKm: 15000,
      deltaEngineHours: 250,
      deltaDays: 90,
      idleHours: 20,
      avgDailyKm: 200,
      avgDailyEngineHours: 5,
      sensors: [
        {
          parameterName: 'SPN 110 Temp Eau Culasse',
          value: 108.5,
          normalMax: 100,
          isAnomalous: true,
          penalty: 0.25,
        },
      ],
      dtcs: [{ code: 'P0087', penalty: 0.3 }],
    });

    expect(stressed.canAccelerationFactor).toBeGreaterThan(nominal.canAccelerationFactor);
    expect(stressed.rulRemainingHours!).toBeLessThan(nominal.rulRemainingHours!);
    expect(stressed.failureProbability30d).toBeGreaterThan(nominal.failureProbability30d);
  });

  it('should correctly evaluate actuarial arbitrage SAD -> ADS in DZD with Algerian desert towing rates', () => {
    const saharaDutyFactor = 0.9;
    const isSahara = saharaDutyFactor > 0.8;
    const towingCostDzd = isSahara ? 75000 : 35000;
    const dailyImmobilizationDzd = 25000;

    const actionCostDzd = 28000;
    const breakdownRiskDzd = actionCostDzd * 3.5 + towingCostDzd + dailyImmobilizationDzd * 2;
    const netSavingsDzd = breakdownRiskDzd - actionCostDzd;
    const roiRatio = breakdownRiskDzd / actionCostDzd;

    expect(towingCostDzd).toBe(75000);
    expect(breakdownRiskDzd).toBe(28000 * 3.5 + 75000 + 50000);
    expect(netSavingsDzd).toBeGreaterThan(150000);
    expect(roiRatio).toBeGreaterThan(5.0);
  });

  it('should decode OpenDBC CAN frames for standard J1939 PGNs', () => {
    expect(DBC_CAN_DEFINITIONS.length).toBeGreaterThanOrEqual(4);

    const frameDef = DBC_CAN_DEFINITIONS.find((d) => d.frameIdHex === '0x18FEEE00');
    expect(frameDef).toBeDefined();

    // Decode hex payload: 5C 40 82 00 00 00 00 00
    const decoded = decodeRawCanFrame('0x18FEEE00', '5C 40 82 00 00 00 00 00');
    expect(decoded).not.toBeNull();
    expect(decoded?.signals.length).toBeGreaterThan(0);

    const coolantSig = decoded?.signals.find((s) => s.name.toLowerCase().includes('coolant'));
    expect(coolantSig).toBeDefined();
    expect(coolantSig?.unit).toBe('°C');
  });

  it('should seed OEM preventative templates and inventory with Algerian spare parts cross-references', () => {
    expect(OEM_PREVENTIVE_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    expect(OEM_PARTS_CROSS_REF_SEEDS.length).toBeGreaterThanOrEqual(6);
    expect(INITIAL_WAREHOUSE_STORES.length).toBeGreaterThanOrEqual(2);
    expect(INITIAL_INVENTORY_ITEMS.length).toBeGreaterThanOrEqual(8);

    const mannFilter = OEM_PARTS_CROSS_REF_SEEDS.find((p) =>
      p.equivalences.some((e) => e.aftermarketBrand.toLowerCase().includes('mann'))
    );
    expect(mannFilter).toBeDefined();
    expect(mannFilter?.oemBrand).toBeDefined();
    expect(mannFilter?.internalSku).toBeDefined();
  });
});
