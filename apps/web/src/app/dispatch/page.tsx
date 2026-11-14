'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { useDispatchData } from './hooks/useDispatchData';
import { useDispatchMissionForm } from './hooks/useDispatchMissionForm';
import { useOfflineVerifier } from './hooks/useOfflineVerifier';
import { DispatchHeader } from './components/DispatchHeader';
import { DispatchEmptyFleetBanner } from './components/DispatchEmptyFleetBanner';
import { MissionParametersForm } from './components/MissionParametersForm';
import { DecisionVerdictCard } from './components/DecisionVerdictCard';
import { OfflineMissionVerifier } from './components/OfflineMissionVerifier';
import { PrintableMissionOrder } from '@/components/dispatch/PrintableMissionOrder';

const DispatchPageLegacy = dynamic(() => import('../_legacy/dispatch/page.legacy'), {
  ssr: false,
});

function DispatchCockpitContent() {
  const { vehicles, drivers, loadingFleet } = useDispatchData();
  const {
    verifyQrText,
    setVerifyQrText,
    verifyTokenText,
    setVerifyTokenText,
    isVerifying,
    verificationOutput,
    handleVerifyOfflineOrder,
    populateFromIssuedOrder,
  } = useOfflineVerifier();

  const form = useDispatchMissionForm({
    vehicles,
    drivers,
    onOrderIssued: (order) =>
      populateFromIssuedOrder(order.qrVerificationPayload, order.offlineSignatureToken),
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        <DispatchHeader />

        {/* MODALE D'ORDRE DE MISSION IMPRIMABLE */}
        {form.activeMissionOrder && (
          <div className="mb-6">
            <PrintableMissionOrder
              order={form.activeMissionOrder}
              onClose={() => form.setActiveMissionOrder(null)}
            />
          </div>
        )}

        {/* BANNIÈRE PARC VIERGE (EMPTY STATE) */}
        {vehicles.length === 0 && !loadingFleet && <DispatchEmptyFleetBanner />}

        {/* GRILLE PRINCIPALE : FORMULAIRE ET VERDICT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <MissionParametersForm
              selectedSector={form.selectedSector}
              setSelectedSector={form.setSelectedSector}
              vehicles={vehicles}
              loadingFleet={loadingFleet}
              selectedVehicleId={form.selectedVehicleId}
              setSelectedVehicleId={form.setSelectedVehicleId}
              drivers={drivers}
              selectedDriverId={form.selectedDriverId}
              setSelectedDriverId={form.setSelectedDriverId}
              originName={form.originName}
              setOriginName={form.setOriginName}
              originWilaya={form.originWilaya}
              setOriginWilaya={form.setOriginWilaya}
              destinationName={form.destinationName}
              setDestinationName={form.setDestinationName}
              destinationWilaya={form.destinationWilaya}
              setDestinationWilaya={form.setDestinationWilaya}
              transitWilayas={form.transitWilayas}
              setTransitWilayas={form.setTransitWilayas}
              cargoNature={form.cargoNature}
              setCargoNature={form.setCargoNature}
              payloadTons={form.payloadTons}
              setPayloadTons={form.setPayloadTons}
              routeKm={form.routeKm}
              setRouteKm={form.setRouteKm}
              requiresHazmat={form.requiresHazmat}
              setRequiresHazmat={form.setRequiresHazmat}
              requiresReefer={form.requiresReefer}
              setRequiresReefer={form.setRequiresReefer}
              isEvaluating={form.isEvaluating}
              onEvaluate={form.handleEvaluateDispatch}
            />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <DecisionVerdictCard
              decisionResult={form.decisionResult}
              isIssuing={form.isIssuing}
              onIssueMissionOrder={form.handleIssueMissionOrder}
            />

            <OfflineMissionVerifier
              verifyQrText={verifyQrText}
              setVerifyQrText={setVerifyQrText}
              verifyTokenText={verifyTokenText}
              setVerifyTokenText={setVerifyTokenText}
              isVerifying={isVerifying}
              verificationOutput={verificationOutput}
              onVerify={handleVerifyOfflineOrder}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DispatchPage() {
  const isLegacy = process.env.NEXT_PUBLIC_FF_REFACTOR_DISPATCH === 'false';

  if (isLegacy) {
    return <DispatchPageLegacy />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#090D16]" />}>
      <DispatchCockpitContent />
    </Suspense>
  );
}
