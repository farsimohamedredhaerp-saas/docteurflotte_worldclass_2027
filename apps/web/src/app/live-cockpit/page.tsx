'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTelemetryStream } from '../../components/live-cockpit/useTelemetryStream';
import { TopCommandBar } from '../../components/live-cockpit/TopCommandBar';
import { VehicleListSidebar } from '../../components/live-cockpit/VehicleListSidebar';
import { FleetMap } from '../../components/live-cockpit/FleetMap';
import { TelemetryCockpit } from '../../components/live-cockpit/TelemetryCockpit';
import { useDemoMode } from '../../context/DemoModeContext';
import { IconTruck, IconActivity, IconPlus } from '../../components/navigation/TechIcons';

export default function LiveCockpitPage() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const {
    fleet,
    selectedVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    aggregateStats,
    rawCanFrames,
    isPlaying,
    togglePlayPause,
    injectCriticalDtc,
    triggerFuelTheftAnomaly,
    geofences,
  } = useTelemetryStream({ isDemoMode });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCockpitOpen, setIsCockpitOpen] = useState(true);

  // Raccourcis clavier : Cmd+K / Ctrl+K (Recherche), Cmd+B / Ctrl+B (Volet gauche), Cmd+I / Ctrl+I (Volet droit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Filtrer matricule"]') as HTMLInputElement;
        input?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsCockpitOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setIsCockpitOpen(true);
  };

  return (
    <div
      className="flex-1 w-full overflow-hidden flex flex-col font-sans antialiased select-none transition-colors duration-150"
      style={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--df-cockpit-bg)',
        color: 'var(--df-cockpit-text-title)',
      }}
    >
      {/* 1. TOP COMMAND BAR (HAUTEUR 48PX) */}
      <TopCommandBar
        stats={aggregateStats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        selectedVehicleId={selectedVehicleId}
        onInjectCriticalDtc={() => injectCriticalDtc(selectedVehicleId)}
        onTriggerFuelDrop={() => triggerFuelTheftAnomaly(selectedVehicleId)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        isCockpitOpen={isCockpitOpen}
        onToggleCockpit={() => setIsCockpitOpen((prev) => !prev)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={toggleDemoMode}
      />

      {/* 2. ZONE PRINCIPALE (SPLIT-VIEW MULTI-PANNEAUX OU ÉTAT INITIAL PARC VIDE) */}
      {!isDemoMode && fleet.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center p-8 select-none"
          style={{
            backgroundColor: 'var(--df-cockpit-bg)',
            height: 'calc(100vh - 48px)',
          }}
        >
          <div
            className="max-w-md w-full p-8 rounded-lg text-center flex flex-col items-center gap-4"
            style={{
              backgroundColor: 'var(--df-cockpit-card-bg)',
              border: '1px solid var(--df-cockpit-border)',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: 'var(--df-accent-blue-subtle)',
                color: 'var(--df-accent-blue)',
                border: '1px solid var(--df-accent-blue)',
              }}
            >
              <IconTruck size={28} />
            </div>

            <div>
              <h2
                className="text-base font-bold mb-1"
                style={{ color: 'var(--df-cockpit-text-title)' }}
              >
                Votre Parc Réel est Vierge
              </h2>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--df-cockpit-text-muted)' }}
              >
                Aucun véhicule ou boîtier GPS n&apos;est actuellement rattaché à votre organisation. Vos données de production restent strictement cloisonnées (RLS).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
              <Link
                href="/assets"
                className="flex-1 py-2 px-3 rounded text-xs font-bold text-white text-center flex items-center justify-center gap-1.5 transition-opacity"
                style={{
                  backgroundColor: 'var(--df-accent-blue)',
                  textDecoration: 'none',
                }}
              >
                <IconPlus size={14} />
                <span>Enregistrer un Actif</span>
              </Link>

              <button
                type="button"
                onClick={() => toggleDemoMode(true)}
                className="flex-1 py-2 px-3 rounded text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--df-bg-surface-2)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                <IconActivity size={14} />
                <span>Tester la Démo</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex-1 flex overflow-hidden relative"
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            height: 'calc(100vh - 48px)',
            width: '100%',
          }}
        >
          {/* Panneau Gauche : Liste Haute Densité des Véhicules */}
          <VehicleListSidebar
            vehicles={fleet}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={handleSelectVehicle}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            searchFilter={searchQuery}
          />

          {/* Canvas Central : Carte Vectorielle Souveraine (MapLibre / Pure Vector GIS) */}
          <main
            className="flex-1 h-full relative overflow-hidden flex flex-col"
            style={{
              flex: 1,
              height: 'inherit',
              minHeight: '100%',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignSelf: 'stretch',
            }}
          >
            <FleetMap
              vehicles={fleet}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={handleSelectVehicle}
              geofences={geofences}
            />
          </main>

          {/* Panneau Droit : Le Telemetry Cockpit (Inspection Haute Précision OBD-II / J1939) */}
          <TelemetryCockpit
            vehicle={selectedVehicle}
            rawCanFrames={rawCanFrames}
            isOpen={isCockpitOpen}
            onToggleOpen={() => setIsCockpitOpen((prev) => !prev)}
          />
        </div>
      )}
    </div>
  );
}
