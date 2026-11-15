'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { WorkOrder } from '@docteurflotte/contracts';
import { Navbar } from '@/components/navigation/Navbar';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDemoMode } from '@/context/DemoModeContext';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { DgiInvoiceData } from '@/components/finance/OfficialDgiInvoiceModal';

import { useWorkOrdersData } from './hooks/useWorkOrdersData';
import { useWorkOrderFilters } from './hooks/useWorkOrderFilters';
import { WorkOrdersHeader } from './components/WorkOrdersHeader';
import { WorkOrdersKpis } from './components/WorkOrdersKpis';
import { WorkOrdersFilters } from './components/WorkOrdersFilters';
import { WorkOrderCard } from './components/WorkOrderCard';
import { CreateWorkOrderModal } from './components/modals/CreateWorkOrderModal';
import { EditWorkOrderModal } from './components/modals/EditWorkOrderModal';
import { CompleteWorkOrderModal } from './components/modals/CompleteWorkOrderModal';
import { buildWorkOrderDgiInvoice } from './lib/buildDgiInvoice';

// Fallback sécurisé vers l'écran legacy piloté par Feature Flag
const LegacyWorkOrdersPage = dynamic(
  () => import('@/app/_legacy/work-orders/page.legacy').then((m) => m.default),
  { ssr: false }
);

// Modale de facture fiscale DGI chargée dynamiquement (code splitting)
const OfficialDgiInvoiceModal = dynamic(
  () => import('@/components/finance/OfficialDgiInvoiceModal').then((m) => m.OfficialDgiInvoiceModal),
  { ssr: false }
);

function WorkOrdersContainer() {
  const { session } = useDemoMode();
  const { tariffs } = useSystemConfig();

  // 1. Ingestion de données et filtres découpés
  const {
    workOrders,
    assets,
    isLoading,
    isSubmitting,
    isUpdating,
    isCompleting,
    notification,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    completeWorkOrder,
  } = useWorkOrdersData();

  const {
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    selectedSource,
    setSelectedSource,
    searchQuery,
    setSearchQuery,
    filteredOrders,
    kpis,
  } = useWorkOrderFilters(workOrders);

  // 2. Navigation de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);
  const [completingWo, setCompletingWo] = useState<WorkOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [invoiceData, setInvoiceData] = useState<DgiInvoiceData | null>(null);

  const handleOpenInvoice = (wo: WorkOrder) => {
    setInvoiceData(
      buildWorkOrderDgiInvoice({
        workOrder: wo,
        hourlyRate: tariffs.economicRates?.hourlyLaborRateDzd || 1500,
        vatRateStandard: tariffs.fiscal?.tvaStandardRate || 0.19,
        tenantCompanyName: session.tenant?.name || '',
      })
    );
  };

  return (
    <div className="min-h-screen bg-[var(--df-bg-canvas)] text-[var(--df-text-main)] transition-colors duration-[var(--df-dur-base,200ms)]">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        <NotificationBanner
          notification={notification.notification}
          onClose={notification.clearNotification}
          className="mb-4"
        />

        <WorkOrdersHeader
          onOpenCreate={() => setIsCreateOpen(true)}
          inProgressCount={kpis.inProgressCount}
          criticalCount={kpis.criticalCount}
        />

        <WorkOrdersKpis kpis={kpis} />

        <WorkOrdersFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
          totalFiltered={filteredOrders.length}
        />

        {/* GRILLE BENTO OU ÉTAT VIDE */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Chargement des ordres de travail de l’atelier...
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((wo) => (
              <WorkOrderCard
                key={wo.id}
                workOrder={wo}
                onOpenInvoice={handleOpenInvoice}
                onOpenComplete={(target) => setCompletingWo(target)}
                onOpenEdit={(target) => setEditingWo(target)}
                onOpenDelete={(id, label) => setDeleteTarget({ id, label })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun ordre de travail correspondant"
            description="Aucune intervention ne correspond aux critères de recherche et filtres sélectionnés."
            action={{
              label: 'Créer un ordre de travail',
              onClick: () => setIsCreateOpen(true),
            }}
          />
        )}

        {/* MODALES DÉCOUPÉES */}
        <CreateWorkOrderModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={createWorkOrder}
          assets={assets}
          isSubmitting={isSubmitting}
        />

        <EditWorkOrderModal
          isOpen={Boolean(editingWo)}
          onClose={() => setEditingWo(null)}
          onSubmit={updateWorkOrder}
          workOrder={editingWo}
          isUpdating={isUpdating}
        />

        <CompleteWorkOrderModal
          isOpen={Boolean(completingWo)}
          onClose={() => setCompletingWo(null)}
          onSubmit={completeWorkOrder}
          workOrder={completingWo}
          isCompleting={isCompleting}
        />

        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (deleteTarget) {
              await deleteWorkOrder(deleteTarget.id, deleteTarget.label);
              setDeleteTarget(null);
            }
          }}
          title="Supprimer cet Ordre de Travail"
          description={`Êtes-vous certain de vouloir supprimer l'ordre de travail « ${deleteTarget?.label} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          variant="danger"
        />

        {invoiceData && (
          <OfficialDgiInvoiceModal
            onClose={() => setInvoiceData(null)}
            data={invoiceData}
          />
        )}
      </main>
    </div>
  );
}

export default function WorkOrdersPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_WORK_ORDERS !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyWorkOrdersPage />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center text-xs text-slate-400">
          Chargement de l’atelier connecté...
        </div>
      }
    >
      <WorkOrdersContainer />
    </Suspense>
  );
}
