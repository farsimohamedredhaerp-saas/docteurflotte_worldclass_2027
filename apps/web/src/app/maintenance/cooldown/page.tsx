'use client';

import React, { Suspense } from 'react';
import { WarehouseStockManager } from './components/WarehouseStockManager';
import { StockMovementsAndOrders } from './components/StockMovementsAndOrders';

function CooldownContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <WarehouseStockManager />
      <StockMovementsAndOrders />
    </div>
  );
}

export default function MaintenanceCooldownPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-96 flex items-center justify-center text-slate-400">
          Chargement de l'inventaire 4.0 et des stocks magasins...
        </div>
      }
    >
      <CooldownContent />
    </Suspense>
  );
}

