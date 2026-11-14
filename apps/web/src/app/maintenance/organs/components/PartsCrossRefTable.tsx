'use client';

import React, { useState, useMemo } from 'react';
import { OEM_PARTS_CROSS_REF_SEEDS } from '@/lib/api-maintenance-40';
import { IconSearch, IconWrench } from '@/components/navigation/TechIcons';

export function PartsCrossRefTable() {
  const [partsSearch, setPartsSearch] = useState<string>('');
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('ALL');

  const filteredParts = useMemo(() => {
    return OEM_PARTS_CROSS_REF_SEEDS.filter((p) => {
      if (selectedPartCategory !== 'ALL' && p.category !== selectedPartCategory) {
        return false;
      }
      if (partsSearch.trim() !== '') {
        const query = partsSearch.toLowerCase();
        const matchesSku = p.internalSku.toLowerCase().includes(query);
        const matchesName = p.nameFr.toLowerCase().includes(query);
        const matchesOemRef = p.oemReference.toLowerCase().includes(query);
        const matchesOemBrand = p.oemBrand.toLowerCase().includes(query);
        const matchesEquiv = p.equivalences.some(
          (eq) =>
            eq.equivalentReference.toLowerCase().includes(query) ||
            eq.aftermarketBrand.toLowerCase().includes(query)
        );
        if (!matchesSku && !matchesName && !matchesOemRef && !matchesOemBrand && !matchesEquiv) {
          return false;
        }
      }
      return true;
    });
  }, [selectedPartCategory, partsSearch]);

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
            <IconWrench size={18} className="text-sky-400" />
            Catalogue & Équivalences Pièces Détachées (Aftermarket vs OEM)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
            Croisement des références d'origine avec les équivalences certifiées (Mann-Filter, Donaldson, Bosch, Fleetguard) disponibles sur le marché algérien.
          </p>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          {filteredParts.length} Références Qualifiées
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="Rechercher par référence, désignation ou équivalence (ex: Mann, W950, Huile)..."
            value={partsSearch}
            onChange={(e) => setPartsSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '6px',
              border: '1px solid var(--df-border-medium)',
              background: 'var(--df-bg-base)',
              color: '#fff',
              fontSize: '12.5px',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={14} />
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'FILTRATION', 'BRAKING', 'LUBRICANTS', 'BELTS_HOSES', 'SENSORS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedPartCategory(cat)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: selectedPartCategory === cat ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
                background: selectedPartCategory === cat ? 'rgba(99, 102, 241, 0.2)' : 'var(--df-bg-surface-2)',
                color: selectedPartCategory === cat ? '#fff' : 'var(--df-text-muted)',
                fontSize: '11.5px',
                fontWeight: selectedPartCategory === cat ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {cat === 'ALL' ? 'Toutes Pièces' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Parts Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
              <th style={{ padding: '8px 12px' }}>SKU Interne</th>
              <th style={{ padding: '8px 12px' }}>Désignation Pièce</th>
              <th style={{ padding: '8px 12px' }}>Référence OEM</th>
              <th style={{ padding: '8px 12px' }}>Constructeur</th>
              <th style={{ padding: '8px 12px' }}>Équivalences Certifiées Algérie</th>
              <th style={{ padding: '8px 12px' }}>Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => (
              <tr
                key={part.internalSku}
                style={{
                  borderBottom: '1px solid var(--df-border-subtle)',
                }}
              >
                <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#38bdf8' }}>
                  {part.internalSku}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>
                  {part.nameFr}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#a5b4fc' }}>
                  {part.oemReference}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--df-text-secondary)' }}>
                  {part.oemBrand}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {part.equivalences.map((eq, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10.5px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#6ee7b7',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {eq.aftermarketBrand} : {eq.equivalentReference}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      background: 'var(--df-bg-surface-2)',
                      color: 'var(--df-text-muted)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {part.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

