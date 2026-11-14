'use client';

import React from 'react';

export default function OemScraperLoading() {
  return (
    <div className="df-container" style={{ paddingTop: '2rem' }}>
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ height: '32px', width: '380px', background: 'var(--df-bg-surface-2)', borderRadius: '6px' }} />
        <div style={{ height: '18px', width: '600px', background: 'var(--df-bg-surface-2)', borderRadius: '4px' }} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            height: '240px',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
          }}
        />
        <div
          style={{
            height: '240px',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
          }}
        />
      </div>
    </div>
  );
}
