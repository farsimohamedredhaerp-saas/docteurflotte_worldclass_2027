'use client';

import React from 'react';
import {
  IconActivity,
  IconEdit,
  IconCheck,
  IconZap,
} from '@/components/navigation/TechIcons';
import type { PlatformDecisionEngineConfig } from '../types';

interface VersionSelectorBarProps {
  configs: PlatformDecisionEngineConfig[];
  selectedConfigId: string;
  selectedConfig: PlatformDecisionEngineConfig | null;
  isSimulating: boolean;
  onSelectConfigId: (id: string) => void;
  onRunSimulation: (config: PlatformDecisionEngineConfig) => void;
  onOpenEditModal: (config: PlatformDecisionEngineConfig) => void;
  onApproveDraft: (id: string, version: string) => void;
  onOpenActivateModal: () => void;
}

export function VersionSelectorBar({
  configs,
  selectedConfigId,
  selectedConfig,
  isSimulating,
  onSelectConfigId,
  onRunSimulation,
  onOpenEditModal,
  onApproveDraft,
  onOpenActivateModal,
}: VersionSelectorBarProps) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-muted)' }}>
          VERSION INSPECTÉE :
        </span>
        <select
          value={selectedConfigId}
          onChange={(e) => onSelectConfigId(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-subtle)',
            color: 'var(--df-text-main)',
            fontSize: '14px',
            fontWeight: 700,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {configs.map((c, idx) => (
            <option key={`${c.id}-${idx}`} value={c.id}>
              {c.version} — [{c.status}] {c.is_active_publication ? '(Active en Production)' : ''}
            </option>
          ))}
        </select>

        {selectedConfig && (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              backgroundColor:
                selectedConfig.status === 'APPROVED'
                  ? 'rgba(59, 130, 246, 0.15)'
                  : selectedConfig.is_active_publication
                  ? 'rgba(16, 185, 129, 0.15)'
                  : selectedConfig.status === 'DRAFT'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color:
                selectedConfig.status === 'APPROVED'
                  ? '#60a5fa'
                  : selectedConfig.is_active_publication
                  ? '#34d399'
                  : selectedConfig.status === 'DRAFT'
                  ? '#fbbf24'
                  : '#fca5a5',
              border: '1px solid currentColor',
            }}
          >
            {selectedConfig.is_active_publication ? '● PUBLICATION ACTIVE (PROD)' : `STATUT : ${selectedConfig.status}`}
          </span>
        )}
      </div>

      {/* Action Buttons for Selected Version */}
      {selectedConfig && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onRunSimulation(selectedConfig)}
            disabled={isSimulating}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-bg-surface-2)',
              border: '1px solid #818cf8',
              color: '#818cf8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isSimulating ? (
              <>
                <IconActivity size={14} className="inline animate-spin" /> Calcul en cours...
              </>
            ) : (
              <>
                <IconActivity size={14} className="inline" /> Simuler sur Banc d’Essai
              </>
            )}
          </button>

          {selectedConfig.status === 'DRAFT' && (
            <>
              <button
                onClick={() => onOpenEditModal(selectedConfig)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  color: 'var(--df-text-main)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconEdit size={14} /> Modifier les Paramètres
              </button>

              <button
                onClick={() => onApproveDraft(selectedConfig.id, selectedConfig.version)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid #3b82f6',
                  color: '#93c5fd',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconCheck size={14} /> Approuver (Maker-Checker)
              </button>
            </>
          )}

          {selectedConfig.status === 'APPROVED' && !selectedConfig.is_active_publication && (
            <button
              onClick={onOpenActivateModal}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconZap size={14} /> Activer en Production
            </button>
          )}
        </div>
      )}
    </div>
  );
}
