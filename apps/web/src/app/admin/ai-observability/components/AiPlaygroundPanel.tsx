'use client';

import React from 'react';
import {
  IconRefreshCw,
  IconZap,
  IconCheck,
  IconShieldCheck,
} from '../../../../components/navigation/TechIcons';
import { AiPlaygroundPanelProps } from '../types';
import { PLAYGROUND_PRESETS } from '../constants';

export function AiPlaygroundPanel({
  prompt,
  onPromptChange,
  systemPrompt,
  onSystemPromptChange,
  jsonMode,
  onJsonModeChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  isInferring,
  result,
  error,
  onRun,
  onApplyPreset,
}: AiPlaygroundPanelProps) {
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
          background: 'var(--df-bg-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Bac à Sable de Test Interactif (Playground)
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>
            Test direct d’inférence en direct sans passer par l&apos;application
          </span>
        </div>

        <span
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#6366f1',
            fontWeight: 700,
          }}
        >
          Mode Développeur
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Presets rapides */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
            MODÈLES DE TESTS RAPIDES :
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {PLAYGROUND_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onApplyPreset(preset)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={preset.description}
              >
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt de test */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', display: 'block', marginBottom: '4px' }}>
            PROMPT BRUT (avec PII potentielles pour tester le coupe-feu) :
          </label>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              color: 'var(--df-text-main)',
              fontFamily: 'monospace',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* System Prompt optionnel */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', display: 'block', marginBottom: '4px' }}>
            SYSTEM PROMPT (Consignes & Spécialisation) :
          </label>
          <input
            type="text"
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '12px',
              color: 'var(--df-text-main)',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>

        {/* Paramètres d'inférence (JSON, Température, MaxTokens) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '14px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={jsonMode}
              onChange={(e) => onJsonModeChange(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>Format JSON Strict</span>
          </label>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginBottom: '2px' }}>
              Température : <strong>{temperature}</strong>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.8"
              step="0.1"
              value={temperature}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginBottom: '2px' }}>
              Max Tokens : <strong>{maxTokens}</strong>
            </div>
            <input
              type="range"
              min="100"
              max="512"
              step="50"
              value={maxTokens}
              onChange={(e) => onMaxTokensChange(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Bouton de déclenchement */}
        <button
          onClick={onRun}
          disabled={isInferring || !prompt.trim()}
          style={{
            padding: '11px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: isInferring ? 'not-allowed' : 'pointer',
            background: isInferring ? '#94A3B8' : '#059669',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isInferring ? 'none' : '0 2px 8px rgba(5, 150, 105, 0.4)',
          }}
        >
          {isInferring ? (
            <>
              <IconRefreshCw size={14} className="animate-spin" />
              <span>Inférence CPU en cours sur Qwen 2.5...</span>
            </>
          ) : (
            <>
              <IconZap size={14} />
              <span>Lancer l&apos;Inférence Directe</span>
            </>
          )}
        </button>

        {/* Résultat du test */}
        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12px',
            }}
          >
            <strong>Erreur d’inférence :</strong> {error}
          </div>
        )}

        {result && (
          <div
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '10px',
              padding: '14px',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '11px',
              }}
            >
              <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconCheck size={13} />
                Inférence Terminée avec Succès
              </span>
              <span style={{ fontFamily: 'monospace', color: 'var(--df-text-muted)' }}>
                {result.durationMs} ms | {result.tokensPerSec} tok/s | {result.tokensGenerated} tokens
              </span>
            </div>

            {result.piiMaskedCount > 0 && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#f59e0b',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <IconShieldCheck size={13} />
                <span>
                  <strong>Loi 18-07 active :</strong> {result.piiMaskedCount} donnée(s) personnelle(s) ont été masquées
                  avant transmission à Ollama.
                </span>
              </div>
            )}

            <pre
              style={{
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11px',
                color: '#38bdf8',
                whiteSpace: 'pre-wrap',
                maxHeight: '190px',
                overflowY: 'auto',
                margin: 0,
                fontFamily: 'monospace',
                lineHeight: 1.5,
              }}
            >
              {result.response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
