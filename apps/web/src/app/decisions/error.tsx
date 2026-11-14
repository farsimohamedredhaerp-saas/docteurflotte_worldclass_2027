'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { Button } from '@/components/Button';
import { IconAlertTriangle, IconRefreshCw } from '@/components/navigation/TechIcons';

export default function DecisionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur cockpit décisionnel ADS:', error);
  }, [error]);

  return (
    <>
      <Navbar />
      <div className="df-container" style={{ paddingTop: '3rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            background: 'var(--df-bg-surface-2)',
            padding: '2.5rem',
            borderRadius: 'var(--df-radius-lg)',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <div style={{ color: 'var(--df-status-danger)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <IconAlertTriangle size={48} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '0.75rem' }}>
            Erreur du Cockpit Décisionnel ADS
          </h2>
          <p style={{ color: 'var(--df-text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Une anomalie est survenue lors de l&apos;arbitrage économique ou de l&apos;évaluation réglementaire des 4 portes.
          </p>
          <Button variant="primary" onClick={() => reset()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconRefreshCw size={14} /> Réessayer l&apos;évaluation
          </Button>
        </div>
      </div>
    </>
  );
}

