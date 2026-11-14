'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { AssetClient } from '@/lib/api-assets';
import {
  VehicleStateDto,
  DriverStateDto,
  AssetCategory,
  DispatchStatus,
} from '../types';

export function useDispatchData() {
  const { isDemoMode, session } = useDemoMode();
  const [vehicles, setVehicles] = useState<VehicleStateDto[]>([]);
  const [drivers, setDrivers] = useState<DriverStateDto[]>([]);
  const [loadingFleet, setLoadingFleet] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFleet = useCallback(async () => {
    setLoadingFleet(true);
    setError(null);

    if (isDemoMode) {
      try {
        const sandbox = await import('@/lib/simulation-sandbox');
        const mockVehicles = sandbox.getMockSandboxDispatchVehicles() as unknown as VehicleStateDto[];
        const mockDrivers = sandbox.MOCK_SANDBOX_DISPATCH_DRIVERS as unknown as DriverStateDto[];
        setVehicles(mockVehicles);
        setDrivers(mockDrivers);
      } catch (err) {
        setError('Erreur lors du chargement des données démo.');
      } finally {
        setLoadingFleet(false);
      }
      return;
    }

    if (!session.token) {
      setVehicles([]);
      setDrivers([]);
      setLoadingFleet(false);
      return;
    }

    try {
      const assetsList = await AssetClient.listAssets(session.token);
      if (assetsList && assetsList.length > 0) {
        const mapped: VehicleStateDto[] = assetsList.map((a) => ({
          vehicleId: a.id,
          registrationPlate: a.code || 'DZ-PARC',
          makeModel: a.name || `${a.brand || ''} ${a.model || ''}`.trim() || 'Véhicule Flotte Actif',
          category: AssetCategory.TRACTOR_TRAILER,
          maxPayloadTons: 25.0,
          grossVehicleWeightTons: 38.0,
          fuelType: 'DIESEL',
          refConsumptionL100Km: 32.0,
          hasWorkingReefer: false,
          hasWorkingPto: true,
          currentWilayaCode: 16,
          currentLat: 36.75,
          currentLon: 3.05,
          currentOdometerKm: 100000,
          currentEngineHours: 3000,
          annualTargetKm: 80000,
          ytdDrivenKm: 45000,
          vehicleHealthIndex: 90.0,
          batterySohPct: 92.0,
          coolingEwmaResidualC: 2.0,
          dispatchStatus: DispatchStatus.AVAILABLE,
          documents: [],
          subsystemRuls: [],
          activeDtcs: [],
        }));
        setVehicles(mapped);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      setVehicles([]);
      setError('Impossible de charger la liste des véhicules.');
    } finally {
      setLoadingFleet(false);
    }
  }, [isDemoMode, session.token]);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  return {
    vehicles,
    drivers,
    loadingFleet,
    error,
    reloadFleet: loadFleet,
  };
}

