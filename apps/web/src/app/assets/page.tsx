'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { Asset } from '@docteurflotte/contracts';
import { Navbar } from '@/components/navigation/Navbar';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import AssetsLoading from './loading';

import { useAssetsData } from './hooks/useAssetsData';
import { useAssetFilters } from './hooks/useAssetFilters';
import { AssetsHeader } from './components/AssetsHeader';
import { AssetsKpis } from './components/AssetsKpis';
import { AssetsFilters } from './components/AssetsFilters';
import { AssetCard } from './components/AssetCard';
import { CreateAssetModal } from './components/modals/CreateAssetModal';
import { EditAssetModal } from './components/modals/EditAssetModal';
import { MeterReadingModal } from './components/modals/MeterReadingModal';

// Fallback sécurisé vers l'écran legacy piloté par Feature Flag
const LegacyAssetsPage = dynamic(
  () => import('@/app/_legacy/assets/page.legacy').then((m) => m.default),
  { ssr: false }
);

function AssetsContainer() {
  const {
    assets,
    isLoading,
    isSubmitting,
    isUpdating,
    isRecordingMeter,
    isResolvingOem,
    notification,
    createAsset,
    updateAsset,
    deleteAsset,
    recordMeter,
    resolveOem,
  } = useAssetsData();

  const {
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    filteredAssets,
    kpis,
  } = useAssetFilters(assets);

  // Modales
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [meterAsset, setMeterAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteAsset(deleteTarget.id, deleteTarget.label);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-[var(--df-bg-canvas)] text-[var(--df-text-main)] transition-colors duration-[var(--df-dur-base,200ms)]">
      <Navbar />

      <NotificationBanner
        notification={notification.notification}
        onClose={notification.clearNotification}
      />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        <AssetsHeader
          onOpenAddModal={() => setIsAddOpen(true)}
          operationalCount={kpis.operationalCount}
          maintenanceCount={kpis.maintenanceCount}
        />

        <AssetsKpis kpis={kpis} />

        <AssetsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          totalFiltered={filteredAssets.length}
        />

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-xs font-medium text-slate-500">Chargement de la flotte...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <EmptyState
            title="Aucun actif trouvé"
            description={
              searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                ? "Aucun véhicule ou engin ne correspond aux critères de recherche actuels."
                : "Votre référentiel de flotte est actuellement vide. Ajoutez votre premier actif avec la fiche OEM."
            }
            action={{
              label: "Ajouter un Actif",
              onClick: () => setIsAddOpen(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onOpenMeterModal={(a) => setMeterAsset(a)}
                onOpenEditModal={(a) => setEditingAsset(a)}
                onOpenDeleteConfirm={(id, label) => setDeleteTarget({ id, label })}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODALES */}
      <CreateAssetModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={createAsset}
        onResolveOem={resolveOem}
        isSubmitting={isSubmitting}
        isResolvingOem={isResolvingOem}
      />

      <EditAssetModal
        isOpen={Boolean(editingAsset)}
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onSubmit={updateAsset}
        isUpdating={isUpdating}
      />

      <MeterReadingModal
        isOpen={Boolean(meterAsset)}
        asset={meterAsset}
        onClose={() => setMeterAsset(null)}
        onSubmit={recordMeter}
        isRecording={isRecordingMeter}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer cet Actif ?"
        description={`Confirmez-vous la suppression de l’actif « ${deleteTarget?.label || ''} » ? L’historique télématique associé sera archivé.`}
        confirmLabel="Supprimer Définitivement"
        variant="danger"
      />
    </div>
  );
}

export default function AssetsPage() {
  const useLegacy = process.env.NEXT_PUBLIC_FF_REFACTOR_ASSETS === 'false';

  if (useLegacy) {
    return <LegacyAssetsPage />;
  }

  return (
    <Suspense fallback={<AssetsLoading />}>
      <AssetsContainer />
    </Suspense>
  );
}
