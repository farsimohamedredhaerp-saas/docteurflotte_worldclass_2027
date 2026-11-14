import React from 'react';

export default function DispatchLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] transition-colors duration-150 animate-pulse">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#111827]/50" />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
        {/* Header skeleton */}
        <div className="h-28 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6" />

        {/* Form and Verdict Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 h-[520px] rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800" />
          <div className="lg:col-span-7 space-y-6">
            <div className="h-64 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800" />
            <div className="h-64 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800" />
          </div>
        </div>
      </main>
    </div>
  );
}

