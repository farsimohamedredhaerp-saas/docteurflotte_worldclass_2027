'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Box,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Cpu,
  Crosshair,
  Database,
  Eye,
  Flame,
  Fuel,
  Gauge,
  GitCommit,
  Layers,
  Lock,
  MapPin,
  Maximize2,
  Navigation,
  Play,
  Pause,
  Radio,
  RefreshCw,
  Satellite,
  ShieldAlert,
  Sliders,
  Sparkles,
  Terminal,
  Thermometer,
  Truck,
  Wifi,
  Wind,
  Wrench,
  Zap,
  Car,
  Compass,
  Users,
  Check,
  ArrowLeft,
} from 'lucide-react';
import {
  DEMO_FALLBACK_DATA,
  VehicleSchema,
  TelemetryPayload,
  SeverityStatus,
  SensorThresholds,
  SensorSchemaItem,
  MetricSchemaItem,
  NodeSchemaItem,
  RulSchemaItem,
  DtcItem,
  GpsTelemetry,
  ChassisTemplate,
  VehicleIdentity,
} from './demoFallbackData';

// Re-export des types pour les consommateurs
export type {
  VehicleSchema,
  TelemetryPayload,
  SeverityStatus,
  SensorThresholds,
  SensorSchemaItem,
  MetricSchemaItem,
  NodeSchemaItem,
  RulSchemaItem,
  DtcItem,
  GpsTelemetry,
  ChassisTemplate,
  VehicleIdentity,
};
export { DEMO_FALLBACK_DATA };

export interface CadLayers {
  chassis: boolean;
  powertrain: boolean;
  thermal: boolean;
  sensors: boolean;
}

// ============================================================================
// 1. MOTEUR D'INGESTION & ÉVALUATION DYNAMIQUE (ZÉRO STATUT CODÉ EN DUR)
// ============================================================================

/**
 * Évalue dynamiquement la criticité d'une valeur brute selon les seuils du capteur.
 * Aucune couleur ou statut n'est figé : tout dépend de la donnée entrante.
 */
export function evaluateSensorStatus(
  rawValue: unknown,
  thresholds: SensorThresholds = {}
): SeverityStatus {
  if (rawValue === undefined || rawValue === null || Number.isNaN(Number(rawValue))) {
    return 'warning';
  }
  const val = Number(rawValue);
  const { critLow, warnLow, warnHigh, critHigh } = thresholds;

  if (critLow !== undefined && val <= critLow) return 'critical';
  if (critHigh !== undefined && val >= critHigh) return 'critical';
  if (warnLow !== undefined && val <= warnLow) return 'warning';
  if (warnHigh !== undefined && val >= warnHigh) return 'warning';
  return 'nominal';
}

/**
 * Calcule le statut d'un noeud du châssis SVG à partir des capteurs qui lui sont rattachés
 * et des éventuels codes défauts (DTC) associés à ce sous-système.
 */
export function evaluateNodeStatus(
  nodeSchema: NodeSchemaItem,
  evaluatedSensorsMap: Record<string, { status: SeverityStatus }>,
  activeDtcs: DtcItem[] = []
): SeverityStatus {
  const statuses: SeverityStatus[] = [];

  // 1. Vérifie les capteurs liés dynamiquement à ce noeud
  (nodeSchema.linkedSensorKeys || []).forEach((key) => {
    const sensor = evaluatedSensorsMap[key];
    if (sensor) statuses.push(sensor.status);
  });

  // 2. Vérifie les sous-métriques du noeud qui possèdent leurs propres seuils
  (nodeSchema.metricsSchema || []).forEach((m) => {
    if (m.thresholds && m.rawValue !== undefined) {
      statuses.push(evaluateSensorStatus(m.rawValue, m.thresholds));
    }
  });

  // 3. Vérifie si un code défaut actif (DTC) cible ce noeud
  activeDtcs.forEach((dtc) => {
    if (dtc.targetNodeId === nodeSchema.id) {
      statuses.push(dtc.severity || 'warning');
    }
  });

  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('warning')) return 'warning';
  return 'nominal';
}

/**
 * Calcule dynamiquement l'indice VHI (0-100) et le statut opérationnel global du véhicule
 * à partir des capteurs en temps réel, de l'usure RUL et des codes défauts DTC.
 */
export function computeDynamicHealth(
  evaluatedSensors: { status: SeverityStatus }[],
  evaluatedRul: { status: SeverityStatus }[],
  activeDtcs: DtcItem[]
): { vhiScore: number; globalStatus: 'CRITICAL' | 'WARNING' | 'NOMINAL' } {
  let penalty = 0;

  evaluatedSensors.forEach((s) => {
    if (s.status === 'critical') penalty += 14;
    else if (s.status === 'warning') penalty += 5;
  });

  evaluatedRul.forEach((r) => {
    if (r.status === 'critical') penalty += 10;
    else if (r.status === 'warning') penalty += 4;
  });

  activeDtcs.forEach((d) => {
    if (d.severity === 'critical') penalty += 9;
    else if (d.severity === 'warning') penalty += 3;
  });

  const vhiScore = Math.max(5, Math.min(100, Math.round(100 - penalty)));

  const hasCritical =
    evaluatedSensors.some((s) => s.status === 'critical') ||
    evaluatedRul.some((r) => r.status === 'critical') ||
    activeDtcs.some((d) => d.severity === 'critical');

  const hasWarning =
    evaluatedSensors.some((s) => s.status === 'warning') ||
    evaluatedRul.some((r) => r.status === 'warning') ||
    activeDtcs.some((d) => d.severity === 'warning');

  const globalStatus = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'NOMINAL';

  return { vhiScore, globalStatus };
}

/**
 * Formate dynamiquement une valeur brute avec son unité ou son mapping texte.
 */
export function formatMetricValue(
  rawValue: unknown,
  unit = '',
  valueMap: Record<string | number, string> | null = null
): string {
  if (rawValue === undefined || rawValue === null) return 'N/A';
  if (valueMap && (valueMap as Record<string, string>)[String(rawValue)] !== undefined) {
    return (valueMap as Record<string, string>)[String(rawValue)];
  }
  if (typeof rawValue === 'number') {
    const formatted = Number.isInteger(rawValue) ? rawValue : Number(rawValue.toFixed(2));
    return unit ? `${formatted} ${unit}` : `${formatted}`;
  }
  return unit ? `${rawValue} ${unit}` : String(rawValue);
}

export const VEHICLE_TABS = [
  { id: 'sedan', label: '01 // TOURISME', sub: 'BERLINE OBD-II', icon: Car },
  { id: 'van', label: '02 // UTILITAIRE', sub: 'FOURGON LCV', icon: Box },
  { id: 'suv', label: '03 // SUV 4X4', sub: 'INTERVENTION 4WD', icon: Compass },
  { id: 'truck', label: '04 // CAMION 6X4', sub: 'PORTEUR J1939', icon: Truck },
  { id: 'semi', label: '05 // SEMI-REMORQUE', sub: 'TRIDEM 44T EBS', icon: Layers },
  { id: 'coach', label: '06 // TRANSPORT PAX', sub: 'AUTOCAR 55 PL.', icon: Users },
];

export const STATUS_THEME: Record<
  SeverityStatus,
  { text: string; border: string; bg: string; bar: string; stroke: string; label: string }
> = {
  nominal: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    bar: 'bg-emerald-400',
    stroke: '#34d399',
    label: 'NOMINAL',
  },
  warning: {
    text: 'text-amber-400',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    bar: 'bg-amber-400',
    stroke: '#fbbf24',
    label: 'DEGRADED',
  },
  critical: {
    text: 'text-rose-500',
    border: 'border-rose-500/70',
    bg: 'bg-rose-500/15',
    bar: 'bg-rose-500',
    stroke: '#f43f5e',
    label: 'CRITICAL',
  },
};

// ============================================================================
// SOUS-COMPOSANT : PANNEAU TACTIQUE HUD AVEC CROCHETS D'ANGLE (CORNER BRACKETS)
// ============================================================================
export function HudPanel({
  title,
  code,
  status = 'nominal',
  rightElement,
  children,
  className = '',
}: {
  title: string;
  code?: string;
  status?: SeverityStatus;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const accentCorner =
    status === 'critical'
      ? 'border-rose-500'
      : status === 'warning'
      ? 'border-amber-400'
      : 'border-cyan-400/70';

  return (
    <div className={`relative bg-slate-900/75 border border-slate-800 flex flex-col ${className}`}>
      {/* 4 Crochets d'angle HUD (6px) */}
      <span className={`pointer-events-none absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 ${accentCorner}`} />
      <span className={`pointer-events-none absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 ${accentCorner}`} />
      <span className={`pointer-events-none absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 ${accentCorner}`} />
      <span className={`pointer-events-none absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 ${accentCorner}`} />

      {/* En-tête d'instrumentation technique */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/90 bg-slate-950/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 bg-cyan-400 shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-semibold truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rightElement}
          {code && (
            <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 border border-slate-800">
              {code}
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-3 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANT : JAUGE LINÉAIRE SEGMENTÉE (16 BLOCS TACTIQUES)
// ============================================================================
export function SegmentedBar({
  value,
  min,
  max,
  status = 'nominal',
  blocks = 16,
}: {
  value: number;
  min: number;
  max: number;
  status?: SeverityStatus;
  blocks?: number;
}) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const activeCount = Math.round(ratio * blocks);
  const activeColor =
    status === 'critical'
      ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
      : status === 'warning'
      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]'
      : 'bg-cyan-400';

  return (
    <div
      className="grid gap-[2px] w-full h-2"
      style={{ gridTemplateColumns: `repeat(${blocks}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: blocks }).map((_, idx) => {
        const isLit = idx < activeCount;
        return (
          <div
            key={idx}
            className={`h-full transition-colors duration-200 ${
              isLit ? activeColor : 'bg-slate-800/80'
            }`}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANT : CADRAN CIRCULAIRE VHI (VEHICLE HEALTH INDEX)
// ============================================================================
export function VhiReactorGauge({
  score,
  status,
}: {
  score: number;
  status: SeverityStatus;
}) {
  const totalSegments = 24;
  const activeSegments = Math.round((score / 100) * totalSegments);
  const strokeColor =
    status === 'critical' ? '#f43f5e' : status === 'warning' ? '#fbbf24' : '#34d399';

  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Anneau externe de graduation */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        {/* 24 segments radiaux */}
        {Array.from({ length: totalSegments }).map((_, i) => {
          const angle = (i * 360) / totalSegments;
          const isLit = i < activeSegments;
          return (
            <line
              key={i}
              x1="60"
              y1="12"
              x2="60"
              y2="21"
              stroke={isLit ? strokeColor : '#1e293b'}
              strokeWidth="3.2"
              transform={`rotate(${angle} 60 60)`}
            />
          );
        })}
        {/* Anneau interne technique */}
        <circle cx="60" cy="60" r="34" fill="none" stroke="#0f172a" strokeWidth="4" />
        <circle
          cx="60"
          cy="60"
          r="34"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeDasharray={`${(score / 100) * 213} 213`}
          strokeOpacity="0.6"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">VHI</span>
        <span className="text-2xl font-mono font-bold tabular-nums text-slate-100 leading-none">
          {score}
        </span>
        <span className="text-[9px] font-mono text-slate-500 mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT CENTRAL : LES 6 BLUEPRINTS X-RAY SVG DÉTAILLÉS VUS DE DESSUS
// ============================================================================
export function VehicleBlueprintSVG({
  vehicleId,
  layers,
  nodes,
  selectedNodeId,
  onSelectNode,
}: {
  vehicleId: string;
  layers: CadLayers;
  nodes: (NodeSchemaItem & { status: SeverityStatus })[];
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}) {
  const showChassis = layers.chassis;
  const showPowertrain = layers.powertrain;
  const showThermal = layers.thermal;
  const showSensors = layers.sensors;

  return (
    <svg
      viewBox="0 0 360 620"
      className="w-full h-full max-h-[380px] select-none mx-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="minorGrid" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#0f172a" strokeWidth="0.7" />
        </pattern>
        <linearGradient id="xrayGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Règles de télémétrie latérales et axes centraux */}
      <line x1="180" y1="10" x2="180" y2="610" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="20" y1="310" x2="340" y2="310" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i} transform={`translate(8, ${35 + i * 48})`}>
          <line x1="0" y1="0" x2="6" y2="0" stroke="#334155" strokeWidth="1" />
          <text x="10" y="3" fill="#475569" fontSize="7" fontFamily="monospace">
            {(i * 1.2).toFixed(1)}m
          </text>
        </g>
      ))}

      {/* 1. VOITURE DE TOURISME */}
      {vehicleId === 'sedan' && (
        <g>
          {showChassis && (
            <g stroke="#334155" fill="none">
              <path
                d="M115,72 C135,54 225,54 245,72 L258,135 L258,495 C258,530 235,552 180,552 C125,552 102,530 102,495 L102,135 Z"
                fill="url(#xrayGlow)"
                stroke="#38bdf8"
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              <path d="M118,185 L242,185 L230,245 L130,245 Z" stroke="#475569" strokeWidth="1.2" />
              <rect x="130" y="245" width="100" height="125" stroke="#334155" strokeWidth="1" />
              <path d="M130,370 L230,370 L240,425 L120,425 Z" stroke="#475569" strokeWidth="1.2" />
              {[
                { x: 84, y: 120 },
                { x: 256, y: 120 },
                { x: 84, y: 432 },
                { x: 256, y: 432 },
              ].map((w, idx) => (
                <g key={idx}>
                  <rect x={w.x} y={w.y} width="20" height="54" fill="#090d16" stroke="#64748b" strokeWidth="1.5" />
                  <line x1={w.x + 10} y1={w.y + 8} x2={w.x + 10} y2={w.y + 46} stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="2" />
                </g>
              ))}
              <line x1="104" y1="147" x2="145" y2="147" stroke="#64748b" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="215" y1="147" x2="256" y2="147" stroke="#64748b" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="104" y1="459" x2="256" y2="459" stroke="#64748b" strokeWidth="2" />
            </g>
          )}

          {showPowertrain && (
            <g>
              <rect x="145" y="102" width="72" height="42" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
              {[156, 172, 188, 204].map((cx) => (
                <circle key={cx} cx={cx} cy="123" r="6" fill="#020617" stroke="#22d3ee" strokeWidth="1.2" />
              ))}
              <rect x="132" y="148" width="44" height="34" fill="#0f172a" stroke="#38bdf8" strokeOpacity="0.8" strokeWidth="1.2" />
              <rect x="112" y="96" width="24" height="18" fill="#0f172a" stroke="#34d399" strokeWidth="1" />
              <rect x="232" y="126" width="20" height="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <path d="M135,405 L225,405 L220,445 L140,445 Z" fill="#0f172a" stroke="#06b6d4" strokeOpacity="0.6" strokeWidth="1.2" />
            </g>
          )}

          {showThermal && (
            <g>
              <rect x="135" y="74" width="90" height="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
              <path d="M180,144 L180,520" stroke="#f59e0b" strokeOpacity="0.7" strokeWidth="2.5" fill="none" />
              <rect x="170" y="325" width="20" height="42" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.3" />
              <rect x="152" y="502" width="56" height="22" fill="#0f172a" stroke="#fbbf24" strokeOpacity="0.7" strokeWidth="1.2" />
            </g>
          )}
        </g>
      )}

      {/* 2. UTILITAIRE LÉGER (FOURGON) */}
      {vehicleId === 'van' && (
        <g>
          {showChassis && (
            <g>
              <path
                d="M104,68 C130,55 230,55 256,68 L264,120 L264,552 L96,552 L96,120 Z"
                fill="url(#xrayGlow)"
                stroke="#38bdf8"
                strokeOpacity="0.5"
                strokeWidth="1.5"
              />
              <line x1="138" y1="80" x2="138" y2="545" stroke="#475569" strokeWidth="2" />
              <line x1="222" y1="80" x2="222" y2="545" stroke="#475569" strokeWidth="2" />
              {[150, 210, 270, 330, 390, 450, 510].map((y) => (
                <line key={y} x1="138" y1={y} x2="222" y2={y} stroke="#334155" strokeWidth="1.2" />
              ))}
              <line x1="96" y1="196" x2="264" y2="196" stroke="#22d3ee" strokeWidth="2" />
              <rect x="104" y="204" width="152" height="338" fill="none" stroke="#06b6d4" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="6 3" />
              <line x1="266" y1="225" x2="266" y2="395" stroke="#34d399" strokeWidth="3" />
              <line x1="180" y1="542" x2="180" y2="556" stroke="#34d399" strokeWidth="2" />
              {[
                { x: 78, y: 112 },
                { x: 264, y: 112 },
                { x: 78, y: 446 },
                { x: 264, y: 446 },
              ].map((w, idx) => (
                <rect key={idx} x={w.x} y={w.y} width="18" height="56" fill="#090d16" stroke="#64748b" strokeWidth="1.5" />
              ))}
              <line x1="96" y1="474" x2="264" y2="474" stroke="#94a3b8" strokeWidth="3" />
            </g>
          )}

          {showPowertrain && (
            <g>
              <rect x="150" y="88" width="60" height="46" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
              <rect x="160" y="134" width="40" height="36" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <line x1="180" y1="170" x2="180" y2="474" stroke="#64748b" strokeWidth="2.5" />
              <circle cx="180" cy="474" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            </g>
          )}

          {showThermal && (
            <g>
              <rect x="134" y="315" width="92" height="68" fill="#091526" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="158" cy="349" r="16" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="4 2" />
              <circle cx="202" cy="349" r="16" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="4 2" />
              <path d="M198,134 L198,430" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
              <rect x="186" y="216" width="24" height="46" fill="#2a0a18" stroke="#f43f5e" strokeWidth="1.8" />
            </g>
          )}
        </g>
      )}

      {/* 3. SUV / 4X4 */}
      {vehicleId === 'suv' && (
        <g>
          {showChassis && (
            <g>
              <path d="M120,58 L240,58 L248,72 L112,72 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="162" y="54" width="36" height="12" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.2" />
              <path
                d="M104,72 L256,72 L266,180 L266,490 L252,535 L108,535 L94,490 L94,180 Z"
                fill="url(#xrayGlow)"
                stroke="#38bdf8"
                strokeOpacity="0.5"
                strokeWidth="1.6"
              />
              <polygon points="138,105 222,105 214,205 146,205" fill="#0f172a" fillOpacity="0.7" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 2" />
              <rect x="146" y="255" width="68" height="65" fill="#0f172a" fillOpacity="0.7" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 2" />
              {[
                { x: 68, y: 116 },
                { x: 264, y: 116 },
                { x: 68, y: 414 },
                { x: 264, y: 414 },
              ].map((w, idx) => (
                <g key={idx}>
                  <rect x={w.x} y={w.y} width="28" height="66" fill="#090d16" stroke="#94a3b8" strokeWidth="1.8" />
                  {[12, 24, 36, 48, 58].map((ty) => (
                    <line key={ty} x1={w.x + 2} y1={w.y + ty} x2={w.x + 26} y2={w.y + ty} stroke="#475569" strokeWidth="2" />
                  ))}
                </g>
              ))}
            </g>
          )}

          {showPowertrain && (
            <g>
              <line x1="96" y1="149" x2="264" y2="149" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="180" cy="149" r="13" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
              <rect x="148" y="115" width="64" height="58" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.6" />
              <rect x="160" y="178" width="40" height="62" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <rect x="152" y="262" width="56" height="46" fill="#271a0c" stroke="#fbbf24" strokeWidth="1.8" />
              <line x1="180" y1="262" x2="180" y2="162" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="5 2" />
              <line x1="180" y1="308" x2="180" y2="446" stroke="#22d3ee" strokeWidth="3" />
              <line x1="96" y1="446" x2="264" y2="446" stroke="#38bdf8" strokeWidth="3.5" />
              <circle cx="180" cy="446" r="16" fill="#0f172a" stroke="#34d399" strokeWidth="1.8" />
            </g>
          )}

          {showThermal && (
            <g>
              <path d="M152,170 L132,220 L132,515" stroke="#fbbf24" strokeOpacity="0.65" strokeWidth="2" fill="none" />
              <path d="M208,170 L228,220 L228,515" stroke="#fbbf24" strokeOpacity="0.65" strokeWidth="2" fill="none" />
            </g>
          )}
        </g>
      )}

      {/* 4. CAMION PORTEUR 6X4 */}
      {vehicleId === 'truck' && (
        <g>
          {showChassis && (
            <g>
              <rect x="96" y="48" width="168" height="106" fill="#0c192c" stroke="#38bdf8" strokeWidth="1.8" />
              <line x1="104" y1="56" x2="256" y2="56" stroke="#22d3ee" strokeWidth="2" />
              <line x1="146" y1="55" x2="146" y2="578" stroke="#94a3b8" strokeWidth="3.5" />
              <line x1="214" y1="55" x2="214" y2="578" stroke="#94a3b8" strokeWidth="3.5" />
              {[165, 220, 275, 330, 385, 445, 515, 570].map((y) => (
                <line key={y} x1="146" y1={y} x2="214" y2={y} stroke="#64748b" strokeWidth="2" />
              ))}
              <rect x="92" y="166" width="176" height="414" fill="url(#xrayGlow)" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1.4" />
              <rect x="70" y="88" width="22" height="58" fill="#090d16" stroke="#94a3b8" strokeWidth="1.6" />
              <rect x="268" y="88" width="22" height="58" fill="#090d16" stroke="#94a3b8" strokeWidth="1.6" />
              <line x1="92" y1="117" x2="268" y2="117" stroke="#64748b" strokeWidth="3" />

              {[448, 520].map((axleY, aIdx) => (
                <g key={aIdx}>
                  <rect x="64" y={axleY - 28} width="16" height="56" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="83" y={axleY - 28} width="16" height="56" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="261" y={axleY - 28} width="16" height="56" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="280" y={axleY - 28} width="16" height="56" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="99" y1={axleY} x2="261" y2={axleY} stroke="#38bdf8" strokeWidth="4" />
                  <circle cx="180" cy={axleY} r="15" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.8" />
                </g>
              ))}
            </g>
          )}

          {showPowertrain && (
            <g>
              <rect x="156" y="76" width="48" height="86" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.8" />
              {[88, 101, 114, 127, 140, 152].map((cy) => (
                <circle key={cy} cx="180" cy={cy} r="4.5" fill="#020617" stroke="#22d3ee" strokeWidth="1" />
              ))}
              <rect x="162" y="164" width="36" height="48" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4" />
              <line x1="180" y1="212" x2="180" y2="520" stroke="#22d3ee" strokeWidth="3" />
              <rect x="96" y="220" width="44" height="95" fill="#0c1f2e" stroke="#06b6d4" strokeWidth="1.5" />
              <rect x="220" y="185" width="42" height="38" fill="#1e1b0f" stroke="#fbbf24" strokeWidth="1.5" />
              <rect x="220" y="252" width="44" height="58" fill="#2a0a18" stroke="#f43f5e" strokeWidth="1.8" />
            </g>
          )}

          {showThermal && (
            <g>
              <rect x="220" y="325" width="38" height="52" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.3" />
              <path d="M204,130 L238,160 L238,377" stroke="#fbbf24" strokeOpacity="0.7" strokeWidth="2" fill="none" />
            </g>
          )}
        </g>
      )}

      {/* 5. SEMI-REMORQUE ARTICULÉ */}
      {vehicleId === 'semi' && (
        <g>
          {showChassis && (
            <g>
              <rect x="108" y="42" width="144" height="84" fill="#0c192c" stroke="#38bdf8" strokeWidth="1.8" />
              <path d="M112,85 L180,118 L248,85" fill="none" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="1.2" />
              <line x1="152" y1="50" x2="152" y2="245" stroke="#94a3b8" strokeWidth="3" />
              <line x1="208" y1="50" x2="208" y2="245" stroke="#94a3b8" strokeWidth="3" />
              <rect x="86" y="66" width="18" height="46" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="256" y="66" width="18" height="46" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="78" y="196" width="14" height="48" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
              <rect x="94" y="196" width="14" height="48" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
              <rect x="252" y="196" width="14" height="48" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
              <rect x="268" y="196" width="14" height="48" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
              <line x1="108" y1="220" x2="252" y2="220" stroke="#38bdf8" strokeWidth="3.5" />

              <circle cx="180" cy="218" r="18" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
              <circle cx="180" cy="218" r="5" fill="#22d3ee" />

              <rect
                x="94"
                y="196"
                width="172"
                height="392"
                fill="url(#xrayGlow)"
                stroke="#38bdf8"
                strokeOpacity="0.65"
                strokeWidth="1.6"
              />
              {[285, 320, 355, 390, 425, 460].map((y) => (
                <line key={y} x1="96" y1={y} x2="264" y2={y} stroke="#334155" strokeWidth="1.2" />
              ))}

              {[490, 525, 560].map((ty, idx) => (
                <g key={idx}>
                  <rect x="74" y={ty - 15} width="18" height="30" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect
                    x="268"
                    y={ty - 15}
                    width="18"
                    height="30"
                    fill={idx === 1 ? '#2e1018' : '#090d16'}
                    stroke={idx === 1 ? '#fbbf24' : '#94a3b8'}
                    strokeWidth="1.6"
                  />
                  <line x1="92" y1={ty} x2="268" y2={ty} stroke="#64748b" strokeWidth="2.5" />
                  <circle cx="140" cy={ty} r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <circle cx="220" cy={ty} r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                </g>
              ))}
            </g>
          )}

          {showPowertrain && (
            <g>
              <rect x="160" y="64" width="40" height="62" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.6" />
              <line x1="180" y1="126" x2="180" y2="218" stroke="#22d3ee" strokeWidth="2.5" />
              <rect x="96" y="132" width="50" height="56" fill="#0c1f2e" stroke="#06b6d4" strokeWidth="1.5" />
              <rect x="214" y="138" width="48" height="44" fill="#0c1f2e" stroke="#06b6d4" strokeWidth="1.5" />
              <path d="M165,180 Q150,200 175,215" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
              <path d="M195,180 Q210,200 185,215" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            </g>
          )}

          {showThermal && (
            <g>
              <rect x="128" y="248" width="104" height="32" fill="#09192b" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="150" y1="280" x2="150" y2="465" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="6 4" />
              <line x1="210" y1="280" x2="210" y2="465" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="6 4" />
            </g>
          )}
        </g>
      )}

      {/* 6. TRANSPORT DE VOYAGEURS */}
      {vehicleId === 'coach' && (
        <g>
          {showChassis && (
            <g>
              <path d="M96,62 L76,48 M264,62 L284,48" stroke="#38bdf8" strokeWidth="2" />
              <path
                d="M96,54 C140,42 220,42 264,54 L264,578 L96,578 Z"
                fill="url(#xrayGlow)"
                stroke="#38bdf8"
                strokeOpacity="0.55"
                strokeWidth="1.6"
              />
              {Array.from({ length: 12 }).map((_, rIdx) => {
                const sy = 102 + rIdx * 32;
                return (
                  <g key={rIdx} stroke="#334155" strokeWidth="1" fill="none">
                    <rect x="106" y={sy} width="26" height="20" />
                    <rect x="135" y={sy} width="26" height="20" />
                    <rect x="199" y={sy} width="26" height="20" />
                    <rect x="228" y={sy} width="26" height="20" />
                  </g>
                );
              })}
              <line x1="265" y1="68" x2="265" y2="102" stroke="#34d399" strokeWidth="3.5" />
              <line x1="265" y1="312" x2="265" y2="352" stroke="#34d399" strokeWidth="3.5" />
              <rect x="78" y="114" width="18" height="52" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="264" y="114" width="18" height="52" fill="#090d16" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="72" y="424" width="12" height="52" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
              <rect x="85" y="424" width="12" height="52" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
              <rect x="263" y="424" width="12" height="52" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
              <rect x="276" y="424" width="12" height="52" fill="#090d16" stroke="#94a3b8" strokeWidth="1.4" />
            </g>
          )}

          {showPowertrain && (
            <g>
              <rect x="148" y="510" width="64" height="58" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.8" />
              <rect x="158" y="440" width="44" height="32" fill="#271a0c" stroke="#fbbf24" strokeWidth="1.6" />
              <line x1="180" y1="510" x2="180" y2="440" stroke="#22d3ee" strokeWidth="3" />
              <line x1="97" y1="450" x2="263" y2="450" stroke="#38bdf8" strokeWidth="3.5" />
              <rect x="102" y="482" width="34" height="28" fill="#0f172a" stroke="#34d399" strokeWidth="1.4" />
            </g>
          )}

          {showThermal && (
            <g>
              <rect x="136" y="232" width="88" height="96" fill="#09192b" stroke="#22d3ee" strokeWidth="1.5" />
              {[254, 304].map((cy) =>
                [158, 202].map((cx) => (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="13" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />
                ))
              )}
              <rect x="136" y="502" width="88" height="68" fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="4 2" />
            </g>
          )}
        </g>
      )}

      {/* COUCHE INTERACTIVE : NOEUDS DE DIAGNOSTIC */}
      {showSensors &&
        nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const color = STATUS_THEME[node.status]?.stroke || '#22d3ee';

          return (
            <g
              key={node.id}
              className="cursor-pointer group"
              onClick={() => onSelectNode(node.id)}
            >
              <line
                x1={node.x}
                y1={node.y}
                x2={node.x > 180 ? 326 : 34}
                y2={node.y}
                stroke={color}
                strokeOpacity={isSelected ? '0.9' : '0.35'}
                strokeWidth={isSelected ? '1.5' : '1'}
                strokeDasharray={isSelected ? 'none' : '2 2'}
              />
              <rect
                x={node.x > 180 ? 302 : 12}
                y={node.y - 14}
                width="46"
                height="13"
                fill="#020617"
                stroke={color}
                strokeWidth={isSelected ? '1.3' : '0.8'}
              />
              <text
                x={node.x > 180 ? 325 : 35}
                y={node.y - 5}
                textAnchor="middle"
                fill={color}
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {node.code}
              </text>

              {(node.status === 'critical' || isSelected) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? '18' : '14'}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                  className="animate-ping"
                />
              )}

              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? '11' : '8'}
                fill="#020617"
                fillOpacity="0.85"
                stroke={color}
                strokeWidth={isSelected ? '2' : '1.4'}
              />
              {isSelected && (
                <g stroke={color} strokeWidth="1.2">
                  <line x1={node.x - 16} y1={node.y} x2={node.x - 11} y2={node.y} />
                  <line x1={node.x + 11} y1={node.y} x2={node.x + 16} y2={node.y} />
                  <line x1={node.x} y1={node.y - 16} x2={node.x} y2={node.y - 11} />
                  <line x1={node.x} y1={node.y + 11} x2={node.x} y2={node.y + 16} />
                </g>
              )}
              <circle cx={node.x} cy={node.y} r="3.5" fill={color} />
            </g>
          );
        })}
    </svg>
  );
}

// ============================================================================
// 3. COMPOSANT COMMERCIAL PRODUCTION : <TacticalHudCockpit /> (100% PROPS)
// AUCUN CODE DÉFAUT, CONSTANTE OU STATUT EN DUR DANS LE JSX.
// ============================================================================
export interface TacticalHudCockpitProps {
  vehicleSchema: VehicleSchema;
  telemetryPayload: TelemetryPayload;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  scanlineOn?: boolean;
  onToggleScanline?: () => void;
  layers: CadLayers;
  onToggleLayer: (layerKey: keyof CadLayers) => void;
  framesPerSec?: number;
}

export function TacticalHudCockpit({
  vehicleSchema,
  telemetryPayload,
  selectedNodeId,
  onSelectNode,
  scanlineOn = true,
  onToggleScanline,
  layers,
  onToggleLayer,
  framesPerSec = 0,
}: TacticalHudCockpitProps) {
  // 1. Évaluation dynamique des capteurs à partir de `telemetryPayload.values`
  const evaluatedSensors = useMemo(() => {
    const rawValues = telemetryPayload?.values || {};
    return (vehicleSchema?.sensorsSchema || []).map((sensorDef) => {
      const val = rawValues[sensorDef.key];
      const status = evaluateSensorStatus(val, sensorDef.thresholds);
      return {
        ...sensorDef,
        value: typeof val === 'number' ? val : Number(val) || 0,
        status,
      };
    });
  }, [vehicleSchema, telemetryPayload]);

  const evaluatedSensorsMap = useMemo(() => {
    const map: Record<string, { status: SeverityStatus }> = {};
    evaluatedSensors.forEach((s) => {
      map[s.key] = s;
    });
    return map;
  }, [evaluatedSensors]);

  // 2. Évaluation dynamique de l'usure prédictive (RUL)
  const evaluatedRul = useMemo(() => {
    const rulHealthMap = telemetryPayload?.rulHealth || {};
    return (vehicleSchema?.rulSchema || []).map((item) => {
      const healthPct = rulHealthMap[item.key] ?? 100;
      const status = evaluateSensorStatus(healthPct, { critLow: 20, warnLow: 40 });
      const kmLeft = Math.round((healthPct / 100) * (item.maxKm || 25000));
      const daysLeft = Math.max(1, Math.round(kmLeft / (item.avgDailyKm || 150)));
      return {
        ...item,
        health: healthPct,
        kmLeft,
        daysLeft,
        status,
      };
    });
  }, [vehicleSchema, telemetryPayload]);

  // 3. Évaluation dynamique des noeuds du châssis SVG
  const evaluatedNodes = useMemo(() => {
    const rawValues = telemetryPayload?.values || {};
    const activeDtcs = telemetryPayload?.dtcs || [];

    return (vehicleSchema?.nodesSchema || []).map((nodeDef) => {
      const computedMetrics = (nodeDef.metricsSchema || []).map((mDef) => {
        const rawVal = rawValues[mDef.key];
        const metricStatus = mDef.thresholds
          ? evaluateSensorStatus(rawVal, mDef.thresholds)
          : 'nominal';
        return {
          ...mDef,
          k: mDef.label,
          v: formatMetricValue(rawVal, mDef.unit, mDef.valueMap || null),
          s: metricStatus,
          rawValue: rawVal,
        };
      });

      const nodeStatus = evaluateNodeStatus(
        { ...nodeDef, metricsSchema: computedMetrics },
        evaluatedSensorsMap,
        activeDtcs
      );

      const anomalousMetrics = computedMetrics.filter((m) => m.s !== 'nominal');
      const dynamicSummary =
        anomalousMetrics.length > 0
          ? `Alerte seuil détectée sur : ${anomalousMetrics.map((m) => `${m.k} (${m.v})`).join(' // ')}`
          : `Tous les paramètres télémétriques de l'organe ${nodeDef.code} sont dans les seuils constructeur nominaux.`;

      return {
        ...nodeDef,
        status: nodeStatus,
        summary: dynamicSummary,
        metrics: computedMetrics,
      };
    });
  }, [vehicleSchema, telemetryPayload, evaluatedSensorsMap]);

  // 4. Calcul dynamique du score VHI (0-100) et du statut opérationnel global
  const { vhiScore, globalStatus } = useMemo(() => {
    return computeDynamicHealth(
      evaluatedSensors,
      evaluatedRul,
      telemetryPayload?.dtcs || []
    );
  }, [evaluatedSensors, evaluatedRul, telemetryPayload]);

  const activeNode =
    evaluatedNodes.find((n) => n.id === selectedNodeId) || evaluatedNodes[0];

  const gps = telemetryPayload?.gps || { lat: 0, lng: 0, alt: 0, speed: 0, heading: 'N', latencyMs: 0 };
  const activeDtcs = telemetryPayload?.dtcs || [];

  return (
    <main className="tactical-hud-grid max-w-[1600px] w-full mx-auto p-2.5 flex-1 items-start">
      {/* COLONNE GAUCHE (3 COLONNES) : FLUX CAPTEURS EN TEMPS RÉEL */}
      <section className="tactical-col-3 flex flex-col gap-2.5">
        <HudPanel
          title="FLUX TÉLÉMÉTRIE TEMPS RÉEL"
          code="SYS-01 // STREAM"
          status={
            globalStatus === 'CRITICAL'
              ? 'critical'
              : globalStatus === 'NOMINAL'
              ? 'nominal'
              : 'warning'
          }
        >
          <div className="space-y-2.5">
            {evaluatedSensors.map((sensor) => {
              const st = STATUS_THEME[sensor.status] || STATUS_THEME.nominal;
              return (
                <div
                  key={sensor.key}
                  className="p-2.5 bg-slate-950/80 border border-slate-800/90 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400 font-semibold tracking-wider">
                      {sensor.label}
                    </span>
                    <span className="text-slate-500">{sensor.code}</span>
                  </div>

                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xl font-bold ${st.text}`}>
                        {typeof sensor.value === 'number'
                          ? Number.isInteger(sensor.value)
                            ? sensor.value
                            : sensor.value.toFixed(1)
                          : sensor.value}
                      </span>
                      <span className="text-xs text-slate-400">{sensor.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      PLAGE [{sensor.min}..{sensor.max}]
                    </span>
                  </div>

                  <SegmentedBar
                    value={sensor.value}
                    min={sensor.min}
                    max={sensor.max}
                    status={sensor.status}
                    blocks={16}
                  />
                </div>
              );
            })}
          </div>
        </HudPanel>

        {/* Panneau Caractéristiques Géométriques & Masse */}
        <HudPanel title="SPÉCIFICATIONS & GABARIT" code="SYS-02 // SPEC">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="p-2 bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500">GABARIT (L×l×H)</div>
              <div className="text-slate-200 font-semibold mt-0.5 truncate">
                {vehicleSchema?.identity?.dimensions || 'N/A'}
              </div>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500">CHARGE / MODE</div>
              <div className="text-cyan-300 font-semibold mt-0.5 truncate">
                {vehicleSchema?.identity?.weightLabel || 'N/A'}
              </div>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500">ALTITUDE GPS</div>
              <div className="text-slate-200 mt-0.5">
                {gps.alt !== undefined ? `${gps.alt}m ASL` : 'N/A'}
              </div>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500">TRAMES BUS / SEC</div>
              <div className="text-emerald-400 mt-0.5 tabular-nums">
                {framesPerSec} msg/s
              </div>
            </div>
          </div>
        </HudPanel>
      </section>

      {/* COLONNE CENTRALE (5 COLONNES) : SCANNER RAYON-X & INSPECTEUR D'ORGANE */}
      <section className="tactical-col-5 flex flex-col gap-2.5">
        <HudPanel
          title={`SCANNER CHÂSSIS X-RAY // ${vehicleSchema.shortName}`}
          code={vehicleSchema.code}
          status={activeNode?.status || 'nominal'}
          className="flex-1"
          rightElement={
            onToggleScanline ? (
              <button
                onClick={onToggleScanline}
                className={`text-[10px] font-mono px-1.5 py-0.5 border cursor-pointer ${
                  scanlineOn
                    ? 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40'
                    : 'border-slate-700 text-slate-500'
                }`}
              >
                LASER_SCAN: {scanlineOn ? 'ON' : 'OFF'}
              </button>
            ) : undefined
          }
        >
          {/* Barre de filtres de calques */}
          <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-slate-800/80 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 uppercase text-[9px] hidden sm:inline">CALQUES CAD:</span>
              {(
                [
                  { id: 'chassis', label: 'CHÂSSIS' },
                  { id: 'powertrain', label: 'MOTOPROPULSEUR' },
                  { id: 'thermal', label: 'THERMIQUE/FLUX' },
                  { id: 'sensors', label: 'NOEUDS CAPTEURS' },
                ] as { id: keyof CadLayers; label: string }[]
              ).map((ly) => (
                <button
                  key={ly.id}
                  onClick={() => onToggleLayer(ly.id)}
                  className={`px-1.5 py-0.5 border text-[9px] font-semibold transition cursor-pointer ${
                    layers[ly.id]
                      ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {ly.label}
                </button>
              ))}
            </div>
            <span className="text-slate-400 text-[9px]">STATUTS NOEUDS CALCULÉS EN DIRECT</span>
          </div>

          {/* Zone Blueprint Vectoriel */}
          <div className="relative flex-1 min-h-[360px] max-h-[400px] bg-slate-950 border border-slate-800/90 overflow-hidden flex items-center justify-center bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:20px_20px]">
            {scanlineOn && (
              <div
                className="pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-cyan-400/10 to-cyan-400/25 border-b border-cyan-400/40 animate-pulse"
                style={{
                  top: `${((framesPerSec * 17) % 85) + 5}%`,
                  transition: 'top 0.85s linear',
                }}
              />
            )}

            {/* Sélecteur rapide des noeuds */}
            <div className="blueprint-node-overlay flex flex-col gap-1">
              {evaluatedNodes.map((n) => {
                const active = n.id === activeNode?.id;
                const st = STATUS_THEME[n.status] || STATUS_THEME.nominal;
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelectNode(n.id)}
                    className={`px-2 py-1 text-left font-mono text-[10px] border flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-slate-900/95 border-cyan-400 text-slate-100'
                        : 'bg-slate-950/85 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 ${st.bar}`} />
                    <span className="font-bold">{n.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Légende d'état */}
            <div className="blueprint-legend-overlay bg-slate-950/90 border border-slate-800 px-2 py-1.5 font-mono text-[9px] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 bg-emerald-400 inline-block" /> NOMINAL
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 bg-amber-400 inline-block" /> SEUIL WARN
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2 h-2 bg-rose-500 inline-block" /> SEUIL CRIT
              </div>
            </div>

            {/* Rendu du SVG Blueprint */}
            <VehicleBlueprintSVG
              vehicleId={vehicleSchema.chassisTemplate}
              layers={layers}
              nodes={evaluatedNodes}
              selectedNodeId={activeNode?.id}
              onSelectNode={onSelectNode}
            />
          </div>

          {/* Boîte d'Inspection Tactique ("HUD TARGET CALLOUT") */}
          {activeNode && (
            <div className="mt-2.5 p-2.5 bg-slate-950 border border-cyan-500/40 relative">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                    {activeNode.code}
                  </span>
                  <h3 className="text-xs font-mono font-bold text-slate-100 uppercase">
                    {activeNode.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-slate-500">{activeNode.system}</span>
                  <span
                    className={`px-1.5 py-0.5 border font-bold ${
                      STATUS_THEME[activeNode.status].bg
                    } ${STATUS_THEME[activeNode.status].text} ${
                      STATUS_THEME[activeNode.status].border
                    }`}
                  >
                    {STATUS_THEME[activeNode.status].label}
                  </span>
                </div>
              </div>

              <p className="text-xs font-mono text-slate-300 my-2">{activeNode.summary}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeNode.metrics.map((m, i) => {
                  const mst = STATUS_THEME[m.s] || STATUS_THEME.nominal;
                  return (
                    <div
                      key={i}
                      className="p-2 bg-slate-900/90 border border-slate-800 font-mono tabular-nums"
                    >
                      <div className="text-[9px] text-slate-400 uppercase truncate">{m.k}</div>
                      <div className={`text-xs font-bold mt-0.5 ${mst.text}`}>{m.v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </HudPanel>
      </section>

      {/* COLONNE DROITE (4 COLONNES) : SANTÉ VHI CALCULÉE, RUL & DTC */}
      <section className="tactical-col-4 flex flex-col gap-2.5">
        {/* 1. Score d'Intégrité Globale VHI */}
        <HudPanel
          title="INDICE D'INTÉGRITÉ SYSTÈME (VHI CALCULÉ)"
          code="SYS-03 // HEALTH"
          status={
            vhiScore < 75 ? 'critical' : vhiScore < 88 ? 'warning' : 'nominal'
          }
        >
          <div className="flex items-center gap-4">
            <VhiReactorGauge
              score={vhiScore}
              status={
                vhiScore < 75 ? 'critical' : vhiScore < 88 ? 'warning' : 'nominal'
              }
            />
            <div className="flex-1 space-y-2 font-mono text-xs">
              <div className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">STATUT GLOBAL</span>
                <span
                  className={`font-bold ${
                    globalStatus === 'CRITICAL'
                      ? 'text-rose-400'
                      : globalStatus === 'WARNING'
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                  }`}
                >
                  {globalStatus}
                </span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">CAPTEURS HORS SEUIL</span>
                <span className="text-slate-200 font-bold">
                  {evaluatedSensors.filter((s) => s.status !== 'nominal').length} /{' '}
                  {evaluatedSensors.length}
                </span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">CODES DÉFAUTS ACTIFS</span>
                <span
                  className={`font-bold ${
                    activeDtcs.some((d) => d.severity === 'critical')
                      ? 'text-rose-400'
                      : activeDtcs.length > 0
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {activeDtcs.length} DTC ENREGISTRÉS
                </span>
              </div>
            </div>
          </div>
        </HudPanel>

        {/* 2. Durée de Vie Restante Prédictive (Predictive RUL) */}
        <HudPanel title="MAINTENANCE PRÉDICTIVE (RUL DYNAMIQUE)" code="SYS-04 // RUL_EST">
          <div className="space-y-3">
            {evaluatedRul.map((comp) => {
              const st = STATUS_THEME[comp.status] || STATUS_THEME.nominal;
              return (
                <div
                  key={comp.key}
                  className="p-2.5 bg-slate-950/90 border border-slate-800 space-y-1.5 font-mono tabular-nums"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold truncate pr-2">
                      {comp.name}
                    </span>
                    <span className={`font-bold ${st.text}`}>{comp.health}%</span>
                  </div>

                  <SegmentedBar
                    value={comp.health}
                    min={0}
                    max={100}
                    status={comp.status}
                    blocks={20}
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>AUTONOMIE USURE : {comp.kmLeft.toLocaleString()} KM</span>
                    <span>ÉCHÉANCE : ~{comp.daysLeft} JOURS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </HudPanel>

        {/* 3. Matrice des Codes Défauts Actifs (OBD-II / SAE J1939 DTC) */}
        <HudPanel
          title="MATRICE DES CODES DÉFAUTS (DTC / J1939)"
          code="SYS-05 // FAULT_LOG"
          status={
            activeDtcs.some((d) => d.severity === 'critical')
              ? 'critical'
              : activeDtcs.length > 0
              ? 'warning'
              : 'nominal'
          }
          className="flex-1"
        >
          {activeDtcs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border border-slate-800/80 bg-slate-950/60 font-mono text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
              <div className="text-xs text-emerald-300 font-bold">
                AUCUN CODE DÉFAUT ACTIF SUR LE BUS CAN
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Tous les calculateurs répondent normalement au standard J1939 / OBD-II.
              </div>
            </div>
          ) : (
            <div className="space-y-2 font-mono">
              {activeDtcs.map((dtc, idx) => {
                const st = STATUS_THEME[dtc.severity] || STATUS_THEME.nominal;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 bg-slate-950 border ${st.border} space-y-1`}
                  >
                    <div className="flex items-center justify-between text-[11px] tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 font-bold ${st.bg} ${st.text}`}>
                          {dtc.code}
                        </span>
                        <span className="text-slate-400">{dtc.spn}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>OCC: {dtc.count}x</span>
                        <span>{dtc.time}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{dtc.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </HudPanel>
      </section>
    </main>
  );
}

// ============================================================================
// 4. HARNAIS COMMERCIAL SOUVERAIN DOCTEURFLOTTE
// Zéro bouton Prompt IA. Pilotage direct, simulateur de capteurs & injection temps réel.
// ============================================================================
export function resolveVehicleCategory(id?: string): string {
  if (!id) return 'truck';
  const clean = id.toLowerCase().trim();
  if (DEMO_FALLBACK_DATA[clean]) return clean;
  if (clean === 'unit-001' || clean.includes('peugeot') || clean.includes('301') || clean.includes('sedan') || clean.includes('tourisme')) return 'sedan';
  if (clean === 'unit-002' || clean.includes('master') || clean.includes('van') || clean.includes('fourgon')) return 'van';
  if (clean === 'unit-003' || clean.includes('hilux') || clean.includes('suv') || clean.includes('4x4') || clean.includes('pick')) return 'suv';
  if (clean === 'unit-004' || clean.includes('k480') || clean.includes('benne') || clean.includes('porteur') || clean.includes('chantier')) return 'truck';
  if (clean === 'unit-005' || clean.includes('scania') || clean.includes('citerne') || clean.includes('semi') || clean.includes('naftal')) return 'semi';
  if (clean === 'unit-006' || clean.includes('shacman') || clean.includes('f3000')) return 'truck';
  if (clean === 'unit-007') return 'van';
  if (clean.includes('autocar') || clean.includes('bus') || clean.includes('travego') || clean.includes('coach')) return 'coach';
  return 'truck';
}

export function VehicleDiagnosticTacticalHud({
  initialCategory = 'truck',
  onBackToCockpit,
}: {
  initialCategory?: string;
  onBackToCockpit?: () => void;
}) {
  const resolvedCategory = resolveVehicleCategory(initialCategory);
  const [activeVehicleId, setActiveVehicleId] = useState<string>(resolvedCategory);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    DEMO_FALLBACK_DATA[resolvedCategory]?.nodesSchema[0]?.id || 'trk-eng'
  );
  const [isLiveSim, setIsLiveSim] = useState<boolean>(true);
  const [scanlineOn, setScanlineOn] = useState<boolean>(true);
  const [showPayloadInjector, setShowPayloadInjector] = useState<boolean>(false);
  const [utcTime, setUtcTime] = useState<string>('14:32:45 UTC');
  const [simTick, setSimTick] = useState<number>(0);

  // Synchronisation si initialCategory change depuis l'URL
  useEffect(() => {
    const nextCat = resolveVehicleCategory(initialCategory);
    setActiveVehicleId(nextCat);
    if (DEMO_FALLBACK_DATA[nextCat]?.nodesSchema[0]) {
      setSelectedNodeId(DEMO_FALLBACK_DATA[nextCat].nodesSchema[0].id);
    }
  }, [initialCategory]);

  // Surcharges manuelles des données capteurs
  const [customOverrides, setCustomOverrides] = useState<
    Record<string, Partial<TelemetryPayload>>
  >({});
  const [jsonEditorText, setJsonEditorText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');

  const [layers, setLayers] = useState<CadLayers>({
    chassis: true,
    powertrain: true,
    thermal: true,
    sensors: true,
  });

  const vehicleSchema =
    DEMO_FALLBACK_DATA[activeVehicleId] || DEMO_FALLBACK_DATA.truck;

  const handleSelectVehicle = (vId: string) => {
    setActiveVehicleId(vId);
    const nextSchema = DEMO_FALLBACK_DATA[vId] || DEMO_FALLBACK_DATA.truck;
    if (nextSchema.nodesSchema[0]) {
      setSelectedNodeId(nextSchema.nodesSchema[0].id);
    }
    setJsonEditorText(JSON.stringify(nextSchema.demoPayload, null, 2));
    setJsonError('');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toISOString().slice(11, 19) + ' UTC');
      if (isLiveSim) {
        setSimTick((t) => t + 1);
      }
    }, 900);
    return () => clearInterval(timer);
  }, [isLiveSim]);

  const liveTelemetryPayload = useMemo<TelemetryPayload>(() => {
    const basePayload = vehicleSchema.demoPayload;
    const vehicleOverrides = customOverrides[activeVehicleId] || {};
    const mergedValues: Record<string, number | string> = {
      ...basePayload.values,
      ...(vehicleOverrides.values || {}),
    };

    if (isLiveSim) {
      vehicleSchema.sensorsSchema.forEach((sDef, idx) => {
        const hasManualOverride =
          vehicleOverrides.values && vehicleOverrides.values[sDef.key] !== undefined;
        if (!hasManualOverride && sDef.jitter > 0) {
          const wave = Math.sin(simTick * 0.9 + idx * 1.7) * sDef.jitter;
          const currentVal = Number(basePayload.values[sDef.key]) || 0;
          const rawVal = currentVal + wave;
          const decimals =
            Number.isInteger(currentVal) && sDef.jitter >= 1 ? 0 : 1;
          mergedValues[sDef.key] = Number(rawVal.toFixed(decimals));
        }
      });
    }

    return {
      gps: { ...basePayload.gps, ...(vehicleOverrides.gps || {}) },
      values: mergedValues,
      rulHealth: { ...basePayload.rulHealth, ...(vehicleOverrides.rulHealth || {}) },
      dtcs: vehicleOverrides.dtcs !== undefined ? vehicleOverrides.dtcs : basePayload.dtcs,
    };
  }, [vehicleSchema, activeVehicleId, customOverrides, isLiveSim, simTick]);

  const headerHealth = useMemo(() => {
    const evalSensors = vehicleSchema.sensorsSchema.map((s) => ({
      status: evaluateSensorStatus(liveTelemetryPayload.values[s.key], s.thresholds),
    }));
    const evalRul = vehicleSchema.rulSchema.map((r) => ({
      status: evaluateSensorStatus(liveTelemetryPayload.rulHealth[r.key] ?? 100, {
        critLow: 20,
        warnLow: 40,
      }),
    }));
    return computeDynamicHealth(evalSensors, evalRul, liveTelemetryPayload.dtcs);
  }, [vehicleSchema, liveTelemetryPayload]);

  const handleSensorOverride = (sensorKey: string, newValue: string) => {
    setCustomOverrides((prev) => ({
      ...prev,
      [activeVehicleId]: {
        ...(prev[activeVehicleId] || {}),
        values: {
          ...(prev[activeVehicleId]?.values || {}),
          [sensorKey]: Number(newValue),
        },
      },
    }));
  };

  const handleResetOverrides = () => {
    setCustomOverrides((prev) => {
      const next = { ...prev };
      delete next[activeVehicleId];
      return next;
    });
    setJsonEditorText(JSON.stringify(vehicleSchema.demoPayload, null, 2));
    setJsonError('');
  };

  const handleApplyRawJson = () => {
    try {
      const parsed = JSON.parse(jsonEditorText) as Partial<TelemetryPayload>;
      setCustomOverrides((prev) => ({
        ...prev,
        [activeVehicleId]: parsed,
      }));
      setJsonError('');
    } catch (e) {
      setJsonError('Erreur de syntaxe JSON : vérifiez le format de votre trame de télémétrie.');
    }
  };

  const toggleLayer = (key: keyof CadLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const globalBadge =
    headerHealth.globalStatus === 'CRITICAL'
      ? 'bg-rose-500/15 text-rose-400 border-rose-500/60'
      : headerHealth.globalStatus === 'WARNING'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/60'
      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/60';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. BARRE SUPÉRIEURE DE COMMANDEMENT */}
      <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-cyan-500/10 border border-cyan-400/60 flex items-center justify-center shrink-0">
              <Crosshair className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-[0.2em] text-slate-100">
                  AETHER // TELEMETRY_OS v5.0
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  DATA-DRIVEN ENGINE
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                ZÉRO VALEUR CODÉE EN DUR — SEUILS, NOEUDS SVG & SCORE VHI CALCULÉS EN TEMPS RÉEL
              </p>
            </div>
          </div>

          {/* Contrôles Opérationnels : Test Données / Pause Stream */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (!showPayloadInjector) {
                  setJsonEditorText(JSON.stringify(liveTelemetryPayload, null, 2));
                }
                setShowPayloadInjector(!showPayloadInjector);
              }}
              className={`px-2.5 py-1.5 border text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                showPayloadInjector
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-cyan-500/50 text-cyan-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>TESTER VOS DONNÉES RÉELLES / API JSON</span>
            </button>

            <button
              onClick={() => setIsLiveSim(!isLiveSim)}
              className={`px-2.5 py-1.5 border text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                isLiveSim
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {isLiveSim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLiveSim ? 'STREAM: LIVE' : 'STREAM: PAUSE'}</span>
            </button>
          </div>
        </div>

        {/* Sélecteur des 6 Classes de Véhicules de la Flotte */}
        <div className="max-w-[1600px] mx-auto px-3 py-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 bg-slate-900/40">
          {VEHICLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeVehicleId === tab.id;
            const vSchema = DEMO_FALLBACK_DATA[tab.id];
            const vPayload =
              tab.id === activeVehicleId ? liveTelemetryPayload : vSchema.demoPayload;

            const tabSensors = vSchema.sensorsSchema.map((s) => ({
              status: evaluateSensorStatus(vPayload.values[s.key], s.thresholds),
            }));
            const tabRul = vSchema.rulSchema.map((r) => ({
              status: evaluateSensorStatus(vPayload.rulHealth[r.key] ?? 100, {
                critLow: 20,
                warnLow: 40,
              }),
            }));
            const { globalStatus: tabStatus } = computeDynamicHealth(
              tabSensors,
              tabRul,
              vPayload.dtcs
            );

            const dotColor =
              tabStatus === 'CRITICAL'
                ? 'bg-rose-500'
                : tabStatus === 'WARNING'
                ? 'bg-amber-400'
                : 'bg-emerald-400';

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectVehicle(tab.id)}
                className={`relative text-left px-2.5 py-2 border transition flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/50 border-cyan-400 text-slate-100 shadow-[inset_0_0_12px_rgba(34,211,238,0.15)]'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-[10px] font-mono font-bold tracking-wider truncate">
                      {tab.label}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 truncate">
                      {tab.sub}
                    </div>
                  </div>
                </div>
                <span className={`w-2 h-2 shrink-0 ${dotColor}`} />
              </button>
            );
          })}
        </div>

        {/* TIROIR INTERACTIF : CURSEURS DE TEST & INJECTEUR JSON */}
        {showPayloadInjector && (
          <div className="max-w-[1600px] mx-auto px-3 py-3 bg-slate-900/95 border-t border-b border-cyan-500/40 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase">
                  SIMULATION DE CAPTEURS & INJECTION TEMPS RÉEL (TEST DYNAMIQUE DE SEUILS)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetOverrides}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-700 hover:border-slate-500 text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>RÉINITIALISER VALEURS</span>
                </button>
                <button
                  onClick={() => setShowPayloadInjector(false)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-700 text-[10px] text-slate-400 cursor-pointer"
                >
                  FERMER
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-2">
                <div className="text-[10px] text-slate-400 uppercase">
                  Faites varier les valeurs brutes pour observer la réaction instantanée du châssis SVG, des jauges et du VHI :
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {vehicleSchema.sensorsSchema.map((s) => {
                    const currentVal = liveTelemetryPayload.values[s.key] ?? s.min;
                    const st = evaluateSensorStatus(currentVal, s.thresholds);
                    const step =
                      s.max - s.min > 200 ? 5 : s.max - s.min > 20 ? 0.5 : 0.05;
                    return (
                      <div
                        key={s.key}
                        className="p-2 bg-slate-950 border border-slate-800 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-300 font-semibold">{s.label}</span>
                          <span className={`font-bold ${STATUS_THEME[st].text}`}>
                            {currentVal} {s.unit} [{st.toUpperCase()}]
                          </span>
                        </div>
                        <input
                          type="range"
                          min={s.min}
                          max={s.max}
                          step={step}
                          value={currentVal}
                          onChange={(e) => handleSensorOverride(s.key, e.target.value)}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>MIN: {s.min}</span>
                          <span>
                            SEUILS:{' '}
                            {JSON.stringify(s.thresholds).replace(/["{}]/g, '') || 'AUCUN'}
                          </span>
                          <span>MAX: {s.max}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                  <span>Ou injectez directement une trame JSON API :</span>
                  <button
                    onClick={handleApplyRawJson}
                    className="px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-bold hover:bg-cyan-500/30 cursor-pointer"
                  >
                    INJECTER PAYLOAD JSON
                  </button>
                </div>
                <textarea
                  value={jsonEditorText}
                  onChange={(e) => setJsonEditorText(e.target.value)}
                  rows={8}
                  className="w-full flex-1 bg-slate-950 border border-slate-800 p-2 text-[11px] text-emerald-300 font-mono focus:outline-none focus:border-cyan-400"
                />
                {jsonError && (
                  <div className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-500/40 px-2 py-1">
                    {jsonError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bandeau d'Instrumentation Véhicule & Identité Flotte Algérienne */}
        <div className="max-w-[1600px] mx-auto px-3 py-2 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-cyan-300 font-bold">
              {vehicleSchema.identity.plate}
            </span>
            <span className="text-slate-200 font-semibold">{vehicleSchema.fullName}</span>
            {vehicleSchema.identity.wilaya ? (
              <span className="text-slate-400 hidden lg:inline">
                WILAYA : <strong className="text-slate-300">{vehicleSchema.identity.wilaya}</strong>
              </span>
            ) : null}
            <span className="text-slate-500 hidden md:inline">
              VIN: {vehicleSchema.identity.vin}
            </span>
            <span className="text-slate-400 bg-slate-900/90 px-2 py-0.5 border border-slate-800">
              {vehicleSchema.identity.protocol}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] tabular-nums">
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {liveTelemetryPayload.gps.lat}° N, {liveTelemetryPayload.gps.lng}° E
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {liveTelemetryPayload.gps.speed} KM/H // {liveTelemetryPayload.gps.heading}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Satellite className="w-3.5 h-3.5 text-emerald-400" />
              <span>LINK: {liveTelemetryPayload.gps.latencyMs}ms</span>
            </div>
            <div className="text-slate-400 hidden sm:block">{utcTime}</div>
            <div className={`px-2 py-0.5 border text-[10px] font-bold tracking-widest ${globalBadge}`}>
              STATUS: {headerHealth.globalStatus} (VHI {headerHealth.vhiScore}%)
            </div>
          </div>
        </div>
      </header>

      {/* 2. RENDU DU COMPOSANT PUR <TacticalHudCockpit /> */}
      <TacticalHudCockpit
        vehicleSchema={vehicleSchema}
        telemetryPayload={liveTelemetryPayload}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        scanlineOn={scanlineOn}
        onToggleScanline={() => setScanlineOn(!scanlineOn)}
        layers={layers}
        onToggleLayer={toggleLayer}
        framesPerSec={isLiveSim ? 420 + (simTick % 19) : 0}
      />
    </div>
  );
}

export default VehicleDiagnosticTacticalHud;
