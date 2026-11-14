'use client';

import React from 'react';
import { Button } from '@/components/Button';
import { IconShieldCheck, IconPlus } from '@/components/navigation/TechIcons';
import { ComplianceTab } from '../types';

interface ComplianceHeaderProps {
  activeTab: ComplianceTab;
  onOpenAddEnacta: () => void;
  onOpenAddInsurance: () => void;
}

export function ComplianceHeader({
  activeTab,
  onOpenAddEnacta,
  onOpenAddInsurance,
}: ComplianceHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              <IconShieldCheck size={13} />
              Algérie-First • ENACTA &amp; Fiscalité
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              58 Wilayas
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Cockpit Conformité &amp; Réglementation Flotte
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Passeport réglementaire opposable, préavis ENACTA, polices d&apos;assurance et fiscalité
            DGI en Dinars Algériens.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'ENACTA' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddEnacta}
              className="shadow-sm"
            >
              <IconPlus size={14} />
              <span>+ Visite ENACTA</span>
            </Button>
          )}
          {activeTab === 'INSURANCE' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddInsurance}
              className="shadow-sm"
            >
              <IconPlus size={14} />
              <span>+ Police Assurance</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

