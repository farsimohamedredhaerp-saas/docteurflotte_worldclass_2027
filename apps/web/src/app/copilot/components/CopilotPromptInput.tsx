'use client';

import React from 'react';
import { CopilotPromptInputProps } from '../types';

export function CopilotPromptInput({
  inputValue,
  onInputChange,
  isLoading,
  onSend,
  chips,
}: CopilotPromptInputProps) {
  return (
    <>
      {/* Quick Prompt Suggestions Chips */}
      <div
        style={{
          padding: '10px 18px',
          background: 'var(--df-bg-surface-2)',
          borderTop: '1px solid var(--df-border-subtle)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {chips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSend(chip.prompt)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
              e.currentTarget.style.color = '#a5b4fc';
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--df-bg-surface-1)',
          borderTop: '1px solid var(--df-border-subtle)',
          display: 'flex',
          gap: '12px',
        }}
      >
        <input
          type="text"
          placeholder="Posez une question sur un véhicule, une panne prédictive ou un budget Naftal..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend();
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid var(--df-border-medium)',
            background: 'var(--df-bg-surface-2)',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => onSend()}
          disabled={isLoading || !inputValue.trim()}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: inputValue.trim()
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : 'var(--df-bg-surface-2)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px',
            cursor: inputValue.trim() ? 'pointer' : 'default',
            opacity: inputValue.trim() ? 1 : 0.5,
          }}
        >
          Envoyer
        </button>
      </div>
    </>
  );
}

