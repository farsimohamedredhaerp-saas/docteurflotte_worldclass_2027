'use client';

import React from 'react';
import { IndustrySector, VehicleStateDto, DriverStateDto } from '../types';
import { IconLayers, IconRefreshCw, IconZap } from '@/components/navigation/TechIcons';
import { RouteParametersSection } from './RouteParametersSection';
import { CargoParametersSection } from './CargoParametersSection';

interface MissionParametersFormProps {
  selectedSector: IndustrySector;
  setSelectedSector: (s: IndustrySector) => void;
  vehicles: VehicleStateDto[];
  loadingFleet: boolean;
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  drivers: DriverStateDto[];
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  originName: string;
  setOriginName: (s: string) => void;
  originWilaya: number;
  setOriginWilaya: (w: number) => void;
  destinationName: string;
  setDestinationName: (s: string) => void;
  destinationWilaya: number;
  setDestinationWilaya: (w: number) => void;
  transitWilayas: string;
  setTransitWilayas: (s: string) => void;
  cargoNature: string;
  setCargoNature: (s: string) => void;
  payloadTons: number;
  setPayloadTons: (t: number) => void;
  routeKm: number;
  setRouteKm: (km: number) => void;
  requiresHazmat: boolean;
  setRequiresHazmat: (h: boolean) => void;
  requiresReefer: boolean;
  setRequiresReefer: (r: boolean) => void;
  isEvaluating: boolean;
  onEvaluate: () => void;
}

export function MissionParametersForm({
  selectedSector,
  setSelectedSector,
  vehicles,
  loadingFleet,
  selectedVehicleId,
  setSelectedVehicleId,
  drivers,
  selectedDriverId,
  setSelectedDriverId,
  originName,
  setOriginName,
  originWilaya,
  setOriginWilaya,
  destinationName,
  setDestinationName,
  destinationWilaya,
  setDestinationWilaya,
  transitWilayas,
  setTransitWilayas,
  cargoNature,
  setCargoNature,
  payloadTons,
  setPayloadTons,
  routeKm,
  setRouteKm,
  requiresHazmat,
  setRequiresHazmat,
  requiresReefer,
  setRequiresReefer,
  isEvaluating,
  onEvaluate,
}: MissionParametersFormProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        <IconLayers size={16} className="text-blue-500" />
        <span>Paramètres de la Mission de Transport</span>
      </h2>

      <div className="space-y-4">
        {/* SECTEUR INDUSTRIEL */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Secteur d&apos;Activité
          </label>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value as IndustrySector)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          >
            <option value={IndustrySector.TRANSPORT}>Transport Routier & Fret Général</option>
            <option value={IndustrySector.BTP}>BTPH & Chantiers de Terrassement</option>
            <option value={IndustrySector.LOGISTICS}>Logistique & Distribution Urbaine</option>
            <option value={IndustrySector.COLD_CHAIN}>Chaîne du Froid & Pharmacie (ATP)</option>
            <option value={IndustrySector.AGRICULTURE}>Agriculture & Transport Céréalier</option>
          </select>
        </div>

        {/* VÉHICULE & CHAUFFEUR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Véhicule {loadingFleet ? '(Chargement...)' : ''}
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              disabled={loadingFleet || vehicles.length === 0}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
            >
              {vehicles.length === 0 ? (
                <option value="">Aucun véhicule</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.registrationPlate} — VHI {v.vehicleHealthIndex}%
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Conducteur
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              disabled={drivers.length === 0}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
            >
              {drivers.length === 0 ? (
                <option value="">Aucun conducteur</option>
              ) : (
                drivers.map((d) => (
                  <option key={d.driverId} value={d.driverId}>
                    {d.fullName} ({d.licenseCategories.join('+')})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* SECTION ITINÉRAIRE (58 WILAYAS) */}
        <RouteParametersSection
          originName={originName}
          setOriginName={setOriginName}
          originWilaya={originWilaya}
          setOriginWilaya={setOriginWilaya}
          destinationName={destinationName}
          setDestinationName={setDestinationName}
          destinationWilaya={destinationWilaya}
          setDestinationWilaya={setDestinationWilaya}
          transitWilayas={transitWilayas}
          setTransitWilayas={setTransitWilayas}
        />

        {/* SECTION CARGAISON & EXIGENCES */}
        <CargoParametersSection
          cargoNature={cargoNature}
          setCargoNature={setCargoNature}
          payloadTons={payloadTons}
          setPayloadTons={setPayloadTons}
          routeKm={routeKm}
          setRouteKm={setRouteKm}
          requiresHazmat={requiresHazmat}
          setRequiresHazmat={setRequiresHazmat}
          requiresReefer={requiresReefer}
          setRequiresReefer={setRequiresReefer}
        />

        {/* BOUTON D'ÉVALUATION PRINCIPAL */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onEvaluate}
            disabled={isEvaluating || vehicles.length === 0}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEvaluating ? (
              <IconRefreshCw size={14} className="animate-spin" />
            ) : (
              <IconZap size={14} />
            )}
            <span>
              {isEvaluating
                ? 'Évaluation des 4 Portes Réglementaires...'
                : vehicles.length === 0
                  ? 'Aucun véhicule disponible'
                  : 'Évaluer Éligibilité Réglementaire (Gate DZ)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
