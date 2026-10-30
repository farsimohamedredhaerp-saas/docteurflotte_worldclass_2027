'use client';

import React from 'react';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconTruck,
  IconActivity,
  IconAlertTriangle,
  IconFuel,
  IconWrench,
  IconShieldCheck,
  IconClock,
} from '../navigation/TechIcons';

export interface KpiMetricItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  status?: 'nominal' | 'warning' | 'critical' | 'neutral';
  iconType: 'fleet' | 'activity' | 'alert' | 'fuel' | 'maintenance' | 'compliance' | 'clock';
}

const DEFAULT_KPIS: KpiMetricItem[] = [
  {
    id: 'active_assets',
    label: 'Unités en Mission Active',
    value: '142',
    unit: '/ 160',
    trend: { value: '+4.2%', isPositive: true, label: 'vs hier' },
    status: 'nominal',
    iconType: 'fleet',
  },
  {
    id: 'live_telemetry_flow',
    label: 'Flux CAN-bus / Télémétrie',
    value: '99.8',
    unit: '%',
    trend: { value: '< 24ms', isPositive: true, label: 'latence p95' },
    status: 'nominal',
    iconType: 'activity',
  },
  {
    id: 'critical_dtc_alerts',
    label: 'Codes Défauts Critiques (DTC)',
    value: '3',
    unit: 'actifs',
    trend: { value: '-2', isPositive: true, label: 'depuis 24h' },
    status: 'critical',
    iconType: 'alert',
  },
  {
    id: 'roi_preventive_savings',
    label: 'Économie Nette Préventive',
    value: '1 420 000',
    unit: 'DA',
    trend: { value: '+340 000 DA', isPositive: true, label: 'ce mois' },
    status: 'nominal',
    iconType: 'compliance',
  },
  {
    id: 'fuel_theft_cusum',
    label: 'Anti-Fraude CUSUM (Naftal)',
    value: '0 Vol',
    unit: 'CUSUM OK',
    trend: { value: '100%', isPositive: true, label: 'pleins réconciliés' },
    status: 'nominal',
    iconType: 'fuel',
  },
  {
    id: 'fuel_efficiency',
    label: 'Conso Moyenne Flotte',
    value: '31.4',
    unit: 'L/100km',
    trend: { value: '-1.8%', isPositive: true, label: 'optimisé' },
    status: 'nominal',
    iconType: 'fuel',
  },
  {
    id: 'preventive_due_soon',
    label: 'Échéances Préventives (< 48h)',
    value: '7',
    unit: 'engins',
    trend: { value: '+3', isPositive: false, label: 'horamètre BTPH' },
    status: 'warning',
    iconType: 'maintenance',
  },
  {
    id: 'dto_availability_rate',
    label: 'Disponibilité Technique (DTO)',
    value: '94.6',
    unit: '%',
    trend: { value: '+0.8%', isPositive: true, label: 'SLA garanti' },
    status: 'nominal',
    iconType: 'compliance',
  },
];

interface HighDensityKpiGridProps {
  metrics?: KpiMetricItem[];
}

export function HighDensityKpiGrid({ metrics = DEFAULT_KPIS }: HighDensityKpiGridProps) {
  const renderIcon = (type: KpiMetricItem['iconType']) => {
    switch (type) {
      case 'fleet':
        return <IconTruck size={15} strokeWidth={1.75} />;
      case 'activity':
        return <IconActivity size={15} strokeWidth={1.75} />;
      case 'alert':
        return <IconAlertTriangle size={15} strokeWidth={1.75} />;
      case 'fuel':
        return <IconFuel size={15} strokeWidth={1.75} />;
      case 'maintenance':
        return <IconWrench size={15} strokeWidth={1.75} />;
      case 'compliance':
        return <IconShieldCheck size={15} strokeWidth={1.75} />;
      case 'clock':
        return <IconClock size={15} strokeWidth={1.75} />;
      default:
        return <IconActivity size={15} strokeWidth={1.75} />;
    }
  };

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}
    >
      {metrics.map((kpi) => {
        const isCritical = kpi.status === 'critical';
        const isWarning = kpi.status === 'warning';

        return (
          <div
            key={kpi.id}
            className="p-3 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1F2937] rounded-lg shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              boxShadow: 'var(--df-shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* EN-TÊTE : LABEL + ICÔNE MONOCHROME */}
            <div
              className="flex items-center justify-between gap-1.5 mb-1.5"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.35rem',
                marginBottom: '0.35rem',
              }}
            >
              <span
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate tracking-tight uppercase"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--df-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                {kpi.label}
              </span>
              <span
                className="text-slate-400 dark:text-slate-500 shrink-0"
                style={{ color: 'var(--df-text-muted)', flexShrink: 0 }}
              >
                {renderIcon(kpi.iconType)}
              </span>
            </div>

            {/* VALEUR PRINCIPALE EN JETBRAINS MONO TABULAR-NUMS */}
            <div
              className="flex items-baseline gap-1 my-1"
              style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.25rem 0' }}
            >
              <span
                className={`text-xl font-semibold tracking-tight tabular-nums font-mono ${
                  isCritical
                    ? 'text-rose-600 dark:text-rose-500'
                    : isWarning
                    ? 'text-amber-600 dark:text-amber-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  fontFamily: 'var(--df-font-mono)',
                  letterSpacing: '-0.02em',
                  color: isCritical
                    ? 'var(--df-status-danger)'
                    : isWarning
                    ? 'var(--df-status-warning)'
                    : 'var(--df-text-main)',
                }}
              >
                {kpi.value}
              </span>
              {kpi.unit && (
                <span
                  className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500"
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--df-font-mono)',
                    color: 'var(--df-text-muted)',
                  }}
                >
                  {kpi.unit}
                </span>
              )}
            </div>

            {/* BAS : TENDANCE OU MICRO-SPARKLINE SUBTILES */}
            {kpi.trend && (
              <div
                className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '0.25rem',
                  fontSize: '0.7rem',
                  color: 'var(--df-text-muted)',
                }}
              >
                <span
                  className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${
                    kpi.trend.isPositive
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    fontWeight: 600,
                    color: kpi.trend.isPositive
                      ? 'var(--df-status-ok)'
                      : 'var(--df-status-danger)',
                  }}
                >
                  {kpi.trend.isPositive ? (
                    <IconArrowUpRight size={11} strokeWidth={2} />
                  ) : (
                    <IconArrowDownRight size={11} strokeWidth={2} />
                  )}
                  {kpi.trend.value}
                </span>
                <span className="truncate text-slate-400 dark:text-slate-500">
                  {kpi.trend.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
