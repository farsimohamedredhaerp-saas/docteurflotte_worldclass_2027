/**
 * Intégrité des Packs Réglementaires & Statut de Vérification
 * 
 * RÈGLE 9 : Packs signés (Ed25519) et immuables.
 * RÈGLE 10 : Statut de vérification par paramètre.
 * Un pack contenant au moins un item UNVERIFIED ne peut pas être publié en production.
 */

import { RegPackItemKind, RegPackStatus, VerificationStatus, EvidenceLevel, Severity } from './ontology';
import { BiTemporalCoordinates } from './bitemporal';

export interface RegulatoryPackItemMeta extends BiTemporalCoordinates {
  code: string;
  kind: RegPackItemKind;
  legalRef: string;
  legalBasisVerified: boolean;
  verificationStatus: VerificationStatus;
  evidenceLevel: EvidenceLevel;
  severityDefault?: Severity;
  descriptionFr: string;
}

export interface RegulatoryPackManifest {
  packId: string;
  version: string;
  descriptionFr: string;
  status: RegPackStatus;
  contentHash: string;
  signatureEd25519?: string;
  authorEmail: string;
  reviewedByEmail?: string;
  publishedByEmail?: string;
  validatedByExpert?: string;
  createdAt: string;
  publishedAt?: string;
}

export interface PublicationGateReport {
  canPublish: boolean;
  unverifiedItemsCount: number;
  totalItemsCount: number;
  unverifiedItemCodes: string[];
  reasons: string[];
}

export function evaluatePublicationGate(
  manifest: RegulatoryPackManifest,
  items: RegulatoryPackItemMeta[]
): PublicationGateReport {
  const reasons: string[] = [];
  const unverifiedItems = items.filter(
    (item) => item.verificationStatus === VerificationStatus.UNVERIFIED
  );

  if (unverifiedItems.length > 0) {
    reasons.push(
      `Publication rejetée : ${unverifiedItems.length} paramètre(s) portent le statut UNVERIFIED (${unverifiedItems.map((i) => i.code).join(', ')}).`
    );
  }

  if (manifest.authorEmail && manifest.publishedByEmail && manifest.authorEmail === manifest.publishedByEmail) {
    reasons.push(
      `Publication rejetée : Séparation des rôles violée (l'auteur "${manifest.authorEmail}" ne peut pas être le publieur).`
    );
  }

  if (!manifest.validatedByExpert) {
    reasons.push(
      'Publication rejetée : Validation formelle par un expert-comptable ou fiscaliste obligatoire (validatedByExpert manquant).'
    );
  }

  return {
    canPublish: reasons.length === 0,
    unverifiedItemsCount: unverifiedItems.length,
    totalItemsCount: items.length,
    unverifiedItemCodes: unverifiedItems.map((i) => i.code),
    reasons,
  };
}

