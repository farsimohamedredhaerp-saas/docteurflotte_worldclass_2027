'use client';

import React, { useEffect, useState } from 'react';
import { AuthClient } from '../../../lib/api-auth';
import { PlatformAdminClient } from '../../../lib/api-platform-admin';
import { PlatformAuditLog } from '@docteurflotte/contracts';
import { IconRefreshCw } from '../../../components/navigation/TechIcons';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = () => {
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsLoading(true);
    PlatformAdminClient.getAuditLogs(session.token)
      .then((data) => {
        setLogs(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Piste d’Audit Immuable SuperAdmin (Append-Only)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Journal infalsifiable avec déclencheur de non-modification PostgreSQL (Code 55000) et chaînage SHA-256.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-subtle)',
            color: 'var(--df-text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Actualiser le journal
        </button>
      </div>

      <div style={{ borderRadius: '12px', border: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>HORODATAGE</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ACTEUR</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ACTION</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>CIBLE</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>DÉTAILS & JUSTIFICATION</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                  Chargement de la piste d'audit...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                  Aucun événement d'audit enregistré pour le moment.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--df-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--df-text-main)' }}>
                    <div>{log.actor_email}</div>
                    <div style={{ fontSize: '10px', color: 'var(--df-text-muted)' }}>{log.actor_role}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          log.action.includes('ACTIVATE') || log.action.includes('CREATE')
                            ? 'rgba(16, 185, 129, 0.15)'
                            : log.action.includes('ROLLBACK')
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color:
                          log.action.includes('ACTIVATE') || log.action.includes('CREATE')
                            ? '#34d399'
                            : log.action.includes('ROLLBACK')
                            ? '#fca5a5'
                            : '#60a5fa',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--df-text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                    {log.target_entity}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--df-text-secondary)' }}>
                    {log.notes || '—'}
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
