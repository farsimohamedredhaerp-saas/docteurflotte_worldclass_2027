import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { EngineMath, AlgeriaCalendar } from '../src';

describe('Property-Based Invariants (fast-check)', () => {
  it('garantit la commutativité stricte de l\'addition décimale (a + b = b + a)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000000, max: 1000000000 }),
        fc.integer({ min: -1000000000, max: 1000000000 }),
        (intA, intB) => {
          const a = EngineMath.from((intA / 100).toFixed(2));
          const b = EngineMath.from((intB / 100).toFixed(2));
          const sum1 = a.plus(b);
          const sum2 = b.plus(a);
          return sum1.equals(sum2);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('garantit l\'idempotence de la mise à l\'échelle de montant (asAmount(asAmount(x)) == asAmount(x))', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000000, max: 1000000000 }),
        (val) => {
          const raw = EngineMath.from((val / 10000).toFixed(4));
          const once = EngineMath.asAmount(raw);
          const twice = EngineMath.asAmount(once);
          return once.equals(twice);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('vérifie l\'invariant de calcul calendaire : daysBetween(d, addDays(d, n)) === n', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }),
        (deltaDays) => {
          const baseDate = '2026-01-01';
          const target = AlgeriaCalendar.addDays(baseDate, deltaDays);
          const calculatedDelta = AlgeriaCalendar.daysBetween(baseDate, target);
          return calculatedDelta === deltaDays;
        }
      ),
      { numRuns: 200 }
    );
  });
});

