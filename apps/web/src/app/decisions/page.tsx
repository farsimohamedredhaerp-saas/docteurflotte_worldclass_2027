'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { CalculationProofModal } from '@/components/decisions';
import { useDecisionsFilters } from './hooks/useDecisionsFilters';
import { useDecisionsData } from './hooks/useDecisionsData';
import { DecisionsHeader } from './components/DecisionsHeader';
import { MaintenanceDecisionsView } from './components/MaintenanceDecisionsView';
import { DispatchAdsView } from './components/DispatchAdsView';
import DecisionsLoading from './loading';

const LegacyDecisionsPage = dynamic(
  () => import('@/app/_legacy/decisions/page.legacy'),
  { ssr: false, loading: () => <DecisionsLoading /> }
);

function DecisionsCockpitContent() {
  const { activeTab, setActiveTab, selectedUrgency, setSelectedUrgency } = useDecisionsFilters();
  const data = useDecisionsData(selectedUrgency);

  return (
    <>
      <Navbar />
      <div className="df-container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        <DecisionsHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          notification={data.notification}
          onDismissNotification={() => data.setNotification(null)}
          isEvaluating={data.isEvaluating}
          isEvaluatingDispatch={data.isEvaluatingDispatch}
          onEvaluateMaintenance={data.handleEvaluate}
          onEvaluateDispatch={() => data.handleEvaluateDispatch()}
        />

        {activeTab === 'MAINTENANCE' ? (
          <MaintenanceDecisionsView
            decisions={data.decisions}
            filteredDecisions={data.filteredDecisions}
            budgetReport={data.budgetReport}
            selectedUrgency={selectedUrgency}
            onSelectUrgency={setSelectedUrgency}
            isLoading={data.isLoading}
            totalActionCost={data.totalActionCost}
            totalInactionRisk={data.totalInactionRisk}
            totalExpectedSavings={data.totalExpectedSavings}
            onOpenInactionProof={data.handleOpenInactionKpiProof}
            onOpenSavingsProof={data.handleOpenSavingsKpiProof}
            onOpenDecisionProof={data.handleOpenDecisionProof}
            onApproveDecision={data.handleApprove}
            onDismissDecision={data.handleDismiss}
          />
        ) : (
          <DispatchAdsView
            simScenario={data.simScenario}
            onSelectScenario={data.setSimScenario}
            isEvaluatingDispatch={data.isEvaluatingDispatch}
            onEvaluateDispatch={data.handleEvaluateDispatch}
            dispatchResult={data.dispatchResult}
            onOpenDispatchProof={data.handleOpenDispatchProof}
          />
        )}
      </div>

      <CalculationProofModal
        isOpen={data.isProofModalOpen}
        onClose={() => data.setIsProofModalOpen(false)}
        data={data.proofModalData}
      />
    </>
  );
}

export default function DecisionsPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_DECISIONS !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyDecisionsPage />;
  }

  return (
    <Suspense fallback={<DecisionsLoading />}>
      <DecisionsCockpitContent />
    </Suspense>
  );
}
