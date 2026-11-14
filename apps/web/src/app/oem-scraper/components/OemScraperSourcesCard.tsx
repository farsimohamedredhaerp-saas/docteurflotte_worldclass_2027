'use client';

import React from 'react';
import { IconDatabase } from '../../../components/navigation/TechIcons';
import { OemScraperSourcesCardProps } from '../types';
import { SCRAPER_SOURCES } from '../constants';

export function OemScraperSourcesCard({
  selectedSource,
  onSourceChange,
}: OemScraperSourcesCardProps) {
  const currentSource = SCRAPER_SOURCES.find((s) => s.id === selectedSource) || SCRAPER_SOURCES[0];

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--df-shadow-sm)',
      }}
    >
      <h2
        style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          margin: '0 0 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <IconDatabase size={16} className="text-blue-400" /> Sources Publiques & Paramètres d&apos;Extraction
      </h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {SCRAPER_SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSourceChange(s.id)}
            style={{
              flex: 1,
              minWidth: '100px',
              padding: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--df-radius-sm)',
              border: '1px solid var(--df-border-subtle)',
              background: selectedSource === s.id ? 'var(--df-primary)' : 'var(--df-bg-surface-2)',
              color: selectedSource === s.id ? '#fff' : 'var(--df-text-secondary)',
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        style={{
          fontSize: '0.82rem',
          color: 'var(--df-text-muted)',
          lineHeight: 1.5,
          background: 'var(--df-bg-surface-2)',
          padding: '0.75rem',
          borderRadius: 'var(--df-radius-sm)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div>
          <strong style={{ color: 'var(--df-text-main)' }}>{currentSource.description} :</strong>{' '}
          {currentSource.detail}
        </div>
      </div>
    </div>
  );
}
