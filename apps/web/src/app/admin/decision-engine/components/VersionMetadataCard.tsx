'use client';

import React from 'react';
import type { PlatformDecisionEngineConfig } from '../types';

interface VersionMetadataCardProps {
  config: PlatformDecisionEngineConfig;
}

export function VersionMetadataCard({ config }: VersionMetadataCardProps) {
  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        marginBottom: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)' }}>
          Auteur : <strong style={{ color: 'var(--df-text-main)' }}>{config.author_email}</strong>
          {config.approved_by_email && (
            <>
              {' '}• Approuvé par : <strong style={{ color: '#38bdf8' }}>{config.approved_by_email}</strong>{' '}
              ({config.approved_at ? new Date(config.approved_at).toLocaleDateString('fr-FR') : ''})
            </>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
          Créé le : {new Date(config.created_at).toLocaleString('fr-FR')}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginBottom: '8px' }}>
        <strong>Justification :</strong> {config.change_justification || 'Baseline initiale certifiée.'}
      </div>

      <div
        style={{
          fontSize: '12px',
          color: 'var(--df-text-muted)',
          fontFamily: 'monospace',
          background: 'var(--df-bg-surface-2)',
          padding: '8px 12px',
          borderRadius: '6px',
        }}
      >
        Empreinte Canonique SHA-256 :{' '}
        <span style={{ color: '#38bdf8' }}>
          {config.canonical_content_hash || config.config_hash}
        </span>
      </div>
    </div>
  );
}
