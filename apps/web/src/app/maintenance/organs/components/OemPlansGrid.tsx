'use client';

import React from 'react';
import { OEM_PREVENTIVE_TEMPLATES } from '@/lib/api-maintenance-40';
import { IconLayers } from '@/components/navigation/TechIcons';

export function OemPlansGrid() {
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
            <IconLayers size={18} className="text-indigo-400" />
            Plans Préventifs Constructeurs & Spécifications 6 Organes
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
            Matrices constructeurs officielles (Renault Trucks, MAN, Shacman Weichai, Caterpillar, Isuzu) calibrées pour les 58 Wilayas d'Algérie.
          </p>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          {OEM_PREVENTIVE_TEMPLATES.length} Modèles Calibrés
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {OEM_PREVENTIVE_TEMPLATES.map((plan) => (
          <div
            key={plan.code}
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {plan.code}
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>
                    {plan.name}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {plan.subsystemsCovered.map((sub, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '3px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#7dd3fc',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '8px 0 12px', lineHeight: 1.5 }}>
                {plan.description}
              </p>

              {/* Intervals Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  background: 'var(--df-bg-surface-1)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <span style={{ color: 'var(--df-text-muted)', fontSize: '9px', display: 'block' }}>Km Standard</span>
                  <strong style={{ color: '#fff' }}>{plan.intervalKm ? `${plan.intervalKm.toLocaleString('fr-FR')} km` : '--'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--df-text-muted)', fontSize: '9px', display: 'block' }}>Heures Moteur</span>
                  <strong style={{ color: '#fff' }}>{plan.intervalEngineHours ? `${plan.intervalEngineHours} h` : '--'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--df-text-muted)', fontSize: '9px', display: 'block' }}>Calendaire</span>
                  <strong style={{ color: '#fff' }}>{plan.intervalMonths} mois</strong>
                </div>
              </div>
            </div>

            {/* Required parts tags */}
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--df-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                Pièces d'Usure Requises :
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {plan.requiredParts.map((part, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#cbd5e1',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
