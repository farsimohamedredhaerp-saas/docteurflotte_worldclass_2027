'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/Button';
import { IconAlertTriangle, IconRefreshCw } from '@/components/navigation/TechIcons';

export default function DecisionEngineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur console gouvernance décisionnelle:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: 'var(--df-bg-surface-2)',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ color: 'var(--df-status-danger)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <IconAlertTriangle size={48} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '8px' }}>
          Erreur du Moteur Décisionnel Admin
        </h2>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.5 }}>
          Une anomalie est survenue lors du chargement des configurations algorithmiques ou de l&apos;historique des publications.
        </p>
        <Button variant="primary" onClick={() => reset()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <IconRefreshCw size={14} /> Recharger la console
        </Button>
      </div>
    </div>
  );
}
