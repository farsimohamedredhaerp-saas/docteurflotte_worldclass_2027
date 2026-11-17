import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AssetDirectCostsSummary } from '@docteurflotte/contracts';

@Injectable()
export class TcoAggregationService {
  constructor(private readonly db: DatabaseService) {}

  async getAssetDirectCostsSummary(
    tenantId: string,
    assetId: string,
    year?: number,
    month?: number,
  ): Promise<AssetDirectCostsSummary> {
    const curYear = year || new Date().getFullYear();
    const curMonth = month || new Date().getMonth() + 1;

    // 1. Informations racine Asset
    const assetRes = await this.db.query(
      `SELECT id, code, name, category, telemetry_tier, status, tenant_id FROM assets WHERE id = $1`,
      [assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${assetId}`);
    }
    const asset = assetRes.rows[0];
    if (asset.tenant_id !== tenantId) {
      throw new NotFoundException(`Actif introuvable dans cette organisation`);
    }

    // 2. Kilomètres parcourus sur la période
    const kmRes = await this.db.query<{ delta_km: string | number }>(
      `SELECT COALESCE(MAX(value) - MIN(value), 0) as delta_km
       FROM meter_readings
       WHERE tenant_id = $1 AND asset_id = $2 AND meter_type LIKE 'ODOMETER%'
         AND EXTRACT(YEAR FROM recorded_at) = $3 AND EXTRACT(MONTH FROM recorded_at) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    let distanceKmRun = Number(kmRes.rows[0]?.delta_km || 0);
    if (distanceKmRun <= 0) {
      // Fallback télématique / odomètre courant
      distanceKmRun = 1200; // estimation d'exploitation par défaut si pas de relevé
    }

    // 3. Heures moteur parcourues sur la période
    const hoursRes = await this.db.query<{ total_hours: string | number; fuel_liters: string | number }>(
      `SELECT COALESCE(SUM(delta_hours_since_last), 0) as total_hours, COALESCE(SUM(fuel_consumed_liters), 0) as fuel_liters
       FROM asset_engine_hour_logs
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM recorded_at) = $3 AND EXTRACT(MONTH FROM recorded_at) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    const engineHoursRun = Number(hoursRes.rows[0]?.total_hours || 0);
    let fuelLitersTotal = Number(hoursRes.rows[0]?.fuel_liters || 0);

    // 4. Carburant Naftal
    const naftalRes = await this.db.query<{ total_cost: string | number; total_liters: string | number }>(
      `SELECT COALESCE(SUM(total_amount_dzd), 0) as total_cost, COALESCE(SUM(volume_liters), 0) as total_liters
       FROM naftal_card_statements
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM transaction_timestamp) = $3 AND EXTRACT(MONTH FROM transaction_timestamp) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    let fuelCostNaftalDzd = Number(naftalRes.rows[0]?.total_cost || 0);
    if (fuelCostNaftalDzd === 0 && fuelLitersTotal > 0) {
      // Résolution dynamique prix carburant
      const priceRes = await this.db.query<{ unit_price_dzd: string | number }>(
        `SELECT unit_price_dzd FROM platform_fiscal_fuel_prices WHERE fuel_type = 'GASOIL' AND is_active = TRUE LIMIT 1`,
      );
      const gasoilPrice = Number(priceRes.rows[0]?.unit_price_dzd || 29.0);
      fuelCostNaftalDzd = fuelLitersTotal * gasoilPrice;
    } else if (fuelCostNaftalDzd > 0 && fuelLitersTotal === 0) {
      fuelLitersTotal = Number(naftalRes.rows[0]?.total_liters || 0);
    }

    // 5. Coût des pièces consommées atelier
    const partsRes = await this.db.query<{ total_parts_cost: string | number }>(
      `SELECT COALESCE(SUM(total_cost_dzd), 0) as total_parts_cost
       FROM work_order_parts_consumption
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM consumed_at) = $3 AND EXTRACT(MONTH FROM consumed_at) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    const maintenancePartsCostDzd = Number(partsRes.rows[0]?.total_parts_cost || 0);

    // 6. Main d'œuvre atelier
    const woRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM work_orders
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM created_at) = $3 AND EXTRACT(MONTH FROM created_at) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    const woCount = Number(woRes.rows[0]?.count || 0);
    const maintenanceLaborCostDzd = woCount * 12500; // Forfait atelier estimé 12 500 DA par OT

    // 7. Pneus et pièces d'usure courante
    const tiresAndWearCostDzd = maintenancePartsCostDzd > 0 ? maintenancePartsCostDzd * 0.15 : 0;

    // 8. Amendes routières
    const finesRes = await this.db.query<{ total_fines: string | number }>(
      `SELECT COALESCE(SUM(amount_dzd), 0) as total_fines
       FROM asset_traffic_fines
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM infraction_date) = $3 AND EXTRACT(MONTH FROM infraction_date) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    const finesAndPenaltiesDzd = Number(finesRes.rows[0]?.total_fines || 0);

    // 9. Assurance et franchise
    const insRes = await this.db.query<{ total_deductible: string | number }>(
      `SELECT COALESCE(SUM(deductible_dzd), 0) as total_deductible
       FROM asset_insurance_cases
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM created_at) = $3 AND EXTRACT(MONTH FROM created_at) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    const insuranceProrataDzd = 15000 + Number(insRes.rows[0]?.total_deductible || 0); // Prorata mensuel assurance standard + franchise
    const highwayTollsDzd = 4500; // Péages A1 / RN standard
    const depreciationProrataDzd = 65000; // Amortissement linéaire comptable standard (65 000 DA/mois)

    // Total des coûts directs
    const totalDirectCostDzd =
      fuelCostNaftalDzd +
      maintenancePartsCostDzd +
      maintenanceLaborCostDzd +
      tiresAndWearCostDzd +
      insuranceProrataDzd +
      highwayTollsDzd +
      finesAndPenaltiesDzd +
      depreciationProrataDzd;

    // 10. Revenus générés
    // Revenus location
    const rentalRes = await this.db.query<{ total_rental: string | number }>(
      `SELECT COALESCE(SUM(total_ht_dzd), 0) as total_rental
       FROM asset_rental_invoices
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM issued_at) = $3 AND EXTRACT(MONTH FROM issued_at) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    const rentalRevenueDzd = Number(rentalRes.rows[0]?.total_rental || 0);

    // Missions transport
    const missionRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM logistics_consignment_notes
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM created_at) = $3 AND EXTRACT(MONTH FROM created_at) = $4`,
      [tenantId, assetId, curYear, curMonth],
    );
    const missionsCount = Number(missionRes.rows[0]?.count || 0);
    const internalMissionRevenueDzd = missionsCount * 45000; // Valorisation forfaitaire par mission 45 000 DA
    const totalGeneratedRevenueDzd = rentalRevenueDzd + internalMissionRevenueDzd;

    // Indicateurs
    const netMarginDzd = totalGeneratedRevenueDzd - totalDirectCostDzd;
    const marginPercent = totalGeneratedRevenueDzd > 0 ? (netMarginDzd / totalGeneratedRevenueDzd) * 100 : 0;
    const actualCostPerKmDzd = distanceKmRun > 0 ? totalDirectCostDzd / distanceKmRun : 0;
    const actualCostPerHourDzd = engineHoursRun > 0 ? totalDirectCostDzd / engineHoursRun : 0;

    // Budget cible
    const ccRes = await this.db.query<{ monthly_fixed_budget_dzd: string | number }>(
      `SELECT monthly_fixed_budget_dzd FROM asset_cost_centers WHERE tenant_id = $1 AND asset_id = $2`,
      [tenantId, assetId],
    );
    const targetBudget = Number(ccRes.rows[0]?.monthly_fixed_budget_dzd || 200000);
    const isOverTargetBudget = totalDirectCostDzd > targetBudget;
    const variancePct = targetBudget > 0 ? ((totalDirectCostDzd - targetBudget) / targetBudget) * 100 : 0;

    return {
      assetId,
      assetCode: asset.code,
      category: asset.category || 'POIDS_LOURD',
      telemetryTier: asset.telemetry_tier || 'MODE_1_GNSS',
      periodYear: curYear,
      periodMonth: curMonth,
      distanceKmRun,
      engineHoursRun,
      fuelCostNaftalDzd,
      fuelLitersTotal,
      maintenancePartsCostDzd,
      maintenanceLaborCostDzd,
      tiresAndWearCostDzd,
      insuranceProrataDzd,
      highwayTollsDzd,
      finesAndPenaltiesDzd,
      depreciationProrataDzd,
      totalDirectCostDzd,
      internalMissionRevenueDzd,
      rentalRevenueDzd,
      totalGeneratedRevenueDzd,
      netMarginDzd,
      marginPercent,
      actualCostPerKmDzd,
      actualCostPerHourDzd,
      isOverTargetBudget,
      variancePct,
    };
  }

  async getFleetTcoSummary(
    tenantId: string,
    year?: number,
    month?: number,
  ): Promise<AssetDirectCostsSummary[]> {
    const assetsRes = await this.db.query<{ id: string }>(
      `SELECT id FROM assets WHERE tenant_id = $1 ORDER BY code ASC`,
      [tenantId],
    );

    const summaries: AssetDirectCostsSummary[] = [];
    for (const a of assetsRes.rows) {
      const summary = await this.getAssetDirectCostsSummary(tenantId, a.id, year, month);
      summaries.push(summary);
    }
    return summaries;
  }
}

