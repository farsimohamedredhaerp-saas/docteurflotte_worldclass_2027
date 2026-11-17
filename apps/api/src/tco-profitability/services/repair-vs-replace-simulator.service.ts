import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RepairVsReplaceSimulation, ALGERIA_TCO_BENCHMARKS } from '@docteurflotte/contracts';

interface SimulationRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  simulation_date: string;
  horizon_months: number;
  vhi_score: string | number;
  estimated_immediate_repair_cost_dzd: string | number;
  projected_maintenance_next_24m_dzd: string | number;
  projected_fuel_consumption_next_24m_dzd: string | number;
  new_asset_acquisition_cost_dzd: string | number;
  new_asset_projected_tco_24m_dzd: string | number;
  existing_asset_total_projected_tco_24m_dzd: string | number;
  recommended_decision: 'REPAIR_AND_CONTINUE' | 'REPLACE_BY_NEW' | 'TRANSFER_TO_LIGHT_DUTY';
  net_savings_estimate_dzd: string | number;
  roi_months: string | number;
  justification_dossier: string;
  created_at: string;
}

@Injectable()
export class RepairVsReplaceSimulatorService {
  constructor(private readonly db: DatabaseService) {}

  async simulateRepairVsReplace(
    tenantId: string,
    assetId: string,
    horizonMonths: number = 24,
  ): Promise<RepairVsReplaceSimulation> {
    // 1. Informations racine Asset
    const assetRes = await this.db.query(
      `SELECT id, code, name, category, telemetry_tier, commissioning_date, status, tenant_id FROM assets WHERE id = $1`,
      [assetId],
    );
    if (assetRes.rows.length === 0) {
      throw new NotFoundException(`Actif introuvable: ${assetId}`);
    }
    const asset = assetRes.rows[0];
    if (asset.tenant_id !== tenantId) {
      throw new NotFoundException(`Actif introuvable dans cette organisation`);
    }

    // Calcul de l'âge de l'actif
    const commDate = asset.commissioning_date ? new Date(asset.commissioning_date) : new Date(Date.now() - 5 * 365 * 24 * 3600 * 1000);
    const ageYears = Math.max(1, Math.round((Date.now() - commDate.getTime()) / (365.25 * 24 * 3600 * 1000)));

    // 2. Odomètre actuel
    const odoRes = await this.db.query<{ val: string | number }>(
      `SELECT reading_value as val FROM meter_readings 
       WHERE tenant_id = $1 AND asset_id = $2 AND meter_type = 'ODOMETER'
       ORDER BY reading_date DESC LIMIT 1`,
      [tenantId, assetId],
    );
    const currentOdometerKm = Number(odoRes.rows[0]?.val || 185000);

    // 3. Calcul VHI (Vehicle Health Index) & Réparations immédiates estimées
    // Analyse des ordres de travail ouverts et sinistres non réparés
    const openWoRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM work_orders WHERE tenant_id = $1 AND asset_id = $2 AND status IN ('OPEN', 'IN_PROGRESS')`,
      [tenantId, assetId],
    );
    const openWos = Number(openWoRes.rows[0]?.count || 0);

    const openClaimsRes = await this.db.query<{ damage: string | number }>(
      `SELECT COALESCE(SUM(estimated_damage_dzd), 0) as damage FROM asset_accident_claims 
       WHERE tenant_id = $1 AND asset_id = $2 AND status IN ('REPORTED', 'UNDER_REVIEW')`,
      [tenantId, assetId],
    );
    const openDamage = Number(openClaimsRes.rows[0]?.damage || 0);

    let vhiScore = Math.max(10, 100 - (ageYears * 8) - (openWos * 12));
    if (openDamage > 500000) vhiScore -= 20;

    const estimatedImmediateRepairCostDzd = Math.max(openDamage, openWos * 45000);

    // 4. Projections TCO sur 24 mois pour l'actif existant
    // Maintenance prévisionnelle : usure mécanique + vieillissement Arrhenius (barème mensuel de base majoré de l'âge)
    const monthlyMaintenanceBurnRate =
      ALGERIA_TCO_BENCHMARKS.BASE_MONTHLY_MAINTENANCE_BURN_DZD * (1 + (ageYears * 0.15)) * (vhiScore < 60 ? 1.4 : 1.0);
    const projectedMaintenanceNext24mDzd = estimatedImmediateRepairCostDzd + (monthlyMaintenanceBurnRate * horizonMonths);

    // Carburant sur 24 mois : surconsommation si moteur dégradé (+15% si VHI < 65)
    const baseFuelMonthlyDzd = ALGERIA_TCO_BENCHMARKS.BASE_MONTHLY_FUEL_BENCHMARK_DZD;
    const fuelDegradationMultiplier = vhiScore < 65 ? 1.15 : 1.0;
    const projectedFuelConsumptionNext24mDzd = baseFuelMonthlyDzd * fuelDegradationMultiplier * horizonMonths;

    const existingAssetTotalProjectedTco24mDzd = projectedMaintenanceNext24mDzd + projectedFuelConsumptionNext24mDzd;

    // 5. Coût d'acquisition et TCO d'un actif neuf équivalent
    let newAssetAcquisitionCostDzd: number = ALGERIA_TCO_BENCHMARKS.DEFAULT_NEW_ASSET_COST_DZD;
    if (asset.category === 'ENGIN_BTP') newAssetAcquisitionCostDzd = ALGERIA_TCO_BENCHMARKS.CONSTRUCTION_NEW_ASSET_COST_DZD;
    else if (asset.category === 'UTILITAIRE_LEGER') newAssetAcquisitionCostDzd = ALGERIA_TCO_BENCHMARKS.LIGHT_DUTY_NEW_ASSET_COST_DZD;

    // Amortissement 24 mois d'un actif neuf amorti sur 60 mois + maintenance neuve sous garantie + carburant optimal
    const newAssetAmortization24m = (newAssetAcquisitionCostDzd / ALGERIA_TCO_BENCHMARKS.AMORTIZATION_PERIOD_MONTHS) * horizonMonths;
    const newAssetMaintenance24m = ALGERIA_TCO_BENCHMARKS.NEW_ASSET_MONTHLY_WARRANTY_MAINTENANCE_DZD * horizonMonths; // Sous garantie OEM
    const newAssetFuel24m = baseFuelMonthlyDzd * horizonMonths;
    const newAssetProjectedTco24mDzd = newAssetAmortization24m + newAssetMaintenance24m + newAssetFuel24m;

    // 6. Arbitrage décisionnel prescriptif
    let recommendedDecision: 'REPAIR_AND_CONTINUE' | 'REPLACE_BY_NEW' | 'TRANSFER_TO_LIGHT_DUTY' = 'REPAIR_AND_CONTINUE';
    let netSavingsEstimateDzd = 0;
    let roiMonths = 0;
    let justificationDossier = '';

    if (vhiScore < 45 || ageYears >= 9 || existingAssetTotalProjectedTco24mDzd > newAssetProjectedTco24mDzd * ALGERIA_TCO_BENCHMARKS.REPLACEMENT_TCO_THRESHOLD_RATIO) {
      recommendedDecision = 'REPLACE_BY_NEW';
      netSavingsEstimateDzd = Math.abs(existingAssetTotalProjectedTco24mDzd - newAssetProjectedTco24mDzd);
      roiMonths = Number((newAssetAcquisitionCostDzd / (monthlyMaintenanceBurnRate + (baseFuelMonthlyDzd * 0.15))).toFixed(1));
      justificationDossier = `L'actif présente un VHI critique (${vhiScore}/100) et un âge d'exploitation de ${ageYears} ans. Les coûts de maintenance projetés (${projectedMaintenanceNext24mDzd.toLocaleString('fr-DZ')} DA) et la surconsommation énergétique dépassent le coût d'amortissement d'un matériel neuf sous garantie constructeur.`;
    } else if (vhiScore < 65 || ageYears >= 6) {
      recommendedDecision = 'TRANSFER_TO_LIGHT_DUTY';
      netSavingsEstimateDzd = projectedMaintenanceNext24mDzd * ALGERIA_TCO_BENCHMARKS.TRANSFER_SAVINGS_RATIO;
      roiMonths = 12.0;
      justificationDossier = `L'actif présente une usure intermédiaire (VHI ${vhiScore}/100). Recommandation de rétrogradation hors corridors sahariens sévères vers des tournées locales / tell pour préserver la mécanique.`;
    } else {
      recommendedDecision = 'REPAIR_AND_CONTINUE';
      netSavingsEstimateDzd = newAssetProjectedTco24mDzd - existingAssetTotalProjectedTco24mDzd;
      roiMonths = 36.0;
      justificationDossier = `L'actif est en bon état mécanique (VHI ${vhiScore}/100). La poursuite de l'exploitation avec maintenance préventive programmée est l'option économique optimale avec une économie nette de ${Math.abs(netSavingsEstimateDzd).toLocaleString('fr-DZ')} DA par rapport à un investissement neuf.`;
    }

    // 7. Enregistrement en base de données immuable
    const insertSql = `
      INSERT INTO asset_decision_simulations (
        tenant_id, asset_id, horizon_months, vhi_score,
        estimated_immediate_repair_cost_dzd, projected_maintenance_next_24m_dzd,
        projected_fuel_consumption_next_24m_dzd, new_asset_acquisition_cost_dzd,
        new_asset_projected_tco_24m_dzd, existing_asset_total_projected_tco_24m_dzd,
        recommended_decision, net_savings_estimate_dzd, roi_months, justification_dossier
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const params = [
      tenantId,
      assetId,
      horizonMonths,
      vhiScore,
      estimatedImmediateRepairCostDzd,
      projectedMaintenanceNext24mDzd,
      projectedFuelConsumptionNext24mDzd,
      newAssetAcquisitionCostDzd,
      newAssetProjectedTco24mDzd,
      existingAssetTotalProjectedTco24mDzd,
      recommendedDecision,
      netSavingsEstimateDzd,
      roiMonths,
      justificationDossier,
    ];

    await this.db.query<SimulationRow>(insertSql, params);

    return {
      assetId,
      assetCode: asset.code,
      currentAgeYears: ageYears,
      currentOdometerKm,
      vhiScore,
      estimatedImmediateRepairCostDzd,
      projectedMaintenanceNext24mDzd,
      projectedFuelConsumptionNext24mDzd,
      newAssetAcquisitionCostDzd,
      newAssetProjectedTco24mDzd,
      existingAssetTotalProjectedTco24mDzd,
      recommendedDecision,
      netSavingsEstimateDzd,
      roiMonths,
      justificationDossier,
    };
  }
}

