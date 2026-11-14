'use client';

import React from 'react';
import { IconZap } from '@/components/navigation/TechIcons';
import { ModalErrorBoundary } from '@/components/ui/ModalErrorBoundary';
import type { PlatformDecisionEngineConfig } from '../../types';

interface ActivateConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConfig: PlatformDecisionEngineConfig | null;
  activationJustification: string;
  setActivationJustification: (val: string) => void;
  isProcessing: boolean;
  onActivate: (e: React.FormEvent) => void;
}

export function ActivateConfigModal({
  isOpen,
  onClose,
  selectedConfig,
  activationJustification,
  setActivationJustification,
  isProcessing,
  onActivate,
}: ActivateConfigModalProps) {
  if (!isOpen || !selectedConfig) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--df-bg-surface-1)',
          borderRadius: '16px',
          border: '1px solid var(--df-border-subtle)',
          padding: '28px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--df-shadow-lg)',
        }}
      >
        <ModalErrorBoundary onReset={onClose}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: 'var(--df-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconZap size={18} className="text-emerald-400" /> Activation en Production : {selectedConfig.version}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Vous êtes sur le point d&apos;activer cette configuration au statut <strong>APPROVED</strong> en tant que nouvelle baseline active. Cette opération clôturera automatiquement la publication active précédente dans le grand livre append-only et notifiera le bus Outbox pour invalidation des caches runtime.
          </p>

          <form onSubmit={onActivate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                Motif d&apos;Ingénierie pour la Piste d&apos;Audit (Obligatoire)
              </label>
              <textarea
                required
                rows={3}
                value={activationJustification}
                onChange={(e) => setActivationJustification(e.target.value)}
                placeholder="ex: Mise en production de la baseline validée par le comité technique pour le climat estival saharien..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '9px 16px', borderRadius: '8px', background: 'none', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '13px', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                style={{ padding: '9px 20px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                {isProcessing ? 'Activation...' : 'Confirmer & Publier en Prod'}
              </button>
            </div>
          </form>
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
