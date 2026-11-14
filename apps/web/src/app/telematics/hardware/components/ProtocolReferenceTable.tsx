import React from 'react';
import { IconFileText } from '@/components/navigation/TechIcons';
import { PROTOCOL_REFERENCE_DATA } from '../constants';

export function ProtocolReferenceTable() {
  return (
    <div style={{ maxWidth: '1360px', margin: '48px auto', padding: '0 24px' }}>
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '14px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconFileText size={20} /> Tableau de Référence des Ports & Protocoles Télématiques
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', margin: 0 }}>
              Ports d’écoute configurés dans le conteneur Docker Traccar souverain et correspondance Flespi.
            </p>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
            200+ Protocoles Inclus
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>Port Traccar</th>
                <th style={{ padding: '10px 14px' }}>Protocole Traccar</th>
                <th style={{ padding: '10px 14px' }}>Fabricants Principaux</th>
                <th style={{ padding: '10px 14px' }}>Type d’Appareil Flespi</th>
                <th style={{ padding: '10px 14px' }}>Transport</th>
                <th style={{ padding: '10px 14px' }}>Décodage CAN</th>
              </tr>
            </thead>
            <tbody>
              {PROTOCOL_REFERENCE_DATA.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--df-border-subtle)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--df-bg-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8' }}>
                    {row.port}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#a5b4fc' }}>
                    {row.proto}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>
                    {row.mfr}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#7dd3fc' }}>
                    {row.flespi}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--df-text-muted)' }}>
                    {row.trans}
                  </td>
                  <td style={{ padding: '12px 14px', color: row.can.includes('J1939') ? '#34d399' : 'var(--df-text-secondary)', fontWeight: 600 }}>
                    {row.can}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

