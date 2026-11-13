import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  BookOpenCheck,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  ReceiptText,
} from 'lucide-react';
import { ClientTab } from '../types/client';

interface NavigationStripProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  openAlertsCount: number;
}

export const NavigationStrip: React.FC<NavigationStripProps> = ({
  activeTab,
  onTabChange,
  openAlertsCount,
}) => {
  const tabs: { id: ClientTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'EXECUTIVE_DASHBOARD',
      label: 'Synthèse & Santé',
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: 'ACTIVITY_ENTRY',
      label: 'Saisie Événements',
      icon: <FilePlus size={16} />,
    },
    {
      id: 'LEDGER_EXPLORER',
      label: 'Grand Livre Scellé',
      icon: <BookOpenCheck size={16} />,
    },
    {
      id: 'AUDIT_COCKPIT',
      label: 'Audit & Fraude Légale',
      icon: <ShieldAlert size={16} />,
      badge: openAlertsCount,
    },
    {
      id: 'STATISTICAL_AUDIT',
      label: 'Stats & Benford',
      icon: <BarChart3 size={16} />,
    },
    {
      id: 'SCF_STATEMENTS',
      label: 'Clôtures & SCF',
      icon: <FileSpreadsheet size={16} />,
    },
    {
      id: 'TAX_DECLARATIONS',
      label: 'Déclarations G50 / IBS',
      icon: <ReceiptText size={16} />,
    },
  ];

  return (
    <nav
      style={{
        backgroundColor: '#0a1024',
        borderBottom: '1px solid #1e293b',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: isActive ? '3px solid #10b981' : '3px solid transparent',
              color: isActive ? '#f8fafc' : '#94a3b8',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = '#94a3b8';
            }}
          >
            <span style={{ color: isActive ? '#10b981' : 'inherit' }}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

