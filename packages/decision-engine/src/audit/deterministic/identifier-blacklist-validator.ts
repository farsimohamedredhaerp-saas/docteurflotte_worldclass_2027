/**
 * AUD-05 : Validateur d'Identifiants Fiscaux & Contrôle Liste Noire
 * 
 * Spécifications formelles :
 * 1. IDENTIFIER_FORMAT du pack réglementaire :
 *    - FORMAT_INVALID : longueur ou caractères non conformes (ex: NIF de 14 chiffres alors que règle = 15 ou 20).
 *    - FORMAT_VALID_UNVERIFIED : syntaxe formelle correcte mais sans algorithme de contrôle officiel DGI (statut UNVERIFIED).
 * 2. Contrôle d'inscription sur la liste noire locale importée par l'utilisateur
 *    (tiers radiés, entreprises fantômes, sanctions administratives).
 */

import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export type IdentifierValidationStatus = 'FORMAT_VALID_UNVERIFIED' | 'FORMAT_INVALID' | 'BLACKLISTED';

export interface BlacklistEntity {
  nif?: string;
  nis?: string;
  rc?: string;
  companyName: string;
  reasonFr: string;
  effectiveDate: string; // YYYY-MM-DD
}

export interface AdvancedIdentifierCheckResult {
  rawIdentifier: string;
  identifierType: 'NIF' | 'NIS' | 'AI' | 'RC';
  status: IdentifierValidationStatus;
  isValid: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  rejectionReason?: string;
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class IdentifierBlacklistValidator {
  /**
   * Vérifie la conformité syntaxique et l'absence de présence sur liste noire
   */
  public static check(
    rawInput: string,
    type: 'NIF' | 'NIS' | 'AI' | 'RC',
    userBlacklist: BlacklistEntity[] = [],
    packVersion = 'DZ_AUDIT_2026_V1'
  ): AdvancedIdentifierCheckResult {
    const startTime = Date.now();
    const clean = String(rawInput ?? '').trim().replace(/[\s\-_/.]/g, '');

    // 1. Contrôle Liste Noire en priorité absolue
    const matchBlacklist = userBlacklist.find((b) => {
      if (type === 'NIF' && b.nif && b.nif.trim() === clean) return true;
      if (type === 'NIS' && b.nis && b.nis.trim() === clean) return true;
      if (type === 'RC' && b.rc && b.rc.trim().replace(/[\s\-_/.]/g, '') === clean) return true;
      return false;
    });

    if (matchBlacklist) {
      return {
        rawIdentifier: rawInput,
        identifierType: type,
        status: 'BLACKLISTED',
        isValid: false,
        isBlacklisted: true,
        blacklistReason: matchBlacklist.reasonFr,
        trace: {
          ruleCode: `AUD05_BLACKLIST_${type}`,
          packVersion,
          packHash: 'IN_MEMORY',
          inputs: { rawInput, type },
          parametersRead: { blacklistSize: userBlacklist.length },
          legalRef: 'Liste de vigilance administrative & antifraude locale',
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evaluationTimestamp: new Date().toISOString(),
          executionDurationUs: (Date.now() - startTime) * 1000,
          outcome: 'BLOCKED',
          humanReviewRequired: true,
          notes: `Entité identifiée sur liste noire : ${matchBlacklist.companyName} (${matchBlacklist.reasonFr}).`,
        },
        summaryFr: `Alerte bloquante : tiers inscrit sur la liste noire (${matchBlacklist.companyName} : ${matchBlacklist.reasonFr}).`,
      };
    }

    // 2. Contrôle syntaxique selon les règles du pack
    let isFormatValid = false;
    let reason: string | undefined;

    switch (type) {
      case 'NIF':
        // Règle formelle : 15 chiffres ou 20 chiffres numériques
        if (/^\d{15}$/.test(clean) || /^\d{20}$/.test(clean)) {
          isFormatValid = true;
        } else {
          isFormatValid = false;
          reason = `NIF non conforme (${clean.length} caractères numériques constatés au lieu de 15 ou 20).`;
        }
        break;

      case 'NIS':
        if (/^\d{11}$/.test(clean)) {
          isFormatValid = true;
        } else {
          isFormatValid = false;
          reason = `NIS non conforme (${clean.length} caractères au lieu de 11).`;
        }
        break;

      case 'AI':
        if (/^\d{11}$/.test(clean)) {
          isFormatValid = true;
        } else {
          isFormatValid = false;
          reason = `Article d Imposition non conforme (${clean.length} caractères au lieu de 11).`;
        }
        break;

      case 'RC':
        if (clean.length >= 8 && clean.length <= 18) {
          isFormatValid = true;
        } else {
          isFormatValid = false;
          reason = `Registre du Commerce de structure invalide (${clean.length} caractères).`;
        }
        break;
    }

    const status: IdentifierValidationStatus = isFormatValid ? 'FORMAT_VALID_UNVERIFIED' : 'FORMAT_INVALID';
    const outcome = isFormatValid ? 'COMPLIANT' : 'BLOCKED';

    return {
      rawIdentifier: rawInput,
      identifierType: type,
      status,
      isValid: isFormatValid,
      isBlacklisted: false,
      rejectionReason: reason,
      trace: {
        ruleCode: `AUD05_SYNTAX_${type}`,
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: { rawInput, cleanLength: clean.length },
        parametersRead: {},
        legalRef: 'Spécifications déclaratives DGI / CNRC',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.UNVERIFIED,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: !isFormatValid,
        notes: isFormatValid
          ? 'Syntaxe formelle valide sous statut UNVERIFIED (clé de contrôle non officialisée).'
          : reason,
      },
      summaryFr: isFormatValid
        ? `Identifiant ${type} conforme (statut FORMAT_VALID_UNVERIFIED).`
        : `Identifiant ${type} invalide : ${reason}`,
    };
  }
}

