// apps/web/src/components/landing/components/HowItWorksSection.tsx
'use client';

import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../constants';
import { useInView } from '../hooks';
import { IconZap, IconMountain, IconCpu, IconBarChart3 } from '../../navigation/TechIcons';

const ICON_MAP = {
  IconZap: IconZap,
  IconMountain: IconMountain,
  IconCpu: IconCpu,
  IconBarChart3: IconBarChart3,
};

export function HowItWorksSection({ isAr, isLight }: { isAr: boolean; isLight: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section id="etapes" className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-800">
      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase mb-2">
            {isAr ? 'منهجية التشغيل في 4 خطوات' : 'DÉPLOIEMENT & EXPLOITATION'}
          </h2>
          <h3
            className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
            style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
          >
            {isAr ? 'كيف تبدأ الصيانة 5.0 في أسطولك خلال 24 ساعة' : 'Comment ça Marche : Opérationnel en 24h'}
          </h3>
          <p className="text-sm leading-relaxed text-slate-500">
            {isAr
              ? 'مسار متكامل مصمم للواقع الميداني الجزائري : من الاستغلال الفوري بدون أجهزة، إلى النمذجة الفيزيائية والقرار الاقتصادي الحتمي.'
              : 'Un protocole sans friction adapté aux contraintes réelles du terrain : de l\'exploitation Mode 0 sans boîtier jusqu\'à l\'arbitrage financier en Dinars.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const IconComponent = ICON_MAP[step.icon as keyof typeof ICON_MAP] || IconZap;
            return (
              <div
                key={step.step}
                className={`p-6 rounded-xl border flex flex-col justify-between transition-all duration-700 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${idx * 120}ms`,
                  backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
                  borderColor: isLight ? '#E2E8F0' : '#1E293B',
                }}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-mono font-extrabold text-blue-600/30 dark:text-sky-400/30">
                      {step.step}
                    </span>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400">
                      <IconComponent size={20} strokeWidth={2.2} />
                    </div>
                  </div>
                  <h4
                    className="text-sm font-bold mb-2"
                    style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}
                  >
                    {isAr ? step.titleAr : step.titleFr}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {isAr ? step.descAr : step.descFr}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{isAr ? 'جاهز للاستخدام الفوري' : 'PRÊT JOUR 1'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

