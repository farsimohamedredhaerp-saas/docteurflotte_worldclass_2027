/**
 * Types & Modèles de Données pour Rule Studio (SuperAdmin / Control Plane)
 */

import {
  EvidenceLevel,
  RegPackStatus,
  RegPackItemKind,
  Severity,
  VerificationStatus,
} from '@docteurflotte/decision-engine';

export type UserStudioRole = 'AUTEUR' | 'RELECTEUR' | 'PUBLIEUR' | 'EXPERT_VALIDATEUR';

export type StudioTabKey =
  | 'packs'
  | 'rules'
  | 'sandbox'
  | 'parameters'
  | 'unverified-gate'
  | 'approval'
  | 'audit-trail';

export interface StudioPackItem {
  code: string;
  kind: RegPackItemKind;
  labelFr: string;
  labelAr?: string;
  legalRef: string;
  legalBasisVerified: boolean;
  verificationStatus: VerificationStatus;
  evidenceLevel: EvidenceLevel;
  severity?: Severity;
  effectiveFrom: string;
  effectiveTo?: string;
  valueJson: any; // AST, valeur scalaire, barème, etc.
  goldenTests?: Array<{
    name: string;
    inputs: Record<string, any>;
    expected: any;
  }>;
}

export interface StudioPack {
  id: string;
  version: string; // Ex: 'DZ_LF_2026_V1'
  titleFr: string;
  titleAr: string;
  status: RegPackStatus; // DRAFT, IN_REVIEW, APPROVED, PUBLISHED, REVOKED
  validFrom: string;
  validTo?: string;
  authorId: string;
  authorName: string;
  reviewers: string[];
  validatedByExpert?: string;
  signature?: string;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
  items: StudioPackItem[];
}

export interface PackDiffSummary {
  packA: string;
  packB: string;
  addedItems: StudioPackItem[];
  removedItems: StudioPackItem[];
  modifiedItems: Array<{
    code: string;
    kind: RegPackItemKind;
    labelFr: string;
    oldValue: any;
    newValue: any;
    statusChange?: { from: VerificationStatus; to: VerificationStatus };
  }>;
}

export interface StudioAuditAction {
  id: string;
  timestamp: string;
  userRole: UserStudioRole;
  userName: string;
  actionType:
    | 'PACK_CREATED'
    | 'ITEM_EDITED'
    | 'TEST_EXECUTED'
    | 'SUBMITTED_FOR_REVIEW'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'UNVERIFIED_MODIFIED';
  targetPackId: string;
  targetItemCode?: string;
  detailsFr: string;
}
