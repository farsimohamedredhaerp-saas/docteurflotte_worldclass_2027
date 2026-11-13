import { describe, it, expect } from 'vitest';
import { AlgeriaCalendar } from '../src';

describe('AlgeriaCalendar (Fuseau Africa/Algiers — UTC+1)', () => {
  it('classe une écriture à 23:30 UTC le 14/03 sur le jour local 15/03', () => {
    // 23:30 UTC le 14/03 correspond à 00:30 le 15/03 en Algérie (UTC+1)
    const utcIso = '2026-03-14T23:30:00.000Z';
    const localDate = AlgeriaCalendar.toLocalDate(utcIso);
    expect(localDate).toBe('2026-03-15');
  });

  it('maintient le jour local 14/03 pour un événement à 22:30 UTC', () => {
    // 22:30 UTC le 14/03 correspond à 23:30 le 14/03 en Algérie
    const utcIso = '2026-03-14T22:30:00.000Z';
    const localDate = AlgeriaCalendar.toLocalDate(utcIso);
    expect(localDate).toBe('2026-03-14');
  });

  it('calcule correctement l\'écart en jours calendaires et l\'addition de jours', () => {
    const d1 = '2026-01-01';
    const d2 = '2026-01-15';
    expect(AlgeriaCalendar.daysBetween(d1, d2)).toBe(14);
    expect(AlgeriaCalendar.addDays(d1, 14)).toBe(d2);
  });

  it('vérifie l\'appartenance d\'une date à un intervalle d\'exercice fiscal', () => {
    expect(AlgeriaCalendar.isDateInRange('2026-06-15', '2026-01-01', '2026-12-31')).toBe(true);
    expect(AlgeriaCalendar.isDateInRange('2027-01-01', '2026-01-01', '2026-12-31')).toBe(false);
  });
});

