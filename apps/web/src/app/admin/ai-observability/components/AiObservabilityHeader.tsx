'use client';

import React from 'react';
import {
  IconZap,
  IconRefreshCw,
  IconPause,
  IconDownload,
} from '../../../../components/navigation/TechIcons';
import { AiObservabilityHeaderProps } from '../types';

export function AiObservabilityHeader({
  status,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  onExportAuditLog,
}: AiObservabilityHeaderProps) {
  const isAvailable = Boolean(status?.available);
  const isInferring = Boolean(status?.telemetry?.isInferring);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#eab308',
            }}
          >
            <IconZap size={20} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Observabilité IA Souveraine & Audit Ollama (Qwen 2.5)
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isAvailable ? '#10b981' : '#ef4444',
              border: `1px solid ${isAvailable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isAvailable ? '#10b981' : '#ef4444',
                boxShadow: isAvailable ? '0 0 8px #10b981' : 'none',
              }}
            />
            {isAvailable
              ? isInferring
                ? 'INFÉRENCE EN COURS'
                : 'DAEMON ACTIF'
              : 'DÉCONNECTÉ (MODE DÉGRADÉ)'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--df-text-secondary)', maxWidth: '850px' }}>
          Surveillance en temps réel du moteur LLM local Qwen 2.5 embarqué sur l’hôte algérien. Contrôle strict du
          coupe-feu <strong style={{ color: '#10b981' }}>Loi 18-07 (ANPDP)</strong>, mesure du débit (tokens/sec),
          temps de latence et audit exhaustif avant/après anonymisation.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onToggleAutoRefresh}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: autoRefresh ? '#ECFDF5' : '#F1F5F9',
            color: autoRefresh ? '#065F46' : '#1E293B',
            border: `1px solid ${autoRefresh ? '#A7F3D0' : '#CBD5E1'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {autoRefresh ? (
            <>
              <IconRefreshCw size={13} className="animate-spin" />
              <span>Auto-Refresh (4s)</span>
            </>
          ) : (
            <>
              <IconPause size={13} />
              <span>Pausé</span>
            </>
          )}
        </button>

        <button
          onClick={onRefresh}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#F1F5F9',
            color: '#0F172A',
            border: '1px solid #CBD5E1',
          }}
        >
          Actualiser
        </button>

        <button
          onClick={onExportAuditLog}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconDownload size={14} />
          <span>Export Journal ANPDP</span>
        </button>
      </div>
    </div>
  );
}
