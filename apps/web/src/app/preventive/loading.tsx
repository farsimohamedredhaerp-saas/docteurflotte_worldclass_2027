import React from 'react';

export default function PreventiveLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <div style={{ height: '4rem', borderBottom: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)' }} />
      <div className="df-skeleton" style={{ height: '11rem', borderBottom: '1px solid var(--df-border-subtle)' }} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="df-skeleton" style={{ height: '12rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
        <div className="df-skeleton" style={{ height: '16rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
      </main>
    </div>
  );
}

