'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Audit interne des anomalies non capturées
    console.error('[DocteurFlotte Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080b11] text-slate-100 p-6">
      <div className="max-w-md w-full bg-slate-900/80 border border-rose-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center mb-6 text-rose-400">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Interruption Inattendue</h1>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Une anomalie technique a été interceptée par le bouclier de résilience de la plateforme. Les données du parc
          restent protégées sous isolation RLS.
        </p>

        {error.digest && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg py-1.5 px-3 mb-6 inline-block">
            <span className="text-[11px] font-mono text-slate-400">ID Diagnostic : {error.digest}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-900/30"
          >
            Réessayer
          </button>
          <Link
            href="/live-cockpit"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700"
          >
            Retour au Cockpit Live
          </Link>
        </div>
      </div>
    </div>
  );
}
