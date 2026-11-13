/**
 * Service de Gestion des Packs Réglementaires (Signature, Vérification & Import)
 */

import { EngineCrypto, SignatureVerificationResult } from '../crypto/ed25519';
import { PublicationGateValidator, GateValidationReport } from './publication-gate';
import { RegPackDefinition } from './reg-pack';

export interface PackVerificationSummary {
  signatureResult: SignatureVerificationResult;
  gateReport: GateValidationReport;
  isFullyCompliantForProduction: boolean;
}

export class RegPackService {
  /**
   * Signe un pack réglementaire avec une clé privée Ed25519.
   * Produit le contentHash canonique et la signature.
   */
  static signPack(pack: RegPackDefinition, privateKeyPem: string): RegPackDefinition {
    // Cloner en omettant les champs de signature existants pour le calcul canonique
    const { signatureEd25519, contentHash, ...cleanPayload } = pack;

    const { contentHash: newHash, signatureHex } = EngineCrypto.sign(cleanPayload, privateKeyPem);

    return {
      ...pack,
      contentHash: newHash,
      signatureEd25519: signatureHex,
    };
  }

  /**
   * Vérifie la signature et les portes de publication d'un pack réglementaire.
   */
  static verifyPack(pack: RegPackDefinition, publicKeyPem: string): PackVerificationSummary {
    if (!pack.signatureEd25519) {
      return {
        signatureResult: {
          valid: false,
          contentHash: pack.contentHash || '',
          status: 'INVALID_SIGNATURE',
          errorDetails: 'Pack non signé (signatureEd25519 absente).',
        },
        gateReport: PublicationGateValidator.validate(pack),
        isFullyCompliantForProduction: false,
      };
    }

    const { signatureEd25519, contentHash, ...payloadToVerify } = pack;
    // Vérification de la signature sur le payload sans la signature ni le contentHash
    const signatureResult = EngineCrypto.verify(
      payloadToVerify,
      signatureEd25519,
      publicKeyPem,
      pack.contentHash
    );

    const gateReport = PublicationGateValidator.validate(pack);

    return {
      signatureResult,
      gateReport,
      isFullyCompliantForProduction: signatureResult.valid && gateReport.isApprovedForPublication,
    };
  }
}
