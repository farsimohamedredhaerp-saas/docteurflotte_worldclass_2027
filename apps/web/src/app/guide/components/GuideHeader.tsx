'use client';

import React from 'react';
import Link from 'next/link';
import {
  IconSearch,
  IconRadio,
  IconSliders,
  IconZap,
} from '../../../components/navigation/TechIcons';

interface GuideHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function GuideHeader({ searchQuery, onSearchChange }: GuideHeaderProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--df-bg-surface-1) 0%, var(--df-bg-surface-2) 100%)',
        borderBottom: '1px solid var(--df-border-subtle)',
        padding: '44px 24px 36px',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--df-accent-blue)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            DocteurFlotte Documentation Technique & Stratégique v3.0 (World-Class DZ)
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'var(--df-status-ok-bg)',
              color: 'var(--df-status-ok-text)',
              border: '1px solid var(--df-status-ok-border)',
            }}
          >
            Conforme Loi 18-07 ANPDP • DGI • ENACTA
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#0284c7',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            PostgreSQL 16 RLS Fail-Closed • Ollama Qwen 2.5 Local • TimescaleDB
          </span>
        </div>

        <h1
          style={{
            fontSize: '34px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            marginBottom: '14px',
            color: 'var(--df-text-main)',
          }}
        >
          Guide d’Architecture, Fonctionnalités & Vision Stratégique
        </h1>

        <p
          style={{
            fontSize: '15.5px',
            lineHeight: 1.65,
            color: 'var(--df-text-secondary)',
            maxWidth: '960px',
            marginBottom: '24px',
          }}
        >
          Référentiel complet de la plateforme souveraine DocteurFlotte : sa rupture avec la télématique passive, 
          ses <strong>3 modes d’exploitation (dont le Mode 0 Sans Boîtier)</strong>, ses <strong>6 algorithmes de physique déterministe</strong>, 
          son <strong>IA souveraine locale Ollama (Qwen 2.5)</strong> avec audit temps réel, son <strong>jumeau numérique multi-climats</strong>, 
          son arbitrage financier en Dinars Algériens (DZD) et sa supériorité concurrentielle face aux géants mondiaux.
        </p>

        {/* Quick Search and Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <input
              type="text"
              placeholder="Rechercher (Arrhenius, Qwen, Naftal, RLS, CUSUM, Jumeau, Samsara)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '8px',
                border: '1px solid var(--df-border-medium)',
                background: 'var(--df-bg-surface-1)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--df-text-muted)',
              }}
            >
              <IconSearch size={15} />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--df-text-muted)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <Link
            href="/digital-twin"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconRadio size={14} />
            <span>Tester Jumeau Numérique</span>
          </Link>

          <Link
            href="/decisions"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconSliders size={14} />
            <span>Voir Décisions ADS en DZD</span>
          </Link>

          <Link
            href="/admin/ai-observability"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#eab308',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconZap size={14} />
            <span>Audit Ollama & Loi 18-07</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

