'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '../../components/navigation/Navbar';
import { useOemScraperFilters } from './hooks/useOemScraperFilters';
import { useOemScraperData } from './hooks/useOemScraperData';
import { OemScraperHeader } from './components/OemScraperHeader';
import { OemScraperConsole } from './components/OemScraperConsole';
import { OemScraperSourcesCard } from './components/OemScraperSourcesCard';
import { OemTraceAuditTrail } from './components/OemTraceAuditTrail';
import { OemTemplateResult } from './components/OemTemplateResult';
import OemScraperLoading from './loading';

const LegacyOemScraperPage = dynamic(
  () => import('../_legacy/oem-scraper/page.legacy').then((m) => m.default),
  { ssr: false }
);

function OemScraperCockpit() {
  const filters = useOemScraperFilters();
  const data = useOemScraperData({
    searchMode: filters.searchMode,
    initialVin: filters.vinParam,
    initialMake: filters.makeParam,
    initialModel: filters.modelParam,
    initialCategory: filters.categoryParam,
    onVinChange: filters.setVinParam,
    onCategoryChange: filters.setCategoryParam,
  });

  return (
    <>
      <Navbar />

      <main className="df-container" style={{ paddingTop: '0.5rem' }}>
        <OemScraperHeader
          feedback={data.feedback}
          onDismissFeedback={() => data.setFeedback(null)}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <OemScraperConsole
            searchMode={filters.searchMode}
            onSearchModeChange={filters.setSearchMode}
            vinInput={data.vinInput}
            onVinInputChange={data.setVinInput}
            manualMake={data.manualMake}
            onManualMakeChange={data.setManualMake}
            manualModel={data.manualModel}
            onManualModelChange={data.setManualModel}
            manualEngine={data.manualEngine}
            onManualEngineChange={data.setManualEngine}
            bulkCategory={data.bulkCategory}
            onBulkCategoryChange={data.setBulkCategory}
            bulkTargetMake={data.bulkTargetMake}
            onBulkTargetMakeChange={data.setBulkTargetMake}
            isLoading={data.isLoading}
            onResolve={data.handleResolve}
            onBulkCrawl={data.handleBulkCrawl}
          />

          <OemScraperSourcesCard
            selectedSource={data.selectedSource}
            onSourceChange={data.setSelectedSource}
          />
        </div>

        <OemTraceAuditTrail
          traceSteps={data.traceSteps}
          searchMode={filters.searchMode}
        />

        {data.template && (
          <OemTemplateResult
            template={data.template}
            savedSuccess={data.savedSuccess}
            onSaveToPostgres={data.handleSaveToPostgres}
          />
        )}
      </main>
    </>
  );
}

export default function OEMScraperPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_OEM_SCRAPER !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyOemScraperPage />;
  }

  return (
    <Suspense fallback={<OemScraperLoading />}>
      <OemScraperCockpit />
    </Suspense>
  );
}
