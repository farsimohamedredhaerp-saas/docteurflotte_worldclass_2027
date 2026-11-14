'use client';

import React, { Suspense, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FuelReceiptScanResult } from '@docteurflotte/contracts';
import { Navbar } from '@/components/navigation/Navbar';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalculationProofData } from '@/components/decisions';

import { useFuelScannerData } from './hooks/useFuelScannerData';
import { useFuelScannerFilters } from './hooks/useFuelScannerFilters';
import { FuelScannerHeader } from './components/FuelScannerHeader';
import { FuelScannerKpis } from './components/FuelScannerKpis';
import { FuelScannerUploadCard } from './components/FuelScannerUploadCard';
import { FuelScannerFilters } from './components/FuelScannerFilters';
import { FuelReceiptCard } from './components/FuelReceiptCard';
import { ManualReceiptModal } from './components/modals/ManualReceiptModal';
import { EditReceiptModal } from './components/modals/EditReceiptModal';
import {
  buildFuelCalculationProof,
  buildTechnicalDossierData,
} from './lib/buildProofAndDossier';

// Fallback legacy via Feature Flag
const LegacyFuelScannerPage = dynamic(
  () => import('@/app/_legacy/fuel-scanner/page.legacy').then((m) => m.default),
  { ssr: false }
);

// Modales lourdes chargées dynamiquement
const CalculationProofModal = dynamic(
  () => import('@/components/decisions').then((m) => m.CalculationProofModal),
  { ssr: false }
);
const TechnicalDossierModal = dynamic(
  () => import('@/components/decisions').then((m) => m.TechnicalDossierModal),
  { ssr: false }
);
const CusumLegalReportViewer = dynamic(
  () => import('@/components/fuel/CusumLegalReportViewer').then((m) => m.CusumLegalReportViewer),
  { ssr: false }
);

function FuelScannerContainer() {
  // 1. Ingestion de données et filtres découpés
  const {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    recentReceipts,
    currentResult,
    setCurrentResult,
    isScanning,
    notification,
    resolvePrice,
    scanReceipt,
    createManualReceipt,
    updateReceipt,
    deleteReceipt,
  } = useFuelScannerData();

  const {
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    fuelTypeFilter,
    setFuelTypeFilter,
    filteredReceipts,
    kpis,
  } = useFuelScannerFilters(recentReceipts);

  // 2. Navigation de modales
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<FuelReceiptScanResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [proofData, setProofData] = useState<CalculationProofData | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isLegalReportOpen, setIsLegalReportOpen] = useState(false);
  const [activeReceiptForReport, setActiveReceiptForReport] = useState<FuelReceiptScanResult | null>(null);

  const targetAsset = useMemo(() => {
    const assetId = activeReceiptForReport?.assetId || selectedAssetId;
    return assets.find((a) => a.id === assetId);
  }, [assets, activeReceiptForReport, selectedAssetId]);

  const dossierData = useMemo(() => {
    if (!activeReceiptForReport) return null;
    const unitPrice = activeReceiptForReport.unitPriceDzd || resolvePrice(activeReceiptForReport.fuelType);
    return buildTechnicalDossierData(activeReceiptForReport, targetAsset, unitPrice);
  }, [activeReceiptForReport, targetAsset, resolvePrice]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        <NotificationBanner
          notification={notification.notification}
          onClose={notification.clearNotification}
          className="mb-4"
        />

        <FuelScannerHeader
          onOpenManualModal={() => setIsManualModalOpen(true)}
          verifiedCount={kpis.verifiedCount}
          anomalyCount={kpis.anomalyCount}
        />

        <FuelScannerKpis kpis={kpis} />

        <FuelScannerUploadCard
          assets={assets}
          selectedAssetId={selectedAssetId}
          onSelectAssetId={setSelectedAssetId}
          onScan={scanReceipt}
          isScanning={isScanning}
          resolvePrice={resolvePrice}
        />

        <FuelScannerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          fuelTypeFilter={fuelTypeFilter}
          onFuelTypeChange={setFuelTypeFilter}
          totalFiltered={filteredReceipts.length}
        />

        {/* GRILLE BENTO DES REÇUS OU ÉTAT VIDE */}
        {filteredReceipts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReceipts.map((rcpt) => (
              <FuelReceiptCard
                key={rcpt.receiptId}
                receipt={rcpt}
                onOpenProof={(target) => setProofData(buildFuelCalculationProof(target))}
                onOpenDossier={(target) => {
                  setActiveReceiptForReport(target);
                  setIsDossierOpen(true);
                }}
                onOpenLegalReport={(target) => {
                  setActiveReceiptForReport(target);
                  setIsLegalReportOpen(true);
                }}
                onOpenEdit={(target) => setEditingReceipt(target)}
                onOpenDelete={(id, label) => setDeleteTarget({ id, label })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun reçu Naftal correspondant"
            description="Aucun plein ne correspond aux critères de filtre ou de recherche sélectionnés."
            action={{
              label: 'Saisir un plein manuel',
              onClick: () => setIsManualModalOpen(true),
            }}
          />
        )}

        {/* MODALES DÉLÉGUÉES ET ACCESSIBLES */}
        <ManualReceiptModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onSubmit={createManualReceipt}
          assets={assets}
          resolvePrice={resolvePrice}
        />

        <EditReceiptModal
          isOpen={Boolean(editingReceipt)}
          onClose={() => setEditingReceipt(null)}
          onSubmit={updateReceipt}
          receipt={editingReceipt}
        />

        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              deleteReceipt(deleteTarget.id, deleteTarget.label);
              setDeleteTarget(null);
            }
          }}
          title="Supprimer ce Reçu Naftal"
          description={`Êtes-vous certain de vouloir supprimer le reçu « ${deleteTarget?.label} » ? L'écart de jauge et l'historique associé seront effacés.`}
          confirmLabel="Supprimer"
          variant="danger"
        />

        {proofData && (
          <CalculationProofModal
            isOpen={Boolean(proofData)}
            onClose={() => setProofData(null)}
            data={proofData}
          />
        )}

        {isDossierOpen && dossierData && (
          <TechnicalDossierModal
            isOpen={isDossierOpen}
            onClose={() => setIsDossierOpen(false)}
            dossier={dossierData}
          />
        )}

        {isLegalReportOpen && (
          <CusumLegalReportViewer
            onClose={() => setIsLegalReportOpen(false)}
          />
        )}
      </main>
    </div>
  );
}

export default function FuelScannerPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_FUEL_SCANNER !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyFuelScannerPage />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center text-xs text-slate-400">
          Chargement du scanner carburant Naftal...
        </div>
      }
    >
      <FuelScannerContainer />
    </Suspense>
  );
}
