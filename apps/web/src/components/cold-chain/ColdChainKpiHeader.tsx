'use client';

import React from 'react';
import {
  IconTruck,
  IconAlertTriangle,
  IconBox,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';

interface ColdChainKpiHeaderProps {
  reefersCount: number;
  activeExcursionsCount: number;
  totalMonitoredCargoDzd: number;
  totalExcursionRiskDzd: number;
}

export function ColdChainKpiHeader({
  reefersCount,
  activeExcursionsCount,
  totalMonitoredCargoDzd,
  totalExcursionRiskDzd,
}: ColdChainKpiHeaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          borderRadius: 'var(--df-radius-xl)',
          border: '1px solid var(--df-border-subtle)',
          backgroundColor: 'var(--df-bg-surface-1)',
          padding: '1.25rem',
          boxShadow: 'var(--df-shadow-sm)',
        }}
        className="space-y-1"
      >
        <div className="flex items-center justify-between" style={{ color: 'var(--df-text-muted)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider">Groupes Connectés</span>
          <IconTruck size={16} />
        </div>
        <div className="text-3xl font-black font-mono mt-1" style={{ color: 'var(--df-text-main)' }}>
          {reefersCount}
        </div>
        <div className="text-xs" style={{ color: 'var(--df-text-muted)' }}>
          Caisses frigorifiques télémétrie active
        </div>
      </div>

      <div
        style={{
          borderRadius: 'var(--df-radius-xl)',
          border:
            activeExcursionsCount > 0
              ? '1px solid var(--df-status-danger-border)'
              : '1px solid var(--df-border-subtle)',
          backgroundColor:
            activeExcursionsCount > 0
              ? 'var(--df-status-danger-bg)'
              : 'var(--df-bg-surface-1)',
          padding: '1.25rem',
          boxShadow: 'var(--df-shadow-sm)',
        }}
        className="space-y-1"
      >
        <div className="flex items-center justify-between">
          <span
            style={{
              color:
                activeExcursionsCount > 0
                  ? 'var(--df-status-danger-text)'
                  : 'var(--df-text-muted)',
            }}
            className="text-[11px] font-bold uppercase tracking-wider"
          >
            Excursions Thermiques
          </span>
          <IconAlertTriangle
            size={16}
            style={{
              color:
                activeExcursionsCount > 0
                  ? 'var(--df-status-danger)'
                  : 'var(--df-text-muted)',
            }}
          />
        </div>
        <div
          className="text-3xl font-black font-mono mt-1"
          style={{
            color:
              activeExcursionsCount > 0
                ? 'var(--df-status-danger)'
                : 'var(--df-status-ok)',
          }}
        >
          {activeExcursionsCount}
        </div>
        <div
          className="text-xs"
          style={{
            color:
              activeExcursionsCount > 0
                ? 'var(--df-status-danger-text)'
                : 'var(--df-text-muted)',
          }}
        >
          {activeExcursionsCount > 0
            ? 'Ruptures thermiques en cours !'
            : '100% dans la plage réglementaire'}
        </div>
      </div>

      <div
        style={{
          borderRadius: 'var(--df-radius-xl)',
          border: '1px solid var(--df-border-subtle)',
          backgroundColor: 'var(--df-bg-surface-1)',
          padding: '1.25rem',
          boxShadow: 'var(--df-shadow-sm)',
        }}
        className="space-y-1"
      >
        <div className="flex items-center justify-between" style={{ color: 'var(--df-text-muted)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider">Valeur Fret Sous Froid</span>
          <IconBox size={16} />
        </div>
        <div className="text-3xl font-black font-mono mt-1" style={{ color: 'var(--df-text-main)' }}>
          {formatCurrency(totalMonitoredCargoDzd)}
        </div>
        <div className="text-xs" style={{ color: 'var(--df-text-muted)' }}>
          Cargaisons sous température dirigée
        </div>
      </div>

      <div
        style={{
          borderRadius: 'var(--df-radius-xl)',
          border:
            totalExcursionRiskDzd > 0
              ? '1px solid var(--df-status-warning-border)'
              : '1px solid var(--df-border-subtle)',
          backgroundColor:
            totalExcursionRiskDzd > 0
              ? 'var(--df-status-warning-bg)'
              : 'var(--df-bg-surface-1)',
          padding: '1.25rem',
          boxShadow: 'var(--df-shadow-sm)',
        }}
        className="space-y-1"
      >
        <div className="flex items-center justify-between">
          <span
            style={{
              color:
                totalExcursionRiskDzd > 0
                  ? 'var(--df-status-warning-text)'
                  : 'var(--df-text-muted)',
            }}
            className="text-[11px] font-bold uppercase tracking-wider"
          >
            Risque Financier Actuel
          </span>
          <IconShieldCheck
            size={16}
            style={{
              color:
                totalExcursionRiskDzd > 0
                  ? 'var(--df-status-warning)'
                  : 'var(--df-text-muted)',
            }}
          />
        </div>
        <div
          className="text-3xl font-black font-mono mt-1"
          style={{
            color:
              totalExcursionRiskDzd > 0
                ? 'var(--df-status-warning)'
                : 'var(--df-status-ok)',
          }}
        >
          {formatCurrency(totalExcursionRiskDzd)}
        </div>
        <div
          className="text-xs"
          style={{
            color:
              totalExcursionRiskDzd > 0
                ? 'var(--df-status-warning-text)'
                : 'var(--df-text-muted)',
          }}
        >
          {totalExcursionRiskDzd > 0 ? 'Dépréciation financière en cours' : 'Zéro perte constatée'}
        </div>
      </div>
    </div>
  );
}

