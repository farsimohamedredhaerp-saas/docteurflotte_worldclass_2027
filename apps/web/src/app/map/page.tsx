'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Chargement différé asynchrone (Lazy-load) pour préserver le budget initial de 180 Ko JS (§6, §14)
const MapLibreCorridorsMap = dynamic(
  () => import('../../components/cockpit').then((mod) => mod.MapLibreCorridorsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono">Initialisation du moteur cartographique MapLibre GL...</span>
      </div>
    ),
  }
);

export default function MapCorridorsPage() {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Barre Supérieure Tactique */}
      <header className="h-12 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/live-cockpit"
            className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            ← Retour Cockpit
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Cockpit Cartographique Souverain — Corridors Logistiques 58 Wilayas
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-mono">Loi 18-07 ANPDP : Souveraineté & Zéro Cloud Externe</span>
          <Link
            href="/digital-twin"
            className="text-xs px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition"
          >
            Jumeau Numérique & Arrhenius →
          </Link>
        </div>
      </header>

      {/* Carte Tactique MapLibre */}
      <main className="flex-1 w-full h-[calc(100vh-48px)] relative">
        <MapLibreCorridorsMap />
      </main>
    </div>
  );
}


