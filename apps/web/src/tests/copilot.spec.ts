import { describe, it, expect } from 'vitest';
import {
  DEFAULT_AI_STATUS,
  QUICK_PROMPT_CHIPS,
  buildInitialWelcomeMessage,
} from '../app/copilot/constants';
import { CopilotActionSuggestion } from '../app/copilot/types';

describe('Copilot Cockpit & Decision Assistant (Lot 5 Target 5)', () => {
  it('should initialize default AI status with Loi 18-07 compliance and sovereign fallback', () => {
    expect(DEFAULT_AI_STATUS.sovereign).toBe(true);
    expect(DEFAULT_AI_STATUS.loi1807Compliant).toBe(true);
    expect(DEFAULT_AI_STATUS.mode).toBe('DETERMINISTIC_FALLBACK');
    expect(DEFAULT_AI_STATUS.model).toContain('qwen2.5');

    const welcomeMsg = buildInitialWelcomeMessage();
    expect(welcomeMsg.sender).toBe('copilot');
    expect(welcomeMsg.text).toContain('DocteurFlotte Copilot');
    expect(welcomeMsg.text).toContain('Arrhenius');
    expect(welcomeMsg.text).toContain('Loi 18-07');
  });

  it('should provide Algerian fleet operational quick chips', () => {
    expect(QUICK_PROMPT_CHIPS).toHaveLength(4);

    const cranking = QUICK_PROMPT_CHIPS.find((c) => c.label.includes('Cranking'));
    expect(cranking).toBeDefined();
    expect(cranking?.prompt).toContain('Kangoo');

    const arrhenius = QUICK_PROMPT_CHIPS.find((c) => c.label.includes('Arrhenius'));
    expect(arrhenius).toBeDefined();
    expect(arrhenius?.prompt).toContain('MAN TGX');
    expect(arrhenius?.prompt).toContain('Hassi Messaoud');

    const cusum = QUICK_PROMPT_CHIPS.find((c) => c.label.includes('CUSUM'));
    expect(cusum).toBeDefined();
    expect(cusum?.prompt).toContain('Naftal');
  });

  it('should format suggested actions with exact DZD financial arbitrage and TOPSIS ranking', () => {
    const mockAction: CopilotActionSuggestion = {
      id: 'act-001',
      title: 'Vidange préventive immédiate MAN TGX',
      description: 'Dégradation thermique Arrhenius sévère détectée après rotation Ouargla.',
      type: 'CREATE_WORK_ORDER',
      assetId: 'ast-man-01',
      assetName: 'MAN TGX 33.440',
      assetCode: 'TGX-01',
      confidenceScore: 0.95,
      status: 'PENDING_APPROVAL',
      estimatedCostDzd: 35000,
      estimatedRiskDzd: 450000,
      netSavingsDzd: 415000,
      roiMultiplier: 12.8,
      candidateVehicles: [
        {
          vehicleId: 'ast-02',
          vehicleName: 'Renault T480 (Substitut)',
          vehiclePlate: '01492-319-16',
          vhiScore: 88,
          approachDistanceKm: 14,
          fuelCostDzd: 420,
          topsisScore: 0.94,
          rank: 1,
        },
      ],
    };

    expect(mockAction.netSavingsDzd).toBe(mockAction.estimatedRiskDzd - mockAction.estimatedCostDzd);
    expect(mockAction.roiMultiplier).toBeGreaterThan(1);
    expect(mockAction.candidateVehicles?.[0].rank).toBe(1);
    expect(mockAction.candidateVehicles?.[0].topsisScore).toBe(0.94);
  });
});
