'use client';

import React from 'react';
import {
  IconCreditCard,
  IconRefreshCw,
  IconPlus,
  IconAlertTriangle,
  IconCheck,
} from '@/components/navigation/TechIcons';

interface SubscriptionsHeaderProps {
  loading: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  onRefresh: () => void;
  onOpenCreatePlan: () => void;
}

export function SubscriptionsHeader({
  loading,
  errorMsg,
  successMsg,
  onRefresh,
  onOpenCreatePlan,
}: SubscriptionsHeaderProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <IconCreditCard size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--df-text-main)' }}>
              Plans &amp; Abonnements B2B Algérie
            </h1>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              CONTROL PLANE SUPERADMIN
            </span>
          </div>
          <p style={{ color: 'var(--df-text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Gestion commerciale flexible : Tarifs en Dinars (DZD), dérogations par tenant, formule Flotte Dynamique &amp; facturation DGI.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--df-border-subtle)',
              background: 'var(--df-bg-surface-2)',
              color: 'var(--df-text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={onOpenCreatePlan}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconPlus size={14} />
            Créer un Plan d&apos;Abonnement
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconAlertTriangle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#86efac',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconCheck size={15} />
          <span>{successMsg}</span>
        </div>
      )}
    </>
  );
}
