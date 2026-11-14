'use client';

import React from 'react';

export default function SubscriptionsLoading() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            height: '40px',
            width: '40%',
            backgroundColor: 'var(--df-bg-surface-2)',
            borderRadius: '8px',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '90px',
                backgroundColor: 'var(--df-bg-surface-2)',
                borderRadius: '12px',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
        <div
          style={{
            height: '350px',
            backgroundColor: 'var(--df-bg-surface-2)',
            borderRadius: '12px',
            animation: 'pulse 1.5s infinite',
          }}
        />
      </div>
    </div>
  );
}
