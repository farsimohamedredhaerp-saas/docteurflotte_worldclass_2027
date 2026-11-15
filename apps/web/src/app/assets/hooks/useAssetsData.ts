'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Asset, AssetCategory, AssetStatus, DataOrigin, MeterType } from '@docteurflotte/contracts';
import { AuthClient } from '@/lib/api-auth';
import { AssetClient } from '@/lib/api-assets';
import { OEMScraperClient, NormalizedOEMTemplate } from '@/lib/api-oem-scraper';
import { useDemoMode } from '@/context/DemoModeContext';
import { useNotification } from '@/lib/hooks/useNotification';
import { CreateAssetFormData, EditAssetFormData, MeterReadingFormData } from '../types';

export function useAssetsData() {
  const { isDemoMode } = useDemoMode();
  const notification = useNotification(5000);
  const notifyErrorRef = useRef(notification.notifyError);

  useEffect(() => {
    notifyErrorRef.current = notification.notifyError;
  }, [notification.notifyError]);

  const [token, setToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRecordingMeter, setIsRecordingMeter] = useState(false);
  const [isResolvingOem, setIsResolvingOem] = useState(false);

  const loadAssets = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      const data = await AssetClient.listAssets(authToken);
      setAssets(data);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des actifs.';
      notifyErrorRef.current(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const session = AuthClient.getSession();
    setToken(session.token);

    if (isDemoMode) {
      (async () => {
        try {
          const { getSimulationAssets } = await import('@/lib/simulation-sandbox');
          const sandboxAssets = await getSimulationAssets();
          if (!isCancelled) {
            setAssets(sandboxAssets);
          }
        } catch {
          if (!isCancelled) {
            setAssets([]);
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      })();
    } else if (session.token) {
      loadAssets(session.token).then(() => {
        if (isCancelled) return;
      });
    } else {
      setAssets([]);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode, loadAssets]);

  const resolveOem = async (queryText: string): Promise<Partial<CreateAssetFormData> | null> => {
    const text = queryText.trim();
    if (!text) return null;
    setIsResolvingOem(true);

    try {
      const reqParam: { vin?: string; make?: string; model?: string } = {};
      if (text.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(text)) {
        reqParam.vin = text.toUpperCase();
      } else {
        const parts = text.split(/\s+/);
        reqParam.make = parts[0];
        reqParam.model = parts.slice(1).join(' ') || parts[0];
      }

      const oemData = await OEMScraperClient.resolveAndScrape(reqParam);

      let matchedCategory = AssetCategory.HEAVY_TRUCK;
      let matchedMeter = MeterType.ODOMETER_KM;
      if (oemData.asset_category === 'CONSTRUCTION_EQUIP') {
        matchedCategory = AssetCategory.CONSTRUCTION_EQUIPMENT;
        matchedMeter = MeterType.ENGINE_HOURS;
      } else if (oemData.asset_category === 'VAN' || oemData.asset_category === 'LIGHT_VEHICLE') {
        matchedCategory = AssetCategory.ROAD_VEHICLE;
      }

      const mainTask = oemData.tasks.find((t) => t.task_code === 'ENG_OIL_FILTER') || oemData.tasks[0];
      const intervalVal =
        matchedMeter === MeterType.ENGINE_HOURS
          ? mainTask?.normal_interval_engine_hours || 250
          : mainTask?.normal_interval_km || 30000;

      notification.notifySuccess(`Données constructeur trouvées pour « ${oemData.make} ${oemData.model} »`);
      return {
        name: `${oemData.make} ${oemData.model} (${oemData.engine_code || 'OEM'})`.trim(),
        brand: oemData.make,
        model: oemData.model,
        category: matchedCategory,
        primaryMeterType: matchedMeter,
        maintenanceIntervalValue: intervalVal,
      };
    } catch {
      notification.notifyWarning("Aucune fiche constructeur correspondante. Saisie manuelle.");
      return null;
    } finally {
      setIsResolvingOem(false);
    }
  };

  const createAsset = async (data: CreateAssetFormData): Promise<boolean> => {
    if (isDemoMode) {
      const newSimAsset: Asset = {
        id: `asset-sim-${Date.now().toString(36)}`,
        tenantId: 'demo-tenant',
        code: data.code,
        name: data.name,
        category: data.category,
        brand: data.brand,
        model: data.model,
        year: data.year,
        status: AssetStatus.OPERATIONAL,
        dataOrigin: DataOrigin.DEMO,
        primaryMeterType: data.primaryMeterType,
        currentMeterValue: data.initialMeterValue,
        maintenanceIntervalValue: data.maintenanceIntervalValue,
        nextMaintenanceMeterValue: data.initialMeterValue + data.maintenanceIntervalValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAssets((prev) => [newSimAsset, ...prev]);
      notification.notifySuccess(`Actif « ${data.name} » (${data.code}) enregistré.`);
      return true;
    }

    if (!token) {
      notification.notifyError('Session expirée, veuillez vous reconnecter.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const created = await AssetClient.createAsset(data, token);
      notification.notifySuccess(`Actif « ${created.name} » (${created.code}) enregistré.`);
      setAssets((prev) => [created, ...prev]);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'enregistrement.";
      notification.notifyError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAsset = async (id: string, data: EditAssetFormData): Promise<boolean> => {
    if (isDemoMode) {
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      );
      notification.notifySuccess(`Actif ${data.code} mis à jour.`);
      return true;
    }

    if (!token) return false;
    setIsUpdating(true);
    try {
      const updated = await AssetClient.updateAsset(id, data, token);
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      notification.notifySuccess(`Actif ${updated.code} mis à jour.`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la mise à jour.';
      notification.notifyError(msg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteAsset = async (id: string, label: string): Promise<boolean> => {
    if (isDemoMode) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      notification.notifySuccess(`Actif ${label} supprimé.`);
      return true;
    }

    if (!token) return false;
    try {
      await AssetClient.deleteAsset(id, token);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      notification.notifySuccess(`Actif ${label} supprimé.`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la suppression.';
      notification.notifyError(msg);
      return false;
    }
  };

  const recordMeter = async (asset: Asset, newMeterValue: number): Promise<boolean> => {
    setIsRecordingMeter(true);
    try {
      if (isDemoMode) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === asset.id
              ? {
                  ...a,
                  currentMeterValue: newMeterValue,
                  status:
                    a.nextMaintenanceMeterValue && newMeterValue >= a.nextMaintenanceMeterValue
                      ? AssetStatus.MAINTENANCE_REQUIRED
                      : a.status,
                }
              : a
          )
        );
        notification.notifySuccess(
          `Compteur relevé avec succès : ${newMeterValue.toLocaleString('fr-DZ')} (${asset.code}).`
        );
        return true;
      }

      if (!token) return false;
      const res = await AssetClient.recordMeterReading(
        asset.id,
        {
          meterType: asset.primaryMeterType,
          value: newMeterValue,
        },
        token
      );

      if (res.rollbackDetected) {
        notification.notifyWarning(`Relevé anormal détecté : ${res.message}`);
      } else if (res.maintenanceTriggered) {
        notification.notifySuccess(`Ordre de travail déclenché : ${res.message}`);
      } else {
        notification.notifySuccess(
          `Compteur certifié mis à jour (${res.currentValue} ${asset.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'h'}).`
        );
      }
      loadAssets(token);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'enregistrement du relevé.";
      notification.notifyError(msg);
      return false;
    } finally {
      setIsRecordingMeter(false);
    }
  };

  return {
    token,
    assets,
    isLoading,
    isSubmitting,
    isUpdating,
    isRecordingMeter,
    isResolvingOem,
    notification,
    createAsset,
    updateAsset,
    deleteAsset,
    recordMeter,
    resolveOem,
    reload: () => token && loadAssets(token),
  };
}
