'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useNotification } from '@/lib/hooks/useNotification';
import { DriverRecord, DriverFormData } from '../types';

export function useDriversData() {
  const { isDemoMode } = useDemoMode();
  const notification = useNotification(5000);

  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    if (isDemoMode) {
      import('@/lib/simulation-sandbox')
        .then((sandbox) => {
          if (!isCancelled) {
            setDrivers(sandbox.MOCK_SANDBOX_DRIVERS);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setDrivers([]);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoading(false);
          }
        });
    } else {
      setDrivers([]);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const addDriver = useCallback(
    (formData: DriverFormData) => {
      const newDriver: DriverRecord = {
        id: `drv-${Date.now().toString().slice(-4)}`,
        name: formData.name || 'Nouveau Conducteur',
        matriculeNumber: formData.matriculeNumber || `DRV-DZ-${Date.now().toString().slice(-3)}`,
        phone: formData.phone || '0550 00 00 00',
        licenseCategory: formData.licenseCategory || 'E',
        licenseNumber: formData.licenseNumber || 'DZ-16-000000',
        licenseExpiry: formData.licenseExpiry || '2028-12-31',
        medicalCheckExpiry: formData.medicalCheckExpiry || '2027-06-30',
        assignedVehiclePlate: formData.assignedVehiclePlate || 'Non Affecté',
        assignedVehicleModel: formData.assignedVehicleModel || 'Non Affecté',
        currentSiteOrCorridor: formData.currentSiteOrCorridor || 'Base Centrale',
        ecoDrivingScore: 85,
        harshBrakingCount: 0,
        excessiveIdleMinutes: 0,
        status: formData.status || 'AVAILABLE',
      };

      setDrivers((prev) => [newDriver, ...prev]);
      notification.notifySuccess(`Nouveau conducteur « ${newDriver.name} » enregistré avec succès.`);
    },
    [notification]
  );

  const updateDriver = useCallback(
    (id: string, formData: DriverFormData) => {
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? ({ ...d, ...formData } as DriverRecord) : d))
      );
      notification.notifySuccess(`Fiche conducteur de « ${formData.name} » mise à jour avec succès.`);
    },
    [notification]
  );

  const deleteDriver = useCallback(
    (id: string, name: string) => {
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      notification.notifySuccess(`Conducteur « ${name} » retiré de l’effectif.`);
    },
    [notification]
  );

  return {
    drivers,
    isLoading,
    notification,
    addDriver,
    updateDriver,
    deleteDriver,
  };
}
