import React from 'react';

export type BadgeVariant =
  | 'ok'
  | 'warning'
  | 'danger'
  | 'info'
  | 'demo'
  | 'primary'
  | 'success'
  | 'neutral'
  | 'nominal'
  | 'critical';

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
    variant === 'primary'
      ? 'info'
      : variant === 'success' || variant === 'nominal'
      ? 'ok'
      : variant === 'critical'
      ? 'danger'
      : variant === 'neutral'
      ? 'demo'
      : variant;

  // Règle §4.2 : Le pulse télématique n'est autorisé que pour les états nominaux
  // (zéro pulse anxiogène en cas d'anomalie critique).
  const canPulse = pulse && normalizedVariant === 'ok';

  return (
    <span className={`df-badge df-badge-${normalizedVariant} ${className}`}>
      {canPulse ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      ) : (
        <span className="df-badge-dot" aria-hidden="true" />
      )}
      <span>{children}</span>
    </span>
  );
};
