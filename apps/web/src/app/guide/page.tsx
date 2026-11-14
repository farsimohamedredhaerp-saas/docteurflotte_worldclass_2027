'use client';

import React, { Suspense, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { GuideHeader } from './components/GuideHeader';
import { GuideSidebarNav } from './components/GuideSidebarNav';
import { GuideSectionsGroup1 } from './components/sections/GuideSectionsGroup1';
import { GuideSectionsGroup2 } from './components/sections/GuideSectionsGroup2';
import { GuideSectionsGroup3 } from './components/sections/GuideSectionsGroup3';
import { useGuideFilters } from './hooks/useGuideFilters';
import { useRoiSimulator } from './hooks/useRoiSimulator';
import { SECTIONS } from './constants';
import { ModeTab } from './types';
import GuideLoading from './loading';

const LegacyGuidePage = dynamic(
  () => import('../_legacy/guide/page.legacy').then((mod) => mod.default),
  { ssr: false }
);

function GuideContent() {
  const { activeSection, searchQuery, setActiveSection, setSearchQuery } = useGuideFilters();
  const roiSimulator = useRoiSimulator();
  const [activeModeTab, setActiveModeTab] = useState<ModeTab>('mode0');
  const [selectedAlgo, setSelectedAlgo] = useState<number>(1);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const query = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(query) || s.badge.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />
      <GuideHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '32px 24px 80px',
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        <GuideSidebarNav
          sections={filteredSections}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />

        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <GuideSectionsGroup1
            activeModeTab={activeModeTab}
            setActiveModeTab={setActiveModeTab}
            roiSimulator={roiSimulator}
            selectedAlgo={selectedAlgo}
            setSelectedAlgo={setSelectedAlgo}
          />
          <GuideSectionsGroup2 />
          <GuideSectionsGroup3 />
        </main>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_GUIDE !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyGuidePage />;
  }

  return (
    <Suspense fallback={<GuideLoading />}>
      <GuideContent />
    </Suspense>
  );
}
