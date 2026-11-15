'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useNotification } from '@/lib/hooks/useNotification';
import { AuthClient } from '@/lib/api-auth';
import { AssetClient } from '@/lib/api-assets';
import {
  FleetIntelligenceClient,
  DVIRInspectionReport,
  DVIRSubmissionDto,
} from '@/lib/api-fleet-intelligence';
import {
  saveDvirOffline,
  getPendingOfflineInspections,
  markDvirSynced,
  OfflineDvirRecord,
} from '@/lib/offline-dvir-storage';
import { VehicleProfile, DvirKpiSummary } from '../types';
import { computeDvirKpis } from '../lib/dvirSelectors';

export function useDvirData() {
  const { isDemoMode } = useDemoMode();
  const notification = useNotification(5000);
  const notifyRef = useRef(notification);

  useEffect(() => {
    notifyRef.current = notification;
  }, [notification]);

  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [reports, setReports] = useState<DVIRInspectionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<DVIRSubmissionDto[]>([]);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Initialisation de la file hors-ligne locale
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem('df_dvir_offline_queue');
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed)) setOfflineQueue(parsed);
      }
    } catch {
      // Ignoré
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const { getSimulationDvirData } = await import('@/lib/simulation-sandbox');
        const simData = await getSimulationDvirData();
        setVehicles(simData.vehicles as VehicleProfile[]);
        setReports(simData.reports);
      } else {
        const session = AuthClient.getSession();
        if (session.token) {
          const [fetchedAssets, fetchedReports] = await Promise.all([
            AssetClient.listAssets(session.token).catch(() => []),
            FleetIntelligenceClient.getDvirReports(session.token, false).catch(() => []),
          ]);

          const mappedProfiles: VehicleProfile[] = fetchedAssets.map((a: any) => ({
            id: a.id,
            name: a.name,
            plate: a.code,
            category: a.category,
            driverName: 'Chauffeur Non Assigné',
            driverId: 'drv-unassigned',
            odometerKm: a.currentMeterValue || 0,
            engineHours: 0,
            wilaya: '16 - Alger',
            fuelType: 'Gasoil',
            lastInspectionDate: a.updatedAt || new Date().toISOString(),
            lastInspectionResult: 'PASS',
          }));

          setVehicles(mappedProfiles);
          setReports(fetchedReports);
        } else {
          setVehicles([]);
          setReports([]);
        }
      }
    } catch {
      notifyRef.current.notifyError('Erreur de chargement des données d’inspection.');
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const triggerOfflineSync = useCallback(async () => {
    const pending = await getPendingOfflineInspections();
    if (pending.length === 0) return;

    setIsSyncingOffline(true);
    const session = AuthClient.getSession();
    let syncedCount = 0;

    for (const item of pending) {
      try {
        if (!isDemoMode && session.token) {
          const dto: DVIRSubmissionDto = {
            assetId: item.assetId,
            driverId: item.driverId,
            driverName: item.driverName,
            inspectionType: item.inspectionType as any,
            odometerKm: item.odometerKm,
            engineHours: item.engineHours,
            items: item.items.map((it) => ({
              code: it.code,
              category: it.category as any,
              label: it.label,
              status: it.status as any,
              comment: it.comment,
              photoUrl: it.photoUrl,
            })),
            signatureDataUrl: item.signatureBase64,
          };
          await FleetIntelligenceClient.submitDvirReport(dto, session.token, false);
        }
        await markDvirSynced(item.id);
        syncedCount++;
      } catch {
        // Report différé
      }
    }

    if (syncedCount > 0) {
      notifyRef.current.notifySuccess(
        `${syncedCount} inspection${syncedCount > 1 ? 's' : ''} hors-ligne synchronisée${syncedCount > 1 ? 's' : ''} avec succès.`
      );
      loadData();
    }
    setIsSyncingOffline(false);
  }, [isDemoMode, loadData]);

  useEffect(() => {
    loadData();

    const onlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(onlineStatus);

    const handleOnline = () => {
      setIsOnline(true);
      triggerOfflineSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData, triggerOfflineSync]);

  const submitInspection = async (
    dto: DVIRSubmissionDto,
    onSuccessCallback?: () => void
  ): Promise<boolean> => {
    setIsSubmitting(true);
    const vehicle = vehicles.find((v) => v.id === dto.assetId);

    try {
      if (!isOnline) {
        // Enregistrement offline
        const offlineRecord: Omit<OfflineDvirRecord, 'id' | 'syncStatus' | 'createdAt'> = {
          assetId: dto.assetId,
          assetPlate: vehicle?.plate || 'DZ-PLATE',
          driverId: dto.driverId,
          driverName: dto.driverName,
          inspectionType: dto.inspectionType as 'PRE_TRIP' | 'POST_TRIP',
          odometerKm: dto.odometerKm || 0,
          engineHours: dto.engineHours,
          items: dto.items.map((i) => ({
            code: i.code,
            label: i.label,
            category: i.category,
            status: i.status,
            comment: i.comment,
            photoUrl: i.photoUrl,
          })),
          signatureBase64: dto.signatureDataUrl,
          deviceTimestamp: new Date().toISOString(),
        };

        await saveDvirOffline(offlineRecord);
        setOfflineQueue((prev) => [...prev, dto]);
        notification.notifyWarning(
          "Réseau indisponible. L'inspection a été signée et enregistrée en local (IndexedDB)."
        );
        if (onSuccessCallback) onSuccessCallback();
        return true;
      }

      if (isDemoMode) {
        const hasCrit = dto.items.some((i) => i.status === 'FAIL_CRITICAL');
        const newReport: DVIRInspectionReport = {
          id: `dvir-sim-${Date.now().toString(36)}`,
          tenantId: 'demo-tenant',
          assetId: dto.assetId,
          assetCode: vehicle?.plate || 'DZ-PLATE',
          assetName: vehicle?.name || 'Véhicule',
          driverId: dto.driverId || 'drv-sim',
          driverName: dto.driverName,
          inspectionType: dto.inspectionType,
          odometerKm: dto.odometerKm,
          isCompliant: !hasCrit,
          hasCriticalFailures: hasCrit,
          submittedAt: new Date().toISOString(),
          signatureDataUrl: dto.signatureDataUrl,
          items: dto.items,
          generatedWorkOrderId: hasCrit ? `OT-CRIT-${Date.now().toString(36).toUpperCase()}` : undefined,
        };

        setReports((prev) => [newReport, ...prev]);
        notification.notifySuccess(
          hasCrit
            ? `Inspection signée. Défaillance critique : Ordre de travail ${newReport.generatedWorkOrderId} généré.`
            : `Inspection DVIR certifiée pour ${dto.driverName} (Véhicule conforme).`
        );
        if (onSuccessCallback) onSuccessCallback();
        return true;
      }

      const session = AuthClient.getSession();
      if (!session.token) {
        notification.notifyError('Session expirée, veuillez vous reconnecter.');
        return false;
      }

      const created = await FleetIntelligenceClient.submitDvirReport(dto, session.token, false);
      setReports((prev) => [created, ...prev]);
      notification.notifySuccess(
        created.hasCriticalFailures
          ? `Défaillance critique ! Véhicule consigné (OT ${created.generatedWorkOrderId || 'généré'}).`
          : `Inspection DVIR certifiée conforme pour ${dto.driverName}.`
      );
      if (onSuccessCallback) onSuccessCallback();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la soumission de l’inspection.';
      notification.notifyError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const kpis: DvirKpiSummary = computeDvirKpis(reports);

  return {
    vehicles,
    reports,
    isLoading,
    isSubmitting,
    isOnline,
    offlineQueue,
    isSyncingOffline,
    notification,
    submitInspection,
    triggerOfflineSync,
    refreshData: loadData,
    kpis,
  };
}
