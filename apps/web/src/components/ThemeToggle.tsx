'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === 'dark' : false;

  return (
    <button
      onClick={toggleTheme}
      type="button"
      suppressHydrationWarning
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showLabel ? '0.4rem' : '0',
        width: showLabel ? 'auto' : '30px',
        height: '30px',
        minWidth: showLabel ? 'auto' : '30px',
        padding: showLabel ? '0.35rem 0.65rem' : '0',
        background: 'var(--df-bg-surface-2)',
        color: 'var(--df-text-main)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-full)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
        transition: 'all var(--df-transition-fast)',
        userSelect: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--df-border-focus)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <span style={{ fontSize: '0.90rem', lineHeight: 1 }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      {showLabel && (
        <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
          {isDark ? 'Clair' : 'Sombre'}
        </span>
      )}
    </button>
  );
}
