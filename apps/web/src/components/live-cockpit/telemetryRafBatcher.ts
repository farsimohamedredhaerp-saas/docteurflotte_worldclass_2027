'use client';

import { AtomicTelemetryStore, defaultTelemetryStore } from './telemetryStore';
import { SeverityStatus, SensorThresholds } from './demoFallbackData';

// C4 — tenantId OBLIGATOIRE pour isoler les paquets inter-tenant
export interface RawTelemetryPacket {
  tenantId: string;               // Identifiant du tenant — filtre de sécurité primaire
  vehicleId: string;
  timestamp: number;              // device_timestamp (Store-and-Forward — tri par origine)
  serverTimestamp?: number;       // Timestamp serveur (secondaire — ne pas utiliser pour l'ordre)
  values: Record<string, number | string>;
  rulHealth?: Record<string, number>;
  dtcs?: { code: string; title: string; severity: SeverityStatus }[];
}

export interface RafBatcherConfig {
  uiRefreshIntervalMs: number; // Cadence pour les jauges & textes (ex: 250ms - 500ms)
  enableRaf: boolean;
  store: AtomicTelemetryStore;
}

/**
 * DOCTEURFLOTTE — Telemetry Ring Buffer / RAF Batcher (Backpressure UI)
 * 
 * Régule le débit d'ingestion WebSocket client (1Hz à 20Hz) :
 * 1. Accumule les données dans une Map mutable hors cycle de rendu React.
 * 2. Déclenche la synchronisation via requestAnimationFrame / throttle périodique.
 * 3. Coupe automatiquement les cycles de rendu quand l'onglet est masqué (Page Visibility API).
 */
export class TelemetryRafBatcher {
  private config: RafBatcherConfig;
  private pendingValues: Map<string, number | string> = new Map();
  private pendingRul: Map<string, number> = new Map();
  private pendingDtcs: { code: string; title: string; severity: SeverityStatus }[] = [];
  
  private lastFlushTime: number = 0;
  private rafId: number | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isTabHidden: boolean = false;
  private isRunning: boolean = false;

  // I5 — nodeDefinitions supprimé : était importé mais jamais utilisé (code mort)
  private sensorThresholds: Map<string, SensorThresholds> = new Map();

  constructor(config: Partial<RafBatcherConfig> = {}) {
    this.config = {
      uiRefreshIntervalMs: config.uiRefreshIntervalMs ?? 300,
      enableRaf: config.enableRaf ?? true,
      store: config.store ?? defaultTelemetryStore,
    };

    if (typeof document !== 'undefined') {
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.isTabHidden = document.visibilityState === 'hidden';
    }
  }

  public setSensorMetadata(thresholds: Record<string, SensorThresholds>): void {
    this.sensorThresholds.clear();
    Object.entries(thresholds).forEach(([k, v]) => {
      this.sensorThresholds.set(k, v);
    });
  }

  /**
   * Ingestion rapide d'une trame WebSocket entrante en mémoire vive (O(1)).
   * ZÉRO setState déclenché ici : absorption complète de la rafale sans freeze d'écran.
   *
   * C5 — Double filtre tenant + vehicle : garantit qu'aucune trame inter-tenant
   * ne pollue le store du cockpit actuellement affiché.
   */
  public enqueuePacket(packet: RawTelemetryPacket): void {
    if (
      packet.tenantId !== this.config.store.getTenantId() ||
      packet.vehicleId !== this.config.store.getVehicleId()
    ) {
      return; // Rejet silencieux : trame hors-tenant ou hors-véhicule
    }

    // Accumulation mutable
    Object.entries(packet.values).forEach(([k, v]) => {
      this.pendingValues.set(k, v);
    });

    if (packet.rulHealth) {
      Object.entries(packet.rulHealth).forEach(([k, v]) => {
        this.pendingRul.set(k, v);
      });
    }

    if (packet.dtcs && packet.dtcs.length > 0) {
      this.pendingDtcs.push(...packet.dtcs);
    }
  }

  /**
   * Démarre la boucle de synchronisation contrôlée
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextTick();
  }

  /**
   * Arrêt propre pour prévenir les fuites mémoire
   */
  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public destroy(): void {
    this.stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.pendingValues.clear();
    this.pendingRul.clear();
    this.pendingDtcs = [];
  }

  private handleVisibilityChange(): void {
    if (typeof document === 'undefined') return;
    this.isTabHidden = document.visibilityState === 'hidden';

    // RÈGLE D'OR 3 : Si l'onglet passe en arrière-plan, suspendre la boucle RAF
    if (this.isTabHidden) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    } else {
      // Retour au premier plan : reprise immédiate du rendu
      if (this.isRunning && this.rafId === null) {
        this.scheduleNextTick();
      }
    }
  }

  private scheduleNextTick(): void {
    if (!this.isRunning) return;

    if (this.isTabHidden) {
      // Cadence très lente en arrière-plan (5s) pour économie CPU totale
      this.intervalId = setTimeout(() => {
        this.flushPendingData();
        this.scheduleNextTick();
      }, 5000);
      return;
    }

    if (this.config.enableRaf && typeof window !== 'undefined' && window.requestAnimationFrame) {
      this.rafId = window.requestAnimationFrame((now) => {
        if (now - this.lastFlushTime >= this.config.uiRefreshIntervalMs) {
          this.flushPendingData();
          this.lastFlushTime = now;
        }
        this.scheduleNextTick();
      });
    } else {
      this.intervalId = setTimeout(() => {
        this.flushPendingData();
        this.scheduleNextTick();
      }, this.config.uiRefreshIntervalMs);
    }
  }

  /**
   * Transfère les données accumulées dans l'Atomic Store en un seul micro-batch
   */
  public flushPendingData(): void {
    if (this.pendingValues.size === 0 && this.pendingDtcs.length === 0 && this.pendingRul.size === 0) {
      return;
    }

    const store = this.config.store;
    store.beginBatch();

    // 1. Mise à jour atomique des capteurs
    this.pendingValues.forEach((val, key) => {
      const thresholds = this.sensorThresholds.get(key);
      const status = this.evaluateThreshold(val, thresholds);
      store.updateSensor(key, val, status);
    });

    // I4 — splice(0) au lieu de shift() dans la boucle : O(n) → O(1) par itération
    const dtcsToProcess = this.pendingDtcs.splice(0);
    for (const dtc of dtcsToProcess) {
      store.addDtcLog(dtc.code, dtc.title, dtc.severity);
    }

    // 3. Évaluation globale de santé (VHI Score)
    let penalty = 0;
    this.pendingValues.forEach((val, key) => {
      const thresholds = this.sensorThresholds.get(key);
      const status = this.evaluateThreshold(val, thresholds);
      if (status === 'critical') penalty += 14;
      else if (status === 'warning') penalty += 5;
    });

    const vhi = Math.max(5, Math.min(100, Math.round(100 - penalty)));
    const globalStatus = penalty >= 14 ? 'CRITICAL' : penalty > 0 ? 'WARNING' : 'NOMINAL';
    store.updateHealth(vhi, globalStatus, store.getDtcLogs().length);

    this.pendingValues.clear();
    this.pendingRul.clear();

    store.endBatch();
  }

  private evaluateThreshold(
    val: number | string,
    thresholds?: SensorThresholds
  ): SeverityStatus {
    if (!thresholds) return 'nominal';
    const num = Number(val);
    if (Number.isNaN(num)) return 'warning';

    const { critLow, warnLow, warnHigh, critHigh } = thresholds;
    if (critLow !== undefined && num <= critLow) return 'critical';
    if (critHigh !== undefined && num >= critHigh) return 'critical';
    if (warnLow !== undefined && num <= warnLow) return 'warning';
    if (warnHigh !== undefined && num >= warnHigh) return 'warning';
    return 'nominal';
  }
}

