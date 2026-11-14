'use client';

import React from 'react';
import { Button } from '../../../components/Button';
import {
  IconSearch,
  IconFileText,
  IconCompass,
} from '../../../components/navigation/TechIcons';
import {
  OemScraperConsoleProps,
} from '../types';
import {
  PRESET_VINS,
  PRESET_CATALOG_MODELS,
  PRESET_BULK_MAKES,
  BULK_CATEGORIES,
} from '../constants';

export function OemScraperConsole({
  searchMode,
  onSearchModeChange,
  vinInput,
  onVinInputChange,
  manualMake,
  onManualMakeChange,
  manualModel,
  onManualModelChange,
  manualEngine,
  onManualEngineChange,
  bulkCategory,
  onBulkCategoryChange,
  bulkTargetMake,
  onBulkTargetMakeChange,
  isLoading,
  onResolve,
  onBulkCrawl,
}: OemScraperConsoleProps) {
  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--df-shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {searchMode === 'VIN' ? (
              <IconSearch size={16} />
            ) : searchMode === 'CATALOG' ? (
              <IconFileText size={16} />
            ) : (
              <IconCompass size={16} />
            )}
          </span>
          {searchMode === 'VIN'
            ? 'Décodage par Châssis VIN'
            : searchMode === 'CATALOG'
              ? 'Exploration par Catalogue (Sans VIN)'
              : 'Crawler Universel Mondial (Multi-Niveaux)'}
        </h2>

        <div
          style={{
            display: 'flex',
            background: 'var(--df-bg-surface-2)',
            padding: '0.2rem',
            borderRadius: 'var(--df-radius-sm)',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => onSearchModeChange('VIN')}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 'var(--df-radius-xs)',
              border: 'none',
              background: searchMode === 'VIN' ? 'var(--df-primary)' : 'transparent',
              color: searchMode === 'VIN' ? '#fff' : 'var(--df-text-muted)',
              cursor: 'pointer',
            }}
          >
            Mode VIN
          </button>
          <button
            type="button"
            onClick={() => onSearchModeChange('CATALOG')}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 'var(--df-radius-xs)',
              border: 'none',
              background: searchMode === 'CATALOG' ? 'var(--df-primary)' : 'transparent',
              color: searchMode === 'CATALOG' ? '#fff' : 'var(--df-text-muted)',
              cursor: 'pointer',
            }}
          >
            Mode Marque & Modèle
          </button>
          <button
            type="button"
            onClick={() => onSearchModeChange('BULK_WORLD')}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 'var(--df-radius-xs)',
              border: 'none',
              background: searchMode === 'BULK_WORLD' ? 'var(--df-primary)' : 'transparent',
              color: searchMode === 'BULK_WORLD' ? '#fff' : 'var(--df-text-muted)',
              cursor: 'pointer',
            }}
          >
            Crawler Mondial
          </button>
        </div>
      </div>

      {searchMode === 'VIN' ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--df-text-secondary)',
              marginBottom: '0.4rem',
            }}
          >
            Numéro de Châssis VIN (17 Caractères ISO 3779)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={vinInput}
              onChange={(e) => onVinInputChange(e.target.value.toUpperCase())}
              placeholder="Ex: VF611G16000019284"
              maxLength={17}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
                color: 'var(--df-text-main)',
                fontFamily: 'var(--df-font-mono, monospace)',
                fontSize: '1rem',
                letterSpacing: '1px',
              }}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => onResolve()}
              disabled={isLoading}
            >
              {isLoading ? 'Analyse...' : 'Résoudre'}
            </Button>
          </div>
        </div>
      ) : searchMode === 'CATALOG' ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--df-text-secondary)',
                  marginBottom: '0.3rem',
                }}
              >
                Marque Constructeur
              </label>
              <input
                type="text"
                value={manualMake}
                onChange={(e) => onManualMakeChange(e.target.value)}
                placeholder="Ex: Renault Trucks, Shacman, SNVI"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  color: 'var(--df-text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--df-text-secondary)',
                  marginBottom: '0.3rem',
                }}
              >
                Modèle ou Gamme
              </label>
              <input
                type="text"
                value={manualModel}
                onChange={(e) => onManualModelChange(e.target.value)}
                placeholder="Ex: T480, X3000, K66, TGS"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  color: 'var(--df-text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={manualEngine}
              onChange={(e) => onManualEngineChange(e.target.value)}
              placeholder="Motorisation (Optionnelle, ex: DTI 13 480ch)"
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-sm)',
                color: 'var(--df-text-main)',
                fontSize: '0.85rem',
              }}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => onResolve()}
              disabled={isLoading || !manualMake || !manualModel}
            >
              {isLoading ? 'Extraction...' : 'Explorer Catalogue'}
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--df-text-secondary)',
              marginBottom: '0.4rem',
            }}
          >
            Univers Métier Mondial à Indexer
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            {BULK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onBulkCategoryChange(cat.id)}
                style={{
                  padding: '0.5rem 0.6rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 'var(--df-radius-sm)',
                  border: `1px solid ${bulkCategory === cat.id ? 'var(--df-primary)' : 'var(--df-border-subtle)'}`,
                  background: bulkCategory === cat.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--df-bg-surface-2)',
                  color: bulkCategory === cat.id ? 'var(--df-primary)' : 'var(--df-text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={bulkTargetMake}
              onChange={(e) => onBulkTargetMakeChange(e.target.value)}
              placeholder="Filtrer une marque (ex: Scania, Caterpillar, Volvo, ou vide = Tout)"
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-sm)',
                color: 'var(--df-text-main)',
                fontSize: '0.85rem',
              }}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => onBulkCrawl()}
              disabled={isLoading}
            >
              {isLoading ? 'Crawling...' : 'Lancer Crawl Mondial'}
            </Button>
          </div>
        </div>
      )}

      {/* RACCOURCIS RAPIDES VINS & MODÈLES TYPES */}
      <div>
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--df-text-muted)',
            display: 'block',
            marginBottom: '0.5rem',
          }}
        >
          {searchMode === 'VIN'
            ? 'Échantillons VIN de référence :'
            : searchMode === 'CATALOG'
              ? 'Modèles fréquents sans VIN :'
              : 'Crawl ciblé 1-clic par constructeur mondial :'}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {searchMode === 'VIN'
            ? PRESET_VINS.map((preset) => (
                <button
                  key={preset.vin}
                  type="button"
                  onClick={() => {
                    onVinInputChange(preset.vin);
                    onResolve(preset.vin);
                  }}
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.75rem',
                    color: 'var(--df-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>{preset.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({preset.badge})</span>
                </button>
              ))
            : searchMode === 'CATALOG'
              ? PRESET_CATALOG_MODELS.map((item) => (
                  <button
                    key={`${item.make}-${item.model}-${item.engine}`}
                    type="button"
                    onClick={() => {
                      onManualMakeChange(item.make);
                      onManualModelChange(item.model);
                      onManualEngineChange(item.engine);
                      onResolve(undefined, item.make, item.model, item.engine);
                    }}
                    style={{
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.75rem',
                      color: 'var(--df-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))
              : PRESET_BULK_MAKES.map((item) => (
                  <button
                    key={item.make}
                    type="button"
                    onClick={() => {
                      onBulkTargetMakeChange(item.make);
                      onBulkCategoryChange(item.cat);
                      onBulkCrawl(item.cat, item.make);
                    }}
                    style={{
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.75rem',
                      color: 'var(--df-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
        </div>
      </div>
    </div>
  );
}
