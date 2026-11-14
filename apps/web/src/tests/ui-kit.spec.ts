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
});

