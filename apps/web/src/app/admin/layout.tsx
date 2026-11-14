'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthClient } from '../../lib/api-auth';
import { UserRole } from '@docteurflotte/contracts';
import { Navbar } from '../../components/navigation/Navbar';
import {
  IconBarChart3,
  IconLayers,
  IconCreditCard,
  IconCpu,
  IconZap,
  IconFuel,
  IconRadio,
  IconShieldCheck,
  IconFileText,
  IconAlertOctagon,
  IconChevronLeft,
} from '../../components/navigation/TechIcons';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const session = AuthClient.getSession();
    if (!session.token || !session.user) {
      setIsAuthorized(false);
      return;
    }

    setCurrentUser(session.user);
    if (session.user.role === UserRole.PLATFORM_ADMIN) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, []);

  if (isAuthorized === null) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--df-text-muted)',
          fontSize: '15px',
        }}
      >
        Vérification des habilitations SuperAdmin...
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div
        style={{
          maxWidth: '680px',
          margin: '80px auto',
          padding: '36px',
          borderRadius: '16px',
          background: 'var(--df-bg-surface-1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
        }}
      >
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', margin: '0 auto 16px auto' }}>
          <IconAlertOctagon size={28} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fca5a5', marginBottom: '12px' }}>
          Accès Restreint — Console SuperAdmin SaaS
        </h2>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Cette section de gouvernance globale est strictement réservée au rôle{' '}
          <strong>PLATFORM_ADMIN</strong>. Votre profil actuel (
          <code style={{ background: 'var(--df-bg-surface-2)', padding: '2px 6px', borderRadius: '4px' }}>
            {currentUser?.role || 'NON CONNECTÉ'}
          </code>
          ) ne dispose pas des privilèges nécessaires.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link
            href="/login"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'var(--df-accent-blue)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Se Reconnecter
          </Link>
          <Link
            href="/"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'var(--df-bg-surface-2)',
              color: 'var(--df-text-main)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid var(--df-border-subtle)',
            }}
          >
            Retour au Parc
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin', label: "Vue d'Ensemble", icon: <IconBarChart3 size={15} /> },
    { href: '/admin/tenants', label: 'Tenants & Organisations', icon: <IconLayers size={15} /> },
    { href: '/admin/subscriptions', label: 'Plans & Abonnements DZ', icon: <IconCreditCard size={15} /> },
    { href: '/admin/decision-engine', label: 'Moteur Décisionnel (6 Physiques)', icon: <IconCpu size={15} /> },
    { href: '/admin/ai-observability', label: 'Observabilité IA Ollama', icon: <IconZap size={15} /> },
    { href: '/admin/fiscal', label: 'Barèmes Fiscaux & Naftal', icon: <IconFuel size={15} /> },
    { href: '/admin/gateways', label: 'Passerelles IoT & Traccar', icon: <IconRadio size={15} /> },
    { href: '/admin/audit', label: 'Piste d’Audit Immuable', icon: <IconShieldCheck size={15} /> },
    { href: '/guide', label: 'Guide & Architecture Tech', icon: <IconFileText size={15} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)' }}>
      {/* Barre Horizontale Universelle avec Thème & Statut */}
      <Navbar />

      {/* SuperAdmin Top Banner Header */}
      <div
        style={{
          background: 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '16px 32px',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                color: '#fff',
              }}
            >
              <IconShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  DocteurFlotte Control Plane
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(99, 102, 241, 0.3)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                  }}
                >
                  SUPERADMIN v2.0
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Gouvernance Souveraine Multi-Tenant • Algorithmes Physiques • Réglementation Algérie
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
              Connecté en tant que <strong>{currentUser?.email}</strong>
            </span>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <IconChevronLeft size={14} />
              Retour à l’application client
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            maxWidth: '1440px',
            margin: '16px auto 0',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px 8px 0 0',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  borderBottom: isActive ? '2px solid #818cf8' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px' }}>
        {children}
      </main>
    </div>
  );
}
