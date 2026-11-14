'use client';

import React, { Suspense } from 'react';
import { OemPlansGrid } from './components/OemPlansGrid';
import { PartsCrossRefTable } from './components/PartsCrossRefTable';

function OrgansContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <OemPlansGrid />
      <PartsCrossRefTable />
    </div>
  );
}

export default function MaintenanceOrgansPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-96 flex items-center justify-center text-slate-400">
          Chargement des spécifications et plans OEM...
        </div>
      }
    >
      <OrgansContent />
    </Suspense>
  );
}

