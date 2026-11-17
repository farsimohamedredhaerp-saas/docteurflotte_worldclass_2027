'use client';

import React from 'react';
import { ActivityPack, DataOrigin } from '@docteurflotte/contracts';
import {
  IconTruck,
  IconHardHat,
  IconLayers,
  IconDatabase,
  IconShieldCheck,
} from './TechIcons';

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
            fontSize: '0.68rem',
            fontWeight: 600,
            padding: '0.15rem 0.55rem',
            borderRadius: 'var(--df-radius-full)',
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
          DÉMO PUBLIQUE
        </span>
      </div>
    );
  }

  const isDemo = tenant.dataOrigin === DataOrigin.DEMO || tenant.dataOrigin === 'DEMO';

  const getPackIcon = (pack?: string) => {
    switch (pack) {
      case ActivityPack.TRANSPORT:
      case 'TRANSPORT':
        return <IconTruck size={13} style={{ color: 'var(--df-accent-blue)' }} />;
      case ActivityPack.CONSTRUCTION:
      case 'CONSTRUCTION':
        return <IconHardHat size={13} style={{ color: '#f59e0b' }} />;
      case ActivityPack.LIGHT_VEHICLES:
      case 'LIGHT_VEHICLES':
        return <IconLayers size={13} style={{ color: '#10b981' }} />;
      default:
        return <IconDatabase size={13} style={{ color: '#8b5cf6' }} />;
    }
  };

  const getPackLabel = (pack?: string) => {
    switch (pack) {
      case ActivityPack.TRANSPORT:
      case 'TRANSPORT':
        return 'Transport / PL';
      case ActivityPack.CONSTRUCTION:
      case 'CONSTRUCTION':
        return 'BTP & Engins';
      case ActivityPack.LIGHT_VEHICLES:
      case 'LIGHT_VEHICLES':
        return 'Flotte VL';
      default:
        return 'Multi-Actifs';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexWrap: 'nowrap',
      }}
    >
      {/* Raison sociale du Tenant */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.55rem',
          background: 'var(--df-bg-surface-2)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-sm)',
        }}
        title={`Tenant actif : ${tenant.name}`}
      >
        <IconShieldCheck size={13} style={{ color: 'var(--df-accent-blue)' }} />
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--df-text-main)',
            maxWidth: '110px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
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
          padding: '0.18rem 0.5rem',
          background: 'var(--df-bg-surface-2)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-sm)',
          fontSize: '0.70rem',
          color: 'var(--df-text-secondary)',
          fontWeight: 500,
        }}
        title={`Pack Métier Algérie : ${getPackLabel(tenant.activityPack)}`}
      >
        {getPackIcon(tenant.activityPack)}
        <span>{getPackLabel(tenant.activityPack)}</span>
      </div>

      {/* Étiquette d'Environnement (DÉMO ou PRODUCTION SOUVERAINE) */}
      <span
        className="hidden xl:inline-flex"
        style={{
          fontSize: '0.66rem',
          fontWeight: 600,
          padding: '0.12rem 0.45rem',
          borderRadius: 'var(--df-radius-full)',
          background: isDemo ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: isDemo ? '#f59e0b' : '#10b981',
          border: isDemo ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: isDemo ? '#f59e0b' : '#10b981',
          }}
          className={isDemo ? 'df-pulse' : ''}
        />
        {isDemo ? 'DÉMO' : 'PRODUCTION'}
      </span>

      {/* Devise */}
      {tenant.currency && (
        <span
          className="df-mono"
          style={{
            fontSize: '0.66rem',
            fontWeight: 600,
            padding: '0.12rem 0.35rem',
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
