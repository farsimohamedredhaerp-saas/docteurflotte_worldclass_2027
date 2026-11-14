'use client';

import React from 'react';
import Link from 'next/link';
import {
  IconSparkles,
  IconZap,
  IconFuel,
  IconBarChart3,
} from '../../../components/navigation/TechIcons';
import { CopilotHeaderProps } from '../types';

export function CopilotHeader({ aiStatus }: CopilotHeaderProps) {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 1) 100%)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <IconSparkles size={22} className="text-indigo-400" />
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Ask DocteurFlotte — Copilote Décisionnel d’Exploitation (SAD → ADS)
            </h1>
            <span
              style={{
                fontSize: '11px',
                background: 'rgba(99, 102, 241, 0.3)',
                color: '#c7d2fe',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              IA SOUVERAINE & PHYSIQUE
            </span>
            <span
              style={{
                fontSize: '11px',
                background: aiStatus.available
                  ? 'rgba(16, 185, 129, 0.22)'
                  : 'rgba(245, 158, 11, 0.2)',
                border: aiStatus.available
                  ? '1px solid rgba(16, 185, 129, 0.45)'
                  : '1px solid rgba(245, 158, 11, 0.4)',
                color: aiStatus.available ? '#6ee7b7' : '#fcd34d',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              {aiStatus.available
                ? `OLLAMA / QWEN2.5 ACTIF (${aiStatus.model}) • LOI 18-07`
                : 'MODE DÉTERMINISTE PUR (FALLBACK GRACIEUX • OLLAMA HORS-LIGNE)'}
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
            Diagnostic de panne instantané, preuves télématiques chiffrées, détection de fraude et arbitrage financier en
            Dinars (DZD).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/admin/ai-observability"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(129, 140, 248, 0.45)',
              color: '#a5b4fc',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <IconZap size={13} />
            <span>Observabilité & Audit IA</span>
          </Link>

          <Link
            href="/fuel-scanner"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <IconFuel size={13} />
            <span>Scanner Reçus Naftal (OCR)</span>
          </Link>

          <Link
            href="/decisions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '12.5px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <IconBarChart3 size={13} />
            <span>Tableau Décisionnel</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

