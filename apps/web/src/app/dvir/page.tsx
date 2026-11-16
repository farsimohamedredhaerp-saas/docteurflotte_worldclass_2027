'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import DvirLoading from './loading';

import { useDvirData } from './hooks/useDvirData';
import { useDvirForm } from './hooks/useDvirForm';
import { DvirHeader } from './components/DvirHeader';
import { DvirKpis } from './components/DvirKpis';
import { DvirVehicleSelector } from './components/DvirVehicleSelector';
import { DvirChecklist } from './components/DvirChecklist';
import { DvirSignAndSubmit } from './components/DvirSignAndSubmit';
import { DvirReportsFeed } from './components/DvirReportsFeed';
import { DVIRSubmissionDto } from './types';

// Fallback sécurisé vers l'écran legacy piloté par Feature Flag
const LegacyDvirPage = dynamic(
  () => import('@/app/_legacy/dvir/page.legacy').then((m) => m.default),
  { ssr: false }
);

function DvirContainer() {
  const {
    vehicles,
    reports,
    isLoading,
    isSubmitting,
    isOnline,
    offlineQueue,
    isSyncingOffline,
    notification,
    submitInspection,
    triggerOfflineSync,
    refreshData,
    kpis,
  } = useDvirData();

  const {
    language,
    setLanguage,
    selectedAssetId,
    selectVehicle,
    selectedVehicle,
    driverName,
    setDriverName,
    inspectionType,
    setInspectionType,
    odometerKm,
    setOdometerKm,
    checklist,
    updateItemStatus,
    updateItemComment,
    updateItemPhoto,
    generalNotes,
    setGeneralNotes,
    setSignatureDataUrl,
    signatureDataUrl,
    resetForm,
    hasCritical,
  } = useDvirForm(vehicles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      notification.notifyWarning('Veuillez sélectionner un véhicule avant de soumettre.');
      return;
    }
    if (!signatureDataUrl) {
      notification.notifyWarning('La signature du chauffeur est obligatoire pour certifier le DVIR.');
      return;
    }

    const payload: DVIRSubmissionDto = {
      assetId: selectedAssetId,
      driverId: selectedVehicle?.driverId || 'drv-unassigned',
      driverName: driverName || 'Chauffeur',
      inspectionType,
      odometerKm,
      generalNotes: generalNotes.trim() || undefined,
      signatureDataUrl,
      items: checklist.map((item) => ({
        code: item.code,
        category: item.category,
        label: item.label,
        status: item.status,
        comment: item.comment,
        photoUrl: item.photoUrl,
      })),
    };

    const ok = await submitInspection(payload, () => {
      resetForm();
    });
    if (ok) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Navbar />

      <NotificationBanner
        notification={notification.notification}
        onClose={notification.clearNotification}
      />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        <DvirHeader
          language={language}
          onLanguageChange={setLanguage}
          isOnline={isOnline}
          offlineCount={offlineQueue.length}
          isSyncingOffline={isSyncingOffline}
          onSyncOffline={triggerOfflineSync}
          onRefresh={refreshData}
          isLoading={isLoading}
        />

        <DvirKpis kpis={kpis} language={language} />

        <DvirVehicleSelector
          vehicles={vehicles}
          selectedAssetId={selectedAssetId}
          onSelectVehicle={selectVehicle}
          selectedVehicle={selectedVehicle}
          language={language}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <DvirChecklist
              language={language}
              inspectionType={inspectionType}
              onInspectionTypeChange={setInspectionType}
              driverName={driverName}
              onDriverNameChange={setDriverName}
              odometerKm={odometerKm}
              onOdometerChange={setOdometerKm}
              checklist={checklist}
              onItemStatusChange={updateItemStatus}
              onItemCommentChange={updateItemComment}
              onItemPhotoChange={updateItemPhoto}
            />

            <DvirSignAndSubmit
              language={language}
              generalNotes={generalNotes}
              onGeneralNotesChange={setGeneralNotes}
              signatureValue={signatureDataUrl}
              onSignatureChange={setSignatureDataUrl}
              hasCritical={hasCritical}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              isVehicleSelected={Boolean(selectedAssetId)}
            />
          </div>

          <div className="lg:col-span-1 sticky top-24">
            <DvirReportsFeed
              reports={reports}
              selectedAssetId={selectedAssetId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DvirPage() {
  const useLegacy = process.env.NEXT_PUBLIC_FF_REFACTOR_DVIR === 'false';

  if (useLegacy) {
    return <LegacyDvirPage />;
  }

  return (
    <Suspense fallback={<DvirLoading />}>
      <DvirContainer />
    </Suspense>
  );
}
