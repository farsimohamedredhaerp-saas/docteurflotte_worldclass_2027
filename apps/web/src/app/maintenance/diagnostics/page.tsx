'use client';

import React, { Suspense } from 'react';
import { CanSimulatorBench } from './components/CanSimulatorBench';
import { DbcFrameInspector } from './components/DbcFrameInspector';

function DiagnosticsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <CanSimulatorBench />
      <DbcFrameInspector />
    </div>
  );
}

export default function MaintenanceDiagnosticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-96 flex items-center justify-center text-slate-400">
          Chargement du banc d'essai CAN J1939...
        </div>
      }
    >
      <DiagnosticsContent />
    </Suspense>
  );
}

