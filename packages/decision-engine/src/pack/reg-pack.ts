/**
 * Définition et Structure des Packs Réglementaires (Control Plane)
 * 
 * RÈGLE 1 : L'ontologie est du code, les valeurs sont des données.
 * RÈGLE 2 : Bi-temporalité stricte (valid_from/valid_to & recorded_at/superseded_at).
 * RÈGLE 9 : Signature cryptographique Ed25519.
 * RÈGLE 10 : Statut de vérification explicite (SOURCED_OFFICIAL, SOURCED_SECONDARY, UNVERIFIED).
 */

import {
  EvidenceLevel,
  RegPackItemKind,
  RegPackStatus,
  VerificationStatus,
} from '../types/ontology';
import { BiTemporalCoordinates } from '../types/bitemporal';

export type LegalSourceHierarchy = 'LFC' | 'LF' | 'DECRET' | 'ARRETE' | 'DOCTRINE';

export const HIERARCHY_PRECEDENCE: Record<LegalSourceHierarchy, number> = {
  LFC: 50,      // Loi de Finances Complémentaire (surcharge la LF ordinaire)
  LF: 40,       // Loi de Finances annuelle
  DECRET: 30,   // Décret exécutif
  ARRETE: 20,   // Arrêté ministériel
  DOCTRINE: 10, // Note ou circulaire administrative
};

export interface GoldenTestItem {
  name: string;
  inputs: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
}

export interface RegPackItemDefinition extends BiTemporalCoordinates {
  code: string;
  kind: RegPackItemKind;
  sourceHierarchy: LegalSourceHierarchy;
  legalRef: string;
  legalBasisVerified: boolean;
  verificationStatus: VerificationStatus;
  evidenceLevel: EvidenceLevel;
  payload: Record<string, unknown>;
  descriptionFr?: string;
  goldenTests?: GoldenTestItem[];
}

export interface RegPackApprovalRecord {
  approverEmail: string;
  role: string;
  approvedAt: string;
}

export interface RegPackDefinition {
  packCode: string;
  version: string;
  descriptionFr: string;
  status: RegPackStatus;
  authorEmail: string;
  publishedByEmail?: string;
  validatedByExpert?: string;
  createdAt: string;
  publishedAt?: string;
  items: RegPackItemDefinition[];
  approvals?: RegPackApprovalRecord[];
  contentHash?: string;
  signatureEd25519?: string;
}

