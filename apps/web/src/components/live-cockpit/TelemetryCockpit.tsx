'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VehicleTelemetryState, CanRawFrame } from './types';
import { TelemetryGauges } from './TelemetryGauges';
import { LiveCanConsole } from './LiveCanConsole';
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
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'CAN_CONSOLE'>('TELEMETRY');
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

      {/* Onglets Cockpit : Vue Télémétrie vs Inspecteur CAN Console */}
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
          Jauges OBD-II / J1939
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
          Console Trame CAN Brute ({rawCanFrames.length})
        </button>
      </div>

      {/* Contenu Déroulant */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin">
        {activeTab === 'TELEMETRY' ? (
          <>
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
