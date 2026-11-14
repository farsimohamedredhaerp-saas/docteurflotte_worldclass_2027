'use client';

import React from 'react';
import { Navbar } from '@/components/navigation/Navbar';

export default function DecisionsLoading() {
  return (
    <>
      <Navbar />
      <div className="df-container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              height: '3rem',
              width: '40%',
              background: 'var(--df-bg-surface-2)',
              borderRadius: 'var(--df-radius-md)',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: '110px',
                  background: 'var(--df-bg-surface-2)',
                  borderRadius: 'var(--df-radius-md)',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))}
          </div>
          <div
            style={{
              height: '300px',
              background: 'var(--df-bg-surface-2)',
              borderRadius: 'var(--df-radius-md)',
              animation: 'pulse 1.5s infinite',
            }}
          />
        </div>
      </div>
    </>
  );
}
