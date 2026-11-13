import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  retryLabel,
  onRetry,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-xl)',
        boxShadow: 'var(--df-shadow-md)',
        maxWidth: '640px',
        margin: '48px auto',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛰️</div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 8px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', maxWidth: '480px', margin: '0 0 24px', lineHeight: 1.5 }}>
        {description}
      </p>
      {onRetry && retryLabel && (
        <button
          onClick={onRetry}
          style={{
            background: 'var(--df-accent-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--df-radius-md)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--df-shadow-sm)',
            transition: 'background var(--df-transition-fast)',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

