import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  className = '',
  style,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '1.5rem',
        ...style,
      }}
      className={`df-glass ${interactive ? 'df-card-interactive' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
