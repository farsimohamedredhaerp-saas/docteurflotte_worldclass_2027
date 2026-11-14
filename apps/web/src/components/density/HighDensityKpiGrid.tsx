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
        return <IconTruck size={14} strokeWidth={1.75} />;
      case 'activity':
        return <IconActivity size={14} strokeWidth={1.75} />;
      case 'alert':
        return <IconAlertTriangle size={14} strokeWidth={1.75} />;
      case 'fuel':
        return <IconFuel size={14} strokeWidth={1.75} />;
      case 'maintenance':
        return <IconWrench size={14} strokeWidth={1.75} />;
      case 'compliance':
        return <IconShieldCheck size={14} strokeWidth={1.75} />;
      case 'clock':
        return <IconClock size={14} strokeWidth={1.75} />;
      default:
        return <IconActivity size={14} strokeWidth={1.75} />;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
      {metrics.map((kpi) => {
        const isCritical = kpi.status === 'critical';
        const isWarning = kpi.status === 'warning';

        return (
          <div
            key={kpi.id}
            className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all duration-150 flex flex-col justify-between"
          >
            {/* EN-TÊTE : LABEL + ICÔNE MONOCHROME */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 truncate tracking-wider uppercase">
                {kpi.label}
              </span>
              <span className="text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-blue-500 transition-colors">
                {renderIcon(kpi.iconType)}
              </span>
            </div>

            {/* VALEUR PRINCIPALE EN JETBRAINS MONO TABULAR-NUMS */}
            <div className="flex items-baseline gap-1 my-1">
              <span
                className={`text-xl font-bold tracking-tight tabular-nums font-mono ${
                  isCritical
                    ? 'text-rose-600 dark:text-rose-400'
                    : isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
                  {kpi.unit}
                </span>
              )}
            </div>

            {/* BAS : TENDANCE OU MICRO-SPARKLINE SUBTILES */}
            {kpi.trend && (
              <div className="flex items-center gap-1 mt-1.5 text-[10.5px]">
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold tabular-nums font-mono ${
                    kpi.trend.isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {kpi.trend.isPositive ? (
                    <IconArrowUpRight size={11} strokeWidth={2.5} />
                  ) : (
                    <IconArrowDownRight size={11} strokeWidth={2.5} />
                  )}
                  {kpi.trend.value}
                </span>
                <span className="truncate text-slate-400 dark:text-slate-500 font-medium">
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
