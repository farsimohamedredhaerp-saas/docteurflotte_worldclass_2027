// apps/web/src/components/landing/components/FaqSection.tsx
'use client';

import React, { useState } from 'react';
import { FAQ } from '../constants';

export function FaqSection({ isAr, isLight }: { isAr: boolean; isLight: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
            FAQ
          </h2>
          <h3
            className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3"
            style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
          >
            {isAr ? 'الأسئلة الشائعة والأجوبة الدقيقة' : 'Questions Fréquentes & Clarifications'}
          </h3>
          <p className="text-sm text-slate-500 font-sans">
            {isAr
              ? 'كل ما تحتاج معرفته حول السيادة، النمط 0، دقة خوارزميات CUSUM، وتوافق المنصة مع القانون 18-07.'
              : 'Tout ce que vous devez savoir sur la souveraineté, le Mode 0 sans boîtier, l\'algorithme CUSUM et la conformité ANPDP.'}
          </p>
        </div>

        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = openIndex === i;
            const qId = `faq-question-${i}`;
            const aId = `faq-answer-${i}`;
            return (
              <div
                key={i}
                className="rounded-xl border overflow-hidden transition-colors shadow-xs"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isOpen
                    ? (isLight ? '#2563EB' : '#3B82F6')
                    : (isLight ? '#E2E8F0' : '#1E293B'),
                }}
              >
                <button
                  type="button"
                  id={qId}
                  aria-expanded={isOpen}
                  aria-controls={aId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 text-xs sm:text-sm font-bold focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}
                >
                  <span className="font-sans">{isAr ? item.qAr : item.qFr}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-transform duration-200 ${
                      isOpen
                        ? 'bg-blue-600 text-white rotate-45'
                        : isLight
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={aId}
                    role="region"
                    aria-labelledby={qId}
                    className="px-5 pb-5 pt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-sans border-t border-slate-100 dark:border-slate-800/80"
                  >
                    {isAr ? item.aAr : item.aFr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

