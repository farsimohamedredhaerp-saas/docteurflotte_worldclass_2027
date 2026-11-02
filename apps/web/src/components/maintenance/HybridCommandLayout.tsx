'use client';

import React, { useState } from 'react';
import { Navbar } from '../navigation/Navbar';
import { CommandPaletteModal } from '../navigation/CommandPaletteModal';
import {
  IconActivity,
  IconCpu,
  IconGauge,
  IconWrench,
  IconLayers,
  IconShieldCheck,
  IconSlidersHorizontal,
  IconSearch,
} from '../navigation/TechIcons';

export type MaintenanceSubView =
  | 'rul_matrix'
  | 'telemetry_can'
  | 'oem_plans'
  | 'parts_cross_ref'
  | 'inventory_stock'
  | 'work_orders';

export interface TechnicalFilters {
  category: 'ALL' | 'HEAVY_TRUCK' | 'CONSTRUCTION_MACHINERY_BTP' | 'LIGHT_COMMERCIAL';
  severity: 'ALL' | 'UNDER_25H' | 'UNDER_1000KM' | 'CRITICAL';
  subsystem: 'ALL' | 'ENGINE' | 'HYDRAULICS' | 'BRAKES_APS' | 'TRANSMISSION' | 'FUEL_SYSTEM';
}

interface HybridCommandLayoutProps {
  activeSubView: MaintenanceSubView;
  onSelectSubView: (view: MaintenanceSubView) => void;
  filters: TechnicalFilters;
  onFilterChange: (filters: TechnicalFilters) => void;
  criticalAlertsCount?: number;
  onSearchChange?: (query: string) => void;
  children: React.ReactNode;
}

export function HybridCommandLayout({
  activeSubView,
  onSelectSubView,
  filters,
  onFilterChange,
  criticalAlertsCount = 3,
  onSearchChange,
  children,
}: HybridCommandLayoutProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const subViewTabs: {
    id: MaintenanceSubView;
    label: string;
    tag: string;
    badgeCount?: number;
    icon: React.ReactNode;
  }[] = [
      {
        id: 'rul_matrix',
        label: 'Santé Prédictive & RUL',
        tag: 'WEIBULL',
        icon: <IconGauge size={15} strokeWidth={1.75} />,
      },
      {
        id: 'telemetry_can',
        label: 'Diagnostic Télématique CAN',
        tag: 'J1939',
        badgeCount: criticalAlertsCount,
        icon: <IconActivity size={15} strokeWidth={1.75} />,
      },
      {
        id: 'oem_plans',
        label: 'Planning Préventif OEM',
        tag: 'OEM',
        icon: <IconLayers size={15} strokeWidth={1.75} />,
      },
      {
        id: 'parts_cross_ref',
        label: 'Catalogue Pièces & Équivalences',
        tag: 'CROSS-REF',
        icon: <IconSearch size={15} strokeWidth={1.75} />,
      },
      {
        id: 'inventory_stock',
        label: 'Stocks Magasins & Achats',
        tag: 'STOCK',
        icon: <IconShieldCheck size={15} strokeWidth={1.75} />,
      },
      {
        id: 'work_orders',
        label: 'Atelier & Ordres de Travail',
        tag: 'OT',
        badgeCount: 7,
        icon: <IconWrench size={15} strokeWidth={1.75} />,
      },
    ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      {/* 1. BARRE DE NAVIGATION HORIZONTALE PRINCIPALE */}
      <Navbar />

      <div className="df-container" style={{ paddingTop: '0.5rem', paddingBottom: '3.5rem' }}>
        {/* 2. BARRE D'ONGLETS PRINCIPALE DE NAVIGATION */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            boxShadow: 'var(--df-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* ONGLETS DES SOUS-VUES DE MAINTENANCE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              overflowX: 'auto',
              maxWidth: '100%',
              paddingBottom: '2px',
            }}
          >
            {subViewTabs.map((tab) => {
              const isActive = activeSubView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectSubView(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.6rem 1.1rem',
                    borderRadius: 'var(--df-radius-md)',
                    background: isActive ? 'var(--df-accent-blue)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--df-text-secondary)',
                    border: `1px solid ${isActive ? 'var(--df-accent-blue)' : 'var(--df-border-subtle)'}`,
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--df-transition-fast)',
                    boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--df-bg-surface-2)';
                      e.currentTarget.style.color = 'var(--df-text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--df-text-secondary)';
                    }
                  }}
                >
                  <span style={{ display: 'flex' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span
                      className="df-mono"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--df-radius-xs)',
                        background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--df-status-danger-bg)',
                        color: isActive ? '#FFFFFF' : 'var(--df-status-danger-text)',
                        border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.4)' : 'var(--df-status-danger-border)'}`,
                      }}
                    >
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* RACCOURCI PALETTE CMD+K */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.85rem',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              color: 'var(--df-text-muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all var(--df-transition-fast)',
            }}
          >
            <IconSearch size={14} strokeWidth={1.75} />
            <span>Rechercher...</span>
            <kbd
              className="df-mono"
              style={{
                fontSize: '0.68rem',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-medium)',
                borderRadius: 'var(--df-radius-xs)',
                padding: '1px 5px',
                color: 'var(--df-text-secondary)',
              }}
            >
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* 3. BARRE SECONDAIRE DE FILTRAGE TECHNIQUE & RESPIRATION */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-md)',
            padding: '0.65rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--df-text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
              <IconSlidersHorizontal size={14} strokeWidth={1.75} />
              <span>Filtres Actifs :</span>
            </div>

            {/* FILTRE CATÉGORIE MATÉRIEL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Parc :</span>
              <select
                value={filters.category}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    category: e.target.value as TechnicalFilters['category'],
                  })
                }
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  color: 'var(--df-text-main)',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Tout le Parc (52 Véhicules)</option>
                <option value="HEAVY_TRUCK">Poids Lourds (Tracteurs & Bennes)</option>
                <option value="CONSTRUCTION_MACHINERY_BTP">Engins Chantiers & BTPH</option>
                <option value="LIGHT_COMMERCIAL">Véhicules Utilitaires Légers</option>
              </select>
            </div>

            {/* FILTRE CRITICITÉ / SÉVÉRITÉ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Échéance :</span>
              <select
                value={filters.severity}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    severity: e.target.value as TechnicalFilters['severity'],
                  })
                }
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  color: 'var(--df-text-main)',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Toutes Échéances Confondues</option>
                <option value="UNDER_25H">Imminent (&lt; 25 Heures Moteur)</option>
                <option value="UNDER_1000KM">Imminent (&lt; 1 000 Km)</option>
                <option value="CRITICAL">DTC Critique / Arrêt Requis</option>
              </select>
            </div>

            {/* FILTRE SOUS-SYSTÈME */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Organe :</span>
              <select
                value={filters.subsystem}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    subsystem: e.target.value as TechnicalFilters['subsystem'],
                  })
                }
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  color: 'var(--df-text-main)',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Tous les Organes</option>
                <option value="ENGINE">Moteur & Injection</option>
                <option value="HYDRAULICS">Hydraulique & Vérins</option>
                <option value="BRAKES_APS">Système Pneumatique & Freinage</option>
                <option value="TRANSMISSION">Boîte de Vitesses & Pont</option>
                <option value="COOLING">Circuit de Refroidissement</option>
                <option value="FILTRATION">Filtration Huile / Gazole</option>
                <option value="TIRES_TRACKS">Pneumatiques / Chenilles</option>
              </select>
            </div>

            {(filters.category !== 'ALL' || filters.severity !== 'ALL' || filters.subsystem !== 'ALL') && (
              <button
                type="button"
                onClick={() => onFilterChange({ category: 'ALL', severity: 'ALL', subsystem: 'ALL' })}
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--df-border-medium)',
                  borderRadius: 'var(--df-radius-sm)',
                  color: 'var(--df-accent-blue)',
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* INDICATEUR DU MODE ACTUEL & ASSURANCE DE CONFORMITÉ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--df-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span className="df-pulse-live" />
              <span>Calcul Weibull temps réel</span>
            </span>
          </div>
        </div>

        {/* 4. ESPACE DE TRAVAIL PRINCIPAL AÉRÉ */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {children}
        </main>
      </div>

      {/* MODAL COMMAND PALETTE (CMD+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
