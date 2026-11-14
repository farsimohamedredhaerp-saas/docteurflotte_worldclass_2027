'use client';

import React from 'react';

export default function AiObservabilityLoading() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      <div
        style={{
          height: '80px',
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: '95px',
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '12px',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div
          style={{
            height: '400px',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
          }}
        />
        <div
          style={{
            height: '400px',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
          }}
        />
      </div>
    </div>
  );
}
