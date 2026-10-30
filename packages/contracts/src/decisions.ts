export enum DecisionUrgency {
  CRITICAL = 'danger',
  WARNING = 'warning',
  INFO = 'info',
}

export enum DecisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DISMISSED = 'DISMISSED',
  APPLIED = 'APPLIED',
}

export interface DecisionRecommendation {
  id: string;
  tenantId: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  assetCategory: string;
  ruleId: string;
  ruleVersion: string;
  urgency: DecisionUrgency;
  title: string;
  description: string;
  estimatedActionCost: number;
  costInactionRisk: number;
  netExpectedSavings: number;
  confidenceScore: number;
  explanationDossier: {
    inputMetrics: Record<string, any>;
    economicHypotheses: Record<string, any>;
    potentialFailureModes: string[];
    mitigationAction: string;
  };
  status: DecisionStatus;
  resolvedWorkOrderId?: string;
  dataOrigin: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApproveDecisionDto {
  assignedTo?: string;
  customBudget?: number;
  notes?: string;
}

export interface DismissDecisionDto {
  reason: string;
}

export interface CategoryVariance {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

export interface BudgetVarianceReport {
  periodYear: number;
  periodMonth?: number;
  totalBudget: number;
  totalActual: number;
  varianceAmount: number;
  variancePercentage: number;
  isOverBudget: boolean;
  currency: string;
  categories: CategoryVariance[];
}

export interface CreateBudgetDto {
  periodYear: number;
  periodMonth?: number;
  budgetAmount: number;
  allocatedCategory: string;
}
