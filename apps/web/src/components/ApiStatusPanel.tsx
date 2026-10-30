'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { HealthResponse } from '@docteurflotte/contracts';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

export function ApiStatusPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await fetch(`${apiUrl}/health`, {
        cache: 'no-store',
      });
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <Card style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
              Passerelle & Supervision API
            </h3>
            {loading ? (
              <Badge variant="info" pulse>Sonde active...</Badge>
            ) : error ? (
              <Badge variant="danger" pulse>Non connectée</Badge>
            ) : (
              <Badge variant="ok">Service Opérationnel</Badge>
            )}
          </div>
          <p style={{ color: 'var(--df-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Endpoint : <code style={{ color: 'var(--df-accent-cyan)', fontFamily: 'var(--df-font-mono)' }}>{apiUrl}/health</code>
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={checkHealth}
          isLoading={loading}
        >
          Tester la sonde
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1.15rem',
          borderRadius: 'var(--df-radius-md)',
          fontFamily: 'var(--df-font-mono)',
          fontSize: '0.85rem',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div>
          <div style={{ color: 'var(--df-text-faint)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Service</div>
          <div style={{ color: 'var(--df-text-main)', fontWeight: 600 }}>{health?.service || '—'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--df-text-faint)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Version API</div>
          <div style={{ color: 'var(--df-text-main)', fontWeight: 600 }}>{health?.version || '—'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--df-text-faint)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Uptime</div>
          <div style={{ color: 'var(--df-text-main)', fontWeight: 600 }}>{health ? `${health.uptime}s` : '—'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--df-text-faint)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Latence p95</div>
          <div style={{ color: latency && latency < 300 ? 'var(--df-status-ok)' : 'var(--df-status-warning)', fontWeight: 600 }}>
            {latency !== null ? `${latency} ms` : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--df-text-faint)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Diagnostic</div>
          <div style={{ color: error ? 'var(--df-status-danger)' : 'var(--df-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {error ? error : 'Aucune anomalie'}
          </div>
        </div>
      </div>
    </Card>
  );
}
