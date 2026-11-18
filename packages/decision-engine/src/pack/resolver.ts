/**
 * Moteur de Résolution Bi-temporelle des Packs Réglementaires & Paramètres Universels
 * 
 * RÈGLE 2 : Bi-temporalité stricte (asOf, knownAt).
 * RÈGLE DE HIÉRARCHIE LÉGALE : Surcharge LFC > LF > DECRET > ARRETE > DOCTRINE.
 * RÈGLE D'OR : Zéro constante chiffrée dans le code applicatif.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { BiTemporalQuery, isBiTemporallyActive } from '../types/bitemporal';
import {
  RegulatoryParameter,
  RegulatoryParameterType,
  TrancheDefinition,
} from '../types/regulatory-parameter';
import {
  HIERARCHY_PRECEDENCE,
  RegPackDefinition,
  RegPackItemDefinition,
} from './reg-pack';

export interface BracketDetailItem {
  trancheIndex: number;
  minAmount: DecimalValue;
  maxAmount: DecimalValue | null;
  baseAmount: DecimalValue;
  rateOrDuty: string;
  calculationType: 'POURCENTAGE' | 'MONTANT_PAR_TRANCHE_100_DA';
  taxOrDuty: DecimalValue;
}

export interface BracketEvaluationResult {
  totalTaxOrDuty: DecimalValue;
  taxableAmount: DecimalValue;
  details: BracketDetailItem[];
}

export interface ResolvedPackState {
  asOf: string;
  knownAt: string;
  resolvedItems: Map<string, RegPackItemDefinition>;
  packVersions: string[];
  packHashes: string[];

  getItem(code: string): RegPackItemDefinition | undefined;
  getParameter<T = unknown>(code: string): T | undefined;
  getParameterDecimal(code: string, fallback?: string): DecimalValue;
  getTranches(code: string): TrancheDefinition[];
  hasItem(code: string): boolean;
  getAllItems(): RegPackItemDefinition[];
  
  /**
   * Évalue un barème progressif (IRG, droits de timbre) sur une assiette imposable
   */
  evaluateProgressiveBracket(code: string, taxableAmount: string | DecimalValue): BracketEvaluationResult;

  /**
   * Compile tous les paramètres résolus en un dictionnaire immuable RegulatoryParameter
   */
  compileParameterMap(): Map<string, RegulatoryParameter>;
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

      getParameterDecimal(code: string, fallback?: string): DecimalValue {
        const item = resolvedItems.get(code);
        const val = item?.payload?.value;
        if (val === undefined || val === null) {
          if (fallback !== undefined) {
            return EngineMath.from(fallback);
          }
          throw new Error(`Paramètre réglementaire obligatoire introuvable dans le pack : "${code}".`);
        }
        return EngineMath.from(String(val));
      },

      getTranches(code: string): TrancheDefinition[] {
        const item = resolvedItems.get(code);
        if (!item || !item.payload) return [];
        if (Array.isArray(item.payload.tranches)) {
          return item.payload.tranches as TrancheDefinition[];
        }
        if (typeof item.payload.value === 'string') {
          try {
            const parsed = JSON.parse(item.payload.value);
            if (Array.isArray(parsed)) return parsed as TrancheDefinition[];
          } catch {
            // Ignorer l'erreur de parsing si ce n'est pas du JSON
          }
        }
        return [];
      },

      hasItem(code: string): boolean {
        return resolvedItems.has(code);
      },

      getAllItems(): RegPackItemDefinition[] {
        return Array.from(resolvedItems.values());
      },

      evaluateProgressiveBracket(code: string, taxableAmountInput: string | DecimalValue): BracketEvaluationResult {
        const amount = EngineMath.from(taxableAmountInput);
        const tranches = this.getTranches(code);
        if (tranches.length === 0) {
          throw new Error(`Aucune tranche progressive définie pour le barème "${code}".`);
        }

        let total = new EngineDecimal('0');
        const details: BracketDetailItem[] = [];

        // Trier par index de tranche croissant
        const sortedTranches = [...tranches].sort((a, b) => a.trancheIndex - b.trancheIndex);

        for (let i = 0; i < sortedTranches.length; i++) {
          const t = sortedTranches[i];
          const rawMin = EngineMath.from(t.minAmountDzd);
          // Borne inférieure de calcul : si tranche 2 commence à 240001, la borne effective est 240000
          const lowerBound = t.trancheIndex > 1 && rawMin.greaterThan(0)
            ? rawMin.minus(1)
            : rawMin;

          const upperBound = t.maxAmountDzd ? EngineMath.from(t.maxAmountDzd) : null;
          const calcType = t.calculationType || 'POURCENTAGE';

          if (amount.lessThanOrEqualTo(lowerBound)) {
            // Assiette inférieure à cette tranche
            details.push({
              trancheIndex: t.trancheIndex,
              minAmount: rawMin,
              maxAmount: upperBound,
              baseAmount: new EngineDecimal('0'),
              rateOrDuty: t.rateOrDuty,
              calculationType: calcType,
              taxOrDuty: new EngineDecimal('0'),
            });
            continue;
          }

          // Montant imposable tombant dans cette tranche
          const effectiveUpper = upperBound !== null && amount.greaterThan(upperBound)
            ? upperBound
            : amount;

          const baseInBracket = effectiveUpper.minus(lowerBound);
          let taxOrDuty = new EngineDecimal('0');

          if (calcType === 'POURCENTAGE') {
            const rate = EngineMath.from(t.rateOrDuty);
            taxOrDuty = baseInBracket.times(rate).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
          } else if (calcType === 'MONTANT_PAR_TRANCHE_100_DA') {
            // Nombre de tranches de 100 DA entières ou commencées (arrondi supérieur)
            const dutyPer100 = EngineMath.from(t.rateOrDuty);
            const fractionsOf100 = baseInBracket.dividedBy(100).ceil();
            taxOrDuty = fractionsOf100.times(dutyPer100).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
          }

          total = total.plus(taxOrDuty);
          details.push({
            trancheIndex: t.trancheIndex,
            minAmount: rawMin,
            maxAmount: upperBound,
            baseAmount: baseInBracket,
            rateOrDuty: t.rateOrDuty,
            calculationType: calcType,
            taxOrDuty,
          });
        }

        return {
          totalTaxOrDuty: total.toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP),
          taxableAmount: amount,
          details,
        };
      },

      compileParameterMap(): Map<string, RegulatoryParameter> {
        const map = new Map<string, RegulatoryParameter>();
        for (const [code, item] of resolvedItems.entries()) {
          const payload = item.payload || {};
          const p: RegulatoryParameter = {
            parameterKey: code,
            parameterGroup: (payload.parameterGroup as string) || undefined,
            labelFr: (payload.labelFr as string) || item.descriptionFr || code,
            type: (payload.type as RegulatoryParameterType) || 'TAUX',
            value: String(payload.value ?? ''),
            unit: payload.unit as any,
            tranches: Array.isArray(payload.tranches) ? payload.tranches as TrancheDefinition[] : undefined,
            sectorCodes: Array.isArray(payload.sectorCodes) ? payload.sectorCodes as string[] : undefined,
            applicableFrom: item.validFrom,
            applicableTo: item.validTo,
            recordedAt: item.recordedAt,
            supersededAt: item.supersededAt,
            legalReference: item.legalRef,
            sourceHash: item.legalRef ? Buffer.from(item.legalRef).toString('hex') : '',
            packId: item.code,
          };
          map.set(code, p);
        }
        return map;
      },
    };
  }
}
