'use client';

import React from 'react';
import {
  NAVIGATION_MODULES,
  type NavigationModuleId,
  type NavigationSubView,
} from './navigationConfig';
import {
  IconChevronLeft,
  IconChevronRight,
  IconActivity,
  IconCpu,
  IconGauge,
  IconWrench,
  IconFuel,
  IconShieldCheck,
  IconDatabase,
  IconLayers,
  IconAlertTriangle,
  IconFilter,
} from './TechIcons';

export interface ContextualSidebarProps {
  moduleId: NavigationModuleId;
  activeSubViewId: string;
  onSelectSubView: (viewId: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  // Filtres techniques optionnels pour la maintenance ou autres modules
  activeFilters?: Record<string, string>;
  onFilterChange?: (filterGroupId: string, value: string) => void;
  // Surcharge personnalisée possible pour les sous-vues si nécessaire
  customSubViews?: NavigationSubView[];
}

export function ContextualSidebar({
  moduleId,
  activeSubViewId,
  onSelectSubView,
  collapsed,
  onToggleCollapsed,
  activeFilters = {},
  onFilterChange,
  customSubViews,
}: ContextualSidebarProps) {
  const currentConfig = NAVIGATION_MODULES[moduleId] || NAVIGATION_MODULES.maintenance;
  const subViews = customSubViews || currentConfig.subViews;

  const renderStatusBadge = (view: NavigationSubView) => {
    if (view.badgeCount !== undefined && view.badgeCount > 0) {
      const isCritical = view.status === 'critical';
      const isWarning = view.status === 'warning';
      return (
        <span
          style={{
            fontSize: '9.5px',
            fontFamily: "'JetBrains Mono', monospace",
            fontVariantNumeric: 'tabular-nums',
            padding: '1px 5px',
            background: isCritical
              ? 'rgba(239, 68, 68, 0.15)'
              : isWarning
              ? 'rgba(245, 158, 11, 0.15)'
              : '#090A0C',
            border: `1px solid ${
              isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#23272F'
            }`,
            color: isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#9CA3AF',
            borderRadius: '2px',
            fontWeight: 700,
          }}
        >
          {view.badgeCount}
        </span>
      );
    }

    if (view.tag) {
      return (
        <span
          style={{
            fontSize: '9px',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '1px 4px',
            background: '#090A0C',
            color: '#6B7280',
            border: '1px solid #23272F',
            borderRadius: '2px',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {view.tag}
        </span>
      );
    }

    return null;
  };

  return (
    <aside
      style={{
        width: collapsed ? '48px' : '240px',
        background: '#111317',
        borderRight: '1px solid #23272F',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 140ms cubic-bezier(0.16, 1, 0.3, 1)',
        flexShrink: 0,
        overflowX: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* SECTION SUPÉRIEURE : EN-TÊTE CONTEXTUEL & LISTE DES VUES */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* EN-TÊTE CONTEXTUEL AVEC BOUTON COLLAPSE */}
        <div
          style={{
            height: '40px',
            padding: collapsed ? '0' : '0 10px 0 12px',
            borderBottom: '1px solid #23272F',
            background: '#0D0F12',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          {!collapsed ? (
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '9.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6B7280',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.1,
                }}
              >
                {currentConfig.engineeringConsoleTag}
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#F3F4F6',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {currentConfig.label}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Déplier le volet latéral' : 'Replier le volet latéral'}
            style={{
              background: '#181B20',
              border: '1px solid #23272F',
              color: '#9CA3AF',
              borderRadius: '2px',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'border-color 100ms ease, color 100ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#343A46';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#23272F';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            {collapsed ? <IconChevronRight size={13} /> : <IconChevronLeft size={13} />}
          </button>
        </div>

        {/* LISTE DENSE DES SOUS-VUES CONTEXTUELLES */}
        <div
          style={{
            padding: '6px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {subViews.map((view) => {
            const isActive = activeSubViewId === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => onSelectSubView(view.id)}
                title={collapsed ? `${view.label} — ${view.desc}` : undefined}
                style={{
                  width: '100%',
                  background: isActive ? '#181B20' : 'transparent',
                  border: isActive ? '1px solid #343A46' : '1px solid transparent',
                  borderRadius: '2px',
                  padding: collapsed ? '8px 0' : '6px 8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  gap: '6px',
                  color: isActive ? '#FFFFFF' : '#9CA3AF',
                  transition: 'background 100ms ease, border-color 100ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
                    e.currentTarget.style.color = '#E5E7EB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9CA3AF';
                  }
                }}
              >
                {!collapsed ? (
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#FFFFFF' : '#D1D5DB',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        lineHeight: 1.25,
                      }}
                    >
                      {view.label}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#6B7280',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        marginTop: '1px',
                        lineHeight: 1.2,
                      }}
                    >
                      {view.desc}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: isActive ? '#2563EB' : '#9CA3AF',
                      textAlign: 'center',
                    }}
                  >
                    {view.tag.substring(0, 3)}
                  </div>
                )}

                {!collapsed && renderStatusBadge(view)}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION INFÉRIEURE : FILTRES TECHNIQUES CONTEXTUELS */}
      {!collapsed && currentConfig.filterGroups && currentConfig.filterGroups.length > 0 && (
        <div
          style={{
            padding: '10px 10px 12px 10px',
            borderTop: '1px solid #23272F',
            background: '#0D0F12',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '9.5px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6B7280',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <IconFilter size={11} />
            <span>Filtres Techniques</span>
          </div>

          {currentConfig.filterGroups.map((group) => {
            const currentValue = activeFilters[group.id] || 'ALL';
            return (
              <div key={group.id}>
                <label
                  style={{
                    fontSize: '10.5px',
                    color: '#9CA3AF',
                    display: 'block',
                    marginBottom: '3px',
                    fontWeight: 500,
                  }}
                >
                  {group.label}
                </label>
                <select
                  value={currentValue}
                  onChange={(e) => {
                    if (onFilterChange) {
                      onFilterChange(group.id, e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    background: '#111317',
                    border: '1px solid #23272F',
                    borderRadius: '2px',
                    color: '#F3F4F6',
                    fontSize: '11px',
                    padding: '4px 6px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {opt.count !== undefined ? `(${opt.count})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
