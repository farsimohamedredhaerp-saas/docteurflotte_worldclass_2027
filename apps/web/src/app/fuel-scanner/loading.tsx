import React from 'react';

/**
 * Skeleton de chargement haute fidélité pour le cockpit du Scanner Carburant Naftal.
 */
export default function FuelScannerLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 animate-pulse">
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        {/* Header Skeleton */}
        <div className="h-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6" />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
            />
          ))}
        </div>

        {/* Upload Card Skeleton */}
        <div className="h-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]" />

        {/* Filters Skeleton */}
        <div className="h-20 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]" />

        {/* Receipts Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
            />
          ))}
        </div>
      </main>
    </div>
  );
}

