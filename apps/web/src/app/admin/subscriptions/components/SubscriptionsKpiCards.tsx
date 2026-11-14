'use client';

import React from 'react';

interface SubscriptionsKpiCardsProps {
  totalMrrDzd: number;
  totalActiveVehicles: number;
  totalContractVehicles: number;
  plansCount: number;
}

export function SubscriptionsKpiCards({
  totalMrrDzd,
  totalActiveVehicles,
  totalContractVehicles,
  plansCount,
}: SubscriptionsKpiCardsProps) {
  const percentBilled =
    totalContractVehicles > 0
      ? Math.round((totalActiveVehicles / totalContractVehicles) * 100)
      : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}
    >
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '1rem',
        }}
      >
        <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          MRR ESTIMÉ EN DINARS (DZD)
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }} className="df-mono">
          {totalMrrDzd.toLocaleString('fr-DZ')}{' '}
          <span style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)' }}>DA / mois</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
          Revenu mensuel récurrent annualisé lissé
        </div>
      </div>

      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '1rem',
        }}
      >
        <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          PARC VÉHICULES ACTIFS / ENGAGÉS
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }} className="df-mono">
          {totalActiveVehicles}{' '}
          <span style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)' }}>
            / {totalContractVehicles} véhicules
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
          {percentBilled}% de flotte en circulation facturée
        </div>
      </div>

      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '1rem',
        }}
      >
        <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          PLANS STANDARDS &amp; SUR-MESURE
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa' }} className="df-mono">
          {plansCount}{' '}
          <span style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)' }}>plans actifs</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
          Mode 0 (Zero-Hardware), Mode 1 (GPS), Mode 2 (Full CAN)
        </div>
      </div>

      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '1rem',
        }}
      >
        <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          MODES DE RÈGLEMENT B2B DZ
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.35rem' }}>
          Virement (65%) • Chèque (30%)
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
          Conformité DGI (TVA 19% déductible, Timbre espèces)
        </div>
      </div>
    </div>
  );
}
