'use client';

import React from 'react';
import { Button } from '@/components/Button';
import {
  IconSun,
  IconGauge,
  IconFileText,
  IconX,
  IconZap,
} from '@/components/navigation/TechIcons';
import {
  FarmProperty,
  IrrigationPivot,
  CropType,
  CreateFarmPropertyDto,
  CreateIrrigationPivotDto,
  RecordIrrigationTelemetryDto,
  RecordHarvestCampaignDto,
} from '@/lib/api-agriculture';

interface AgricultureModalsProps {
  farms: FarmProperty[];
  pivots: IrrigationPivot[];
  isAddFarmOpen: boolean;
  onCloseAddFarm: () => void;
  farmForm: CreateFarmPropertyDto;
  onFarmFormChange: (form: CreateFarmPropertyDto) => void;
  onCreateFarm: (e: React.FormEvent) => void;
  isAddPivotOpen: boolean;
  onCloseAddPivot: () => void;
  pivotForm: CreateIrrigationPivotDto;
  onPivotFormChange: (form: CreateIrrigationPivotDto) => void;
  onCreatePivot: (e: React.FormEvent) => void;
  isRecordTelemOpen: boolean;
  onCloseRecordTelem: () => void;
  telemForm: RecordIrrigationTelemetryDto;
  onTelemFormChange: (form: RecordIrrigationTelemetryDto) => void;
  onRecordTelemetry: (e: React.FormEvent) => void;
  isRecordHarvestOpen: boolean;
  onCloseRecordHarvest: () => void;
  harvestForm: RecordHarvestCampaignDto;
  onHarvestFormChange: (form: RecordHarvestCampaignDto) => void;
  onRecordHarvest: (e: React.FormEvent) => void;
}

export function AgricultureModals({
  farms,
  pivots,
  isAddFarmOpen,
  onCloseAddFarm,
  farmForm,
  onFarmFormChange,
  onCreateFarm,
  isAddPivotOpen,
  onCloseAddPivot,
  pivotForm,
  onPivotFormChange,
  onCreatePivot,
  isRecordTelemOpen,
  onCloseRecordTelem,
  telemForm,
  onTelemFormChange,
  onRecordTelemetry,
  isRecordHarvestOpen,
  onCloseRecordHarvest,
  harvestForm,
  onHarvestFormChange,
  onRecordHarvest,
}: AgricultureModalsProps) {
  return (
    <>
      {/* MODALE 1 : NOUVEAU DOMAINE AGRICOLE */}
      {isAddFarmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconSun size={18} className="text-amber-400" />
                Nouveau Domaine Céréalier Saharien
              </h3>
              <button
                onClick={onCloseAddFarm}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateFarm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Code Périmètre</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AGRI-ADR-03"
                  value={farmForm.code}
                  onChange={(e) => onFarmFormChange({ ...farmForm, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Raison Sociale / Désignation</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Exploitation Céréalière Sbaa Sud"
                  value={farmForm.name}
                  onChange={(e) => onFarmFormChange({ ...farmForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Code Wilaya (1 à 58)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={58}
                    value={farmForm.wilayaCode}
                    onChange={(e) => onFarmFormChange({ ...farmForm, wilayaCode: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Commune</label>
                  <input
                    type="text"
                    placeholder="Ex: Sbaa / Timimoun"
                    value={farmForm.commune}
                    onChange={(e) => onFarmFormChange({ ...farmForm, commune: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Superficie Totale (Hectares)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={farmForm.totalSurfaceHectares}
                    onChange={(e) => onFarmFormChange({ ...farmForm, totalSurfaceHectares: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Code CCLS / Coopérative</label>
                  <input
                    type="text"
                    placeholder="Ex: CCLS-ADRAR-01"
                    value={farmForm.cclsCode}
                    onChange={(e) => onFarmFormChange({ ...farmForm, cclsCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseAddFarm}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                  Créer l’exploitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : NOUVEAU PIVOT D'IRRIGATION */}
      {isAddPivotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconZap size={18} className="text-amber-400" />
                Nouveau Pivot Albien & Forage Profond
              </h3>
              <button
                onClick={onCloseAddPivot}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreatePivot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Domaine Agricole</label>
                <select
                  required
                  value={pivotForm.farmId}
                  onChange={(e) => onPivotFormChange({ ...pivotForm, farmId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Sélectionnez un domaine...</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} — {f.name} (W.{f.wilayaCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Code Pivot</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PIV-ADR-03"
                    value={pivotForm.pivotCode}
                    onChange={(e) => onPivotFormChange({ ...pivotForm, pivotCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Culture</label>
                  <select
                    value={pivotForm.cropType}
                    onChange={(e) => onPivotFormChange({ ...pivotForm, cropType: e.target.value as CropType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value={CropType.BLE_DUR}>Blé Dur</option>
                    <option value={CropType.ORGE}>Orge</option>
                    <option value={CropType.MAIS}>Maïs</option>
                    <option value={CropType.LUZERNE}>Luzerne</option>
                    <option value={CropType.PALMIER_DATTIER}>Palmier Dattier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Désignation du Pivot</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pivot 03 Nappe Albienne (80 Ha)"
                  value={pivotForm.name}
                  onChange={(e) => onPivotFormChange({ ...pivotForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Surface (Ha)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pivotForm.surfaceHectares}
                    onChange={(e) => onPivotFormChange({ ...pivotForm, surfaceHectares: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Forage (m)</label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={pivotForm.boreholeDepthMeters}
                    onChange={(e) => onPivotFormChange({ ...pivotForm, boreholeDepthMeters: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Conso L/h</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min={1}
                    value={pivotForm.nominalFuelBurnRateLH}
                    onChange={(e) => onPivotFormChange({ ...pivotForm, nominalFuelBurnRateLH: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseAddPivot}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                  Créer le pivot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : RELEVER TÉLÉMÉTRIE FORAGE / PIVOT */}
      {isRecordTelemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconGauge size={18} className="text-cyan-400" />
                Relevé Horaire de Pompage & Carburant
              </h3>
              <button
                onClick={onCloseRecordTelem}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onRecordTelemetry} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pivot d’Irrigation</label>
                <select
                  required
                  value={telemForm.pivotId}
                  onChange={(e) => onTelemFormChange({ ...telemForm, pivotId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Sélectionnez un pivot...</option>
                  {pivots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.pivotCode} — {p.name} ({p.cropType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Heures de marche (Δt h)</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    min={0.5}
                    value={telemForm.hoursRunningDelta}
                    onChange={(e) => onTelemFormChange({ ...telemForm, hoursRunningDelta: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Gasoil Consommé (Litres)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min={1}
                    value={telemForm.fuelConsumedLiters}
                    onChange={(e) => onTelemFormChange({ ...telemForm, fuelConsumedLiters: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Débit (m³/h)</label>
                  <input
                    type="number"
                    step="1"
                    value={telemForm.waterFlowM3H}
                    onChange={(e) => onTelemFormChange({ ...telemForm, waterFlowM3H: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pression (Bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={telemForm.waterPressureBar}
                    onChange={(e) => onTelemFormChange({ ...telemForm, waterPressureBar: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">T° Ambiante (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={telemForm.ambientTempC}
                    onChange={(e) => onTelemFormChange({ ...telemForm, ambientTempC: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseRecordTelem}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  Enregistrer télémétrie
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 4 : SAISIE MOISSON-BATTAGE / À LA TÂCHE */}
      {isRecordHarvestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconFileText size={18} className="text-amber-400" />
                Saisie Moisson-Battage & Rémunération Tâche
              </h3>
              <button
                onClick={onCloseRecordHarvest}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onRecordHarvest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Domaine Agricole</label>
                <select
                  required
                  value={harvestForm.farmId}
                  onChange={(e) => onHarvestFormChange({ ...harvestForm, farmId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Sélectionnez un domaine...</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} — {f.name} (W.{f.wilayaCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Réf Engin (Moissonneuse / Tracteur)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MOISSONNEUSE-CLAAS-01"
                    value={harvestForm.assetId}
                    onChange={(e) => onHarvestFormChange({ ...harvestForm, assetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nom / Matricule Chauffeur</label>
                  <input
                    type="text"
                    placeholder="Ex: Chauffeur Khaled"
                    value={harvestForm.driverId}
                    onChange={(e) => onHarvestFormChange({ ...harvestForm, driverId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Surface Récoltée (Ha)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={harvestForm.areaWorkedHectares}
                    onChange={(e) => onHarvestFormChange({ ...harvestForm, areaWorkedHectares: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Récolte (Quintaux)</label>
                  <input
                    type="number"
                    value={harvestForm.yieldQuintals}
                    onChange={(e) => onHarvestFormChange({ ...harvestForm, yieldQuintals: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Gasoil (Litres)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={harvestForm.fuelConsumedLiters}
                    onChange={(e) => onHarvestFormChange({ ...harvestForm, fuelConsumedLiters: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tarif Chauffeur (DZD / Hectare)</label>
                  <input
                    type="number"
                    value={harvestForm.driverRatePerHectareDzd}
                    onChange={(e) => onHarvestFormChange({ ...harvestForm, driverRatePerHectareDzd: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Prime Rendement (DZD / Quintal)</label>
                  <input
                    type="number"
                    value={harvestForm.driverRatePerQuintalDzd}
                    onChange={(e) => onHarvestFormChange({ ...harvestForm, driverRatePerQuintalDzd: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Réf Bon de Livraison CCLS / OAIC</label>
                <input
                  type="text"
                  placeholder="Ex: CCLS-ADRAR-2026-BLE-0842"
                  value={harvestForm.cclsDeliveryNoteRef}
                  onChange={(e) => onHarvestFormChange({ ...harvestForm, cclsDeliveryNoteRef: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseRecordHarvest}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                  Valider le bon moisson
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

