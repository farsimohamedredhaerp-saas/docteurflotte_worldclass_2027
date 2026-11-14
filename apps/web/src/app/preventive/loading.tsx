import React from 'react';

export default function PreventiveLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] transition-colors duration-150 animate-pulse">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c1220]/50" />
      <div className="h-44 bg-slate-900 border-b border-indigo-900/30" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-48 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800" />
        <div className="h-64 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800" />
      </main>
    </div>
  );
}

