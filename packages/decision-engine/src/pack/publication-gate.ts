/**
 * Portes de Publication Strictes du Control Plane (Publication Gates)
 * 
 * RÈGLE 10 : Aucun item UNVERIFIED ne peut être publié en production.
 * RÈGLE DE CONTRÔLE INTERNE :
 * 1. Tout item RULE exige au moins un jeu doré de test.
 * 2. Aucun chevauchement temporel non résolu entre items de même hiérarchie.
 * 3. Tous les paramètres référencés par les règles doivent exister.
 * 4. Deux approbateurs distincts requis.
 * 5. L'auteur ne peut ni approuver ni publier (Maker-Checker).
 * 6. Validation formelle par un expert certifié renseignée (validated_by).
 */

import { RegPackItemKind, VerificationStatus } from '../types/ontology';
import { RegPackDefinition, RegPackItemDefinition } from './reg-pack';

export interface GateValidationFailure {
  gateCode: string;
  ruleDescription: string;
  details: string;
  violatingItemCodes?: string[];
}

export interface GateValidationReport {
  isApprovedForPublication: boolean;
  failures: GateValidationFailure[];
  verifiedItemsCount: number;
  unverifiedItemsCount: number;
  totalItemsCount: number;
}

export class PublicationGateValidator {
  /**
   * Vérifie l'ensemble des conditions suspensives avant publication d'un pack.
   */
  static validate(pack: RegPackDefinition): GateValidationReport {
    const failures: GateValidationFailure[] = [];

    // GATE 1 : Règle Zéro UNVERIFIED
    const unverifiedItems = pack.items.filter(
      (item) => item.verificationStatus === VerificationStatus.UNVERIFIED
    );
    if (unverifiedItems.length > 0) {
      failures.push({
        gateCode: 'GATE-01-ZERO-UNVERIFIED',
        ruleDescription: 'Interdiction de publier un pack contenant un paramètre au statut UNVERIFIED.',
        details: `${unverifiedItems.length} élément(s) non vérifié(s) détecté(s).`,
        violatingItemCodes: unverifiedItems.map((i) => i.code),
      });
    }

    // GATE 2 : Jeu doré obligatoire par règle
    const rulesMissingGoldens = pack.items.filter(
      (item) => item.kind === RegPackItemKind.RULE && (!item.goldenTests || item.goldenTests.length === 0)
    );
    if (rulesMissingGoldens.length > 0) {
      failures.push({
        gateCode: 'GATE-02-RULE-GOLDEN-TEST-REQUIRED',
        ruleDescription: 'Toute règle décisionnelle doit obligatoirement comporter au moins un jeu doré d\'évaluation.',
        details: `${rulesMissingGoldens.length} règle(s) dépourvue(s) de jeu doré.`,
        violatingItemCodes: rulesMissingGoldens.map((i) => i.code),
      });
    }

    // GATE 3 : Interdiction de chevauchement temporel sur même hiérarchie
    const itemsByCodeHierarchy = new Map<string, RegPackItemDefinition[]>();
    for (const item of pack.items) {
      const key = `${item.code}::${item.sourceHierarchy}`;
      const list = itemsByCodeHierarchy.get(key) || [];
      list.push(item);
      itemsByCodeHierarchy.set(key, list);
    }

    const overlappingCodes: string[] = [];
    for (const [key, items] of itemsByCodeHierarchy.entries()) {
      if (items.length > 1) {
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const b = items[j];
            // Chevauchement si (StartA < EndB) et (EndA > StartB)
            const endA = a.validTo || '9999-12-31';
            const endB = b.validTo || '9999-12-31';
            if (a.validFrom < endB && endA > b.validFrom) {
              overlappingCodes.push(a.code);
            }
          }
        }
      }
    }
    if (overlappingCodes.length > 0) {
      failures.push({
        gateCode: 'GATE-03-NO-TEMPORAL-OVERLAP',
        ruleDescription: 'Chevauchement temporel interdit pour un même élément au même niveau de hiérarchie légale.',
        details: `Conflit de validité détecté sur les éléments : ${Array.from(new Set(overlappingCodes)).join(', ')}.`,
        violatingItemCodes: Array.from(new Set(overlappingCodes)),
      });
    }

    // GATE 4 : Existence des paramètres référencés par les règles
    const availableParamCodes = new Set(
      pack.items
        .filter((i) => i.kind === RegPackItemKind.PARAMETER)
        .map((i) => i.code)
    );

    const missingReferencedParams: string[] = [];
    for (const item of pack.items) {
      if (item.kind === RegPackItemKind.RULE && item.payload?.requiredParameters) {
        const required = item.payload.requiredParameters as string[];
        for (const req of required) {
          if (!availableParamCodes.has(req)) {
            missingReferencedParams.push(`${item.code}->${req}`);
          }
        }
      }
    }
    if (missingReferencedParams.length > 0) {
      failures.push({
        gateCode: 'GATE-04-REFERENCED-PARAMS-EXIST',
        ruleDescription: 'Tous les paramètres fiscaux référencés par une règle doivent exister dans le pack.',
        details: `Paramètres manquants : ${missingReferencedParams.join(', ')}.`,
      });
    }

    // GATE 5 & 6 : Deux approbateurs distincts & Maker-Checker strict
    const approvals = pack.approvals || [];
    if (approvals.length < 2) {
      failures.push({
        gateCode: 'GATE-05-TWO-APPROVERS-REQUIRED',
        ruleDescription: 'La publication d\'un pack requiert l\'approbation formelle de deux personnes distinctes.',
        details: `Seulement ${approvals.length} approbation(s) enregistrée(s) (2 requises).`,
      });
    }

    const authorApproved = approvals.some((a) => a.approverEmail === pack.authorEmail);
    const authorIsPublisher = pack.publishedByEmail && pack.publishedByEmail === pack.authorEmail;
    if (authorApproved || authorIsPublisher) {
      failures.push({
        gateCode: 'GATE-06-MAKER-CHECKER-SEPARATION',
        ruleDescription: 'L\'auteur d\'un pack réglementaire ne peut ni l\'approuver ni le publier.',
        details: `Conflit d\'intérêt détecté : l\'auteur "${pack.authorEmail}" a approuvé ou tente de publier.`,
      });
    }

    // GATE 7 : Validation formelle par un expert-comptable ou fiscaliste
    if (!pack.validatedByExpert || pack.validatedByExpert.trim().length === 0) {
      failures.push({
        gateCode: 'GATE-07-EXPERT-VALIDATION-REQUIRED',
        ruleDescription: 'La validation par un expert-comptable ou fiscaliste agréé (validatedByExpert) est obligatoire.',
        details: 'Attestation d\'expertise légale absente.',
      });
    }

    const verifiedCount = pack.items.length - unverifiedItems.length;

    return {
      isApprovedForPublication: failures.length === 0,
      failures,
      verifiedItemsCount: verifiedCount,
      unverifiedItemsCount: unverifiedItems.length,
      totalItemsCount: pack.items.length,
    };
  }
}

