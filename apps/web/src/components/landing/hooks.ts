// apps/web/src/components/landing/hooks.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Lang } from './constants';

const LANG_STORAGE_KEY = 'df_landing_lang';

export function usePersistedLang() {
  const [lang, setLangState] = useState<Lang>('FR');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        if (stored === 'FR' || stored === 'AR') {
          setLangState(stored);
        }
      }
    } catch {
      // Ignorer si localStorage restreint
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      }
    } catch {
      // Ignorer si localStorage indisponible
    }
  }, []);

  return [lang, setLang] as const;
}

/** Hook : révèle un élément quand il entre dans le viewport (une seule fois). */
export function useInView<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView } as const;
}

