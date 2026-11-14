'use client';

import React from 'react';
import Link from 'next/link';
import { FleetAggregateStats } from './types';
import { ThemeToggle } from '../ThemeToggle';
import {
  IconActivity,
  IconSearch,
  IconPlay,
  IconPause,
  IconAlertTriangle,
  IconFlame,
  IconTerminal,
  IconChevronLeft,
  IconChevronRight,
  IconAlertOctagon,
  IconShieldCheck,
} from '../navigation/TechIcons';

interface TopCommandBarProps {
  stats: FleetAggregateStats;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onInjectCriticalDtc?: () => void;
  onTriggerFuelDrop?: () => void;
  onToggleDvirBlock?: () => void;
  selectedVehicleId?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isCockpitOpen?: boolean;
  onToggleCockpit?: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (val?: boolean) => void;
}

export function TopCommandBar({
  stats,
  searchQuery,
  onSearchChange,
  isPlaying,
  onTogglePlayPause,
  onInjectCriticalDtc,
  onTriggerFuelDrop,
  onToggleDvirBlock,
  selectedVehicleId,
  isSidebarCollapsed,
  onToggleSidebar,
  isCockpitOpen,
  onToggleCockpit,
  isDemoMode = true,
  onToggleDemoMode,
}: TopCommandBarProps) {
  return (
    <header
      className="h-12 w-full backdrop-blur-md px-2.5 flex items-center justify-between shrink-0 select-none z-30 transition-colors overflow-hidden"
      style={{
        height: '48px',
        minHeight: '48px',
        maxHeight: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'var(--df-cockpit-header-bg)',
        borderBottom: '1px solid var(--df-cockpit-border)',
        overflow: 'hidden',
      }}
    >
      {/* Segment Gauche : Logo / Titre & Statuts de Flotte */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Badge Identité & Bouton Volet Véhicules */}
        <div
          className="flex items-center gap-1.5 pr-2"
          style={{ borderRight: '1px solid var(--df-cockpit-border)' }}
        >
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-6 h-6 rounded-sm flex items-center justify-center transition-colors cursor-pointer"
              style={{
                backgroundColor: isSidebarCollapsed ? 'var(--df-accent-blue-subtle)' : 'var(--df-cockpit-card-bg)',
                border: `1px solid ${isSidebarCollapsed ? 'var(--df-accent-blue)' : 'var(--df-cockpit-border)'}`,
                color: isSidebarCollapsed ? 'var(--df-accent-blue)' : 'var(--df-cockpit-text-muted)',
              }}
              title={isSidebarCollapsed ? 'Déplier la liste des véhicules (Ctrl+B)' : 'Replier la liste des véhicules (Ctrl+B)'}
            >
              {isSidebarCollapsed ? (
                <IconChevronRight size={13} strokeWidth={2.5} />
              ) : (
                <IconChevronLeft size={13} strokeWidth={2.5} />
              )}
            </button>
          )}
          <Link
            href="/"
            className="flex items-center gap-1.5 transition-colors"
            title="Retour au Tableau de Bord Principal"
          >
            <div
              className="w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[10px] font-bold"
              style={{
                backgroundColor: 'var(--df-accent-blue-subtle)',
                border: '1px solid var(--df-accent-blue)',
                color: 'var(--df-accent-blue)',
              }}
            >
              DF
            </div>
          </Link>
          <div className="hidden sm:flex flex-col">
            <span
              className="text-[11px] font-bold tracking-wider uppercase whitespace-nowrap"
              style={{ color: 'var(--df-cockpit-text-title)' }}
            >
              Cockpit Live
            </span>
            <span
              className="text-[9px] font-mono uppercase tracking-tight whitespace-nowrap"
              style={{ color: 'var(--df-cockpit-text-muted)' }}
            >
              CAN J1939 • Souverain
            </span>
          </div>

          {/* BADGE ÉTAT DU MODE (DÉMO VS RÉEL) */}
          <button
            type="button"
            onClick={() => onToggleDemoMode && onToggleDemoMode(!isDemoMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '2px 6px',
              borderRadius: 'var(--df-radius-xs)',
              fontSize: '9.5px',
              fontFamily: "'JetBrains Mono', monospace",
              background: isDemoMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${isDemoMode ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              color: isDemoMode ? '#F59E0B' : '#10B981',
              fontWeight: 700,
              cursor: onToggleDemoMode ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
            }}
            title={onToggleDemoMode ? "Cliquer pour commuter entre Mode Démo et Flotte Réelle" : undefined}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {isDemoMode ? <IconActivity size={11} className="text-amber-500" /> : <IconShieldCheck size={11} className="text-emerald-500" />}
              {isDemoMode ? 'DÉMO' : 'RÉEL'}
            </span>
          </button>
        </div>

        {/* Compteurs Globaux de la Flotte */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Total */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px]"
            style={{
              backgroundColor: 'var(--df-cockpit-card-bg)',
              border: '1px solid var(--df-cockpit-border)',
              color: 'var(--df-cockpit-text-title)',
            }}
          >
            <span
              className="uppercase tracking-wide"
              style={{ color: 'var(--df-cockpit-text-muted)' }}
            >
              Total
            </span>
            <span
              className="font-mono tabular-nums font-bold"
              style={{ color: 'var(--df-cockpit-text-title)' }}
            >
              {stats.totalVehicles}
            </span>
          </div>

          {/* En route (Motion) */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px]"
            style={{
              backgroundColor: 'var(--df-status-ok-bg)',
              border: '1px solid var(--df-status-ok-border)',
              color: 'var(--df-status-ok-text)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase tracking-wide font-medium">Route</span>
            <span className="font-mono tabular-nums font-bold">
              {stats.inMotion}
            </span>
          </div>

          {/* Au ralenti (Idling) */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px]"
            style={{
              backgroundColor: 'var(--df-status-warning-bg)',
              border: '1px solid var(--df-status-warning-border)',
              color: 'var(--df-status-warning-text)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="uppercase tracking-wide font-medium">Ralenti</span>
            <span className="font-mono tabular-nums font-bold">
              {stats.idling}
            </span>
          </div>

          {/* Alertes DTC critiques */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px]"
            style={{
              backgroundColor: 'var(--df-status-danger-bg)',
              border: '1px solid var(--df-status-danger-border)',
              color: 'var(--df-status-danger-text)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="uppercase tracking-wide font-medium">DTC</span>
            <span className="font-mono tabular-nums font-bold">
              {stats.dtcCritical}
            </span>
          </div>

          {/* Consignations DVIR critiques */}
          {(stats.dvirBlockedCount ?? 0) > 0 && (
            <Link
              href="/dvir"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] transition-opacity hover:opacity-85"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.6)',
                color: '#EF4444',
                textDecoration: 'none',
              }}
              title="Véhicules sous consignation immédiate DVIR (Interdiction de départ)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              <span className="uppercase tracking-wide font-bold flex items-center gap-1">
                <IconAlertOctagon size={11} /> DVIR
              </span>
              <span className="font-mono tabular-nums font-bold">
                {stats.dvirBlockedCount}
              </span>
            </Link>
          )}

          {/* Hors ligne */}
          <div
            className="hidden 2xl:flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px]"
            style={{
              backgroundColor: 'var(--df-cockpit-card-bg)',
              border: '1px solid var(--df-cockpit-border)',
              color: 'var(--df-cockpit-text-muted)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="uppercase tracking-wide font-medium">Off</span>
            <span className="font-mono tabular-nums font-bold">
              {stats.offline}
            </span>
          </div>
        </div>
      </div>

      {/* Segment Central : Recherche Rapide (Cmd+K) */}
      <div className="flex-1 min-w-[120px] max-w-xs mx-2">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: '8px',
              pointerEvents: 'none',
              color: 'var(--df-cockpit-text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconSearch size={12} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher... (Ctrl+K)"
            className="w-full h-7 pl-6 pr-8 text-[11px] font-mono rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
            style={{
              backgroundColor: 'var(--df-cockpit-input-bg)',
              color: 'var(--df-cockpit-text-title)',
              border: '1px solid var(--df-cockpit-border)',
              paddingLeft: '1.75rem',
              paddingRight: '2rem',
              width: '100%',
              height: '28px',
              fontSize: '11px',
              boxSizing: 'border-box',
            }}
          />
          <kbd
            style={{
              position: 'absolute',
              right: '6px',
              backgroundColor: 'var(--df-cockpit-card-bg)',
              color: 'var(--df-cockpit-text-muted)',
              border: '1px solid var(--df-cockpit-border)',
              fontSize: '9px',
              padding: '1px 3px',
              borderRadius: '2px',
              userSelect: 'none',
              pointerEvents: 'none',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Segment Droit : Indicateurs Télémétrie & Contrôles Simulation */}
      <div className="flex items-center gap-1.5 shrink-0 flex-nowrap" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, flexWrap: 'nowrap' }}>
        {/* Scénarios de Test Live (Simulation Interactive) */}
        {selectedVehicleId && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              borderRight: '1px solid var(--df-cockpit-border)',
              paddingRight: '0.35rem',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <button
              onClick={onInjectCriticalDtc}
              className="px-1.5 py-1 text-[10px] font-mono font-medium rounded-sm flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: 'var(--df-status-danger-bg)',
                border: '1px solid var(--df-status-danger-border)',
                color: 'var(--df-status-danger-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
              title="Injecter un code défaut critique SPN-100-FMI-1 (Pression Huile Basse)"
            >
              <IconAlertTriangle size={11} strokeWidth={2} />
              <span>DTC</span>
            </button>
            <button
              onClick={onTriggerFuelDrop}
              className="px-1.5 py-1 text-[10px] font-mono font-medium rounded-sm flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: 'var(--df-status-warning-bg)',
                border: '1px solid var(--df-status-warning-border)',
                color: 'var(--df-status-warning-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
              title="Simuler une chute anormale instantanée de carburant (-45L CUSUM)"
            >
              <IconFlame size={11} strokeWidth={2} />
              <span>Fuite</span>
            </button>
            <button
              onClick={onToggleDvirBlock}
              className="px-1.5 py-1 text-[10px] font-mono font-medium rounded-sm flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
              title="Basculer l'état de consignation sécurité DVIR de l'unité sélectionnée"
            >
              <IconAlertOctagon size={11} />
              <span>DVIR</span>
            </button>
          </div>
        )}

        {/* Bouton Pause / Reprise Simulation */}
        <button
          onClick={onTogglePlayPause}
          className="h-7 px-2 rounded-sm border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          style={{
            backgroundColor: isPlaying
              ? 'var(--df-cockpit-card-bg)'
              : 'var(--df-status-ok-bg)',
            border: isPlaying
              ? '1px solid var(--df-cockpit-border-strong)'
              : '1px solid var(--df-status-ok-border)',
            color: isPlaying
              ? 'var(--df-cockpit-text-title)'
              : 'var(--df-status-ok-text)',
          }}
          title={isPlaying ? 'Mettre en pause le flux' : 'Reprendre le flux temps réel'}
        >
          {isPlaying ? (
            <>
              <IconPause size={11} strokeWidth={2} />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <IconPlay size={11} strokeWidth={2} />
              <span className="hidden sm:inline">Play</span>
            </>
          )}
        </button>

        {/* Badge Télémétrique WebSocket Latence & Débit */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-mono shrink-0 whitespace-nowrap"
          style={{
            backgroundColor: 'var(--df-cockpit-card-bg)',
            border: '1px solid var(--df-cockpit-border)',
            color: 'var(--df-cockpit-text-title)',
          }}
        >
          <span className="flex h-1.5 w-1.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                isPlaying ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="tabular-nums">
            WS: <strong style={{ color: 'var(--df-status-ok)' }}>{stats.wsLatencyMs}ms</strong>
          </span>
        </div>

        {/* BOUTON COCKPIT HUD TACTIQUE (CHÂSSIS SCANNER) */}
        <Link
          href={selectedVehicleId ? `/live-cockpit/hud?v=${selectedVehicleId}` : '/live-cockpit/hud'}
          className="h-7 px-2 rounded-sm border text-[10px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 text-cyan-400 bg-cyan-950/50 border-cyan-700/70 hover:bg-cyan-900/60 hover:border-cyan-500"
          title="Ouvrir le Cockpit Diagnostic & Scanner Châssis Tactique HUD"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="hidden sm:inline font-bold tracking-wider">HUD TACTIQUE</span>
          <span className="sm:hidden font-bold">HUD</span>
        </Link>

        {/* COMMUTATEUR THÈME SOMBRE / CLAIR */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>

        {/* COMMUTATEUR VOLET INSPECTION TÉLÉMATIQUE (DROITE) */}
        {onToggleCockpit && (
          <button
            onClick={onToggleCockpit}
            className="h-7 px-2 rounded-sm border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            style={{
              backgroundColor: isCockpitOpen ? 'var(--df-accent-blue-subtle)' : 'var(--df-cockpit-card-bg)',
              border: `1px solid ${isCockpitOpen ? 'var(--df-accent-blue)' : 'var(--df-cockpit-border)'}`,
              color: isCockpitOpen ? 'var(--df-accent-blue)' : 'var(--df-cockpit-text-muted)',
            }}
            title={isCockpitOpen ? "Replier le cockpit d'inspection télématique (Ctrl+I)" : "Ouvrir le cockpit d'inspection télématique (Ctrl+I)"}
          >
            <IconTerminal size={11} strokeWidth={2} />
            <span className="hidden md:inline font-semibold">Télémétrie</span>
            {isCockpitOpen ? (
              <IconChevronRight size={12} strokeWidth={2.5} />
            ) : (
              <IconChevronLeft size={12} strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
