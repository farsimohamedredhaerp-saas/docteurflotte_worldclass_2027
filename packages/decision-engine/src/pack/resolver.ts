/**
 * Moteur de Résolution Bi-temporelle des Packs Réglementaires
 * 
 * RÈGLE 2 : Bi-temporalité stricte (asOf, knownAt).
 * RÈGLE DE HIÉRARCHIE LÉGALE : Surcharge LFC > LF > DECRET > ARRETE > DOCTRINE.
 */

import { BiTemporalQuery, isBiTemporallyActive } from '../types/bitemporal';
import {
  HIERARCHY_PRECEDENCE,
  RegPackDefinition,
  RegPackItemDefinition,
} from './reg-pack';

export interface ResolvedPackState {
  asOf: string;
  knownAt: string;
  resolvedItems: Map<string, RegPackItemDefinition>;
  packVersions: string[];
  packHashes: string[];

  getItem(code: string): RegPackItemDefinition | undefined;
  getParameter<T = unknown>(code: string): T | undefined;
  hasItem(code: string): boolean;
  getAllItems(): RegPackItemDefinition[];
}

export class RegPackResolver {
  /**
   * Résout l'état réglementaire applicable pour une coordonnée bi-temporelle donnée.
   * Combine les packs applicables et arbitre les priorités (LFC > LF).
   */
  static resolve(
    packs: RegPackDefinition[],
    query: BiTemporalQuery
  ): ResolvedPackState {
    const activeItemsByCode = new Map<string, RegPackItemDefinition[]>();
    const packVersions = new Set<string>();
    const packHashes = new Set<string>();

    for (const pack of packs) {
      if (pack.version) packVersions.add(pack.version);
      if (pack.contentHash) packHashes.add(pack.contentHash);

      for (const item of pack.items) {
        if (isBiTemporallyActive(item, query)) {
          const list = activeItemsByCode.get(item.code) || [];
          list.push(item);
          activeItemsByCode.set(item.code, list);
        }
      }
    }

    const resolvedItems = new Map<string, RegPackItemDefinition>();

    // Arbitrage de préséance pour chaque code d'élément
    for (const [code, candidates] of activeItemsByCode.entries()) {
      if (candidates.length === 1) {
        resolvedItems.set(code, candidates[0]);
      } else {
        // Tri décroissant : priorité légale (LFC > LF) puis date d'enregistrement la plus récente
        candidates.sort((a, b) => {
          const precA = HIERARCHY_PRECEDENCE[a.sourceHierarchy] || 0;
          const precB = HIERARCHY_PRECEDENCE[b.sourceHierarchy] || 0;
          if (precA !== precB) {
            return precB - precA; // Le plus haut poids gagne (LFC > LF)
          }
          // Même niveau de hiérarchie : le plus récemment enregistré dans le système l'emporte
          return b.recordedAt.localeCompare(a.recordedAt);
        });

        resolvedItems.set(code, candidates[0]);
      }
    }

    return {
      asOf: query.asOf,
      knownAt: query.knownAt,
      resolvedItems,
      packVersions: Array.from(packVersions),
      packHashes: Array.from(packHashes),

      getItem(code: string): RegPackItemDefinition | undefined {
        return resolvedItems.get(code);
      },

      getParameter<T = unknown>(code: string): T | undefined {
        const item = resolvedItems.get(code);
        return item?.payload?.value as T | undefined;
      },

      hasItem(code: string): boolean {
        return resolvedItems.has(code);
      },

      getAllItems(): RegPackItemDefinition[] {
        return Array.from(resolvedItems.values());
      },
    };
  }
}

