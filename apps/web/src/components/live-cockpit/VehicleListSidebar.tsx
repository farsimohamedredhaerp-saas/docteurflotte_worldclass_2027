'use client';

import React, { useState } from 'react';
import { VehicleTelemetryState, VehicleOperationalStatus } from './types';
import {
  IconTruck,
  IconChevronLeft,
  IconChevronRight,
  IconAlertTriangle,
  IconFlame,
  IconCheck,
  IconRadio,
} from '../navigation/TechIcons';

interface VehicleListSidebarProps {
  vehicles: VehicleTelemetryState[];
  selectedVehicleId?: string;
  onSelectVehicle: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchFilter: string;
}

type FilterCategory = 'ALL' | 'MOTION' | 'IDLE' | 'DTC' | 'OFFLINE';

export function VehicleListSidebar({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  isCollapsed,
  onToggleCollapse,
  searchFilter,
}: VehicleListSidebarProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');

  // Filtrage local selon statut et recherche
  const filteredVehicles = vehicles.filter((v) => {
    // Filtre de statut
    if (activeFilter === 'MOTION' && v.status !== 'MOTION') return false;
    if (activeFilter === 'IDLE' && v.status !== 'IDLE_WARNING') return false;
    if (activeFilter === 'DTC' && v.status !== 'DTC_CRITICAL') return false;
    if (
      activeFilter === 'OFFLINE' &&
      v.status !== 'OFFLINE' &&
      v.status !== 'PARKED_OFF'
    )
      return false;

    // Filtre texte
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const matchPlate = v.registrationNumber.toLowerCase().includes(q);
      const matchVin = v.vin.toLowerCase().includes(q);
      const matchDriver = v.driverName.toLowerCase().includes(q);
      const matchModel = `${v.make} ${v.model}`.toLowerCase().includes(q);
      const matchWilaya = v.wilayaCode.toLowerCase().includes(q);
      const matchDtc = v.activeDtcs.some((d) =>
        d.codeString.toLowerCase().includes(q)
      );
      return matchPlate || matchVin || matchDriver || matchModel || matchWilaya || matchDtc;
    }

    return true;
  });

  if (isCollapsed) {
    return (
      <aside
        onClick={onToggleCollapse}
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
          borderRight: '1px solid var(--df-cockpit-border)',
          cursor: 'pointer',
        }}
        title="Cliquer pour réouvrir la liste des véhicules (ou Ctrl+B)"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="w-7 h-7 rounded-sm flex items-center justify-center transition-colors cursor-pointer group-hover:border-blue-500 group-hover:text-blue-500 shadow-sm"
          style={{
            backgroundColor: 'var(--df-cockpit-card-bg)',
            border: '1px solid var(--df-cockpit-border)',
            color: 'var(--df-accent-blue)',
          }}
          title="Déplier la liste des véhicules (ou raccourci Ctrl+B)"
        >
          <IconChevronRight size={15} strokeWidth={2.5} />
        </button>
        <div className="mt-4 flex flex-col gap-2 items-center pointer-events-none">
          <IconTruck size={14} style={{ color: 'var(--df-accent-blue)' }} />
          <span
            className="text-[10px] font-mono [writing-mode:vertical-rl] tracking-wider uppercase font-semibold mt-2"
            style={{ color: 'var(--df-cockpit-text-muted)' }}
          >
            Unités Actives ({vehicles.length})
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-[300px] flex flex-col shrink-0 select-none z-20 h-full overflow-hidden transition-colors"
      style={{
        width: '300px',
        minWidth: '300px',
        maxWidth: '300px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxSizing: 'border-box',
        backgroundColor: 'var(--df-cockpit-sidebar-bg)',
        borderRight: '1px solid var(--df-cockpit-border)',
      }}
    >
      {/* En-tête Sidebar & Bouton Repli */}
      <div
        className="h-10 px-3 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          borderBottom: '1px solid var(--df-cockpit-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <IconTruck size={14} style={{ color: 'var(--df-cockpit-text-muted)' }} />
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--df-cockpit-text-title)' }}
          >
            Unités Télémétriques
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs"
            style={{
              backgroundColor: 'var(--df-cockpit-card-hover)',
              color: 'var(--df-cockpit-text-muted)',
              border: '1px solid var(--df-cockpit-border)',
            }}
          >
            {filteredVehicles.length}
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 rounded-xs flex items-center justify-center transition-colors cursor-pointer"
          style={{
            border: '1px solid var(--df-cockpit-border)',
            color: 'var(--df-cockpit-text-muted)',
          }}
          title="Replier le panneau"
        >
          <IconChevronLeft size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Onglets de filtrage par état opérationnel */}
      <div
        className="p-1.5 shrink-0"
        style={{
          backgroundColor: 'var(--df-cockpit-sidebar-bg)',
          borderBottom: '1px solid var(--df-cockpit-border)',
        }}
      >
        <div className="grid grid-cols-5 gap-1 text-[9px] font-mono">
          <button
            onClick={() => setActiveFilter('ALL')}
            className="py-1 rounded-xs uppercase tracking-tight text-center transition-colors cursor-pointer"
            style={
              activeFilter === 'ALL'
                ? {
                    backgroundColor: 'var(--df-cockpit-card-hover)',
                    color: 'var(--df-cockpit-text-title)',
                    border: '1px solid var(--df-cockpit-border-strong)',
                    fontWeight: 700,
                  }
                : {
                    color: 'var(--df-cockpit-text-muted)',
                    backgroundColor: 'transparent',
                  }
            }
          >
            Tous ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveFilter('MOTION')}
            className="py-1 rounded-xs uppercase tracking-tight text-center transition-colors cursor-pointer"
            style={
              activeFilter === 'MOTION'
                ? {
                    backgroundColor: 'var(--df-status-ok-bg)',
                    color: 'var(--df-status-ok-text)',
                    border: '1px solid var(--df-status-ok-border)',
                    fontWeight: 700,
                  }
                : {
                    color: 'var(--df-status-ok-text)',
                    opacity: 0.8,
                    backgroundColor: 'transparent',
                  }
            }
          >
            Route
          </button>
          <button
            onClick={() => setActiveFilter('IDLE')}
            className="py-1 rounded-xs uppercase tracking-tight text-center transition-colors cursor-pointer"
            style={
              activeFilter === 'IDLE'
                ? {
                    backgroundColor: 'var(--df-status-warning-bg)',
                    color: 'var(--df-status-warning-text)',
                    border: '1px solid var(--df-status-warning-border)',
                    fontWeight: 700,
                  }
                : {
                    color: 'var(--df-status-warning-text)',
                    opacity: 0.8,
                    backgroundColor: 'transparent',
                  }
            }
          >
            Ralenti
          </button>
          <button
            onClick={() => setActiveFilter('DTC')}
            className="py-1 rounded-xs uppercase tracking-tight text-center transition-colors cursor-pointer"
            style={
              activeFilter === 'DTC'
                ? {
                    backgroundColor: 'var(--df-status-danger-bg)',
                    color: 'var(--df-status-danger-text)',
                    border: '1px solid var(--df-status-danger-border)',
                    fontWeight: 700,
                  }
                : {
                    color: 'var(--df-status-danger-text)',
                    opacity: 0.8,
                    backgroundColor: 'transparent',
                  }
            }
          >
            DTC
          </button>
          <button
            onClick={() => setActiveFilter('OFFLINE')}
            className="py-1 rounded-xs uppercase tracking-tight text-center transition-colors cursor-pointer"
            style={
              activeFilter === 'OFFLINE'
                ? {
                    backgroundColor: 'var(--df-cockpit-card-hover)',
                    color: 'var(--df-cockpit-text-title)',
                    border: '1px solid var(--df-cockpit-border-strong)',
                    fontWeight: 700,
                  }
                : {
                    color: 'var(--df-cockpit-text-muted)',
                    backgroundColor: 'transparent',
                  }
            }
          >
            Arrêt
          </button>
        </div>
      </div>

      {/* Liste Déroulante des Véhicules */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredVehicles.length === 0 ? (
          <div
            className="p-6 text-center font-mono text-[11px]"
            style={{ color: 'var(--df-cockpit-text-muted)' }}
          >
            Aucun actif ne correspond aux filtres.
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId;
            const hasDtc = vehicle.activeDtcs.length > 0;
            const hasFuelAnomaly = vehicle.can.fuelDropAnomalyDetected;

            // Statut visuel
            let statusDot = 'bg-slate-400';
            let statusLabel = 'Arrêt';
            let statusBadgeStyle: React.CSSProperties = {
              backgroundColor: 'var(--df-cockpit-card-bg)',
              color: 'var(--df-cockpit-text-muted)',
              border: '1px solid var(--df-cockpit-border)',
            };

            if (vehicle.status === 'MOTION') {
              statusDot = 'bg-emerald-500';
              statusLabel = `${Math.round(vehicle.gps.speedKmh)} km/h`;
              statusBadgeStyle = {
                backgroundColor: 'var(--df-status-ok-bg)',
                color: 'var(--df-status-ok-text)',
                border: '1px solid var(--df-status-ok-border)',
              };
            } else if (vehicle.status === 'IDLE_WARNING') {
              statusDot = 'bg-amber-500';
              statusLabel = 'Ralenti (850 RPM)';
              statusBadgeStyle = {
                backgroundColor: 'var(--df-status-warning-bg)',
                color: 'var(--df-status-warning-text)',
                border: '1px solid var(--df-status-warning-border)',
              };
            } else if (vehicle.status === 'DTC_CRITICAL') {
              statusDot = 'bg-rose-500 animate-pulse';
              statusLabel = 'Défaut Critique';
              statusBadgeStyle = {
                backgroundColor: 'var(--df-status-danger-bg)',
                color: 'var(--df-status-danger-text)',
                border: '1px solid var(--df-status-danger-border)',
              };
            }

            // Health color
            let healthStyle: React.CSSProperties = {
              backgroundColor: 'var(--df-status-ok-bg)',
              color: 'var(--df-status-ok-text)',
              border: '1px solid var(--df-status-ok-border)',
            };
            if (vehicle.vhiHealthScore < 70) {
              healthStyle = {
                backgroundColor: 'var(--df-status-warning-bg)',
                color: 'var(--df-status-warning-text)',
                border: '1px solid var(--df-status-warning-border)',
              };
            }
            if (vehicle.vhiHealthScore < 50) {
              healthStyle = {
                backgroundColor: 'var(--df-status-danger-bg)',
                color: 'var(--df-status-danger-text)',
                border: '1px solid var(--df-status-danger-border)',
              };
            }

            return (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle(vehicle.id)}
                className="p-2.5 cursor-pointer transition-all flex flex-col gap-1.5"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--df-cockpit-card-bg)'
                    : 'transparent',
                  borderLeft: isSelected
                    ? '3px solid #2563EB'
                    : '3px solid transparent',
                  borderBottom: '1px solid var(--df-cockpit-border)',
                }}
              >
                {/* Ligne 1 : Matricule, Badge Statut & VHI */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`}
                    />
                    <span
                      className="font-mono text-xs font-bold tracking-tight"
                      style={{ color: 'var(--df-cockpit-text-title)' }}
                    >
                      {vehicle.registrationNumber}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1 py-0.2 rounded-xs"
                      style={{
                        backgroundColor: 'var(--df-cockpit-card-bg)',
                        border: '1px solid var(--df-cockpit-border)',
                        color: 'var(--df-cockpit-text-muted)',
                      }}
                    >
                      W{vehicle.wilayaCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Badge VHI */}
                    <span
                      className="text-[9px] font-mono px-1 py-0.2 rounded-xs border tabular-nums font-semibold"
                      style={healthStyle}
                      title={`Score de Santé VHI: ${vehicle.vhiHealthScore}/100`}
                    >
                      {vehicle.vhiHealthScore}
                    </span>

                    {/* Vitesse / État */}
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs border tabular-nums font-semibold"
                      style={statusBadgeStyle}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Ligne 2 : Marque, Modèle & Chauffeur */}
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className="truncate max-w-[170px] font-medium"
                    style={{ color: 'var(--df-cockpit-text-body)' }}
                  >
                    {vehicle.make} {vehicle.model}
                  </span>
                  <span
                    className="text-[10px] font-mono truncate max-w-[90px]"
                    style={{ color: 'var(--df-cockpit-text-muted)' }}
                  >
                    {vehicle.driverName}
                  </span>
                </div>

                {/* Ligne 3 : Jauges Miniatures (Carburant, Signal GSM, Anomalies) */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  {/* Niveau Carburant */}
                  <div className="flex items-center gap-1.5 flex-1">
                    <div
                      className="w-full rounded-xs h-1 overflow-hidden"
                      style={{ backgroundColor: 'var(--df-cockpit-border)' }}
                    >
                      <div
                        className={`h-full transition-all ${
                          vehicle.can.fuelLevelPercent < 20
                            ? 'bg-rose-500'
                            : vehicle.can.fuelLevelPercent < 35
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${vehicle.can.fuelLevelPercent}%` }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-mono tabular-nums shrink-0"
                      style={{ color: 'var(--df-cockpit-text-muted)' }}
                    >
                      {vehicle.can.fuelLevelPercent}%
                    </span>
                  </div>

                  {/* Badges d'alertes spéciales */}
                  <div className="flex items-center gap-1 shrink-0">
                    {hasFuelAnomaly && (
                      <span
                        className="px-1 py-0.2 rounded-xs text-[8px] font-mono font-bold animate-pulse"
                        style={{
                          backgroundColor: 'var(--df-status-danger-bg)',
                          border: '1px solid var(--df-status-danger-border)',
                          color: 'var(--df-status-danger-text)',
                        }}
                        title="Alerte Chute Anormale de Carburant (CUSUM)"
                      >
                        FRAUDE
                      </span>
                    )}

                    {hasDtc && (
                      <span
                        className="px-1 py-0.2 rounded-xs text-[8px] font-mono font-bold"
                        style={{
                          backgroundColor: 'var(--df-status-warning-bg)',
                          border: '1px solid var(--df-status-warning-border)',
                          color: 'var(--df-status-warning-text)',
                        }}
                        title={`${vehicle.activeDtcs.length} Code(s) DTC Actif(s)`}
                      >
                        {vehicle.activeDtcs[0].codeString}
                      </span>
                    )}

                    {/* GSM RSSI indicator */}
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: 'var(--df-cockpit-text-muted)' }}
                      title={`Signal GSM: ${vehicle.hardware.rssiGsmDbm} dBm (${vehicle.hardware.cellularOperator})`}
                    >
                      {vehicle.hardware.rssiGsmDbm > -85
                        ? '●●●'
                        : vehicle.hardware.rssiGsmDbm > -100
                        ? '●●○'
                        : '●○○'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pied de Sidebar : Raccourcis et Informations Système */}
      <div
        className="p-2 text-[10px] font-mono flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--df-cockpit-card-bg)',
          borderTop: '1px solid var(--df-cockpit-border)',
          color: 'var(--df-cockpit-text-muted)',
        }}
      >
        <span className="flex items-center gap-1">
          <IconRadio size={11} className="text-emerald-500" />
          GSM: Algérie Télécom / Djezzy / Ooredoo
        </span>
        <span className="uppercase font-semibold" style={{ color: 'var(--df-status-ok-text)' }}>
          100% Souverain
        </span>
      </div>
    </aside>
  );
}
