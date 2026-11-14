'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMaintenance } from '../context/MaintenanceContext';
import {
  IconActivity,
  IconCpu,
  IconGauge,
  IconWrench,
  IconLayers,
} from '@/components/navigation/TechIcons';

export function MaintenanceNavHeader() {
  const pathname = usePathname();
  const { fleet, criticalAlertsCount, inventoryStats } = useMaintenance();

  const navItems = [
    {
      href: '/maintenance',
      exact: true,
      label: 'Hub & Matrice RUL',
      icon: <IconGauge size={14} />,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount} crit.` : undefined,
      badgeColor: '#EF4444',
    },
    {
      href: '/maintenance/diagnostics',
      label: 'Diagnostics & CAN J1939',
      icon: <IconCpu size={14} />,
    },
    {
      href: '/maintenance/organs',
      label: 'Organes & Plans OEM',
      icon: <IconLayers size={14} />,
    },
    {
      href: '/maintenance/calculations',
      label: 'Preuves & Arbitrage DZD',
      icon: <IconActivity size={14} />,
    },
    {
      href: '/maintenance/cooldown',
      label: 'Stocks & Magasins 4.0',
      icon: <IconWrench size={14} />,
      badge: inventoryStats.lowStockAlerts > 0 ? `${inventoryStats.lowStockAlerts} alertes` : undefined,
      badgeColor: '#F59E0B',
    },
  ];

  const isLinkActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '1.25rem 1.75rem',
        boxShadow: 'var(--df-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Title & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--df-accent-blue)',
                border: '1px solid var(--df-accent-blue-subtle)',
                padding: '2px 8px',
                borderRadius: 'var(--df-radius-sm)',
                background: 'var(--df-accent-blue-subtle)',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              MODULE 5.0 SOUVERAIN (OEM-FIRST)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--df-status-ok)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="df-pulse-live" /> Télémétrie CAN J1939 Active
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--df-text-main)',
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
            }}
          >
            Centre de Décision & Maintenance 5.0 (OEM-First)
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--df-text-secondary)',
              margin: '0.35rem 0 0 0',
              maxWidth: '850px',
            }}
          >
            Modélisation physique déterministe (Weibull & Arrhenius) • Décodage OpenDBC • RUL des organes critiques • Stocks magasins connectés
          </p>
        </div>

        {/* Quick KPI Strip */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '6px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Flotte Suivie
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8' }}>
              {fleet.length}
            </div>
          </div>
          <div
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '6px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Alertes RUL
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: criticalAlertsCount > 0 ? '#EF4444' : '#10B981' }}>
              {criticalAlertsCount}
            </div>
          </div>
          <div
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '6px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Stock Magasins
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>
              {inventoryStats.totalReferences} réf.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Sub-routes) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--df-border-subtle)',
          paddingBottom: '2px',
          overflowX: 'auto',
        }}
      >
        {navItems.map((item) => {
          const active = isLinkActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px 8px 0 0',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                color: active ? '#fff' : 'var(--df-text-muted)',
                background: active ? 'var(--df-bg-surface-2)' : 'transparent',
                borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: `${item.badgeColor}20`,
                    color: item.badgeColor,
                    border: `1px solid ${item.badgeColor}40`,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

