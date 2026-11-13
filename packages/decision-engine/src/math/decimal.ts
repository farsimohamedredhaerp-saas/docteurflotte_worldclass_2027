/**
 * Primitives Mathématiques Exactes & Isolation Decimal
 * 
 * RÈGLE FONDAMENTALE : Calcul exact via Decimal.clone() isolé.
 * Interdit : number pour montants, quantités, taux et coûts.
 * Base : NUMERIC(20,2) montants, NUMERIC(24,6) coûts/quantités, NUMERIC(12,8) taux.
 * DIV exige une politique onZero explicite.
 */

import Decimal from 'decimal.js';

// Clone isolé avec précision de calcul à 28 chiffres significatifs
export const EngineDecimal = Decimal.clone({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -20,
  toExpPos: 40,
});

export type DecimalValue = InstanceType<typeof EngineDecimal>;

export type DivisionOnZeroPolicy = 'ERROR' | 'ZERO' | 'NULL';

export enum DecimalScale {
  AMOUNT = 2,
  COST_OR_QUANTITY = 6,
  RATE = 8,
}

export class EngineMath {
  /**
   * Instancie un Decimal depuis une chaîne ou un Decimal existant.
   * Échoue rigoureusement si la valeur est indéfinie, invalide ou non finie.
   */
  static from(val: string | DecimalValue): DecimalValue {
    if (val === undefined || val === null || val === '') {
      throw new Error('Valeur numérique nulle ou non définie transmise au moteur arithmétique.');
    }
    try {
      const dec = new EngineDecimal(val instanceof EngineDecimal ? val : String(val).trim());
      if (!dec.isFinite()) {
        throw new Error(`Valeur numérique non finie : "${val}".`);
      }
      return dec;
    } catch (e: any) {
      throw new Error(`Erreur d'instanciation décimale pour "${val}": ${e.message}`);
    }
  }

  /**
   * Montant monétaire strict (2 décimales, ex: Dinars Algériens DZD).
   */
  static asAmount(val: string | DecimalValue): DecimalValue {
    const d = this.from(val);
    return d.toDecimalPlaces(DecimalScale.AMOUNT, EngineDecimal.ROUND_HALF_UP);
  }

  /**
   * Coût unitaire ou quantité physique (6 décimales pour valorisation fine).
   */
  static asCostOrQuantity(val: string | DecimalValue): DecimalValue {
    const d = this.from(val);
    return d.toDecimalPlaces(DecimalScale.COST_OR_QUANTITY, EngineDecimal.ROUND_HALF_UP);
  }

  /**
   * Taux, coefficient ou prorata (8 décimales).
   */
  static asRate(val: string | DecimalValue): DecimalValue {
    const d = this.from(val);
    return d.toDecimalPlaces(DecimalScale.RATE, EngineDecimal.ROUND_HALF_UP);
  }

  /**
   * Division pure et sécurisée avec clause obligatoire onZero.
   */
  static divide(
    numerator: DecimalValue,
    denominator: DecimalValue,
    onZero: DivisionOnZeroPolicy
  ): DecimalValue | null {
    if (denominator.isZero()) {
      if (onZero === 'ERROR') {
        throw new Error('Division par zéro interdite par la règle de calcul.');
      }
      if (onZero === 'ZERO') {
        return new EngineDecimal(0);
      }
      return null;
    }
    return numerator.div(denominator);
  }

  /**
   * Arrondi configurable.
   */
  static round(
    val: DecimalValue,
    scale: number,
    mode: 'HALF_UP' | 'HALF_DOWN' | 'HALF_EVEN' | 'FLOOR' | 'CEIL' = 'HALF_UP'
  ): DecimalValue {
    const roundModes = {
      HALF_UP: EngineDecimal.ROUND_HALF_UP,
      HALF_DOWN: EngineDecimal.ROUND_HALF_DOWN,
      HALF_EVEN: EngineDecimal.ROUND_HALF_EVEN,
      FLOOR: EngineDecimal.ROUND_FLOOR,
      CEIL: EngineDecimal.ROUND_CEIL,
    };
    return val.toDecimalPlaces(scale, roundModes[mode]);
  }
}

