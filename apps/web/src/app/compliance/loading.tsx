import React from 'react';

export default function ComplianceLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <div style={{ height: '4rem', borderBottom: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)' }} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="df-skeleton" style={{ height: '7rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 df-skeleton" style={{ height: '20rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
          <div className="lg:col-span-9 df-skeleton" style={{ height: '24rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
        </div>
      </main>
    </div>
  );
}

