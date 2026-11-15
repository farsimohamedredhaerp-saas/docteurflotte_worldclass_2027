import { describe, it, expect } from 'vitest';
import {
  buildDeterministicSandboxTwin,
  getSimulationDigitalTwin,
  getSimulationDigitalTwinsList,
} from '../lib/simulation-sandbox/digital-twin.mock';

describe('Auth & Digital Twin Simulation Resiliency (Login, Register & Sandbox)', () => {
  it('should build deterministic digital twin without throwing network errors', () => {
    const twin = buildDeterministicSandboxTwin(
      'test-truck-01',
      'Renault Trucks K 480',
      '00421-116-16',
      'Renault Trucks',
      'K 480',
      2022,
      284150,
      16, // Alger
      1.15,
      1.1,
      false
    );

    expect(twin.assetId).toBe('test-truck-01');
    expect(twin.assetCode).toBe('00421-116-16');
    expect(twin.organs).toHaveLength(6);

    const organTypes = twin.organs.map((o) => o.organ);
    expect(organTypes).toContain('ENGINE_OIL');
    expect(organTypes).toContain('BATTERY_CRANKING');
    expect(organTypes).toContain('BRAKE_PADS');
    expect(organTypes).toContain('COOLING_SYSTEM');
    expect(organTypes).toContain('DPF_FILTER');
    expect(organTypes).toContain('TRANSMISSION_DRIVETRAIN');

    expect(twin.currentVhi).toBeGreaterThanOrEqual(0);
    expect(twin.currentVhi).toBeLessThanOrEqual(100);

    // Vérification de l'arbitrage financier DZD
    expect(twin.financialArbitrage.desertTowingCostDzd).toBe(35000); // Zone Nord / Tell
    expect(twin.financialArbitrage.preventiveInterventionCostDzd).toBeGreaterThan(0);
    expect(twin.financialArbitrage.netBenefitDzd).toBeGreaterThanOrEqual(0);
  });

  it('should apply Saharan desert surcharge (75 000 DZD) for southern Wilayas', () => {
    const saharaTwin = buildDeterministicSandboxTwin(
      'test-truck-sud',
      'Shacman X3000 6x4',
      '00982-130-30',
      'Shacman',
      'X3000',
      2023,
      195000,
      30, // Ouargla (Sahara)
      1.65,
      1.3,
      true // Desert Transit
    );

    expect(saharaTwin.wilayaCode).toBe(30);
    expect(saharaTwin.wilayaLocation).toBe('Ouargla');
    expect(saharaTwin.financialArbitrage.desertTowingCostDzd).toBe(75000); // 75k DA Sud
    expect(saharaTwin.financialArbitrage.recommendedAction).toBeDefined();
  });

  it('should generate fallback twin list from simulation sandbox', () => {
    const list = getSimulationDigitalTwinsList();
    expect(list.length).toBeGreaterThanOrEqual(1);

    const singleTwin = getSimulationDigitalTwin('unit-001');
    expect(singleTwin.assetId).toBe('unit-001');
    expect(singleTwin.organs).toHaveLength(6);
  });
});
