/**
 * Moteur de Comptabilité Analytique & Ventilation Multi-Axes
 * 
 * Permet la répartition des charges et produits selon de multiples dimensions :
 * - Centres de Coûts (ex: Ateliers, Flottes Wilayas, Logistique, Administration)
 * - Centres de Profits (ex: Fret Lourd, Messagerie, Location BTPH)
 * - Projets / Chantiers BTPH
 * - Lignes de Produits / Services
 * 
 * Répartition primaire et secondaire (déversement en cascade) avec garantie absolue
 * d'absence de dérive d'arrondi (ajustement au centime près sur la quote-part prépondérante).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export type AnalyticalAxisType = 'COST_CENTER' | 'PROFIT_CENTER' | 'PROJECT_CHANTIER' | 'PRODUCT_LINE';

export interface AnalyticalCenter {
  id: string;
  code: string;
  nameFr: string;
  axisType: AnalyticalAxisType;
  isAuxiliary?: boolean; // Centre auxiliaire (ex: atelier d entretien, logistique interne)
}

export interface AllocationShare {
  centerCode: string;
  weight: DecimalValue | string; // Poids, pourcentage ou unité d'œuvre
}

export interface AllocationKey {
  keyId: string;
  keyNameFr: string;
  descriptionFr?: string;
  shares: AllocationShare[];
}

export interface AnalyticalEntry {
  entryId: string;
  pieceRef?: string;
  date: string; // YYYY-MM-DD
  accountRole: string;
  totalAmount: DecimalValue | string;
  directCenterCode?: string; // Affectation directe si connue
  allocationKeyId?: string; // Clé de répartition si indirect
}

export interface VentilatedShare {
  centerCode: string;
  allocatedAmount: string; // Montant ventilé au centime près
  percentageApplied: string;
}

export interface VentilatedEntryResult {
  entryId: string;
  totalAmount: string;
  allocations: VentilatedShare[];
}

export interface SecondaryReallocationRule {
  sourceCenterCode: string; // Centre auxiliaire cédant ses coûts
  targetShares: AllocationShare[]; // Centres récepteurs
}

export interface AnalyticalResultSummary {
  centers: Map<string, string>; // centerCode -> montant total net
  ventilatedEntriesCount: number;
  totalVentilatedAmount: string;
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class AnalyticalAxesEngine {
  /**
   * Ventile un montant selon une clé de répartition, sans perte de centime
   */
  public static allocateAmount(
    totalAmountInput: DecimalValue | string,
    shares: AllocationShare[]
  ): VentilatedShare[] {
    const totalAmount = EngineMath.from(totalAmountInput);
    if (shares.length === 0) {
      throw new Error('Impossible de ventiler : aucune quote-part fournie.');
    }

    // Calcul de la somme des poids
    let totalWeight = new EngineDecimal('0');
    for (const sh of shares) {
      totalWeight = totalWeight.plus(EngineMath.from(sh.weight));
    }

    if (totalWeight.isZero()) {
      throw new Error('La somme des poids de la clé de répartition est nulle.');
    }

    const results: VentilatedShare[] = [];
    let allocatedSum = new EngineDecimal('0');
    let maxShareIdx = 0;
    let maxWeight = new EngineDecimal('-1');

    for (let i = 0; i < shares.length; i++) {
      const w = EngineMath.from(shares[i].weight);
      if (w.greaterThan(maxWeight)) {
        maxWeight = w;
        maxShareIdx = i;
      }

      // Ratio = weight / totalWeight
      const ratio = EngineMath.divide(w, totalWeight, 'ERROR')!;
      // Montant = round(totalAmount * ratio, 2)
      const allocated = totalAmount.times(ratio).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      allocatedSum = allocatedSum.plus(allocated);

      results.push({
        centerCode: shares[i].centerCode,
        allocatedAmount: allocated.toFixed(2),
        percentageApplied: ratio.times(100).toFixed(4),
      });
    }

    // Ajustement de centime sur la plus grande part pour garantir que sum(allocated) === totalAmount
    const diff = totalAmount.minus(allocatedSum);
    if (!diff.isZero()) {
      const current = EngineMath.from(results[maxShareIdx].allocatedAmount);
      const adjusted = current.plus(diff);
      results[maxShareIdx].allocatedAmount = adjusted.toFixed(2);
    }

    return results;
  }

  /**
   * Ventile un lot d'écritures analytiques primaires
   */
  public static processPrimaryEntries(
    entries: AnalyticalEntry[],
    keysMap: Map<string, AllocationKey>,
    packVersion = 'DZ_MANAGEMENT_2026_V1'
  ): {
    ventilatedEntries: VentilatedEntryResult[];
    centerTotals: Map<string, string>;
    trace: RuleExecutionTrace;
  } {
    const startTime = Date.now();
    const ventilatedEntries: VentilatedEntryResult[] = [];
    const totalsByCenter = new Map<string, DecimalValue>();
    let grandTotal = new EngineDecimal('0');

    for (const entry of entries) {
      const amt = EngineMath.from(entry.totalAmount);
      grandTotal = grandTotal.plus(amt);

      let allocations: VentilatedShare[] = [];

      if (entry.directCenterCode) {
        // Affectation directe à 100%
        allocations = [
          {
            centerCode: entry.directCenterCode,
            allocatedAmount: amt.toFixed(2),
            percentageApplied: '100.0000',
          },
        ];
      } else if (entry.allocationKeyId && keysMap.has(entry.allocationKeyId)) {
        const key = keysMap.get(entry.allocationKeyId)!;
        allocations = AnalyticalAxesEngine.allocateAmount(amt, key.shares);
      } else {
        throw new Error(`Écriture ${entry.entryId} sans centre direct ni clé d allocation valide.`);
      }

      ventilatedEntries.push({
        entryId: entry.entryId,
        totalAmount: amt.toFixed(2),
        allocations,
      });

      for (const al of allocations) {
        const current = totalsByCenter.get(al.centerCode) ?? new EngineDecimal('0');
        totalsByCenter.set(al.centerCode, current.plus(EngineMath.from(al.allocatedAmount)));
      }
    }

    const finalTotals = new Map<string, string>();
    for (const [code, dec] of totalsByCenter.entries()) {
      finalTotals.set(code, dec.toFixed(2));
    }

    return {
      ventilatedEntries,
      centerTotals: finalTotals,
      trace: {
        ruleCode: 'ANALYTICAL_PRIMARY_VENTILATION',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          entriesCount: entries.length,
          grandTotal: grandTotal.toFixed(2),
        },
        parametersRead: {
          keysCount: keysMap.size,
        },
        legalRef: 'Normes de comptabilité de gestion SCF / Décret exécutif 09-110',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: 'COMPLIANT',
        humanReviewRequired: false,
      },
    };
  }

  /**
   * Déversement secondaire en cascade des centres auxiliaires vers les centres principaux
   */
  public static processSecondaryReallocations(
    primaryTotals: Map<string, string>,
    rules: SecondaryReallocationRule[]
  ): Map<string, string> {
    const finalTotals = new Map<string, DecimalValue>();
    for (const [code, val] of primaryTotals.entries()) {
      finalTotals.set(code, EngineMath.from(val));
    }

    for (const rule of rules) {
      const sourceAmount = finalTotals.get(rule.sourceCenterCode) ?? new EngineDecimal('0');
      if (sourceAmount.isZero()) continue;

      // Déduire le montant du centre source (vidage à zéro)
      finalTotals.set(rule.sourceCenterCode, new EngineDecimal('0'));

      // Ventiler vers les centres cibles
      const allocations = AnalyticalAxesEngine.allocateAmount(sourceAmount, rule.targetShares);
      for (const al of allocations) {
        const targetCurrent = finalTotals.get(al.centerCode) ?? new EngineDecimal('0');
        finalTotals.set(al.centerCode, targetCurrent.plus(EngineMath.from(al.allocatedAmount)));
      }
    }

    const result = new Map<string, string>();
    for (const [code, dec] of finalTotals.entries()) {
      result.set(code, dec.toFixed(2));
    }
    return result;
  }
}
