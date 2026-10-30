export interface CopilotQueryDto {
  prompt: string;
  contextFilter?: {
    assetId?: string;
    category?: string;
    wilaya?: string;
  };
  locale?: string;
}

export interface CopilotEvidence {
  metric: string;
  observedValue: string | number;
  threshold: string | number;
  algorithm: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export type CopilotActionType =
  | 'CREATE_WORK_ORDER'
  | 'ORDER_PARTS'
  | 'SUBSTITUTE_VEHICLE'
  | 'RESCHEDULE_MISSION'
  | 'AUDIT_FUEL';

export interface CopilotActionSuggestion {
  id: string;
  title: string;
  description: string;
  type: CopilotActionType;
  assetId: string;
  assetName: string;
  assetCode: string;
  estimatedCostDzd: number;
  estimatedRiskDzd: number;
  netSavingsDzd: number;
  roiMultiplier: number;
  confidenceScore: number;
  status: 'PROPOSED' | 'APPROVED' | 'EXECUTED';
}

export interface CopilotFleetKpis {
  totalVehiclesAnalyzed: number;
  atRiskCount: number;
  criticalFailureCount: number;
  totalInactionExposureDzd: number;
  potentialNetSavingsDzd: number;
  averageHealthVhi: number;
}

export interface CopilotResponse {
  id: string;
  query: string;
  answer: string;
  category: 'DIAGNOSTIC' | 'FLEET_HEALTH' | 'FINANCIAL_ROI' | 'FUEL_FRAUD' | 'WORK_ORDER' | 'GENERAL';
  evidences: CopilotEvidence[];
  suggestedActions: CopilotActionSuggestion[];
  kpis: CopilotFleetKpis;
  timestamp: string;
}

export interface CopilotInsightItem {
  id: string;
  title: string;
  category: 'PREDICTIVE_MAINTENANCE' | 'FUEL_WASTE' | 'REGULATORY_ALERT' | 'BUDGET_OPTIMIZATION';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  impactDzd: number;
  recommendedAction: string;
  assetId?: string;
  assetName?: string;
  createdAt: string;
}
