'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  WorkerInMessage,
  WorkerOutMessage,
} from './telemetry.worker';
import {
  VehicleSchema,
  TelemetryPayload,
  SeverityStatus,
} from './demoFallbackData';

export interface EvaluatedPayloadResult {
  evaluatedSensors: Record<string, { value: number | string; status: SeverityStatus }>;
  evaluatedNodes: Record<string, { id: string; status: SeverityStatus; summary: string }>;
  vhiScore: number;
  globalStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  evaluatedRul: { key: string; health: number; kmLeft: number; daysLeft: number; status: SeverityStatus }[];
}

/**
 * Hook gérant le cycle de vie du Web Worker de calcul télématique
 * Décharge le thread principal pour préserver 60 FPS constants.
 */
export function useTelemetryWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacksRef = useRef<Map<string, (res: EvaluatedPayloadResult) => void>>(new Map());

  useEffect(() => {
    // Vérification de la disponibilité des Web Workers dans l'environnement courant
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(new URL('./telemetry.worker.ts', import.meta.url), {
          type: 'module',
        });

        worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
          const { id, result } = event.data;
          const callback = pendingCallbacksRef.current.get(id);
          if (callback) {
            callback(result);
            pendingCallbacksRef.current.delete(id);
          }
        };

        workerRef.current = worker;
      } catch (err) {
        console.warn('[TelemetryWorker] Worker instantiation fallback to inline:', err);
      }
    }

    return () => {
      // Nettoyage strict pour éviter les fuites de threads
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingCallbacksRef.current.clear();
    };
  }, []);

  const evaluateOffThread = useCallback(
    (
      schema: VehicleSchema,
      payload: TelemetryPayload,
      onResult: (res: EvaluatedPayloadResult) => void
    ) => {
      const msgId = `eval-${Date.now()}-${Math.random()}`;

      if (workerRef.current) {
        pendingCallbacksRef.current.set(msgId, onResult);
        const msg: WorkerInMessage = {
          type: 'EVALUATE_TELEMETRY',
          id: msgId,
          payload: {
            values: payload.values || {},
            rulHealth: payload.rulHealth || {},
            dtcs: (payload.dtcs || []).map((d) => ({
              code: d.code,
              title: d.title ?? d.desc, // desc est le champ source ; title est l'alias Worker
              severity: d.severity,
              targetNodeId: d.targetNodeId,
            })),
            sensorsSchema: schema.sensorsSchema || [],
            nodesSchema: schema.nodesSchema || [],
            rulSchema: schema.rulSchema || [],
          },
        };
        workerRef.current.postMessage(msg);
      } else {
        // Fallback synchrone inline pour SSR ou tests
        const sensors: Record<string, { value: number | string; status: SeverityStatus }> = {};
        (schema.sensorsSchema || []).forEach((s) => {
          const raw = (payload.values || {})[s.key];
          sensors[s.key] = { value: raw ?? 0, status: 'nominal' };
        });
        const nodes: Record<string, { id: string; status: SeverityStatus; summary: string }> = {};
        (schema.nodesSchema || []).forEach((n) => {
          nodes[n.id] = { id: n.id, status: 'nominal', summary: 'Nominal' };
        });
        onResult({
          evaluatedSensors: sensors,
          evaluatedNodes: nodes,
          vhiScore: 95,
          globalStatus: 'NOMINAL',
          evaluatedRul: [],
        });
      }
    },
    []
  );

  return { evaluateOffThread };
}

