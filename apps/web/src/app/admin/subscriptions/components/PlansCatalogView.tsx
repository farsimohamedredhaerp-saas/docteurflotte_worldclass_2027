'use client';

import React from 'react';
import { IconEdit } from '@/components/navigation/TechIcons';
import type { SubscriptionPlan } from '../types';

interface PlansCatalogViewProps {
  plans: SubscriptionPlan[];
  onEditPlan: (plan: SubscriptionPlan) => void;
}

export function PlansCatalogView({ plans, onEditPlan }: PlansCatalogViewProps) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--df-bg-surface-2)',
                      color: 'var(--df-text-muted)',
                      marginRight: '0.5rem',
                    }}
                    className="df-mono"
                  >
                    {plan.code}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: plan.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: plan.isActive ? '#86efac' : '#fca5a5',
                    }}
                  >
                    {plan.isActive ? 'ACTIF' : 'INACTIF'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {plan.supportedModes.map((mode) => (
                    <span
                      key={mode}
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background:
                          mode === 'MODE_2'
                            ? 'rgba(168, 85, 247, 0.2)'
                            : mode === 'MODE_1'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(234, 179, 8, 0.2)',
                        color:
                          mode === 'MODE_2'
                            ? '#d8b4fe'
                            : mode === 'MODE_1'
                            ? '#93c5fd'
                            : '#fde047',
                      }}
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--df-text-main)' }}>
                {plan.name}
              </h3>
              <p style={{ color: 'var(--df-text-muted)', fontSize: '0.8rem', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                {plan.description}
              </p>

              {/* PRIX ET FORMULE */}
              <div
                style={{
                  background: 'var(--df-bg-surface-2)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid var(--df-border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--df-text-main)' }} className="df-mono">
                    {plan.pricePerAssetDzd.toLocaleString('fr-DZ')} DA
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                    / véhicule {plan.billingModel === 'ANNUAL_INVOICE' ? '/ an' : '/ mois'}
                  </span>
                </div>
                {plan.baseFeeDzd > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', marginTop: '0.2rem' }}>
                    + Frais fixe d&apos;intégration : {plan.baseFeeDzd.toLocaleString('fr-DZ')} DA
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600, marginTop: '0.35rem' }}>
                  Modèle : {plan.billingModel}
                </div>
              </div>

              {/* FONCTIONNALITÉS */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--df-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Inclus dans ce plan :
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                  {plan.features.slice(0, 5).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                  {plan.features.length > 5 && (
                    <li style={{ color: 'var(--df-text-muted)', listStyle: 'none' }}>
                      + {plan.features.length - 5} autres fonctionnalités...
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => onEditPlan(plan)}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: '6px',
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  color: 'var(--df-text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <IconEdit size={13} />
                Modifier ce plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
