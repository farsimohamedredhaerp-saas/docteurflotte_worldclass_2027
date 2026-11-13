import React from 'react';

export interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: string;
  variant?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose';
  style?: React.CSSProperties;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'default',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'cyan':
        return {
          border: '1px solid rgba(56, 189, 248, 0.3)',
          valueColor: '#38bdf8',
        };
      case 'emerald':
        return {
          border: '1px solid rgba(16, 185, 129, 0.35)',
          valueColor: '#10b981',
        };
      case 'amber':
        return {
          border: '1px solid rgba(245, 158, 11, 0.35)',
          valueColor: '#f59e0b',
        };
      case 'rose':
        return {
          border: '1px solid rgba(239, 68, 68, 0.35)',
          valueColor: '#ef4444',
        };
      default:
        return {
          border: '1px solid var(--df-border-subtle)',
          valueColor: 'var(--df-text-main)',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '14px',
        boxShadow: 'var(--df-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...vStyles,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', fontWeight: 600 }}>{label}</span>
        {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: vStyles.valueColor }}>{value}</div>
      {subValue && (
        <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
    </div>
  );
};

