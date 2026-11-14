'use client';

import React from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { IconSlidersHorizontal } from '@/components/navigation/TechIcons';
import type { TechnicalFilters } from '../types';

export function TechnicalFilterRail() {
  const { filters, setFilters, filteredFleet, fleet } = useMaintenance();

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-md)',
        padding: '14px 18px',
        marginBottom: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconSlidersHorizontal size={16} className="text-indigo-400" />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
          Filtres Techniques & Diagnostic :
        </span>
        <span style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
          ({filteredFleet.length} / {fleet.length} actifs affichés)
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Catégorie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Catégorie :</label>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value as TechnicalFilters['category'] }))
            }
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              padding: '5px 8px',
            }}
          >
            <option value="ALL">Toutes Catégories</option>
            <option value="HEAVY_TRUCK">Poids Lourds</option>
            <option value="CONSTRUCTION_MACHINERY_BTP">Engins BTP / Mines</option>
            <option value="LIGHT_COMMERCIAL">Utilitaires Légers</option>
          </select>
        </div>

        {/* Sévérité RUL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Urgence :</label>
          <select
            value={filters.severity}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, severity: e.target.value as TechnicalFilters['severity'] }))
            }
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              padding: '5px 8px',
            }}
          >
            <option value="ALL">Toute Sévérité</option>
            <option value="UNDER_25H">RUL &lt; 25 Heures</option>
            <option value="UNDER_1000KM">RUL &lt; 1 000 Km</option>
            <option value="CRITICAL">Critique Immédiat</option>
          </select>
        </div>

        {/* Sous-Système */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Organe :</label>
          <select
            value={filters.subsystem}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, subsystem: e.target.value as TechnicalFilters['subsystem'] }))
            }
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              padding: '5px 8px',
            }}
          >
            <option value="ALL">Tous Organes</option>
            <option value="ENGINE">Moteur & Huile</option>
            <option value="HYDRAULICS">Hydraulique</option>
            <option value="BRAKES_APS">Freins & APS</option>
            <option value="TRANSMISSION">Transmission</option>
            <option value="FUEL_SYSTEM">Carburant</option>
          </select>
        </div>
      </div>
    </div>
  );
}

