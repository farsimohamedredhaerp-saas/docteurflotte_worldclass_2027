'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthClient, NavbarSession } from '../../lib/api-auth';
import { TenantIdentityBadge } from './TenantIdentityBadge';
import { NavFeaturesMenu } from './NavFeaturesMenu';
import { UserMenuDropdown } from './UserMenuDropdown';
import { DemoModeToggle } from './DemoModeToggle';
import { ThemeToggle } from '../ThemeToggle';
import { PlatformStatusBar } from './PlatformStatusBar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { CommandPaletteModal } from './CommandPaletteModal';
import { IconRefreshCw, IconNavigation, IconSearch } from './TechIcons';

interface NavbarProps {
  onResetDemo?: () => void;
}

export function Navbar({ onResetDemo }: NavbarProps) {
  const [session, setSession] = useState<NavbarSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const syncSession = () => {
      try {
        setSession(AuthClient.getSession());
      } catch (err) {
        console.error('[Navbar] Échec de synchronisation de session:', err);
        setSession(null);
      } finally {
        setSessionReady(true);
      }
    };

    syncSession();

    const handleStorage = () => syncSession();
    const handleSessionChanged = () => syncSession();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:session-changed', handleSessionChanged);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:session-changed', handleSessionChanged);
    };
  }, []);

  const handleLogout = () => {
    AuthClient.clearSession();
    setSession(null);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--df-bg-glass-elevated)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--df-border-subtle)',
        marginBottom: '1.75rem',
        boxShadow: 'var(--df-shadow-sm)',
        transition: 'background var(--df-transition-smooth), border-color var(--df-transition-smooth)',
      }}
    >
      {/* 1. BARRE SUPÉRIEURE D'OBSERVABILITÉ RÉELLE DE LA PLATEFORME */}
      <PlatformStatusBar userRole={session?.user?.role} />

      {/* 2. BARRE PRINCIPALE DE NAVIGATION (PLEINE LARGEUR FLUIDE) */}
      <div
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '0.45rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'nowrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* SECTION GAUCHE : HAMBURGER MOBILE, LOGO & IDENTITÉ TENANT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* BOUTON MENU MOBILE (< 1024px) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Ouvrir le menu de navigation mobile"
            aria-expanded={isMobileDrawerOpen}
            className="inline-flex lg:hidden"
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-main)',
              padding: '0.3rem 0.45rem',
              borderRadius: 'var(--df-radius-sm)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link
            href="/"
            aria-label="DocteurFlotte - Retour à l'accueil"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              textDecoration: 'none',
              borderRadius: 'var(--df-radius-sm)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              DF
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--df-text-main)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  DocteurFlotte
                </span>
                <span
                  className="hidden sm:inline-block"
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    padding: '1px 4px',
                    borderRadius: '3px',
                    background: 'var(--df-status-ok-bg)',
                    color: 'var(--df-status-ok-text)',
                    border: '1px solid var(--df-status-ok-border)',
                    letterSpacing: '0.04em',
                  }}
                >
                  DZ
                </span>
              </div>
              <span className="hidden xl:block" style={{ fontSize: '0.64rem', color: 'var(--df-text-muted)' }}>
                Télématique & Décisionnel
              </span>
            </div>
          </Link>

          {/* SÉPARATEUR VERTICAL */}
          <div
            className="hidden sm:block"
            style={{
              width: '1px',
              height: '20px',
              background: 'var(--df-border-subtle)',
            }}
          />

          {/* BADGES TENANT DYNAMIQUE (SI AUTHENTIFIÉ OU DÉMO) */}
          {sessionReady && <TenantIdentityBadge tenant={session?.tenant ?? null} />}
        </div>

        {/* SECTION CENTRALE : MENU DE FONCTIONNALITÉS PROFESSIONNEL (DESKTOP) */}
        <div
          className="hidden lg:flex"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <NavFeaturesMenu />
        </div>

        {/* SECTION DROITE : RACCOURCIS CRITIQUES, THÈME & PROFIL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {/* BOUTON COMMAND PALETTE ⌘K */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            aria-label="Ouvrir la palette de commandes (⌘K / Ctrl+K)"
            title="Palette de commandes (⌘K / Ctrl+K)"
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-secondary)',
              padding: '0.24rem 0.65rem',
              borderRadius: 'var(--df-radius-sm)',
              fontSize: '0.72rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              transition: 'all var(--df-transition-fast)',
            }}
          >
            <IconSearch size={12} strokeWidth={2} style={{ color: 'var(--df-text-muted)' }} />
            <span className="hidden sm:inline" style={{ color: 'var(--df-text-muted)' }}>Rechercher...</span>
            <kbd
              style={{
                fontFamily: 'var(--df-font-mono)',
                fontSize: '0.62rem',
                padding: '1px 4px',
                borderRadius: '3px',
                background: 'var(--df-bg-surface-3)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-muted)',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* RACCOURCI LIVE FLEET COCKPIT & TÉLÉMÉTRIE GIS */}
          <Link
            href="/live-cockpit"
            aria-label="Accéder au Cockpit Télématique Live (GIS, CAN J1939)"
            title="Cockpit Télématique Live (GIS, CAN J1939)"
            style={{
              textDecoration: 'none',
              background: 'var(--df-status-ok-bg)',
              border: '1px solid var(--df-status-ok-border)',
              color: 'var(--df-status-ok-text)',
              padding: '0.24rem 0.55rem',
              borderRadius: 'var(--df-radius-sm)',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              transition: 'all var(--df-transition-fast)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--df-status-ok)',
              }}
              aria-hidden="true"
            />
            <IconNavigation size={12} strokeWidth={2} style={{ color: 'var(--df-status-ok-text)' }} aria-hidden="true" />
            <span className="hidden 2xl:inline">Cockpit Live</span>
          </Link>

          {onResetDemo && (
            <button
              onClick={onResetDemo}
              type="button"
              aria-label="Réinitialiser les scénarios de démonstration"
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
                transition: 'border-color var(--df-transition-fast), color var(--df-transition-fast)',
              }}
            >
              <IconRefreshCw size={12} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}

          {/* COMMUTATEUR MODE DÉMO VS MODE RÉEL */}
          <DemoModeToggle />

          {/* COMMUTATEUR THÈME SOMBRE / CLAIR */}
          <ThemeToggle />

          {/* MENU PROFIL / AUTHENTIFICATION */}
          {sessionReady && (
            <UserMenuDropdown
              user={session?.user ?? null}
              tenant={session?.tenant ?? null}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>

      {/* 3. TIROIR DE NAVIGATION MOBILE ET TABLETTE (< 1024px) */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        session={session}
      />

      {/* 4. COMMAND PALETTE UNIVERSELLE (⌘K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </header>
  );
}
