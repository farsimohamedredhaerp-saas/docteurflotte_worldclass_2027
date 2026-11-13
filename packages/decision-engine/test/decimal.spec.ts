import { describe, it, expect } from 'vitest';
import { EngineMath, DinarsAmount, EngineDecimal } from '../src';

describe('EngineMath & Decimal Isolation', () => {
  it('garantit la précision exacte sans dérive en virgule flottante (0.1 + 0.2 = 0.3)', () => {
    const a = EngineMath.from('0.1');
    const b = EngineMath.from('0.2');
    const sum = a.plus(b);
    expect(sum.toString()).toBe('0.3');
    expect(sum.equals(new EngineDecimal('0.3'))).toBe(true);
  });

  it('exécute l\'arrondi HALF_UP réglementaire : 2.675 -> 2.68', () => {
    const val = EngineMath.from('2.675');
    const rounded = EngineMath.round(val, 2, 'HALF_UP');
    expect(rounded.toString()).toBe('2.68');
  });

  it('calcule exactement 0.1 * 10 = 1.00 en montant', () => {
    const unit = EngineMath.from('0.1');
    const qty = EngineMath.from('10');
    const total = EngineMath.asAmount(unit.times(qty));
    expect(total.toFixed(2)).toBe('1.00');
  });

  it('applique les échelles numériques strictes : Montant(2), Coût(6), Taux(8)', () => {
    const raw = EngineMath.from('123.4567891234');
    expect(EngineMath.asAmount(raw).toFixed(2)).toBe('123.46');
    expect(EngineMath.asCostOrQuantity(raw).toFixed(6)).toBe('123.456789');
    expect(EngineMath.asRate(raw).toFixed(8)).toBe('123.45678912');
  });

  it('gère rigoureusement la politique de division par zéro (DIV exige onZero)', () => {
    const ten = EngineMath.from('10');
    const zero = EngineMath.from('0');

    expect(() => EngineMath.divide(ten, zero, 'ERROR')).toThrow('Division par zéro interdite');
    expect(EngineMath.divide(ten, zero, 'ZERO')?.toString()).toBe('0');
    expect(EngineMath.divide(ten, zero, 'NULL')).toBeNull();
  });

  it('manipule les montants en Dinars Algériens (DinarsAmount) avec formatage francophone', () => {
    const m1 = new DinarsAmount('1500000.50');
    const m2 = new DinarsAmount('250000.25');
    const total = m1.add(m2);

    expect(total.toString()).toBe('1750000.75');
    expect(total.formatFr()).toBe('1 750 000,75 DZD');
  });
});

