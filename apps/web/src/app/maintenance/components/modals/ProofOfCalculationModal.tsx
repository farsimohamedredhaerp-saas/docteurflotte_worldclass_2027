'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { VehicleAssetRecord, SubsystemType } from '../../types';

interface ProofOfCalculationModalProps {
  asset: VehicleAssetRecord | null;
  subsystem: SubsystemType;
  onSubsystemChange: (subsystem: SubsystemType) => void;
  onClose: () => void;
}

const SUBSYSTEM_LIST: SubsystemType[] = [
  'ENGINE',
  'HYDRAULICS',
  'TRANSMISSION',
  'BRAKES_APS',
  'COOLING',
  'FILTRATION',
  'TIRES_TRACKS',
];

export function ProofOfCalculationModal({
  asset,
  subsystem,
  onSubsystemChange,
  onClose,
}: ProofOfCalculationModalProps) {
  if (!asset) return null;

  const res = asset.subsystems[subsystem];

  return (
    <Modal
      isOpen={Boolean(asset)}
      onClose={onClose}
      title={`${asset.registrationNumber} — ${asset.make} ${asset.model}`}
      subtitle="PREUVE MATHÉMATIQUE & PHYSIQUE RUL (CONTRAT MASTER SPEC)"
      size="xl"
      footer={
        <div style={{ textAlign: 'right', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              color: 'var(--df-text-main)',
              padding: '6px 16px',
              borderRadius: 'var(--df-radius-md)',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Fermer la preuve
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Subsystem Selector Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SUBSYSTEM_LIST.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onSubsystemChange(sub)}
              style={{
                background: subsystem === sub ? 'var(--df-bg-surface-2)' : 'transparent',
                border: subsystem === sub ? '1px solid #2563EB' : '1px solid var(--df-border-subtle)',
                color: subsystem === sub ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                borderRadius: 'var(--df-radius-md)',
                padding: '4px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: subsystem === sub ? 700 : 500,
              }}
            >
              {sub.replace('_', ' ')}
            </button>
          ))}
        </div>

        {res && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Step 1 */}
            <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '12px', borderRadius: 'var(--df-radius-md)' }}>
              <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                Étape 1 : Ajustement Conditions Sévères (Chaleur, Poussière, Charge)
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                I_eff = I_OEM &times; &alpha;_duty
              </div>
              <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                &bull; Intervalle ajusté : {res.effectiveIntervalKm.toLocaleString('fr-FR')} km (ou {res.effectiveIntervalHours} h) avec &alpha; = {asset.severeDutyFactor.toFixed(2)}
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '12px', borderRadius: 'var(--df-radius-md)' }}>
              <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                Étape 2 : Conversion du Ralenti Moteur (Idle Time) en Usure Équivalente
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                KM_équivalent = &Delta;KM_odomètre + (Heures_ralenti &times; 33)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                &bull; {asset.idleHours} h ralenti = +{res.equivalentIdleKm.toLocaleString('fr-FR')} km d’encrassement huile/FAP (Ratio officiel 1h = 33 km).
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '12px', borderRadius: 'var(--df-radius-md)' }}>
              <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                Étape 3 : Facteur d'Accélération Télémétrique CAN-bus (&gamma;_CAN)
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                &gamma;_CAN = 1.0 + &sum; P_sensor,k + &sum; rulPenaltyFactor(DTC_m)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                &bull; &gamma;_CAN calculé : x{res.canAccelerationFactor.toFixed(3)} (Pénalité capteurs + DTCs actifs)
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '12px', borderRadius: 'var(--df-radius-md)' }}>
              <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                Étape 4 : RUL Finale & Probabilité de Panne à 30 Jours (Loi de Weibull)
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                P_fail(30d) = 1 - exp(- (W_total &times; &gamma;_CAN)^&beta;)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginTop: '8px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', padding: '8px', borderRadius: 'var(--df-radius-sm)' }}>
                  <span style={{ color: 'var(--df-text-muted)', display: 'block', fontSize: '10px' }}>RUL Heures</span>
                  <strong style={{ color: '#F59E0B' }}>{res.rulRemainingHours?.toFixed(1) ?? '--'} h</strong>
                </div>
                <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', padding: '8px', borderRadius: 'var(--df-radius-sm)' }}>
                  <span style={{ color: 'var(--df-text-muted)', display: 'block', fontSize: '10px' }}>RUL Kilomètres</span>
                  <strong style={{ color: '#F59E0B' }}>{res.rulRemainingKm?.toFixed(0) ?? '--'} km</strong>
                </div>
                <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', padding: '8px', borderRadius: 'var(--df-radius-sm)' }}>
                  <span style={{ color: 'var(--df-text-muted)', display: 'block', fontSize: '10px' }}>P_fail (30 jours)</span>
                  <strong style={{ color: res.failureProbability30d > 0.5 ? '#EF4444' : '#10B981' }}>
                    {(res.failureProbability30d * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

