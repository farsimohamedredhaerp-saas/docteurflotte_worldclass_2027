import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DumperHaulingCycle, RecordHaulingCycleDto } from '@docteurflotte/contracts';

@Injectable()
export class DumperHaulingService {
  private readonly logger = new Logger(DumperHaulingService.name);

  // Tarif de référence Gasoil officiel en Algérie
  private readonly DEFAULT_FUEL_PRICE_DZD = 29.0;
  // Durée de vie nominale d'un train de 6 pneus OTR 100T (heures de roulage)
  private readonly TIRE_SET_LIFETIME_HOURS = 6000.0;
  // Coût estimé d'un train de 6 pneus OTR (6 x 2 800 000 DZD = 16 800 000 DZD)
  private readonly TIRE_SET_COST_DZD = 16800000.0;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Calcul physique déterministe du TKPH (Tonnes-Kilomètres Par Heure)
   * Formule standard mondiale Michelin / Bridgestone pour engins de terrassement minier
   */
  calculateTkph(
    payloadTons: number,
    emptyWeightTons: number,
    distanceKm: number,
    durationMinutes: number,
  ): number {
    if (durationMinutes <= 0 || distanceKm <= 0) return 0.0;

    // 1. Charge moyenne par pneumatique sur dumper rigide (6 pneus)
    const emptyLoadPerTire = emptyWeightTons / 6.0;
    const loadedLoadPerTire = (emptyWeightTons + payloadTons) / 6.0;
    const meanTireLoadTons = (emptyLoadPerTire + loadedLoadPerTire) / 2.0;

    // 2. Vitesse moyenne du cycle (aller chargé + retour à vide)
    const cycleHours = durationMinutes / 60.0;
    const roundTripDistanceKm = distanceKm * 2.0;
    const meanSpeedKmh = roundTripDistanceKm / cycleHours;

    // 3. TKPH = Charge Moyenne (Tonnes) x Vitesse Moyenne (km/h)
    const tkph = meanTireLoadTons * meanSpeedKmh;
    return Math.round(tkph * 100) / 100;
  }

  /**
   * Correction thermique saharienne du TKPH Admissible
   * Norme ISO / Constructeur : Référence à 38°C ambiant.
   * Dégradation thermique de 0.75% par degré au-delà de 38°C (chaleur extrême Gâra Djebilet / Tébessa).
   */
  calculateAdmissibleTkph(nominalTkph: number, ambientTempC: number): number {
    if (ambientTempC <= 38.0) return nominalTkph;

    const deltaTemp = ambientTempC - 38.0;
    const deratingFactor = Math.max(0.5, 1.0 - 0.0075 * deltaTemp);
    return Math.round(nominalTkph * deratingFactor * 100) / 100;
  }

  /**
   * Calcul du coût de revient par tonne transportée (DZD / Tonne)
   */
  calculateCostPerTon(
    payloadTons: number,
    fuelConsumedLiters: number,
    durationMinutes: number,
  ): number {
    if (payloadTons <= 0) return 0.0;

    const fuelCostDzd = fuelConsumedLiters * this.DEFAULT_FUEL_PRICE_DZD;
    const cycleHours = durationMinutes / 60.0;
    const tireHourlyCostDzd = this.TIRE_SET_COST_DZD / this.TIRE_SET_LIFETIME_HOURS; // ~2 800 DZD/h
    const tireCycleCostDzd = tireHourlyCostDzd * cycleHours;

    const totalCycleCostDzd = fuelCostDzd + tireCycleCostDzd;
    const costPerTon = totalCycleCostDzd / payloadTons;
    return Math.round(costPerTon * 100) / 100;
  }

  async recordCycle(tenantId: string, dto: RecordHaulingCycleDto): Promise<DumperHaulingCycle> {
    if (!dto.siteId || !dto.assetId || !dto.payloadMetricTons || !dto.cycleDurationMinutes) {
      throw new BadRequestException('Site minier, engin, charge utile et durée obligatoires.');
    }

    const emptyWeight = dto.emptyWeightTons || 65.0; // Poids à vide dumper 100T standard (Cat 777)
    const ambientTemp = dto.ambientTempC ?? 42.0;    // Température estivale moyenne carrière algérienne
    const nominalTkph = dto.nominalTkph || 350;     // TKPH catalogue pneu 27.00R49

    const calculatedTkph = this.calculateTkph(
      dto.payloadMetricTons,
      emptyWeight,
      dto.cycleDistanceKm,
      dto.cycleDurationMinutes,
    );

    const tkphAdmissible = this.calculateAdmissibleTkph(nominalTkph, ambientTemp);
    const isTkphExceeded = calculatedTkph > tkphAdmissible;
    const coolingStandbyRecommended = isTkphExceeded || ambientTemp >= 46.0;

    const costPerTonDzd = this.calculateCostPerTon(
      dto.payloadMetricTons,
      dto.fuelConsumedLiters,
      dto.cycleDurationMinutes,
    );

    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO dumper_hauling_cycles (
          tenant_id, site_id, asset_id, driver_id, cycle_timestamp,
          cycle_duration_minutes, cycle_distance_km, payload_metric_tons,
          fuel_consumed_liters, calculated_tkph, tkph_admissible,
          is_tkph_exceeded, cost_per_ton_dzd, cooling_standby_recommended
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          tenantId,
          dto.siteId,
          dto.assetId,
          dto.driverId || null,
          dto.cycleDurationMinutes,
          dto.cycleDistanceKm,
          dto.payloadMetricTons,
          dto.fuelConsumedLiters,
          calculatedTkph,
          tkphAdmissible,
          isTkphExceeded,
          costPerTonDzd,
          coolingStandbyRecommended,
        ],
      );

      return this.mapCycle(res.rows[0]);
    });
  }

  async listCycles(
    tenantId: string,
    params?: { siteId?: string; assetId?: string; limit?: number },
  ): Promise<DumperHaulingCycle[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `SELECT * FROM dumper_hauling_cycles WHERE tenant_id = $1`;
      const values: any[] = [tenantId];
      let pIdx = 2;

      if (params?.siteId) {
        query += ` AND site_id = $${pIdx++}`;
        values.push(params.siteId);
      }
      if (params?.assetId) {
        query += ` AND asset_id = $${pIdx++}`;
        values.push(params.assetId);
      }

      query += ` ORDER BY cycle_timestamp DESC LIMIT $${pIdx}`;
      values.push(params?.limit || 50);

      const res = await client.query(query, values);
      return res.rows.map((r) => this.mapCycle(r));
    });
  }

  private mapCycle(row: any): DumperHaulingCycle {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      siteId: row.site_id,
      assetId: row.asset_id,
      driverId: row.driver_id,
      cycleTimestamp: row.cycle_timestamp?.toISOString?.() || row.cycle_timestamp,
      cycleDurationMinutes: parseFloat(row.cycle_duration_minutes),
      cycleDistanceKm: parseFloat(row.cycle_distance_km),
      payloadMetricTons: parseFloat(row.payload_metric_tons),
      fuelConsumedLiters: parseFloat(row.fuel_consumed_liters),
      calculatedTkph: parseFloat(row.calculated_tkph),
      tkphAdmissible: parseFloat(row.tkph_admissible),
      isTkphExceeded: row.is_tkph_exceeded,
      costPerTonDzd: parseFloat(row.cost_per_ton_dzd),
      coolingStandbyRecommended: row.cooling_standby_recommended,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
    };
  }
}

