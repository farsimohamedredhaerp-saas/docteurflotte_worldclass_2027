// apps/web/src/components/landing/components/TestimonialsSection.tsx
'use client';

import React from 'react';
import { useInView } from '../hooks';
import { TESTIMONIALS } from '../constants';

export function TestimonialsSection({ isAr, isLight }: { isAr: boolean; isLight: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section id="temoignages" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800" aria-labelledby="temoignages-title">
      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
            {isAr ? 'أدلة ميدانية وشهادات تشغيل' : 'RÉSULTATS DE TERRAIN & PREUVES D\'EXPLOITATION'}
          </h2>
          <h3
            id="temoignages-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3"
            style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
          >
            {isAr ? 'أساطيل حقيقية على الطرق الوطنية، وفورات ملموسة' : 'Des Parcs Réels sur le Terrain, des Économies Mesurables'}
          </h3>
          <p className="text-sm leading-relaxed text-slate-500">
            {isAr
              ? 'كيف مكّنت الصيانة 5.0 والفيزياء الحتمية مدراء الأساطيل من خفض التكاليف وحماية المحركات ومكافحة التلاعب.'
              : 'Retours concrets de directeurs de flotte et responsables techniques opérant sous les climats les plus sévères.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <blockquote
              key={i}
              className={`p-6 rounded-xl border flex flex-col justify-between transition-all duration-700 shadow-sm ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: `${i * 120}ms`,
                backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                borderColor: isLight ? '#E2E8F0' : '#1E293B',
              }}
            >
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-6 font-sans">
                “{isAr ? t.quoteAr : t.quoteFr}”
              </p>
              <footer className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                <div>
                  <div className="text-xs font-bold font-sans" style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}>
                    {t.author}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-sans leading-tight">
                    {isAr ? t.roleAr : t.roleFr}
                  </div>
                </div>
                <div className="inline-block px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold whitespace-nowrap">
                  {t.metric}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

