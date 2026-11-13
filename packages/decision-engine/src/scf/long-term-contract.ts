/**
 * Moteur des Contrats à Long Terme (BTPH) & Pertes à Terminaison
 * 
 * RÈGLES FORMELLES SCF (art. 138-1 / IAS 11) :
 * 1. Méthode à l'avancement :
 *    - Avancement au coût réel / CTET (coût à coût) : alpha = Creel / CTET.
 *    - Option avancement technique : alpha_tech certifié par ingénieur.
 *    - Chiffre d'affaires à l'avancement = Marché * alpha.
 * 2. Perte à terminaison (Correction impérative du CDC) :
 *    - Perte globale prévisible : L = max(0, CTET - Marché).
 *    - Provision pour perte à terminaison = max(0, L - perte déjà constatée dans le résultat).
 *    - En méthode coût à coût, cela équivaut rigoureusement à : Provision = L * (1 - alpha).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal.js';

export type ProgressMethod = 'COST_TO_COST' | 'TECHNICAL_PROGRESS';

export interface LongTermContractInput {
  contractId: string;
  label: string;
  marketPrice: string;              // Montant total du marché convenu HT
  initialEstimatedCost: string;     // CTET initial
  revisedEstimatedCost: string;     // CTET révisé à date
  incurredCost: string;             // Coûts réels engagés à date
  progressMethod?: ProgressMethod;
  technicalProgressRate?: string;   // Alpha technique si méthode TECHNICAL_PROGRESS
  invoicedToDate?: string;          // Montant déjà facturé au client
}

export interface LongTermContractEvaluation {
  contractId: string;
  marketPrice: string;
  revisedEstimatedCost: string;
  incurredCost: string;
  progressRate: string;             // Alpha
  recognizedRevenue: string;        // CA à l'avancement
  operatingMargin: string;          // CA à l'avancement - Coûts réels
  lossAtCompletionTotal: string;    // L = max(0, CTET - Marché)
  lossAlreadyRecognized: string;    // max(0, -marge d'exploitation)
  lossProvisionRequired: string;    // Provision à constater au bilan (compte 151)
  unbilledReceivable: string;       // CA à l'avancement - Facturé (Factures à établir si > 0)
  deferredRevenue: string;          // Facturé - CA à l'avancement (Produits constatés d'avance si > 0)
}

export class LongTermContractEngine {
  /**
   * Évalue la situation de clôture d'un contrat à long terme BTPH
   */
  public static evaluate(input: LongTermContractInput): LongTermContractEvaluation {
    const market = new EngineDecimal(input.marketPrice);
    const ctet = new EngineDecimal(input.revisedEstimatedCost);
    const cReel = new EngineDecimal(input.incurredCost);

    if (ctet.lessThanOrEqualTo(0)) {
      throw new Error(`CTET invalide : ${input.revisedEstimatedCost}`);
    }

    // 1. Taux d'avancement (Alpha)
    let alpha: DecimalValue;
    const method = input.progressMethod || 'COST_TO_COST';

    if (method === 'TECHNICAL_PROGRESS' && input.technicalProgressRate !== undefined) {
      alpha = new EngineDecimal(input.technicalProgressRate);
    } else {
      // Coût à coût : Creel / CTET
      alpha = EngineMath.divide(cReel, ctet, 'ERROR')!;
    }

    // Plafonner alpha à 1.0 (100%)
    if (alpha.greaterThan(1)) {
      alpha = new EngineDecimal('1');
    }

    // 2. Chiffre d'affaires à l'avancement = Marché * Alpha
    const recognizedRevenue = market.times(alpha).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // 3. Marge d'exploitation constatée = CA à l'avancement - Coûts engagés
    const operatingMargin = recognizedRevenue.minus(cReel).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // 4. Perte globale à terminaison : L = max(0, CTET - Marché)
    let lossAtCompletionTotal = new EngineDecimal('0');
    if (ctet.greaterThan(market)) {
      lossAtCompletionTotal = ctet.minus(market).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    }

    // 5. Perte déjà constatée dans le résultat d'exploitation
    let lossAlreadyRecognized = new EngineDecimal('0');
    if (operatingMargin.isNegative()) {
      lossAlreadyRecognized = operatingMargin.abs();
    }

    // 6. Provision pour perte à terminaison
    // Formule canonique : max(0, L - perte déjà constatée)
    // En coût à coût : L * (1 - alpha)
    let lossProvisionRequired = new EngineDecimal('0');
    if (lossAtCompletionTotal.greaterThan(0)) {
      if (method === 'COST_TO_COST') {
        const oneMinusAlpha = new EngineDecimal('1').minus(alpha);
        lossProvisionRequired = lossAtCompletionTotal.times(oneMinusAlpha).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      } else {
        const diff = lossAtCompletionTotal.minus(lossAlreadyRecognized);
        if (diff.greaterThan(0)) {
          lossProvisionRequired = diff.toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        }
      }
    }

    // 7. Écart de facturation (Factures à établir ou Produits constatés d'avance)
    const invoiced = new EngineDecimal(input.invoicedToDate || '0');
    let unbilledReceivable = new EngineDecimal('0');
    let deferredRevenue = new EngineDecimal('0');

    if (recognizedRevenue.greaterThan(invoiced)) {
      unbilledReceivable = recognizedRevenue.minus(invoiced).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    } else if (invoiced.greaterThan(recognizedRevenue)) {
      deferredRevenue = invoiced.minus(recognizedRevenue).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    }

    return {
      contractId: input.contractId,
      marketPrice: market.toFixed(2),
      revisedEstimatedCost: ctet.toFixed(2),
      incurredCost: cReel.toFixed(2),
      progressRate: alpha.toFixed(6),
      recognizedRevenue: recognizedRevenue.toFixed(2),
      operatingMargin: operatingMargin.toFixed(2),
      lossAtCompletionTotal: lossAtCompletionTotal.toFixed(2),
      lossAlreadyRecognized: lossAlreadyRecognized.toFixed(2),
      lossProvisionRequired: lossProvisionRequired.toFixed(2),
      unbilledReceivable: unbilledReceivable.toFixed(2),
      deferredRevenue: deferredRevenue.toFixed(2),
    };
  }
}
