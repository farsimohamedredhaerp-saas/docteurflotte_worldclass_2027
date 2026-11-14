import React from 'react';
import { IconSearch } from '@/components/navigation/TechIcons';
import { DEVICE_CATEGORIES } from '../constants';
import type { DeviceCategory, GatewayFilter } from '../types';

interface HardwareFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: DeviceCategory;
  onCategoryChange: (category: DeviceCategory) => void;
  selectedGateway: GatewayFilter;
  onGatewayChange: (gateway: GatewayFilter) => void;
}

export function HardwareFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedGateway,
  onGatewayChange,
}: HardwareFilterBarProps) {
  return (
    <div style={{ maxWidth: '1360px', margin: '24px auto 0', padding: '0 24px' }}>
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <input
            type="text"
            placeholder="Rechercher par modèle, fabricant ou port (ex: FMB920, 5027, Coban)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid var(--df-border-medium)',
              background: 'var(--df-bg-surface-2)',
              color: '#fff',
              fontSize: '13.5px',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '9px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={14} />
          </span>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {DEVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: selectedCategory === cat.id ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
                background: selectedCategory === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'var(--df-bg-surface-2)',
                color: selectedCategory === cat.id ? '#fff' : 'var(--df-text-muted)',
                fontSize: '12.5px',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gateway Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onGatewayChange('all')}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: selectedGateway === 'all' ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tous
          </button>
          <button
            onClick={() => onGatewayChange('traccar')}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: selectedGateway === 'traccar' ? '#059669' : 'var(--df-bg-surface-2)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Traccar (Port Local)
          </button>
          <button
            onClick={() => onGatewayChange('flespi')}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: selectedGateway === 'flespi' ? '#0284c7' : 'var(--df-bg-surface-2)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Flespi Cloud
          </button>
        </div>
      </div>
    </div>
  );
}

