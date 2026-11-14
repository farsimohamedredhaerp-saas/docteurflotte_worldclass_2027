import React from 'react';
import { IconCheck } from '../navigation/TechIcons';

interface SetupStepperProps {
  currentStep: number;
}

export const SetupStepper: React.FC<SetupStepperProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, title: 'Pack Métier' },
    { num: 2, title: 'Métrologie & Devise' },
    { num: 3, title: 'Activation' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
      {steps.map((s, idx) => {
        const isActive = s.num === currentStep;
        const isDone = s.num < currentStep;

        return (
          <React.Fragment key={s.num}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  backgroundColor: isDone
                    ? 'var(--df-status-ok)'
                    : isActive
                      ? 'var(--df-brand-primary)'
                      : 'var(--df-bg-surface-2)',
                  color: isDone || isActive ? '#ffffff' : 'var(--df-text-muted)',
                  border: isActive ? '2px solid var(--df-accent-cyan)' : '1px solid var(--df-border-subtle)',
                  boxShadow: isActive ? 'var(--df-shadow-glow-blue)' : 'none',
                }}
              >
                {isDone ? <IconCheck size={14} /> : s.num}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                }}
              >
                {s.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                style={{
                  height: '2px',
                  width: '36px',
                  backgroundColor: isDone ? 'var(--df-status-ok)' : 'rgba(255, 255, 255, 0.08)',
                  transition: 'background-color 0.3s ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
