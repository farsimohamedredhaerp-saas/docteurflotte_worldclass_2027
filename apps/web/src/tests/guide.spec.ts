import { describe, it, expect } from 'vitest';
import { SECTIONS } from '../app/guide/constants';
import { calculateRoiMetrics } from '../app/guide/hooks/useRoiSimulator';

describe('Guide Module — Architecture & Strategic Reference (Lot 6)', () => {
  it('should define all 14 official documentation chapters in SECTIONS', () => {
    expect(SECTIONS).toHaveLength(14);

    const expectedSectionIds = [
      'vision',
      'modes',
      'decision-engine',
      'physics-algorithms',
      'tech-innovations',
      'ai-sovereign',
      'digital-twin',
      'field-modules',
      'tech-architecture',
      'security-compliance',
      'competitive-matrix',
      'strategic-roadmap',
      'roles-workflows',
      'faq',
    ];

    const actualIds = SECTIONS.map((s) => s.id);
    expect(actualIds).toEqual(expectedSectionIds);

    SECTIONS.forEach((section) => {
      expect(section.id).toBeTruthy();
      expect(section.title).toBeTruthy();
      expect(section.badge).toBeTruthy();
      expect(section.Icon).toBeDefined();
    });
  });

  it('should accurately calculate deterministic ROI and net savings in DZD via calculateRoiMetrics', () => {
    // Initial defaults:
    // Action cost: 35 000 DZD
    // Towing: 45 000 DZD, Part: 75 000 DZD, Immobilization: 3 days * 25 000 = 75 000 DZD
    // Direct cost sum: 45000 + 75000 + 75000 = 195 000 DZD
    // Probability: 85% => Inaction risk: 195 000 * 0.85 = 165 750 DZD
    // Net savings: 165 750 - 35 000 = 130 750 DZD
    // ROI ratio: 165 750 / 35 000 = 4.74 => '4.7'
    const defaultMetrics = calculateRoiMetrics({
      actionCost: 35000,
      towingCost: 45000,
      partReplacement: 75000,
      immobilizationDays: 3,
      dailyLoss: 25000,
      failureProb: 85,
    });

    expect(defaultMetrics.rawBreakdownCost).toBe(195000);
    expect(defaultMetrics.totalInactionRisk).toBe(165750);
    expect(defaultMetrics.netSavings).toBe(130750);
    expect(defaultMetrics.roiRatio).toBe('4.7');

    // Dynamically adjust parameters:
    // Towing: 75 000 DZD (Saharan towing), Part: 100 000 DZD, Immob: 4 * 30 000 = 120 000 DZD
    // Total breakdown: 295 000 DZD
    // Risk: 295000 * 0.90 = 265500
    // Net savings: 265500 - 50000 = 215500
    // ROI ratio: 265500 / 50000 = 5.31 => '5.3'
    const customMetrics = calculateRoiMetrics({
      actionCost: 50000,
      towingCost: 75000,
      partReplacement: 100000,
      immobilizationDays: 4,
      dailyLoss: 30000,
      failureProb: 90,
    });

    expect(customMetrics.rawBreakdownCost).toBe(295000);
    expect(customMetrics.totalInactionRisk).toBe(265500);
    expect(customMetrics.netSavings).toBe(215500);
    expect(customMetrics.roiRatio).toBe('5.3');
  });

  it('should filter sections properly based on search query keywords', () => {
    const q1 = 'physiques';
    const matches1 = SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(q1) || s.badge.toLowerCase().includes(q1)
    );
    expect(matches1.length).toBeGreaterThanOrEqual(1);
    expect(matches1.some((s) => s.id === 'physics-algorithms')).toBe(true);

    const q2 = 'souveraine';
    const matches2 = SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(q2) || s.badge.toLowerCase().includes(q2)
    );
    expect(matches2.length).toBeGreaterThanOrEqual(1);
    expect(matches2.some((s) => s.id === 'ai-sovereign')).toBe(true);

    const q3 = 'samsara';
    const matches3 = SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(q3) || s.badge.toLowerCase().includes(q3)
    );
    expect(matches3.length).toBeGreaterThanOrEqual(1);
    expect(matches3.some((s) => s.id === 'competitive-matrix')).toBe(true);
  });
});
