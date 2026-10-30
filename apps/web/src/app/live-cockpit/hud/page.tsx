'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import VehicleDiagnosticTacticalHud from '../../../components/live-cockpit/VehicleDiagnosticTacticalHud';

function TacticalHudContent() {
  const searchParams = useSearchParams();
  const vehicleParam = searchParams.get('v') || searchParams.get('category') || undefined;

  return <VehicleDiagnosticTacticalHud initialCategory={vehicleParam} />;
}

export default function LiveCockpitHudPage() {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Suspense
        fallback={
          <div className="flex-1 flex flex-col items-center justify-center font-mono text-cyan-400 gap-2 p-8">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-widest text-cyan-400">
              INITIALISATION DU COCKPIT TACTIQUE...
            </span>
          </div>
        }
      >
        <TacticalHudContent />
      </Suspense>
    </div>
  );
}
