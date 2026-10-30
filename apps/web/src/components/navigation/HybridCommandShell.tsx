'use client';

import React, { useState, useEffect } from 'react';
import { TopGlobalNavbar } from './TopGlobalNavbar';
import { ContextualSidebar } from './ContextualSidebar';
import { CommandPaletteModal } from './CommandPaletteModal';
import { type NavigationModuleId } from './navigationConfig';

export interface HybridCommandShellProps {
  moduleId: NavigationModuleId;
  activeSubViewId: string;
  onSelectSubView: (viewId: string) => void;
  criticalAlertsCount?: number;
  activeFilters?: Record<string, string>;
  onFilterChange?: (filterGroupId: string, value: string) => void;
  children: React.ReactNode;
}

export function HybridCommandShell({
  moduleId,
  activeSubViewId,
  onSelectSubView,
  criticalAlertsCount = 3,
  activeFilters,
  onFilterChange,
  children,
}: HybridCommandShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    if (!isLightMode) {
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090A0C',
        color: '#F3F4F6',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: '13px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopGlobalNavbar
        activeModuleId={moduleId}
        criticalAlertsCount={criticalAlertsCount}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isLightMode={isLightMode}
        onToggleTheme={toggleTheme}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 48px)' }}>
        <ContextualSidebar
          moduleId={moduleId}
          activeSubViewId={activeSubViewId}
          onSelectSubView={onSelectSubView}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(!collapsed)}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#090A0C',
            overflowY: 'auto',
            padding: '16px 20px 48px 20px',
          }}
        >
          {children}
        </main>
      </div>

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
