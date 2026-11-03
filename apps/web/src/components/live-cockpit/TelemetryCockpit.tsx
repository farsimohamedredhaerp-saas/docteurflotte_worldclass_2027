'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VehicleTelemetryState, CanRawFrame } from './types';
import { TelemetryGauges } from './TelemetryGauges';
import { LiveCanConsole } from './LiveCanConsole';
import { ORGAN_META, buildOrganDetails } from './useTelemetryStream';
import {
  IconTruck,
  IconRadio,
  IconAlertTriangle,
  IconShield,
  IconWrench,
  IconChevronRight,
  IconChevronLeft,
  IconTerminal,
  IconCpu,
  IconActivity,
} from '../navigation/TechIcons';

interface TelemetryCockpitProps {
  vehicle?: VehicleTelemetryState;
  rawCanFrames: CanRawFrame[];
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
}

export function TelemetryCockpit({
  vehicle,
  rawCanFrames,
  isOpen = true,
  onToggleOpen,
  onClose,
}: TelemetryCockpitProps) {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'PHYSICS_12' | 'CAN_CONSOLE'>('TELEMETRY');
  const handleToggle = onToggleOpen || onClose || (() => {});

  if (!isOpen) {
    return (
      <aside
        onClick={handleToggle}
        className="w-10 flex flex-col items-center py-2 shrink-0 select-none z-20 transition-all cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/60"
        style={{
          width: '40px',
          minWidth: '40px',
          maxWidth: '40px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
          boxSizing: 'border-box',
          backgroundColor: 'var(--df-cockpit-sidebar-bg)',
          borderLeft: '1px solid var(--df-cockpit-border)',
          cursor: 'pointer',
        }}
        title="Cliquer pour réouvrir le cockpit télématique (ou Ctrl+I)"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className="w-7 h-7 rounded-sm flex items-center justify-center transition-colors cursor-pointer group-hover:border-blue-500 group-hover:text-blue-500 shadow-sm"
          style={{
            backgroundColor: 'var(--df-cockpit-card-bg)',
            border: '1px solid var(--df-cockpit-border)',
            color: 'var(--df-accent-blue)',
          }}
          title="Déplier l'inspection télématique (Ctrl+I)"
        >
          <IconChevronLeft size={15} strokeWidth={2.5} />
        </button>
        <div className="mt-4 flex flex-col gap-2 items-center pointer-events-none">
          <IconTerminal size={14} style={{ color: 'var(--df-accent-blue)' }} />
          <span
            className="text-[10px] font-mono [writing-mode:vertical-rl] tracking-wider uppercase font-semibold mt-2"
            style={{ color: 'var(--df-cockpit-text-muted)' }}
          >
            {vehicle ? vehicle.registrationNumber : 'Inspection Télématique'}
          </span>
        </div>
      </aside>
    );
  }

  if (!vehicle) {
    return (
      <aside
        className="w-[450px] flex flex-col shrink-0 select-none z-20 transition-colors h-full"
        style={{
          width: '450px',
          minWidth: '450px',
          maxWidth: '450px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxSizing: 'border-box',
          backgroundColor: 'var(--df-cockpit-sidebar-bg)',
          borderLeft: '1px solid var(--df-cockpit-border)',
        }}
      >
        <div
          className="p-3 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: 'var(--df-cockpit-card-bg)',
            borderBottom: '1px solid var(--df-cockpit-border)',
          }}
        >
          <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--df-cockpit-text-title)' }}>
            Cockpit d'Inspection Télématique
          </span>
          <button
            onClick={handleToggle}
            className="w-6 h-6 rounded-xs flex items-center justify-center transition-colors cursor-pointer hover:border-blue-500"
            style={{
              backgroundColor: 'var(--df-cockpit-card-bg)',
              border: '1px solid var(--df-cockpit-border)',
              color: 'var(--df-cockpit-text-muted)',
            }}
            title="Replier le Cockpit d'Inspection (Ctrl+I)"
          >
            <IconChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <IconTruck size={36} style={{ color: 'var(--df-cockpit-text-muted)', marginBottom: '0.75rem' }} />
          <h4
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--df-cockpit-text-title)' }}
          >
            Aucun Véhicule Sélectionné
          </h4>
          <p
            className="text-xs max-w-xs mt-1"
            style={{ color: 'var(--df-cockpit-text-muted)' }}
          >
            Sélectionnez une unité dans la liste de gauche ou sur la carte pour
            ouvrir le flux télémétrique temps réel (CAN-bus / OBD-II / Mode 0).
          </p>
        </div>
      </aside>
    );
  }

  // Couleurs VHI
  let healthScoreBadge: React.CSSProperties = {
    backgroundColor: 'var(--df-status-ok-bg)',
    color: 'var(--df-status-ok-text)',
    border: '1px solid var(--df-status-ok-border)',
  };
  if (vehicle.vhiHealthScore < 70) {
    healthScoreBadge = {
      backgroundColor: 'var(--df-status-warning-bg)',
      color: 'var(--df-status-warning-text)',
      border: '1px solid var(--df-status-warning-border)',
    };
  }
  if (vehicle.vhiHealthScore < 50) {
    healthScoreBadge = {
      backgroundColor: 'var(--df-status-danger-bg)',
      color: 'var(--df-status-danger-text)',
      border: '1px solid var(--df-status-danger-border)',
    };
  }

  return (
    <aside
      className="w-[460px] flex flex-col shrink-0 select-none z-20 h-full overflow-hidden transition-colors"
      style={{
        width: '460px',
        minWidth: '460px',
        maxWidth: '460px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxSizing: 'border-box',
        backgroundColor: 'var(--df-cockpit-sidebar-bg)',
        borderLeft: '1px solid var(--df-cockpit-border)',
      }}
    >
      {/* 1. EN-TÊTE D'IDENTITÉ & LIAISON MATÉRIELLE */}
      <div
        className="p-3 shrink-0"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          borderBottom: '1px solid var(--df-cockpit-border)',
        }}
      >
        {/* Ligne 1 : Matricule, Marque & Bouton Fermer */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-base font-bold tracking-tight"
                style={{ color: 'var(--df-cockpit-text-title)' }}
              >
                {vehicle.registrationNumber}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs"
                style={{
                  backgroundColor: 'var(--df-cockpit-card-hover)',
                  color: 'var(--df-cockpit-text-muted)',
                  border: '1px solid var(--df-cockpit-border)',
                }}
              >
                W{vehicle.wilayaCode}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs border font-bold"
                style={healthScoreBadge}
                title="Vehicle Health Index (0-100)"
              >
                VHI: {vehicle.vhiHealthScore}/100
              </span>
              {vehicle.telemetryMode === 'MODE_0_ZERO_HARDWARE' && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#A78BFA',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                  }}
                  title="Mode 0 : Cinématique Valhalla & Pleins Naftal (Zéro Boîtier)"
                >
                  Mode 0 (Valhalla)
                </span>
              )}
              {vehicle.telemetryMode === 'MODE_1_GPS_ONLY' && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                  }}
                  title="Mode 1 : GPS Standard Teltonika / Traccar"
                >
                  Mode 1 (GPS)
                </span>
              )}
              {(!vehicle.telemetryMode || vehicle.telemetryMode === 'MODE_2_FULL_CAN') && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                  title="Mode 2 : Bus CAN J1939 Haute Fréquence"
                >
                  Mode 2 (CAN)
                </span>
              )}
            </div>
            <div
              className="text-[11px] font-medium mt-0.5"
              style={{ color: 'var(--df-cockpit-text-body)' }}
            >
              {vehicle.make} {vehicle.model} •{' '}
              <span className="font-mono text-[10px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                {vehicle.categoryLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/live-cockpit/hud?v=${vehicle.id}`}
              className="h-6 px-2 rounded-xs border text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer text-cyan-400 bg-cyan-950/60 border-cyan-800 hover:bg-cyan-900/80 hover:border-cyan-500"
              title="Ouvrir le Diagnostic & Scanner Châssis Tactique HUD pour ce véhicule"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>HUD X-RAY</span>
            </Link>

            <button
              onClick={handleToggle}
              className="w-6 h-6 rounded-xs flex items-center justify-center transition-colors cursor-pointer hover:border-blue-500"
              style={{
                backgroundColor: 'var(--df-cockpit-card-bg)',
                border: '1px solid var(--df-cockpit-border)',
                color: 'var(--df-cockpit-text-muted)',
              }}
              title="Replier le Cockpit d'Inspection (Ctrl+I)"
            >
              <IconChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Ligne 2 : VIN & Chauffeur */}
        <div
          className="grid grid-cols-2 gap-2 mt-2 pt-2 text-[10px] font-mono"
          style={{ borderTop: '1px solid var(--df-cockpit-border)' }}
        >
          <div>
            <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="block">VIN CONSTRUCTEUR</span>
            <span
              className="font-bold truncate block"
              style={{ color: 'var(--df-cockpit-text-body)' }}
            >
              {vehicle.vin}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="block">CHAUFFEUR ASSIGNÉ</span>
            <span
              className="font-bold truncate block"
              style={{ color: 'var(--df-cockpit-text-body)' }}
            >
              {vehicle.driverName} ({vehicle.driverPhone})
            </span>
          </div>
        </div>

        {/* Ligne 3 : Barre d'État Matériel (GSM, GPS, Batterie, Ping) */}
        <div
          className="grid grid-cols-4 gap-1.5 mt-2.5 p-1.5 rounded-xs text-center font-mono text-[9px]"
          style={{
            backgroundColor: 'var(--df-cockpit-sidebar-bg)',
            border: '1px solid var(--df-cockpit-border)',
          }}
        >
          {/* Signal GSM */}
          <div className="flex flex-col">
            <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px]">SIGNAL GSM</span>
            <span className="font-bold" style={{ color: 'var(--df-cockpit-text-title)' }}>
              {vehicle.hardware.rssiGsmDbm} <span className="text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>dBm</span>
            </span>
            <span className="text-[8px] text-emerald-500 font-semibold">
              {vehicle.hardware.cellularOperator}
            </span>
          </div>

          {/* GNSS Fix */}
          <div className="flex flex-col">
            <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px]">GNSS / SATS</span>
            <span className="font-bold" style={{ color: 'var(--df-cockpit-text-title)' }}>
              {vehicle.hardware.satellitesCount} <span className="text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>sats</span>
            </span>
            <span className="text-[8px] text-blue-500 font-semibold">
              HDOP {vehicle.hardware.hdop.toFixed(1)}
            </span>
          </div>

          {/* Tension Batterie */}
          <div className="flex flex-col">
            <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px]">BATTERIE</span>
            <span className="font-bold" style={{ color: 'var(--df-cockpit-text-title)' }}>
              {vehicle.hardware.batteryVoltageV.toFixed(1)}{' '}
              <span className="text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>V</span>
            </span>
            <span className="text-[8px] text-emerald-500 font-semibold">Nominale OK</span>
          </div>

          {/* Horodatage Ping */}
          <div className="flex flex-col">
            <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px]">DERNIÈRE TRAME</span>
            <span className="text-emerald-500 font-bold">
              {vehicle.hardware.lastPingSecondsAgo.toFixed(1)}s
            </span>
            <span className="text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>Temps Réel</span>
          </div>
        </div>
      </div>

      {/* Onglets Cockpit : Vue Télémétrie vs Diagnostic 12 Organes vs Inspecteur CAN Console */}
      <div
        className="flex shrink-0 text-[10px] font-mono"
        style={{
          backgroundColor: 'var(--df-cockpit-sidebar-bg)',
          borderBottom: '1px solid var(--df-cockpit-border)',
        }}
      >
        <button
          onClick={() => setActiveTab('TELEMETRY')}
          className="flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          style={
            activeTab === 'TELEMETRY'
              ? {
                  borderBottom: '2px solid #2563EB',
                  color: '#2563EB',
                  fontWeight: 700,
                  backgroundColor: 'var(--df-cockpit-card-hover)',
                }
              : {
                  borderBottom: '2px solid transparent',
                  color: 'var(--df-cockpit-text-muted)',
                  backgroundColor: 'transparent',
                }
          }
        >
          <IconCpu size={12} />
          Jauges Directes
        </button>
        <button
          onClick={() => setActiveTab('PHYSICS_12')}
          className="flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          style={
            activeTab === 'PHYSICS_12'
              ? {
                  borderBottom: '2px solid #8B5CF6',
                  color: '#8B5CF6',
                  fontWeight: 700,
                  backgroundColor: 'var(--df-cockpit-card-hover)',
                }
              : {
                  borderBottom: '2px solid transparent',
                  color: 'var(--df-cockpit-text-muted)',
                  backgroundColor: 'transparent',
                }
          }
        >
          <IconActivity size={12} />
          12 Organes (VHI)
        </button>
        <button
          onClick={() => setActiveTab('CAN_CONSOLE')}
          className="flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          style={
            activeTab === 'CAN_CONSOLE'
              ? {
                  borderBottom: '2px solid #10B981',
                  color: '#10B981',
                  fontWeight: 700,
                  backgroundColor: 'var(--df-cockpit-card-hover)',
                }
              : {
                  borderBottom: '2px solid transparent',
                  color: 'var(--df-cockpit-text-muted)',
                  backgroundColor: 'transparent',
                }
          }
        >
          <IconTerminal size={12} />
          CAN ({rawCanFrames.length})
        </button>
      </div>

      {/* Contenu Déroulant */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin">
        {activeTab === 'TELEMETRY' ? (
          <>
            {/* 0. CARTE RÉSUMÉ SANTÉ VHI & GOULOT DÉTERMINISTE */}
            <div
              className="p-3 rounded-sm flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--df-cockpit-card-bg)',
                border: vehicle.hardVetoTriggered
                  ? '1px solid rgba(239, 68, 68, 0.6)'
                  : '1px solid var(--df-cockpit-border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--df-cockpit-text-title)' }}
                >
                  <IconActivity size={13} className="text-purple-500" />
                  Santé Jumeau Numérique (VHI Déterministe)
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold"
                  style={
                    vehicle.hardVetoTriggered
                      ? {
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                        }
                      : {
                          backgroundColor: 'var(--df-accent-blue-subtle)',
                          color: 'var(--df-accent-blue)',
                          border: '1px solid var(--df-accent-blue)',
                        }
                  }
                >
                  {vehicle.vhiStatus || (vehicle.vhiHealthScore >= 80 ? 'OPTIMAL' : 'SURVEILLANCE')}
                </span>
              </div>

              {/* Jauge VHI + Organe Goulot */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div
                  className="p-2 rounded-xs flex flex-col"
                  style={{
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    border: '1px solid var(--df-cockpit-border)',
                  }}
                >
                  <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px] uppercase">
                    Score Global VHI (L-3.5)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        vehicle.vhiHealthScore < 50
                          ? 'text-rose-500'
                          : vehicle.vhiHealthScore < 75
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                      }`}
                    >
                      {vehicle.vhiHealthScore}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>/ 100</span>
                  </div>
                </div>

                <div
                  className="p-2 rounded-xs flex flex-col"
                  style={{
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    border: '1px solid var(--df-cockpit-border)',
                  }}
                >
                  <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px] uppercase">
                    Organe Goulot (Bottleneck)
                  </span>
                  <span className="font-bold text-xs truncate mt-0.5 text-amber-500">
                    {ORGAN_META[vehicle.bottleneckComponent || 'cylinderHead']?.fr || vehicle.bottleneckComponent || 'Culasse & Joint'}
                  </span>
                  <span className="text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                    Score : {vehicle.bottleneckScore ?? Math.round(vehicle.vhiHealthScore * 0.9)}%
                  </span>
                </div>
              </div>

              {/* Alerte Hard Veto si engagé */}
              {vehicle.hardVetoTriggered && (
                <div
                  className="p-2 rounded-xs text-[10px] font-mono flex items-center gap-1.5 animate-pulse"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#EF4444',
                  }}
                >
                  <IconAlertTriangle size={13} className="shrink-0" />
                  <span>VETO SÉCURITÉ ACTIF : {ORGAN_META[vehicle.bottleneckComponent || 'cylinderHead']?.fr || 'Organe'} dégradé sous le seuil critique (Sc ≤ 35).</span>
                </div>
              )}

              {/* Lien vers onglet 12 organes */}
              <button
                onClick={() => setActiveTab('PHYSICS_12')}
                className="w-full py-1 text-[9.5px] font-mono font-bold rounded-xs flex items-center justify-center gap-1 transition-colors cursor-pointer hover:underline"
                style={{
                  backgroundColor: 'var(--df-cockpit-card-hover)',
                  color: 'var(--df-accent-blue)',
                  border: '1px solid var(--df-cockpit-border)',
                }}
              >
                <span>Examiner les 12 organes déterministes (Arrhenius, Archard, Darcy...)</span>
                <IconChevronRight size={11} />
              </button>
            </div>

            {/* Jauges Principales */}
            <TelemetryGauges can={vehicle.can} gps={vehicle.gps} />

            {/* Diagnostic & Codes Défauts (DTC) */}
            <div
              className="p-3 rounded-sm"
              style={{
                backgroundColor: 'var(--df-cockpit-card-bg)',
                border: '1px solid var(--df-cockpit-border)',
              }}
            >
              <div
                className="flex items-center justify-between pb-2 mb-2.5"
                style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--df-cockpit-text-title)' }}
                >
                  <IconAlertTriangle size={13} className="text-rose-500" />
                  Diagnostic On-Board (DTC)
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs"
                  style={{
                    backgroundColor: 'var(--df-cockpit-card-hover)',
                    color: 'var(--df-cockpit-text-muted)',
                    border: '1px solid var(--df-cockpit-border)',
                  }}
                >
                  {vehicle.activeDtcs.length} Code(s)
                </span>
              </div>

              {vehicle.activeDtcs.length === 0 ? (
                <div
                  className="p-2.5 rounded-xs text-[11px] font-mono flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--df-status-ok-bg)',
                    border: '1px solid var(--df-status-ok-border)',
                    color: 'var(--df-status-ok-text)',
                  }}
                >
                  <IconShield size={14} className="shrink-0" />
                  <span>Aucun défaut ECU actif détecté. Tous les calculateurs sont nominaux.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {vehicle.activeDtcs.map((dtc) => (
                    <div
                      key={dtc.id}
                      className="p-2.5 rounded-xs flex flex-col gap-1 text-[11px]"
                      style={{
                        backgroundColor: 'var(--df-status-danger-bg)',
                        border: '1px solid var(--df-status-danger-border)',
                      }}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-rose-700 dark:text-rose-300">
                          {dtc.codeString}
                        </span>
                        <span
                          className="text-[9px] px-1 py-0.2 rounded-xs font-bold"
                          style={{
                            backgroundColor: 'var(--df-status-danger-border)',
                            color: '#FFFFFF',
                          }}
                        >
                          {dtc.severity}
                        </span>
                      </div>
                      <div
                        className="font-medium text-xs"
                        style={{ color: 'var(--df-cockpit-text-title)' }}
                      >
                        {dtc.titleFr}
                      </div>
                      <div
                        className="text-[10px] leading-tight"
                        style={{ color: 'var(--df-cockpit-text-body)' }}
                      >
                        {dtc.technicalDescriptionFr}
                      </div>
                      <div
                        className="mt-1 pt-1 flex items-center gap-1 text-[9px] font-mono font-semibold"
                        style={{
                          borderTop: '1px solid rgba(239, 68, 68, 0.3)',
                          color: 'var(--df-status-warning-text)',
                        }}
                      >
                        <IconWrench size={10} />
                        <span>Action requise : {dtc.recommendedWorkshopAction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sécurité & Consignation Terrain DVIR */}
            <div
              className="p-3 rounded-sm"
              style={{
                backgroundColor: vehicle.dvirStatus?.isBlocked ? 'rgba(239, 68, 68, 0.08)' : 'var(--df-cockpit-card-bg)',
                border: vehicle.dvirStatus?.isBlocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--df-cockpit-border)',
              }}
            >
              <div
                className="flex items-center justify-between pb-2 mb-2"
                style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: vehicle.dvirStatus?.isBlocked ? '#EF4444' : 'var(--df-cockpit-text-title)' }}
                >
                  <span>{vehicle.dvirStatus?.isBlocked ? '🛑' : '📋'}</span>
                  Inspection DVIR & Consignation Sécurité
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold"
                  style={{
                    backgroundColor: vehicle.dvirStatus?.isBlocked ? 'rgba(239, 68, 68, 0.2)' : 'var(--df-status-ok-bg)',
                    color: vehicle.dvirStatus?.isBlocked ? '#EF4444' : 'var(--df-status-ok-text)',
                    border: vehicle.dvirStatus?.isBlocked ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--df-status-ok-border)',
                  }}
                >
                  {vehicle.dvirStatus?.isBlocked ? 'CONSIGNÉ / HARD BLOCK' : 'CONFORME'}
                </span>
              </div>

              {vehicle.dvirStatus?.isBlocked ? (
                <div className="flex flex-col gap-2 text-[11px]">
                  <div
                    className="p-2 rounded-xs flex flex-col gap-1 font-mono"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                      <span>INTERDICTION FORMELLE DE DÉPART</span>
                      {vehicle.dvirStatus.latestReportId && (
                        <span>Fiche #{vehicle.dvirStatus.latestReportId}</span>
                      )}
                    </div>
                    <div className="text-[10.5px] text-rose-900 dark:text-rose-200">
                      {vehicle.dvirStatus.criticalFailureReason || 'Anomalie critique freinage / pneumatiques signalée sur mobile.'}
                    </div>
                    {vehicle.dvirStatus.generatedWorkOrderId && (
                      <div className="text-[9.5px] pt-1 border-t border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center justify-between">
                        <span>Ordre de Travail généré :</span>
                        <span className="font-bold">{vehicle.dvirStatus.generatedWorkOrderId}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href="/work-orders"
                      className="flex-1 py-1 px-2 rounded-xs text-[10px] font-bold text-center transition-colors"
                      style={{
                        backgroundColor: 'var(--df-accent-blue)',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                      }}
                    >
                      🔧 Traiter l&apos;Ordre de Travail
                    </Link>
                    <Link
                      href="/dvir"
                      className="flex-1 py-1 px-2 rounded-xs text-[10px] font-bold text-center transition-colors"
                      style={{
                        backgroundColor: 'var(--df-cockpit-card-bg)',
                        border: '1px solid var(--df-cockpit-border)',
                        color: 'var(--df-cockpit-text-title)',
                        textDecoration: 'none',
                      }}
                    >
                      📋 Fiches DVIR
                    </Link>
                  </div>
                </div>
              ) : (
                <div
                  className="p-2 rounded-xs text-[10.5px] font-mono flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--df-status-ok-bg)',
                    border: '1px solid var(--df-status-ok-border)',
                    color: 'var(--df-status-ok-text)',
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <IconShield size={13} />
                    <span>Dernière inspection valide. Véhicule autorisé au dispatch.</span>
                  </span>
                  <Link
                    href="/dvir"
                    className="text-[9.5px] font-bold underline"
                    style={{ color: 'var(--df-accent-blue)' }}
                  >
                    Nouvelle fiche
                  </Link>
                </div>
              )}
            </div>

            {/* Moteur Décisionnel Financier & Arbitrage SAD -> ADS (DZD) */}
            <div
              className="p-3 rounded-sm"
              style={{
                backgroundColor: 'var(--df-cockpit-card-bg)',
                border: '1px solid var(--df-cockpit-border)',
              }}
            >
              <div
                className="flex items-center justify-between pb-2 mb-2.5"
                style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--df-cockpit-text-title)' }}
                >
                  <IconShield size={13} className="text-emerald-500" />
                  Arbitrage Décisionnel SAD → ADS (DZD)
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  Pack Algérie DGI
                </span>
              </div>

              {/* Grille Financière : Action Préventive vs Risque Inaction */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-2.5">
                <div
                  className="p-2 rounded-xs flex flex-col"
                  style={{
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    border: '1px solid var(--df-cockpit-border)',
                  }}
                >
                  <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px] uppercase">
                    Coût Action Préventive
                  </span>
                  <span
                    className="font-bold text-xs tabular-nums mt-0.5 text-blue-500"
                  >
                    {(vehicle.preventiveCostDzd ?? 18500).toLocaleString('fr-DZ')} DZD
                  </span>
                  <span className="text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                    Intervention atelier
                  </span>
                </div>

                <div
                  className="p-2 rounded-xs flex flex-col"
                  style={{
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    border: '1px solid var(--df-cockpit-border)',
                  }}
                >
                  <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px] uppercase">
                    Risque Financier Inaction
                  </span>
                  <span
                    className="font-bold text-xs tabular-nums mt-0.5 text-rose-500"
                  >
                    {(vehicle.financialRiskDzd ?? 420000).toLocaleString('fr-DZ')} DZD
                  </span>
                  <span className="text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                    Casse + Remorquage + Arrêt
                  </span>
                </div>
              </div>

              {/* RUL & Économie nette */}
              <div
                className="p-2 rounded-xs flex items-center justify-between text-[10px] font-mono mb-2"
                style={{
                  backgroundColor: 'var(--df-status-ok-bg)',
                  border: '1px solid var(--df-status-ok-border)',
                  color: 'var(--df-status-ok-text)',
                }}
              >
                <span>
                  Économie Nette Attendue :{' '}
                  <strong className="tabular-nums">
                    +{((vehicle.financialRiskDzd ?? 420000) - (vehicle.preventiveCostDzd ?? 18500)).toLocaleString('fr-DZ')} DZD
                  </strong>
                </span>
                <span className="text-[9px] font-bold">
                  RUL : {(vehicle.rulKilometersRemaining ?? 420).toLocaleString('fr-DZ')} km
                </span>
              </div>

              {/* Explicabilité XAI Bilingue (Français & Arabe RTL) */}
              <div
                className="p-2 rounded-xs flex flex-col gap-1.5 text-[10px]"
                style={{
                  backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                  border: '1px solid var(--df-cockpit-border)',
                }}
              >
                <div className="flex items-start gap-1.5">
                  <span className="font-bold font-mono text-[9px] text-blue-500 shrink-0">FR</span>
                  <span style={{ color: 'var(--df-cockpit-text-body)' }}>
                    {vehicle.arbitrageRecommendationFr ?? 'Intervention préventive recommandée pour sécuriser la continuité de mission.'}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 pt-1" style={{ borderTop: '1px solid var(--df-cockpit-border)' }} dir="rtl">
                  <span className="font-bold font-mono text-[9px] text-emerald-500 shrink-0">AR</span>
                  <span style={{ color: 'var(--df-cockpit-text-body)' }}>
                    {vehicle.arbitrageRecommendationAr ?? 'يوصى بالتدخل الوقائي الفوري لضمان استمرارية المهمة وتفادي الأعطال.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Odomètre & Compteurs d'heures certifiés */}
            <div
              className="p-2.5 rounded-sm text-[10px] font-mono flex items-center justify-between"
              style={{
                backgroundColor: 'var(--df-cockpit-card-bg)',
                border: '1px solid var(--df-cockpit-border)',
              }}
            >
              <div>
                <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="block">ODOMÈTRE TOTALISATEUR</span>
                <span
                  className="font-bold text-xs tabular-nums"
                  style={{ color: 'var(--df-cockpit-text-title)' }}
                >
                  {vehicle.odometerKm.toLocaleString()} km
                </span>
              </div>
              <div className="text-right">
                <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="block">HEURES MOTEUR</span>
                <span
                  className="font-bold text-xs tabular-nums"
                  style={{ color: 'var(--df-cockpit-text-title)' }}
                >
                  {vehicle.engineHours.toLocaleString()} h
                </span>
              </div>
            </div>
          </>
        ) : activeTab === 'PHYSICS_12' ? (
          /* Diagnostic Déterministe 12 Organes Physiques (VHI L-3.5) */
          <div className="flex flex-col gap-3">
            {/* 1. Cadre Maître VHI L-3.5 & Arbitrage de Sécurité */}
            <div
              className="p-3 rounded-sm flex flex-col gap-2.5"
              style={{
                backgroundColor: 'var(--df-cockpit-card-bg)',
                border: vehicle.hardVetoTriggered
                  ? '1px solid rgba(239, 68, 68, 0.7)'
                  : '1px solid var(--df-cockpit-border)',
              }}
            >
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--df-cockpit-text-title)' }}
                >
                  <IconActivity size={13} className="text-purple-500" />
                  Moyenne Harmonique Généralisée (L-3.5 Norm)
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold"
                  style={
                    vehicle.hardVetoTriggered
                      ? {
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                        }
                      : {
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        }
                  }
                >
                  {vehicle.vhiStatus || (vehicle.vhiHealthScore >= 80 ? 'OPTIMAL' : 'SURVEILLANCE')}
                </span>
              </div>

              {/* Jauge Principale VHI & Organe Goulot */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div
                  className="p-2 rounded-xs flex flex-col"
                  style={{
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    border: '1px solid var(--df-cockpit-border)',
                  }}
                >
                  <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px] uppercase">
                    Score Global VHI
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        vehicle.vhiHealthScore < 50
                          ? 'text-rose-500'
                          : vehicle.vhiHealthScore < 75
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                      }`}
                    >
                      {vehicle.vhiHealthScore}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>/ 100</span>
                  </div>
                  <span className="text-[8px] mt-1" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                    Norme L-3.5 déterministe
                  </span>
                </div>

                <div
                  className="p-2 rounded-xs flex flex-col"
                  style={{
                    backgroundColor: 'var(--df-cockpit-sidebar-bg)',
                    border: '1px solid var(--df-cockpit-border)',
                  }}
                >
                  <span style={{ color: 'var(--df-cockpit-text-muted)' }} className="text-[8px] uppercase">
                    Organe Goulot d&apos;Étranglement
                  </span>
                  <span className="font-bold text-xs truncate mt-0.5 text-amber-500">
                    {ORGAN_META[vehicle.bottleneckComponent || 'cylinderHead']?.fr || vehicle.bottleneckComponent || 'Culasse & Joint'}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[8px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                    <span>Score organe :</span>
                    <span className="font-bold text-amber-400">
                      {vehicle.bottleneckScore ?? Math.round(vehicle.vhiHealthScore * 0.9)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bannière Hard Veto si déclenché */}
              {vehicle.hardVetoTriggered && (
                <div
                  className="p-2.5 rounded-xs flex flex-col gap-1 text-[10.5px] font-mono"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                  }}
                >
                  <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                    <IconAlertTriangle size={14} className="shrink-0" />
                    <span>VERROUILLAGE SÉCURITÉ ACTIF (HARD VETO)</span>
                  </div>
                  <div className="text-rose-200 text-[10px] leading-tight">
                    L&apos;organe vital <strong>{ORGAN_META[vehicle.bottleneckComponent || 'cylinderHead']?.fr || 'Organe'}</strong> est dégradé à {vehicle.bottleneckScore ?? Math.round(vehicle.vhiHealthScore * 0.9)}% (seuil critique ≤ 35%).
                    Conformément à MASTER_SPEC v3.0, le véhicule est immédiatement consigné pour prévenir un incident mécanique majeur.
                  </div>
                </div>
              )}

              {/* Raccourcis Atelier */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/work-orders"
                  className="flex-1 py-1 px-2 rounded-xs text-[10px] font-bold text-center transition-colors"
                  style={{
                    backgroundColor: 'var(--df-accent-blue)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                  }}
                >
                  🔧 Ouvrir Ordre de Travail (OR)
                </Link>
                <Link
                  href={`/digital-twin?v=${vehicle.id}`}
                  className="flex-1 py-1 px-2 rounded-xs text-[10px] font-bold text-center transition-colors"
                  style={{
                    backgroundColor: 'var(--df-cockpit-card-bg)',
                    border: '1px solid var(--df-cockpit-border)',
                    color: 'var(--df-cockpit-text-title)',
                    textDecoration: 'none',
                  }}
                >
                  🧬 Jumeau Numérique 58 Wilayas
                </Link>
              </div>
            </div>

            {/* 2. Liste des 12 Organes Physiques Déterministes */}
            <div
              className="p-3 rounded-sm flex flex-col gap-2"
              style={{
                backgroundColor: 'var(--df-cockpit-card-bg)',
                border: '1px solid var(--df-cockpit-border)',
              }}
            >
              <div className="flex items-center justify-between pb-1.5" style={{ borderBottom: '1px solid var(--df-cockpit-border)' }}>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--df-cockpit-text-title)' }}
                >
                  <IconCpu size={13} className="text-blue-500" />
                  État d&apos;Usure des 12 Organes Physiques
                </span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                  Zéro Boîte Noire ML
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {Object.keys(vehicle.organDetails || buildOrganDetails(vehicle.vhiHealthScore, vehicle.bottleneckComponent || 'cylinderHead', vehicle.hardVetoTriggered || false)).map((key) => {
                  const organ = (vehicle.organDetails || buildOrganDetails(vehicle.vhiHealthScore, vehicle.bottleneckComponent || 'cylinderHead', vehicle.hardVetoTriggered || false))[key];
                  const meta = ORGAN_META[key] || {
                    fr: organ?.nameFr || key,
                    ar: organ?.nameAr || key,
                    law: 'Loi physique',
                    unit: '',
                    safetyVital: organ?.isVitalSafetyOrgan ?? false,
                  };
                  const isBottleneck = key === (vehicle.bottleneckComponent || 'cylinderHead');
                  const score = organ?.healthScore ?? 80;

                  let barColor = 'bg-emerald-500';
                  let textColor = 'text-emerald-500';
                  if (score < 60) {
                    barColor = 'bg-rose-500';
                    textColor = 'text-rose-500';
                  } else if (score < 80) {
                    barColor = 'bg-amber-500';
                    textColor = 'text-amber-500';
                  }

                  return (
                    <div
                      key={key}
                      className="p-2 rounded-xs flex flex-col gap-1.5 font-mono text-[10px]"
                      style={{
                        backgroundColor: isBottleneck
                          ? 'rgba(245, 158, 11, 0.08)'
                          : 'var(--df-cockpit-sidebar-bg)',
                        border: isBottleneck
                          ? '1px solid rgba(245, 158, 11, 0.4)'
                          : '1px solid var(--df-cockpit-border)',
                      }}
                    >
                      {/* Ligne En-Tête Organe */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold" style={{ color: 'var(--df-cockpit-text-title)' }}>
                            {meta.fr}
                          </span>
                          <span className="text-[9px] opacity-70" dir="rtl">
                            ({meta.ar})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {meta.safetyVital && (
                            <span
                              className="text-[8px] px-1 py-0.2 rounded-xs font-bold"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                              }}
                              title="Organe vital de sécurité (éligible au Hard Veto Sc ≤ 35)"
                            >
                              VITAL
                            </span>
                          )}
                          {isBottleneck && (
                            <span
                              className="text-[8px] px-1 py-0.2 rounded-xs font-bold"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                color: '#F59E0B',
                                border: '1px solid rgba(245, 158, 11, 0.5)',
                              }}
                              title="Organe limitant imposant le score VHI"
                            >
                              GOULOT
                            </span>
                          )}
                          <span className={`font-bold tabular-nums ${textColor}`}>
                            {score}%
                          </span>
                        </div>
                      </div>

                      {/* Barre d'usure */}
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--df-cockpit-border)' }}
                      >
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${Math.max(4, score)}%` }}
                        />
                      </div>

                      {/* Données physiques & RUL */}
                      <div className="flex items-center justify-between text-[9px]" style={{ color: 'var(--df-cockpit-text-muted)' }}>
                        <span>Loi : {meta.law}</span>
                        <span>
                          RUL :{' '}
                          <strong style={{ color: 'var(--df-cockpit-text-title)' }}>
                            {organ?.rulEstimate?.value?.toLocaleString() ?? 0} {organ?.rulEstimate?.unit ?? ''}
                          </strong>
                        </span>
                      </div>

                      {/* Synthèse explicable (XAI) */}
                      <div
                        className="text-[8.5px] leading-tight pt-1"
                        style={{
                          borderTop: '1px solid var(--df-cockpit-border)',
                          color: 'var(--df-cockpit-text-muted)',
                        }}
                      >
                        {organ?.physicalSummary}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Inspecteur CAN console temps réel */
          <div className="flex-1 flex flex-col h-full min-h-[400px]">
            <LiveCanConsole frames={rawCanFrames} />
          </div>
        )}
      </div>

      {/* Footer Cockpit */}
      <div
        className="p-2 text-[10px] font-mono flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          borderTop: '1px solid var(--df-cockpit-border)',
          color: 'var(--df-cockpit-text-muted)',
        }}
      >
        <span style={{ color: 'var(--df-cockpit-text-muted)' }}>ID: {vehicle.id}</span>
        <span className="font-bold" style={{ color: 'var(--df-status-ok-text)' }}>
          Loi 18-07 ANPDP Conforme
        </span>
      </div>
    </aside>
  );
}
