'use client';

import React from 'react';
import { OemTraceAuditTrailProps } from '../types';

export function OemTraceAuditTrail({
  traceSteps,
  searchMode,
}: OemTraceAuditTrailProps) {
  if (traceSteps.length === 0) return null;

  return (
    <div
      style={{
        background: '#111317',
        border: '1px solid #23272F',
        borderRadius: '4px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid #23272F',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 6px #10B981',
            }}
          />
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              margin: 0,
              color: '#F3F4F6',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Journal d&apos;Exécution & Traçabilité du Scraper OEM
          </h3>
          <span
            style={{
              background: '#181B20',
              border: '1px solid #343A46',
              color: '#2563EB',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '3px',
              fontFamily: 'JetBrains Mono, monospace',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {traceSteps.length} ÉTAPES AUDITÉES
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>
          Mode : {searchMode === 'VIN' ? 'DÉCODAGE_CHÂSSIS_ISO_3779' : 'SCORING_MULTI_CRITÈRES_DÉTERMINISTE'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {traceSteps.map((s) => {
          const isMatch = s.level === 'MATCH';
          const isWarning = s.level === 'WARNING';
          const isReject = s.level === 'REJECT';
          const isFallback = s.level === 'FALLBACK';

          const badgeBg = isMatch
            ? 'rgba(16, 185, 129, 0.12)'
            : isWarning || isFallback
              ? 'rgba(245, 158, 11, 0.12)'
              : isReject
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(37, 99, 235, 0.12)';

          const badgeBorder = isMatch
            ? '#10B981'
            : isWarning || isFallback
              ? '#F59E0B'
              : isReject
                ? '#EF4444'
                : '#2563EB';

          return (
            <div
              key={s.step}
              style={{
                background: '#090A0C',
                border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.3)' : '#23272F'}`,
                borderRadius: '4px',
                padding: '0.6rem 0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.82rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                  color: '#6B7280',
                  fontSize: '0.75rem',
                  minWidth: '22px',
                }}
              >
                #{String(s.step).padStart(2, '0')}
              </span>

              <span
                style={{
                  background: badgeBg,
                  border: `1px solid ${badgeBorder}`,
                  color: badgeBorder,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '2px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.phase}
              </span>

              <div style={{ flex: 1 }}>
                <span style={{ color: '#F3F4F6', lineHeight: 1.45 }}>{s.message}</span>
                {s.details && (
                  <div
                    style={{
                      marginTop: '0.35rem',
                      padding: '0.35rem 0.5rem',
                      background: '#111317',
                      border: '1px solid #23272F',
                      borderRadius: '2px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '0.72rem',
                      color: '#9CA3AF',
                      wordBreak: 'break-all',
                    }}
                  >
                    {JSON.stringify(s.details)}
                  </div>
                )}
              </div>

              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '0.72rem',
                  color: '#6B7280',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
