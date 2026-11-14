import { describe, it, expect } from 'vitest';
import { Asset, AssetCategory, AssetStatus, DataOrigin, MeterType } from '@docteurflotte/contracts';
import {
  getTelemetryTier,
  getPrimaryMeterLabel,
  isMaintenanceDue,
  computeMeterProgressPercent,
  formatMeterValue,
  formatCategoryLabel,
  AssetWithTelemetry,
} from '../app/assets/lib/assetSelectors';

describe('Assets Domain & Telemetry Selectors (Lot 2 Smoke Tests)', () => {
  const baseAsset: Asset = {
    id: 'asset-truck-1',
    tenantId: 'tenant-dz-01',
    code: '16-10492-00',
    name: 'Renault Trucks K 480 8x4',
    category: AssetCategory.HEAVY_TRUCK,
    brand: 'Renault Trucks',
    model: 'K 480',
    year: 2022,
    status: AssetStatus.OPERATIONAL,
    dataOrigin: DataOrigin.DEMO,
    primaryMeterType: MeterType.ODOMETER_KM,
    currentMeterValue: 42000,
    maintenanceIntervalValue: 30000,
    nextMaintenanceMeterValue: 40000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-11-14T00:00:00.000Z',
  };

  describe('getTelemetryTier', () => {
    it('détecte le Mode 2 CAN J1939 pour les poids lourds', () => {
      expect(getTelemetryTier(baseAsset)).toBe('MODE_2_CAN_J1939');
    });

    it('détecte le Mode 1 GNSS si traceur Traccar présent sans CAN lourd', () => {
      const van: AssetWithTelemetry = {
        ...baseAsset,
        category: AssetCategory.ROAD_VEHICLE,
        traccarDeviceId: 'traccar-451',
      };
      expect(getTelemetryTier(van)).toBe('MODE_1_GNSS');
    });

    it('respecte le palier explicite déclaré sur l actif', () => {
      const declared: AssetWithTelemetry = {
        ...baseAsset,
        telemetryTier: 'MODE_0_DECLARATIVE',
      };
      expect(getTelemetryTier(declared)).toBe('MODE_0_DECLARATIVE');
    });
  });

  describe('Compteurs & Échéances de Maintenance', () => {
    it('retourne l unité correcte du compteur principal', () => {
      expect(getPrimaryMeterLabel(MeterType.ODOMETER_KM)).toBe('km');
      expect(getPrimaryMeterLabel(MeterType.ENGINE_HOURS)).toBe('h');
    });

    it('détecte un actif en retard de maintenance (> nextMaintenanceMeterValue)', () => {
      // 42 000 km >= 40 000 km
      expect(isMaintenanceDue(baseAsset)).toBe(true);
    });

    it('considère conforme un actif dont le relevé est sous l échéance', () => {
      const okAsset: Asset = {
        ...baseAsset,
        currentMeterValue: 35000,
        nextMaintenanceMeterValue: 40000,
      };
      expect(isMaintenanceDue(okAsset)).toBe(false);
    });

    it('calcule le pourcentage de progression d usure vers l intervalle', () => {
      const midAsset: Asset = {
        ...baseAsset,
        currentMeterValue: 25000,
        nextMaintenanceMeterValue: 40000,
        maintenanceIntervalValue: 30000, // début d'intervalle à 10 000
      };
      // (25000 - 10000) / 30000 = 50%
      expect(computeMeterProgressPercent(midAsset)).toBe(50);
    });

    it('formate les relevés selon les conventions algériennes', () => {
      expect(formatMeterValue(42000, MeterType.ODOMETER_KM)).toContain('42');
      expect(formatMeterValue(42000, MeterType.ODOMETER_KM)).toContain('km');
      expect(formatMeterValue(250, MeterType.ENGINE_HOURS)).toContain('250 h');
    });

    it('formate les libellés de catégories', () => {
      expect(formatCategoryLabel(AssetCategory.HEAVY_TRUCK)).toContain('Poids Lourd');
      expect(formatCategoryLabel(AssetCategory.CONSTRUCTION_EQUIPMENT)).toContain('BTP');
    });
  });
});
