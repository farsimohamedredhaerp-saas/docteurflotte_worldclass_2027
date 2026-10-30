import React from 'react';

export type BadgeVariant = 'ok' | 'warning' | 'danger' | 'info' | 'demo' | 'primary' | 'success' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
  size?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  pulse = false,
  className = '',
}) => {
  const normalizedVariant =
    variant === 'primary' ? 'info' : variant === 'success' ? 'ok' : variant === 'neutral' ? 'demo' : variant;

  return (
    <span className={`df-badge df-badge-${normalizedVariant} ${className}`}>
      <span className={`df-badge-dot ${pulse ? 'df-pulse' : ''}`} />
      <span>{children}</span>
    </span>
  );
};
