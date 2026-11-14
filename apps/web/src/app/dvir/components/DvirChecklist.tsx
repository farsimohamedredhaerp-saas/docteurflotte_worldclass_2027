'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { PhotoProofCapture } from '@/components/dvir';
import {
  DVIRChecklistItem,
  DVIRInspectionType,
  DVIRItemStatus,
  DvirLanguage,
} from '../types';
import { CHECKLIST_AR, DVIR_I18N } from '../lib/dvirConstants';

export interface DvirChecklistProps {
  language: DvirLanguage;
  inspectionType: DVIRInspectionType;
  onInspectionTypeChange: (t: DVIRInspectionType) => void;
  driverName: string;
  onDriverNameChange: (n: string) => void;
  odometerKm: number;
  onOdometerChange: (km: number) => void;
  checklist: DVIRChecklistItem[];
  onItemStatusChange: (code: string, status: DVIRItemStatus) => void;
  onItemCommentChange: (code: string, comment: string) => void;
  onItemPhotoChange: (code: string, photoUrl: string) => void;
}

export const DvirChecklist: React.FC<DvirChecklistProps> = ({
  language,
  inspectionType,
  onInspectionTypeChange,
  driverName,
  onDriverNameChange,
  odometerKm,
  onOdometerChange,
  checklist,
  onItemStatusChange,
  onItemCommentChange,
  onItemPhotoChange,
}) => {
  const t = DVIR_I18N[language];

  return (
    <Card variant="default" padding="md" className="mb-6 bg-white dark:bg-[#111827]">
      {/* 1. MÉTADONNÉES DE L'INSPECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            {t.driverLabel} *
          </label>
          <input
            type="text"
            required
            value={driverName}
            onChange={(e) => onDriverNameChange(e.target.value)}
            placeholder="Nom & Prénom du chauffeur..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            {t.timingLabel} *
          </label>
          <select
            value={inspectionType}
            onChange={(e) => onInspectionTypeChange(e.target.value as DVIRInspectionType)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={DVIRInspectionType.PRE_TRIP}>{t.preTripOption}</option>
            <option value={DVIRInspectionType.POST_TRIP}>{t.postTripOption}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            {t.odometerLabel}
          </label>
          <input
            type="number"
            min={0}
            required
            value={odometerKm}
            onChange={(e) => onOdometerChange(Number(e.target.value))}
            className="w-full font-mono text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 2. LISTE DES POINTS DE CONTRÔLE */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          {t.checklistTitle}
        </h3>

        {checklist.map((item) => {
          const ar = CHECKLIST_AR[item.code];
          const label = language === 'ar' && ar ? ar.label : item.label;
          const desc = language === 'ar' && ar ? ar.desc : item.description;

          return (
            <div
              key={item.code}
              className={`p-4 rounded-xl border transition-all ${
                item.status === DVIRItemStatus.FAIL_CRITICAL
                  ? 'border-rose-500/60 bg-rose-500/5 dark:bg-rose-950/20 shadow-xs'
                  : item.status === DVIRItemStatus.FAIL_MINOR
                  ? 'border-amber-500/60 bg-amber-500/5 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {desc}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onItemStatusChange(item.code, DVIRItemStatus.PASS)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === DVIRItemStatus.PASS
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t.btnPass}
                  </button>

                  <button
                    type="button"
                    onClick={() => onItemStatusChange(item.code, DVIRItemStatus.FAIL_MINOR)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === DVIRItemStatus.FAIL_MINOR
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t.btnMinor}
                  </button>

                  <button
                    type="button"
                    onClick={() => onItemStatusChange(item.code, DVIRItemStatus.FAIL_CRITICAL)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === DVIRItemStatus.FAIL_CRITICAL
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t.btnCritical}
                  </button>
                </div>
              </div>

              {/* SAISIE COMMENTAIRE & PHOTO SI DÉFAUT */}
              {item.status !== DVIRItemStatus.PASS && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-start">
                  <input
                    type="text"
                    value={item.comment || ''}
                    onChange={(e) => onItemCommentChange(item.code, e.target.value)}
                    placeholder="Préciser l’anomalie constatée..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="shrink-0">
                    <PhotoProofCapture
                      itemCode={item.code}
                      itemLabel={label}
                      photoUrl={item.photoUrl}
                      onChange={(url) => onItemPhotoChange(item.code, url || '')}
                      language={language}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
