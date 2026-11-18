import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthClient } from '../lib/api-auth';
import { RegimeArbitrageInputDto, RegimeArbitrageEvaluation } from '@docteurflotte/contracts';

describe('Regime Arbitrage Onboarding & API Client (DZ-First)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('appelle l\'endpoint /tenants/arbitrage-regimes avec le bearer token et retourne l\'arbitrage prescriptif', async () => {
    const mockEvaluation: RegimeArbitrageEvaluation = {
      fiscalYear: 2026,
      totalTurnoverDzd: '3500000.00',
      operatingExpensesDzd: '500000.00',
      grossPayrollDzd: '0.00',
      employeeCount: 0,
      regimes: [
        {
          regimeCode: 'AUTO_ENTREPRENEUR',
          labelFr: 'Auto-Entrepreneur (Statut ANAE)',
          personalityType: 'PERSONNE_PHYSIQUE',
          isEligible: true,
          ineligibilityReasonFr: null,
          taxAmountDzd: '17500.00',
          socialContributionsDzd: '24000.00',
          totalLeviesDzd: '41500.00',
          netDisposableIncomeDzd: '2958500.00',
          effectiveTaxRatePct: '1.2',
          administrativeBurden: 'TRES_FAIBLE',
          accountingRequirementsFr: 'Simple registre',
          breakdown: {},
        },
        {
          regimeCode: 'IFU_FORFAITAIRE',
          labelFr: 'Impôt Forfaitaire Unique (IFU)',
          personalityType: 'PERSONNE_PHYSIQUE',
          isEligible: true,
          ineligibilityReasonFr: null,
          taxAmountDzd: '420000.00',
          socialContributionsDzd: '43200.00',
          totalLeviesDzd: '463200.00',
          netDisposableIncomeDzd: '2536800.00',
          effectiveTaxRatePct: '13.2',
          administrativeBurden: 'FAIBLE',
          accountingRequirementsFr: 'Registres achats/ventes',
          breakdown: {},
        },
      ],
      recommendedRegime: 'AUTO_ENTREPRENEUR',
      recommendedRegimeLabelFr: 'Auto-Entrepreneur (Statut ANAE)',
      annualSavingsVsWorstDzd: '421700.00',
      actionableSummaryFr: 'Le statut Auto-Entrepreneur vous fait économiser 421 700 DZD/an.',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEvaluation,
    } as Response);

    const input: RegimeArbitrageInputDto = {
      fiscalYear: 2026,
      activityCategory: 'SERVICES',
      projectedAnnualRevenueGoods: '0',
      projectedAnnualRevenueServices: '3500000',
      operatingExpenses: '500000',
      employeeCount: 0,
      totalGrossPayroll: '0',
    };

    const res = await AuthClient.simulateRegimeArbitrage(input, 'test-token-jwt');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tenants/arbitrage-regimes'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-jwt',
          'Content-Type': 'application/json',
        }),
      })
    );

    expect(res.recommendedRegime).toBe('AUTO_ENTREPRENEUR');
    expect(res.annualSavingsVsWorstDzd).toBe('421700.00');
    expect(res.regimes).toHaveLength(2);
    expect(res.regimes[0].taxAmountDzd).toBe('17500.00');
  });

  it('lève une exception explicite en cas d\'erreur API ou dépassement de paramètres', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Données d\'activité invalides.' }),
    } as Response);

    const input: RegimeArbitrageInputDto = {
      fiscalYear: 2026,
      activityCategory: 'SERVICES',
      projectedAnnualRevenueGoods: '0',
      projectedAnnualRevenueServices: '0',
      operatingExpenses: '0',
      employeeCount: 0,
      totalGrossPayroll: '0',
    };

    await expect(AuthClient.simulateRegimeArbitrage(input, 'test-token-jwt')).rejects.toThrow(
      'Données d\'activité invalides.'
    );
  });
});
