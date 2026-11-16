'use client';

import React, { useEffect } from 'react';
import {
  IconX,
  IconFileText,
  IconRadio,
  IconActivity,
  IconCheck,
  IconLock,
} from '../navigation/TechIcons';

export interface CalculationVariable {
  name: string;
  symbol?: string;
  value: string | number;
  unit?: string;
  source: string;
}

export interface CalculationStep {
  stepNumber: number;
  description: string;
  formula: string;
  calculation: string;
  intermediateResult: string;
}

export interface CalculationProofData {
  title: string;
  decisionOrMetricName: string;
  category: 'FINANCIAL' | 'PHYSICS_RUL' | 'REGULATORY' | 'DISPATCH_TOPSIS' | 'VHI' | 'TELEMATICS';
  ruleId: string;
  legalOrOemReference: string;
  deterministicFormula: string;
  formulaExplanation: string;
  variables: CalculationVariable[];
  steps: CalculationStep[];
  finalResult: {
    label: string;
    value: string;
    unit?: string;
    conclusion: string;
  };
}

interface CalculationProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CalculationProofData | null;
}

export const CalculationProofModal: React.FC<CalculationProofModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const getCategoryBadge = (cat: CalculationProofData['category']) => {
    switch (cat) {
      case 'FINANCIAL':
        return { label: 'Arbitrage Économique SAD/ADS', bg: 'var(--df-status-ok-bg)', color: 'var(--df-status-ok-text)', border: 'var(--df-status-ok-border)' };
      case 'PHYSICS_RUL':
        return { label: 'Physique Déterministe RUL', bg: 'var(--df-accent-blue-subtle)', color: 'var(--df-accent-blue)', border: 'var(--df-accent-blue)' };
      case 'REGULATORY':
        return { label: 'Conformité JORADP / ENACTA', bg: 'var(--df-status-warning-bg)', color: 'var(--df-status-warning-text)', border: 'var(--df-status-warning-border)' };
      case 'DISPATCH_TOPSIS':
        return { label: 'Arbre des 4 Portes & TOPSIS', bg: 'var(--df-status-info-bg)', color: 'var(--df-status-info-text)', border: 'var(--df-status-info-border)' };
      case 'VHI':
        return { label: 'Indice de Santé VHI (0-100)', bg: 'var(--df-status-danger-bg)', color: 'var(--df-status-danger-text)', border: 'var(--df-status-danger-border)' };
      case 'TELEMATICS':
        return { label: 'Télématique & IoT Traccar', bg: 'var(--df-accent-blue-subtle)', color: 'var(--df-accent-blue)', border: 'var(--df-accent-blue)' };
      default:
        return { label: 'Calcul Déterministe', bg: 'var(--df-bg-surface-2)', color: 'var(--df-text-secondary)', border: 'var(--df-border-subtle)' };
    }
  };

  const badge = getCategoryBadge(data.category);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 9, 20, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-xl)',
          padding: 28,
          boxShadow: 'var(--df-shadow-lg)',
          color: 'var(--df-text-main)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de Fermeture */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-subtle)',
            color: 'var(--df-text-muted)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'all 0.2s',
          }}
          title="Fermer (Échap)"
        >
          <IconX size={16} />
        </button>

        {/* En-tête Preuve de Calcul */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
                padding: '4px 12px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {badge.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--df-text-muted)', fontWeight: 600 }}>
              Règle : <strong style={{ color: 'var(--df-text-main)' }}>{data.ruleId}</strong>
            </span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: 'var(--df-text-main)' }}>
            {data.title}
          </h2>
          <div style={{ fontSize: 14, color: 'var(--df-accent-blue)', fontWeight: 600 }}>
            Calcul explicable pour : {data.decisionOrMetricName}
          </div>
        </div>

        {/* Règle & Formule Mathématique */}
        <div
          style={{
            backgroundColor: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-md)',
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--df-text-muted)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconActivity size={14} style={{ color: 'var(--df-accent-blue)' }} /> Formule Mathématique Déterministe
          </div>
          <div
            className="df-mono"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--df-accent-blue)',
              backgroundColor: 'var(--df-bg-surface-1)',
              padding: '10px 14px',
              borderRadius: 'var(--df-radius-sm)',
              borderLeft: '3px solid var(--df-accent-blue)',
              border: '1px solid var(--df-border-subtle)',
              borderLeftWidth: '3px',
              marginBottom: 8,
            }}
          >
            {data.deterministicFormula}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>
            {data.formulaExplanation}
          </p>
        </div>

        {/* Variables d'Entrée & Télématique Réelle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--df-text-muted)', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconRadio size={14} style={{ color: 'var(--df-accent-blue)' }} /> Données Observées Réelles & Hypothèses d&apos;Entrée
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {data.variables.map((v, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: 'var(--df-text-muted)' }}>
                    {v.name} {v.symbol && <strong style={{ color: 'var(--df-accent-blue)' }}>({v.symbol})</strong>}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--df-text-main)', marginBottom: 2 }}>
                  {v.value} {v.unit && <span style={{ fontSize: 12, color: 'var(--df-text-muted)', fontWeight: 500 }}>{v.unit}</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--df-text-muted)' }}>
                  Source : {v.source}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Déroulement de la Preuve Pas-à-Pas */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--df-text-muted)', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconFileText size={14} style={{ color: 'var(--df-status-ok)' }} /> Démonstration Numérique Pas-à-Pas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.steps.map((st) => (
              <div
                key={st.stepNumber}
                style={{
                  backgroundColor: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--df-text-main)' }}>
                    Étape {st.stepNumber} : {st.description}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--df-status-ok)' }}>
                    = {st.intermediateResult}
                  </span>
                </div>
                <div className="df-mono" style={{ fontSize: 12, color: 'var(--df-text-muted)' }}>
                  {st.calculation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résultat Final & Verdict */}
        <div
          style={{
            backgroundColor: 'var(--df-status-ok-bg)',
            border: '1px solid var(--df-status-ok-border)',
            borderRadius: 'var(--df-radius-md)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--df-status-ok-text)', fontWeight: 700, marginBottom: 2 }}>
              Résultat Calculé Prouvé ({data.finalResult.label})
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--df-text-main)' }}>
              {data.finalResult.value} {data.finalResult.unit && <span style={{ fontSize: 15, color: 'var(--df-text-muted)' }}>{data.finalResult.unit}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--df-text-secondary)', marginTop: 4 }}>
              {data.finalResult.conclusion}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                backgroundColor: 'var(--df-status-ok-bg)',
                color: 'var(--df-status-ok-text)',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid var(--df-status-ok-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IconCheck size={14} /> Preuve Conforme & Auditable
            </span>
          </div>
        </div>

        {/* Réf. Juridique et Garantie Déterministe */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--df-text-muted)', borderTop: '1px solid var(--df-border-subtle)', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconFileText size={13} style={{ color: 'var(--df-text-muted)' }} /> Référence : <strong style={{ color: 'var(--df-text-secondary)' }}>{data.legalOrOemReference}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconLock size={13} style={{ color: 'var(--df-status-ok)' }} /> RLS Fail-Closed • Zéro boîte noire
          </div>
        </div>
      </div>
    </div>
  );
};
