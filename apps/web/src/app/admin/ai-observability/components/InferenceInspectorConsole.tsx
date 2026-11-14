'use client';

import React from 'react';
import { IconShieldCheck } from '../../../../components/navigation/TechIcons';
import { InferenceInspectorConsoleProps } from '../types';
import { MODULE_FILTER_OPTIONS } from '../constants';

export function InferenceInspectorConsole({
  logs,
  filteredLogs,
  selectedLog,
  moduleFilter,
  onModuleFilterChange,
  onSelectLog,
}: InferenceInspectorConsoleProps) {
  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--df-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--df-bg-surface-2)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Console d&apos;Inspection des Inférences (20 Récents)
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>
            Traçabilité audit Loi 18-07 avec vue diff avant/après masquage
          </span>
        </div>

        {/* Filtre par module */}
        <select
          value={moduleFilter}
          onChange={(e) => onModuleFilterChange(e.target.value)}
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'var(--df-bg-surface-1)',
            color: 'var(--df-text-main)',
            border: '1px solid var(--df-border-subtle)',
            outline: 'none',
          }}
        >
          {MODULE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.value === 'ALL' ? `(${logs.length})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Liste compacte des requêtes */}
      <div style={{ maxHeight: '220px', overflowY: 'auto', borderBottom: '1px solid var(--df-border-subtle)' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--df-text-muted)', fontSize: '13px' }}>
            Aucune inférence enregistrée dans cette session. Lancez un test dans le Playground ci-contre.
          </div>
        ) : (
          filteredLogs.slice(0, 20).map((log) => {
            const isSelected = selectedLog?.id === log.id;
            const isLocal = log.executionSource === 'OLLAMA_QWEN_LOCAL';
            return (
              <div
                key={log.id}
                onClick={() => onSelectLog(log)}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--df-border-subtle)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: isLocal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isLocal ? '#10b981' : '#f59e0b',
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.callerModule}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', fontFamily: 'monospace' }}>
                      {new Date(log.timestamp).toLocaleTimeString('fr-DZ')}
                    </span>
                    {log.piiMaskedCount > 0 && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <IconShieldCheck size={11} />
                        {log.piiMaskedCount} PII
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--df-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '3px',
                    }}
                  >
                    {log.rawPrompt}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {log.durationMs} ms
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--df-text-muted)' }}>
                    {log.tokensPerSec ? `${log.tokensPerSec} tok/s` : log.executionSource}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vue détaillée : Avant / Après (Inspection Diff) */}
      {selectedLog ? (
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--df-bg-base)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--df-text-muted)' }}>
              INSPECTION ID : <code style={{ color: '#2563eb' }}>{selectedLog.id}</code>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: selectedLog.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: selectedLog.status === 'SUCCESS' ? '#10b981' : '#f59e0b',
              }}
            >
              {selectedLog.executionSource} ({selectedLog.status})
            </span>
          </div>

          {/* Comparatif Avant/Après Masquage PII */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                1. Prompt Brut Initial (Entrée) :
              </div>
              <pre
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '11px',
                  color: 'var(--df-text-secondary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  margin: 0,
                  fontFamily: 'monospace',
                }}
              >
                {selectedLog.rawPrompt}
              </pre>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>
                2. Prompt Anonymisé Envoyé (Loi 18-07) :
              </div>
              <pre
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '11px',
                  color: 'var(--df-text-main)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  margin: 0,
                  fontFamily: 'monospace',
                }}
              >
                {selectedLog.sanitizedPrompt}
              </pre>
            </div>
          </div>

          {/* Réponse brute générée */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4' }}>
                3. Sortie Générée par Ollama (Qwen) :
              </span>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', fontFamily: 'monospace' }}>
                {selectedLog.tokensGenerated || 0} tokens ({selectedLog.tokensPerSec || 0} tok/s)
              </span>
            </div>
            <pre
              style={{
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11px',
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                maxHeight: '180px',
                overflowY: 'auto',
                margin: 0,
                fontFamily: 'monospace',
                lineHeight: 1.5,
              }}
            >
              {selectedLog.response}
            </pre>
          </div>
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
          Sélectionnez une requête pour afficher son analyse différentielle.
        </div>
      )}
    </div>
  );
}
