'use client';

import React from 'react';

interface CalculationProofButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'cyan' | 'emerald' | 'amber' | 'purple';
  title?: string;
}

export const CalculationProofButton: React.FC<CalculationProofButtonProps> = ({
  onClick,
  label = 'Règle & Preuve',
  size = 'sm',
  variant = 'cyan',
  title = 'Afficher la formule mathématique et la preuve pas-à-pas de ce résultat',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'emerald':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#10b981',
          hoverBg: 'rgba(16, 185, 129, 0.22)',
        };
      case 'amber':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.4)',
          text: '#f59e0b',
          hoverBg: 'rgba(245, 158, 11, 0.22)',
        };
      case 'purple':
        return {
          bg: 'rgba(168, 85, 247, 0.12)',
          border: 'rgba(168, 85, 247, 0.4)',
          text: '#c084fc',
          hoverBg: 'rgba(168, 85, 247, 0.22)',
        };
      case 'cyan':
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.4)',
          text: '#38bdf8',
          hoverBg: 'rgba(56, 189, 248, 0.22)',
        };
    }
  };

  const c = getColors();

  const getPadding = () => {
    if (size === 'xs') return '2px 6px';
    if (size === 'sm') return '3px 8px';
    return '6px 12px';
  };

  const getFontSize = () => {
    if (size === 'xs') return '10px';
    if (size === 'sm') return '11px';
    return '13px';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        padding: getPadding(),
        borderRadius: 6,
        fontSize: getFontSize(),
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        lineHeight: 1.2,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = c.hoverBg;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = c.bg;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: '1.05em' }}>🧮</span>
      <span>{label}</span>
    </button>
  );
};
