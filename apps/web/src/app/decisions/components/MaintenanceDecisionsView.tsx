'use client';

import React from 'react';
import { Card } from '@/components/Card';
import { MetricCard } from '@/components/MetricCard';
import { CalculationProofButton } from '@/components/decisions';
import {
  IconWrench,
  IconAlertTriangle,
  IconShieldCheck,
  IconBarChart3,
  IconCheckCircle,
} from '@/components/navigation/TechIcons';
import { DecisionCard } from './DecisionCard';
import { URGENCY_OPTIONS } from '../constants';
import type { DecisionItem, BudgetVarianceReport, UrgencyFilter } from '../types';

interface MaintenanceDecisionsViewProps {
  decisions: DecisionItem[];
  filteredDecisions: DecisionItem[];
  budgetReport: BudgetVarianceReport | null;
  selectedUrgency: UrgencyFilter;
  onSelectUrgency: (urgency: UrgencyFilter) => void;
  isLoading: boolean;
  totalActionCost: number;
  totalInactionRisk: number;
  totalExpectedSavings: number;
  onOpenInactionProof: () => void;
  onOpenSavingsProof: () => void;
  onOpenDecisionProof: (dec: DecisionItem) => void;
  onApproveDecision: (dec: DecisionItem) => void;
  onDismissDecision: (dec: DecisionItem) => void;
}

export function MaintenanceDecisionsView({
  decisions,
  filteredDecisions,
  budgetReport,
  selectedUrgency,
  onSelectUrgency,
  isLoading,
  totalActionCost,
  totalInactionRisk,
  totalExpectedSavings,
  onOpenInactionProof,
  onOpenSavingsProof,
  onOpenDecisionProof,
  onApproveDecision,
  onDismissDecision,
}: MaintenanceDecisionsViewProps) {
  return (
    <>
      {/* CARTES DE KPIS ÉCONOMIQUES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <MetricCard
          title="Coût Estimé des Actions"
          value={totalActionCost.toLocaleString('fr-DZ')}
          unit="DA"
          icon={<IconWrench size={18} />}
          trend={{ direction: 'neutral', text: `${decisions.length} interventions requises`, isPositive: true }}
        />
        <MetricCard
          title="Risque Économique d'Inaction"
          value={totalInactionRisk.toLocaleString('fr-DZ')}
          unit="DA"
          icon={<IconAlertTriangle size={18} style={{ color: 'var(--df-status-danger)' }} />}
          trend={{ direction: 'down', text: 'Risque de panne en mission', isPositive: false }}
          actions={
            <CalculationProofButton
              label="Preuve"
              size="xs"
              variant="amber"
              onClick={onOpenInactionProof}
            />
          }
        />
        <MetricCard
          title="Économie Nette Projetée"
          value={totalExpectedSavings.toLocaleString('fr-DZ')}
          unit="DA"
          icon={<IconShieldCheck size={18} style={{ color: 'var(--df-status-ok)' }} />}
          progressPercent={82}
          trend={{ direction: 'up', text: 'Rentabilité directe arbitrages', isPositive: true }}
          actions={
            <CalculationProofButton
              label="Preuve"
              size="xs"
              variant="emerald"
              onClick={onOpenSavingsProof}
            />
          }
        />
        <MetricCard
          title="Dépenses Budgétaires"
          value={budgetReport ? budgetReport.actualSpent.toLocaleString('fr-DZ') : '1 120 000'}
          unit="DA"
          icon={<IconBarChart3 size={18} style={{ color: 'var(--df-accent-blue)' }} />}
          progressPercent={budgetReport ? Math.round((budgetReport.actualSpent / (budgetReport.budgetAllocated || 1)) * 100) : 74}
          trend={{ direction: 'up', text: budgetReport ? `${budgetReport.variancePercentage}% d'écart` : '-25.3% sous budget', isPositive: true }}
        />
      </div>

      {/* SECTION DES ARBITRAGES EN COURS */}
      <div style={{ marginBottom: '3rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
            Recommandations d&apos;Arbitrage en Attente ({filteredDecisions.length})
          </h2>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {URGENCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectUrgency(opt.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--df-radius-md)',
                  border: '1px solid var(--df-border-subtle)',
                  background: selectedUrgency === opt.id ? 'var(--df-bg-surface-2)' : 'transparent',
                  color: selectedUrgency === opt.id ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--df-text-muted)' }}>
            Chargement des arbitrages décisionnels...
          </div>
        ) : filteredDecisions.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--df-status-ok)' }}>
              <IconCheckCircle size={40} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.5rem' }}>
              Aucune alerte critique en cours
            </h3>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Tous les actifs respectent leurs intervalles d&apos;entretien préventif et leurs budgets d&apos;exploitation.
            </p>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredDecisions.map((dec) => (
              <DecisionCard
                key={dec.id}
                decision={dec}
                onApprove={onApproveDecision}
                onDismiss={onDismissDecision}
                onOpenProof={onOpenDecisionProof}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

