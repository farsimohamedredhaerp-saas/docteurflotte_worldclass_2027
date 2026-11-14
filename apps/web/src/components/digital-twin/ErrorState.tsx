import React from 'react';
import { IconAlertTriangle } from '../navigation/TechIcons';

export interface ErrorStateProps {
  title: string;
  errorMessage?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  errorMessage,
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
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: 'var(--df-radius-xl)',
        boxShadow: 'var(--df-shadow-md)',
        maxWidth: '640px',
        margin: '48px auto',
      }}
    >
      <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <IconAlertTriangle size={32} className="text-rose-500" />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--df-status-danger)', margin: '0 0 8px' }}>
        {title}
      </h2>
      {errorMessage && (
        <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', maxWidth: '480px', margin: '0 0 24px', lineHeight: 1.5 }}>
          {errorMessage}
        </p>
      )}
      {onRetry && retryLabel && (
        <button
          onClick={onRetry}
          style={{
            background: 'var(--df-status-danger)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--df-radius-md)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--df-shadow-sm)',
            transition: 'opacity var(--df-transition-fast)',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

