'use client';

import React from 'react';
import Link from 'next/link';
import { useDemoMode } from '../../context/DemoModeContext';
import { IconActivity, IconTruck } from './TechIcons';

export function DemoModeToggle() {
  const { isDemoMode, isGuest, toggleDemoMode, session } = useDemoMode();

  if (isGuest) {
    return (
      <Link
        href="/live-cockpit"
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.22rem 0.5rem',
          borderRadius: 'var(--df-radius-full)',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#D97706',
          fontSize: '0.70rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          transition: 'all var(--df-transition-fast)',
        }}
        title="Vous explorez en Mode Démonstration Interactive sans connexion"
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#F59E0B',
            boxShadow: '0 0 5px #F59E0B',
          }}
        />
        <span>Démo</span>
      </Link>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--df-bg-surface-2)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-full)',
        padding: '2px',
        gap: '2px',
        whiteSpace: 'nowrap',
      }}
      title="Commuter entre vos données réelles d'entreprise et la flotte de démonstration"
    >
      {/* Option 1 : Parc Réel */}
      <button
        type="button"
        onClick={() => toggleDemoMode(false)}
        style={{
          border: 'none',
          background: !isDemoMode ? 'var(--df-accent-blue)' : 'transparent',
          color: !isDemoMode ? '#FFFFFF' : 'var(--df-text-muted)',
          padding: '0.18rem 0.45rem',
          borderRadius: 'var(--df-radius-full)',
          fontSize: '0.68rem',
          fontWeight: !isDemoMode ? 700 : 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          transition: 'all var(--df-transition-fast)',
          boxShadow: !isDemoMode ? '0 1px 4px rgba(37, 99, 235, 0.3)' : 'none',
        }}
      >
        <IconTruck size={11} strokeWidth={!isDemoMode ? 2.5 : 2} />
        <span>Réel</span>
      </button>

      {/* Option 2 : Mode Démo */}
      <button
        type="button"
        onClick={() => toggleDemoMode(true)}
        style={{
          border: 'none',
          background: isDemoMode ? '#F59E0B' : 'transparent',
          color: isDemoMode ? '#000000' : 'var(--df-text-muted)',
          padding: '0.18rem 0.45rem',
          borderRadius: 'var(--df-radius-full)',
          fontSize: '0.68rem',
          fontWeight: isDemoMode ? 800 : 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          transition: 'all var(--df-transition-fast)',
          boxShadow: isDemoMode ? '0 1px 4px rgba(245, 158, 11, 0.4)' : 'none',
        }}
      >
        <IconActivity size={11} strokeWidth={isDemoMode ? 2.5 : 2} />
        <span>Démo</span>
      </button>
    </div>
  );
}

