'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAiObservabilityFilters } from './hooks/useAiObservabilityFilters';
import { useAiObservabilityData } from './hooks/useAiObservabilityData';
import { AiObservabilityHeader } from './components/AiObservabilityHeader';
import { AiObservabilityKpis } from './components/AiObservabilityKpis';
import { InferenceInspectorConsole } from './components/InferenceInspectorConsole';
import { AiPlaygroundPanel } from './components/AiPlaygroundPanel';
import { SovereignPillarsSection } from './components/SovereignPillarsSection';
import AiObservabilityLoading from './loading';

const LegacyAiObservabilityPage = dynamic(
  () => import('../../_legacy/admin/ai-observability/page.legacy').then((m) => m.default),
  { ssr: false }
);

function AiObservabilityCockpit() {
  const filters = useAiObservabilityFilters();
  const data = useAiObservabilityData(filters.moduleFilter);

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: 'var(--df-text-main)' }}>
      <AiObservabilityHeader
        status={data.status}
        autoRefresh={data.autoRefresh}
        onToggleAutoRefresh={() => data.setAutoRefresh(!data.autoRefresh)}
        onRefresh={() => data.loadAll(data.token || undefined)}
        onExportAuditLog={data.handleExportAuditLog}
      />

      <AiObservabilityKpis status={data.status} stats={data.stats} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        <InferenceInspectorConsole
          logs={data.logs}
          filteredLogs={data.filteredLogs}
          selectedLog={data.selectedLog}
          moduleFilter={filters.moduleFilter}
          onModuleFilterChange={filters.setModuleFilter}
          onSelectLog={data.setSelectedLog}
        />

        <AiPlaygroundPanel
          prompt={data.playgroundPrompt}
          onPromptChange={data.setPlaygroundPrompt}
          systemPrompt={data.playgroundSystem}
          onSystemPromptChange={data.setPlaygroundSystem}
          jsonMode={data.playgroundJsonMode}
          onJsonModeChange={data.setPlaygroundJsonMode}
          temperature={data.playgroundTemp}
          onTemperatureChange={data.setPlaygroundTemp}
          maxTokens={data.playgroundMaxTokens}
          onMaxTokensChange={data.setPlaygroundMaxTokens}
          isInferring={data.isInferringPlayground}
          result={data.playgroundResult}
          error={data.playgroundError}
          onRun={data.handleRunPlayground}
          onApplyPreset={data.applyPreset}
        />
      </div>

      <SovereignPillarsSection token={data.token} />
    </div>
  );
}

export default function AiObservabilityPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_ADMIN_AI_OBSERVABILITY !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyAiObservabilityPage />;
  }

  return (
    <Suspense fallback={<AiObservabilityLoading />}>
      <AiObservabilityCockpit />
    </Suspense>
  );
}
