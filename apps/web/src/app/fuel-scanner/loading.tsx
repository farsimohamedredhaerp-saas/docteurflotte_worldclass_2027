import React from 'react';

/**
 * Skeleton de chargement haute fidélité pour le cockpit du Scanner Carburant Naftal.
 */
export default function FuelScannerLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <div style={{ height: '3.5rem', borderBottom: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)' }} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        {/* Header Skeleton */}
        <div className="df-skeleton" style={{ height: '9rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="df-skeleton"
              style={{ height: '5rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }}
            />
          ))}
        </div>

        {/* Upload Card Skeleton */}
        <div className="df-skeleton" style={{ height: '14rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />

        {/* Filters Skeleton */}
        <div className="df-skeleton" style={{ height: '5rem', borderRadius: 'var(--df-radius-xl)', border: '1px solid var(--df-border-subtle)' }} />

        {/* Receipts Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="df-skeleton"
              style={{ height: '15rem', borderRadius: 'var(--df-radius-lg)', border: '1px solid var(--df-border-subtle)' }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

