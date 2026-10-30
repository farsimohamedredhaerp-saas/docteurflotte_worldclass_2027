'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthClient } from '../../lib/api-auth';

interface UserMenuDropdownProps {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  tenant: {
    name: string;
  } | null;
  onLogout?: () => void;
}

export function UserMenuDropdown({ user, tenant, onLogout }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    AuthClient.clearSession();
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      router.push('/login');
      router.refresh();
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.26rem 0.50rem',
            borderRadius: 'var(--df-radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--df-text-main)',
            background: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-subtle)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all var(--df-transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--df-border-medium)';
            e.currentTarget.style.background = 'var(--df-bg-surface-3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
            e.currentTarget.style.background = 'var(--df-bg-surface-2)';
          }}
        >
          Connexion
        </Link>
        <Link
          href="/register"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.26rem 0.55rem',
            borderRadius: 'var(--df-radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--df-text-on-accent)',
            background: 'var(--df-gradient-primary)',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all var(--df-transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--df-shadow-glow-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.3)';
          }}
        >
          S'inscrire
        </Link>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--df-radius-full)',
          background: isOpen ? 'var(--df-bg-surface-3)' : 'var(--df-bg-surface-2)',
          border: '1px solid var(--df-border-subtle)',
          color: 'var(--df-text-main)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all var(--df-transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--df-border-focus)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--df-gradient-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
          }}
        >
          {initials}
        </div>
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.firstName || fullName}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>
            {user.role || 'Admin'}
          </span>
        </div>
        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>▼</span>
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Menu utilisateur"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            zIndex: 100,
            width: '260px',
            background: 'var(--df-bg-glass-elevated)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--df-border-medium)',
            borderRadius: 'var(--df-radius-lg)',
            boxShadow: 'var(--df-shadow-lg)',
            padding: '1rem',
            animation: 'fadeIn 180ms ease-out',
          }}
        >
          {/* Header utilisateur */}
          <div
            style={{
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--df-border-subtle)',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--df-text-main)' }}>
              {fullName}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--df-text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </div>
            {tenant && (
              <div
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.72rem',
                  color: 'var(--df-accent-cyan)',
                  fontWeight: 600,
                }}
              >
                Organisation : {tenant.name}
              </div>
            )}
          </div>

          {/* Liens rapides */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {user.role === 'PLATFORM_ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.65rem',
                  borderRadius: 'var(--df-radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#c7d2fe',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  textDecoration: 'none',
                  marginBottom: '0.2rem',
                }}
              >
                <span>👑</span>
                <span>Console SuperAdmin SaaS</span>
              </Link>
            )}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--df-radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--df-text-main)',
                textDecoration: 'none',
                background: 'transparent',
                transition: 'background var(--df-transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--df-bg-surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>⚙️</span>
              <span>Paramètres & Barèmes</span>
            </Link>
            <Link
              href="/setup"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--df-radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--df-text-main)',
                textDecoration: 'none',
                background: 'transparent',
                transition: 'background var(--df-transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--df-bg-surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>🚀</span>
              <span>Assistant d&apos;Onboarding</span>
            </Link>
          </div>

          {/* Déconnexion */}
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--df-border-subtle)' }}>
            <button
              onClick={handleLogout}
              type="button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: 'var(--df-radius-sm)',
                background: 'var(--df-status-danger-bg)',
                color: 'var(--df-status-danger)',
                border: '1px solid var(--df-status-danger-border)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all var(--df-transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--df-status-danger)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--df-status-danger-bg)';
                e.currentTarget.style.color = 'var(--df-status-danger)';
              }}
            >
              <span>🚪</span>
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
