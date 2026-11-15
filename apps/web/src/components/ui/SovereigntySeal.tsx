'use client';

import React from 'react';
import { cn } from '../../lib/utils/cn';

export type SovereigntySealType = 'ANPDP_18_07' | 'DGI_FISCAL' | 'ENACTA' | 'JORADP';

export interface SovereigntySealProps {
  type: SovereigntySealType;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function SovereigntySeal({
  type,
  size = 'xs',
  className,
}: SovereigntySealProps) {
  const meta = {
    ANPDP_18_07: {
      label: 'Loi 18-07 ANPDP',
      tooltip: 'Souveraineté des Données & Pseudonymisation Matérielle Conforme Loi 18-07 (ANPDP)',
      code: 'ANPDP',
    },
    DGI_FISCAL: {
      label: 'Timbre Fiscal DGI',
      tooltip: 'Conformité Comptable & Fiscale DGI Algérie (Timbre & SCF)',
      code: 'DGI',
    },
    ENACTA: {
      label: 'Barème ENACTA',
      tooltip: 'Barèmes Officiels de Contrôle & Diagnostic Technique Automobile ENACTA',
      code: 'ENACTA',
    },
    JORADP: {
      label: 'Réf. JORADP',
      tooltip: 'Conforme au Journal Officiel de la République Algérienne Démocratique et Populaire',
      code: 'JORADP',
    },
  }[type];

  const sizeClasses = {
    xs: 'text-[9.5px] px-1.5 py-0.2 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-[11px] px-2.5 py-1 gap-2',
  }[size];

  return (
    <span
      title={meta.tooltip}
      className={cn(
        'inline-flex items-center font-mono font-medium rounded-[var(--df-radius-xs,4px)]',
        'border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] text-[var(--df-text-muted)]',
        'tracking-tight select-none transition-colors hover:text-[var(--df-text-secondary)]',
        sizeClasses,
        className
      )}
    >
      <span className="w-1 h-1 rounded-full bg-[var(--df-text-muted)] shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}

