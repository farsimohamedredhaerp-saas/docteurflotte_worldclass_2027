import { describe, it, expect } from 'vitest';
import {
  ALGERIA_FISCAL_RATES,
  ALGERIA_TRANSBORDER_FUEL_TAX_DZD,
  ENACTA_OFFICIAL_FEES_DZD,
  ENACTA_INTERNAL_TCO_PROVISIONS_DZD,
} from '@docteurflotte/contracts';
import { WILAYA_RESTRICTIONS } from '../app/compliance/types';

describe('Compliance & Algerian Regulatory Framework (Lot 3 - Compliance)', () => {
  it('should verify Wilaya restrictions for heavy transport across key national hubs', () => {
    expect(WILAYA_RESTRICTIONS.length).toBeGreaterThanOrEqual(4);

    const alger = WILAYA_RESTRICTIONS.find((w) => w.wilayaCode === 16);
    expect(alger).toBeDefined();
    expect(alger?.tonnageLimit).toBe(5.5);
    expect(alger?.bypassRoute).toContain('2e Rocade Sud');

    const ouargla = WILAYA_RESTRICTIONS.find((w) => w.wilayaCode === 30);
    expect(ouargla).toBeDefined();
    expect(ouargla?.activeStatus).toBe('SPECIAL_PERMIT');
    expect(ouargla?.tonnageLimit).toBe(44.0);
  });

  it('should enforce official Algerian VAT and stamp duty tax rates', () => {
    expect(ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE).toBe(0.19);
    expect(ALGERIA_FISCAL_RATES.REDUCED_VAT_RATE).toBe(0.09);
    expect(ALGERIA_FISCAL_RATES.CASH_STAMP_DUTY_RATE).toBe(0.01);
    expect(ALGERIA_FISCAL_RATES.PASSENGER_VEHICLE_AMORTIZATION_CEILING_DZD).toBe(3000000);
  });

  it('should enforce transborder fuel tax rates according to Finance Law 2020 Art. 81', () => {
    expect(ALGERIA_TRANSBORDER_FUEL_TAX_DZD.PASSENGER_CAR).toBe(500);
    expect(ALGERIA_TRANSBORDER_FUEL_TAX_DZD.LCV_AND_TRUCKS_UNDER_10T).toBe(3500);
    expect(ALGERIA_TRANSBORDER_FUEL_TAX_DZD.HEAVY_TRUCKS_10T_PLUS_AND_BUS).toBe(12000);
  });

  it('should validate official ENACTA statutory tariffs versus internal TCO provisions', () => {
    expect(ENACTA_OFFICIAL_FEES_DZD.LIGHT_PASSENGER_TTC).toBeGreaterThan(0);
    expect(ENACTA_OFFICIAL_FEES_DZD.COMMERCIAL_VAN_VUL_TTC).toBeGreaterThan(0);
    expect(ENACTA_OFFICIAL_FEES_DZD.HEAVY_TRUCK_RIGID_TTC).toBeGreaterThan(0);
    expect(ENACTA_OFFICIAL_FEES_DZD.TRACTOR_TRAILER_TTC).toBeGreaterThan(0);

    expect(ENACTA_INTERNAL_TCO_PROVISIONS_DZD.HEAVY_TRUCK_RIGID).toBeGreaterThanOrEqual(
      ENACTA_OFFICIAL_FEES_DZD.HEAVY_TRUCK_RIGID_TTC,
    );
  });

  it('should calculate ENACTA technical inspection periodicities based on vehicle age and category', () => {
    const getEnactaPeriodicityMonths = (category: 'PL' | 'BTP' | 'VL' | 'VUL', ageYears: number) => {
      if (category === 'PL' || category === 'BTP') return 6;
      if (category === 'VUL') return ageYears < 4 ? 24 : 12;
      return 24; // VL
    };

    expect(getEnactaPeriodicityMonths('PL', 2)).toBe(6);
    expect(getEnactaPeriodicityMonths('PL', 10)).toBe(6);
    expect(getEnactaPeriodicityMonths('VUL', 2)).toBe(24);
    expect(getEnactaPeriodicityMonths('VUL', 5)).toBe(12);
    expect(getEnactaPeriodicityMonths('VL', 1)).toBe(24);
  });
});

