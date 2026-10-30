'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDemoMode } from '../../context/DemoModeContext';
import { IconAlertTriangle, IconActivity, IconShieldCheck, IconX } from './TechIcons';

export function DemoModeBanner() {
  const pathname = usePathname();
  const { isDemoMode, isGuest, toggleDemoMode } = useDemoMode();

  if (!isDemoMode || pathname?.startsWith('/live-cockpit/hud')) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Mode Démonstration"
      style={{
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(37, 99, 235, 0.10) 100%)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
        color: 'var(--df-text-main)',
        padding: '0.45rem 1.25rem',
        fontSize: '0.78rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        zIndex: 95,
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Côté Gauche : Icône & Message Explicite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span
          style={{
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#D97706',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '0.15rem 0.45rem',
            borderRadius: 'var(--df-radius-xs)',
            fontWeight: 800,
            fontSize: '0.68rem',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <IconActivity size={12} strokeWidth={2.5} />
          {isGuest ? 'SANDBOX DÉMO INTERACTIVE' : 'MODE DÉMO (VIRTUEL)'}
        </span>

        <span style={{ color: 'var(--df-text-secondary)', lineHeight: 1.4 }}>
          {isGuest ? (
            <>
              Vous testez la plateforme <strong>sans connexion</strong> sur une flotte algérienne simulée (7 unités, Valhalla/GPS/CAN J1939, DZD).
            </>
          ) : (
            <>
              Vous visualisez la <strong>flotte de démonstration</strong>. Votre parc réel et vos données financières restent intacts.
            </>
          )}
        </span>
      </div>

      {/* Côté Droit : Actions Rapides */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {isGuest ? (
          <>
            <Link
              href="/register"
              style={{
                background: 'var(--df-accent-blue)',
                color: '#FFFFFF',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--df-radius-sm)',
                fontWeight: 700,
                fontSize: '0.74rem',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>Créer mon Espace Réel</span>
            </Link>

            <Link
              href="/login"
              style={{
                background: 'var(--df-bg-surface-2)',
                color: 'var(--df-text-main)',
                border: '1px solid var(--df-border-subtle)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--df-radius-sm)',
                fontWeight: 600,
                fontSize: '0.74rem',
                textDecoration: 'none',
              }}
            >
              Se Connecter
            </Link>
          </>
        ) : (
          <button
            onClick={() => toggleDemoMode(false)}
            type="button"
            style={{
              background: 'var(--df-bg-surface-2)',
              color: 'var(--df-accent-blue)',
              border: '1px solid var(--df-accent-blue)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--df-radius-sm)',
              fontWeight: 700,
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Basculer vers mon Parc Réel</span>
          </button>
        )}
      </div>
    </div>
  );
}

