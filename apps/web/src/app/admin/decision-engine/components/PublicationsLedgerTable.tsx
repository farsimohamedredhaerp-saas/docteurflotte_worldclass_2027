'use client';

import React from 'react';
import type { PlatformConfigPublication } from '../types';

interface PublicationsLedgerTableProps {
  publications: PlatformConfigPublication[];
}

export function PublicationsLedgerTable({ publications }: PublicationsLedgerTableProps) {
  return (
    <>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '16px' }}>
        Historique Immuable des Publications &amp; Rollbacks (Ledger)
      </h2>

      <div
        style={{
          borderRadius: '12px',
          border: '1px solid var(--df-border-subtle)',
          backgroundColor: 'var(--df-bg-surface-1)',
          overflow: 'hidden',
          marginBottom: '32px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ÉVÉNEMENT</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>VERSION</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ACTEUR</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>DATE D&apos;EFFET</th>
                <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>JUSTIFICATION</th>
              </tr>
            </thead>
            <tbody>
              {publications.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                    Aucune publication enregistrée dans le grand livre immuable.
                  </td>
                </tr>
              ) : (
                publications.map((p, idx) => (
                  <tr key={p.id ? `${p.id}-${idx}` : `pub-${idx}`} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            p.event_type === 'PUBLICATION_ACTIVATE'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            p.event_type === 'PUBLICATION_ACTIVATE'
                              ? '#34d399'
                              : '#fca5a5',
                        }}
                      >
                        {p.event_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                      {p.version}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--df-text-secondary)' }}>
                      {p.published_by}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>
                      {new Date(p.effective_from).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--df-text-secondary)' }}>
                      {p.justification || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
