'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { HardwareHeroBanner } from './components/HardwareHeroBanner';
import { SovereignDualGatewayBanner } from './components/SovereignDualGatewayBanner';
import { HardwareFilterBar } from './components/HardwareFilterBar';
import { HardwareCatalogGrid } from './components/HardwareCatalogGrid';
import { ProtocolReferenceTable } from './components/ProtocolReferenceTable';
import { ConfigGeneratorModal } from './components/modals/ConfigGeneratorModal';
import { useHardwareFilters } from './hooks/useHardwareFilters';
import { useConfigGenerator } from './hooks/useConfigGenerator';

const LegacyHardwarePage = dynamic(
  () => import('../../_legacy/telematics/hardware/page.legacy'),
  { ssr: false }
);

function HardwareContent() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedGateway,
    setSelectedGateway,
    filteredDevices,
  } = useHardwareFilters();

  const {
    selectedDevice,
    setSelectedDevice,
    selectedOperator,
    setSelectedOperator,
    serverHost,
    setServerHost,
    copied,
    generateConfigCommand,
    copyCommand,
  } = useConfigGenerator();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />
      <HardwareHeroBanner />
      <SovereignDualGatewayBanner />
      <HardwareFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedGateway={selectedGateway}
        onGatewayChange={setSelectedGateway}
      />
      <HardwareCatalogGrid
        devices={filteredDevices}
        onSelectDevice={setSelectedDevice}
      />
      <ProtocolReferenceTable />
      <ConfigGeneratorModal
        device={selectedDevice}
        isOpen={Boolean(selectedDevice)}
        onClose={() => setSelectedDevice(null)}
        selectedOperator={selectedOperator}
        onOperatorChange={setSelectedOperator}
        serverHost={serverHost}
        onServerHostChange={setServerHost}
        generatedCommand={selectedDevice ? generateConfigCommand(selectedDevice) : ''}
        onCopyCommand={() => {
          if (selectedDevice) {
            copyCommand(generateConfigCommand(selectedDevice));
          }
        }}
        copied={copied}
      />
    </div>
  );
}

export default function TelematicsHardwarePage() {
  if (process.env.NEXT_PUBLIC_FF_REFACTOR_TELEMATICS_HW === 'false') {
    return <LegacyHardwarePage />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
          Chargement du référentiel télématique...
        </div>
      }
    >
      <HardwareContent />
    </Suspense>
  );
}
