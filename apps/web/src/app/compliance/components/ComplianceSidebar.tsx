'use client';

import React from 'react';
import { Button } from '@/components/Button';
import {
  IconShieldCheck,
  IconFileText,
  IconCompass,
  IconCreditCard,
  IconPlus,
} from '@/components/navigation/TechIcons';
import { ComplianceTab } from '../types';

interface ComplianceSidebarProps {
  activeTab: ComplianceTab;
  setActiveTab: (t: ComplianceTab) => void;
  enactaCount: number;
  insuranceCount: number;
  wilayasCount: number;
  onOpenAddEnacta: () => void;
  onOpenAddInsurance: () => void;
}

export function ComplianceSidebar({
  activeTab,
  setActiveTab,
  enactaCount,
  insuranceCount,
  wilayasCount,
  onOpenAddEnacta,
  onOpenAddInsurance,
}: ComplianceSidebarProps) {
  const navItems = [
    {
      id: 'ENACTA' as ComplianceTab,
      label: 'Contrôles ENACTA',
      count: enactaCount,
      icon: <IconShieldCheck size={16} />,
      desc: 'Périodicité 6m / 12m / 24m',
    },
    {
      id: 'INSURANCE' as ComplianceTab,
      label: 'Assurances & Cartes',
      count: insuranceCount,
      icon: <IconFileText size={16} />,
      desc: 'CAAT, SAA, CASH, Alliance',
    },
    {
      id: 'WILAYAS' as ComplianceTab,
      label: 'Restrictions Wilayas',
      count: wilayasCount,
      icon: <IconCompass size={16} />,
      desc: 'Arrêtés préfectoraux & rocad.',
    },
    {
      id: 'TAXES' as ComplianceTab,
      label: 'Fiscalité & Vignettes',
      icon: <IconCreditCard size={16} />,
      desc: 'TVA 19%/9%, Timbre, LF 2026',
    },
  ];

  return (
    <aside className="lg:col-span-3 space-y-4">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-4 shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
          Piliers Réglementaires DZ
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {item.desc}
                    </div>
                  </div>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="my-4 border-t border-slate-100 dark:border-slate-800/80" />

        <div className="space-y-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddEnacta}
            className="w-full justify-center text-xs py-2 shadow-xs"
          >
            <IconPlus size={13} />
            <span>+ Visite ENACTA</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenAddInsurance}
            className="w-full justify-center text-xs py-2"
          >
            <IconPlus size={13} />
            <span>+ Police Assurance</span>
          </Button>
        </div>
      </div>

      {/* BADGE SOUVERAINETÉ LOI 18-07 */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0c1220]/50 p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 shadow-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Souveraineté Loi 18-07 (ANPDP)
        </div>
        <p className="leading-relaxed text-[11px]">
          Hébergement certifié sur le territoire national. Zéro fuite PII vers des plateformes
          télématiques tierces.
        </p>
      </div>
    </aside>
  );
}
