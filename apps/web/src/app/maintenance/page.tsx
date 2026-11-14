'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TechnicalFilterRail } from './components/TechnicalFilterRail';
import { RulMatrixGrid } from './components/RulMatrixGrid';

const MaintenancePageLegacy = dynamic(
  () => import('../_legacy/maintenance/page.legacy'),
  { ssr: false }
);

function MaintenanceHubContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TechnicalFilterRail />
      <RulMatrixGrid />
    </div>
  );
}

export default function MaintenanceHubPage() {
  if (process.env.NEXT_PUBLIC_FF_REFACTOR_MAINTENANCE === 'false') {
    return <MaintenancePageLegacy />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-96 flex items-center justify-center text-slate-400">
          Chargement de la matrice de maintenance prédictive...
        </div>
      }
    >
      <MaintenanceHubContent />
    </Suspense>
  );
}
