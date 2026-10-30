import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  variant?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
    isPositive?: boolean;
  };
  isDemo?: boolean;
  confidenceScore?: number;
  icon?: React.ReactNode;
  progressPercent?: number;
  actions?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  description,
  variant,
  trend,
  isDemo = false,
  confidenceScore,
  icon,
  progressPercent,
  actions,
}) => {
  return (
    <Card interactive style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {icon && (
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--df-radius-sm)',
                background: 'var(--df-accent-blue-subtle)',
                color: 'var(--df-accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.05rem',
                border: '1px solid var(--df-border-subtle)',
              }}
            >
              {icon}
            </div>
          )}
          <span style={{ fontSize: '0.825rem', color: 'var(--df-text-muted)', fontWeight: 600, letterSpacing: '0.01em' }}>
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {actions}
          {isDemo ? (
            <Badge variant="demo">DEMO</Badge>
          ) : confidenceScore !== undefined ? (
            <Badge variant={confidenceScore >= 95 ? 'ok' : 'warning'}>
              {confidenceScore}% Fiable
            </Badge>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.5rem 0' }}>
        <span
          className="df-mono"
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--df-text-main)',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '0.875rem', color: 'var(--df-text-muted)', fontWeight: 600 }}>
            {unit}
          </span>
        )}
      </div>

      {progressPercent !== undefined && (
        <div style={{ margin: '0.6rem 0 0.5rem 0' }}>
          <div className="df-gauge">
            <div
              className={`df-gauge-fill ${
                progressPercent > 85 ? 'df-gauge-danger' : progressPercent > 60 ? 'df-gauge-warning' : 'df-gauge-ok'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', marginTop: '0.4rem' }}>
          <span
            style={{
              color: trend.isPositive ? 'var(--df-status-ok)' : 'var(--df-status-danger)',
              fontWeight: 700,
            }}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.text}
          </span>
          <span style={{ color: 'var(--df-text-faint)' }}>vs période précédente</span>
        </div>
      )}

      {description && !trend && (
        <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginTop: '0.4rem' }}>
          {description}
        </div>
      )}
    </Card>
  );
};
