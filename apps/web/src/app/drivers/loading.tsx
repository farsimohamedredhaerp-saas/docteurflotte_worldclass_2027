import React from 'react';

/**
 * Skeleton de chargement Bento pour le cockpit des Conducteurs & Équipages.
 */
export default function DriversLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 animate-pulse">
      {/* Top Navbar Skeleton Placeholder */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        {/* Header Skeleton */}
        <div className="h-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6" />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
            />
          ))}
        </div>

        {/* Dual Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]" />
          <div className="lg:col-span-3 h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]" />
        </div>
      </main>
    </div>
  );
}
