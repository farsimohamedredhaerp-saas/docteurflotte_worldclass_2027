'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { IconAlertTriangle, IconRefreshCw } from '@/components/navigation/TechIcons';

export default function ComplianceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ComplianceError]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4">
          <IconAlertTriangle size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Erreur sur le Cockpit de Conformité &amp; Fiscalité
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {error.message ||
            "Une anomalie s'est produite lors de l'affichage des registres réglementaires."}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <IconRefreshCw size={14} />
          <span>Réessayer l&apos;initialisation</span>
        </button>
      </main>
    </div>
  );
}

