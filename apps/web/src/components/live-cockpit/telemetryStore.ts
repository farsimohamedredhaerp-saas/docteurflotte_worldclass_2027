'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { SeverityStatus } from './demoFallbackData';
import { RingBuffer } from './ringBuffer';

export interface EvaluatedSensorState {
  key: string;
  value: number | string;
  status: SeverityStatus;
  unit?: string;
  timestamp: number;
}

export interface EvaluatedNodeState {
  id: string;
  status: SeverityStatus;
  summary: string;
}

export interface EvaluatedHealthState {
  vhiScore: number;
  globalStatus: 'CRITICAL' | 'WARNING' | 'NOMINAL';
  activeDtcsCount: number;
}

export interface TelemetryStoreState {
  vehicleId: string;
  sensors: Map<string, EvaluatedSensorState>;
  nodes: Map<string, EvaluatedNodeState>;
  health: EvaluatedHealthState;
  sensorHistory: Map<string, RingBuffer<number>>;
  dtcLogs: RingBuffer<{ code: string; title: string; severity: SeverityStatus; timestamp: string }>;
  lastUpdateTimestamp: number;
}

type Listener = () => void;

/**
 * DOCTEURFLOTTE — Store Télématique Atomique Haut Débit
 * 
 * Isole les flux de capteurs pour garantir ZÉRO re-rendu global de l'arbre React.
 * Utilise des listeners par clé (sensorKey, nodeId, health) et s'intègre nativement
 * avec useSyncExternalStore de React 18 / React 19.
 */
export class AtomicTelemetryStore {
  private state: TelemetryStoreState;
  private keyListeners: Map<string, Set<Listener>> = new Map();
  private globalListeners: Set<Listener> = new Set();
  private batchDepth: number = 0;
  private dirtyKeys: Set<string> = new Set();
  private tenantId: string = '';

  constructor(initialVehicleId: string = '', initialTenantId: string = '') {
    this.tenantId = initialTenantId;
    this.state = {
      vehicleId: initialVehicleId,
      sensors: new Map(),
      nodes: new Map(),
      health: { vhiScore: 100, globalStatus: 'NOMINAL', activeDtcsCount: 0 },
      sensorHistory: new Map(),
      dtcLogs: new RingBuffer(50),
      lastUpdateTimestamp: Date.now(),
    };
  }

  /**
   * Change le véhicule actif et réinitialise les compteurs de session.
   * Un tenantId doit être défini avant d'appeler cette méthode.
   */
  public setVehicleId(vehicleId: string): void {
    if (!this.tenantId) {
      console.warn('[TelemetryStore] setVehicleId appelé sans tenantId — opération ignorée.');
      return;
    }
    if (this.state.vehicleId === vehicleId) return;
    this.state.vehicleId = vehicleId;
    this.state.sensors.clear();
    this.state.nodes.clear();
    this.state.sensorHistory.clear();
    this.state.dtcLogs.clear();
    this.state.health = { vhiScore: 100, globalStatus: 'NOMINAL', activeDtcsCount: 0 };
    this.notifyAll();
  }

  /**
   * Change le tenant actif — vide intégralement l'état pour éviter toute fuite inter-tenant.
   */
  public setTenantId(tenantId: string): void {
    if (this.tenantId === tenantId) return;
    this.tenantId = tenantId;
    // Reset store state for new tenant
    this.state.vehicleId = '';
    this.state.sensors.clear();
    this.state.nodes.clear();
    this.state.sensorHistory.clear();
    this.state.dtcLogs.clear();
    this.state.health = { vhiScore: 100, globalStatus: 'NOMINAL', activeDtcsCount: 0 };
    this.notifyAll();
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getVehicleId(): string {
    return this.state.vehicleId;
  }

  // --- Abonnements par clé granulaire ---

  public subscribeKey(key: string, listener: Listener): () => void {
    if (!this.keyListeners.has(key)) {
      this.keyListeners.set(key, new Set());
    }
    const set = this.keyListeners.get(key)!;
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.keyListeners.delete(key);
      }
    };
  }

  public subscribeGlobal(listener: Listener): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  // --- Getters immutables pour useSyncExternalStore ---

  public getSensorSnapshot(key: string): EvaluatedSensorState | undefined {
    return this.state.sensors.get(key);
  }

  public getNodeSnapshot(id: string): EvaluatedNodeState | undefined {
    return this.state.nodes.get(id);
  }

  public getHealthSnapshot(): EvaluatedHealthState {
    return this.state.health;
  }

  public getSensorHistory(key: string): number[] {
    const ring = this.state.sensorHistory.get(key);
    return ring ? ring.toArray() : [];
  }

  public getDtcLogs(): { code: string; title: string; severity: SeverityStatus; timestamp: string }[] {
    return this.state.dtcLogs.toArray();
  }

  // --- Mises à jour granulaires et micro-batching ---

  public beginBatch(): void {
    this.batchDepth++;
  }

  public endBatch(): void {
    this.batchDepth--;
    if (this.batchDepth <= 0) {
      this.batchDepth = 0;
      this.flushDirtyKeys();
    }
  }

  public updateSensor(
    key: string,
    value: number | string,
    status: SeverityStatus,
    unit?: string
  ): void {
    const prev = this.state.sensors.get(key);
    if (prev && prev.value === value && prev.status === status) {
      return; // Pas de changement, pas de re-render
    }

    const nextState: EvaluatedSensorState = {
      key,
      value,
      status,
      unit,
      timestamp: Date.now(),
    };
    this.state.sensors.set(key, nextState);

    // Maintien de l'historique dans la file circulaire
    if (typeof value === 'number') {
      let ring = this.state.sensorHistory.get(key);
      if (!ring) {
        ring = new RingBuffer<number>(30); // 30 points pour les sparklines
        this.state.sensorHistory.set(key, ring);
      }
      ring.push(value);
    }

    this.markDirty(`sensor:${key}`);
  }

  public updateNode(id: string, status: SeverityStatus, summary: string = ''): void {
    const prev = this.state.nodes.get(id);
    if (prev && prev.status === status && prev.summary === summary) {
      return;
    }
    this.state.nodes.set(id, { id, status, summary });
    this.markDirty(`node:${id}`);
  }

  public updateHealth(vhiScore: number, globalStatus: 'CRITICAL' | 'WARNING' | 'NOMINAL', activeDtcsCount: number): void {
    const prev = this.state.health;
    if (
      prev.vhiScore === vhiScore &&
      prev.globalStatus === globalStatus &&
      prev.activeDtcsCount === activeDtcsCount
    ) {
      return;
    }
    this.state.health = { vhiScore, globalStatus, activeDtcsCount };
    this.markDirty('health');
  }

  public addDtcLog(code: string, title: string, severity: SeverityStatus): void {
    this.state.dtcLogs.push({
      code,
      title,
      severity,
      // I3 — Timestamp ISO complet (date + heure) pour tri et traçabilité correcte
      timestamp: new Date().toISOString(),
    });
    this.markDirty('dtcs');
  }

  private markDirty(key: string): void {
    if (this.batchDepth > 0) {
      this.dirtyKeys.add(key);
    } else {
      this.notifyKey(key);
    }
  }

  private flushDirtyKeys(): void {
    if (this.dirtyKeys.size === 0) return;
    const keys = Array.from(this.dirtyKeys);
    this.dirtyKeys.clear();
    for (const k of keys) {
      this.notifyKey(k);
    }
    // I2 — globalListeners appelés UNE SEULE FOIS après le flush complet du batch
    this.globalListeners.forEach((fn) => fn());
    this.state.lastUpdateTimestamp = Date.now();
  }

  // I2 — notifyKey ne déclenche PAS globalListeners (évite N appels pour N capteurs en batch)
  private notifyKey(key: string): void {
    const listeners = this.keyListeners.get(key);
    if (listeners) {
      listeners.forEach((fn) => fn());
    }
  }

  private notifyAll(): void {
    this.keyListeners.forEach((listeners) => {
      listeners.forEach((fn) => fn());
    });
    this.globalListeners.forEach((fn) => fn());
  }

  /**
   * I1 — Libère tous les listeners pour prévenir les fuites mémoire lors du démontage.
   * À appeler dans le useEffect cleanup ou lors de la déconnexion de l'utilisateur.
   */
  public destroy(): void {
    this.keyListeners.clear();
    this.globalListeners.clear();
  }
}

// C6 — Singleton initialisé SANS valeur en dur ('truck' supprimé — violation AGENTS.md).
// Le tenantId et vehicleId réels sont injectés via setTenantId/setVehicleId depuis le contexte d'auth.
export const defaultTelemetryStore = new AtomicTelemetryStore();

// --- React Custom Hooks Atomiques (Zéro Re-render Global) ---

/**
 * Hook s'abonnant UNIQUEMENT à une métrique de capteur spécifique.
 * Si le RPM change, seul le composant appelant useSensorAtomicState('engineRpm') est recalculé.
 */
export function useSensorAtomicState(
  sensorKey: string,
  store: AtomicTelemetryStore = defaultTelemetryStore
): EvaluatedSensorState | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeKey(`sensor:${sensorKey}`, onStoreChange),
    [store, sensorKey]
  );
  const getSnapshot = useCallback(
    () => store.getSensorSnapshot(sensorKey),
    [store, sensorKey]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook s'abonnant UNIQUEMENT au statut d'un noeud du châssis.
 */
export function useNodeAtomicState(
  nodeId: string,
  store: AtomicTelemetryStore = defaultTelemetryStore
): EvaluatedNodeState | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeKey(`node:${nodeId}`, onStoreChange),
    [store, nodeId]
  );
  const getSnapshot = useCallback(
    () => store.getNodeSnapshot(nodeId),
    [store, nodeId]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook s'abonnant UNIQUEMENT au score de santé VHI global.
 */
export function useHealthAtomicState(
  store: AtomicTelemetryStore = defaultTelemetryStore
): EvaluatedHealthState {
  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeKey('health', onStoreChange),
    [store]
  );
  const getSnapshot = useCallback(() => store.getHealthSnapshot(), [store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

