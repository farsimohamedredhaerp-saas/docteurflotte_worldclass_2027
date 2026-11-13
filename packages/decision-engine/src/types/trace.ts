/**
 * Traçabilité & Explicabilité des Décisions
 * 
 * RÈGLE 5 : Explicabilité absolue.
 * Tout résultat du moteur porte une trace intégrale :
 * règle, version du pack, entrées, paramètres lus, référence légale, niveau de preuve.
 * 
 * RÈGLE 6 : Indicateurs, pas accusations.
 * Le moteur produit des signaux de risque et indices d'audit, jamais de condamnations.
 */

import { EvidenceLevel, Severity, VerificationStatus } from './ontology';

export interface RuleExecutionTrace {
  ruleCode: string;
  packVersion: string;
  packHash: string;
  inputs: Record<string, unknown>;
  parametersRead: Record<string, unknown>;
  legalRef: string;
  evidenceLevel: EvidenceLevel;
  verificationStatus: VerificationStatus;
  evaluationTimestamp: string;
  executionDurationUs: number;
  outcome: 'COMPLIANT' | 'RISK_DETECTED' | 'NOT_APPLICABLE' | 'BLOCKED';
  humanReviewRequired: boolean;
  notes?: string;
}

export interface EngineDecisionResult<T> {
  value: T;
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  trace: RuleExecutionTrace;
  explanationFr: string;
  actionRecommendationFr: string;
}

