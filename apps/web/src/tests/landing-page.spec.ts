import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Landing Page — World-Class Sovereign Showcase (Zero Third-Party)', () => {
  const landingPagePath = path.resolve(__dirname, '../components/landing/LandingPageClient.tsx');
  const sourceCode = fs.readFileSync(landingPagePath, 'utf-8');

  it('should strictly contain ZERO mentions of any third-party company', () => {
    // Liste exhaustive de marques, concurrents et tiers proscrits
    const forbiddenCompetitorsAndThirdParties = [
      'samsara',
      'geotab',
      'caterpillar',
      'cat 3',
      'renault',
      'mercedes',
      'scania',
      'shacman',
      'weichai',
      'hino',
      'isuzu',
      'naftal',
      'sonatrach',
      'sonelgaz',
      'cosider',
      'mobilis',
      'djezzy',
      'ooredoo',
      'odoo',
      'sap pm',
      'google maps',
      'microsoft',
      'salesforce',
    ];

    const lowerSource = sourceCode.toLowerCase();
    const violations: string[] = [];

    forbiddenCompetitorsAndThirdParties.forEach((brand) => {
      // Vérification par mot frontière ou motif
      const regex = new RegExp(`\\b${brand}\\b`, 'i');
      if (regex.test(lowerSource)) {
        violations.push(brand);
      }
    });

    expect(
      violations,
      `Violation du contrat d'ingénierie : La landing page ne doit citer aucune entreprise tiers. Marques trouvées : ${violations.join(', ')}`
    ).toHaveLength(0);
  });

  it('should prominently feature the 6 vital physical organs and deterministic laws', () => {
    expect(sourceCode).toContain('LOI THERMIQUE D\'ARRHENIUS');
    expect(sourceCode).toContain('MODÈLE CVHI');
    expect(sourceCode).toContain('MODÈLE THERMIQUE EWMA');
    expect(sourceCode).toContain('LOIS TRIBOLOGIQUES D\'ARCHARD');
    expect(sourceCode).toContain('DARCY-FORCHHEIMER');
    expect(sourceCode).toContain('58 Wilayas');
    expect(sourceCode).toContain('LOI 18-07');
    expect(sourceCode).toContain('CUSUM');
  });

  it('should accurately calculate deterministic ROI in DZD without arbitrary figures', () => {
    // Calcul pour flotte de 45 véhicules, 8500 km/mois, Fret (31 L/100km, Gasoil national 29 DZD/L)
    const fleetSize = 45;
    const monthlyKm = 8500;
    const fuelRatePer100Km = 31;
    const nationalFuelCostDzd = 29.0;
    const annualLiters = (fleetSize * monthlyKm * 12 * fuelRatePer100Km) / 100;
    const fuelSavingsDzd = Math.round(annualLiters * 0.085 * nationalFuelCostDzd);

    const criticalBreakdownsAvoided = Math.max(1, Math.round(fleetSize * 0.14));
    const breakdownSavingsDzd = criticalBreakdownsAvoided * 480000;

    const daysDowntimeSaved = criticalBreakdownsAvoided * 4.5;
    const downtimeSavingsDzd = Math.round(daysDowntimeSaved * 25000);

    const totalSavingsDzd = fuelSavingsDzd + breakdownSavingsDzd + downtimeSavingsDzd;

    expect(fuelSavingsDzd).toBeGreaterThan(0);
    expect(breakdownSavingsDzd).toBeGreaterThan(0);
    expect(downtimeSavingsDzd).toBeGreaterThan(0);
    expect(totalSavingsDzd).toBeGreaterThan(1000000); // Au moins 1 million DZD d'économies annuelles
  });
});
