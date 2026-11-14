'use client';

import React from 'react';
import { useMaintenance } from '../../context/MaintenanceContext';
import { IconShieldCheck, IconZap } from '@/components/navigation/TechIcons';

export function SadAdsArbitrageGrid() {
  const { fleet, setSelectedProofAsset, setSelectedProofSubsystem } = useMaintenance();

  // Arbitrage computation based on severe duty and active alert
  const vehiclesWithArbitrage = fleet.map((v) => {
    const isSahara = v.severeDutyFactor > 0.8;
    const towingCostDzd = isSahara ? 75000 : 35000;
    const dailyImmobilizationDzd = 25000;

    const actionCostDzd = Math.round(18500 * (1 + v.severeDutyFactor * 0.5));
    const breakdownRiskDzd = Math.round(actionCostDzd * 3.5 + towingCostDzd + dailyImmobilizationDzd * 2);
    const netSavingsDzd = breakdownRiskDzd - actionCostDzd;
    const roiRatio = Number((breakdownRiskDzd / actionCostDzd).toFixed(1));

    return {
      vehicle: v,
      isSahara,
      towingCostDzd,
      actionCostDzd,
      breakdownRiskDzd,
      netSavingsDzd,
      roiRatio,
    };
  });

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconShieldCheck size={18} className="text-emerald-400" />
            Arbitrage Financier Actuariel SAD &rarr; ADS (Dinars Algériens DZD)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
            Chiffrage opposable en DZD : Coût d'Action Immédiate vs Risque d'Inaction (casse mécanique, remorquage saharien 75 000 DZD Sud vs 35 000 DZD Nord, immobilisation).
          </p>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
          Arbitrage Déterministe
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px',
        }}
      >
        {vehiclesWithArbitrage.slice(0, 6).map((item) => (
          <div
            key={item.vehicle.id}
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#fff', fontSize: '13px' }}>
                  {item.vehicle.registrationNumber}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: item.isSahara ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: item.isSahara ? '#fbbf24' : '#7dd3fc',
                    border: `1px solid ${item.isSahara ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                  }}
                >
                  {item.isSahara ? 'Zone Saharienne (Remorquage 75k)' : 'Zone Tell / Nord (35k)'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
                {item.vehicle.make} {item.vehicle.model} • VHI {item.vehicle.globalHealthScore}/100
              </div>
            </div>

            {/* Financial figures */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'var(--df-bg-surface-1)',
                padding: '10px',
                borderRadius: '8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ fontSize: '9.5px', color: 'var(--df-text-muted)', display: 'block' }}>Action Préventive :</span>
                <strong style={{ color: '#38bdf8' }}>{item.actionCostDzd.toLocaleString('fr-FR')} DZD</strong>
              </div>
              <div>
                <span style={{ fontSize: '9.5px', color: 'var(--df-text-muted)', display: 'block' }}>Risque Inaction :</span>
                <strong style={{ color: '#EF4444' }}>{item.breakdownRiskDzd.toLocaleString('fr-FR')} DZD</strong>
              </div>
              <div>
                <span style={{ fontSize: '9.5px', color: 'var(--df-text-muted)', display: 'block' }}>Économie Nette :</span>
                <strong style={{ color: '#10B981' }}>+{item.netSavingsDzd.toLocaleString('fr-FR')} DZD</strong>
              </div>
              <div>
                <span style={{ fontSize: '9.5px', color: 'var(--df-text-muted)', display: 'block' }}>Ratio ROI :</span>
                <strong style={{ color: '#a5b4fc' }}>{item.roiRatio} &times;</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedProofSubsystem('ENGINE');
                setSelectedProofAsset(item.vehicle);
              }}
              style={{
                width: '100%',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                borderRadius: '6px',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Consulter la Preuve Mathématique Complète
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

