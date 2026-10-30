import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { CalculationProofButton } from './decisions/CalculationProofButton';

export interface DecisionCardProps {
  assetId: string;
  assetName: string;
  assetCategory: string;
  urgency: 'warning' | 'danger' | 'info';
  anomalyTitle: string;
  anomalyDescription: string;
  costEstimate: string;
  costInactionEstimate?: string;
  confidenceScore: number;
  isDemo?: boolean;
  telemetryDetails?: {
    lastPing?: string;
    ignition?: 'ON' | 'OFF';
    gpsFix?: boolean;
    currentSpeed?: number;
  };
  onShowProof?: () => void;
  onApprove?: () => void;
  onDismiss?: () => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  assetId,
  assetName,
  assetCategory,
  urgency,
  anomalyTitle,
  anomalyDescription,
  costEstimate,
  costInactionEstimate,
  confidenceScore,
  isDemo = false,
  telemetryDetails = {
    lastPing: '< 2 min',
    ignition: 'ON',
    gpsFix: true,
    currentSpeed: 0,
  },
  onShowProof,
  onApprove,
  onDismiss,
}) => {
  return (
    <Card
      style={{
        borderLeft: `4px solid var(--df-status-${urgency})`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        {/* EN-TÊTE DE LA CARTE DÉCISIONNELLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.01em' }}>
                {assetName}
              </span>
              <span
                className="df-mono"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--df-radius-xs)',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-muted)',
                  border: '1px solid var(--df-border-subtle)',
                }}
              >
                {assetId}
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--df-text-faint)', fontWeight: 500 }}>
              Catégorie : {assetCategory}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {isDemo && <Badge variant="demo">DEMO</Badge>}
            <Badge variant={urgency} pulse={urgency === 'danger'}>
              {urgency === 'danger' ? 'Critique' : urgency === 'warning' ? 'À Prévoir' : 'Recommandation'}
            </Badge>
          </div>
        </div>

        {/* BANDE TÉLÉMATIQUE DE PRÉCISION (FLESPI CONSOLE STYLE) */}
        <div
          className="df-telemetry-strip"
          style={{ marginBottom: '0.85rem', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="df-pulse-live" />
            <span>Traccar IoT : {telemetryDetails.lastPing}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <span>Contact : <strong style={{ color: telemetryDetails.ignition === 'ON' ? 'var(--df-status-ok)' : 'var(--df-text-muted)' }}>{telemetryDetails.ignition}</strong></span>
            <span>GPS Fix : <strong style={{ color: telemetryDetails.gpsFix ? 'var(--df-accent-cyan)' : 'var(--df-status-danger)' }}>{telemetryDetails.gpsFix ? '14 sats' : 'Perdu'}</strong></span>
          </div>
        </div>

        {/* BLOC ANOMALIE & JUSTIFICATION MÉCANIQUE */}
        <div
          style={{
            background: 'var(--df-bg-surface-2)',
            borderRadius: 'var(--df-radius-md)',
            padding: '0.9rem 1rem',
            marginBottom: '1rem',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
            {anomalyTitle}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
            {anomalyDescription}
          </p>
        </div>

        {/* CARTES ÉCONOMIQUES DÉCISIONNELLES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: costInactionEstimate ? '1fr 1fr' : '1fr',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              background: 'var(--df-accent-blue-subtle)',
              border: '1px solid var(--df-border-subtle)',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--df-radius-sm)',
            }}
          >
            <div style={{ color: 'var(--df-text-faint)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Coût Estimé Action
            </div>
            <div className="df-mono" style={{ color: 'var(--df-accent-blue)', fontWeight: 800, fontSize: '1.05rem', marginTop: '0.2rem' }}>
              {costEstimate}
            </div>
          </div>

          {costInactionEstimate && (
            <div
              style={{
                background: 'var(--df-status-danger-bg)',
                border: '1px solid var(--df-status-danger-border)',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--df-radius-sm)',
              }}
            >
              <div style={{ color: 'var(--df-status-danger)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Coût de l&apos;Inaction
              </div>
              <div className="df-mono" style={{ color: 'var(--df-status-danger)', fontWeight: 800, fontSize: '1.05rem', marginTop: '0.2rem' }}>
                {costInactionEstimate}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PIED DE CARTE AVEC SCORE D'EXPLICABILITÉ ET ACTIONS */}
      <div
        style={{
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--df-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '48px' }}>
            <div className="df-gauge">
              <div
                className="df-gauge-fill df-gauge-ok"
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--df-text-faint)' }}>
            Explicabilité : <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>{confidenceScore}%</strong>
          </span>
          {onShowProof && (
            <CalculationProofButton
              label="Preuve de calcul"
              size="xs"
              variant="cyan"
              onClick={onShowProof}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Différer
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onApprove}>
            Créer l&apos;Ordre de Travail
          </Button>
        </div>
      </div>
    </Card>
  );
};
