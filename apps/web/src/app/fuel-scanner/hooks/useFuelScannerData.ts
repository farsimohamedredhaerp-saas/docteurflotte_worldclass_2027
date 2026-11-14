'use client';

import { useCallback, useEffect, useState } from 'react';
import { Asset, FuelReceiptScanResult, StandardFuelType } from '@docteurflotte/contracts';
import { AuthClient } from '@/lib/api-auth';
import { FuelScannerClient } from '@/lib/api-fuel-scanner';
import { AssetClient } from '@/lib/api-assets';
import { useDemoMode } from '@/context/DemoModeContext';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { useNotification } from '@/lib/hooks/useNotification';
import { ManualReceiptFormData, EditReceiptFormData } from '../types';

export function useFuelScannerData() {
  const { isDemoMode } = useDemoMode();
  const { getFuelPrice } = useSystemConfig();
  const notification = useNotification(5000);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<FuelReceiptScanResult | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<FuelReceiptScanResult[]>([]);

  const resolvePrice = useCallback(
    (typeStr: string): number => {
      const lower = (typeStr || '').toLowerCase();
      if (lower.includes('sans plomb')) return getFuelPrice('sansPlomb');
      if (lower.includes('super')) return getFuelPrice('super');
      if (lower.includes('gpl') || lower.includes('sirghaz')) return getFuelPrice('gpl');
      return getFuelPrice('gasoil');
    },
    [getFuelPrice]
  );

  useEffect(() => {
    let isCancelled = false;
    const session = AuthClient.getSession();
    setSessionToken(session.token);

    if (isDemoMode) {
      (async () => {
        try {
          const { getSimulationAssets, getSimulationReceipts } = await import(
            '@/lib/simulation-sandbox'
          );
          const [sandboxAssets, sandboxReceipts] = await Promise.all([
            getSimulationAssets(),
            getSimulationReceipts(),
          ]);
          if (!isCancelled) {
            setAssets(sandboxAssets);
            setRecentReceipts(sandboxReceipts);
            if (sandboxReceipts.length > 0) {
              setCurrentResult(sandboxReceipts[0]);
            }
            if (sandboxAssets.length > 0) {
              setSelectedAssetId(sandboxAssets[0].id);
            }
          }
        } catch {
          if (!isCancelled) {
            setAssets([]);
            setRecentReceipts([]);
          }
        }
      })();
    } else if (session.token) {
      AssetClient.listAssets(session.token)
        .then((data) => {
          if (!isCancelled) {
            setAssets(data);
            if (data.length > 0) {
              setSelectedAssetId(data[0].id);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const scanReceipt = async (
    rawText: string,
    litersOverride: number,
    stationOverride: string,
    fuelTypeOverride: StandardFuelType
  ): Promise<boolean> => {
    if (!selectedAssetId) {
      notification.notifyWarning('Veuillez sélectionner un actif de la flotte.');
      return false;
    }

    setIsScanning(true);
    try {
      const unitPrice = resolvePrice(fuelTypeOverride);

      if (isDemoMode) {
        const matchedAsset = assets.find((a) => a.id === selectedAssetId);
        const isAnomaly = rawText.toLowerCase().includes('blida') || litersOverride > 80;
        const simulated: FuelReceiptScanResult = {
          receiptId: `rcpt-sim-${Date.now().toString().slice(-4)}`,
          assetId: selectedAssetId,
          assetName: matchedAsset ? `${matchedAsset.code} — ${matchedAsset.name}` : 'Véhicule Flotte',
          assetCode: matchedAsset ? matchedAsset.code : 'DZ-SIM',
          stationName: stationOverride,
          stationWilaya: '16',
          liters: litersOverride,
          totalAmountDzd: Math.round(litersOverride * unitPrice * 100) / 100,
          fuelType: fuelTypeOverride,
          unitPriceDzd: unitPrice,
          dateTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          receiptConfidence: 0.96,
          status: isAnomaly ? 'REJECTED' : 'APPROVED',
          reconciliation: {
            reconciliationStatus: isAnomaly ? 'POTENTIAL_FRAUD' : 'VERIFIED',
            telematicsLevelDeltaLiters: isAnomaly ? litersOverride - 18.5 : litersOverride - 0.5,
            varianceLiters: isAnomaly ? 18.5 : 0.5,
            distanceToStationMeters: isAnomaly ? 340 : 45,
            isLocationVerified: !isAnomaly,
            tankLevelBeforeLiters: 90,
            tankLevelAfterLiters: 90 + (isAnomaly ? litersOverride - 18.5 : litersOverride - 0.5),
            confidenceScore: isAnomaly ? 62 : 98,
            fraudRiskProbability: isAnomaly ? 0.88 : 0.02,
            explanation: isAnomaly
              ? 'Alerte CUSUM : rupture de pente hydraulique détectée (écart de 18.5 L non réconcilié).'
              : 'Reçu réconcilié avec la jauge télématique à la station Naftal.',
          },
        };

        setCurrentResult(simulated);
        setRecentReceipts((prev) => [simulated, ...prev]);
        const msg = isAnomaly
          ? `Anomalie CUSUM détectée pour ${stationOverride} (écart de 18.5 L).`
          : `Reçu Naftal de ${litersOverride} L certifié conforme.`;
        if (isAnomaly) notification.notifyWarning(msg);
        else notification.notifySuccess(msg);
        return true;
      }

      if (!sessionToken) {
        notification.notifyError('Session expirée, veuillez vous reconnecter.');
        return false;
      }

      const res = await FuelScannerClient.scanReceipt(
        {
          assetId: selectedAssetId,
          receiptTextRaw: rawText,
          manualOverrides: {
            liters: litersOverride,
            unitPriceDzd: unitPrice,
            totalAmountDzd: Math.round(litersOverride * unitPrice * 100) / 100,
            stationName: stationOverride,
            fuelType: fuelTypeOverride,
          },
        },
        sessionToken
      );

      setCurrentResult(res);
      setRecentReceipts((prev) => [res, ...prev]);
      const isOk = res.reconciliation.reconciliationStatus === 'VERIFIED';
      if (isOk) {
        notification.notifySuccess(`Reçu Naftal certifié conforme (jauge télématique validée).`);
      } else {
        notification.notifyWarning(`Anomalie détectée : ${res.reconciliation.explanation || 'Écart de jauge'}.`);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l’analyse du reçu Naftal.';
      notification.notifyError(msg);
      return false;
    } finally {
      setIsScanning(false);
    }
  };

  const createManualReceipt = (data: ManualReceiptFormData) => {
    const matchedAsset = assets.find((a) => a.id === data.assetId);
    const unitPrice = resolvePrice(data.fuelType);
    const newReceipt: FuelReceiptScanResult = {
      receiptId: `rcpt-manual-${Date.now().toString().slice(-4)}`,
      assetId: data.assetId,
      assetName: matchedAsset ? `${matchedAsset.code} — ${matchedAsset.name}` : 'Actif Manuel',
      assetCode: matchedAsset ? matchedAsset.code : 'DZ-MANUAL',
      stationName: data.stationName,
      stationWilaya: '16',
      liters: Number(data.liters),
      totalAmountDzd: Number(data.totalAmountDzd),
      fuelType: data.fuelType,
      unitPriceDzd: unitPrice,
      dateTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      receiptConfidence: 1.0,
      status: 'APPROVED',
      reconciliation: {
        reconciliationStatus: 'VERIFIED',
        telematicsLevelDeltaLiters: Number(data.liters) - 0.5,
        varianceLiters: 0.5,
        distanceToStationMeters: 42,
        isLocationVerified: true,
        tankLevelBeforeLiters: 85,
        tankLevelAfterLiters: 85 + Number(data.liters) - 0.5,
        confidenceScore: 98,
        fraudRiskProbability: 0.01,
        explanation: 'Plein saisi manuellement et certifié conforme au niveau de réservoir télématique.',
      },
    };

    setRecentReceipts((prev) => [newReceipt, ...prev]);
    setCurrentResult(newReceipt);
    notification.notifySuccess(`Plein de ${newReceipt.liters} L à ${newReceipt.stationName} enregistré.`);
  };

  const updateReceipt = (id: string, data: EditReceiptFormData) => {
    setRecentReceipts((prev) =>
      prev.map((r) =>
        r.receiptId === id
          ? {
              ...r,
              stationName: data.stationName,
              liters: Number(data.liters),
              totalAmountDzd: Number(data.totalAmountDzd),
            }
          : r
      )
    );
    if (currentResult && currentResult.receiptId === id) {
      setCurrentResult({
        ...currentResult,
        stationName: data.stationName,
        liters: Number(data.liters),
        totalAmountDzd: Number(data.totalAmountDzd),
      });
    }
    notification.notifySuccess(`Reçu Naftal de ${data.stationName} mis à jour.`);
  };

  const deleteReceipt = (id: string, label: string) => {
    setRecentReceipts((prev) => prev.filter((r) => r.receiptId !== id));
    if (currentResult && currentResult.receiptId === id) {
      setCurrentResult(null);
    }
    notification.notifySuccess(`Reçu « ${label} » supprimé.`);
  };

  return {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    recentReceipts,
    currentResult,
    setCurrentResult,
    isScanning,
    notification,
    resolvePrice,
    scanReceipt,
    createManualReceipt,
    updateReceipt,
    deleteReceipt,
  };
}

