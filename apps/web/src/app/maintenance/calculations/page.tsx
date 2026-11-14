'use client';

import React, { Suspense } from 'react';
import { SadAdsArbitrageGrid } from './components/SadAdsArbitrageGrid';
import { PhysicalLawsCheatSheet } from './components/PhysicalLawsCheatSheet';

function CalculationsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <SadAdsArbitrageGrid />
      <PhysicalLawsCheatSheet />
    </div>
  );
}

export default function MaintenanceCalculationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-96 flex items-center justify-center text-slate-400">
          Chargement des preuves et arbitrages actuariels...
        </div>
      }
    >
      <CalculationsContent />
    </Suspense>
  );
}

