'use client';

import React from 'react';
import { IconCheck } from '../../../../components/navigation/TechIcons';
import { AiObservabilityKpisProps } from '../types';

export function AiObservabilityKpis({
  status,
  stats,
}: AiObservabilityKpisProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}
    >
      {/* Carte 1 : Modèle & Moteur */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #6366f1',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
          Modèle Inférence Local
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace' }}>
          {status?.model || 'docteurflotte:latest'}
        </div>
        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconCheck size={12} />
          <span>100% Souverain On-Premise</span>
        </div>
      </div>

      {/* Carte 2 : Débit tokens/seconde */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #10b981',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
          Débit Génération CPU
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', color: '#10b981' }}>
          {status?.telemetry?.avgTokensPerSec || stats.avgTokSec}{' '}
          <span style={{ fontSize: '13px', fontWeight: 600 }}>tok/s</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px' }}>
          Calibré sur 3 threads Intel Xeon
        </div>
      </div>

      {/* Carte 3 : Latence Dernière Requête */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #06b6d4',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
          Latence Moyenne / Dernier Appel
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', color: '#06b6d4' }}>
          {status?.telemetry?.lastLatencyMs || stats.avgLatency || 0}{' '}
          <span style={{ fontSize: '13px', fontWeight: 600 }}>ms</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px' }}>
          Plafond timeout : 25 000 ms
        </div>
      </div>

      {/* Carte 4 : Coupe-Feu Loi 18-07 */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #f59e0b',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
          Données PII Interceptées (ANPDP)
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', color: '#f59e0b' }}>
          {stats.totalPiiMasked} <span style={{ fontSize: '13px', fontWeight: 600 }}>masquées</span>
        </div>
        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px' }}>
          0 donnée personnelle envoyée au LLM
        </div>
      </div>

      {/* Carte 5 : Profil Hôte & Contexte */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #8b5cf6',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
          Contraintes Hardware Hôte
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
          RAM: 8 Go | Context: 2048 tok
        </div>
        <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px' }}>
          Keep-Alive: 5m (Auto-déchargement)
        </div>
      </div>
    </div>
  );
}
