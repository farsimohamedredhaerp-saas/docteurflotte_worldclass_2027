'use client';

import React from 'react';
import { ModalErrorBoundary } from '@/components/ui/ModalErrorBoundary';
import type {
  CreateSubscriptionPlanDto,
  SubscriptionPlan,
  SubscriptionBillingModel,
} from '../../types';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan: SubscriptionPlan | null;
  planForm: CreateSubscriptionPlanDto;
  setPlanForm: React.Dispatch<React.SetStateAction<CreateSubscriptionPlanDto>>;
  onSave: (e: React.FormEvent) => void;
}

export function PlanFormModal({
  isOpen,
  onClose,
  editingPlan,
  planForm,
  setPlanForm,
  onSave,
}: PlanFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '14px',
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <ModalErrorBoundary onReset={onClose}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--df-text-main)' }}>
            {editingPlan ? `Modifier le Plan "${editingPlan.name}"` : "Créer un Nouveau Plan d'Abonnement"}
          </h3>

          <form onSubmit={onSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Code Unique (ex: PLAN-BTP-EXTRA)
                </label>
                <input
                  type="text"
                  required
                  value={planForm.code}
                  onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Nom Commercial
                </label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                Description de l&apos;Offre
              </label>
              <textarea
                rows={2}
                required
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Modèle de Facturation
                </label>
                <select
                  value={planForm.billingModel}
                  onChange={(e) => setPlanForm({ ...planForm, billingModel: e.target.value as SubscriptionBillingModel })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                >
                  <option value="ANNUAL_INVOICE">Facturation Annuelle B2B (Standard DZ)</option>
                  <option value="PAY_PER_ACTIVE_ASSET">À l&apos;Actif Roulant (Pay-as-you-drive)</option>
                  <option value="CAPEX_TMA">Licence CapEx + Contrat TMA</option>
                  <option value="AUDIT_TRIAL">Pack Audit Anti-Fraude 90 Jours</option>
                  <option value="MONTHLY_FLEX">Mensuel Flexible</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Tarif par Véhicule (DZD)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={planForm.pricePerAssetDzd}
                  onChange={(e) => setPlanForm({ ...planForm, pricePerAssetDzd: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Frais Fixe d&apos;Intégration (DZD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={planForm.baseFeeDzd || 0}
                  onChange={(e) => setPlanForm({ ...planForm, baseFeeDzd: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Modes IoT Supportés
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {(['MODE_0', 'MODE_1', 'MODE_2'] as const).map((mode) => (
                    <label key={mode} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--df-text-main)' }}>
                      <input
                        type="checkbox"
                        checked={planForm.supportedModes?.includes(mode)}
                        onChange={(e) => {
                          const cur = planForm.supportedModes || [];
                          const updated = e.target.checked ? [...cur, mode] : cur.filter((m) => m !== mode);
                          setPlanForm({ ...planForm, supportedModes: updated });
                        }}
                      />
                      {mode}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Enregistrer le Plan
              </button>
            </div>
          </form>
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
