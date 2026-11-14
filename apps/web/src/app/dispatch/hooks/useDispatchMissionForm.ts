'use client';

import { useState, useEffect } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { FleetIntelligenceClient } from '@/lib/api-fleet-intelligence';
import {
  IndustrySector,
  ClimateZoneDZ,
  DispatchDecisionResult,
  RegulatoryMissionOrderData,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
} from '../types';

interface UseDispatchMissionFormProps {
  vehicles: VehicleStateDto[];
  drivers: DriverStateDto[];
  onOrderIssued?: (order: RegulatoryMissionOrderData) => void;
}

export function useDispatchMissionForm({
  vehicles,
  drivers,
  onOrderIssued,
}: UseDispatchMissionFormProps) {
  const { session } = useDemoMode();

  const [selectedSector, setSelectedSector] = useState<IndustrySector>(IndustrySector.TRANSPORT);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const [originName, setOriginName] = useState<string>(
    'Plateforme Logistique Rouïba (Zone Industrielle)',
  );
  const [originWilaya, setOriginWilaya] = useState<number>(16);
  const [destinationName, setDestinationName] = useState<string>(
    'Base Logistique Hassi Messaoud (Base 24)',
  );
  const [destinationWilaya, setDestinationWilaya] = useState<number>(30);
  const [transitWilayas, setTransitWilayas] = useState<string>('09, 28, 47'); // Blida, M'Sila, Ghardaïa

  const [cargoNature, setCargoNature] = useState<string>('Pièces de forage & tubes acier pétroliers');
  const [payloadTons, setPayloadTons] = useState<number>(24.5);
  const [routeKm, setRouteKm] = useState<number>(850);
  const [climateZone, setClimateZone] = useState<ClimateZoneDZ>(ClimateZoneDZ.SAHARA_SOUTH);

  const [requiresHazmat, setRequiresHazmat] = useState<boolean>(false);
  const [requiresReefer, setRequiresReefer] = useState<boolean>(false);

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isIssuing, setIsIssuing] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<DispatchDecisionResult | null>(null);
  const [activeMissionOrder, setActiveMissionOrder] = useState<RegulatoryMissionOrderData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronisation des sélections par défaut
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].vehicleId);
    }
  }, [vehicles, selectedVehicleId]);

  useEffect(() => {
    if (drivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(drivers[0].driverId);
    }
  }, [drivers, selectedDriverId]);

  const selectedVehicle =
    vehicles.find((v) => v.vehicleId === selectedVehicleId) || vehicles[0];
  const selectedDriver =
    drivers.find((d) => d.driverId === selectedDriverId) || drivers[0];

  const handleEvaluateDispatch = async () => {
    if (vehicles.length === 0 || !selectedVehicle) {
      setFormError("Aucun véhicule d'exploitation disponible pour l'évaluation de mission.");
      return;
    }

    setFormError(null);
    setIsEvaluating(true);
    setDecisionResult(null);
    setActiveMissionOrder(null);

    const transits = transitWilayas
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const currentTenantId = session.tenant?.id || 'tenant-default';
    const mission: MissionRequestDto = {
      missionId: `MIS-2026-${Date.now().toString().slice(-5)}`,
      tenantId: currentTenantId,
      industrySector: selectedSector,
      requestedVehicleId: selectedVehicleId || selectedVehicle.vehicleId,
      requestedDriverId: selectedDriverId || selectedDriver?.driverId || '',
      originName,
      originWilayaCode: originWilaya,
      originLat: 36.73,
      originLon: 3.28,
      destinationName,
      destinationWilayaCode: destinationWilaya,
      transitWilayaCodes: transits,
      plannedDepartureUtc: new Date().toISOString(),
      routeDistanceKm: routeKm,
      estimatedDrivingHours: Math.round((routeKm / 65) * 10) / 10,
      requiredPayloadTons: payloadTons,
      targetClimateZone: climateZone,
      requiresReeferColdChain: requiresReefer,
      requiresHazmatAdr: requiresHazmat,
      requiresPtoHydraulics: true,
    };

    try {
      const res = await FleetIntelligenceClient.evaluateAndAssign({
        mission,
        fleetVehicles: vehicles,
        fleetDrivers: drivers,
      });
      setDecisionResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Erreur d'évaluation : ${msg || 'Échec réseau'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleIssueMissionOrder = async () => {
    if (!decisionResult) return;

    const assignedVehId = decisionResult.assignedVehicleId || selectedVehicleId;
    const assignedDrvId = decisionResult.assignedDriverId || selectedDriverId;

    const v = vehicles.find((x) => x.vehicleId === assignedVehId) || selectedVehicle;
    const d = drivers.find((x) => x.driverId === assignedDrvId) || selectedDriver;

    if (!v || !d) {
      setFormError("Véhicule ou conducteur introuvable pour l'émission de l'ordre de mission.");
      return;
    }

    setIsIssuing(true);
    setFormError(null);

    const currentTenantId = session.tenant?.id || 'tenant-default';
    const mission: MissionRequestDto = {
      missionId: decisionResult.missionId,
      tenantId: currentTenantId,
      industrySector: selectedSector,
      requestedVehicleId: v.vehicleId,
      requestedDriverId: d.driverId,
      originName,
      originWilayaCode: originWilaya,
      originLat: 36.73,
      originLon: 3.28,
      destinationName,
      destinationWilayaCode: destinationWilaya,
      transitWilayaCodes: transitWilayas
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n)),
      plannedDepartureUtc: decisionResult.recommendedEtdUtc || new Date().toISOString(),
      routeDistanceKm: routeKm,
      estimatedDrivingHours: Math.round((routeKm / 65) * 10) / 10,
      requiredPayloadTons: payloadTons,
      targetClimateZone: climateZone,
      requiresReeferColdChain: requiresReefer,
      requiresHazmatAdr: requiresHazmat,
      requiresPtoHydraulics: true,
    };

    try {
      const order = await FleetIntelligenceClient.issueMissionOrder({
        mission,
        vehicle: v,
        driver: d,
        companyInfo: {
          legalName: 'SOCIÉTÉ ALGÉRIENNE DE TRANSPORT & LOGISTIQUE EURL',
          tradeName: 'ALGERIA FLEET LOGISTICS',
          nif: '001616012345678',
          nis: '00161601234',
          rcNumber: '16/00-1234567B22',
          aiNumber: '16012345678',
          headquartersWilayaCode: 16,
          headquartersWilayaName: 'Alger',
        },
      });
      setActiveMissionOrder(order);
      if (onOrderIssued) {
        onOrderIssued(order);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Impossible d'émettre l'Ordre de Mission : ${msg}`);
    } finally {
      setIsIssuing(false);
    }
  };

  return {
    selectedSector,
    setSelectedSector,
    selectedVehicleId,
    setSelectedVehicleId,
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
    climateZone,
    setClimateZone,
    requiresHazmat,
    setRequiresHazmat,
    requiresReefer,
    setRequiresReefer,
    selectedVehicle,
    selectedDriver,
    isEvaluating,
    isIssuing,
    decisionResult,
    activeMissionOrder,
    setActiveMissionOrder,
    formError,
    setFormError,
    handleEvaluateDispatch,
    handleIssueMissionOrder,
  };
}
