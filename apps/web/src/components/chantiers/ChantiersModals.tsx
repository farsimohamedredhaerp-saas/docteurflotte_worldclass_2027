'use client';

import React from 'react';
import { IconPlus, IconFileText, IconX } from '@/components/navigation/TechIcons';
import {
  SiteWorkspace,
  SiteConsumableTank,
  ConsumableType,
  CreateSiteConsumableTankDto,
  RecordSiteConsumableDeliveryDto,
  CreateSiteWorkSituationDto,
} from '@docteurflotte/contracts';
import { CONSUMABLE_CONFIG } from './constants';

interface ChantiersModalsProps {
  sites: SiteWorkspace[];
  tanks: SiteConsumableTank[];
  siteMap: Map<string, SiteWorkspace>;
  showTankModal: boolean;
  onCloseTankModal: () => void;
  newTankForm: CreateSiteConsumableTankDto;
  onTankFormChange: (form: CreateSiteConsumableTankDto) => void;
  onCreateTank: (e: React.FormEvent) => void;
  showDeliveryModal: boolean;
  onCloseDeliveryModal: () => void;
  newDeliveryForm: RecordSiteConsumableDeliveryDto;
  onDeliveryFormChange: (form: RecordSiteConsumableDeliveryDto) => void;
  onRecordDelivery: (e: React.FormEvent) => void;
  showSituationModal: boolean;
  onCloseSituationModal: () => void;
  newSituationForm: CreateSiteWorkSituationDto;
  onSituationFormChange: (form: CreateSiteWorkSituationDto) => void;
  onCreateSituation: (e: React.FormEvent) => void;
  actionLoading: string | null;
}

export function ChantiersModals({
  sites,
  tanks,
  siteMap,
  showTankModal,
  onCloseTankModal,
  newTankForm,
  onTankFormChange,
  onCreateTank,
  showDeliveryModal,
  onCloseDeliveryModal,
  newDeliveryForm,
  onDeliveryFormChange,
  onRecordDelivery,
  showSituationModal,
  onCloseSituationModal,
  newSituationForm,
  onSituationFormChange,
  onCreateSituation,
  actionLoading,
}: ChantiersModalsProps) {
  return (
    <>
      {/* MODALE CRÉATION CUVE */}
      {showTankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                <IconPlus size={18} className="text-[var(--df-brand-primary)]" />
                Déclarer une Cuve ou Réserve de Fluide
              </h3>
              <button
                onClick={onCloseTankModal}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateTank} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Chantier d’Affectation *
                </label>
                <select
                  required
                  value={newTankForm.siteId}
                  onChange={(e) => onTankFormChange({ ...newTankForm, siteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                >
                  <option value="">Sélectionner un chantier...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Code Cuve *</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: CUV-FIX-GO-01"
                    value={newTankForm.tankCode}
                    onChange={(e) =>
                      onTankFormChange({ ...newTankForm, tankCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Type de Consommable *
                  </label>
                  <select
                    value={newTankForm.consumableType}
                    onChange={(e) =>
                      onTankFormChange({
                        ...newTankForm,
                        consumableType: e.target.value as ConsumableType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  >
                    {(Object.keys(CONSUMABLE_CONFIG) as ConsumableType[]).map((k) => (
                      <option key={k} value={k}>
                        {CONSUMABLE_CONFIG[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Nom Descriptif / Emplacement *
                </label>
                <input
                  required
                  type="text"
                  placeholder="ex: Cuve Principale Gasoil 20K Sud ou Fûts Huile ISO 46"
                  value={newTankForm.name}
                  onChange={(e) => onTankFormChange({ ...newTankForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Capacité (L) *</label>
                  <input
                    required
                    type="number"
                    min="100"
                    value={newTankForm.capacityLiters}
                    onChange={(e) =>
                      onTankFormChange({ ...newTankForm, capacityLiters: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Niveau Init. (L)</label>
                  <input
                    type="number"
                    min="0"
                    value={newTankForm.currentLevelLiters}
                    onChange={(e) =>
                      onTankFormChange({
                        ...newTankForm,
                        currentLevelLiters: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Alerte Basse (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={newTankForm.alertLowLevelPct}
                    onChange={(e) =>
                      onTankFormChange({
                        ...newTankForm,
                        alertLowLevelPct: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={onCloseTankModal}
                  className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-tank'}
                  className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold hover:bg-[var(--df-brand-primary)]/90"
                >
                  {actionLoading === 'create-tank' ? 'Enregistrement…' : 'Créer la Cuve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE RÉCEPTION BON DE LIVRAISON */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                <IconFileText size={18} className="text-blue-500" />
                Réceptionner un Bon de Livraison (BL Naftal)
              </h3>
              <button
                onClick={onCloseDeliveryModal}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onRecordDelivery} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Chantier *</label>
                  <select
                    required
                    value={newDeliveryForm.siteId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const sTanks = tanks.filter((t) => t.siteId === sId);
                      onDeliveryFormChange({
                        ...newDeliveryForm,
                        siteId: sId,
                        tankId: sTanks[0]?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  >
                    <option value="">Sélectionner chantier...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Cuve Cible</label>
                  <select
                    value={newDeliveryForm.tankId}
                    onChange={(e) =>
                      onDeliveryFormChange({ ...newDeliveryForm, tankId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  >
                    <option value="">Cuve automatique / Libre</option>
                    {tanks
                      .filter((t) => !newDeliveryForm.siteId || t.siteId === newDeliveryForm.siteId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tankCode} — {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    N° Bon de Livraison *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="ex: BL-NAFTAL-2026-9811"
                    value={newDeliveryForm.deliveryNoteRef}
                    onChange={(e) =>
                      onDeliveryFormChange({ ...newDeliveryForm, deliveryNoteRef: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Date de Livraison *
                  </label>
                  <input
                    required
                    type="date"
                    value={newDeliveryForm.deliveryDate}
                    onChange={(e) =>
                      onDeliveryFormChange({ ...newDeliveryForm, deliveryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Fournisseur *</label>
                  <input
                    required
                    type="text"
                    value={newDeliveryForm.supplierName}
                    onChange={(e) =>
                      onDeliveryFormChange({ ...newDeliveryForm, supplierName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">NIF Fournisseur</label>
                  <input
                    type="text"
                    placeholder="ex: 099916000000031"
                    value={newDeliveryForm.supplierNif || ''}
                    onChange={(e) =>
                      onDeliveryFormChange({ ...newDeliveryForm, supplierNif: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Volume (L) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={newDeliveryForm.volumeLiters}
                    onChange={(e) =>
                      onDeliveryFormChange({
                        ...newDeliveryForm,
                        volumeLiters: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Densité (15°C)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newDeliveryForm.density}
                    onChange={(e) =>
                      onDeliveryFormChange({
                        ...newDeliveryForm,
                        density: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Prix Unitaire HT *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newDeliveryForm.unitPriceHtDzd}
                    onChange={(e) =>
                      onDeliveryFormChange({
                        ...newDeliveryForm,
                        unitPriceHtDzd: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={onCloseDeliveryModal}
                  className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'record-delivery'}
                  className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold hover:bg-[var(--df-brand-primary)]/90"
                >
                  {actionLoading === 'record-delivery' ? 'Enregistrement…' : 'Enregistrer le BL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE NOUVELLE SITUATION DE TRAVAUX (DPM) */}
      {showSituationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                <IconFileText size={18} className="text-purple-500" />
                Émettre un Décompte Provisoire Mensuel (DPM)
              </h3>
              <button
                onClick={onCloseSituationModal}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateSituation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">Chantier BTPH *</label>
                <select
                  required
                  value={newSituationForm.siteId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const s = siteMap.get(sId);
                    onSituationFormChange({
                      ...newSituationForm,
                      siteId: sId,
                      clientName: s?.clientName || '',
                      clientNif: '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                >
                  <option value="">Sélectionner le chantier...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    N° Décompte / Situation *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="ex: DPM-03-2026-11"
                    value={newSituationForm.situationNumber}
                    onChange={(e) =>
                      onSituationFormChange({
                        ...newSituationForm,
                        situationNumber: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Retenue Garantie (% légal)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSituationForm.withholdingGuaranteeRatePct}
                    onChange={(e) =>
                      onSituationFormChange({
                        ...newSituationForm,
                        withholdingGuaranteeRatePct: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Date Début Période *
                  </label>
                  <input
                    required
                    type="date"
                    value={newSituationForm.periodStart}
                    onChange={(e) =>
                      onSituationFormChange({
                        ...newSituationForm,
                        periodStart: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Date Fin Période *
                  </label>
                  <input
                    required
                    type="date"
                    value={newSituationForm.periodEnd}
                    onChange={(e) =>
                      onSituationFormChange({ ...newSituationForm, periodEnd: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Montant Brut des Travaux du Mois (DZD HT) *
                </label>
                <input
                  required
                  type="number"
                  min="1000"
                  step="100"
                  value={newSituationForm.monthWorkAmountHtDzd}
                  onChange={(e) =>
                    onSituationFormChange({
                      ...newSituationForm,
                      monthWorkAmountHtDzd: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Client / Maître d’Ouvrage
                  </label>
                  <input
                    type="text"
                    value={newSituationForm.clientName}
                    onChange={(e) =>
                      onSituationFormChange({ ...newSituationForm, clientName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">NIF Client</label>
                  <input
                    type="text"
                    value={newSituationForm.clientNif || ''}
                    onChange={(e) =>
                      onSituationFormChange({ ...newSituationForm, clientNif: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={onCloseSituationModal}
                  className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-situation'}
                  className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold hover:bg-[var(--df-brand-primary)]/90"
                >
                  {actionLoading === 'create-situation' ? 'Création…' : 'Émettre la Situation (DPM)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

