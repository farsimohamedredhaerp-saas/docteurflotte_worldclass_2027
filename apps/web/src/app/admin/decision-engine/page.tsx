'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useDecisionEngineFilters } from './hooks/useDecisionEngineFilters';
import { useDecisionEngineData } from './hooks/useDecisionEngineData';
import { DecisionEngineHeader } from './components/DecisionEngineHeader';
import { VersionSelectorBar } from './components/VersionSelectorBar';
import { VersionMetadataCard } from './components/VersionMetadataCard';
import { PhysicalModelsGrid } from './components/PhysicalModelsGrid';
import { SimulationBenchmarkDrawer } from './components/SimulationBenchmarkDrawer';
import { PublicationsLedgerTable } from './components/PublicationsLedgerTable';
import { ConfigDraftModal } from './components/modals/ConfigDraftModal';
import { ActivateConfigModal } from './components/modals/ActivateConfigModal';
import DecisionEngineLoading from './loading';

const LegacyAdminDecisionEnginePage = dynamic(
  () => import('@/app/_legacy/admin/decision-engine/page.legacy'),
  { ssr: false, loading: () => <DecisionEngineLoading /> }
);

function AdminDecisionEngineCockpit() {
  const { selectedConfigId, setSelectedConfigId } = useDecisionEngineFilters();
  const data = useDecisionEngineData(selectedConfigId, setSelectedConfigId);

  return (
    <div>
      <DecisionEngineHeader
        selectedConfig={data.selectedConfig}
        isProcessing={data.isProcessing}
        actionSuccess={data.actionSuccess}
        error={data.error}
        onOpenCreate={data.handleOpenCreateModal}
        onRollback={data.handleRollback}
      />

      <VersionSelectorBar
        configs={data.configs}
        selectedConfigId={data.selectedConfig?.id || selectedConfigId}
        selectedConfig={data.selectedConfig}
        isSimulating={data.isSimulating}
        onSelectConfigId={setSelectedConfigId}
        onRunSimulation={data.handleRunSimulation}
        onOpenEditModal={data.handleOpenEditModal}
        onApproveDraft={data.handleApproveDraft}
        onOpenActivateModal={() => data.setIsActivateModalOpen(true)}
      />

      {data.selectedConfig && <VersionMetadataCard config={data.selectedConfig} />}

      {data.selectedConfig && <PhysicalModelsGrid config={data.selectedConfig} />}

      {data.simulationResult && (
        <SimulationBenchmarkDrawer
          simulationResult={data.simulationResult}
          onClose={() => data.setSimulationResult(null)}
        />
      )}

      <PublicationsLedgerTable publications={data.publications} />

      <ConfigDraftModal
        isOpen={data.isModalOpen}
        onClose={() => data.setIsModalOpen(false)}
        modalMode={data.modalMode}
        formData={data.formData}
        setFormData={data.setFormData}
        activeModalTab={data.activeModalTab}
        setActiveModalTab={data.setActiveModalTab}
        isProcessing={data.isProcessing}
        onSave={data.handleSaveDraft}
      />

      <ActivateConfigModal
        isOpen={data.isActivateModalOpen}
        onClose={() => data.setIsActivateModalOpen(false)}
        selectedConfig={data.selectedConfig}
        activationJustification={data.activationJustification}
        setActivationJustification={data.setActivationJustification}
        isProcessing={data.isProcessing}
        onActivate={data.handleActivateSubmit}
      />
    </div>
  );
}

export default function AdminDecisionEnginePage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_ADMIN_DECISION_ENGINE !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyAdminDecisionEnginePage />;
  }

  return (
    <Suspense fallback={<DecisionEngineLoading />}>
      <AdminDecisionEngineCockpit />
    </Suspense>
  );
}
