import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SIMULATION_PRESETS,
  DEFAULT_SIMULATION_LIMITS,
  ALGERIA_58_WILAYAS_PROFILES,
  isDesertZone,
} from '@docteurflotte/contracts';

describe('simulation presets', () => {
  it('contient des presets avec des codes Wilaya réels existants dans la matrice des 58 Wilayas', () => {
    expect(DEFAULT_SIMULATION_PRESETS.length).toBeGreaterThanOrEqual(4);

    for (const preset of DEFAULT_SIMULATION_PRESETS) {
      expect(preset.wilayaCode).toBeGreaterThanOrEqual(1);
      expect(preset.wilayaCode).toBeLessThanOrEqual(58);

      const foundWilaya = ALGERIA_58_WILAYAS_PROFILES.find((w) => w.code === preset.wilayaCode);
      expect(foundWilaya).toBeDefined();
    }
  });

  it('vérifie que le preset Tamanrasset référence le code officiel 11 de la Wilaya', () => {
    const tam = DEFAULT_SIMULATION_PRESETS.find((p) => p.id === 'tamanrasset');
    expect(tam).toBeDefined();
    expect(tam?.wilayaCode).toBe(11);

    const wilaya11 = ALGERIA_58_WILAYAS_PROFILES.find((w) => w.code === 11);
    expect(wilaya11?.name).toBe('Tamanrasset');
    expect(isDesertZone(wilaya11)).toBe(true);
    expect(tam?.isDesertTransit).toBe(true);
  });

  it('vérifie que le preset Ouargla / HMD référence le code 30', () => {
    const sahara = DEFAULT_SIMULATION_PRESETS.find((p) => p.id === 'sahara');
    expect(sahara).toBeDefined();
    expect(sahara?.wilayaCode).toBe(30);

    const wilaya30 = ALGERIA_58_WILAYAS_PROFILES.find((w) => w.code === 30);
    expect(wilaya30?.name).toBe('Ouargla');
    expect(isDesertZone(wilaya30)).toBe(true);
    expect(sahara?.isDesertTransit).toBe(true);
  });

  it('vérifie que les multiplicateurs de conduite respectent les bornes de simulationLimits', () => {
    const { min, max } = DEFAULT_SIMULATION_LIMITS.driver;

    for (const preset of DEFAULT_SIMULATION_PRESETS) {
      expect(preset.driverMultiplier).toBeGreaterThanOrEqual(min);
      expect(preset.driverMultiplier).toBeLessThanOrEqual(max);
    }
  });
});

