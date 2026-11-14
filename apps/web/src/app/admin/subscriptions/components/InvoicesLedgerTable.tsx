'use client';

import React from 'react';
import type { SubscriptionInvoice } from '../types';

interface InvoicesLedgerTableProps {
  invoices: SubscriptionInvoice[];
}

export function InvoicesLedgerTable({ invoices }: InvoicesLedgerTableProps) {
  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: '12px',
        padding: '1.25rem',
      }}
    >
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--df-text-main)' }}>
        Registre des Factures Officielles &amp; Proformas DGI (TVA 19% &amp; Timbre)
      </h3>
      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--df-text-muted)' }}>
          Aucune facture générée durant cette session. Utilisez le bouton « Facturer DGI » dans l&apos;onglet des tenants pour émettre un proforma.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>N° Facture</th>
                <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                <th style={{ padding: '0.75rem 1rem' }}>Période</th>
                <th style={{ padding: '0.75rem 1rem' }}>Véhicules</th>
                <th style={{ padding: '0.75rem 1rem' }}>Montant HT</th>
                <th style={{ padding: '0.75rem 1rem' }}>TVA (19%)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Timbre Fiscal</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total TTC (DZD)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }} className="df-mono">
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--df-bg-surface-2)' }}>
                      {inv.invoiceType}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--df-text-main)' }}>{inv.tenantName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--df-text-muted)' }}>
                    {inv.periodStart} au {inv.periodEnd}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.totalVehiclesBilled}</td>
                  <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.subtotalHtDzd.toLocaleString('fr-DZ')} DA</td>
                  <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.tvaAmountDzd.toLocaleString('fr-DZ')} DA</td>
                  <td style={{ padding: '0.75rem 1rem' }} className="df-mono">{inv.stampDutyDzd.toLocaleString('fr-DZ')} DA</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#38bdf8' }} className="df-mono">
                    {inv.totalTtcDzd.toLocaleString('fr-DZ')} DA
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
