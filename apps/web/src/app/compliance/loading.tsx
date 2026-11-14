import React from 'react';

export default function ComplianceLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] transition-colors duration-150 animate-pulse">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c1220]/50" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-28 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 h-80 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800" />
          <div className="lg:col-span-9 h-96 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800" />
        </div>
      </main>
    </div>
  );
}
