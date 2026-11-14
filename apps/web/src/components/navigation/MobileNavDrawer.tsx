'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserRole } from '@docteurflotte/contracts';
import { NavbarSession } from '../../lib/api-auth';
import {
  IconTruck,
  IconWrench,
  IconActivity,
  IconBarChart3,
  IconSlidersHorizontal,
  IconShieldCheck,
  IconChevronDown,
  IconNavigation,
  IconX,
} from './TechIcons';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: NavbarSession | null;
}

interface MobileCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiresAdmin?: boolean;
  items: { title: string; href: string; badge?: string }[];
}

const MOBILE_CATEGORIES: MobileCategory[] = [
  {
    id: 'assets',
    label: 'Parc & Actifs',
    icon: <IconTruck size={16} strokeWidth={1.75} />,
    items: [
      { title: 'Inventaire des Actifs', href: '/assets', badge: 'ACTIF' },
      { title: 'Compteurs & Métrologie', href: '/assets', badge: 'MÉTROLOGIE' },
      { title: 'Jumeau Numérique & RUL', href: '/digital-twin', badge: 'PHYSIQUE IA' },
      { title: 'Conducteurs & Affectations', href: '/drivers', badge: 'RH' },
      { title: 'Dispatch & Ordres de Mission', href: '/dispatch', badge: 'OFFICIEL DZ' },
      { title: 'Référentiel OEM RMI', href: '/oem-scraper', badge: 'OEM RMI' },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance 5.0',
    icon: <IconWrench size={16} strokeWidth={1.75} />,
    items: [
      { title: 'Cockpit Maintenance 5.0', href: '/preventive', badge: 'MAINTENANCE 5.0' },
      { title: 'Ask DocteurFlotte (Copilote)', href: '/copilot', badge: 'COPILOT IA' },
      { title: 'DVIR Inspection Numérique', href: '/dvir', badge: 'OFFLINE-FIRST' },
      { title: 'Ordres de Travail (OT)', href: '/work-orders', badge: 'ACTIF' },
      { title: 'Conformité ENACTA', href: '/compliance', badge: 'ENACTA DZ' },
      { title: 'Tableau Décisionnel (ADS)', href: '/decisions', badge: 'ARBITRAGE' },
    ],
  },
  {
    id: 'telematics',
    label: 'Télématique & IoT',
    icon: <IconActivity size={16} strokeWidth={1.75} />,
    items: [
      { title: 'Live Cockpit GIS', href: '/live-cockpit', badge: 'COCKPIT GIS' },
      { title: 'Tactical HUD Châssis', href: '/live-cockpit/hud', badge: 'TACTICAL HUD' },
      { title: 'Console Traccar Live', href: '/telematics', badge: 'TRACCAR LIVE' },
      { title: 'Scanner Carburant Naftal', href: '/fuel-scanner', badge: 'ANTI-FRAUDE' },
      { title: 'Éco-Conduite & Gaspillage', href: '/eco-driving', badge: 'SAMSARA ECO' },
      { title: 'Chaîne du Froid & Reefers', href: '/cold-chain', badge: 'REEFER IOT' },
      { title: 'Matériels & Protocoles', href: '/telematics/hardware', badge: 'CATALOGUE' },
    ],
  },
  {
    id: 'economics',
    label: 'Gestion & TCO',
    icon: <IconBarChart3 size={16} strokeWidth={1.75} />,
    items: [
      { title: 'TCO & Coût au km / h', href: '/tco', badge: 'ANALYTIQUE' },
      { title: 'Écarts Budgétaires', href: '/decisions', badge: 'ACTIF' },
      { title: 'Coût du Risque d’Inaction', href: '/decisions', badge: 'ARBITRAGE ADS' },
    ],
  },
  {
    id: 'admin',
    label: 'Paramètres',
    icon: <IconSlidersHorizontal size={16} strokeWidth={1.75} />,
    items: [
      { title: 'Configuration Tenant', href: '/settings', badge: 'ZÉRO HARDCODE' },
      { title: 'Données & Purge Démo', href: '/settings', badge: 'SOUVERAINETÉ' },
      { title: 'Assistant d’Onboarding', href: '/setup' },
    ],
  },
  {
    id: 'control-plane',
    label: 'Administration SaaS',
    icon: <IconShieldCheck size={16} strokeWidth={1.75} />,
    requiresAdmin: true,
    items: [
      { title: 'Console SuperAdmin', href: '/admin', badge: 'SUPERADMIN' },
      { title: 'Surveillance IA Ollama', href: '/admin/ai-observability', badge: 'QWEN 2.5' },
      { title: 'Organisations & Tenants', href: '/admin/tenants' },
      { title: 'Moteur Décisionnel', href: '/admin/decision-engine', badge: 'v2.0' },
      { title: 'Barèmes Fiscaux & Naftal', href: '/admin/fiscal' },
      { title: 'Passerelles Télématiques', href: '/admin/gateways' },
      { title: 'Piste d’Audit Immuable', href: '/admin/audit' },
      { title: 'Guide d’Architecture', href: '/guide', badge: 'GUIDE v2.0' },
    ],
  },
];

export function MobileNavDrawer({ isOpen, onClose, session }: MobileNavDrawerProps) {
  const [expandedId, setExpandedId] = useState<string | null>('assets');

  const isAdmin =
    session?.user?.role === UserRole.PLATFORM_ADMIN || session?.user?.role === UserRole.TENANT_ADMIN;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation principale mobile"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        display: 'flex',
      }}
    >
      {/* FOND GRISÉ / BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
        }}
        aria-hidden="true"
      />

      {/* PANNEAU LATÉRAL MOBILE */}
      <div
        style={{
          position: 'relative',
          width: 'min(340px, 85vw)',
          height: '100%',
          background: 'var(--df-bg-surface-1)',
          borderRight: '1px solid var(--df-border-focus)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2001,
        }}
      >
        {/* EN-TÊTE DU TIROIR */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--df-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                background: 'var(--df-gradient-primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--df-radius-md)',
              }}
            >
              DF
            </span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--df-text-main)' }}>
              DocteurFlotte DZ
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer le menu de navigation"
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--df-text-muted)',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* ACCÈS RAPIDE COCKPIT */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--df-border-subtle)' }}>
          <Link
            href="/live-cockpit"
            onClick={onClose}
            style={{
              textDecoration: 'none',
              background: 'var(--df-status-ok-bg)',
              border: '1px solid var(--df-status-ok)',
              color: 'var(--df-status-ok-text)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--df-radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <IconNavigation size={14} strokeWidth={2} style={{ color: 'var(--df-status-ok)' }} />
            <span>Ouvrir le Cockpit Live GIS</span>
          </Link>
        </div>

        {/* ACCORDION DE CATÉGORIES */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
          {MOBILE_CATEGORIES.map((cat) => {
            if (cat.requiresAdmin && !isAdmin) return null;
            const isExpanded = expandedId === cat.id;

            return (
              <div key={cat.id} style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                  aria-expanded={isExpanded}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.65rem',
                    background: isExpanded ? 'var(--df-bg-surface-2)' : 'transparent',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--df-accent-blue)' }}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  <span
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform var(--df-transition-fast)',
                    }}
                  >
                    <IconChevronDown size={14} />
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      padding: '0.4rem 0 0.4rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    {cat.items.map((item, idx) => (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={onClose}
                        style={{
                          textDecoration: 'none',
                          padding: '0.4rem 0.5rem',
                          borderRadius: 'var(--df-radius-xs)',
                          fontSize: '0.80rem',
                          color: 'var(--df-text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--df-bg-surface-2)',
                        }}
                      >
                        <span>{item.title}</span>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 'var(--df-radius-full)',
                              background: 'var(--df-accent-blue-subtle)',
                              color: 'var(--df-accent-blue)',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PIED DU TIROIR */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--df-border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--df-text-muted)',
            textAlign: 'center',
          }}
        >
          DocteurFlotte v3.1 • Souveraineté ANPDP (Loi 18-07)
        </div>
      </div>
    </div>
  );
}

