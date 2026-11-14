'use client';

import React from 'react';
import {
  IconPlus,
  IconFileText,
  IconCheck,
  IconAlertTriangle,
} from '@/components/navigation/TechIcons';
import type { PlatformDecisionEngineConfig } from '../types';

interface DecisionEngineHeaderProps {
  selectedConfig: PlatformDecisionEngineConfig | null;
  isProcessing: boolean;
  actionSuccess: string | null;
  error: string | null;
  onOpenCreate: (baseConfig?: PlatformDecisionEngineConfig) => void;
  onRollback: () => void;
}

export function DecisionEngineHeader({
  selectedConfig,
  isProcessing,
  actionSuccess,
  error,
  onOpenCreate,
  onRollback,
}: DecisionEngineHeaderProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Gouvernance &amp; Cycle de Vie du Moteur Décisionnel (6 Physiques)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Création de versions (Draft), calibration des 6 modèles déterministes, banc d’essai et activation transactionnelle.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenCreate()}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-accent-blue)',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconPlus size={14} />
            Nouvelle Version (Draft)
          </button>

          {selectedConfig && (
            <button
              onClick={() => onOpenCreate(selectedConfig)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconFileText size={14} />
              Dupliquer la Version
            </button>
          )}

          <button
            onClick={onRollback}
            disabled={isProcessing}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Rollback
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconCheck size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
