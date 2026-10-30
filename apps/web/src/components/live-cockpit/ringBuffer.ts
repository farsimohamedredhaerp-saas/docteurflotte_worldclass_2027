/**
 * DOCTEURFLOTTE — Telemetry Ring Buffer (File Circulaire à Capacité Fixe)
 * 
 * Conçu pour prévenir les fuites mémoire (Heap RAM runaway) sur des sessions de 12+ heures.
 * Évite les allocations dynamiques continues et garantit un temps d'insertion O(1).
 * Utilisé pour : historique des jauges, sparklines, journaux DTC et trace GPS.
 */
export class RingBuffer<T> {
  private readonly capacity: number;
  private readonly buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;

  constructor(capacity: number = 100) {
    if (capacity <= 0) {
      throw new Error('RingBuffer capacity must be greater than 0');
    }
    this.capacity = capacity;
    this.buffer = new Array<T | undefined>(capacity);
  }

  /**
   * Ajoute un élément en O(1). Si la capacité est atteinte,
   * l'élément le plus ancien est écrasé sans réallocation mémoire.
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.size < this.capacity) {
      this.size++;
    } else {
      // Le buffer est plein : on avance la tête pour écraser l'élément le plus ancien
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Retourne le nombre d'éléments actuellement stockés.
   */
  get length(): number {
    return this.size;
  }

  /**
   * Capacité maximale allouée.
   */
  get maxCapacity(): number {
    return this.capacity;
  }

  /**
   * Indique si la file est vide.
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Vide le buffer en réinitialisant les pointeurs (zéro réallocation).
   */
  clear(): void {
    this.buffer.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Récupère le dernier élément inséré en O(1).
   */
  last(): T | undefined {
    if (this.size === 0) return undefined;
    const lastIdx = (this.tail - 1 + this.capacity) % this.capacity;
    return this.buffer[lastIdx];
  }

  /**
   * Récupère le plus ancien élément encore présent en O(1).
   */
  first(): T | undefined {
    if (this.size === 0) return undefined;
    return this.buffer[this.head];
  }

  /**
   * Exporte les éléments sous forme de tableau ordonné du plus ancien au plus récent.
   * À utiliser uniquement lors des rafraîchissements périodiques UI (ex: toutes les 500ms).
   */
  toArray(): T[] {
    const result: T[] = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head + i) % this.capacity;
      result[i] = this.buffer[idx] as T;
    }
    return result;
  }
}

