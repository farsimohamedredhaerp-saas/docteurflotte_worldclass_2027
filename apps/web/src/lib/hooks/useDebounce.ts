'use client';

import { useEffect, useState } from 'react';

/**
 * Hook de temporisation (debounce) pour champs de recherche ou entrées utilisateur fréquentes.
 * @param value Valeur d'entrée
 * @param delayMs Délai en millisecondes (défaut 200 ms)
 */
export function useDebounce<T>(value: T, delayMs: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

