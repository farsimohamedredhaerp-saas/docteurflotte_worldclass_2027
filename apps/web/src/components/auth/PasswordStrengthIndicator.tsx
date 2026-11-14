import React from 'react';
import { IconCheck } from '../navigation/TechIcons';

interface Props {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  const hasLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;

  let label = 'Trop court';
  let color = 'var(--df-status-danger)';
  let width = '25%';

  if (!password) {
    return null;
  }

  if (score === 2) {
    label = 'Moyen';
    color = 'var(--df-status-warning)';
    width = '50%';
  } else if (score === 3) {
    label = 'Bon';
    color = 'var(--df-accent-cyan)';
    width = '75%';
  } else if (score === 4) {
    label = 'Très robuste';
    color = 'var(--df-status-ok)';
    width = '100%';
  }

  return (
    <div style={{ marginTop: '8px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--df-text-muted)' }}>Robustesse :</span>
        <span style={{ color, fontWeight: 600 }}>{label}</span>
      </div>
      <div
        style={{
          height: '4px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width,
            backgroundColor: color,
            transition: 'width 0.3s ease, background-color 0.3s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', marginTop: '6px', color: 'var(--df-text-muted)' }}>
        <span style={{ color: hasLength ? 'var(--df-status-ok)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          {hasLength ? <IconCheck size={10} /> : '•'} 8+ caractères
        </span>
        <span style={{ color: hasLetter ? 'var(--df-status-ok)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          {hasLetter ? <IconCheck size={10} /> : '•'} Lettres
        </span>
        <span style={{ color: hasNumber ? 'var(--df-status-ok)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          {hasNumber ? <IconCheck size={10} /> : '•'} Chiffres
        </span>
      </div>
    </div>
  );
};
