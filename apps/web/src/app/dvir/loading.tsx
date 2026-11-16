import React from 'react';

/**
 * Skeleton de chargement Bento pour le cockpit d'inspection DVIR.
 */
export default function DvirLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      {/* Top Navbar Skeleton Placeholder */}
      <div style={{ height: '3.5rem', borderBottom: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)' }} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        {/* Header Skeleton */}
        <div className="df-skeleton" style={{ height: '9rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="df-skeleton"
              style={{ height: '6rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }}
            />
          ))}
        </div>

        {/* Vehicle Selector Skeleton */}
        <div className="df-skeleton" style={{ height: '7rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />

        {/* Dual Form Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 df-skeleton" style={{ height: '24rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
          <div className="lg:col-span-1 df-skeleton" style={{ height: '24rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />
        </div>
      </main>
    </div>
  );
}
