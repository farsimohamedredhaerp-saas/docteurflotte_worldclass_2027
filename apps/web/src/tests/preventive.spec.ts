import { describe, it, expect } from 'vitest';
import { INITIAL_OEM_TEMPLATES } from '../app/preventive/constants';
import type { UpcomingPreventiveDue } from '../app/preventive/types';

describe('OEM Preventive Maintenance Templates & Due Tracking', () => {
  it('should seed certified OEM templates with standard and Saharan severity intervals', () => {
    expect(INITIAL_OEM_TEMPLATES.length).toBeGreaterThanOrEqual(5);

    const renault = INITIAL_OEM_TEMPLATES.find((t) => t.id === 'TPL-RT-K480');
    expect(renault).toBeDefined();
    expect(renault?.make).toBe('Renault Trucks');
    expect(renault?.severityFactor).toBe(0.65);
    expect(renault?.engineOilSpec).toContain('15W-40');
    expect(renault?.criticalPoints.length).toBeGreaterThanOrEqual(3);

    const cat = INITIAL_OEM_TEMPLATES.find((t) => t.id === 'TPL-CAT-320D');
    expect(cat).toBeDefined();
    expect(cat?.category).toBe('ENGINS_BTP');
    expect(cat?.severityFactor).toBe(0.7);

    const shacman = INITIAL_OEM_TEMPLATES.find((t) => t.id === 'TPL-SH-F3000');
    expect(shacman).toBeDefined();
    expect(shacman?.make).toBe('Shacman');
    expect(shacman?.severityFactor).toBe(0.6);
  });

  it('should compute urgency status and progress percentage for upcoming dues', () => {
    const calculateUrgency = (current: number, due: number, unit: 'km' | 'h') => {
      const remaining = due - current;
      const progress = Math.min(100, Math.round((current / due) * 100));
      const urgency: 'URGENT' | 'WARNING' | 'NOMINAL' =
        remaining <= (unit === 'km' ? 500 : 25)
          ? 'URGENT'
          : remaining <= (unit === 'km' ? 2000 : 80)
          ? 'WARNING'
          : 'NOMINAL';
      return { remaining, progress, urgency };
    };

    const urgentDue = calculateUrgency(39600, 40000, 'km');
    expect(urgentDue.remaining).toBe(400);
    expect(urgentDue.progress).toBe(99);
    expect(urgentDue.urgency).toBe('URGENT');

    const warningDue = calculateUrgency(38500, 40000, 'km');
    expect(warningDue.remaining).toBe(1500);
    expect(warningDue.urgency).toBe('WARNING');

    const nominalDue = calculateUrgency(30000, 40000, 'km');
    expect(nominalDue.remaining).toBe(10000);
    expect(nominalDue.urgency).toBe('NOMINAL');

    const engineHoursDue = calculateUrgency(480, 500, 'h');
    expect(engineHoursDue.remaining).toBe(20);
    expect(engineHoursDue.urgency).toBe('URGENT');
  });

  it('should filter templates by category and search term', () => {
    const filterTemplates = (query: string, cat: string) => {
      return INITIAL_OEM_TEMPLATES.filter((tpl) => {
        const matchesCat = cat === 'ALL' || tpl.category === cat;
        const q = query.toLowerCase();
        const matchesQuery =
          q === '' ||
          tpl.make.toLowerCase().includes(q) ||
          tpl.model.toLowerCase().includes(q) ||
          tpl.engineOilSpec.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      });
    };

    const btpTemplates = filterTemplates('', 'ENGINS_BTP');
    expect(btpTemplates.length).toBe(1);
    expect(btpTemplates[0].make).toBe('Caterpillar');

    const scaniaSearch = filterTemplates('scania', 'ALL');
    expect(scaniaSearch.length).toBe(1);
    expect(scaniaSearch[0].id).toBe('TPL-SC-R450');
  });
});
