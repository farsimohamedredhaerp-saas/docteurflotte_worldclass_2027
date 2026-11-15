'use client';

import React from 'react';
import { cn } from '../../lib/utils/cn';

export type KpiStatus = 'nominal' | 'warning' | 'critical' | 'neutral';

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  status?: KpiStatus;
  sparklineData?: number[];
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  trend,
  status = 'nominal',
  sparklineData,
  isLoading = false,
  icon,
  className,
  onClick,
  'aria-label': ariaLabel,
}: KpiCardProps) {
  // Rendu de la micro-sparkline SVG intégrée (hauteur fixe 32px, norme §5.2)
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 100;
    const height = 32;
    const padding = 2;

    const points = sparklineData.map((val, idx) => {
      const x = padding + (idx / (sparklineData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const lastPoint = points[points.length - 1].split(',');
    const lastX = Number(lastPoint[0]);
    const lastY = Number(lastPoint[1]);
    const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

    const strokeColor =
      status === 'critical'
        ? 'var(--df-status-danger)'
        : status === 'warning'
        ? 'var(--df-status-warning)'
        : 'var(--df-chart-1)';

    return (
      <div className="w-20 sm:w-24 h-8 shrink-0 relative overflow-hidden" aria-hidden="true">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`kpi-grad-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#kpi-grad-${label.replace(/\s+/g, '-')})`} />
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={lastX}
            cy={lastY}
            r="2.5"
            fill={strokeColor}
            className="animate-pulse"
          />
        </svg>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'relative rounded-[var(--df-radius-lg,10px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-4 shadow-[var(--df-shadow-sm)] flex flex-col justify-between overflow-hidden',
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="df-skeleton h-3 w-24 rounded-[var(--df-radius-xs,4px)]" />
          <div className="df-skeleton h-4 w-4 rounded-full" />
        </div>
        <div className="my-2">
          <div className="df-skeleton h-8 w-32 rounded-[var(--df-radius-sm,6px)]" />
        </div>
        <div className="df-skeleton h-3 w-20 rounded-[var(--df-radius-xs,4px)] mt-2" />
      </div>
    );
  }

  const isCritical = status === 'critical';
  const isWarning = status === 'warning';

  const valueColorClass = isCritical
    ? 'text-[var(--df-status-danger-text)]'
    : isWarning
    ? 'text-[var(--df-status-warning-text)]'
    : 'text-[var(--df-text-main)]';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel || `${label}: ${value} ${unit || ''}`}
      className={cn(
        'group relative rounded-[var(--df-radius-lg,10px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-4 shadow-[var(--df-shadow-sm)] flex flex-col justify-between transition-all duration-[var(--df-dur-fast,120ms)] ease-[var(--df-ease-out-quint)]',
        'before:content-[""] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-[var(--df-border-card-top,#ffffff)] before:opacity-10 before:pointer-events-none',
        onClick && 'cursor-pointer hover:-translate-y-[1px] hover:border-[var(--df-border-medium)] hover:shadow-[var(--df-shadow-md)] focus-visible:outline-2 focus-visible:outline-[var(--df-border-focus)] focus-visible:outline-offset-2',
        className
      )}
    >
      {/* En-tête : Label Eyebrow + Icône */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-[var(--df-text-secondary)] uppercase tracking-wider truncate font-sans">
          {label}
        </span>
        {icon && (
          <span className="text-[var(--df-text-muted)] group-hover:text-[var(--df-accent-blue)] transition-colors shrink-0">
            {icon}
          </span>
        )}
      </div>

      {/* Corps : Valeur Principale (JetBrains Mono 32px Tabular-Nums) + Sparkline */}
      <div className="flex items-end justify-between gap-3 my-1">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span
            className={cn(
              'text-[2rem] font-bold tracking-tight font-mono tabular-nums leading-none',
              valueColorClass
            )}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[12px] font-mono font-medium text-[var(--df-text-muted)]">
              {unit}
            </span>
          )}
        </div>

        {renderSparkline()}
      </div>

      {/* Bas : Tendance Delta */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-bold tabular-nums px-1.5 py-0.5 rounded-[var(--df-radius-xs,4px)]',
              trend.isPositive
                ? 'bg-[var(--df-status-ok-bg)] text-[var(--df-status-ok-text)] border border-[var(--df-status-ok-border)]'
                : 'bg-[var(--df-status-danger-bg)] text-[var(--df-status-danger-text)] border border-[var(--df-status-danger-border)]'
            )}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </span>
          <span className="text-[var(--df-text-muted)] truncate font-sans font-medium">
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}

