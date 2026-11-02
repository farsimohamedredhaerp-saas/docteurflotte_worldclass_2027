'use client';

import React, { useEffect } from 'react';

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
        return { label: 'Arbitrage Économique SAD/ADS', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '#10b981' };
      case 'PHYSICS_RUL':
        return { label: 'Physique Déterministe RUL', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '#38bdf8' };
      case 'REGULATORY':
        return { label: 'Conformité JORADP / ENACTA', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '#f59e0b' };
      case 'DISPATCH_TOPSIS':
        return { label: 'Arbre des 4 Portes & TOPSIS', bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '#a855f7' };
      case 'VHI':
        return { label: 'Indice de Santé VHI (0-100)', bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', border: '#ec4899' };
      case 'TELEMATICS':
        return { label: 'Télématique & IoT Traccar', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '#3b82f6' };
      default:
        return { label: 'Calcul Déterministe', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '#94a3b8' };
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
          background: 'linear-gradient(160deg, #0e1726 0%, #090e17 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.2)',
          color: '#f8fafc',
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
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
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
          ✕
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
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              Règle : <strong style={{ color: '#fff' }}>{data.ruleId}</strong>
            </span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
            {data.title}
          </h2>
          <div style={{ fontSize: 14, color: '#38bdf8', fontWeight: 600 }}>
            Calcul explicable pour : {data.decisionOrMetricName}
          </div>
        </div>

        {/* Règle & Formule Mathématique */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>
            📐 Formule Mathématique Déterministe
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 15,
              fontWeight: 700,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.08)',
              padding: '10px 14px',
              borderRadius: 8,
              borderLeft: '3px solid #38bdf8',
              marginBottom: 8,
            }}
          >
            {data.deterministicFormula}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.45 }}>
            {data.formulaExplanation}
          </p>
        </div>

        {/* Variables d'Entrée & Télématique Réelle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 10 }}>
            📡 Données Observées Réelles & Hypothèses d&apos;Entrée
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {data.variables.map((v, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {v.name} {v.symbol && <strong style={{ color: '#38bdf8' }}>({v.symbol})</strong>}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                  {v.value} {v.unit && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{v.unit}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Source : {v.source}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Déroulement de la Preuve Pas-à-Pas */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 10 }}>
            🔍 Démonstration Numérique Pas-à-Pas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.steps.map((st) => (
              <div
                key={st.stepNumber}
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                    Étape {st.stepNumber} : {st.description}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                    = {st.intermediateResult}
                  </span>
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#94a3b8' }}>
                  {st.calculation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résultat Final & Verdict */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.12) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 14,
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
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#10b981', fontWeight: 700, marginBottom: 2 }}>
              Résultat Calculé Prouvé ({data.finalResult.label})
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
              {data.finalResult.value} {data.finalResult.unit && <span style={{ fontSize: 15, color: '#94a3b8' }}>{data.finalResult.unit}</span>}
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>
              {data.finalResult.conclusion}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid #10b981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>✓</span> Preuve Conforme & Auditable
            </span>
          </div>
        </div>

        {/* Réf. Juridique et Garantie Déterministe */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          <div>
            📜 Référence : <strong style={{ color: '#94a3b8' }}>{data.legalOrOemReference}</strong>
          </div>
          <div>
            🔒 RLS Fail-Closed • Zéro boîte noire
          </div>
        </div>
      </div>
    </div>
  );
};
