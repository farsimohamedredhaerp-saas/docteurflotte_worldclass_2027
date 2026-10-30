'use client';

import React from 'react';
import { ActivityPack, DataOrigin } from '@docteurflotte/contracts';

interface TenantIdentityBadgeProps {
  tenant: {
    name: string;
    activityPack?: ActivityPack | string;
    dataOrigin?: DataOrigin | string;
    currency?: string;
  } | null;
}

export function TenantIdentityBadge({ tenant }: TenantIdentityBadgeProps) {
  if (!tenant) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span
          style={{
            fontSize: '0.70rem',
            fontWeight: 700,
            padding: '0.18rem 0.5rem',
            borderRadius: 'var(--df-radius-full)',
            background: 'var(--df-badge-demo-bg)',
            color: 'var(--df-badge-demo-color)',
            border: '1px solid var(--df-badge-demo-border)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          ● DÉMO PUBLIQUE
        </span>
      </div>
    );
  }

  const isDemo = tenant.dataOrigin === DataOrigin.DEMO || tenant.dataOrigin === 'DEMO';

  const getPackLabel = (pack?: string) => {
    switch (pack) {
      case ActivityPack.TRANSPORT:
      case 'TRANSPORT':
        return { icon: '🚚', label: 'Transport / PL' };
      case ActivityPack.CONSTRUCTION:
      case 'CONSTRUCTION':
        return { icon: '🚜', label: 'BTP & Engins' };
      case ActivityPack.LIGHT_VEHICLES:
      case 'LIGHT_VEHICLES':
        return { icon: '🚗', label: 'Flotte VL' };
      default:
        return { icon: '🏭', label: 'Multi-Actifs' };
    }
  };

  const packInfo = getPackLabel(tenant.activityPack);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        flexWrap: 'nowrap',
      }}
    >
      {/* Raison sociale du Tenant */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.18rem 0.45rem',
          background: 'var(--df-bg-surface-2)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-sm)',
        }}
        title={`Tenant actif : ${tenant.name}`}
      >
        <span style={{ fontSize: '0.75rem' }}>🏢</span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--df-text-main)',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tenant.name}
        </span>
      </div>

      {/* Badge du Pack d'Activité (affiché sur écrans larges) */}
      <div
        className="hidden 2xl:inline-flex"
        style={{
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.18rem 0.45rem',
          background: 'var(--df-bg-surface-3)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-full)',
          fontSize: '0.70rem',
          fontWeight: 600,
          color: 'var(--df-text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{packInfo.icon}</span>
        <span>{packInfo.label}</span>
      </div>

      {/* Badge Origine des Données (Conformité AGENTS.md) */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.18rem 0.45rem',
          borderRadius: 'var(--df-radius-full)',
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          background: isDemo ? 'var(--df-badge-demo-bg)' : 'var(--df-status-ok-bg)',
          color: isDemo ? 'var(--df-badge-demo-color)' : 'var(--df-status-ok)',
          border: `1px solid ${isDemo ? 'var(--df-badge-demo-border)' : 'var(--df-status-ok-border)'}`,
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'currentColor',
            display: 'inline-block',
          }}
          className={isDemo ? 'df-pulse' : ''}
        />
        <span>{isDemo ? 'DÉMO' : 'RÉEL'}</span>
      </div>

      {/* Devise */}
      {tenant.currency && (
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0.18rem 0.35rem',
            borderRadius: 'var(--df-radius-xs)',
            background: 'var(--df-bg-surface-2)',
            color: 'var(--df-text-muted)',
            border: '1px solid var(--df-border-subtle)',
            whiteSpace: 'nowrap',
          }}
        >
          {tenant.currency}
        </span>
      )}
    </div>
  );
}
