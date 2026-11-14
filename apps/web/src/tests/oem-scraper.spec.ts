import { describe, it, expect } from 'vitest';
import {
  PRESET_VINS,
  PRESET_CATALOG_MODELS,
  PRESET_BULK_MAKES,
  BULK_CATEGORIES,
  SCRAPER_SOURCES,
} from '../app/oem-scraper/constants';
import { NormalizedOEMTemplate, NormalizedOEMTask } from '../app/oem-scraper/types';

describe('OEM Scraper Cockpit & Knowledge Vault (Lot 5 Target 3)', () => {
  it('should expose valid presets and categories for Algeria fleet operations', () => {
    expect(PRESET_VINS.length).toBeGreaterThanOrEqual(5);
    const renaultTruck = PRESET_VINS.find((v) => v.vin.startsWith('VF6'));
    expect(renaultTruck).toBeDefined();
    expect(renaultTruck?.label).toContain('Renault Trucks');

    const shacman = PRESET_VINS.find((v) => v.vin.startsWith('LZG'));
    expect(shacman).toBeDefined();
    expect(shacman?.badge).toBe('Chinois / BTP');

    expect(BULK_CATEGORIES).toHaveLength(5);
    expect(BULK_CATEGORIES.map((c) => c.id)).toEqual([
      'TRUCKS_BUSES',
      'CONSTRUCTION',
      'AGRICULTURAL',
      'LIGHT_COMMERCIAL',
      'CARS_SUVS',
    ]);

    expect(SCRAPER_SOURCES).toHaveLength(4);
    expect(SCRAPER_SOURCES.map((s) => s.id)).toEqual([
      'AUTO',
      'OLYSLAGER',
      'AUTODOC',
      'PDF',
    ]);
  });

  it('should validate normalized OEM template structure and intervals comparison', () => {
    const mockTasks: NormalizedOEMTask[] = [
      {
        task_code: 'OIL-CHG-01',
        task_name: 'Vidange huile moteur & remplacement filtres',
        subsystem: 'ENGINE_OIL',
        normal_interval_km: 40000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 600,
        severe_interval_km: 20000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 300,
        standard_labor_minutes: 90,
        criticality_weight: 1.8,
      },
      {
        task_code: 'BRK-PAD-01',
        task_name: 'Contrôle et remplacement plaquettes de frein avant/arrière',
        subsystem: 'BRAKE_PADS',
        normal_interval_km: 60000,
        normal_interval_months: 18,
        normal_interval_engine_hours: 900,
        severe_interval_km: 30000,
        severe_interval_months: 9,
        severe_interval_engine_hours: 450,
        standard_labor_minutes: 120,
        criticality_weight: 2.0,
      },
    ];

    const mockTemplate: NormalizedOEMTemplate = {
      wmi_prefix: 'VF6',
      make: 'Renault Trucks',
      model: 'T480',
      engine_code: 'DTI 13 (12.8L)',
      asset_category: 'HEAVY_TRUCK',
      fuel_type: 'DIESEL',
      ref_consumption_l_100km: 31.5,
      ref_consumption_l_hour: 4.5,
      oil_capacity_liters: 36,
      oil_norm_spec: 'Renault RLD-3 / Volvo VDS-4.5 (10W40)',
      tasks: mockTasks,
    };

    expect(mockTemplate.tasks).toHaveLength(2);
    expect(mockTemplate.oil_capacity_liters).toBe(36);
    expect(mockTemplate.ref_consumption_l_100km).toBe(31.5);

    // Verify severe condition reduction for Algerian Sahara / BTP conditions
    const oilTask = mockTemplate.tasks[0];
    expect(oilTask.severe_interval_km).toBeLessThan(oilTask.normal_interval_km);
    expect(oilTask.severe_interval_km).toBe(oilTask.normal_interval_km / 2);
    expect(oilTask.criticality_weight).toBeGreaterThanOrEqual(1.5);
  });

  it('should verify catalog preset models contain both Chinese, European, and National DZ makes', () => {
    const makes = PRESET_CATALOG_MODELS.map((m) => m.make);
    expect(makes).toContain('Renault Trucks');
    expect(makes).toContain('Shacman');
    expect(makes).toContain('SNVI');
    expect(makes).toContain('MAN');
    expect(makes).toContain('Toyota');

    const snvi = PRESET_CATALOG_MODELS.find((m) => m.make === 'SNVI');
    expect(snvi?.engine).toBe('Deutz F6L912');
  });
});
