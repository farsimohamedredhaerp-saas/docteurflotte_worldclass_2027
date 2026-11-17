import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CostTwinSummary,
  ALGERIA_TCO_BENCHMARKS,
  AssetCategory,
} from '@docteurflotte/contracts';

interface AssetRow {
  id: string;
  code: string;
  name: string;
  category: string;
  telemetry_tier: 'MODE_0_DECLARATIVE' | 'MODE_1_GNSS' | 'MODE_2_CAN_J1939';
  wilaya_code?: string;
  status: string;
}

@Injectable()
export class CostTwinService {
  private readonly logger = new Logger(CostTwinService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Calcule le Jumeau Numérique de Coût (DZD/km et DZD/h) pour l'ensemble des actifs du parc.
   * Fonctionne en Mode 0 (Zéro Boîtier), Mode 1 (GNSS) et Mode 2 (CAN/J1939).
   */
  async getFleetCostTwin(tenantId: string, period?: string): Promise<CostTwinSummary[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const assetsRes = await client.query<AssetRow>(
        `SELECT id, code, name, category, telemetry_tier, status
         FROM assets
         WHERE tenant_id = $1 AND status != 'DECOMMISSIONED'
         ORDER BY code ASC`,
        [tenantId],
      );

      const summaries: CostTwinSummary[] = [];
      for (const asset of assetsRes.rows) {
        const summary = await this.calculateAssetCostTwin(client, tenantId, asset, period);
        summaries.push(summary);
      }

      return summaries;
    });
  }

  /**
   * Calcule le Jumeau Numérique de Coût pour un actif spécifique.
   */
  async getAssetCostTwin(tenantId: string, assetId: string, period?: string): Promise<CostTwinSummary> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const assetRes = await client.query<AssetRow>(
        `SELECT id, code, name, category, telemetry_tier, status
         FROM assets
         WHERE id = $1 AND tenant_id = $2`,
        [assetId, tenantId],
      );

      if (assetRes.rowCount === 0) {
        throw new NotFoundException(`Actif introuvable: ${assetId}`);
      }

      return this.calculateAssetCostTwin(client, tenantId, assetRes.rows[0], period);
    });
  }

  private async calculateAssetCostTwin(
    client: any,
    tenantId: string,
    asset: AssetRow,
    period?: string,
  ): Promise<CostTwinSummary> {
    const curPeriod = period || new Date().toISOString().substring(0, 7); // e.g. "2026-11"
    const [periodYear, periodMonth] = curPeriod.split('-').map((v) => parseInt(v, 10));

    // 1. Distance parcourue (km)
    const kmRes = await client.query(
      `SELECT COALESCE(MAX(value) - MIN(value), 0) as delta_km, COUNT(*) as readings_count
       FROM meter_readings
       WHERE tenant_id = $1 AND asset_id = $2 AND meter_type LIKE 'ODOMETER%'
         AND EXTRACT(YEAR FROM recorded_at) = $3 AND EXTRACT(MONTH FROM recorded_at) = $4`,
      [tenantId, asset.id, periodYear, periodMonth],
    );
    let distanceKm = Number(kmRes.rows[0]?.delta_km || 0);
    const readingsCount = Number(kmRes.rows[0]?.readings_count || 0);

    if (distanceKm <= 0) {
      // Estimation d'activité par défaut selon catégorie
      distanceKm = asset.category === AssetCategory.CONSTRUCTION_EQUIPMENT ? 450 : 2200;
    }

    // 2. Heures de fonctionnement
    const hoursRes = await client.query(
      `SELECT COALESCE(SUM(delta_hours_since_last), 0) as total_hours
       FROM asset_engine_hour_logs
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM recorded_at) = $3 AND EXTRACT(MONTH FROM recorded_at) = $4`,
      [tenantId, asset.id, periodYear, periodMonth],
    );
    let operatingHours = Number(hoursRes.rows[0]?.total_hours || 0);
    if (operatingHours <= 0) {
      operatingHours = asset.category === AssetCategory.CONSTRUCTION_EQUIPMENT ? 110 : Math.round(distanceKm / 40);
    }

    // 3. Dépenses Carburant Naftal
    const fuelRes = await client.query(
      `SELECT COALESCE(SUM(total_amount_dzd), 0) as fuel_amount,
              COALESCE(SUM(volume_liters), 0) as fuel_liters,
              COUNT(*) as tickets_count
       FROM naftal_card_statements
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM transaction_timestamp) = $3 AND EXTRACT(MONTH FROM transaction_timestamp) = $4`,
      [tenantId, asset.id, periodYear, periodMonth],
    );
    let fuelCostDzd = Number(fuelRes.rows[0]?.fuel_amount || 0);
    const fuelTicketsCount = Number(fuelRes.rows[0]?.tickets_count || 0);

    // Si pas de relevé carte Naftal, vérifier les fiscal_documents TICKET_NAFTAL
    if (fuelCostDzd === 0) {
      const docFuelRes = await client.query(
        `SELECT COALESCE(SUM(total_ttc_dzd), 0) as doc_fuel_cost
         FROM fiscal_documents
         WHERE tenant_id = $1 AND asset_id = $2 AND document_type = 'TICKET_NAFTAL'
           AND EXTRACT(YEAR FROM document_date) = $3 AND EXTRACT(MONTH FROM document_date) = $4`,
        [tenantId, asset.id, periodYear, periodMonth],
      );
      fuelCostDzd = Number(docFuelRes.rows[0]?.doc_fuel_cost || 0);
    }

    if (fuelCostDzd === 0) {
      // Benchmark moyen de référence
      fuelCostDzd = ALGERIA_TCO_BENCHMARKS.BASE_MONTHLY_FUEL_BENCHMARK_DZD;
    }

    // 4. Dépenses Maintenance & Pièces
    const maintRes = await client.query(
      `SELECT COALESCE(SUM(total_amount_dzd), 0) as parts_cost
       FROM work_orders
       WHERE tenant_id = $1 AND asset_id = $2
         AND EXTRACT(YEAR FROM created_at) = $3 AND EXTRACT(MONTH FROM created_at) = $4`,
      [tenantId, asset.id, periodYear, periodMonth],
    );
    let maintenanceCostDzd = Number(maintRes.rows[0]?.parts_cost || 0);
    if (maintenanceCostDzd === 0) {
      maintenanceCostDzd = ALGERIA_TCO_BENCHMARKS.BASE_MONTHLY_MAINTENANCE_BURN_DZD;
    }

    // 5. Frais Fixes & Overhead Prorata (Assurance, Amortissement, Vignette ENACTA)
    let purchaseCostBenchmark: number = ALGERIA_TCO_BENCHMARKS.DEFAULT_NEW_ASSET_COST_DZD;
    if (asset.category === AssetCategory.CONSTRUCTION_EQUIPMENT) {
      purchaseCostBenchmark = ALGERIA_TCO_BENCHMARKS.CONSTRUCTION_NEW_ASSET_COST_DZD;
    } else if (asset.category === AssetCategory.ROAD_VEHICLE) {
      purchaseCostBenchmark = ALGERIA_TCO_BENCHMARKS.LIGHT_DUTY_NEW_ASSET_COST_DZD;
    }

    const monthlyAmortization = Math.round(purchaseCostBenchmark / ALGERIA_TCO_BENCHMARKS.AMORTIZATION_PERIOD_MONTHS);
    const monthlyInsuranceAndTaxes = 18_000; // Assurance tout risque prorata + taxe vignette
    const fixedOverheadCostDzd = monthlyAmortization + monthlyInsuranceAndTaxes;

    const totalCostDzd = fuelCostDzd + maintenanceCostDzd + fixedOverheadCostDzd;
    const costPerKmDzd = distanceKm > 0 ? Math.round((totalCostDzd / distanceKm) * 100) / 100 : 0;
    const costPerHourDzd = operatingHours > 0 ? Math.round((totalCostDzd / operatingHours) * 100) / 100 : 0;

    // 6. Benchmark de référence sectoriel selon la catégorie d'actif
    let benchmarkCostPerKmDzd = 145.0; // Poids lourd standard
    if (asset.category === AssetCategory.CONSTRUCTION_EQUIPMENT) {
      benchmarkCostPerKmDzd = 280.0;
    } else if (asset.category === AssetCategory.ROAD_VEHICLE) {
      benchmarkCostPerKmDzd = 42.0;
    }

    const driftPercentage = benchmarkCostPerKmDzd > 0
      ? Math.round(((costPerKmDzd - benchmarkCostPerKmDzd) / benchmarkCostPerKmDzd) * 1000) / 10
      : 0;

    let driftSeverity: 'NORMAL' | 'ELEVATED' | 'CRITICAL' = 'NORMAL';
    if (driftPercentage > 30) {
      driftSeverity = 'CRITICAL';
    } else if (driftPercentage > 15) {
      driftSeverity = 'ELEVATED';
    }

    const savingsOpportunityDzd = driftPercentage > 0
      ? Math.max(0, Math.round((costPerKmDzd - benchmarkCostPerKmDzd) * distanceKm))
      : 0;

    // 7. Score de Fiabilité Déclarative Mode 0
    let modeZeroConfidenceScore = 100;
    if (asset.telemetry_tier === 'MODE_0_DECLARATIVE') {
      let score = 20; // Socle de base
      if (readingsCount > 0) score += 40;
      if (fuelTicketsCount > 0) score += 40;
      modeZeroConfidenceScore = Math.min(100, score);
    } else if (asset.telemetry_tier === 'MODE_1_GNSS') {
      modeZeroConfidenceScore = 95;
    } else {
      modeZeroConfidenceScore = 100;
    }

    // 8. Recommandations Prescriptives Actionnables (DZD-First)
    const actionableRecommendations: string[] = [];
    if (driftSeverity === 'CRITICAL') {
      actionableRecommendations.push(
        `Dérive critique de coût (+${driftPercentage}% vs barème): Économie potentielle de ${savingsOpportunityDzd.toLocaleString('fr-DZ')} DZD/mois en optimisant la maintenance préventive.`,
      );
    }
    if (fuelCostDzd > totalCostDzd * 0.45) {
      actionableRecommendations.push(
        'Surconsommation carburant: Activer l\'audit topographique Valhalla pour détecter les dérives de consommation sur parcours inter-Wilayas.',
      );
    }
    if (asset.telemetry_tier === 'MODE_0_DECLARATIVE' && modeZeroConfidenceScore < 70) {
      actionableRecommendations.push(
        'Mode 0 déclaratif: Photographier et scanner les tickets Naftal via le Scanner OCR pour fiabiliser le jumeau de coût à 100%.',
      );
    }
    if (actionableRecommendations.length === 0) {
      actionableRecommendations.push('Actif dans les seuils normaux de rentabilité d\'exploitation.');
    }

    return {
      assetId: asset.id,
      assetCode: asset.code,
      category: asset.category,
      telemetryTier: asset.telemetry_tier,
      wilayaCode: asset.wilaya_code,
      period: curPeriod,
      distanceKm,
      operatingHours,
      fuelCostDzd,
      maintenanceCostDzd,
      fixedOverheadCostDzd,
      totalCostDzd,
      costPerKmDzd,
      costPerHourDzd,
      benchmarkCostPerKmDzd,
      driftPercentage,
      driftSeverity,
      savingsOpportunityDzd,
      actionableRecommendations,
      modeZeroConfidenceScore,
    };
  }
}
