'use client';

import React from 'react';
import { ModalErrorBoundary } from '@/components/ui/ModalErrorBoundary';
import type {
  TenantSubscription,
  SubscriptionPlan,
  UpdateTenantSubscriptionDto,
  SubscriptionBillingModel,
  SubscriptionPaymentMethod,
} from '../../types';

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTenantSub: TenantSubscription | null;
  plans: SubscriptionPlan[];
  negotiationForm: UpdateTenantSubscriptionDto;
  setNegotiationForm: React.Dispatch<React.SetStateAction<UpdateTenantSubscriptionDto>>;
  onSave: (e: React.FormEvent) => void;
}

export function NegotiationModal({
  isOpen,
  onClose,
  editingTenantSub,
  plans,
  negotiationForm,
  setNegotiationForm,
  onSave,
}: NegotiationModalProps) {
  if (!isOpen || !editingTenantSub) return null;

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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
        }}
      >
        <ModalErrorBoundary onReset={onClose}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--df-text-main)' }}>
            Ajustement Sur-Mesure : {editingTenantSub.tenantName}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
            Marge de manœuvre SuperAdmin : Surcharger le prix catalogue, accorder une remise en % ou changer les conditions de paiement.
          </p>

          <form onSubmit={onSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Plan de Référence
                </label>
                <select
                  value={negotiationForm.planId}
                  onChange={(e) => setNegotiationForm({ ...negotiationForm, planId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.pricePerAssetDzd.toLocaleString('fr-DZ')} DA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Formule Économique
                </label>
                <select
                  value={negotiationForm.billingModel}
                  onChange={(e) => setNegotiationForm({ ...negotiationForm, billingModel: e.target.value as SubscriptionBillingModel })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                >
                  <option value="ANNUAL_INVOICE">Annuelle B2B (Chèque / Virement)</option>
                  <option value="PAY_PER_ACTIVE_ASSET">Flotte Dynamique (À l&apos;Actif Roulant)</option>
                  <option value="CAPEX_TMA">CapEx + Contrat TMA</option>
                  <option value="AUDIT_TRIAL">Pack Audit 90 Jours</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Prix Négocié Dérogatoire (DZD)
                </label>
                <input
                  type="number"
                  placeholder="Laisser vide = prix catalogue"
                  value={negotiationForm.customPricePerAssetDzd !== null ? negotiationForm.customPricePerAssetDzd : ''}
                  onChange={(e) =>
                    setNegotiationForm({
                      ...negotiationForm,
                      customPricePerAssetDzd: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Remise Commerciale (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={negotiationForm.discountPercent || 0}
                  onChange={(e) => setNegotiationForm({ ...negotiationForm, discountPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Mode de Règlement
                </label>
                <select
                  value={negotiationForm.paymentMethod}
                  onChange={(e) => setNegotiationForm({ ...negotiationForm, paymentMethod: e.target.value as SubscriptionPaymentMethod })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                >
                  <option value="VIREMENT_BANCAIRE">Virement Bancaire (Recommandé)</option>
                  <option value="CHEQUE">Chèque Certifié d&apos;Entreprise</option>
                  <option value="BON_DE_COMMANDE_60J">Bon de Commande / Mandat Administratif</option>
                  <option value="ESPECES">Espèces (avec timbre fiscal DGI)</option>
                  <option value="CIB_EDAHABIA">CIB / Carte Edahabia</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Statut du Compte
                </label>
                <select
                  value={negotiationForm.status}
                  onChange={(e) => setNegotiationForm({ ...negotiationForm, status: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                >
                  <option value="ACTIVE">ACTIF (En règle)</option>
                  <option value="TRIAL">PÉRIODE D&apos;ESSAI</option>
                  <option value="PENDING_PAYMENT">EN ATTENTE DE CHÈQUE</option>
                  <option value="SUSPENDED">SUSPENDU (Impayé)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                Notes Commerciales (Justification de remise, N° contrat)
              </label>
              <textarea
                rows={2}
                value={negotiationForm.notes || ''}
                onChange={(e) => setNegotiationForm({ ...negotiationForm, notes: e.target.value })}
                placeholder="Ex: Négociation conclue avec DG Transport le 20/10/2026 - Paiement par chèque à 30 jours."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
              />
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
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Appliquer la Dérogation
              </button>
            </div>
          </form>
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
