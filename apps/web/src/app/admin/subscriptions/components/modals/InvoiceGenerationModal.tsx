'use client';

import React from 'react';
import { ModalErrorBoundary } from '@/components/ui/ModalErrorBoundary';
import type {
  TenantSubscription,
  GenerateInvoiceDto,
  SubscriptionInvoiceType,
} from '../../types';

interface InvoiceGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInvoiceTenant: TenantSubscription | null;
  invoiceForm: GenerateInvoiceDto;
  setInvoiceForm: React.Dispatch<React.SetStateAction<GenerateInvoiceDto>>;
  onGenerate: (e: React.FormEvent) => void;
}

export function InvoiceGenerationModal({
  isOpen,
  onClose,
  targetInvoiceTenant,
  invoiceForm,
  setInvoiceForm,
  onGenerate,
}: InvoiceGenerationModalProps) {
  if (!isOpen || !targetInvoiceTenant) return null;

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
          maxWidth: '550px',
          width: '100%',
          padding: '1.5rem',
        }}
      >
        <ModalErrorBoundary onReset={onClose}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--df-text-main)' }}>
            Émettre un Document Fiscal DGI : {targetInvoiceTenant.tenantName}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
            Calcul automatique de la TVA légale algérienne (19 %) et du droit de timbre pour engagement comptable.
          </p>

          <form onSubmit={onGenerate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                Nature du Document
              </label>
              <select
                value={invoiceForm.invoiceType}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value as SubscriptionInvoiceType })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
              >
                <option value="PROFORMA">Facture Proforma (Devis engageant pour bon de commande)</option>
                <option value="FACTURE_DEFINITIVE">Facture Définitive (Titre exécutoire fiscal)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Date Début Période
                </label>
                <input
                  type="date"
                  required
                  value={invoiceForm.periodStart}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, periodStart: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '0.25rem' }}>
                  Date Fin Période
                </label>
                <input
                  type="date"
                  required
                  value={invoiceForm.periodEnd}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, periodEnd: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--df-bg-surface-2)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span>Base Véhicules Facturés :</span>
                <span className="df-mono font-bold">{targetInvoiceTenant.activeVehiclesCount} véhicules</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span>Tarif Unitaire Net :</span>
                <span className="df-mono font-bold">{targetInvoiceTenant.effectivePricePerAssetDzd.toLocaleString('fr-DZ')} DA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700 }}>
                <span>Taux TVA Déductible :</span>
                <span className="df-mono">19,00 %</span>
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
                Générer le Document DGI
              </button>
            </div>
          </form>
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
