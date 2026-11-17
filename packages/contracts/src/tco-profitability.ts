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

