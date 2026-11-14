'use client';

import React from 'react';
import { IconAlertTriangle } from '../../../components/navigation/TechIcons';
import { CopilotProactiveRailProps } from '../types';

export function CopilotProactiveRail({
  insights,
  onSelectInsightPrompt,
}: CopilotProactiveRailProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Fleet Health Quick Box */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: 'var(--df-shadow-sm)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--df-text-muted)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          État Général de la Flotte
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>78.4</span>
            <span style={{ fontSize: '14px', color: 'var(--df-text-muted)' }}> / 100 VHI</span>
          </div>
          <span
            style={{
              fontSize: '11px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#6ee7b7',
              padding: '3px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            Stable
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
          Exposition totale au risque d’inaction :{' '}
          <strong style={{ color: '#f87171' }}>425 000 DZD</strong> sur 3 véhicules prioritaires.
        </div>
      </div>

      {/* Proactive Insights Feed */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: 'var(--df-shadow-sm)',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconAlertTriangle size={15} className="text-amber-400" />
          <span>Alertes Proactives du Copilote</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights.map((ins) => (
            <div
              key={ins.id}
              onClick={() => onSelectInsightPrompt(ins.title)}
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#818cf8';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: ins.urgency === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: ins.urgency === 'HIGH' ? '#fca5a5' : '#fbbf24',
                  }}
                >
                  {ins.urgency === 'HIGH' ? 'CRITIQUE' : 'MOYEN'}
                </span>
                <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>
                  {ins.impactDzd.toLocaleString('fr-DZ')} DA
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                {ins.title}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--df-text-muted)', lineHeight: 1.4 }}>
                {ins.summary}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

