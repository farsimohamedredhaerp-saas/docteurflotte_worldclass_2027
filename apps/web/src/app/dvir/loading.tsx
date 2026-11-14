import React from 'react';

/**
 * Skeleton de chargement Bento pour le cockpit d'inspection DVIR.
 */
export default function DvirLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 animate-pulse">
      {/* Top Navbar Skeleton Placeholder */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        {/* Header Skeleton */}
        <div className="h-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6" />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
            />
          ))}
        </div>

        {/* Vehicle Selector Skeleton */}
        <div className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]" />

        {/* Dual Form Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]" />
          <div className="lg:col-span-1 h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]" />
        </div>
      </main>
    </div>
  );
}
