'use client';

import React from 'react';
import { IconSliders, IconFileText } from '@/components/navigation/TechIcons';
import type { TenantSubscription } from '../types';

interface TenantsSubscriptionsTableProps {
  tenantSubs: TenantSubscription[];
  onNegotiate: (sub: TenantSubscription) => void;
  onInvoice: (sub: TenantSubscription) => void;
}

export function TenantsSubscriptionsTable({
  tenantSubs,
  onNegotiate,
  onInvoice,
}: TenantsSubscriptionsTableProps) {
  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--df-border-subtle)',
          background: 'var(--df-bg-surface-2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
          Portefeuille des Abonnements Clients &amp; Surcharges Négociées
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
          Chaque client peut bénéficier d&apos;un tarif unitaire dérogatoire ou d&apos;une remise négociée
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Client / Organisation</th>
              <th style={{ padding: '0.75rem 1rem' }}>Plan Souscrit</th>
              <th style={{ padding: '0.75rem 1rem' }}>Formule</th>
              <th style={{ padding: '0.75rem 1rem' }}>Véhicules (Actifs / Total)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tarif Unitaire Net</th>
              <th style={{ padding: '0.75rem 1rem' }}>Prochaine Échéance</th>
              <th style={{ padding: '0.75rem 1rem' }}>Règlement</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenantSubs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                  Aucun abonnement client enregistré.
                </td>
              </tr>
            ) : (
              tenantSubs.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--df-text-main)' }}>
                    <div>{sub.tenantName || sub.tenantSlug}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--df-text-muted)' }}>
                      ID: {sub.tenantId.substring(0, 8)}...
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--df-accent-blue)',
                      }}
                    >
                      {sub.planName}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>
                    {sub.billingModel}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--df-status-ok)' }} className="df-mono">
                      {sub.activeVehiclesCount}
                    </span>
                    <span style={{ color: 'var(--df-text-muted)' }}> / {sub.allocatedVehiclesLimit}</span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>
                      ({sub.idleVehiclesCount} au garage à 0 DA)
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }} className="df-mono">
                      {sub.effectivePricePerAssetDzd.toLocaleString('fr-DZ')} DA
                    </div>
                    {sub.discountPercent > 0 && (
                      <div style={{ fontSize: '0.68rem', color: '#f59e0b' }}>
                        Remise {sub.discountPercent}% appliquée
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--df-text-main)' }}>
                      {sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('fr-DZ') : 'Indéterminée'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#38bdf8' }} className="df-mono">
                      ~{sub.estimatedNextBillingAmountDzd.toLocaleString('fr-DZ')} DA TTC
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                    <div>{sub.paymentMethod}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)' }}>{sub.paymentTerms}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => onNegotiate(sub)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '5px',
                          background: 'var(--df-bg-surface-2)',
                          border: '1px solid var(--df-border-subtle)',
                          color: 'var(--df-text-main)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconSliders size={12} />
                        Négocier
                      </button>
                      <button
                        type="button"
                        onClick={() => onInvoice(sub)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '5px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          color: '#93c5fd',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconFileText size={12} />
                        Facturer DGI
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
