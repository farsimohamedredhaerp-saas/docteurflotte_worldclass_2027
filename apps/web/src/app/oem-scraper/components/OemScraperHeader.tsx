'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { IconSearch } from '../../../components/navigation/TechIcons';
import { FeedbackState } from '../types';

interface OemScraperHeaderProps {
  feedback: FeedbackState;
  onDismissFeedback: () => void;
}

export function OemScraperHeader({
  feedback,
  onDismissFeedback,
}: OemScraperHeaderProps) {
  return (
    <>
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: 'var(--df-shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
                <IconSearch size={20} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Référentiel Souverain & Scraper OEM RMI
              </h1>
              <Badge variant="success" size="md">
                OEM-FIRST DZ
              </Badge>
            </div>
            <p
              style={{
                color: 'var(--df-text-muted)',
                margin: 0,
                fontSize: '0.95rem',
                maxWidth: '850px',
                lineHeight: 1.5,
              }}
            >
              Constitution autonome de votre propre base constructeur sans abonnement récurrent coûteux (TecRMI,
              Autodata, HaynesPro). Extraction et croisement déterministe depuis les portails de lubrifiants
              (Olyslager / LubeMatch), les grilles de pièces d&apos;usure (AUTODOC Club) et l&apos;ingestion locale de
              livrets d&apos;entretien PDF constructeurs (Shacman, SNVI, Cirta).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/assets">
              <Button variant="secondary" size="md">
                ← Retour au Parc
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--df-radius-md)',
            marginBottom: '1.5rem',
            background:
              feedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.12)'
                : feedback.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${
              feedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : feedback.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
            }`,
            color:
              feedback.type === 'success'
                ? 'var(--df-status-ok)'
                : feedback.type === 'warning'
                  ? 'var(--df-status-warning)'
                  : 'var(--df-status-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={onDismissFeedback}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
