'use client';

import React, { useState, useId } from 'react';
import { cn } from '../../lib/utils/cn';
import chartTokens from '../../tokens/chart.json';

export interface DataPoint {
  timestamp: string;
  [seriesKey: string]: string | number;
}

export interface SeriesConfig {
  key: string;
  label: string;
  unit?: string;
  colorVar?: string; // ex: 'var(--df-chart-1)'
}

export interface TrendChartProps {
  title?: string;
  subtitle?: string;
  data: DataPoint[];
  series: SeriesConfig[];
  height?: number;
  className?: string;
  yMin?: number;
  yMax?: number;
  showGrid?: boolean;
}

export function TrendChart({
  title,
  subtitle,
  data,
  series,
  height = 240,
  className,
  yMin: customMin,
  yMax: customMax,
  showGrid = true,
}: TrendChartProps) {
  const chartId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'rounded-[var(--df-radius-lg,10px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-5 text-center flex flex-col items-center justify-center',
          className
        )}
        style={{ height }}
      >
        <p className="text-[12px] font-mono text-[var(--df-text-muted)]">
          Données télématiques insuffisantes pour tracer la courbe temporelle.
        </p>
      </div>
    );
  }

  // Calcul des extremums Y
  let computedMin = Infinity;
  let computedMax = -Infinity;

  data.forEach((d) => {
    series.forEach((s) => {
      const val = Number(d[s.key]);
      if (!isNaN(val)) {
        if (val < computedMin) computedMin = val;
        if (val > computedMax) computedMax = val;
      }
    });
  });

  const effectiveMin = customMin !== undefined ? customMin : Math.floor(computedMin * 0.95);
  const effectiveMax = customMax !== undefined ? customMax : Math.ceil(computedMax * 1.05) || 100;
  const range = effectiveMax - effectiveMin || 1;

  // Dimensions géométriques SVG
  const width = 680;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Coordonnées X et Y
  const getX = (idx: number) => {
    return paddingLeft + (idx / Math.max(1, data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(effectiveMin, Math.min(effectiveMax, val));
    return paddingTop + innerHeight - ((clamped - effectiveMin) / range) * innerHeight;
  };

  // Grille Y (4 divisions)
  const yTicks = [
    effectiveMin,
    Math.round(effectiveMin + range * 0.33),
    Math.round(effectiveMin + range * 0.66),
    effectiveMax,
  ];

  const defaultColors = [
    'var(--df-chart-1)',
    'var(--df-chart-2)',
    'var(--df-chart-3)',
    'var(--df-chart-4)',
    'var(--df-chart-5)',
  ];

  return (
    <div
      className={cn(
        'rounded-[var(--df-radius-lg,10px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-5 shadow-[var(--df-shadow-sm)] flex flex-col justify-between relative',
        'before:content-[""] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-[var(--df-border-card-top,#ffffff)] before:opacity-10 before:pointer-events-none',
        className
      )}
    >
      {/* En-tête : Titre et Légende des Séries */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          {title && (
            <h3 className="text-[13px] font-bold text-[var(--df-text-main)] uppercase tracking-wider font-sans">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-[var(--df-text-muted)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Légende interactive */}
        <div className="flex items-center gap-3.5 flex-wrap">
          {series.map((s, idx) => {
            const color = s.colorVar || defaultColors[idx % defaultColors.length];
            return (
              <div key={s.key} className="flex items-center gap-1.5 text-[11px] font-mono">
                <span
                  className="w-2.5 h-1 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[var(--df-text-secondary)] font-medium">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rendu Graphique SVG Responsive */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Grille horizontale & Labels Axe Y */}
          {showGrid &&
            yTicks.map((tick, i) => {
              const y = getY(tick);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="var(--df-chart-grid)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="var(--df-chart-axis-text)"
                    fontSize="10"
                    fontFamily="var(--df-font-mono)"
                    className="tabular-nums"
                  >
                    {tick.toLocaleString('fr-FR')}
                  </text>
                </g>
              );
            })}

          {/* Tracés des séries */}
          {series.map((s, sIdx) => {
            const color = s.colorVar || defaultColors[sIdx % defaultColors.length];
            const points = data.map((d, i) => `${getX(i).toFixed(1)},${getY(Number(d[s.key])).toFixed(1)}`);
            const pathD = `M ${points.join(' L ')}`;
            const areaD = `${pathD} L ${getX(data.length - 1).toFixed(1)},${height - paddingBottom} L ${paddingLeft},${height - paddingBottom} Z`;

            return (
              <g key={s.key}>
                <defs>
                  <linearGradient id={`${chartId}-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {/* Surface sous la courbe principale */}
                {sIdx === 0 && (
                  <path d={areaD} fill={`url(#${chartId}-grad-${s.key})`} pointerEvents="none" />
                )}
                {/* Ligne de série */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Zones invisibles de détection de survol (Hitboxes) */}
          {data.map((_, idx) => {
            const x = getX(idx);
            const sliceWidth = innerWidth / data.length;
            return (
              <rect
                key={idx}
                x={x - sliceWidth / 2}
                y={paddingTop}
                width={sliceWidth}
                height={innerHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(idx)}
              />
            );
          })}

          {/* Curseur vertical et points interactifs au survol */}
          {hoveredIdx !== null && (
            <g pointerEvents="none">
              <line
                x1={getX(hoveredIdx)}
                y1={paddingTop}
                x2={getX(hoveredIdx)}
                y2={height - paddingBottom}
                stroke="var(--df-border-focus)"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
              {series.map((s, sIdx) => {
                const color = s.colorVar || defaultColors[sIdx % defaultColors.length];
                const val = Number(data[hoveredIdx][s.key]);
                return (
                  <circle
                    key={s.key}
                    cx={getX(hoveredIdx)}
                    cy={getY(val)}
                    r="4"
                    fill={color}
                    stroke="var(--df-bg-surface-1)"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* Labels Axe X (Horodatages) */}
          {data.map((d, idx) => {
            // Afficher un label tous les N points pour éviter le chevauchement
            const step = Math.ceil(data.length / 5);
            if (idx % step !== 0 && idx !== data.length - 1) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="var(--df-chart-axis-text)"
                fontSize="10"
                fontFamily="var(--df-font-mono)"
              >
                {d.timestamp}
              </text>
            );
          })}
        </svg>

        {/* Tooltip Haute Précision Tabulaire Flottant */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none p-2.5 rounded-[var(--df-radius-sm,6px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] shadow-[var(--df-shadow-md)] backdrop-blur-md text-[11px] font-mono z-20 transition-all"
            style={{
              left: `${Math.min(78, Math.max(15, (getX(hoveredIdx) / width) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-[var(--df-text-main)] mb-1 pb-1 border-b border-[var(--df-border-subtle)]">
              {data[hoveredIdx].timestamp}
            </div>
            {series.map((s, sIdx) => {
              const color = s.colorVar || defaultColors[sIdx % defaultColors.length];
              const val = data[hoveredIdx][s.key];
              return (
                <div key={s.key} className="flex items-center justify-between gap-3 text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-[var(--df-text-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>{s.label}</span>
                  </span>
                  <span className="font-bold tabular-nums text-[var(--df-text-main)]">
                    {Number(val).toLocaleString('fr-FR')} {s.unit || ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
