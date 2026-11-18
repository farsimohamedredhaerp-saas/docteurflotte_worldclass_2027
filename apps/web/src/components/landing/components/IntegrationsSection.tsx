// apps/web/src/components/landing/components/IntegrationsSection.tsx
'use client';

import React from 'react';
import { INTEGRATIONS } from '../constants';

export function IntegrationsSection({ isAr, isLight }: { isAr: boolean; isLight: boolean }) {
  return (
    <section className="py-12 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-6 font-semibold">
          {isAr ? 'توافق وانفتاح تكنولوجي تام مع بيئتكم الرقمية' : 'S\'intègre nativement à votre écosystème d\'entreprise'}
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {INTEGRATIONS.map((it) => (
            <div
              key={it.name}
              className="px-3.5 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-colors flex items-center gap-2 shadow-xs"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                borderColor: isLight ? '#E2E8F0' : '#1E293B',
                color: isLight ? '#334155' : '#CBD5E1',
              }}
              title={it.category}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{it.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

