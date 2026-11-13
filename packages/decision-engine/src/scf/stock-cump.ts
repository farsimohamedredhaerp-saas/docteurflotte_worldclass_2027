/**
 * Moteur de Valorisation des Stocks CUMP (Coût Unitaire Moyen Pondéré)
 * 
 * RÈGLES FORMELLES SCF :
 * 1. Valorisation par la valeur :
 *    valeur_finale = valeur_initiale + entrées - sorties_au_cump.
 *    Élimination de toute dérive de centime lors des sorties ou du vidage complet.
 * 2. Frais d'approche tardifs (late landed costs) sur stock nul :
 *    Imputés directement en charges d'exploitation / résultat financier,
 *    la valeur du stock restant rigoureusement à 0.00 DA.
 * 3. Rejeu idempotent : détection des mouvements déjà appliqués.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal.js';

export type StockMovementType = 'ENTRY' | 'ISSUE' | 'LATE_LANDED_COST';

export interface StockMovement {
  id: string;
  date: string; // YYYY-MM-DD
  type: StockMovementType;
  quantity: string;  // Échelle NUMERIC(24,6)
  unitCost?: string; // Échelle NUMERIC(24,6)
  totalCost?: string; // Échelle NUMERIC(20,2)
  label: string;
}

export interface StockState {
  quantity: DecimalValue;
  totalValue: DecimalValue;
  cump: DecimalValue;
  appliedMovementIds: string[];
}

export interface StockMovementResult {
  nextState: StockState;
  movementApplied: boolean;
  issuedValue: DecimalValue;
  expenseValue: DecimalValue;
  unitCumpAtMovement: DecimalValue;
}

export class StockCumpEngine {
  /**
   * Crée un état de stock initialisé à zéro
   */
  public static createInitialState(): StockState {
    return {
      quantity: new EngineDecimal('0'),
      totalValue: new EngineDecimal('0'),
      cump: new EngineDecimal('0'),
      appliedMovementIds: [],
    };
  }

  /**
   * Applique un mouvement de stock de manière déterministe et idempotente
   */
  public static applyMovement(
    currentState: StockState,
    movement: StockMovement
  ): StockMovementResult {
    // 1. Idempotence : si le mouvement a déjà été appliqué, renvoyer l'état sans modification
    if (currentState.appliedMovementIds.includes(movement.id)) {
      return {
        nextState: currentState,
        movementApplied: false,
        issuedValue: new EngineDecimal('0'),
        expenseValue: new EngineDecimal('0'),
        unitCumpAtMovement: currentState.cump,
      };
    }

    const qty = new EngineDecimal(movement.quantity);
    let issuedValue = new EngineDecimal('0');
    let expenseValue = new EngineDecimal('0');

    let nextQty = currentState.quantity;
    let nextValue = currentState.totalValue;
    let nextCump = currentState.cump;

    switch (movement.type) {
      case 'ENTRY': {
        if (qty.isNegative() || qty.isZero()) {
          throw new Error(`Quantité d'entrée invalide : ${movement.quantity}`);
        }

        // Calcul du coût total d'entrée
        let entryCost: DecimalValue;
        if (movement.totalCost !== undefined) {
          entryCost = new EngineDecimal(movement.totalCost).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        } else if (movement.unitCost !== undefined) {
          entryCost = qty.times(new EngineDecimal(movement.unitCost)).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        } else {
          throw new Error(`Coût total ou unitaire requis pour une entrée de stock.`);
        }

        nextQty = currentState.quantity.plus(qty);
        nextValue = currentState.totalValue.plus(entryCost).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

        // Recalcul du CUMP = Valeur totale / Quantité totale
        nextCump = EngineMath.divide(nextValue, nextQty, 'ERROR')!.toDecimalPlaces(6, EngineDecimal.ROUND_HALF_UP);
        break;
      }

      case 'ISSUE': {
        if (qty.isNegative() || qty.isZero()) {
          throw new Error(`Quantité de sortie invalide : ${movement.quantity}`);
        }
        if (qty.greaterThan(currentState.quantity)) {
          throw new Error(
            `Rupture de stock : tentative de sortie de ${qty.toFixed(2)} unités sur un stock disponible de ${currentState.quantity.toFixed(2)}.`
          );
        }

        // Sortie totale : vidage exact du stock (élimination totale de dérive d'arrondi)
        if (qty.equals(currentState.quantity)) {
          issuedValue = currentState.totalValue;
          nextQty = new EngineDecimal('0');
          nextValue = new EngineDecimal('0');
          // Le CUMP unitaire reste le dernier connu pour mémoire
        } else {
          // Sortie partielle au CUMP
          // Valorisation par la valeur : Sortie = Qs * CUMP arrondi au centime
          issuedValue = qty.times(currentState.cump).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
          nextQty = currentState.quantity.minus(qty);
          // La valeur résiduelle est obtenue par soustraction directe (garantit aucune dérive)
          nextValue = currentState.totalValue.minus(issuedValue).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        }
        break;
      }

      case 'LATE_LANDED_COST': {
        // Frais d'approche tardifs (ex: facture transporteur ou douane reçue avec retard)
        const cost = movement.totalCost
          ? new EngineDecimal(movement.totalCost)
          : qty.times(new EngineDecimal(movement.unitCost || '0'));
        const roundedCost = cost.toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

        if (currentState.quantity.isZero()) {
          // RÈGLE SCF : Si le stock physique est nul, les frais d'approche tardifs ne peuvent
          // pas s'incorporer au stock. Ils sont directement imputés en charges d'exploitation.
          expenseValue = roundedCost;
          // Le stock reste à 0 DA et 0 unité
          nextQty = new EngineDecimal('0');
          nextValue = new EngineDecimal('0');
        } else {
          // Si du stock physique subsiste, les frais s'incorporent à la valeur restante
          nextValue = currentState.totalValue.plus(roundedCost).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
          nextCump = EngineMath.divide(nextValue, nextQty, 'ERROR')!.toDecimalPlaces(6, EngineDecimal.ROUND_HALF_UP);
        }
        break;
      }
    }

    const nextState: StockState = {
      quantity: nextQty,
      totalValue: nextValue,
      cump: nextCump,
      appliedMovementIds: [...currentState.appliedMovementIds, movement.id],
    };

    return {
      nextState,
      movementApplied: true,
      issuedValue,
      expenseValue,
      unitCumpAtMovement: currentState.cump,
    };
  }
}
