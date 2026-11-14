'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/Button';
import { IconAlertTriangle } from '@/components/navigation/TechIcons';

export default function GuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GuideError] Exception non interceptée :', error);
  }, [error]);

  return (
    <div className="df-container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
          padding: '2.5rem',
          boxShadow: 'var(--df-shadow-md)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#ef4444',
          }}
        >
          <IconAlertTriangle size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Erreur de Chargement du Guide
        </h2>
        <p style={{ color: 'var(--df-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Une exception inattendue est survenue lors de l&apos;affichage du guide architectural et stratégique.
          {error.message ? ` Détail : ${error.message}` : ''}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Button variant="primary" size="md" onClick={() => reset()}>
            Réessayer
          </Button>
        </div>
      </div>
    </div>
  );
}
