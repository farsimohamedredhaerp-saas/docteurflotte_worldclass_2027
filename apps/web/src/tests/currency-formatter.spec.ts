import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber } from '../lib/currency-formatter';

describe('currency-formatter', () => {
  describe('formatCurrency', () => {
    it('formate correctement un montant en Dinar Algérien sans chaîne en dur', () => {
      const formatted = formatCurrency(18500, 'DZD', 'fr-DZ');
      expect(formatted).toBeDefined();
      expect(formatted).toContain('18');
      expect(formatted).toContain('500');
    });

    it('s\'adapte dynamiquement à une autre devise et locale (ex: EUR, fr-FR)', () => {
      const formatted = formatCurrency(2500, 'EUR', 'fr-FR');
      expect(formatted).toBeDefined();
      expect(formatted).toContain('2');
      expect(formatted).toContain('500');
      expect(formatted).toContain('€');
    });

    it('gère les valeurs à zéro sans crash', () => {
      const formatted = formatCurrency(0, 'DZD', 'fr-DZ');
      expect(formatted).toBeDefined();
      expect(formatted).toContain('0');
    });

    it('fournit un fallback propre si la locale ou devise est inconnue', () => {
      const formatted = formatCurrency(12000, 'XYZ_CURRENCY', 'invalid_locale');
      expect(formatted).toBeDefined();
      expect(formatted).toContain('12');
    });
  });

  describe('formatNumber', () => {
    it('formate les grands nombres avec séparateur de milliers', () => {
      const formatted = formatNumber(125000, 'fr-DZ');
      expect(formatted).toContain('125');
      expect(formatted).toContain('000');
    });

    it('prend en compte les décimales demandées', () => {
      const formatted = formatNumber(1.2345, 'fr-DZ', 2);
      expect(formatted).toBe('1,23');
    });
  });
});

