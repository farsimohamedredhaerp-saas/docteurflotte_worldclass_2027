'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/Button';
import { SignaturePad } from '@/components/dvir';
import { IconAlertTriangle } from '@/components/navigation/TechIcons';
import { DvirLanguage } from '../types';
import { DVIR_I18N } from '../lib/dvirConstants';

export interface DvirSignAndSubmitProps {
  language: DvirLanguage;
  generalNotes: string;
  onGeneralNotesChange: (notes: string) => void;
  signatureValue?: string | null;
  onSignatureChange: (url: string | null) => void;
  hasCritical: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isVehicleSelected: boolean;
}

export const DvirSignAndSubmit: React.FC<DvirSignAndSubmitProps> = ({
  language,
  generalNotes,
  onGeneralNotesChange,
  signatureValue,
  onSignatureChange,
  hasCritical,
  isSubmitting,
  onSubmit,
  isVehicleSelected,
}) => {
  const t = DVIR_I18N[language];

  return (
    <Card variant="default" padding="md" className="mb-6 bg-white dark:bg-[#111827]">
      <form onSubmit={onSubmit} className="space-y-5">
        {/* OBSERVATIONS GÉNÉRALES */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            {t.notesLabel}
          </label>
          <textarea
            rows={2}
            value={generalNotes}
            onChange={(e) => onGeneralNotesChange(e.target.value)}
            placeholder="Remarques complémentaires sur le trajet, la météo, la charge utile..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* SIGNATURE TACTILE */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            {language === 'ar' ? 'التوقيع الرقمي للمشغل / السائق *' : 'Signature Tactile du Chauffeur / Opérateur *'}
          </label>
          <SignaturePad
            value={signatureValue}
            onChange={onSignatureChange}
            language={language}
          />
        </div>

        {/* ALERTE CRITIQUE DE BLOCAGE DÉPART */}
        {hasCritical && (
          <div className="p-4 rounded-xl border border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-start gap-3">
            <IconAlertTriangle size={20} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="text-xs">
              <strong className="font-bold block mb-1">
                {language === 'ar' ? 'تنبيه أمني خطير : منع فوري من السير' : 'Interdiction Immédiate de Circulation (Arrêt de Sécurité)'}
              </strong>
              <p className="leading-relaxed">
                {language === 'ar'
                  ? 'تم تسجيل عطب ميكانيكي أو تنظيمي خطير. سيتم قفل المهمة في نظام التوجيه وتوجيه المركبة فوراً إلى ورشة الصيانة.'
                  : 'Une défaillance critique a été déclarée. L’actif sera automatiquement immobilisé, exclu du dispatching TOPSIS et un ordre de travail prioritaire sera généré en atelier.'}
              </p>
            </div>
          </div>
        )}

        {/* BOUTON DE CERTIFICATION */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || !isVehicleSelected}
            className="w-full py-3.5 text-sm font-bold shadow-md"
          >
            {isSubmitting ? t.submitting : t.btnSubmit}
          </Button>
        </div>
      </form>
    </Card>
  );
};
