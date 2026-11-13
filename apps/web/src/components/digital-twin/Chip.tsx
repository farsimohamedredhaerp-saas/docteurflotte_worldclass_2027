import React from 'react';

export interface ChipProps {
  label: string;
  value?: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'muted';
  style?: React.CSSProperties;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  value,
  variant = 'cyan',
  style,
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        };
      case 'amber':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        };
      case 'rose':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        };
      case 'muted':
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--df-text-secondary)',
          border: '1px solid var(--df-border-subtle)',
        };
      case 'cyan':
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        };
    }
  };

  const current = getStyles();

  return (
    <div
      style={{
        background: current.bg,
        border: current.border,
        borderRadius: 'var(--df-radius-md)',
        padding: '6px 10px',
        display: 'inline-flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <span style={{ fontSize: '10px', color: 'var(--df-text-muted)', fontWeight: 600 }}>{label}</span>
      {value && <span style={{ fontSize: '13px', fontWeight: 700, color: current.color }}>{value}</span>}
    </div>
  );
};

