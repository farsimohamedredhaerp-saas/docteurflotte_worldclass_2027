'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { OemMaintenanceTemplate, TemplateFormData, TemplateCategory } from '../../types';

interface OemTemplateModalProps {
  isOpen: boolean;
  editingTemplate: OemMaintenanceTemplate | null;
  form: TemplateFormData;
  onChangeForm: (form: TemplateFormData) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function OemTemplateModal({
  isOpen,
  editingTemplate,
  form,
  onChangeForm,
  onSave,
  onClose,
}: OemTemplateModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTemplate ? `Modifier Programme : ${editingTemplate.make} ${editingTemplate.model}` : 'Nouveau Programme Préventif OEM'}
      subtitle="Spécifications constructeur et intervalles d'entretien"
      size="lg"
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
            Enregistrer le Gabarit
          </button>
        </div>
      }
    >
      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Constructeur (Make) :
            </label>
            <input
              type="text"
              required
              value={form.make}
              onChange={(e) => onChangeForm({ ...form, make: e.target.value })}
              placeholder="ex: Renault Trucks, Scania, Shacman..."
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Modèle & Motorisation :
            </label>
            <input
              type="text"
              required
              value={form.model}
              onChange={(e) => onChangeForm({ ...form, model: e.target.value })}
              placeholder="ex: K 480 DTi 13 Euro 3..."
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Catégorie d'Actif :
            </label>
            <select
              value={form.category}
              onChange={(e) => onChangeForm({ ...form, category: e.target.value as TemplateCategory })}
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
            >
              <option value="POIDS_LOURDS">Poids Lourds</option>
              <option value="ENGINS_BTP">Engins BTP</option>
              <option value="UTILITAIRES">Utilitaires</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Facteur de Sévérité Saharienne (&alpha;) :
            </label>
            <input
              type="number"
              step="0.01"
              min="0.4"
              max="1.0"
              required
              value={form.severityFactor}
              onChange={(e) => onChangeForm({ ...form, severityFactor: parseFloat(e.target.value) || 0.65 })}
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px', fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Intervalle Standard Constructeur :
            </label>
            <input
              type="text"
              required
              value={form.standardIntervalText}
              onChange={(e) => onChangeForm({ ...form, standardIntervalText: e.target.value })}
              placeholder="ex: 40 000 km / 800 h"
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Périodicité Sahara Recommandée :
            </label>
            <input
              type="text"
              required
              value={form.saharaIntervalText}
              onChange={(e) => onChangeForm({ ...form, saharaIntervalText: e.target.value })}
              placeholder="ex: 26 000 km / 550 h"
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 8px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Spécification Huile Moteur :
            </label>
            <input
              type="text"
              value={form.engineOilSpec}
              onChange={(e) => onChangeForm({ ...form, engineOilSpec: e.target.value })}
              placeholder="15W-40 VDS-4.5"
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Huile Boîte / Pont :
            </label>
            <input
              type="text"
              value={form.transmissionSpec}
              onChange={(e) => onChangeForm({ ...form, transmissionSpec: e.target.value })}
              placeholder="75W-80 ZF"
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
              Liquide Refroidissement :
            </label>
            <input
              type="text"
              value={form.coolantSpec}
              onChange={(e) => onChangeForm({ ...form, coolantSpec: e.target.value })}
              placeholder="OAT Protect"
              style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '6px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
            Points de Contrôle Critiques (1 par ligne) :
          </label>
          <textarea
            rows={3}
            value={form.criticalPointsText}
            onChange={(e) => onChangeForm({ ...form, criticalPointsText: e.target.value })}
            placeholder="Double filtration gasoil Naftal&#10;Contrôle jeu aux soupapes"
            style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '11.5px', padding: '6px', lineHeight: 1.4 }}
          />
        </div>
      </form>
    </Modal>
  );
}
