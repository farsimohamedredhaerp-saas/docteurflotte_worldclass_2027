'use client';

import React from 'react';
import { DispatchDecisionResult } from '../types';
import {
  IconFileText,
  IconShieldCheck,
  IconAlertOctagon,
  IconRefreshCw,
} from '@/components/navigation/TechIcons';
import { VehicleSilhouette } from '@/components/ui/VehicleSilhouette';

interface DecisionVerdictCardProps {
  decisionResult: DispatchDecisionResult | null;
  isIssuing: boolean;
  onIssueMissionOrder: () => void;
}

export function DecisionVerdictCard({
  decisionResult,
  isIssuing,
  onIssueMissionOrder,
}: DecisionVerdictCardProps) {
  if (!decisionResult) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-[#111827]/50 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mx-auto mb-3">
          <IconShieldCheck size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          En Attente d&apos;Évaluation Réglementaire
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Renseignez les paramètres de la mission à gauche puis cliquez sur{' '}
          <strong>Évaluer Éligibilité Réglementaire</strong> pour exécuter la machine à états et
          contrôler les 4 portes de conformité.
        </p>
      </div>
    );
  }

  const isEligibleForOrder =
    decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED' ||
    decisionResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' ||
    decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY';

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      {/* BANDEAU DE STATUT */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Verdict du Moteur Décisionnel (Gate DZ)
        </span>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              : decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
          }`}
        >
          {decisionResult.decisionOutcome === 'APPROVED_AS_REQUESTED' && 'MISSION APPROUVÉE CONFORME'}
          {decisionResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' &&
            'APPROUVÉ AVEC DÉCALAGE HORAIRE'}
          {decisionResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY' &&
            'SUBSTITUTION AUTOMATIQUE TOPSIS'}
          {decisionResult.decisionOutcome === 'REJECTED_NO_ELIGIBLE_ASSET' &&
            'MISSION REJETÉE SANS ACTIF VALIDE'}
        </span>
      </div>

      {/* DÉTAIL DES ACTIFS AFFECTÉS */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            {decisionResult.assignedRegistrationPlate && (
              <div className="w-12 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <VehicleSilhouette brand={decisionResult.assignedRegistrationPlate} size="sm" />
              </div>
            )}
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Véhicule Assigné :
              </div>
              <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {decisionResult.assignedRegistrationPlate || 'Aucun'}
              </div>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Conducteur Autorisé :
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {decisionResult.assignedDriverName || 'Aucun'}
            </div>
          </div>
        </div>

        {decisionResult.routeAdvisoryNotes && decisionResult.routeAdvisoryNotes.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 text-xs text-blue-600 dark:text-blue-400">
            Avis Routier : {decisionResult.routeAdvisoryNotes.join(' • ')}
          </div>
        )}
      </div>

      {/* VIOLATIONS & BLOCAGES DÉTECTÉS */}
      {decisionResult.violationsDetected && decisionResult.violationsDetected.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
            <IconAlertOctagon size={14} />
            <span>Violations Réglementaires Bloquantes :</span>
          </div>
          <div className="space-y-1.5">
            {decisionResult.violationsDetected.map((v, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300"
              >
                <strong>[{v.gate}]</strong> {v.messageFr}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBSTITUTIONS TOPSIS RECOMMANDÉES */}
      {decisionResult.rankedSubstitutions && decisionResult.rankedSubstitutions.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
            <IconRefreshCw size={14} />
            <span>Classement TOPSIS des Véhicules de Substitution :</span>
          </div>
          <div className="space-y-2">
            {decisionResult.rankedSubstitutions.slice(0, 2).map((sub, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-50 dark:bg-[#161F30] border border-slate-200/80 dark:border-[#1F2937]"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <VehicleSilhouette brand={sub.makeModel} size="sm" />
                    </div>
                    <strong className="text-xs text-slate-900 dark:text-slate-100">
                      #{i + 1} — {sub.registrationPlate} ({sub.makeModel})
                    </strong>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    Score TOPSIS : {sub.totalScore100}/100
                  </span>
                </div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  {sub.auditJustification} • Carburant estimé :{' '}
                  <strong className="font-mono text-slate-700 dark:text-slate-300">
                    {sub.estimatedFuelCostDzd.toLocaleString('fr-DZ')} DZD
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOUTON D'ÉMISSION OFFICIEL DE L'ORDRE DE MISSION */}
      {isEligibleForOrder && (
        <button
          onClick={onIssueMissionOrder}
          disabled={isIssuing}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isIssuing ? (
            <IconRefreshCw size={16} className="animate-spin" />
          ) : (
            <IconFileText size={16} />
          )}
          <span>
            {isIssuing
              ? 'Émission cryptographique en cours...'
              : "Générer l'Ordre de Mission Officiel Bilingue (FR/AR) & QR Ed25519"}
          </span>
        </button>
      )}
    </div>
  );
}

