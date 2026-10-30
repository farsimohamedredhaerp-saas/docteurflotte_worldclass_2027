'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthClient } from '../../lib/api-auth';
import { TenantIdentityBadge } from './TenantIdentityBadge';
import { NavFeaturesMenu } from './NavFeaturesMenu';
import { UserMenuDropdown } from './UserMenuDropdown';
import { DemoModeToggle } from './DemoModeToggle';
import { ThemeToggle } from '../ThemeToggle';
import {
  IconCpu,
  IconLayers,
  IconWrench,
  IconSearch,
  IconActivity,
  IconShieldCheck,
  IconRefreshCw,
  IconNavigation,
} from './TechIcons';

interface NavbarProps {
  onResetDemo?: () => void;
}

export function Navbar({ onResetDemo }: NavbarProps) {
  const [session, setSession] = useState<{
    token: string | null;
    user: any | null;
    tenant: any | null;
  }>({ token: null, user: null, tenant: null });
  const [mounted, setMounted] = useState(false);

  const loadSession = () => {
    const s = AuthClient.getSession();
    setSession(s);
  };

  useEffect(() => {
    loadSession();
    setMounted(true);

    const handleStorage = () => loadSession();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    AuthClient.clearSession();
    setSession({ token: null, user: null, tenant: null });
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        background: 'var(--df-bg-glass-elevated)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--df-border-subtle)',
        marginBottom: '1.75rem',
        boxShadow: 'var(--df-shadow-sm)',
        transition: 'background var(--df-transition-smooth), border-color var(--df-transition-smooth)',
      }}
    >
      {/* BANDE SUPÉRIEURE DE TÉLÉMÉTRIE LIVE (SAMSARA FLEET PULSE) */}
      <div
        style={{
          background: 'var(--df-bg-surface-2)',
          borderBottom: '1px solid var(--df-border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--df-text-muted)',
        }}
      >
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            padding: '0.25rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="df-pulse-live" />
              <span style={{ fontWeight: 600, color: 'var(--df-text-secondary)' }}>
                Traccar IoT Gateway : En Ligne
              </span>
              <span className="df-mono hidden sm:inline" style={{ color: 'var(--df-text-faint)' }}>(Port 5055 / 5093)</span>
            </div>
            <span style={{ color: 'var(--df-border-medium)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="hidden md:inline">Flux Télématique :</span>
              <strong className="df-mono" style={{ color: 'var(--df-status-ok)' }}>100% Synchro RLS</strong>
            </div>
            <span className="hidden md:inline" style={{ color: 'var(--df-border-medium)' }}>•</span>
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: 'var(--df-text-muted)' }}>Mode :</span>
              <strong className="df-mono" style={{ color: 'var(--df-accent-blue)', fontSize: '0.70rem' }}>OEM-First (0 / 1 / 2)</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="df-mono hidden sm:inline" style={{ color: 'var(--df-text-faint)' }}>
              Latence : &lt; 24ms
            </span>
            <span className="hidden sm:inline" style={{ color: 'var(--df-border-medium)' }}>•</span>
            <span style={{ color: 'var(--df-status-ok-text)', background: 'var(--df-status-ok-bg)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, border: '1px solid var(--df-status-ok-border)', fontSize: '0.70rem' }}>
              Hébergement Souverain • Loi 18-07 (ANPDP)
            </span>
          </div>
        </div>
      </div>

      {/* BARRE PRINCIPALE DE NAVIGATION */}
      <div
        style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          flexWrap: 'nowrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* SECTION GAUCHE : LOGO & IDENTITÉ TENANT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              textDecoration: 'none',
              outline: 'none',
            }}
          >
            <div
              style={{
                background: 'var(--df-gradient-primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                padding: '0.28rem 0.6rem',
                borderRadius: 'var(--df-radius-md)',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                letterSpacing: '-0.5px',
              }}
            >
              DF
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--df-text-main)',
                    letterSpacing: '-0.02em',
                    display: 'block',
                    lineHeight: 1.1,
                  }}
                >
                  DocteurFlotte
                </span>
                <span
                  className="hidden sm:inline-block"
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 'var(--df-radius-xs)',
                    background: 'var(--df-status-ok-bg)',
                    color: 'var(--df-status-ok-text)',
                    border: '1px solid var(--df-status-ok-border)',
                    letterSpacing: '0.04em',
                  }}
                >
                  DZ
                </span>
              </div>
              <span className="hidden lg:block" style={{ fontSize: '0.65rem', color: 'var(--df-text-muted)' }}>
                Contrôle & Décisionnel
              </span>
            </div>
          </Link>

          {/* SÉPARATEUR VERTICAL */}
          <div
            style={{
              width: '1px',
              height: '20px',
              background: 'var(--df-border-subtle)',
            }}
          />

          {/* BADGES TENANT DYNAMIQUE (SI AUTHENTIFIÉ) */}
          {mounted && <TenantIdentityBadge tenant={session.tenant} />}
        </div>

        {/* SECTION CENTRALE : MENU DE FONCTIONNALITÉS PROFESSIONNEL */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <NavFeaturesMenu />
        </div>

        {/* SECTION DROITE : RACCOURCIS CRITIQUES, THÈME & PROFIL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {/* RACCOURCI LIVE FLEET COCKPIT & TÉLÉMÉTRIE GIS */}
          <Link
            href="/live-cockpit"
            style={{
              textDecoration: 'none',
              background: 'var(--df-status-ok-bg)',
              border: '1px solid var(--df-status-ok)',
              color: 'var(--df-status-ok-text)',
              padding: '0.26rem 0.45rem',
              borderRadius: 'var(--df-radius-sm)',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--df-shadow-sm)',
              transition: 'all var(--df-transition-fast)',
            }}
            title="Cockpit Télématique Live (GIS, CAN J1939)"
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--df-status-ok)',
                boxShadow: '0 0 5px var(--df-status-ok)',
              }}
            />
            <IconNavigation size={12} strokeWidth={2} style={{ color: 'var(--df-status-ok)' }} />
          </Link>

          {onResetDemo && (
            <button
              onClick={onResetDemo}
              type="button"
              title="Réinitialiser les scénarios de démonstration"
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-muted)',
                padding: '0.26rem 0.38rem',
                borderRadius: 'var(--df-radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                whiteSpace: 'nowrap',
                transition: 'all var(--df-transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-medium)';
                e.currentTarget.style.color = 'var(--df-text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
                e.currentTarget.style.color = 'var(--df-text-muted)';
              }}
            >
              <IconRefreshCw size={12} strokeWidth={1.75} />
            </button>
          )}

          {/* COMMUTATEUR MODE DÉMO VS MODE RÉEL */}
          <DemoModeToggle />

          {/* COMMUTATEUR THÈME SOMBRE / CLAIR */}
          <ThemeToggle />

          {/* MENU PROFIL / AUTHENTIFICATION */}
          {mounted && (
            <UserMenuDropdown
              user={session.user}
              tenant={session.tenant}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
}
