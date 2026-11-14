'use client';

import React from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { IconCheck } from '@/components/navigation/TechIcons';
import { CalculationProofButton } from '@/components/decisions';
import type { DecisionItem } from '../types';

interface DecisionCardProps {
  decision: DecisionItem;
  onApprove: (dec: DecisionItem) => void;
  onDismiss: (dec: DecisionItem) => void;
  onOpenProof: (dec: DecisionItem) => void;
}

export function DecisionCard({
  decision,
  onApprove,
  onDismiss,
  onOpenProof,
}: DecisionCardProps) {
  return (
    <Card
      style={{
        borderLeft: `4px solid var(--df-status-${decision.urgency})`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        {/* EN-TÊTE DE LA CARTE */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--df-text-main)' }}>
                {decision.assetName}
              </span>
              <span className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                ({decision.assetCode})
              </span>
            </div>
            <Badge variant={decision.urgency === 'danger' ? 'danger' : 'warning'}>
              {decision.ruleId} • Score {decision.confidenceScore}%
            </Badge>
          </div>

          {decision.dataOrigin === 'DEMO' && (
            <Badge variant="warning">DEMO</Badge>
          )}
        </div>

        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--df-text-main)', margin: '0.75rem 0 0.5rem 0' }}>
          {decision.title}
        </h4>

        <p style={{ fontSize: '0.85rem', color: 'var(--df-text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
          {decision.description}
        </p>

        {/* COMPARAISON ÉCONOMIQUE CHIFFRÉE */}
        <div
          style={{
            background: 'var(--df-bg-surface-2)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--df-radius-sm)',
            border: '1px solid var(--df-border-subtle)',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.6rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '0.4rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
              Arbitrage Économique &amp; Risque
            </span>
            <CalculationProofButton
              label="Preuve de calcul"
              size="xs"
              variant="cyan"
              onClick={() => onOpenProof(decision)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Coût intervention immédiate :</span>
            <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>
              {Number(decision.estimatedActionCost).toLocaleString('fr-DZ')} DA
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--df-status-danger)' }}>Risque financier d&apos;inaction :</span>
            <strong className="df-mono" style={{ color: 'var(--df-status-danger)' }}>
              {Number(decision.costInactionRisk).toLocaleString('fr-DZ')} DA
            </strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderTop: '1px dashed var(--df-border-subtle)',
              paddingTop: '0.4rem',
              marginTop: '0.4rem',
            }}
          >
            <span style={{ color: 'var(--df-status-ok)' }}>Économie nette projetée :</span>
            <strong className="df-mono" style={{ color: 'var(--df-status-ok)' }}>
              +{Number(decision.netExpectedSavings).toLocaleString('fr-DZ')} DA
            </strong>
          </div>
        </div>

        {/* DOSSIER D'EXPLICATION TECHNIQUE */}
        {decision.explanationDossier?.potentialFailureModes && decision.explanationDossier.potentialFailureModes.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.25rem' }}>
              Modes de défaillance anticipés :
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.4 }}>
              {decision.explanationDossier.potentialFailureModes.map((mode, i) => (
                <li key={i}>{mode}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* BOUTONS D'ACTION */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button
          variant="primary"
          style={{
            flex: 1,
            fontSize: '0.8rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
          onClick={() => onApprove(decision)}
        >
          <IconCheck size={14} /> Approuver &amp; Créer OT
        </Button>
        <Button
          variant="secondary"
          style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          onClick={() => onDismiss(decision)}
        >
          Différer
        </Button>
      </div>
    </Card>
  );
}
