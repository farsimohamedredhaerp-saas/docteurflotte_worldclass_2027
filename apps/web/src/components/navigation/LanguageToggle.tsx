'use client';

import React, { useState, useEffect } from 'react';
import { Locale } from '../../lib/i18n';

export function LanguageToggle() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('fr');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('df_locale') as Locale;
      if (saved && (saved === 'fr' || saved === 'ar' || saved === 'en')) {
        setCurrentLocale(saved);
        applyLocale(saved);
      }
    } catch {
      // LocalStorage non accessible (SSR / sandbox)
    }
  }, []);

  const applyLocale = (loc: Locale) => {
    const isRtl = loc === 'ar';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', loc);
    try {
      localStorage.setItem('df_locale', loc);
      window.dispatchEvent(new CustomEvent('df:locale-changed', { detail: { locale: loc } }));
    } catch {
      // Ignore
    }
  };

  const handleSelect = (loc: Locale) => {
    setCurrentLocale(loc);
    applyLocale(loc);
  };

  return (
    <div
      role="group"
      aria-label="Sélection de la langue"
      className="inline-flex items-center rounded-[var(--df-radius-sm,6px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] p-0.5 text-[11px] font-mono select-none"
    >
      <button
        type="button"
        onClick={() => handleSelect('fr')}
        className={`px-1.5 py-0.5 rounded-[var(--df-radius-xs,4px)] font-bold transition-colors ${
          currentLocale === 'fr'
            ? 'bg-[var(--df-accent-blue)] text-white shadow-2xs'
            : 'text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
        }`}
        title="Français (Officiel Technique)"
      >
        FR
      </button>

      <button
        type="button"
        onClick={() => handleSelect('ar')}
        className={`px-1.5 py-0.5 rounded-[var(--df-radius-xs,4px)] font-bold transition-colors ${
          currentLocale === 'ar'
            ? 'bg-[var(--df-accent-blue)] text-white shadow-2xs'
            : 'text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
        }`}
        title="العربية (RTL - الجزائر)"
      >
        عر
      </button>

      <button
        type="button"
        onClick={() => handleSelect('en')}
        className={`px-1.5 py-0.5 rounded-[var(--df-radius-xs,4px)] font-bold transition-colors ${
          currentLocale === 'en'
            ? 'bg-[var(--df-accent-blue)] text-white shadow-2xs'
            : 'text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}

