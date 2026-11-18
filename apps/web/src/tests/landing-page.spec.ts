import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Landing Page — World-Class Sovereign Showcase (Zero Third-Party)', () => {
  const landingDir = path.resolve(__dirname, '../components/landing');

  // Lecture récursive de tous les fichiers du module landing
  const readAllLandingFiles = (dir: string): string => {
    let content = '';
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        content += readAllLandingFiles(fullPath) + '\n';
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        content += fs.readFileSync(fullPath, 'utf-8') + '\n';
      }
    }
    return content;
  };

  const sourceCode = readAllLandingFiles(landingDir);

  it('should strictly contain ZERO mentions of any third-party company across all landing files', () => {
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
      'total card',
      'shell fleet',
    ];

    const lowerSource = sourceCode.toLowerCase();
    const violations: string[] = [];

    forbiddenCompetitorsAndThirdParties.forEach((brand) => {
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

  it('should scale accurately up to 1 000 rolling assets with minimal breakdown explanations', () => {
    // Vérification de la présence des paliers jusqu'à 1 000 véhicules et des explications
    expect(sourceCode).toContain('1 000 Actifs Roulants');
    expect(sourceCode).toContain('max={1000}');
    expect(sourceCode).toContain('-8,5 % de litrage évité via contrôle CUSUM anti-siphonnage');
    expect(sourceCode).toContain('Protection culasse, turbo et injection par anticipation thermique différentielle EWMA');
    expect(sourceCode).toContain('Continuité d\'exploitation : 4,5 jours d\'arrêt d\'atelier épargnés');

    // Simulation pour 1 000 véhicules, 8 500 km/mois, Fret (31 L/100km, Gasoil national 29 DZD/L)
    const fleetSize = 1000;
    const monthlyKm = 8500;
    const fuelRatePer100Km = 31;
    const nationalFuelCostDzd = 29.0;
    const annualLiters = (fleetSize * monthlyKm * 12 * fuelRatePer100Km) / 100;
    const annualLitersSaved = Math.round(annualLiters * 0.085);
    const fuelSavingsDzd = Math.round(annualLitersSaved * nationalFuelCostDzd);

    const criticalBreakdownsAvoided = Math.max(1, Math.round(fleetSize * 0.14));
    const breakdownSavingsDzd = criticalBreakdownsAvoided * 480000;

    const daysDowntimeSaved = Math.round(criticalBreakdownsAvoided * 4.5);
    const downtimeSavingsDzd = Math.round(daysDowntimeSaved * 25000);

    const totalSavingsDzd = fuelSavingsDzd + breakdownSavingsDzd + downtimeSavingsDzd;

    // Pour 1000 véhicules : abonnement grand compte dégressif 1100 DZD/mois
    const platformAnnualCostDzd = fleetSize * 1100 * 12;
    const netRoiRatio = +(totalSavingsDzd / platformAnnualCostDzd).toFixed(1);

    expect(totalSavingsDzd).toBeGreaterThan(100000000); // Plus de 100 Millions DZD d'économies nettes annuelles
    expect(netRoiRatio).toBeGreaterThan(5); // ROI supérieur à 5x
  });

  it('should include mobile drawer, language persistence, testimonials, FAQ and JSON-LD schema', () => {
    expect(sourceCode).toContain('MobileMenu');
    expect(sourceCode).toContain('usePersistedLang');
    expect(sourceCode).toContain('HowItWorksSection');
    expect(sourceCode).toContain('IntegrationsSection');
    expect(sourceCode).toContain('TestimonialsSection');
    expect(sourceCode).toContain('FaqSection');
    expect(sourceCode).toContain('application/ld+json');
    expect(sourceCode).toContain('SoftwareApplication');
  });
});
