'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { IconAlertTriangle } from '@/components/navigation/TechIcons';
import type { DeleteConfirmTarget } from '../../types';

interface DeleteConfirmModalProps {
  target: DeleteConfirmTarget | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  target,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!target) return null;

  return (
    <Modal
      isOpen={Boolean(target)}
      onClose={onClose}
      title="Confirmation de Suppression"
      subtitle={target.type === 'TEMPLATE' ? 'Suppression d’un gabarit d’entretien' : 'Suppression d’une échéance active'}
      size="sm"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-secondary)',
              padding: '6px 14px',
              borderRadius: 'var(--df-radius-md)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: '#EF4444',
              border: 'none',
              color: '#FFFFFF',
              padding: '6px 16px',
              borderRadius: 'var(--df-radius-md)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Confirmer la Suppression
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconAlertTriangle size={20} />
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
          Êtes-vous sûr de vouloir supprimer définitivement :{' '}
          <strong style={{ color: '#fff' }}>{target.label}</strong> ? Cette action est irréversible.
        </p>
      </div>
    </Modal>
  );
}
