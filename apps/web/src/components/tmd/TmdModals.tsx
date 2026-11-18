'use client';

import React from 'react';
import { Button } from '@/components/Button';
import {
  IconGauge,
  IconX,
  IconFileText,
  IconUsers,
} from '@/components/navigation/TechIcons';
import {
  TmdDriverCertification,
  TankerProductType,
  CreateTmdDriverCertificationDto,
  CreateFuelTankerCompartmentDto,
  CreateTmdTransportMissionDto,
} from '@/lib/api-tmd';

interface TmdModalsProps {
  drivers: TmdDriverCertification[];
  isAddDriverOpen: boolean;
  onCloseAddDriver: () => void;
  driverForm: CreateTmdDriverCertificationDto;
  onDriverFormChange: (form: CreateTmdDriverCertificationDto) => void;
  onCreateDriver: (e: React.FormEvent) => void;
  isAddCompOpen: boolean;
  onCloseAddComp: () => void;
  compForm: CreateFuelTankerCompartmentDto;
  onCompFormChange: (form: CreateFuelTankerCompartmentDto) => void;
  onCreateComp: (e: React.FormEvent) => void;
  isAddMissionOpen: boolean;
  onCloseAddMission: () => void;
  missionForm: CreateTmdTransportMissionDto;
  onMissionFormChange: (form: CreateTmdTransportMissionDto) => void;
  onCreateMission: (e: React.FormEvent) => void;
}

export function TmdModals({
  drivers,
  isAddDriverOpen,
  onCloseAddDriver,
  driverForm,
  onDriverFormChange,
  onCreateDriver,
  isAddCompOpen,
  onCloseAddComp,
  compForm,
  onCompFormChange,
  onCreateComp,
  isAddMissionOpen,
  onCloseAddMission,
  missionForm,
  onMissionFormChange,
  onCreateMission,
}: TmdModalsProps) {
  return (
    <>
      {/* MODALE 1 : HABILITATION CHAUFFEUR TMD */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconUsers size={18} className="text-red-400" />
                Habilitation &amp; Brevet TMD Chauffeur (DTW)
              </h3>
              <button
                onClick={onCloseAddDriver}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateDriver} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nom &amp; Prénom du Chauffeur</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Khaled Bouzid"
                  value={driverForm.driverName}
                  onChange={(e) => onDriverFormChange({ ...driverForm, driverName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Numéro de Permis Poids Lourd</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PERMIS-16-9921"
                    value={driverForm.driverLicenseNumber}
                    onChange={(e) => onDriverFormChange({ ...driverForm, driverLicenseNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Numéro Brevet TMD Officiel</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: TMD-DZ-2025-0881"
                    value={driverForm.tmdCertificateNumber}
                    onChange={(e) => onDriverFormChange({ ...driverForm, tmdCertificateNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date de Délivrance</label>
                  <input
                    type="date"
                    required
                    value={driverForm.issueDate}
                    onChange={(e) => onDriverFormChange({ ...driverForm, issueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date d&apos;Expiration (3 ans max)</label>
                  <input
                    type="date"
                    required
                    value={driverForm.expiryDate}
                    onChange={(e) => onDriverFormChange({ ...driverForm, expiryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseAddDriver}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                  Valider Habilitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : COMPARTIMENT CITERNE */}
      {isAddCompOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconGauge size={18} className="text-red-400" />
                Nouveau Compartiment Citerne Hydrocarbures
              </h3>
              <button
                onClick={onCloseAddComp}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateComp} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Réf Véhicule / Camion</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CIT-NAF-16-01"
                    value={compForm.assetId}
                    onChange={(e) => onCompFormChange({ ...compForm, assetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Code Citerne</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CIT-MAGYAR-36K"
                    value={compForm.tankerCode}
                    onChange={(e) => onCompFormChange({ ...compForm, tankerCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">N° Comp. (1-5)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={5}
                    value={compForm.compartmentNumber}
                    onChange={(e) => onCompFormChange({ ...compForm, compartmentNumber: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Capacité (L)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step="500"
                    value={compForm.capacityLiters}
                    onChange={(e) => onCompFormChange({ ...compForm, capacityLiters: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Produit</label>
                  <select
                    value={compForm.currentProductType}
                    onChange={(e) => onCompFormChange({ ...compForm, currentProductType: e.target.value as TankerProductType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value={TankerProductType.GASOIL}>Gasoil</option>
                    <option value={TankerProductType.SUPER_SANS_PLOMB}>Sans Plomb</option>
                    <option value={TankerProductType.SIRGHAZ_GPL}>Sirghaz GPL</option>
                    <option value={TankerProductType.FUEL_LOURD}>Fuel Lourd</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date Épreuve APAVE</label>
                  <input
                    type="date"
                    required
                    value={compForm.apaveHydrostaticTestDate}
                    onChange={(e) => onCompFormChange({ ...compForm, apaveHydrostaticTestDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expiration APAVE (3 ans)</label>
                  <input
                    type="date"
                    required
                    value={compForm.apaveTestExpiryDate}
                    onChange={(e) => onCompFormChange({ ...compForm, apaveTestExpiryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseAddComp}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                  Créer le compartiment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : NOUVELLE MISSION TMD */}
      {isAddMissionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconFileText size={18} className="text-red-400" />
                Nouvelle Mission de Transport Hydrocarbures (TMD)
              </h3>
              <button
                onClick={onCloseAddMission}
                className="text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={onCreateMission} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Code Mission</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TMD-MSN-2026-0910"
                  value={missionForm.missionCode}
                  onChange={(e) => onMissionFormChange({ ...missionForm, missionCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Camion-Citerne</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CIT-NAF-16-01"
                    value={missionForm.assetId}
                    onChange={(e) => onMissionFormChange({ ...missionForm, assetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chauffeur TMD Certifié</label>
                  <select
                    required
                    value={missionForm.driverCertificationId}
                    onChange={(e) => onMissionFormChange({ ...missionForm, driverCertificationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="">Sélectionnez un chauffeur...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.driverName} ({d.tmdCertificateNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Dépôt Naftal Départ</label>
                  <input
                    type="text"
                    required
                    value={missionForm.originDepotName}
                    onChange={(e) => onMissionFormChange({ ...missionForm, originDepotName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Station Destination</label>
                  <input
                    type="text"
                    required
                    value={missionForm.destinationStationName}
                    onChange={(e) => onMissionFormChange({ ...missionForm, destinationStationName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Volume Total à Transporter (Litres)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step="500"
                  value={missionForm.totalVolumeLiters}
                  onChange={(e) => onMissionFormChange({ ...missionForm, totalVolumeLiters: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseAddMission}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                  Valider l&apos;Ordre TMD
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

