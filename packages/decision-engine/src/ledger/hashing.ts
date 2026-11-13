/**
 * Cryptographie & Chaînage SHA-256 du Grand Livre (Append-Only)
 * 
 * Garantit l'immuabilité mathématique, la détection immédiate de toute altération
 * et le scellement quotidien par arbre de Merkle.
 */

import { sha256Hex } from '../crypto/ed25519.js';
import { canonicalJson } from '../crypto/canonical-json.js';
import { LedgerEntry, ChainVerificationResult } from './ledger-types.js';

export const GENESIS_HASH = '0'.repeat(64);

export interface EntryHashFields {
  prevHash: string;
  tenantId: string;
  pieceNumber: string;
  lineNumber: number;
  localDate: string;
  accountNumber: string;
  accountRole: string;
  debit: string | null;
  credit: string | null;
  amountHt: string | null;
  vatAmount: string | null;
  paymentMode?: string | null;
  collectionDate?: string | null;
  segmentCode?: string | null;
  packHash: string;
}

/**
 * Calcule le condensat SHA-256 déterministe d'une ligne d'écriture comptable
 */
export function computeEntryHash(fields: EntryHashFields): string {
  const normalized = {
    prevHash: fields.prevHash,
    tenantId: fields.tenantId,
    pieceNumber: fields.pieceNumber,
    lineNumber: fields.lineNumber,
    localDate: fields.localDate,
    accountNumber: fields.accountNumber,
    accountRole: fields.accountRole,
    debit: fields.debit ?? null,
    credit: fields.credit ?? null,
    amountHt: fields.amountHt ?? null,
    vatAmount: fields.vatAmount ?? null,
    paymentMode: fields.paymentMode ?? null,
    collectionDate: fields.collectionDate ?? null,
    segmentCode: fields.segmentCode ?? null,
    packHash: fields.packHash,
  };

  const canonical = canonicalJson(normalized);
  return sha256Hex(canonical);
}

/**
 * Vérifie l'intégrité intégrale de la chaîne du Grand Livre
 * Détecte toute altération de montant, de date, de compte ou d'ordre
 */
export function verifyChain(entries: LedgerEntry[]): ChainVerificationResult {
  if (entries.length === 0) {
    return { valid: true, entriesCount: 0 };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Vérification du lien de chaînage avec l'entrée précédente
    if (i === 0) {
      if (entry.prevHash !== GENESIS_HASH) {
        return {
          valid: false,
          entriesCount: entries.length,
          brokenAtPiece: entry.pieceNumber,
          brokenAtLine: entry.lineNumber,
          reason: `Rupture d'origine : La première écriture doit pointer vers GENESIS_HASH (trouvé: ${entry.prevHash})`,
        };
      }
    } else {
      const prevEntry = entries[i - 1];
      if (entry.prevHash !== prevEntry.hash) {
        return {
          valid: false,
          entriesCount: entries.length,
          brokenAtPiece: entry.pieceNumber,
          brokenAtLine: entry.lineNumber,
          reason: `Rupture de chaînage : prevHash (${entry.prevHash}) ne correspond pas au hash de l'écriture précédente (${prevEntry.hash})`,
        };
      }
    }

    // Recalcul du condensat SHA-256 de l'écriture
    const recalculatedHash = computeEntryHash({
      prevHash: entry.prevHash,
      tenantId: entry.tenantId,
      pieceNumber: entry.pieceNumber,
      lineNumber: entry.lineNumber,
      localDate: entry.localDate,
      accountNumber: entry.accountNumber,
      accountRole: entry.accountRole,
      debit: entry.debit,
      credit: entry.credit,
      amountHt: entry.amountHt,
      vatAmount: entry.vatAmount,
      paymentMode: entry.paymentMode ?? null,
      collectionDate: entry.collectionDate ?? null,
      segmentCode: entry.segmentCode ?? null,
      packHash: entry.packHash,
    });

    if (recalculatedHash !== entry.hash) {
      return {
        valid: false,
        entriesCount: entries.length,
        brokenAtPiece: entry.pieceNumber,
        brokenAtLine: entry.lineNumber,
        reason: `Condensat altéré : Hash stocké (${entry.hash}) différent du hash recalculé (${recalculatedHash}) pour la pièce ${entry.pieceNumber}`,
      };
    }
  }

  return { valid: true, entriesCount: entries.length };
}

/**
 * Calcule la racine d'un arbre de Merkle sur une liste de condensats
 */
export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return GENESIS_HASH;
  }
  if (hashes.length === 1) {
    return hashes[0];
  }

  let currentLevel = [...hashes];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = sha256Hex(currentLevel[i] + currentLevel[i + 1]);
        nextLevel.push(combined);
      } else {
        // En cas de nombre impair, dupliquer le dernier élément
        const combined = sha256Hex(currentLevel[i] + currentLevel[i]);
        nextLevel.push(combined);
      }
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

