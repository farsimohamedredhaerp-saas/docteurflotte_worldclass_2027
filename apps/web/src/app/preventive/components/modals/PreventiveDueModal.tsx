'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { UpcomingPreventiveDue, DueFormData, OemMaintenanceTemplate } from '../../types';

interface PreventiveDueModalProps {
  isOpen: boolean;
  editingDue: UpcomingPreventiveDue | null;
  form: DueFormData;
  templates: OemMaintenanceTemplate[];
  onChangeForm: (form: DueFormData) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function PreventiveDueModal({
  isOpen,
  editingDue,
  form,
  templates,
  onChangeForm,
  onSave,
  onClose,
}: PreventiveDueModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingDue ? `Modifier Échéance : ${editingDue.registrationNumber}` : 'Ajouter une Échéance de Maintenance'}
      subtitle="Programmation odométrique ou horaire d'intervention"
      size="md"
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
            onClick={onSave}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              color: '#FFFFFF',
              padding: '6px 16px',
              borderRadius: 'var(--df-radius-md)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Valider l'Échéance
          </button>
        </div>
      }
    >
      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Immatriculation Véhicule :
            </label>
            <input
              type="text"
              required
              value={form.registrationNumber}
              onChange={(e) => onChangeForm({ ...form, registrationNumber: e.target.value })}
              placeholder="ex: 01452-122-16"
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px', fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Modèle & Marque :
            </label>
            <input
              type="text"
              required
              value={form.makeModel}
              onChange={(e) => onChangeForm({ ...form, makeModel: e.target.value })}
              placeholder="ex: Renault Trucks K 480"
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
            Programme d'Entretien Associé :
          </label>
          <select
            value={form.templateName}
            onChange={(e) => onChangeForm({ ...form, templateName: e.target.value })}
            style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
          >
            <option value="">Sélectionner un programme OEM...</option>
            {templates.map((t) => (
              <option key={t.id} value={`${t.make} ${t.model}`}>
                {t.make} {t.model} ({t.standardIntervalText})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Compteur Actuel :
            </label>
            <input
              type="number"
              required
              value={form.currentCounter}
              onChange={(e) => onChangeForm({ ...form, currentCounter: parseInt(e.target.value, 10) || 0 })}
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px', fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Compteur Cible :
            </label>
            <input
              type="number"
              required
              value={form.dueCounter}
              onChange={(e) => onChangeForm({ ...form, dueCounter: parseInt(e.target.value, 10) || 0 })}
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px', fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Unité :
            </label>
            <select
              value={form.unit}
              onChange={(e) => onChangeForm({ ...form, unit: e.target.value as 'km' | 'h' })}
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
            >
              <option value="km">Kilomètres (km)</option>
              <option value="h">Heures Moteur (h)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
            Site / Dépôt d'Affectation :
          </label>
          <input
            type="text"
            required
            value={form.assignedSite}
            onChange={(e) => onChangeForm({ ...form, assignedSite: e.target.value })}
            placeholder="ex: Base Vie Hassi Messaoud (30)"
            style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
          />
        </div>
      </form>
    </Modal>
  );
}
