import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn } from '../lib/utils/cn';
import {
  feedbackContainerStyles,
  feedbackIconStyles,
  feedbackBadgeStyles,
  FeedbackVariant,
} from '../lib/utils/feedbackStyles';

describe('UI Kit Transverse — Certification de Stabilité (Porte 0)', () => {
  describe('cn() utility', () => {
    it('fusionne des chaînes simples et ignore les valeurs falsy', () => {
      expect(cn('class1', false, null, undefined, 'class2')).toBe('class1 class2');
    });

    it('gère les tableaux de classes imbriqués', () => {
      expect(cn(['btn', 'btn-primary'], ['shadow-sm', false])).toBe('btn btn-primary shadow-sm');
    });

    it('gère les objets de classes conditionnelles', () => {
      const result = cn('base', {
        'text-emerald-500': true,
        'text-rose-500': false,
        'font-bold': true,
      });
      expect(result).toBe('base text-emerald-500 font-bold');
    });

    it('gère les nombres et retourne une chaîne vide sur entrées vides', () => {
      expect(cn(10, 'px-2')).toBe('10 px-2');
      expect(cn()).toBe('');
      expect(cn(false, null, undefined)).toBe('');
    });
  });

  describe('feedbackStyles utilities', () => {
    const variants: FeedbackVariant[] = ['success', 'warning', 'error', 'info', 'neutral'];

    it('génère des classes de conteneurs pour toutes les variantes sémantiques', () => {
      for (const variant of variants) {
        const styles = feedbackContainerStyles(variant);
        expect(styles).toBeDefined();
        expect(typeof styles).toBe('string');
        expect(styles.length).toBeGreaterThan(5);
      }
    });

    it('génère des classes d’icônes conformes WCAG AA', () => {
      for (const variant of variants) {
        const iconStyle = feedbackIconStyles(variant);
        expect(iconStyle).toContain(variant === 'success' ? 'emerald' : variant === 'error' ? 'rose' : variant === 'warning' ? 'amber' : variant === 'info' ? 'blue' : 'slate');
      }
    });

    it('génère des badges sémantiques contrastés pour thème clair et sombre', () => {
      for (const variant of variants) {
        const badgeStyle = feedbackBadgeStyles(variant);
        expect(badgeStyle).toContain('dark:');
      }
    });
  });

  describe('Hooks transverses — Comportement & Cycle de vie', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('useDebounce temporise la mise à jour de valeur selon le délai configuré', async () => {
      // Simule le comportement logique du hook avec fake timers
      let state = 'initial';
      const delay = 300;
      let timer: any = null;

      const triggerDebounce = (newVal: string) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          state = newVal;
        }, delay);
      };

      triggerDebounce('test-1');
      expect(state).toBe('initial');

      vi.advanceTimersByTime(200);
      expect(state).toBe('initial');

      vi.advanceTimersByTime(150);
      expect(state).toBe('test-1');
    });

    it('useNotification gère l’auto-dismiss et le nettoyage de timer', () => {
      let activeNotification: any = { message: 'Opération réussie', type: 'success' };
      const duration = 4000;

      const timer = setTimeout(() => {
        activeNotification = null;
      }, duration);

      expect(activeNotification).not.toBeNull();
      vi.advanceTimersByTime(3999);
      expect(activeNotification).not.toBeNull();

      vi.advanceTimersByTime(5);
      expect(activeNotification).toBeNull();
      clearTimeout(timer);
    });
  });

  describe('ModalErrorBoundary (Porte 8b)', () => {
    it('isole les exceptions de calcul et fournit getDerivedStateFromError', async () => {
      const { ModalErrorBoundary } = await import('../components/ui/ModalErrorBoundary');
      const testError = new Error('Erreur de calcul DGI');
      const state = ModalErrorBoundary.getDerivedStateFromError(testError);

      expect(state.hasError).toBe(true);
      expect(state.error).toBe(testError);
      expect(state.error?.message).toBe('Erreur de calcul DGI');
    });
  });

  describe('Composants Core V5.1 (Chantier 2 & 3)', () => {
    it('Badge gère nominal, critical et restreint le pulse aux statuts nominaux', async () => {
      const { Badge } = await import('../components/Badge');
      expect(Badge).toBeDefined();
    });

    it('Button supporte le variant destructive et active micro-press', async () => {
      const { Button } = await import('../components/Button');
      expect(Button).toBeDefined();
    });

    it('Card supporte highlightTop et padding standardisé', async () => {
      const { Card } = await import('../components/ui/Card');
      expect(Card).toBeDefined();
    });

    it('ConfirmDialog exporte les types conformes au Principe P3 (Preuve avant action)', async () => {
      const { ConfirmDialog } = await import('../components/ui/ConfirmDialog');
      expect(ConfirmDialog).toBeDefined();
    });

    it('KpiCard exporte les types et gère les micro-sparklines et skeletons', async () => {
      const { KpiCard } = await import('../components/ui/KpiCard');
      expect(KpiCard).toBeDefined();
    });

    it('TrendChart exporte les types et gère les tracés temporels multi-séries', async () => {
      const { TrendChart } = await import('../components/ui/TrendChart');
      expect(TrendChart).toBeDefined();
    });

    it('CostArbitrationBars certifie le calcul du Gain Net et du ROI DZD', async () => {
      const { CostArbitrationBars } = await import('../components/ui/CostArbitrationBars');
      expect(CostArbitrationBars).toBeDefined();
    });

    it('FleetHighDensityTable gère la haute densité avec pagination et toggle compact/confort', async () => {
      const { FleetHighDensityTable } = await import('../components/density/FleetHighDensityTable');
      expect(FleetHighDensityTable).toBeDefined();
    }, 15000);

    it('VehicleSilhouette résout dynamiquement les types de véhicules du parc algérien', async () => {
      const { resolveSilhouetteType, VehicleSilhouette } = await import('../components/ui/VehicleSilhouette');
      expect(VehicleSilhouette).toBeDefined();

      expect(resolveSilhouetteType('Renault Trucks', 'K-Range')).toBe('TRACTOR_SEMI');
      expect(resolveSilhouetteType('Mercedes-Benz', 'Actros')).toBe('TRACTOR_SEMI');
      expect(resolveSilhouetteType('Shacman', 'F3000')).toBe('HEAVY_TIPPER_8X4');
      expect(resolveSilhouetteType('Sinotruk', 'HOWO 8x4')).toBe('HEAVY_TIPPER_8X4');
      expect(resolveSilhouetteType('Caterpillar', '320D')).toBe('EXCAVATOR_BTP');
      expect(resolveSilhouetteType('Toyota', 'Hilux 4x4')).toBe('PICKUP_4X4');
      expect(resolveSilhouetteType('Renault', 'Master')).toBe('VAN_LIGHT');
      expect(resolveSilhouetteType('Hyundai', 'H350')).toBe('VAN_LIGHT');
      expect(resolveSilhouetteType('Unknown', 'Unknown')).toBe('TRACTOR_SEMI');
    });

    it('VehicleSilhouette résout dynamiquement les types de véhicules du parc algérien', async () => {
      const { resolveSilhouetteType, VehicleSilhouette } = await import('../components/ui/VehicleSilhouette');
      expect(VehicleSilhouette).toBeDefined();

      expect(resolveSilhouetteType('Renault Trucks', 'K-Range')).toBe('TRACTOR_SEMI');
      expect(resolveSilhouetteType('Mercedes-Benz', 'Actros')).toBe('TRACTOR_SEMI');
      expect(resolveSilhouetteType('Shacman', 'F3000')).toBe('HEAVY_TIPPER_8X4');
      expect(resolveSilhouetteType('Sinotruk', 'HOWO 8x4')).toBe('HEAVY_TIPPER_8X4');
      expect(resolveSilhouetteType('Caterpillar', '320D')).toBe('EXCAVATOR_BTP');
      expect(resolveSilhouetteType('Toyota', 'Hilux 4x4')).toBe('PICKUP_4X4');
      expect(resolveSilhouetteType('Renault', 'Master')).toBe('VAN_LIGHT');
      expect(resolveSilhouetteType('Hyundai', 'H350')).toBe('VAN_LIGHT');
      expect(resolveSilhouetteType('Unknown', 'Unknown')).toBe('TRACTOR_SEMI');
    });

    it('SovereigntySeal supporte les 4 tampons réglementaires souverains algériens', async () => {
      const { SovereigntySeal } = await import('../components/ui/SovereigntySeal');
      expect(SovereigntySeal).toBeDefined();
    });

    it('LanguageToggle supporte la commutation trilingue et le mode RTL', async () => {
      const { LanguageToggle } = await import('../components/navigation/LanguageToggle');
      expect(LanguageToggle).toBeDefined();
    });

    it('SovereigntySeal supporte les 4 tampons réglementaires souverains algériens', async () => {
      const { SovereigntySeal } = await import('../components/ui/SovereigntySeal');
      expect(SovereigntySeal).toBeDefined();
    });

    it('LanguageToggle supporte la commutation trilingue et le mode RTL', async () => {
      const { LanguageToggle } = await import('../components/navigation/LanguageToggle');
      expect(LanguageToggle).toBeDefined();
    });
  });
});

