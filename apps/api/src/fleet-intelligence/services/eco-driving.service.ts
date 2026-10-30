import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  DriverEcoScore,
  DrivingSeverityLevel,
  EcoDrivingEvent,
  FleetEcoSummary,
} from '@docteurflotte/contracts';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class EcoDrivingService {
  private readonly logger = new Logger(EcoDrivingService.name);

  constructor(@Optional() private readonly databaseService?: DatabaseService) {}

  /**
   * Récupère le tarif de gasoil actuellement ACTIF depuis la table platform_fiscal_fuel_prices
   * synchronisée avec le moteur /admin/fiscal.
   * Si la base est inaccessible, repli sur la variable d'environnement ou signalement d'absence.
   */
  async getActiveDieselPrice(): Promise<{ priceDzd: number; officialReference: string }> {
    try {
      const pool = this.databaseService?.getPool();
      if (pool) {
        const res = await pool.query(
          `SELECT price_per_liter_dzd, official_reference_joradp
           FROM platform_fiscal_fuel_prices
           WHERE fuel_type = 'DIESEL_GASOIL' AND is_active = true
           ORDER BY effective_date DESC
           LIMIT 1`
        );
        if (res.rows && res.rows.length > 0) {
          return {
            priceDzd: Number(res.rows[0].price_per_liter_dzd),
            officialReference: res.rows[0].official_reference_joradp,
          };
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Impossible de requêter platform_fiscal_fuel_prices (${msg}), recherche du tarif dans la configuration d'environnement`
      );
    }

    const envPrice = process.env.DEFAULT_DIESEL_PRICE_DZD
      ? Number(process.env.DEFAULT_DIESEL_PRICE_DZD)
      : undefined;

    if (envPrice !== undefined && !isNaN(envPrice) && envPrice > 0) {
      return {
        priceDzd: envPrice,
        officialReference: process.env.DEFAULT_DIESEL_PRICE_REF || 'Configuration environnementale',
      };
    }

    return {
      priceDzd: 0,
      officialReference: 'Tarif non configuré (table platform_fiscal_fuel_prices requise)',
    };
  }

  // Débit de ralenti de référence (Mode 0 / Constructeur OEM)
  // Tracteur routier / Poids lourd : ~2.4 L/h, VUL : ~1.0 L/h, VL : ~0.7 L/h
  calculateIdlingFuel(
    idlingSeconds: number,
    assetCategory: string = 'HEAVY_TRUCK',
    unitPriceDzd: number = 0
  ): { liters: number; costDzd: number } {
    const hours = Math.max(0, idlingSeconds) / 3600;
    let ratePerHour = 2.4; // Défaut Poids Lourd
    if (assetCategory === 'VAN') ratePerHour = 1.0;
    else if (assetCategory === 'LIGHT_VEHICLE') ratePerHour = 0.7;
    else if (assetCategory === 'CONSTRUCTION_EQUIP') ratePerHour = 2.8;
    else if (assetCategory === 'AGRI_TRACTOR') ratePerHour = 1.8;

    const liters = Math.round(hours * ratePerHour * 100) / 100;
    const costDzd = Math.round(liters * unitPriceDzd * 100) / 100;

    return { liters, costDzd };
  }

  calculateDriverScore(metrics: {
    distanceKm: number;
    operatingHours: number;
    idlingSeconds: number;
    harshAccelCount: number;
    harshBrakeCount: number;
    harshCornerCount: number;
    overspeedSeconds: number;
  }): { score100: number; level: DrivingSeverityLevel; suggestedBonusDzd: number } {
    const km = Math.max(1, metrics.distanceKm);
    
    // Taux d'incidents pour 100 km
    const accelRate = (metrics.harshAccelCount / km) * 100;
    const brakeRate = (metrics.harshBrakeCount / km) * 100;
    const cornerRate = (metrics.harshCornerCount / km) * 100;
    const overspeedMinutes = metrics.overspeedSeconds / 60;
    const idlingHours = metrics.idlingSeconds / 3600;

    // Calcul de pénalités normalisé
    let penalty = 0;
    penalty += Math.min(25, accelRate * 4);
    penalty += Math.min(30, brakeRate * 5);
    penalty += Math.min(15, cornerRate * 3);
    penalty += Math.min(20, (overspeedMinutes / km) * 50);
    penalty += Math.min(20, (idlingHours / Math.max(1, metrics.operatingHours)) * 40);

    const score100 = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    let level = DrivingSeverityLevel.RISKY;
    let suggestedBonusDzd = 0;

    if (score100 >= 90) {
      level = DrivingSeverityLevel.EXCELLENT;
      suggestedBonusDzd = 15000; // 15 000 DA prime éco mensuelle
    } else if (score100 >= 75) {
      level = DrivingSeverityLevel.GOOD;
      suggestedBonusDzd = 8000; // 8 000 DA prime
    } else if (score100 >= 60) {
      level = DrivingSeverityLevel.MODERATE;
      suggestedBonusDzd = 0;
    }

    return { score100, level, suggestedBonusDzd };
  }

  async getFleetSummary(tenantId: string = 'tenant-demo'): Promise<FleetEcoSummary> {
    const { priceDzd: activeDieselPrice, officialReference } = await this.getActiveDieselPrice();

    const mockDrivers: DriverEcoScore[] = [
      {
        driverId: 'drv-01',
        driverName: 'Mourad Belkacem',
        tenantId,
        score100: 94,
        level: DrivingSeverityLevel.EXCELLENT,
        totalDistanceKm: 3450,
        totalOperatingHours: 68,
        idlingHours: 3.5,
        idlingFuelLiters: 8.4,
        idlingCostDzd: Math.round(8.4 * activeDieselPrice),
        harshAccelCount: 2,
        harshBrakeCount: 1,
        harshCornerCount: 0,
        overspeedMinutes: 4,
        suggestedEcoBonusDzd: 15000,
        co2ExcessKg: 22.1,
      },
      {
        driverId: 'drv-02',
        driverName: 'Karim Ziani',
        tenantId,
        score100: 88,
        level: DrivingSeverityLevel.GOOD,
        totalDistanceKm: 4120,
        totalOperatingHours: 82,
        idlingHours: 5.2,
        idlingFuelLiters: 12.5,
        idlingCostDzd: Math.round(12.5 * activeDieselPrice),
        harshAccelCount: 5,
        harshBrakeCount: 3,
        harshCornerCount: 2,
        overspeedMinutes: 12,
        suggestedEcoBonusDzd: 8000,
        co2ExcessKg: 33.0,
      },
      {
        driverId: 'drv-03',
        driverName: 'Sofiane Feghouli',
        tenantId,
        score100: 72,
        level: DrivingSeverityLevel.MODERATE,
        totalDistanceKm: 2890,
        totalOperatingHours: 59,
        idlingHours: 9.8,
        idlingFuelLiters: 23.5,
        idlingCostDzd: Math.round(23.5 * activeDieselPrice),
        harshAccelCount: 14,
        harshBrakeCount: 11,
        harshCornerCount: 6,
        overspeedMinutes: 28,
        suggestedEcoBonusDzd: 0,
        co2ExcessKg: 62.0,
      },
      {
        driverId: 'drv-04',
        driverName: 'Rachid Ghezzal',
        tenantId,
        score100: 54,
        level: DrivingSeverityLevel.RISKY,
        totalDistanceKm: 3100,
        totalOperatingHours: 64,
        idlingHours: 16.4,
        idlingFuelLiters: 39.4,
        idlingCostDzd: Math.round(39.4 * activeDieselPrice),
        harshAccelCount: 26,
        harshBrakeCount: 22,
        harshCornerCount: 11,
        overspeedMinutes: 52,
        suggestedEcoBonusDzd: 0,
        co2ExcessKg: 104.0,
      },
    ];

    const totalFleetDistanceKm = mockDrivers.reduce((acc, d) => acc + d.totalDistanceKm, 0);
    const totalIdlingHours = Math.round(mockDrivers.reduce((acc, d) => acc + d.idlingHours, 0) * 10) / 10;
    const totalWastedFuelLiters = Math.round(mockDrivers.reduce((acc, d) => acc + d.idlingFuelLiters, 0) * 10) / 10;
    const totalFinancialLossDzd = Math.round(totalWastedFuelLiters * activeDieselPrice);
    const averageFleetScore = Math.round(mockDrivers.reduce((acc, d) => acc + d.score100, 0) / mockDrivers.length);
    const potentialSavingsDzd = Math.round(totalFinancialLossDzd * 0.75); // 75% du gaspillage évitable

    return {
      tenantId,
      period: 'MONTH',
      totalFleetDistanceKm,
      totalIdlingHours,
      totalWastedFuelLiters,
      totalFinancialLossDzd,
      averageFleetScore,
      potentialSavingsDzd,
      activeFuelPriceDzd: activeDieselPrice,
      fuelPriceReference: officialReference,
      topDrivers: mockDrivers.slice(0, 2),
      bottomDrivers: mockDrivers.slice(2),
    };
  }
}
