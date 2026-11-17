/**
 * Contrats du Module TCO & Rentabilité par Asset (Module D)
 * Consolidation de tous les flux financiers pour répondre à la question :
 * "Cet Asset m'a-t-il rapporté de l'argent ce mois-ci ?"
 */

export interface AssetCostCenter {
  id: string;
  tenantId: string;
  assetId: string; // FK racine Asset
  assetCode: string;
  costCenterCode: string;
  allocatedBusinessUnit: string;
  targetCostPerKmDzd?: number;
  targetCostPerHourDzd?: number;
  monthlyFixedBudgetDzd: number;
  createdAt: string;
}

export interface AssetDirectCostsSummary {
  assetId: string;
  assetCode: string;
  category: string;
  telemetryTier: string;
  periodYear: number;
  periodMonth: number;
  distanceKmRun: number;
  engineHoursRun: number;
  
  // Postes de coûts directs en DZD
  fuelCostNaftalDzd: number;
  fuelLitersTotal: number;
  maintenancePartsCostDzd: number;
  maintenanceLaborCostDzd: number;
  tiresAndWearCostDzd: number;
  insuranceProrataDzd: number;
  highwayTollsDzd: number;
  finesAndPenaltiesDzd: number;
  depreciationProrataDzd: number;
  totalDirectCostDzd: number;
  
  // Revenus générés par l'Asset
  internalMissionRevenueDzd: number;
  rentalRevenueDzd: number;
  totalGeneratedRevenueDzd: number;
  
  // Indicateurs de performance
  netMarginDzd: number;
  marginPercent: number;
  actualCostPerKmDzd: number;
  actualCostPerHourDzd: number;
  isOverTargetBudget: boolean;
  variancePct: number;
}

export interface RepairVsReplaceSimulation {
  assetId: string;
  assetCode: string;
  currentAgeYears: number;
  currentOdometerKm: number;
  vhiScore: number;
  estimatedImmediateRepairCostDzd: number;
  projectedMaintenanceNext24mDzd: number;
  projectedFuelConsumptionNext24mDzd: number;
  newAssetAcquisitionCostDzd: number;
  newAssetProjectedTco24mDzd: number;
  existingAssetTotalProjectedTco24mDzd: number;
  recommendedDecision: 'REPAIR_AND_CONTINUE' | 'REPLACE_BY_NEW' | 'TRANSFER_TO_LIGHT_DUTY';
  netSavingsEstimateDzd: number;
  roiMonths: number;
  justificationDossier: string;
}

/**
 * Barèmes économiques de référence TCO Algérie (Benchmarks Marché & Véhicules Neufs)
 */
export const ALGERIA_TCO_BENCHMARKS = {
  DEFAULT_NEW_ASSET_COST_DZD: 18_500_000, // Coût moyen d'acquisition poids lourd neuf (18.5M DZD)
  CONSTRUCTION_NEW_ASSET_COST_DZD: 24_000_000, // Coût moyen engin de chantier BTP neuf (24M DZD)
  LIGHT_DUTY_NEW_ASSET_COST_DZD: 6_500_000, // Coût utilitaire léger neuf (6.5M DZD)
  BASE_MONTHLY_MAINTENANCE_BURN_DZD: 35_000, // Taux d'usure mensuel de maintenance de base (35 000 DZD)
  BASE_MONTHLY_FUEL_BENCHMARK_DZD: 95_000, // Consommation mensuelle carburant de référence (95 000 DZD)
  NEW_ASSET_MONTHLY_WARRANTY_MAINTENANCE_DZD: 12_000, // Forfait mensuel entretien neuf sous garantie OEM
  AMORTIZATION_PERIOD_MONTHS: 60, // Durée d'amortissement standard (60 mois / 5 ans)
  REPLACEMENT_TCO_THRESHOLD_RATIO: 1.2, // Seuil de décision de remplacement (+20% de TCO)
  TRANSFER_SAVINGS_RATIO: 0.25, // Économie estimée en rétrogradation sur circuit court (25%)
} as const;

export interface CostTwinSummary {
  assetId: string;
  assetCode: string;
  category: string;
  telemetryTier: 'MODE_0_DECLARATIVE' | 'MODE_1_GNSS' | 'MODE_2_CAN_J1939';
  wilayaCode?: string;
  period: string; // e.g. "2026-11"
  distanceKm: number;
  operatingHours: number;
  fuelCostDzd: number;
  maintenanceCostDzd: number;
  fixedOverheadCostDzd: number;
  totalCostDzd: number;
  costPerKmDzd: number;
  costPerHourDzd: number;
  benchmarkCostPerKmDzd: number;
  driftPercentage: number;
  driftSeverity: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  savingsOpportunityDzd: number;
  actionableRecommendations: string[];
  modeZeroConfidenceScore: number; // 0 à 100% de fiabilité déclarative
}


