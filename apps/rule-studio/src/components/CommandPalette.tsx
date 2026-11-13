import React, { useState, useEffect } from 'react';
import { StudioTabKey, UserStudioRole } from '../types/studio';
import { Search, X, Zap, Shield, FileCode2, Play } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: StudioTabKey) => void;
  onSelectRole: (role: UserStudioRole) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectRole,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          setQuery('');
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'tab-packs',
      category: 'Navigation',
      label: 'Consulter le catalogue des packs et les diffs',
      icon: FileCode2,
      action: () => {
        onSelectTab('packs');
        onClose();
      },
    },
    {
      id: 'tab-rules',
      category: 'Navigation',
      label: 'Ouvrir l éditeur AST et JSON Schema',
      icon: FileCode2,
      action: () => {
        onSelectTab('rules');
        onClose();
      },
    },
    {
      id: 'tab-sandbox',
      category: 'Navigation',
      label: 'Lancer le bac à sable de test d exécution',
      icon: Play,
      action: () => {
        onSelectTab('sandbox');
        onClose();
      },
    },
    {
      id: 'tab-unverified',
      category: 'Qualité & Contrôle',
      label: 'Inspecter les paramètres UNVERIFIED bloquant la publication',
      icon: Zap,
      action: () => {
        onSelectTab('unverified-gate');
        onClose();
      },
    },
    {
      id: 'role-expert',
      category: 'Rôles & Habilitations',
      label: 'Basculer vers EXPERT_VALIDATEUR (Validation formelle)',
      icon: Shield,
      action: () => {
        onSelectRole('EXPERT_VALIDATEUR');
        onClose();
      },
    },
    {
      id: 'role-publieur',
      category: 'Rôles & Habilitations',
      label: 'Basculer vers PUBLIEUR (Signature Ed25519 & Déploiement)',
      icon: Shield,
      action: () => {
        onSelectRole('PUBLIEUR');
        onClose();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tapez une commande, une règle ou un rôle..."
            className="bg-transparent flex-1 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Aucune action correspondante.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-600/10 hover:border-blue-500/20 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                    <div>
                      <p className="text-xs font-medium text-slate-200 group-hover:text-white">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">Entrée ↵</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

