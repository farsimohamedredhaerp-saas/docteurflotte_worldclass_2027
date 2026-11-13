/**
 * Cryptographie Asymétrique Ed25519 & Hachage Canonique SHA-256
 * 
 * RÈGLE 9 : Packs signés (Ed25519).
 * Tout chargement ou exécution d'un pack altéré est refusé (statut TAMPERED).
 * Clé privée jamais persistée en base ni dans le dépôt de code.
 */

import * as crypto from 'crypto';
import { canonicalizeJson } from './canonical-json';

export interface KeyPairResult {
  publicKeyPem: string;
  privateKeyPem: string;
  publicKeyHex: string;
}

export interface SignatureVerificationResult {
  valid: boolean;
  contentHash: string;
  status: 'VERIFIED' | 'TAMPERED' | 'INVALID_SIGNATURE' | 'INVALID_KEY';
  errorDetails?: string;
}

export class EngineCrypto {
  /**
   * Génère une paire de clés Ed25519 conforme aux standards RFC 8032.
   */
  static generateKeyPair(): KeyPairResult {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

    // Export en hexadécimal brut des 32 octets de la clé publique
    const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });
    // Les 32 derniers octets du DER SPN Ed25519 représentent la clé publique brute
    const rawPublicKey = publicKeyDer.subarray(publicKeyDer.length - 32);
    const publicKeyHex = rawPublicKey.toString('hex');

    return { publicKeyPem, privateKeyPem, publicKeyHex };
  }

  /**
   * Calcule le condensat SHA-256 canonique RFC 8785 d'un objet.
   */
  static computeCanonicalHash(payload: unknown): string {
    const canonicalStr = canonicalizeJson(payload);
    return crypto.createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
  }

  /**
   * Signe numériquement le payload canonique avec une clé privée Ed25519.
   * Retourne le contentHash et la signature au format hexadécimal.
   */
  static sign(payload: unknown, privateKeyPem: string): { contentHash: string; signatureHex: string } {
    const canonicalStr = canonicalizeJson(payload);
    const contentHash = crypto.createHash('sha256').update(canonicalStr, 'utf8').digest('hex');

    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const signatureBuffer = crypto.sign(null, Buffer.from(canonicalStr, 'utf8'), privateKey);

    return {
      contentHash,
      signatureHex: signatureBuffer.toString('hex'),
    };
  }

  /**
   * Vérifie la signature Ed25519 d'un payload par rapport à la clé publique.
   * Détecte immédiatement si un octet a été altéré (statut TAMPERED).
   */
  static verify(
    payload: unknown,
    signatureHex: string,
    publicKeyPem: string,
    expectedHash?: string
  ): SignatureVerificationResult {
    try {
      const canonicalStr = canonicalizeJson(payload);
      const computedHash = crypto.createHash('sha256').update(canonicalStr, 'utf8').digest('hex');

      // Vérification préalable de cohérence du hash si fourni
      if (expectedHash && computedHash !== expectedHash) {
        return {
          valid: false,
          contentHash: computedHash,
          status: 'TAMPERED',
          errorDetails: `Le condensat SHA-256 canonique (${computedHash}) ne correspond pas au condensat attendu (${expectedHash}).`,
        };
      }

      const publicKey = crypto.createPublicKey(publicKeyPem);
      const signatureBuffer = Buffer.from(signatureHex, 'hex');

      const isValid = crypto.verify(
        null,
        Buffer.from(canonicalStr, 'utf8'),
        publicKey,
        signatureBuffer
      );

      return {
        valid: isValid,
        contentHash: computedHash,
        status: isValid ? 'VERIFIED' : 'TAMPERED',
        errorDetails: isValid ? undefined : 'La signature cryptographique ne correspond pas aux données canoniques.',
      };
    } catch (err: any) {
      return {
        valid: false,
        contentHash: '',
        status: 'INVALID_SIGNATURE',
        errorDetails: err.message,
      };
    }
  }
}

/**
 * Calcule le condensat SHA-256 au format hexadécimal
 */
export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}


