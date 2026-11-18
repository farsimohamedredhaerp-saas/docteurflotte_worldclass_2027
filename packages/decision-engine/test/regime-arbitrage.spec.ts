import { describe, it, expect } from 'vitest';
import {
  RegimeArbitrageEngine,
  RegPackResolver,
  ALL_OFFICIAL_REG_PACKS,
  EngineDecimal,
} from '../src';

describe('RegimeArbitrageEngine — Simulateur d\'Arbitrage de Régime Fiscal & Juridique', () => {
  const state2026 = RegPackResolver.resolve(ALL_OFFICIAL_REG_PACKS, {
    asOf: '2026-06-01',
    knownAt: '2026-11-18T00:00:00.000Z',
  });

  it('recommande le statut Auto-Entrepreneur pour un indépendant solo sous le plafond', () => {
    // Consultant solo réalisant 3 500 000 DA de prestations avec 500 000 DA de frais
    const res = RegimeArbitrageEngine.evaluate(
      {
        fiscalYear: 2026,
        activityCategory: 'SERVICES',
        projectedAnnualRevenueGoods: '0',
        projectedAnnualRevenueServices: '3500000',
        operatingExpenses: '500000',
        employeeCount: 0,
        totalGrossPayroll: '0',
      },
      state2026
    );

    expect(res.totalTurnoverDzd).toBe('3500000.00');
    expect(res.recommendedRegime).toBe('AUTO_ENTREPRENEUR');

    const ae = res.regimes.find((r) => r.regimeCode === 'AUTO_ENTREPRENEUR');
    expect(ae?.isEligible).toBe(true);
    // Impôt 0.5% sur 3.5M = 17 500 DA, CASNOS forfait = 24 000 DA -> Total = 41 500 DA
    expect(ae?.taxAmountDzd).toBe('17500.00');
    expect(ae?.socialContributionsDzd).toBe('24000.00');
    expect(ae?.totalLeviesDzd).toBe('41500.00');

    // Vérifie que les économies sont calculées
    expect(new EngineDecimal(res.annualSavingsVsWorstDzd).toNumber()).toBeGreaterThan(100000);
    expect(res.actionableSummaryFr).toContain('Auto-Entrepreneur');
  });

  it('exclut l\'auto-entrepreneur dès qu\'il y a des salariés ou dépassement de 5M DA', () => {
    // Prestataire réalisant 6 000 000 DA avec 1 salarié
    const res = RegimeArbitrageEngine.evaluate(
      {
        fiscalYear: 2026,
        activityCategory: 'SERVICES',
        projectedAnnualRevenueGoods: '0',
        projectedAnnualRevenueServices: '6000000',
        operatingExpenses: '1000000',
        employeeCount: 1,
        totalGrossPayroll: '600000',
      },
      state2026
    );

    const ae = res.regimes.find((r) => r.regimeCode === 'AUTO_ENTREPRENEUR');
    expect(ae?.isEligible).toBe(false);
    expect(ae?.ineligibilityReasonFr).toBeDefined();

    // IFU reste éligible car <= 8M DA
    const ifu = res.regimes.find((r) => r.regimeCode === 'IFU_FORFAITAIRE');
    expect(ifu?.isEligible).toBe(true);
  });

  it('oriente une entreprise BTPH ou logistique lourde vers la SARL/EURL IBS', () => {
    // Entreprise BTPH réalisant 40 000 000 DA avec 20 000 000 DA de charges et 6 salariés
    const res = RegimeArbitrageEngine.evaluate(
      {
        fiscalYear: 2026,
        activityCategory: 'BTPH',
        projectedAnnualRevenueGoods: '40000000',
        projectedAnnualRevenueServices: '0',
        operatingExpenses: '20000000',
        employeeCount: 6,
        totalGrossPayroll: '4500000',
        desiredManagerRemuneration: '2400000',
      },
      state2026
    );

    // Dépassement plafonds -> ANAE et IFU inéligibles
    expect(res.regimes.find((r) => r.regimeCode === 'AUTO_ENTREPRENEUR')?.isEligible).toBe(false);
    expect(res.regimes.find((r) => r.regimeCode === 'IFU_FORFAITAIRE')?.isEligible).toBe(false);

    // Comparaison entre Réel IRG et SARL IBS
    const reel = res.regimes.find((r) => r.regimeCode === 'REEL_SIMPLIFIE');
    const sarl = res.regimes.find((r) => r.regimeCode === 'SARL_EURL_IBS');

    expect(reel?.isEligible).toBe(true);
    expect(sarl?.isEligible).toBe(true);
    // Taux IBS BTPH résolu à 23%
    expect(sarl?.labelFr).toContain('23%');
    expect(res.recommendedRegime).toBe('SARL_EURL_IBS');
  });
});
