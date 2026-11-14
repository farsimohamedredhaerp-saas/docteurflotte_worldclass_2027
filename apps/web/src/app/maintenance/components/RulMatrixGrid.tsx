'use client';

import React from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { IconActivity, IconFileText } from '@/components/navigation/TechIcons';
import type { SubsystemType, VehicleAssetRecord } from '../types';

export function RulMatrixGrid() {
  const {
    filteredFleet,
    expandedAssetIds,
    toggleAssetExpand,
    toggleAllAssetsExpand,
    setSelectedProofAsset,
    setSelectedProofSubsystem,
  } = useMaintenance();

  const handleOpenProof = (asset: VehicleAssetRecord, subsystem: SubsystemType = 'ENGINE') => {
    setSelectedProofSubsystem(subsystem);
    setSelectedProofAsset(asset);
  };

  if (filteredFleet.length === 0) {
    return (
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-md)',
          padding: '48px 20px',
          textAlign: 'center',
          color: 'var(--df-text-secondary)',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px' }}>
          Aucun actif ne correspond aux filtres techniques sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Bar with Expand All */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
        <button
          type="button"
          onClick={toggleAllAssetsExpand}
          style={{
            background: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-medium)',
            color: 'var(--df-text-secondary)',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '11.5px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {expandedAssetIds.size === filteredFleet.length ? 'Réduire Tout' : 'Développer Tout'}
        </button>
      </div>

      {/* Fleet Cards */}
      {filteredFleet.map((vehicle) => {
        const isExpanded = expandedAssetIds.has(vehicle.id);
        const healthColor =
          vehicle.globalHealthScore >= 80
            ? '#10B981'
            : vehicle.globalHealthScore >= 50
            ? '#F59E0B'
            : '#EF4444';

        // Find most critical subsystem
        const subsystemsEntries = Object.entries(vehicle.subsystems) as [SubsystemType, any][];
        const mostCritical = subsystemsEntries.reduce((prev, curr) => {
          const prevHours = prev[1].rulRemainingHours ?? 99999;
          const currHours = curr[1].rulRemainingHours ?? 99999;
          return currHours < prevHours ? curr : prev;
        }, subsystemsEntries[0]);

        return (
          <div
            key={vehicle.id}
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--df-shadow-xs)',
              transition: 'border-color 0.15s ease',
            }}
          >
            {/* Card Summary Header */}
            <div
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                background: isExpanded ? 'var(--df-bg-surface-2)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => toggleAssetExpand(vehicle.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: `${healthColor}15`,
                    border: `1px solid ${healthColor}35`,
                    color: healthColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800,
                    fontSize: '13px',
                  }}
                >
                  {vehicle.globalHealthScore}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 800,
                        fontSize: '14px',
                        color: '#fff',
                      }}
                    >
                      {vehicle.registrationNumber}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {vehicle.protocolType}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
                    {vehicle.make} {vehicle.model} ({vehicle.year}) • {vehicle.currentOdometerKm.toLocaleString('fr-FR')} km • {vehicle.currentEngineHours} h
                  </div>
                </div>
              </div>

              {/* Critical Alert summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                    Organe le plus critique :
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: mostCritical[1].status === 'CRITICAL_OVERDUE' ? '#EF4444' : '#F59E0B' }}>
                    {mostCritical[0].replace('_', ' ')} : {mostCritical[1].rulRemainingHours?.toFixed(1) ?? '--'} h ({mostCritical[1].rulRemainingKm?.toFixed(0) ?? '--'} km)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProof(vehicle, mostCritical[0]);
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#7dd3fc',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <IconFileText size={12} />
                  <span>Preuve XAI</span>
                </button>

                <span style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded Subsystems Details */}
            {isExpanded && (
              <div
                style={{
                  padding: '14px 18px',
                  borderTop: '1px solid var(--df-border-subtle)',
                  background: 'var(--df-bg-base)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '10px',
                }}
              >
                {subsystemsEntries.map(([subsystemKey, subData]) => {
                  const statusColor =
                    subData.status === 'OPTIMAL'
                      ? '#10B981'
                      : subData.status === 'ATTENTION_REQUIRED'
                      ? '#F59E0B'
                      : '#EF4444';

                  return (
                    <div
                      key={subsystemKey}
                      style={{
                        background: 'var(--df-bg-surface-1)',
                        border: '1px solid var(--df-border-subtle)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                          {subsystemKey.replace('_', ' ')}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: `${statusColor}18`,
                            color: statusColor,
                            border: `1px solid ${statusColor}35`,
                          }}
                        >
                          {subData.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                        <div>RUL : <strong style={{ color: '#fff' }}>{subData.rulRemainingHours?.toFixed(1) ?? '--'} h</strong></div>
                        <div>Km : <strong style={{ color: '#fff' }}>{subData.rulRemainingKm?.toFixed(0) ?? '--'} km</strong></div>
                        <div>P_fail (30j) : <strong style={{ color: subData.failureProbability30d > 0.4 ? '#EF4444' : '#10B981' }}>{(subData.failureProbability30d * 100).toFixed(0)}%</strong></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenProof(vehicle, subsystemKey)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '10px',
                          textAlign: 'left',
                          padding: '2px 0 0',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconActivity size={10} />
                        <span>Formule physique &rsaquo;</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

