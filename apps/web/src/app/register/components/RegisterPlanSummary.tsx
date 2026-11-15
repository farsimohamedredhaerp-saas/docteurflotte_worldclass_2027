'use client';

import React from 'react';
import { IconShieldCheck, IconZap, IconCreditCard } from '@/components/navigation/TechIcons';

export function RegisterPlanSummary() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          padding: '8px 10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--df-status-ok)' }}>
          <IconShieldCheck size={13} />
          <span>Loi 18-07 ANPDP</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
          Hébergement local DZ
        </div>
      </div>

      <div
        style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          padding: '8px 10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
          <IconZap size={13} />
          <span>Mode 0 Sans Boîtier</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
          Actif dès le Jour 1
        </div>
      </div>

      <div
        style={{
          background: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: '8px',
          padding: '8px 10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#eab308' }}>
          <IconCreditCard size={13} />
          <span>DGI &amp; ENACTA</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
          Facturation DZD
        </div>
      </div>
    </div>
  );
}

