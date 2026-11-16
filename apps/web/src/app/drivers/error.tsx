'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/navigation/Navbar';

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary pour le cockpit des Conducteurs & Équipages.
 * Isole l'erreur de rendu sans détruire la coquille applicative ni la barre de navigation.
 */
export default function DriversError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[DriversError] Exception interceptée par l’Error Boundary:', error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="p-4 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Erreur d&apos;affichage des Conducteurs
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Une anomalie est survenue lors de l&apos;orchestration des données d&apos;équipages et permis. Vos données pseudonymisées demeurent préservées.
        </p>

        {error?.message && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 font-mono text-[11px] text-rose-700 dark:text-rose-300 text-left overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
      </main>
    </div>
  );
}
