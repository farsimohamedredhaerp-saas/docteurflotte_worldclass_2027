import type { DispatchDecisionResult } from '@/lib/api-fleet-intelligence';
import type { CalculationProofData } from '@/components/decisions';

export type DecisionsTab = 'MAINTENANCE' | 'DISPATCH';
export type UrgencyFilter = 'ALL' | 'danger' | 'warning';

export type SimScenarioId =
  | 'ALGER_RESTRICTION'
  | 'ENACTA_EXPIRED'
  | 'VHI_CRITICAL'
  | 'COMPLIANT_MISSION'
  | 'WILAYA_RESTRICTION'
  | 'CRITICAL_VHI'
  | 'ALL_CLEAN';

export interface DecisionExplanationDossier {
  inputMetrics?: Record<string, unknown>;
  economicHypotheses?: Record<string, unknown>;
  potentialFailureModes?: string[];
  mitigationAction?: string;
}

export interface DecisionItem {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  assetCategory: string;
  ruleId: string;
  urgency: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
  estimatedActionCost: number;
  costInactionRisk: number;
  netExpectedSavings: number;
  confidenceScore: number;
  status: 'PENDING' | 'APPROVED' | 'DISMISSED';
  dataOrigin?: string;
  explanationDossier?: DecisionExplanationDossier;
}

export interface BudgetVarianceReport {
  period: string;
  budgetAllocated: number;
  actualSpent: number;
  varianceAmount: number;
  variancePercentage: number;
  status: 'ON_TRACK' | 'OVER_BUDGET' | 'UNDER_BUDGET';
  currency: string;
}

export interface ScenarioDefinition {
  id: SimScenarioId;
  label: string;
  desc: string;
  badge: string;
}
