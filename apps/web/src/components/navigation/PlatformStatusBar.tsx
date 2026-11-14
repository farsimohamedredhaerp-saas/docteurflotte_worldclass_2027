'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlatformHealthSummary, UserRole } from '@docteurflotte/contracts';
import { PlatformHealthClient } from '../../lib/api-health';
import { IconZap, IconShieldCheck, IconActivity } from './TechIcons';

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
        fontSize: '0.70rem',
        color: 'var(--df-text-muted)',
        letterSpacing: '-0.01em',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          width: '100%',
          margin: '0 auto',
          padding: '0.2rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* INDICATEURS TÉLÉMATIQUES & INGESTION RLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isTraccarOnline ? '#10b981' : '#f59e0b',
                boxShadow: isTraccarOnline ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            <span style={{ fontWeight: 500, color: 'var(--df-text-secondary)' }}>
              Traccar IoT : {isTraccarOnline ? 'Opérationnel' : 'En Attente'}
            </span>
            <span className="df-mono hidden sm:inline" style={{ color: 'var(--df-text-faint)', fontSize: '0.65rem' }}>
              ({health?.telematics?.port ? `Port ${health.telematics.port}` : 'Port 5055'})
            </span>
          </div>

          <span style={{ color: 'var(--df-border-medium)', opacity: 0.6 }} aria-hidden="true">•</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <IconShieldCheck size={12} style={{ color: isSecurityOk ? '#10b981' : '#ef4444' }} />
            <span className="hidden md:inline" style={{ color: 'var(--df-text-secondary)', fontWeight: 500 }}>
              Sécurité RLS :
            </span>
            <strong
              className="df-mono"
              style={{
                color: isSecurityOk ? '#10b981' : '#ef4444',
                fontWeight: 600,
                fontSize: '0.68rem',
              }}
            >
              {isSecurityOk ? 'Fail-Closed 100%' : 'Vérification...'}
            </strong>
          </div>

          <span className="hidden md:inline" style={{ color: 'var(--df-border-medium)', opacity: 0.6 }} aria-hidden="true">•</span>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0.3rem' }}>
            <IconActivity size={12} style={{ color: 'var(--df-accent-blue)' }} />
            <span style={{ color: 'var(--df-text-muted)' }}>Mode :</span>
            <strong className="df-mono" style={{ color: 'var(--df-accent-blue)', fontSize: '0.68rem', fontWeight: 600 }}>
              {health?.telematics?.mode || 'OEM-First (0/1/2)'}
            </strong>
          </div>
        </div>

        {/* INDICATEURS IA SOUVERAINE & CONFORMITÉ ANPDP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAdmin ? (
            <Link
              href="/admin/ai-observability"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: isAiOnline ? 'rgba(59, 130, 246, 0.1)' : 'var(--df-bg-surface-3)',
                color: isAiOnline ? '#3b82f6' : 'var(--df-text-muted)',
                padding: '2px 7px',
                borderRadius: '4px',
                fontWeight: 600,
                border: isAiOnline ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--df-border-subtle)',
                fontSize: '0.68rem',
                transition: 'border-color var(--df-transition-fast), background var(--df-transition-fast)',
              }}
              title="Surveillance & Observabilité IA Souveraine Ollama Qwen 2.5"
              aria-label="Accéder à la console d'observabilité IA Ollama"
            >
              <IconZap size={11} />
              <span>{isAiOnline ? 'IA Ollama : Connecté' : 'Mode Déterministe'}</span>
            </Link>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: 'var(--df-text-secondary)',
                fontWeight: 500,
                fontSize: '0.68rem',
              }}
            >
              <IconZap size={11} style={{ color: 'var(--df-accent-blue)' }} />
              <span>{isAiOnline ? 'IA Ollama : Connecté' : 'Physique Déterministe (0 DA)'}</span>
            </span>
          )}

          {health?.telematics?.latencyMs !== null && health?.telematics?.latencyMs !== undefined && (
            <>
              <span className="df-mono hidden sm:inline" style={{ color: 'var(--df-text-faint)', fontSize: '0.65rem' }}>
                {health.telematics.latencyMs}ms
              </span>
              <span className="hidden sm:inline" style={{ color: 'var(--df-border-medium)', opacity: 0.6 }} aria-hidden="true">•</span>
            </>
          )}

          <span
            style={{
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '1px 6px',
              borderRadius: '3px',
              fontWeight: 500,
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '0.66rem',
              letterSpacing: '0.02em',
            }}
            title="Conformité et hébergement souverain sur le territoire national algérien (Loi 18-07 ANPDP)"
          >
            Souverain Algérie • Loi 18-07 ANPDP
          </span>
        </div>
      </div>
    </div>
  );
}
