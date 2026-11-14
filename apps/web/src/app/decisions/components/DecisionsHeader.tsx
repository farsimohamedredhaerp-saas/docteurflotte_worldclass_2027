'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconWrench,
  IconZap,
  IconRefreshCw,
  IconX,
} from '@/components/navigation/TechIcons';
import type { DecisionsTab } from '../types';

interface DecisionsHeaderProps {
  activeTab: DecisionsTab;
  onTabChange: (tab: DecisionsTab) => void;
  notification: string | null;
  onDismissNotification: () => void;
  isEvaluating: boolean;
  isEvaluatingDispatch: boolean;
  onEvaluateMaintenance: () => void;
  onEvaluateDispatch: () => void;
}

export function DecisionsHeader({
  activeTab,
  onTabChange,
  notification,
  onDismissNotification,
  isEvaluating,
  isEvaluatingDispatch,
  onEvaluateMaintenance,
  onEvaluateDispatch,
}: DecisionsHeaderProps) {
  return (
    <>
      {notification && (
        <div
          role="status"
          style={{
            background: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-accent-primary)',
            color: 'var(--df-text-main)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--df-radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600 }}>{notification}</span>
          <button
            onClick={onDismissNotification}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--df-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Fermer"
          >
            <IconX size={14} />
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <Badge variant="ok">Moteur d&apos;Arbitrages &amp; Décision ADS • Gates 4 &amp; 5</Badge>
          </div>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              color: 'var(--df-text-main)',
              letterSpacing: '-0.02em',
              margin: '0 0 0.5rem 0',
            }}
          >
            Cockpit Décisionnel &amp; Affectation ADS
          </h1>
          <p style={{ color: 'var(--df-text-secondary)', margin: 0, maxWidth: '780px' }}>
            Arbitrages déterministes et explicables : calcul du coût de l&apos;action préventive immédiate face au risque économique de l&apos;inaction,
            et validation en 4 Portes Réglementaires Algériennes (ENACTA, Assurances, Arrêtés Wilayas, VHI et Substitution TOPSIS).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {activeTab === 'MAINTENANCE' ? (
            <Button
              variant="primary"
              onClick={onEvaluateMaintenance}
              disabled={isEvaluating}
            >
              {isEvaluating ? (
                <>
                  <IconRefreshCw size={14} className="animate-spin inline mr-1" />
                  Évaluation en cours...
                </>
              ) : (
                <>
                  <IconZap size={14} className="inline mr-1" />
                  Évaluer la flotte maintenant
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onEvaluateDispatch}
              disabled={isEvaluatingDispatch}
            >
              {isEvaluatingDispatch ? (
                <>
                  <IconRefreshCw size={14} className="animate-spin inline mr-1" />
                  Analyse ADS...
                </>
              ) : (
                <>
                  <IconZap size={14} className="inline mr-1" />
                  Lancer le Dispatch ADS
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--df-border-subtle)',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange('MAINTENANCE')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--df-radius-md)',
            border: 'none',
            background: activeTab === 'MAINTENANCE' ? 'var(--df-primary)' : 'transparent',
            color: activeTab === 'MAINTENANCE' ? '#fff' : 'var(--df-text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <IconWrench size={16} /> Arbitrages Maintenance &amp; Inaction (Gate 4)
        </button>
        <button
          type="button"
          onClick={() => onTabChange('DISPATCH')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--df-radius-md)',
            border: 'none',
            background: activeTab === 'DISPATCH' ? 'var(--df-primary)' : 'transparent',
            color: activeTab === 'DISPATCH' ? '#fff' : 'var(--df-text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <IconZap size={16} /> Moteur Décisionnel de Dispatch ADS (Gate 5)
        </button>
      </div>
    </>
  );
}

