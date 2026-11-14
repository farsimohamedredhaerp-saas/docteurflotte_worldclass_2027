'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconRefreshCw,
  IconWrench,
  IconFileText,
  IconLayers,
} from '@/components/navigation/TechIcons';
import { DvirLanguage } from '../types';
import { DVIR_I18N } from '../lib/dvirConstants';

export interface DvirHeaderProps {
  language: DvirLanguage;
  onLanguageChange: (lang: DvirLanguage) => void;
  isOnline: boolean;
  offlineCount: number;
  isSyncingOffline: boolean;
  onSyncOffline: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DvirHeader: React.FC<DvirHeaderProps> = ({
  language,
  onLanguageChange,
  isOnline,
  offlineCount,
  isSyncingOffline,
  onSyncOffline,
  onRefresh,
  isLoading,
}) => {
  const t = DVIR_I18N[language];

  return (
    <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="ok" pulse>
              {t.badge}
            </Badge>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">● En ligne (Direct API)</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-bold">● Hors-ligne (IndexedDB souverain)</span>
              )}
            </span>
            {offlineCount > 0 && (
              <Badge variant="warning">
                {offlineCount} en attente de sync
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            {t.pageTitle}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            {t.subtitle}
          </p>

          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5"
            >
              <IconRefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>{t.refreshBtn}</span>
            </Button>

            {offlineCount > 0 && isOnline && (
              <Button
                variant="primary"
                size="sm"
                onClick={onSyncOffline}
                disabled={isSyncingOffline}
                className="inline-flex items-center gap-1.5"
              >
                <IconLayers size={13} className={isSyncingOffline ? 'animate-spin' : ''} />
                <span>Synchroniser ({offlineCount})</span>
              </Button>
            )}

            <Link
              href="/work-orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconWrench size={13} className="text-blue-500" />
              <span>{t.workOrdersBtn}</span>
            </Link>

            <Link
              href="/dvir/history"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <IconFileText size={13} className="text-emerald-500" />
              <span>{t.historyBtn}</span>
            </Link>
          </div>
        </div>

        {/* SWITCH DE LANGUE FR / AR */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onLanguageChange('fr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              language === 'fr'
                ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              language === 'ar'
                ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            العربية
          </button>
        </div>
      </div>
    </section>
  );
};
