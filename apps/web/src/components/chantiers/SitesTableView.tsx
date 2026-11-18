'use client';

import React from 'react';
import Link from 'next/link';
import { IconWrench, IconSearch } from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import { SiteWorkspace } from '@docteurflotte/contracts';

interface SitesTableViewProps {
  filteredSites: SiteWorkspace[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function SitesTableView({
  filteredSites,
  searchQuery,
  onSearchChange,
}: SitesTableViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <IconSearch
            size={16}
            className="absolute left-3 top-3 text-[var(--df-text-muted)]"
          />
          <input
            type="text"
            placeholder="Rechercher chantier par code, nom ou client..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
          />
        </div>
      </div>

      {filteredSites.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
          <IconWrench size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
          <p className="text-base font-semibold text-[var(--df-text-main)]">
            Aucun chantier enregistré
          </p>
          <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
            Déclarez vos zones de terrassement, carrières ou bases logistiques pour suivre les
            heures moteur, les fluides et la rentabilité en DZD.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] flex flex-col justify-between space-y-4 hover:border-[var(--df-brand-primary)] transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--df-brand-primary)]">
                    {site.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      site.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {site.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-[var(--df-text-main)] line-clamp-1">
                  {site.name}
                </h3>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Wilaya {site.wilayaCode.toString().padStart(2, '0')} • Client:{' '}
                  {site.clientName || 'Interne'}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--df-border-subtle)] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--df-text-muted)]">Engins Actifs</span>
                  <p className="font-bold text-[var(--df-text-main)]">
                    {site.activeAssetsCount || 0}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--df-text-muted)]">Budget Alloué</span>
                  <p className="font-bold text-[var(--df-text-main)]">
                    {formatCurrency(Number(site.budgetAllocatedDzd))}
                  </p>
                </div>
              </div>

              <div>
                <Link
                  href={`/chantiers/${site.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)] text-[var(--df-text-main)] hover:bg-[var(--df-brand-primary)] hover:text-white hover:border-transparent transition-all"
                >
                  Bilan de Rentabilité & Engins →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

