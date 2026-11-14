'use client';

import React from 'react';

export default function DecisionEngineLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          height: '40px',
          width: '50%',
          backgroundColor: 'var(--df-bg-surface-2)',
          borderRadius: '8px',
          animation: 'pulse 1.5s infinite',
        }}
      />
      <div
        style={{
          height: '60px',
          backgroundColor: 'var(--df-bg-surface-2)',
          borderRadius: '12px',
          animation: 'pulse 1.5s infinite',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              height: '140px',
              backgroundColor: 'var(--df-bg-surface-2)',
              borderRadius: '12px',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}
