// apps/web/src/components/landing/components/MobileMenu.tsx
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  isAr: boolean;
  isLight: boolean;
}

const NAV_LINKS = [
  { href: '#paliers', labelFr: '3 Paliers OEM', labelAr: '3 أنماط تشغيل' },
  { href: '#organes', labelFr: 'Jumeau 6 Organes', labelAr: 'التوأم لـ 6 أعضاء' },
  { href: '#carburant', labelFr: 'Anti-Fraude CUSUM', labelAr: 'مكافحة السحب CUSUM' },
  { href: '#wilayas', labelFr: '58 Wilayas', labelAr: '58 ولاية' },
  { href: '#etapes', labelFr: 'Comment ça marche', labelAr: 'كيف تعمل المنصة' },
  { href: '#simulateur', labelFr: 'Simulateur ROI (DZD)', labelAr: 'حاسبة العائد المالي' },
  { href: '#temoignages', labelFr: 'Retours Clients', labelAr: 'شهادات العملاء' },
  { href: '#faq', labelFr: 'FAQ', labelAr: 'الأسئلة الشائعة' },
];

export function MobileMenu({ open, onClose, isAr, isLight }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className="absolute top-0 right-0 h-full w-80 max-w-[85vw] p-6 flex flex-col justify-between shadow-2xl transition-transform"
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#0B111E',
          borderLeft: `1px solid ${isLight ? '#E2E8F0' : '#1E293B'}`,
        }}
        aria-label={isAr ? 'القائمة الرئيسية للمحمول' : 'Menu principal mobile'}
      >
        <div>
          {/* Header Drawer */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-blue-600 dark:text-sky-400">
                DOCTEURFLOTTE
              </span>
              <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase">
                {isAr ? 'المنصة السيادية' : 'MAINTENANCE 5.0'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق القائمة' : 'Fermer le menu'}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Links list */}
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="py-2.5 px-3 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-sky-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 text-decoration-none"
              >
                {isAr ? link.labelAr : link.labelFr}
              </a>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Link
            href="/live-cockpit"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 text-decoration-none"
            style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%)' }}
          >
            <span>{isAr ? 'فتح قمرة القيادة' : 'Ouvrir le Cockpit'}</span>
          </Link>
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
            <Link
              href="/login"
              onClick={onClose}
              className="py-2 px-3 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-decoration-none"
            >
              {isAr ? 'تسجيل الدخول' : 'Connexion'}
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="py-2 px-3 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-decoration-none"
            >
              {isAr ? 'تسجيل جديد' : 'Créer un compte'}
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

