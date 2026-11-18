'use client';

import React from 'react';
import {
  IconShieldCheck,
  IconCheck,
  IconX,
} from '@/components/navigation/TechIcons';
import { formatCurrency } from '@/lib/currency-formatter';
import {
  ReeferLiveStatus,
  ReeferHaccpCertificate,
} from '@/lib/api-fleet-intelligence';

export interface CertFormState {
  missionRef: string;
  cargoDescription: string;
  departureWilaya: number;
  arrivalWilaya: number;
  departureTime: string;
}

interface ColdChainModalsProps {
  showCertModal: boolean;
  onCloseCertModal: () => void;
  selectedReeferForCert: ReeferLiveStatus | null;
  certForm: CertFormState;
  onCertFormChange: (form: CertFormState) => void;
  onSubmitCertificate: (e: React.FormEvent) => void;
  submittingCert: boolean;
  selectedCertViewer: ReeferHaccpCertificate | null;
  onCloseCertViewer: () => void;
}

export function ColdChainModals({
  showCertModal,
  onCloseCertModal,
  selectedReeferForCert,
  certForm,
  onCertFormChange,
  onSubmitCertificate,
  submittingCert,
  selectedCertViewer,
  onCloseCertViewer,
}: ColdChainModalsProps) {
  return (
    <>
      {/* MODALE D'ÉMISSION DE CERTIFICAT SANITAIRE HACCP */}
      {showCertModal && selectedReeferForCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                <IconShieldCheck size={18} className="text-emerald-500" />
                Délivrance de Certificat Sanitaire HACCP / DSV
              </h3>
              <button
                onClick={onCloseCertModal}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onSubmitCertificate} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] space-y-1">
                <div className="font-semibold text-[var(--df-text-main)]">
                  {selectedReeferForCert.assetCode} — {selectedReeferForCert.assetName}
                </div>
                <div className="text-[11px] text-[var(--df-text-muted)]">
                  Cargaison: {selectedReeferForCert.cargoType} • Température actuelle:{' '}
                  {selectedReeferForCert.currentTempC}°C (Consigne: +{selectedReeferForCert.setpointTempC}°C)
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Référence Mission / Bon de Livraison *
                </label>
                <input
                  required
                  type="text"
                  value={certForm.missionRef}
                  onChange={(e) => onCertFormChange({ ...certForm, missionRef: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Wilaya de Départ (Code 1-58) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="58"
                    value={certForm.departureWilaya}
                    onChange={(e) =>
                      onCertFormChange({ ...certForm, departureWilaya: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Wilaya d’Arrivée (Code 1-58) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="58"
                    value={certForm.arrivalWilaya}
                    onChange={(e) =>
                      onCertFormChange({ ...certForm, arrivalWilaya: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Date &amp; Heure de Départ du Lot *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={certForm.departureTime}
                  onChange={(e) => onCertFormChange({ ...certForm, departureTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Description Détaillée du Fret Alimentaire / Pharma
                </label>
                <input
                  type="text"
                  value={certForm.cargoDescription}
                  onChange={(e) => onCertFormChange({ ...certForm, cargoDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={onCloseCertModal}
                  className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingCert}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  {submittingCert ? 'Génération…' : 'Générer & Sceller SHA-256'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE D'AFFICHAGE DU CERTIFICAT OFFICIEL HACCP */}
      {selectedCertViewer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <IconShieldCheck size={22} className="text-emerald-500" />
                <div>
                  <h3 className="text-base font-bold text-[var(--df-text-main)]">
                    Certificat Sanitaire de Traçabilité Thermique &amp; ATP
                  </h3>
                  <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Réf: {selectedCertViewer.certificateRef}
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseCertViewer}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <IconCheck size={16} />
                  <span>{selectedCertViewer.complianceStatus}</span>
                </div>
                <p className="mt-1">{selectedCertViewer.sanitaryVerdict}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[var(--df-text-muted)]">
                    Paramètres Thermiques Mission
                  </span>
                  <div className="text-sm font-mono font-bold text-[var(--df-text-main)]">
                    Moyenne : +{selectedCertViewer.averageTempC}°C
                  </div>
                  <div className="text-[11px] text-[var(--df-text-muted)]">
                    Min: +{selectedCertViewer.minTempRecordedC}°C • Max: +
                    {selectedCertViewer.maxTempRecordedC}°C
                  </div>
                  <div className="text-[11px] text-[var(--df-text-muted)]">
                    Excursion cumulée: {selectedCertViewer.totalExcursionMinutes} minutes
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[var(--df-text-muted)]">
                    Consommation Groupe Frigo Auxiliaire
                  </span>
                  <div className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                    {selectedCertViewer.auxiliaryFuelConsumedLiters} Litres de Gasoil
                  </div>
                  <div className="text-[11px] text-[var(--df-text-muted)]">
                    Coût carburant groupe : {formatCurrency(selectedCertViewer.auxiliaryFuelCostDzd)}
                  </div>
                  <div className="text-[11px] text-[var(--df-text-muted)]">
                    Réservoir dédié 200 L contrôlé
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[var(--df-text-muted)]">
                  Scellé Cryptographique d’Intégrité SHA-256 (Inaltérable) :
                </span>
                <div className="p-2 rounded-lg bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)] font-mono text-[10px] break-all text-[var(--df-text-main)]">
                  {selectedCertViewer.sha256Hash}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[var(--df-text-muted)] text-center">
                Document officiel certifié conforme à l’Arrêté Interministériel du 21 Safar 1414
                et opposable aux contrôles vétérinaires DSV et commissions de discipline.
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--df-border-subtle)]">
              <button
                type="button"
                onClick={onCloseCertViewer}
                className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

