'use client';

import React from 'react';
import { DocSection } from '../types';

interface GuideSidebarNavProps {
  sections: DocSection[];
  activeSection: string;
  onSelectSection: (id: string) => void;
}

export function GuideSidebarNav({
  sections,
  activeSection,
  onSelectSection,
}: GuideSidebarNavProps) {
  return (
    <aside
      style={{
        position: 'sticky',
        top: '84px',
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: 'var(--df-shadow-sm)',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--df-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '12px',
          paddingLeft: '8px',
        }}
      >
        Table des Matières ({sections.length})
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sections.map((sec) => {
          const isSelected = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                onSelectSection(sec.id);
                const el = document.getElementById(sec.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isSelected ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--df-bg-surface-2)';
                  e.currentTarget.style.color = 'var(--df-text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--df-text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <sec.Icon size={16} className="text-indigo-400 shrink-0" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sec.title}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      <div
        style={{
          marginTop: '18px',
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--df-status-ok-bg)',
          border: '1px solid var(--df-status-ok-border)',
          fontSize: '11.5px',
          color: 'var(--df-status-ok-text)',
          lineHeight: 1.45,
        }}
      >
        <strong>Souveraineté DZ :</strong> 100% hébergé en Algérie. Zéro fuite PII (Loi 18-07).
      </div>
    </aside>
  );
}

