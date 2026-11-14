import React from 'react';

export default function MaintenanceLoading() {
  return (
    <div className="min-h-96 animate-pulse space-y-4">
      <div className="h-28 rounded-2xl bg-white/50 dark:bg-[#0c1220]/50 border border-slate-200 dark:border-slate-800" />
      <div className="h-16 rounded-xl bg-white/50 dark:bg-[#0c1220]/50 border border-slate-200 dark:border-slate-800" />
      <div className="space-y-3">
        <div className="h-24 rounded-xl bg-white/50 dark:bg-[#0c1220]/50 border border-slate-200 dark:border-slate-800" />
        <div className="h-24 rounded-xl bg-white/50 dark:bg-[#0c1220]/50 border border-slate-200 dark:border-slate-800" />
        <div className="h-24 rounded-xl bg-white/50 dark:bg-[#0c1220]/50 border border-slate-200 dark:border-slate-800" />
      </div>
    </div>
  );
}

