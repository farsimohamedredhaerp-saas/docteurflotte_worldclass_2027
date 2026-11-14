'use client';

import React from 'react';
import { IconActivity, IconX } from '@/components/navigation/TechIcons';
import type { DecisionEngineSimulationResult } from '../types';

interface SimulationBenchmarkDrawerProps {
  simulationResult: DecisionEngineSimulationResult;
  onClose: () => void;
}

export function SimulationBenchmarkDrawer({
  simulationResult,
  onClose,
}: SimulationBenchmarkDrawerProps) {
  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '14px',
        backgroundColor: 'var(--df-bg-surface-1)',
        border: '2px solid #818cf8',
        marginBottom: '32px',
        boxShadow: 'var(--df-shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconActivity size={20} className="text-indigo-400" />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--df-text-main)' }}>
            Résultats du Banc d&apos;Essai Physique sur Véhicules Étalons Algérie
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--df-text-muted)',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          aria-label="Fermer"
        >
          <IconX size={14} /> Fermer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {simulationResult.benchmarks.map((b, idx) => (
          <div
            key={idx}
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#38bdf8', marginBottom: '4px' }}>
              {b.vehicleModel}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '12px' }}>
              Code Moteur : {b.engineCode} • Catégorie : {b.category}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Usure Huile à 110°C (100 km) :</span>
                <strong style={{ color: '#fbbf24' }}>{b.arrheniusOilEquivalentKmAt110C} km eq.</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Chute Démarrage à -5°C :</span>
                <strong style={{ color: '#fca5a5' }}>{b.batteryCrankingDropAtMinus5C_mV} mV</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Seuil Siphon Détectable :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{b.fuelSiphonDetectionThresholdLiters} L</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>VHI Santé Projeté :</span>
                <strong style={{ color: '#34d399' }}>{b.projectedVhiScore} / 100</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--df-border-subtle)',
                  paddingTop: '6px',
                  marginTop: '4px',
                }}
              >
                <span style={{ color: 'var(--df-text-muted)' }}>Risque Inaction Financier :</span>
                <strong style={{ color: '#f87171' }}>{b.projectedInactionRiskDzd.toLocaleString('fr-FR')} DZD</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
