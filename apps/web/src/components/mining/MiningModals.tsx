'use client';

import React from 'react';
import { Button } from '@/components/Button';
import {
  IconTruck,
  IconGauge,
  IconBarChart3,
  IconMapPin,
  IconX,
} from '@/components/navigation/TechIcons';
import {
  MiningSite,
  OtrTire,
  MiningSiteType,
  OtrTirePosition,
  CreateMiningSiteDto,
  CreateOtrTireDto,
  UpdateOtrTireTelemetryDto,
  RecordHaulingCycleDto,
} from '@/lib/api-mining';

interface MiningModalsProps {
  sites: MiningSite[];
  tires: OtrTire[];
  isAddSiteOpen: boolean;
  onCloseAddSite: () => void;
  siteForm: CreateMiningSiteDto;
  onSiteFormChange: (form: CreateMiningSiteDto) => void;
  onCreateSite: (e: React.FormEvent) => void;
  isAddTireOpen: boolean;
  onCloseAddTire: () => void;
  tireForm: CreateOtrTireDto;
  onTireFormChange: (form: CreateOtrTireDto) => void;
  onCreateTire: (e: React.FormEvent) => void;
  isUpdateTireOpen: boolean;
  onCloseUpdateTire: () => void;
  updateTelemForm: UpdateOtrTireTelemetryDto;
  onUpdateTelemFormChange: (form: UpdateOtrTireTelemetryDto) => void;
  onUpdateTire: (e: React.FormEvent) => void;
  isRecordCycleOpen: boolean;
  onCloseRecordCycle: () => void;
  cycleForm: RecordHaulingCycleDto;
  onCycleFormChange: (form: RecordHaulingCycleDto) => void;
  onRecordCycle: (e: React.FormEvent) => void;
}

export function MiningModals({
  sites,
  tires,
  isAddSiteOpen,
  onCloseAddSite,
  siteForm,
  onSiteFormChange,
  onCreateSite,
  isAddTireOpen,
  onCloseAddTire,
  tireForm,
  onTireFormChange,
  onCreateTire,
  isUpdateTireOpen,
  onCloseUpdateTire,
  updateTelemForm,
  onUpdateTelemFormChange,
  onUpdateTire,
  isRecordCycleOpen,
  onCloseRecordCycle,
  cycleForm,
  onCycleFormChange,
  onRecordCycle,
}: MiningModalsProps) {
  return (
    <>
      {/* MODALE 1 : NOUVEAU SITE MINIER */}
      {isAddSiteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconMapPin size={18} className="text-orange-400" />
                Nouveau Site Minier / Carrière
              </h3>
              <button
                onClick={onCloseAddSite}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateSite} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Code Site</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MINE-TIN-02"
                  value={siteForm.code}
                  onChange={(e) => onSiteFormChange({ ...siteForm, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Désignation du Gisement</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gisement de Phosphate Bled El Hadba"
                  value={siteForm.name}
                  onChange={(e) => onSiteFormChange({ ...siteForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Wilaya (1 à 58)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={58}
                    value={siteForm.wilayaCode}
                    onChange={(e) => onSiteFormChange({ ...siteForm, wilayaCode: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Type de Ressource</label>
                  <select
                    value={siteForm.siteType}
                    onChange={(e) => onSiteFormChange({ ...siteForm, siteType: e.target.value as MiningSiteType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value={MiningSiteType.IRON_ORE}>Minerai de Fer</option>
                    <option value={MiningSiteType.PHOSPHATE}>Phosphate</option>
                    <option value={MiningSiteType.AGGREGATES_QUARRY}>Carrière Granulats</option>
                    <option value={MiningSiteType.CEMENT_PLANT}>Cimenterie</option>
                    <option value={MiningSiteType.MARBLE}>Marbre &amp; Pierre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">T° Été (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={siteForm.ambientTempSummerC}
                    onChange={(e) => onSiteFormChange({ ...siteForm, ambientTempSummerC: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Distance Piste (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={siteForm.averageHaulDistanceKm}
                    onChange={(e) => onSiteFormChange({ ...siteForm, averageHaulDistanceKm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pente Max (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={siteForm.pisteGradientMaxPct}
                    onChange={(e) => onSiteFormChange({ ...siteForm, pisteGradientMaxPct: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseAddSite}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                  Créer le site
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : NOUVEAU PNEU OTR */}
      {isAddTireOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconTruck size={18} className="text-orange-400" />
                Nouveau Pneumatique OTR Géant
              </h3>
              <button
                onClick={onCloseAddTire}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateTire} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Numéro de Série (Vulcanisé)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MICH-XDR3-2026-9921"
                    value={tireForm.serialNumber}
                    onChange={(e) => onTireFormChange({ ...tireForm, serialNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Marque</label>
                  <select
                    value={tireForm.brand}
                    onChange={(e) => onTireFormChange({ ...tireForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Michelin">Michelin</option>
                    <option value="Bridgestone">Bridgestone</option>
                    <option value="Goodyear">Goodyear</option>
                    <option value="Triangle">Triangle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Dimension</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 27.00R49"
                    value={tireForm.dimension}
                    onChange={(e) => onTireFormChange({ ...tireForm, dimension: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Position Dumper</label>
                  <select
                    value={tireForm.position}
                    onChange={(e) => onTireFormChange({ ...tireForm, position: e.target.value as OtrTirePosition })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value={OtrTirePosition.FL}>FL (Avant Gauche)</option>
                    <option value={OtrTirePosition.FR}>FR (Avant Droit)</option>
                    <option value={OtrTirePosition.RLO}>RLO (Arr. Gauche Ext)</option>
                    <option value={OtrTirePosition.RLI}>RLI (Arr. Gauche Int)</option>
                    <option value={OtrTirePosition.RRO}>RRO (Arr. Droit Ext)</option>
                    <option value={OtrTirePosition.RRI}>RRI (Arr. Droit Int)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">TKPH Constructeur</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={tireForm.nominalTkph}
                    onChange={(e) => onTireFormChange({ ...tireForm, nominalTkph: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Coût d&apos;Achat (DZD)</label>
                  <input
                    type="number"
                    required
                    step="1000"
                    value={tireForm.purchaseCostDzd}
                    onChange={(e) => onTireFormChange({ ...tireForm, purchaseCostDzd: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Sculpture Neuve (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tireForm.treadDepthInitialMm}
                    onChange={(e) => onTireFormChange({ ...tireForm, treadDepthInitialMm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Réf Dumper Affecté</label>
                <input
                  type="text"
                  placeholder="Ex: DUMPER-CAT-777-01"
                  value={tireForm.assetId}
                  onChange={(e) => onTireFormChange({ ...tireForm, assetId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseAddTire}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                  Enregistrer le pneu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : MISE À JOUR TÉLÉMÉTRIE PNEU TPMS */}
      {isUpdateTireOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconGauge size={18} className="text-cyan-400" />
                Mise à Jour Télémétrie Pneu TPMS
              </h3>
              <button
                onClick={onCloseUpdateTire}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onUpdateTire} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pneu OTR</label>
                <select
                  required
                  value={updateTelemForm.tireId}
                  onChange={(e) => onUpdateTelemFormChange({ ...updateTelemForm, tireId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Sélectionnez un pneu...</option>
                  {tires.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.position} — {t.serialNumber} ({t.brand} {t.dimension})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Pression (Bar)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={updateTelemForm.pressureBar}
                    onChange={(e) => onUpdateTelemFormChange({ ...updateTelemForm, pressureBar: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Température (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={updateTelemForm.temperatureC}
                    onChange={(e) => onUpdateTelemFormChange({ ...updateTelemForm, temperatureC: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Sculpture Restante (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={updateTelemForm.treadDepthMm}
                    onChange={(e) => onUpdateTelemFormChange({ ...updateTelemForm, treadDepthMm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Heures Roulées (+Δh)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={updateTelemForm.operatingHoursDelta}
                    onChange={(e) => onUpdateTelemFormChange({ ...updateTelemForm, operatingHoursDelta: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseUpdateTire}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  Mettre à jour
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 4 : SAISIE CYCLE DE ROULAGE DUMPER */}
      {isRecordCycleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconBarChart3 size={18} className="text-orange-400" />
                Saisie Cycle Roulage &amp; Déterminisme TKPH
              </h3>
              <button
                onClick={onCloseRecordCycle}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onRecordCycle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Gisement Minier</label>
                <select
                  required
                  value={cycleForm.siteId}
                  onChange={(e) => onCycleFormChange({ ...cycleForm, siteId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Sélectionnez un site...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} (W.{s.wilayaCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Réf Dumper (ex: Cat 777)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DUMPER-CAT-777-01"
                    value={cycleForm.assetId}
                    onChange={(e) => onCycleFormChange({ ...cycleForm, assetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chauffeur Opérateur</label>
                  <input
                    type="text"
                    placeholder="Ex: Amar Khelifa"
                    value={cycleForm.driverId}
                    onChange={(e) => onCycleFormChange({ ...cycleForm, driverId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Charge Utile (T)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={cycleForm.payloadMetricTons}
                    onChange={(e) => onCycleFormChange({ ...cycleForm, payloadMetricTons: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min={0.5}
                    value={cycleForm.cycleDistanceKm}
                    onChange={(e) => onCycleFormChange({ ...cycleForm, cycleDistanceKm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Durée (min)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={cycleForm.cycleDurationMinutes}
                    onChange={(e) => onCycleFormChange({ ...cycleForm, cycleDurationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Gasoil Consommé (L)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={cycleForm.fuelConsumedLiters}
                    onChange={(e) => onCycleFormChange({ ...cycleForm, fuelConsumedLiters: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">T° Ambiante Piste (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={cycleForm.ambientTempC}
                    onChange={(e) => onCycleFormChange({ ...cycleForm, ambientTempC: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseRecordCycle}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
                  Enregistrer le cycle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

