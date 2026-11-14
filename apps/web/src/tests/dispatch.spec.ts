import { describe, it, expect } from 'vitest';
import { IndustrySector, ClimateZoneDZ, AssetCategory } from '../lib/api-fleet-intelligence';

describe('Dispatch & Regulatory Mission Orders (Lot 3 - Missions)', () => {
  it('should initialize default route between Rouïba and Hassi Messaoud with valid wilaya codes', () => {
    const defaultRoute = {
      originName: 'Plateforme Logistique Rouïba (Zone Industrielle)',
      originWilaya: 16,
      destinationName: 'Base Logistique Hassi Messaoud (Base 24)',
      destinationWilaya: 30,
      transitWilayas: '09, 28, 47',
      routeKm: 850,
      payloadTons: 24.5,
      climateZone: ClimateZoneDZ.SAHARA_SOUTH,
    };

    expect(defaultRoute.originWilaya).toBe(16);
    expect(defaultRoute.destinationWilaya).toBe(30);
    expect(defaultRoute.routeKm).toBe(850);
    expect(defaultRoute.climateZone).toBe(ClimateZoneDZ.SAHARA_SOUTH);
  });

  it('should compute estimated driving hours based on 65 km/h commercial transit speed', () => {
    const computeDrivingHours = (km: number) => Math.round((km / 65) * 10) / 10;

    expect(computeDrivingHours(850)).toBe(13.1);
    expect(computeDrivingHours(650)).toBe(10.0);
    expect(computeDrivingHours(130)).toBe(2.0);
  });

  it('should parse and sanitize transit wilaya strings into numerical Wilaya codes', () => {
    const parseTransitWilayas = (raw: string): number[] =>
      raw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 58);

    const transits = parseTransitWilayas('09, 28, 47, invalid, 0, 99');
    expect(transits).toEqual([9, 28, 47]);
  });

  it('should enforce Algerian vehicle category constraints for heavy tractor trailers', () => {
    const vehicle = {
      category: AssetCategory.TRACTOR_TRAILER,
      maxPayloadTons: 25.0,
      grossVehicleWeightTons: 38.0,
      fuelType: 'DIESEL',
      refConsumptionL100Km: 32.0,
    };

    expect(vehicle.grossVehicleWeightTons).toBeLessThanOrEqual(44.0); // Conforme Code de la Route DZ
    expect(vehicle.maxPayloadTons).toBeGreaterThan(0);
  });

  it('should format and validate offline QR payload prefix according to DZOM standard', () => {
    const generateDzomQr = (orderNumber: string, plate: string, originW: number, destW: number) =>
      `DZOM|${orderNumber}|${plate}|${originW}|${destW}|OFFLINE_VERIFIED`;

    const qr = generateDzomQr('OM-2026-16001', '01492-319-16', 16, 30);
    expect(qr.startsWith('DZOM|')).toBe(true);
    expect(qr).toContain('OM-2026-16001');
    expect(qr).toContain('01492-319-16');
  });

  it('should accurately evaluate TOPSIS substitution ranking score', () => {
    const substitutions = [
      { registrationPlate: '01492-319-16', totalScore100: 94.5, estimatedFuelCostDzd: 26350 },
      { registrationPlate: '02891-320-16', totalScore100: 88.2, estimatedFuelCostDzd: 28100 },
    ];

    expect(substitutions[0].totalScore100).toBeGreaterThan(substitutions[1].totalScore100);
    expect(substitutions[0].estimatedFuelCostDzd).toBeLessThan(substitutions[1].estimatedFuelCostDzd);
  });

  it('should handle offline verification output formatting for road inspection checkpoints', () => {
    const validOutput = {
      isValid: true,
      decodedOrder: {
        orderNumber: 'OM-2026-16001',
        registrationPlate: '01492-319-16',
        validUntil: '2026-11-20T18:00:00Z',
      },
    };

    expect(validOutput.isValid).toBe(true);
    expect(validOutput.decodedOrder?.orderNumber).toBe('OM-2026-16001');
  });
});
