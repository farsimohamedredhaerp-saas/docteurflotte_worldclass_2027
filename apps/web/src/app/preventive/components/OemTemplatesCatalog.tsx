'use client';

import React from 'react';
import {
  IconLayers,
  IconEdit,
  IconTrash,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import type { OemMaintenanceTemplate } from '../types';

interface OemTemplatesCatalogProps {
  templates: OemMaintenanceTemplate[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onEditTemplate: (tpl: OemMaintenanceTemplate) => void;
  onDeleteTemplate: (tpl: OemMaintenanceTemplate) => void;
}

export function OemTemplatesCatalog({
  templates,
  selectedCategory,
  onCategoryChange,
  onEditTemplate,
  onDeleteTemplate,
}: OemTemplatesCatalogProps) {
  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconLayers size={18} className="text-indigo-400" />
            Référentiel des Programmes d’Entretien Constructeurs OEM
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
            Spécifications de lubrification et périodicités standard vs conditions sahariennes.
          </p>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Tous Gabarits' },
            { id: 'POIDS_LOURDS', label: 'Poids Lourds' },
            { id: 'ENGINS_BTP', label: 'Engins BTP / Carrières' },
            { id: 'UTILITAIRES', label: 'Pick-ups & Utilitaires' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: selectedCategory === cat.id ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
                background: selectedCategory === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'var(--df-bg-surface-2)',
                color: selectedCategory === cat.id ? '#fff' : 'var(--df-text-muted)',
                fontSize: '11.5px',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
        }}
      >
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {tpl.make}
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>
                    {tpl.model}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => onEditTemplate(tpl)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--df-border-subtle)',
                      color: 'var(--df-text-muted)',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <IconEdit size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(tpl)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <IconTrash size={11} />
                  </button>
                </div>
              </div>

              {/* Intervals Box */}
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginTop: '10px',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--df-text-muted)' }}>Intervalle Standard :</span>
                  <strong style={{ color: '#fff' }}>{tpl.standardIntervalText}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#F59E0B' }}>Périodicité Sahara (&alpha; = {tpl.severityFactor}) :</span>
                  <strong style={{ color: '#F59E0B' }}>{tpl.saharaIntervalText}</strong>
                </div>
              </div>

              {/* Fluids Specifications */}
              <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--df-text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>Huile Moteur : <strong style={{ color: '#fff' }}>{tpl.engineOilSpec}</strong></div>
                <div>Boîte / Pont : <strong style={{ color: '#fff' }}>{tpl.transmissionSpec}</strong></div>
                <div>Refroidissement : <strong style={{ color: '#fff' }}>{tpl.coolantSpec}</strong></div>
              </div>
            </div>

            {/* Critical Inspection Points */}
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--df-text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                Points de Contrôle Critiques :
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                {tpl.criticalPoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

