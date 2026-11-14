'use client';

import React from 'react';

export default function CopilotLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)' }}>
      <div
        style={{
          height: '110px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 1) 100%)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      />
      <div
        style={{
          maxWidth: '1440px',
          margin: '20px auto 40px',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '24px',
        }}
      >
        <div
          style={{
            height: '75vh',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '16px',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              height: '130px',
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '14px',
            }}
          />
          <div
            style={{
              height: '350px',
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '14px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

