import React from 'react';
import { UserStudioRole } from '../types/studio';
import { ShieldCheck, Search, User, AlertOctagon } from 'lucide-react';

interface NavbarProps {
  currentRole: UserStudioRole;
  onRoleChange: (role: UserStudioRole) => void;
  onOpenPalette: () => void;
  unverifiedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenPalette,
  unverifiedCount,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
      {/* Logo & Product Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-white">
              RULE STUDIO
            </span>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-700/50">
              CONTROL PLANE DZ
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Lois de Finances, SCF & Packs Bi-temporels Signés Ed25519
          </p>
        </div>
      </div>

      {/* Middle : ⌘K Quick Launcher */}
      <button
        onClick={onOpenPalette}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors shadow-inner"
        title="Ouvrir la palette de commandes (Ctrl+K ou ⌘K)"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span>Rechercher règle, paramètre, diff...</span>
        <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls : Unverified Alert & Role Selector */}
      <div className="flex items-center gap-3">
        {unverifiedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-medium animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>{unverifiedCount} UNVERIFIED</span>
          </div>
        )}

        {/* Role Selector (Maker-Checker Simulator) */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
          <User className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-slate-400 hidden sm:inline">Rôle actif :</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserStudioRole)}
            className="bg-transparent text-xs font-semibold text-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="AUTEUR" className="bg-slate-900 text-slate-200">
              AUTEUR (Ingénieur Réglementaire)
            </option>
            <option value="RELECTEUR" className="bg-slate-900 text-slate-200">
              RELECTEUR (Fiscaliste DGI)
            </option>
            <option value="EXPERT_VALIDATEUR" className="bg-slate-900 text-slate-200">
              EXPERT VALIDATEUR (Expert-Comptable Agréé)
            </option>
            <option value="PUBLIEUR" className="bg-slate-900 text-slate-200">
              PUBLIEUR (Directeur Déploiement)
            </option>
          </select>
        </div>
      </div>
    </header>
  );
};
