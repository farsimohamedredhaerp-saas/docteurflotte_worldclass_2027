'use client';

import React from 'react';
import { IconShieldCheck, IconZap } from '@/components/navigation/TechIcons';

interface LoginQuickAdminCardProps {
  onQuickFillAdmin: () => void;
  onEnterDemoMode: () => void;
}

export function LoginQuickAdminCard({
  onQuickFillAdmin,
  onEnterDemoMode,
}: LoginQuickAdminCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {/* 1-Clic Démo Interactive pour Prospects & DAF */}
      <button
        type="button"
        onClick={onEnterDemoMode}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '11px 16px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.14) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--df-shadow-sm)',
        }}
      >
        <IconZap size={16} className="text-emerald-400" />
        <span>⚡ Explorer la Démo Interactive (Accès Libre)</span>
      </button>

      {/* Raccourci Compte Administrateur Plateforme */}
      <div
        style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: 700,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <IconShieldCheck size={12} className="text-amber-400" />
            COMPTE SUPERADMIN PLATEFORME
          </div>
          <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
            admin@farsi.dz
          </div>
        </div>
        <button
          type="button"
          onClick={onQuickFillAdmin}
          style={{
            background: 'rgba(56, 189, 248, 0.18)',
            border: '1px solid #38bdf8',
            color: '#38bdf8',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Pré-remplir
        </button>
      </div>
    </div>
  );
}

