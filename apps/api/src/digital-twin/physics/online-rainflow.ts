/**
 * online-rainflow.ts — Algorithme Rainflow 4-Points Incrémental en Ligne (ASTM E1049-85)
 * Accumulation de Dommage de Fatigue par Loi de Palmgren-Miner & Basquin
 * Conçu pour flux de télémétrie haute fréquence avec pile légère (< 20 extrema)
 */

export interface RainflowCycle {
  range: number;        // Amplitude pic-à-vallée (Δa en m/s²)
  mean: number;         // Valeur moyenne du cycle
  isHalfCycle: boolean; // Demi-cycle ou cycle complet
  stressPa: number;     // Contrainte équivalente (Pa)
  damage: number;       // Dommage incrémental Palmgren-Miner
}

export interface RainflowConfig {
  suspensionStiffnessCoeff: number;
  fatigueEnduranceLimitPa: number;
  wohlerExponentB: number;
  n0EnduranceCycles: number;
  minRangeThresholdMs2?: number; // Seuil de filtrage du bruit capteur (ex: 0.15 m/s²)
}

export class OnlineRainflowCounter {
  private stack: number[] = [];
  private lastSlope: number = 0;
  private readonly minRangeThreshold: number;

  constructor(
    private readonly config: RainflowConfig,
    initialStack: number[] = [],
  ) {
    this.stack = [...initialStack];
    this.minRangeThreshold = config.minRangeThresholdMs2 ?? 0.15;
  }

  /**
   * Retourne l'état actuel de la pile d'extrema pour persistance
   */
  public getStack(): number[] {
    return [...this.stack];
  }

  /**
   * Injecte une nouvelle mesure d'accélération verticale centrée (a_z - g)
   * et retourne les cycles fermés découverts lors de cette étape
   */
  public processPoint(value: number, vehicleMassKg: number): RainflowCycle[] {
    const closedCycles: RainflowCycle[] = [];

    // Détection des extrema (changement de pente)
    if (this.stack.length < 2) {
      this.stack.push(value);
      return closedCycles;
    }

    const prev = this.stack[this.stack.length - 1];
    const prevPrev = this.stack[this.stack.length - 2];
    const currentSlope = Math.sign(value - prev);

    if (currentSlope === 0) {
      return closedCycles;
    }

    // Si on continue dans la même direction, on remplace le dernier point par le point plus extrême
    const prevSlope = Math.sign(prev - prevPrev);
    if (currentSlope === prevSlope) {
      this.stack[this.stack.length - 1] = value;
    } else {
      // Inversion de pente => un nouvel extremum est validé
      this.stack.push(value);
      this.lastSlope = currentSlope;
    }

    // Réduction par l'algorithme 4-points (ASTM E1049-85)
    // On analyse les 4 derniers points de la pile : [s1, s2, s3, s4] (s4 = sommet de pile)
    let reduced = true;
    while (reduced && this.stack.length >= 4) {
      reduced = false;
      const n = this.stack.length;
      const s1 = this.stack[n - 4];
      const s2 = this.stack[n - 3];
      const s3 = this.stack[n - 2];
      const s4 = this.stack[n - 1];

      const rangeY = Math.abs(s2 - s3);
      const rangeX = Math.abs(s3 - s4);
      const rangeZ = Math.abs(s1 - s2);

      // Critère 4-points : le cycle intérieur [s2, s3] est fermé si Y <= X et Y <= Z
      if (rangeY <= rangeX && rangeY <= rangeZ) {
        if (rangeY >= this.minRangeThreshold) {
          const mean = (s2 + s3) / 2.0;
          const cycle = this.computeCycleDamage(rangeY, mean, false, vehicleMassKg);
          closedCycles.push(cycle);
        }

        // On retire les points intermédiaires s2 et s3 (hystérésis fermée)
        this.stack.splice(n - 3, 2);
        reduced = true;
      }
    }

    // Protection anti-débordement de pile si vibrations asymétriques prolongées
    if (this.stack.length > 20) {
      // Évacuation de l'extremum le plus ancien comme demi-cycle pour borner la mémoire en O(1)
      const oldest1 = this.stack.shift()!;
      const oldest2 = this.stack[0];
      const halfRange = Math.abs(oldest1 - oldest2);
      if (halfRange >= this.minRangeThreshold) {
        const halfCycle = this.computeCycleDamage(halfRange, (oldest1 + oldest2) / 2, true, vehicleMassKg);
        closedCycles.push(halfCycle);
      }
    }

    return closedCycles;
  }

  /**
   * Vide la pile résiduelle en fin de trajet ou d'épisode pour compter les demi-cycles résiduels
   * Conforme à la norme ASTM E1049-85 Section 5.4.4
   */
  public flush(vehicleMassKg: number): RainflowCycle[] {
    const halfCycles: RainflowCycle[] = [];
    while (this.stack.length >= 2) {
      const p1 = this.stack.shift()!;
      const p2 = this.stack[0];
      const range = Math.abs(p1 - p2);
      if (range >= this.minRangeThreshold) {
        const cycle = this.computeCycleDamage(range, (p1 + p2) / 2.0, true, vehicleMassKg);
        halfCycles.push(cycle);
      }
    }
    this.stack = [];
    return halfCycles;
  }

  /**
   * Calcul du dommage élémentaire selon la loi de Basquin (Palmgren-Miner)
   * σ_i = c_susp * m * Δa
   * N_i = N0 * (σ_endurance / σ_i)^b
   * ΔD = (isHalfCycle ? 0.5 : 1.0) / N_i
   */
  private computeCycleDamage(
    rangeDeltaA: number,
    mean: number,
    isHalfCycle: boolean,
    vehicleMassKg: number,
  ): RainflowCycle {
    // Contrainte mécanique dynamique estimée en Pascals
    // σ_i = c_susp * (m / 4) * Δa (répartition 4 suspensions)
    const massPerWheel = Math.max(250, vehicleMassKg / 4.0);
    const dynamicForceN = massPerWheel * rangeDeltaA * this.config.suspensionStiffnessCoeff;
    // Section nominale équivalente d'acier/bras de suspension (~4.5 cm²)
    const equivalentAreaM2 = 0.00045;
    const stressPa = dynamicForceN / equivalentAreaM2;

    let damage = 0;
    if (stressPa > 0 && stressPa >= this.config.fatigueEnduranceLimitPa * 0.40) {
      // Loi de Basquin
      const stressRatio = stressPa / this.config.fatigueEnduranceLimitPa;
      const nCyclesToFailure = this.config.n0EnduranceCycles / Math.pow(stressRatio, this.config.wohlerExponentB);
      const safeNCycles = Math.max(100, nCyclesToFailure);
      const cycleWeight = isHalfCycle ? 0.5 : 1.0;
      damage = cycleWeight / safeNCycles;
    }

    return {
      range: Number(rangeDeltaA.toFixed(3)),
      mean: Number(mean.toFixed(3)),
      isHalfCycle,
      stressPa: Number(stressPa.toFixed(0)),
      damage: Math.min(0.01, damage), // Plafonnement physique de sécurité par cycle
    };
  }
}
