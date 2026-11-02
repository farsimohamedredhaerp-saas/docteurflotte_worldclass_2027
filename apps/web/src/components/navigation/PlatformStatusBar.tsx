'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlatformHealthSummary, UserRole } from '@docteurflotte/contracts';
import { PlatformHealthClient } from '../../lib/api-health';

interface PlatformStatusBarProps {
  userRole?: UserRole | string | null;
}

export function PlatformStatusBar({ userRole }: PlatformStatusBarProps) {
  const [health, setHealth] = useState<PlatformHealthSummary | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await PlatformHealthClient.getHealthSummary();
      setHealth(data);
    } catch {
      // Ignorer silencieusement, fallback géré dans le client
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const isTraccarOnline = health?.telematics?.state === 'online';
  const isAiOnline = health?.ai?.state === 'online';
  const isSecurityOk = health?.security?.rlsEnforced ?? true;

  const isAdmin = userRole === UserRole.PLATFORM_ADMIN || userRole === UserRole.TENANT_ADMIN;

  return (
    <div
      role="region"
      aria-label="Observabilité et métrologie de la plateforme"
      style={{
        background: 'var(--df-bg-surface-2)',
        borderBottom: '1px solid var(--df-border-subtle)',
        fontSize: '0.72rem',
        color: 'var(--df-text-muted)',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          width: '100%',
          margin: '0 auto',
          padding: '0.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* INDICATEURS TÉLÉMATIQUES & INGESTION RLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isTraccarOnline ? 'var(--df-status-ok)' : 'var(--df-status-warning)',
                boxShadow: isTraccarOnline ? '0 0 6px var(--df-status-ok)' : 'none',
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            <span style={{ fontWeight: 600, color: 'var(--df-text-secondary)' }}>
              Traccar IoT : {isTraccarOnline ? 'En Ligne' : 'En Attente'}
            </span>
            <span className="df-mono hidden sm:inline" style={{ color: 'var(--df-text-faint)' }}>
              ({health?.telematics?.port ? `Port ${health.telematics.port}` : 'Port 5055'})
            </span>
          </div>

          <span style={{ color: 'var(--df-border-medium)' }} aria-hidden="true">•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="hidden md:inline">Sécurité RLS :</span>
            <strong
              className="df-mono"
              style={{
                color: isSecurityOk ? 'var(--df-status-ok)' : 'var(--df-status-danger)',
              }}
            >
              {isSecurityOk ? '100% Fail-Closed' : 'Vérification...'}
            </strong>
          </div>

          <span className="hidden md:inline" style={{ color: 'var(--df-border-medium)' }} aria-hidden="true">•</span>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Mode :</span>
            <strong className="df-mono" style={{ color: 'var(--df-accent-blue)', fontSize: '0.70rem' }}>
              {health?.telematics?.mode || 'OEM-First (0 / 1 / 2)'}
            </strong>
          </div>
        </div>

        {/* INDICATEURS IA SOUVERAINE & CONFORMITÉ ANPDP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isAdmin ? (
            <Link
              href="/admin/ai-observability"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: isAiOnline ? 'rgba(99, 102, 241, 0.12)' : 'var(--df-bg-surface-3)',
                color: isAiOnline ? 'var(--df-accent-blue)' : 'var(--df-text-muted)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
                border: isAiOnline ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--df-border-subtle)',
                fontSize: '0.70rem',
                transition: 'border-color var(--df-transition-fast), background var(--df-transition-fast)',
              }}
              title="Surveillance & Observabilité IA Souveraine Ollama Qwen 2.5"
              aria-label="Accéder à la console d'observabilité IA Ollama"
            >
              <span aria-hidden="true">⚡</span>
              <span>{isAiOnline ? 'IA Ollama : En Ligne' : 'Mode Déterministe'}</span>
            </Link>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--df-text-secondary)',
                fontWeight: 600,
                fontSize: '0.70rem',
              }}
            >
              <span aria-hidden="true">⚡</span>
              <span>{isAiOnline ? 'IA Ollama : En Ligne' : 'Physique Déterministe (0 DA)'}</span>
            </span>
          )}

          {health?.telematics?.latencyMs !== null && health?.telematics?.latencyMs !== undefined && (
            <>
              <span className="df-mono hidden sm:inline" style={{ color: 'var(--df-text-faint)' }}>
                Latence : {health.telematics.latencyMs}ms
              </span>
              <span className="hidden sm:inline" style={{ color: 'var(--df-border-medium)' }} aria-hidden="true">•</span>
            </>
          )}

          <span
            style={{
              color: 'var(--df-status-ok-text)',
              background: 'var(--df-status-ok-bg)',
              padding: '1px 6px',
              borderRadius: '3px',
              fontWeight: 600,
              border: '1px solid var(--df-status-ok-border)',
              fontSize: '0.70rem',
            }}
            title="Conformité et hébergement souverain sur le territoire national algérien (Loi 18-07 ANPDP)"
          >
            Hébergement Souverain • Loi 18-07 (ANPDP)
          </span>
        </div>
      </div>
    </div>
  );
}

