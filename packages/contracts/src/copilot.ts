export interface CopilotQueryDto {
  prompt: string;
  contextFilter?: {
    assetId?: string;
    category?: string;
    wilaya?: string;
  };
  locale?: string;
}

export interface OllamaTelemetryInfo {
  threads: number;
  maxContextTokens: number;
  temperature: number;
  keepAlive: string;
  totalCalls: number;
  avgTokensPerSec: number;
  lastLatencyMs: number;
  isInferring: boolean;
  totalTokensGenerated: number;
}

export interface OllamaStatusResponse {
  available: boolean;
  model: string;
  baseUrl: string;
  sovereign: boolean;
  loi1807Compliant: boolean;
  mode: 'OLLAMA_QWEN_LOCAL' | 'DETERMINISTIC_FALLBACK';
  telemetry?: OllamaTelemetryInfo;
}

export interface OllamaInferenceLogEntry {
  id: string;
  timestamp: string;
  callerModule: 'COPILOT_QUERY' | 'FUEL_SCANNER' | 'PLAYGROUND' | 'DTC_INTERPRETER' | 'OEM_RESOLVER';
  rawPrompt: string;
  sanitizedPrompt: string;
  piiMaskedCount: number;
  response: string;
  isJson: boolean;
  status: 'SUCCESS' | 'FALLBACK' | 'ERROR';
  executionSource: 'OLLAMA_QWEN_LOCAL' | 'DETERMINISTIC_FALLBACK';
  durationMs: number;
  tokensGenerated?: number;
  tokensPerSec?: number;
}

export interface OllamaPlaygroundRequestDto {
  prompt: string;
  systemPrompt?: string;
  jsonFormat?: boolean;
  temperature?: number;
  maxTokens?: number;
  callerModule?: 'COPILOT_QUERY' | 'FUEL_SCANNER' | 'PLAYGROUND' | 'DTC_INTERPRETER' | 'OEM_RESOLVER';
}

export interface OllamaPlaygroundResponseDto {
  id: string;
  response: string;
  rawPrompt: string;
  sanitizedPrompt: string;
  piiMaskedCount: number;
  executionSource: 'OLLAMA_QWEN_LOCAL' | 'DETERMINISTIC_FALLBACK';
  durationMs: number;
  tokensGenerated: number;
  tokensPerSec: number;
  timestamp: string;
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
  | 'AUDIT_FUEL'
  | 'QUARANTINE_FUEL_CARD'
  | 'ENACTA_PRE_CHECK';

export type SovereignToolName =
  | 'proposer_substitution_topsis'
  | 'creer_ordre_reparation'
  | 'mettre_en_quarantaine_carte_naftal'
  | 'generer_pre_controle_enacta';

export interface SovereignToolCall {
  tool: SovereignToolName;
  parameters: Record<string, unknown>;
  confidence: number;
  justification: string;
}

export interface SubstitutionCandidateSummary {
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  topsisScore: number;
  vhiScore: number;
  approachDistanceKm: number;
  fuelCostDzd: number;
  rank: number;
}

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
  status: 'PROPOSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'REJECTED';
  toolCall?: SovereignToolCall;
  candidateVehicles?: SubstitutionCandidateSummary[];
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedAt?: string;
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
  aiSource?: 'OLLAMA_QWEN_LOCAL' | 'DETERMINISTIC_FALLBACK';
  aiModel?: string;
  confidenceScore?: number;
  disclaimer?: string;
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
