import { describe, it, expect } from 'vitest';
import {
  getVhiTier,
  getVhiColor,
  getVhiStatusLabelKey,
} from '../lib/vhi-thresholds';
import {
  DEFAULT_VHI_THRESHOLDS,
  VhiThresholds,
} from '@docteurflotte/contracts';

describe('vhi-thresholds', () => {
  describe('getVhiColor', () => {
    it('retourne le vert pour un score >= healthyMin (70)', () => {
      expect(getVhiColor(85, DEFAULT_VHI_THRESHOLDS)).toBe('#10b981');
      expect(getVhiColor(70, DEFAULT_VHI_THRESHOLDS)).toBe('#10b981');
    });

    it('retourne l\'ambre pour un score entre warningMin (50) et healthyMin (70)', () => {
      expect(getVhiColor(69, DEFAULT_VHI_THRESHOLDS)).toBe('#f59e0b');
      expect(getVhiColor(50, DEFAULT_VHI_THRESHOLDS)).toBe('#f59e0b');
    });

    it('retourne le rouge pour un score < warningMin (50)', () => {
      expect(getVhiColor(49, DEFAULT_VHI_THRESHOLDS)).toBe('#ef4444');
      expect(getVhiColor(15, DEFAULT_VHI_THRESHOLDS)).toBe('#ef4444');
    });

    it('s\'adapte aux seuils personnalisés reçus de la configuration API', () => {
      const customThresholds: VhiThresholds = {
        healthyMin: 80,
        warningMin: 60,
        criticalMin: 0,
        tiers: DEFAULT_VHI_THRESHOLDS.tiers,
      };

      expect(getVhiColor(75, customThresholds)).toBe('#f59e0b');
      expect(getVhiColor(80, customThresholds)).toBe('#10b981');
      expect(getVhiColor(55, customThresholds)).toBe('#ef4444');
    });
  });

  describe('getVhiTier et getVhiStatusLabelKey', () => {
    it('mappe correctement les paliers selon les scores', () => {
      expect(getVhiStatusLabelKey(90)).toBe('digitalTwin.status.excellent');
      expect(getVhiStatusLabelKey(75)).toBe('digitalTwin.status.excellent');
      expect(getVhiStatusLabelKey(74)).toBe('digitalTwin.status.vigilance');
      expect(getVhiStatusLabelKey(60)).toBe('digitalTwin.status.vigilance');
      expect(getVhiStatusLabelKey(59)).toBe('digitalTwin.status.preCriticalRisk');
      expect(getVhiStatusLabelKey(45)).toBe('digitalTwin.status.preCriticalRisk');
      expect(getVhiStatusLabelKey(44)).toBe('digitalTwin.status.immediateStop');
      expect(getVhiStatusLabelKey(0)).toBe('digitalTwin.status.immediateStop');
    });

    it('renvoie un palier complet avec ses styles css', () => {
      const tier = getVhiTier(85);
      expect(tier.color).toBe('#10b981');
      expect(tier.bgRgba).toContain('16, 185, 129');
    });
  });
});

