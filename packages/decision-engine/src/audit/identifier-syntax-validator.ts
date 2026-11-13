/**
 * Validateur Syntaxique des Identifiants Fiscaux & Réglementaires Algériens
 * 
 * Identifiants couverts :
 * - NIF (Numéro d'Identification Fiscale) : 15 ou 20 chiffres
 * - NIS (Numéro d'Identification Statistique) : 11 chiffres
 * - AI (Article d'Imposition) : 11 chiffres
 * - RC (Registre du Commerce) : format alphanumérique structuré (code wilaya / numéro)
 * 
 * RÈGLE FONDAMENTALE :
 * AUCUNE clé de contrôle algorithmique (type Luhn) n'est inventée sans source officielle.
 * La vérification algorithmique des clés est consignée sous statut UNVERIFIED.
 */

import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export type IdentifierType = 'NIF' | 'NIS' | 'AI' | 'RC';

export interface IdentifierFormatSpec {
  type: IdentifierType;
  allowedLengths?: number[];
  regexPattern?: string;
  isNumericOnly?: boolean;
  hasOfficialChecksumAlgorithm?: boolean;
  verificationStatus?: VerificationStatus;
  descriptionFr?: string;
}

export interface IdentifierValidationResult {
  identifierType: IdentifierType;
  rawInput: string;
  normalizedValue: string;
  isValid: boolean;
  hasOfficialChecksum: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  wilayaCode?: string;
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class IdentifierSyntaxValidator {
  /**
   * Spécifications par défaut injectables (alignées sur la réglementation algérienne)
   */
  public static getDefaultSpec(type: IdentifierType): IdentifierFormatSpec {
    switch (type) {
      case 'NIF':
        return {
          type: 'NIF',
          allowedLengths: [15, 20],
          isNumericOnly: true,
          hasOfficialChecksumAlgorithm: false,
          verificationStatus: VerificationStatus.UNVERIFIED,
          descriptionFr: 'Numéro d Identification Fiscale (15 ou 20 chiffres numériques).',
        };
      case 'NIS':
        return {
          type: 'NIS',
          allowedLengths: [11],
          isNumericOnly: true,
          hasOfficialChecksumAlgorithm: false,
          verificationStatus: VerificationStatus.UNVERIFIED,
          descriptionFr: 'Numéro d Identification Statistique (11 chiffres numériques).',
        };
      case 'AI':
        return {
          type: 'AI',
          allowedLengths: [11],
          isNumericOnly: true,
          hasOfficialChecksumAlgorithm: false,
          verificationStatus: VerificationStatus.UNVERIFIED,
          descriptionFr: 'Article d Imposition (11 chiffres numériques).',
        };
      case 'RC':
        return {
          type: 'RC',
          allowedLengths: [10, 11, 12, 13, 14, 15, 16],
          isNumericOnly: false,
          hasOfficialChecksumAlgorithm: false,
          verificationStatus: VerificationStatus.UNVERIFIED,
          descriptionFr: 'Registre du Commerce (format alphanumérique avec code Wilaya).',
        };
    }
  }

  /**
   * Valide la syntaxe d'un identifiant algérien
   */
  public static validate(
    rawInput: string,
    type: IdentifierType,
    customSpec?: IdentifierFormatSpec,
    packVersion = 'DZ_AUDIT_2026_V1'
  ): IdentifierValidationResult {
    const startTime = Date.now();
    const spec = customSpec ?? IdentifierSyntaxValidator.getDefaultSpec(type);

    if (!rawInput || typeof rawInput !== 'string') {
      return {
        identifierType: type,
        rawInput: String(rawInput ?? ''),
        normalizedValue: '',
        isValid: false,
        hasOfficialChecksum: false,
        verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
        rejectionReason: 'Valeur d identifiant vide ou invalide.',
        trace: {
          ruleCode: `IDENTIFIER_VALIDATION_${type}`,
          packVersion,
          packHash: 'IN_MEMORY',
          inputs: { rawInput },
          parametersRead: {},
          legalRef: 'Nomenclature fiscale et commerciale algérienne',
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
          evaluationTimestamp: new Date().toISOString(),
          executionDurationUs: (Date.now() - startTime) * 1000,
          outcome: 'BLOCKED',
          humanReviewRequired: true,
        },
        summaryFr: `Identifiant ${type} manquant ou non renseigné.`,
      };
    }

    // Normalisation : suppression des espaces, tirets et slashes superflus
    const normalized = rawInput.trim().replace(/[\s\-_/.]/g, '');

    // 1. Contrôle numérique strict si requis
    if (spec.isNumericOnly && !/^\d+$/.test(normalized)) {
      return {
        identifierType: type,
        rawInput,
        normalizedValue: normalized,
        isValid: false,
        hasOfficialChecksum: false,
        verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
        rejectionReason: `L identifiant ${type} doit comporter exclusivement des caractères numériques.`,
        trace: {
          ruleCode: `IDENTIFIER_VALIDATION_${type}`,
          packVersion,
          packHash: 'IN_MEMORY',
          inputs: { rawInput, normalized },
          parametersRead: { isNumericOnly: true },
          legalRef: 'Nomenclature fiscale algérienne',
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
          evaluationTimestamp: new Date().toISOString(),
          executionDurationUs: (Date.now() - startTime) * 1000,
          outcome: 'BLOCKED',
          humanReviewRequired: true,
        },
        summaryFr: `Identifiant ${type} invalide : caractères non numériques détectés.`,
      };
    }

    // 2. Contrôle des longueurs autorisées
    if (spec.allowedLengths && spec.allowedLengths.length > 0) {
      if (!spec.allowedLengths.includes(normalized.length)) {
        return {
          identifierType: type,
          rawInput,
          normalizedValue: normalized,
          isValid: false,
          hasOfficialChecksum: false,
          verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
          rejectionReason: `Longueur invalide (${normalized.length} caractères au lieu de [${spec.allowedLengths.join(', ')}]).`,
          trace: {
            ruleCode: `IDENTIFIER_VALIDATION_${type}`,
            packVersion,
            packHash: 'IN_MEMORY',
            inputs: { rawInput, length: normalized.length },
            parametersRead: { allowedLengths: spec.allowedLengths },
            legalRef: 'Nomenclature fiscale algérienne',
            evidenceLevel: EvidenceLevel.LEGAL_TEXT,
            verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
            evaluationTimestamp: new Date().toISOString(),
            executionDurationUs: (Date.now() - startTime) * 1000,
            outcome: 'BLOCKED',
            humanReviewRequired: true,
          },
          summaryFr: `Longueur incorrecte pour ${type} (${normalized.length} caractères).`,
        };
      }
    }

    // 3. Extraction de code Wilaya pour NIF ou RC si applicable
    let wilayaCode: string | undefined;
    if (type === 'NIF' && normalized.length >= 2) {
      wilayaCode = normalized.substring(0, 2);
    } else if (type === 'RC' && normalized.length >= 2) {
      wilayaCode = normalized.substring(0, 2);
    }

    // 4. Contrôle regex optionnel
    if (spec.regexPattern) {
      const reg = new RegExp(spec.regexPattern);
      if (!reg.test(normalized)) {
        return {
          identifierType: type,
          rawInput,
          normalizedValue: normalized,
          isValid: false,
          hasOfficialChecksum: false,
          verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
          rejectionReason: `Le format de l identifiant ${type} ne correspond pas au motif réglementaire attendu.`,
          trace: {
            ruleCode: `IDENTIFIER_VALIDATION_${type}`,
            packVersion,
            packHash: 'IN_MEMORY',
            inputs: { rawInput, normalized },
            parametersRead: { pattern: spec.regexPattern },
            legalRef: 'Nomenclature fiscale algérienne',
            evidenceLevel: EvidenceLevel.LEGAL_TEXT,
            verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
            evaluationTimestamp: new Date().toISOString(),
            executionDurationUs: (Date.now() - startTime) * 1000,
            outcome: 'BLOCKED',
            humanReviewRequired: true,
          },
          summaryFr: `Format non conforme pour l identifiant ${type}.`,
        };
      }
    }

    return {
      identifierType: type,
      rawInput,
      normalizedValue: normalized,
      isValid: true,
      hasOfficialChecksum: spec.hasOfficialChecksumAlgorithm ?? false,
      verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
      wilayaCode,
      trace: {
        ruleCode: `IDENTIFIER_VALIDATION_${type}`,
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: { rawInput, normalized, length: normalized.length },
        parametersRead: {
          allowedLengths: spec.allowedLengths,
          isNumericOnly: spec.isNumericOnly,
        },
        legalRef: 'Nomenclature officielle DGI / CNRC',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: spec.verificationStatus ?? VerificationStatus.UNVERIFIED,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: 'COMPLIANT',
        humanReviewRequired: false,
        notes: 'Syntaxe valide. Clé algorithmique non vérifiée (absence d algorithme officiel DGI public).',
      },
      summaryFr: `Identifiant ${type} syntaxiquement valide (${normalized.length} caractères${wilayaCode ? `, Wilaya ${wilayaCode}` : ''}).`,
    };
  }
}

