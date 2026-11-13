/**
 * Représentation Monétaire Dinars Algériens (DZD) & Formatage Comptable
 */

import { DecimalValue, EngineDecimal, EngineMath } from './decimal';

export class DinarsAmount {
  private readonly value: DecimalValue;

  constructor(val: string | DecimalValue) {
    this.value = EngineMath.asAmount(val);
  }

  get raw(): DecimalValue {
    return this.value;
  }

  toString(): string {
    return this.value.toFixed(2);
  }

  formatFr(): string {
    const parts = this.value.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${integerPart},${parts[1]} DZD`;
  }

  add(other: DinarsAmount): DinarsAmount {
    return new DinarsAmount(this.value.plus(other.raw));
  }

  subtract(other: DinarsAmount): DinarsAmount {
    return new DinarsAmount(this.value.minus(other.raw));
  }

  multiply(rate: DecimalValue): DinarsAmount {
    return new DinarsAmount(this.value.times(rate));
  }

  equals(other: DinarsAmount): boolean {
    return this.value.equals(other.raw);
  }

  isPositive(): boolean {
    return this.value.isPositive() && !this.value.isZero();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  isZero(): boolean {
    return this.value.isZero();
  }
}

