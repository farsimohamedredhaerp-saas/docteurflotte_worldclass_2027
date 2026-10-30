/**
 * DOCTEURFLOTTE — Telemetry Web Worker (Calculs Mathématiques Déportés)
 * 
 * Exécute hors du thread principal (UI Main Thread) :
 * 1. Le parsing JSON des trames brutes
 * 2. L'évaluation matricielle des seuils capteurs (evaluateSensorStatus)
 * 3. Le calcul dynamique de l'indice de santé VHI (0-100) et des statuts opérationnels
 * 4. L'évaluation d'état des sous-systèmes du châssis (Diagnostic Nodes)
 * 5. La projection d'usure prédictive RUL
 */

export interface WorkerInMessage {
  type: 'EVALUATE_TELEMETRY';
  id: string;
  payload: {
    values: Record<string, number | string>;
    rulHealth: Record<string, number>;
    dtcs: { code: string; title: string; severity: 'nominal' | 'warning' | 'critical'; targetNodeId?: string }[];
    sensorsSchema: {
      key: string;
      thresholds?: { critLow?: number; warnLow?: number; warnHigh?: number; critHigh?: number };
    }[];
    nodesSchema: {
      id: string;
      linkedSensorKeys?: string[];
      metricsSchema?: { key: string; label: string; thresholds?: { critLow?: number; warnLow?: number; warnHigh?: number; critHigh?: number }; unit?: string }[];
    }[];
    rulSchema: { key: string; maxKm?: number; avgDailyKm?: number }[];
  };
}

export interface WorkerOutMessage {
  type: 'EVALUATION_RESULT';
  id: string;
  result: {
    evaluatedSensors: Record<string, { value: number | string; status: 'nominal' | 'warning' | 'critical' }>;
    evaluatedNodes: Record<string, { id: string; status: 'nominal' | 'warning' | 'critical'; summary: string }>;
    vhiScore: number;
    globalStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
    evaluatedRul: { key: string; health: number; kmLeft: number; daysLeft: number; status: 'nominal' | 'warning' | 'critical' }[];
  };
}

function evaluateSensorStatus(
  rawValue: unknown,
  thresholds?: { critLow?: number; warnLow?: number; warnHigh?: number; critHigh?: number }
): 'nominal' | 'warning' | 'critical' {
  if (rawValue === undefined || rawValue === null || Number.isNaN(Number(rawValue))) {
    return 'warning';
  }
  const val = Number(rawValue);
  if (!thresholds) return 'nominal';

  const { critLow, warnLow, warnHigh, critHigh } = thresholds;
  if (critLow !== undefined && val <= critLow) return 'critical';
  if (critHigh !== undefined && val >= critHigh) return 'critical';
  if (warnLow !== undefined && val <= warnLow) return 'warning';
  if (warnHigh !== undefined && val >= warnHigh) return 'warning';
  return 'nominal';
}

// Handler de messages du Web Worker
if (typeof self !== 'undefined' && typeof (self as unknown as Worker).postMessage === 'function') {
  self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
    const { type, id, payload } = event.data;
    if (type !== 'EVALUATE_TELEMETRY' || !payload) return;

    const { values, rulHealth, dtcs, sensorsSchema, nodesSchema, rulSchema } = payload;

    // 1. Évaluation des capteurs
    const evaluatedSensors: Record<string, { value: number | string; status: 'nominal' | 'warning' | 'critical' }> = {};
    for (let i = 0; i < sensorsSchema.length; i++) {
      const s = sensorsSchema[i];
      const raw = values[s.key];
      const status = evaluateSensorStatus(raw, s.thresholds);
      evaluatedSensors[s.key] = {
        value: raw ?? 0,
        status,
      };
    }

    // 2. Évaluation des noeuds
    const evaluatedNodes: Record<string, { id: string; status: 'nominal' | 'warning' | 'critical'; summary: string }> = {};
    for (let i = 0; i < nodesSchema.length; i++) {
      const node = nodesSchema[i];
      const nodeStatuses: ('nominal' | 'warning' | 'critical')[] = [];

      (node.linkedSensorKeys || []).forEach((key) => {
        const s = evaluatedSensors[key];
        if (s) nodeStatuses.push(s.status);
      });

      (node.metricsSchema || []).forEach((m) => {
        if (m.thresholds) {
          const rawVal = values[m.key];
          nodeStatuses.push(evaluateSensorStatus(rawVal, m.thresholds));
        }
      });

      dtcs.forEach((d) => {
        if (d.targetNodeId === node.id) {
          nodeStatuses.push(d.severity);
        }
      });

      let finalStatus: 'nominal' | 'warning' | 'critical' = 'nominal';
      if (nodeStatuses.includes('critical')) finalStatus = 'critical';
      else if (nodeStatuses.includes('warning')) finalStatus = 'warning';

      evaluatedNodes[node.id] = {
        id: node.id,
        status: finalStatus,
        summary: finalStatus !== 'nominal' ? 'Alerte seuil détectée' : 'Nominal',
      };
    }

    // 3. Évaluation RUL
    const evaluatedRul = rulSchema.map((item) => {
      const health = rulHealth[item.key] ?? 100;
      const status = evaluateSensorStatus(health, { critLow: 20, warnLow: 40 });
      const kmLeft = Math.round((health / 100) * (item.maxKm || 25000));
      const daysLeft = Math.max(1, Math.round(kmLeft / (item.avgDailyKm || 150)));
      return {
        key: item.key,
        health,
        kmLeft,
        daysLeft,
        status,
      };
    });

    // 4. Calcul de l'indice VHI (0-100)
    let penalty = 0;
    Object.values(evaluatedSensors).forEach((s) => {
      if (s.status === 'critical') penalty += 14;
      else if (s.status === 'warning') penalty += 5;
    });
    evaluatedRul.forEach((r) => {
      if (r.status === 'critical') penalty += 10;
      else if (r.status === 'warning') penalty += 4;
    });
    dtcs.forEach((d) => {
      if (d.severity === 'critical') penalty += 9;
      else if (d.severity === 'warning') penalty += 3;
    });

    const vhiScore = Math.max(5, Math.min(100, Math.round(100 - penalty)));
    const hasCritical =
      Object.values(evaluatedSensors).some((s) => s.status === 'critical') ||
      evaluatedRul.some((r) => r.status === 'critical') ||
      dtcs.some((d) => d.severity === 'critical');
    const hasWarning =
      Object.values(evaluatedSensors).some((s) => s.status === 'warning') ||
      evaluatedRul.some((r) => r.status === 'warning') ||
      dtcs.some((d) => d.severity === 'warning');
    const globalStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL' = hasCritical
      ? 'CRITICAL'
      : hasWarning
      ? 'WARNING'
      : 'NOMINAL';

    const out: WorkerOutMessage = {
      type: 'EVALUATION_RESULT',
      id,
      result: {
        evaluatedSensors,
        evaluatedNodes,
        vhiScore,
        globalStatus,
        evaluatedRul,
      },
    };

    self.postMessage(out);
  };
}

