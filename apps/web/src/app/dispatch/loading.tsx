import React from 'react';

export default function DispatchLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <div style={{ height: '4rem', borderBottom: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)' }} />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
        {/* Header skeleton */}
        <div className="df-skeleton" style={{ height: '7rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />

        {/* Form and Verdict Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 df-skeleton" style={{ height: '520px', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
          <div className="lg:col-span-7 space-y-6">
            <div className="df-skeleton" style={{ height: '16rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
            <div className="df-skeleton" style={{ height: '16rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
          </div>
        </div>
      </main>
    </div>
  );
}

