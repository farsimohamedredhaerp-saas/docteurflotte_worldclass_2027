import { describe, it, expect } from 'vitest';
import {
  hasCriticalFailure,
  countChecklistDefects,
  isInspectionCompliant,
  computeDvirKpis,
} from '../app/dvir/lib/dvirSelectors';
import { INITIAL_CHECKLIST, CHECKLIST_AR } from '../app/dvir/lib/dvirConstants';
import { DVIRItemStatus, DVIRChecklistItem, DVIRInspectionReport } from '../app/dvir/types';

describe('DVIR Inspection Domain & Regulatory Selectors (Lot 2 Smoke Tests)', () => {
  describe('INITIAL_CHECKLIST & Réglementation Algérienne', () => {
    it('contient les points de contrôle obligatoires (ENACTA, extincteur, freins pneumatiques)', () => {
      const codes = INITIAL_CHECKLIST.map((i) => i.code);
      expect(codes).toContain('BRAKES');
      expect(codes).toContain('FIRE_EXTINGUISHER');
      expect(codes).toContain('ENACTA_DOCS');
      expect(codes).toContain('TIRES');
    });

    it('fournit des traductions arabes complètes pour tous les points de contrôle', () => {
      for (const item of INITIAL_CHECKLIST) {
        expect(CHECKLIST_AR[item.code]).toBeDefined();
        expect(CHECKLIST_AR[item.code].label.length).toBeGreaterThan(0);
        expect(CHECKLIST_AR[item.code].desc.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Détection des Défaillances Critiques', () => {
    it('déclare conforme une checklist vierge de défauts', () => {
      expect(hasCriticalFailure(INITIAL_CHECKLIST)).toBe(false);
      expect(isInspectionCompliant(INITIAL_CHECKLIST)).toBe(true);
    });

    it('détecte immédiatement une anomalie critique (ex: rupture freins ou pneu délaminé)', () => {
      const defectiveChecklist: DVIRChecklistItem[] = INITIAL_CHECKLIST.map((item) =>
        item.code === 'BRAKES'
          ? { ...item, status: DVIRItemStatus.FAIL_CRITICAL, comment: 'Pression circuit < 5 bars' }
          : item
      );

      expect(hasCriticalFailure(defectiveChecklist)).toBe(true);
      expect(isInspectionCompliant(defectiveChecklist)).toBe(false);

      const counts = countChecklistDefects(defectiveChecklist);
      expect(counts.critical).toBe(1);
      expect(counts.pass).toBe(INITIAL_CHECKLIST.length - 1);
    });

    it('tolère un défaut mineur sans bloquer la conformité de départ', () => {
      const minorChecklist: DVIRChecklistItem[] = INITIAL_CHECKLIST.map((item) =>
        item.code === 'LIGHTING_SIGNALS'
          ? { ...item, status: DVIRItemStatus.FAIL_MINOR, comment: 'Feu de gabarit droit grillé' }
          : item
      );

      expect(hasCriticalFailure(minorChecklist)).toBe(false);
      expect(isInspectionCompliant(minorChecklist)).toBe(true);

      const counts = countChecklistDefects(minorChecklist);
      expect(counts.minor).toBe(1);
      expect(counts.critical).toBe(0);
    });
  });

  describe('computeDvirKpis', () => {
    it('calcule correctement les totaux conformes et critiques', () => {
      const reports: DVIRInspectionReport[] = [
        {
          id: 'rep-01',
          tenantId: 'tenant-dz',
          assetId: 'asset-01',
          assetCode: '16-10492-00',
          assetName: 'Renault K480',
          driverId: 'drv-01',
          driverName: 'Sofiane',
          inspectionType: 'PRE_TRIP' as any,
          odometerKm: 45000,
          isCompliant: true,
          hasCriticalFailures: false,
          submittedAt: '2026-11-14T08:00:00Z',
          items: [],
        },
        {
          id: 'rep-02',
          tenantId: 'tenant-dz',
          assetId: 'asset-02',
          assetCode: '30-44120-00',
          assetName: 'Shacman X3000',
          driverId: 'drv-02',
          driverName: 'Karim',
          inspectionType: 'PRE_TRIP' as any,
          odometerKm: 85000,
          isCompliant: false,
          hasCriticalFailures: true,
          submittedAt: '2026-11-14T09:00:00Z',
          items: [],
        },
      ];

      const kpis = computeDvirKpis(reports);
      expect(kpis.totalCount).toBe(2);
      expect(kpis.passCount).toBe(1);
      expect(kpis.criticalCount).toBe(1);
    });
  });
});
