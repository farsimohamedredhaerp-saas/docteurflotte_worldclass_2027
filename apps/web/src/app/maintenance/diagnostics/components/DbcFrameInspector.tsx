'use client';

import React, { useState, useMemo } from 'react';
import { DBC_CAN_DEFINITIONS, decodeRawCanFrame } from '@/lib/api-maintenance-40';

export function DbcFrameInspector() {
  const [selectedDbcFrameHex, setSelectedDbcFrameHex] = useState<string>(
    DBC_CAN_DEFINITIONS[0]?.frameIdHex || '0x18FEEE00'
  );
  const [customHexPayload, setCustomHexPayload] = useState<string>('5C 40 82 00 00 00 00 00');

  const selectedDef = useMemo(() => {
    return DBC_CAN_DEFINITIONS.find((d) => d.frameIdHex.toUpperCase() === selectedDbcFrameHex.toUpperCase());
  }, [selectedDbcFrameHex]);

  const decodedResult = useMemo(() => {
    return decodeRawCanFrame(selectedDbcFrameHex, customHexPayload);
  }, [selectedDbcFrameHex, customHexPayload]);

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
            Décodeur .DBC J1939 & Inspecteur de Trames Calculateurs
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
            Base de conversion SAE J1939 / OpenDBC pour le décodage physique temps réel des trames brutes.
          </p>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          {DBC_CAN_DEFINITIONS.length} Trames Définies
        </span>
      </div>

      {/* Frame Selection & Payload Input */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
            Trame CAN J1939 (ID Hex / Nom) :
          </label>
          <select
            value={selectedDbcFrameHex}
            onChange={(e) => setSelectedDbcFrameHex(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12.5px',
              padding: '7px 10px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {DBC_CAN_DEFINITIONS.map((def) => (
              <option key={def.frameIdHex} value={def.frameIdHex}>
                {def.frameIdHex} — {def.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
            Payload Brut Hexadécimal (8 octets) :
          </label>
          <input
            type="text"
            value={customHexPayload}
            onChange={(e) => setCustomHexPayload(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '6px',
              color: '#6ee7b7',
              fontSize: '12.5px',
              padding: '7px 10px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            placeholder="5C 40 82 00 00 00 00 00"
          />
        </div>
      </div>

      {/* Decoded Signals Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
              <th style={{ padding: '8px 12px' }}>Signal J1939</th>
              <th style={{ padding: '8px 12px' }}>SPN</th>
              <th style={{ padding: '8px 12px' }}>Valeur Brute (Raw)</th>
              <th style={{ padding: '8px 12px' }}>Valeur Physique Décodée</th>
              <th style={{ padding: '8px 12px' }}>Unité</th>
            </tr>
          </thead>
          <tbody>
            {decodedResult?.signals.map((sig, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--df-border-subtle)',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                }}
              >
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>
                  {sig.name}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#a5b4fc' }}>
                  {sig.spn ?? '--'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {sig.rawValue}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#10B981' }}>
                  {sig.physicalValue.toFixed(2)}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--df-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {sig.unit}
                </td>
              </tr>
            ))}
            {!decodedResult && (
              <tr>
                <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                  Trame ou payload non décodable.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
