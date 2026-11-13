import React from 'react';
import { StudioTabKey } from '../types/studio';
import {
  GitCompare,
  Code2,
  PlayCircle,
  TableProperties,
  AlertTriangle,
  UserCheck,
  History,
} from 'lucide-react';

interface CommandStripProps {
  activeTab: StudioTabKey;
  onTabChange: (tab: StudioTabKey) => void;
  unverifiedCount: number;
}

export const CommandStrip: React.FC<CommandStripProps> = ({
  activeTab,
  onTabChange,
  unverifiedCount,
}) => {
  const tabs: Array<{
    key: StudioTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { key: 'packs', label: '1. Catalogue & Diff', icon: GitCompare },
    { key: 'rules', label: '2. Éditeur AST & Schéma', icon: Code2 },
    { key: 'sandbox', label: '3. Bac à Sable (Test)', icon: PlayCircle },
    { key: 'parameters', label: '4. Matrice Paramètres', icon: TableProperties },
    {
      key: 'unverified-gate',
      label: '5. Porte UNVERIFIED',
      icon: AlertTriangle,
      badge: unverifiedCount > 0 ? unverifiedCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    { key: 'approval', label: '6. Revue & Signature 4-Yeux', icon: UserCheck },
    { key: 'audit-trail', label: '7. Journal d Audit', icon: History },
  ];

  return (
    <nav className="bg-slate-900/80 border-b border-slate-800 px-4 flex items-center gap-1 overflow-x-auto select-none">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              isActive
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>{t.label}</span>
            {t.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  t.badgeColor ?? 'bg-slate-800 text-slate-300'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

