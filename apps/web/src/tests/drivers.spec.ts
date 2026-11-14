import { describe, it, expect } from 'vitest';
import {
  isLicenseExpired,
  isMedicalCheckExpiringSoon,
  formatLicenseCategoryLabel,
  getDriverStatusBadgeConfig,
  filterDrivers,
  computeDriversKpiSummary,
} from '../app/drivers/lib/driverSelectors';
import { DriverRecord } from '../app/drivers/types';

describe('Drivers Domain & Regulatory Selectors (Lot 2 Smoke Tests)', () => {
  const sampleDrivers: DriverRecord[] = [
    {
      id: 'drv-01',
      name: 'Sofiane Djebbar',
      matriculeNumber: 'DRV-16-042',
      phone: '0550 12 34 56',
      licenseCategory: 'E',
      licenseNumber: 'DZ-16-99214',
      licenseExpiry: '2028-12-31',
      medicalCheckExpiry: '2026-12-01',
      assignedVehiclePlate: '16-10492-00',
      assignedVehicleModel: 'Renault K 480',
      currentSiteOrCorridor: 'Corridor RN1 Transsaharienne',
      ecoDrivingScore: 88,
      harshBrakingCount: 1,
      excessiveIdleMinutes: 12,
      status: 'ON_DUTY',
    },
    {
      id: 'drv-02',
      name: 'Karim Mansouri',
      matriculeNumber: 'DRV-30-108',
      phone: '0661 98 76 54',
      licenseCategory: 'BTP_ENGIN',
      licenseNumber: 'DZ-30-55421',
      licenseExpiry: '2029-05-15',
      medicalCheckExpiry: '2026-11-20', // Expiring very soon relative to mid-Nov 2026
      assignedVehiclePlate: '30-44120-00',
      assignedVehicleModel: 'Caterpillar 336D',
      currentSiteOrCorridor: 'Base Hassi Messaoud',
      ecoDrivingScore: 74,
      harshBrakingCount: 3,
      excessiveIdleMinutes: 45,
      status: 'LICENSE_WARNING',
    },
    {
      id: 'drv-03',
      name: 'Yacine Benali',
      matriculeNumber: 'DRV-09-015',
      phone: '0770 11 22 33',
      licenseCategory: 'B',
      licenseNumber: 'DZ-09-12345',
      licenseExpiry: '2025-01-01', // Expired
      medicalCheckExpiry: '2027-01-01',
      assignedVehiclePlate: '09-11223-00',
      assignedVehicleModel: 'Toyota Hilux 4x4',
      currentSiteOrCorridor: 'Base Blida',
      ecoDrivingScore: 92,
      harshBrakingCount: 0,
      excessiveIdleMinutes: 5,
      status: 'AVAILABLE',
    },
  ];

  describe('isLicenseExpired & isMedicalCheckExpiringSoon', () => {
    const refDate = new Date('2026-11-14T00:00:00.000Z');

    it('identifie correctement un permis expiré', () => {
      expect(isLicenseExpired('2025-01-01', refDate)).toBe(true);
      expect(isLicenseExpired('2028-12-31', refDate)).toBe(false);
    });

    it('détecte une visite médicale imminente (< 30 jours)', () => {
      // 2026-11-20 is 6 days after 2026-11-14
      expect(isMedicalCheckExpiringSoon('2026-11-20', 30, refDate)).toBe(true);
      // 2026-12-31 is > 30 days
      expect(isMedicalCheckExpiringSoon('2026-12-31', 30, refDate)).toBe(false);
    });
  });

  describe('formatLicenseCategoryLabel', () => {
    it('formate les libellés de permis selon la réglementation algérienne', () => {
      expect(formatLicenseCategoryLabel('E')).toContain('Semi-remorques');
      expect(formatLicenseCategoryLabel('C2')).toContain('Poids Lourds > 19t');
      expect(formatLicenseCategoryLabel('BTP_ENGIN')).toContain('CACES');
      expect(formatLicenseCategoryLabel('B')).toContain('Utilitaires Légers');
    });
  });

  describe('getDriverStatusBadgeConfig', () => {
    it('fournit les classes de statut opérationnel appropriées', () => {
      const available = getDriverStatusBadgeConfig('AVAILABLE');
      expect(available.label).toBe('Disponible');
      expect(available.dotColor).toBe('bg-emerald-500');

      const warning = getDriverStatusBadgeConfig('LICENSE_WARNING');
      expect(warning.label).toBe('Alerte Visite');
      expect(warning.dotColor).toBe('bg-amber-500');
    });
  });

  describe('filterDrivers', () => {
    it('filtre par catégorie de permis (Poids lourds vs BTP vs Léger)', () => {
      const heavy = filterDrivers(sampleDrivers, 'HEAVY', 'ALL', '');
      expect(heavy).toHaveLength(1);
      expect(heavy[0].id).toBe('drv-01');

      const btp = filterDrivers(sampleDrivers, 'BTP', 'ALL', '');
      expect(btp).toHaveLength(1);
      expect(btp[0].id).toBe('drv-02');

      const light = filterDrivers(sampleDrivers, 'LIGHT', 'ALL', '');
      expect(light).toHaveLength(1);
      expect(light[0].id).toBe('drv-03');
    });

    it('filtre par statut opérationnel', () => {
      const onDuty = filterDrivers(sampleDrivers, 'ALL', 'ON_DUTY', '');
      expect(onDuty).toHaveLength(1);
      expect(onDuty[0].id).toBe('drv-01');
    });

    it('filtre par recherche textuelle multi-colonnes', () => {
      const searchPlate = filterDrivers(sampleDrivers, 'ALL', 'ALL', '10492');
      expect(searchPlate).toHaveLength(1);
      expect(searchPlate[0].name).toBe('Sofiane Djebbar');

      const searchCorridor = filterDrivers(sampleDrivers, 'ALL', 'ALL', 'Hassi Messaoud');
      expect(searchCorridor).toHaveLength(1);
      expect(searchCorridor[0].name).toBe('Karim Mansouri');
    });
  });

  describe('computeDriversKpiSummary', () => {
    it('calcule correctement les totaux de bord', () => {
      const kpis = computeDriversKpiSummary(sampleDrivers);
      expect(kpis.totalCount).toBe(3);
      expect(kpis.onDutyCount).toBe(1);
      expect(kpis.availableCount).toBe(1);
      expect(kpis.warningCount).toBe(1);
    });
  });
});
