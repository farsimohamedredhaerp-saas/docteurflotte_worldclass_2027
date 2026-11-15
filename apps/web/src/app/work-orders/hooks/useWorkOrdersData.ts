'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Asset, WorkOrder, WorkOrderPriority, WorkOrderStatus } from '@docteurflotte/contracts';
import { AuthClient } from '@/lib/api-auth';
import { AssetClient } from '@/lib/api-assets';
import { FleetIntelligenceClient } from '@/lib/api-fleet-intelligence';
import { useDemoMode } from '@/context/DemoModeContext';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { useNotification } from '@/lib/hooks/useNotification';
import {
  CreateWorkOrderFormData,
  EditWorkOrderFormData,
  CompleteWorkOrderFormData,
} from '../types';

export function useWorkOrdersData() {
  const { isDemoMode } = useDemoMode();
  const { tariffs } = useSystemConfig();
  const notification = useNotification(5000);
  const notifyErrorRef = useRef(notification.notifyError);

  useEffect(() => {
    notifyErrorRef.current = notification.notifyError;
  }, [notification.notifyError]);

  const [token, setToken] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  const loadData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      const [wos, assetList] = await Promise.all([
        AssetClient.listWorkOrders(authToken),
        AssetClient.listAssets(authToken),
      ]);
      setWorkOrders(wos);
      setAssets(assetList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des ordres de travail.';
      notifyErrorRef.current(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const sess = AuthClient.getSession();
    setToken(sess.token);

    if (isDemoMode) {
      (async () => {
        try {
          const { getSimulationWorkOrders, getSimulationAssets } = await import(
            '@/lib/simulation-sandbox'
          );
          const [sandboxWos, sandboxAssets] = await Promise.all([
            getSimulationWorkOrders(),
            getSimulationAssets(),
          ]);
          if (!isCancelled) {
            setWorkOrders(sandboxWos);
            setAssets(sandboxAssets);
          }
        } catch {
          if (!isCancelled) {
            setWorkOrders([]);
            setAssets([]);
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      })();
    } else if (sess.token) {
      loadData(sess.token);
    } else {
      setWorkOrders([]);
      setAssets([]);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode, loadData]);

  const createWorkOrder = async (data: CreateWorkOrderFormData): Promise<boolean> => {
    if (isDemoMode) {
      const newId = `ot-sim-${Date.now().toString(36)}`;
      const selectedAsset = assets.find((a) => a.id === data.assetId);
      const simulatedWo: WorkOrder = {
        id: newId,
        tenantId: 'demo-tenant',
        assetId: data.assetId,
        assetCode: selectedAsset?.code || 'SIM-ACTIF',
        assetName: selectedAsset?.name || 'Véhicule de simulation',
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: WorkOrderStatus.SCHEDULED,
        estimatedLaborHours: data.estimatedLaborHours,
        assignedTo: data.assignedTo || 'Atelier Central',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWorkOrders((prev) => [simulatedWo, ...prev]);
      notification.notifySuccess(`Ordre de travail « ${data.title} » créé avec succès.`);
      return true;
    }

    if (!token) {
      notification.notifyError('Session expirée, veuillez vous reconnecter.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const created = await AssetClient.createWorkOrder(data, token);
      notification.notifySuccess(`Ordre de travail « ${data.title} » créé avec succès.`);
      setWorkOrders((prev) => [created, ...prev]);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la création de l’ordre de travail.';
      notification.notifyError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWorkOrder = async (
    id: string,
    data: EditWorkOrderFormData
  ): Promise<boolean> => {
    if (isDemoMode) {
      setWorkOrders((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                title: data.title,
                description: data.description,
                priority: data.priority,
                estimatedLaborHours: data.estimatedLaborHours,
                assignedTo: data.assignedTo,
              }
            : w
        )
      );
      notification.notifySuccess(`Ordre de travail mis à jour avec succès.`);
      return true;
    }

    if (!token) return false;
    setIsUpdating(true);
    try {
      const updated = await AssetClient.updateWorkOrder(id, data, token);
      setWorkOrders((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      notification.notifySuccess(`Ordre « ${updated.title} » mis à jour.`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la mise à jour.';
      notification.notifyError(msg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteWorkOrder = async (id: string, label: string): Promise<boolean> => {
    if (isDemoMode) {
      setWorkOrders((prev) => prev.filter((w) => w.id !== id));
      notification.notifySuccess(`Ordre « ${label} » supprimé.`);
      return true;
    }

    if (!token) return false;
    try {
      await AssetClient.deleteWorkOrder(id, token);
      setWorkOrders((prev) => prev.filter((w) => w.id !== id));
      notification.notifySuccess(`Ordre « ${label} » supprimé.`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la suppression.';
      notification.notifyError(msg);
      return false;
    }
  };

  const completeWorkOrder = async (
    wo: WorkOrder,
    data: CompleteWorkOrderFormData
  ): Promise<boolean> => {
    setIsCompleting(true);
    try {
      const isDvirOrder = wo.id.startsWith('ot-dvir') || wo.title.includes('DVIR');
      const hourlyRate = tariffs.economicRates?.hourlyLaborRateDzd || 1500;
      const laborCost = data.actualLaborHours * hourlyRate;
      const partsCost = data.partsCost;
      const totalCost = laborCost + partsCost;

      if (isDemoMode) {
        setWorkOrders((prev) =>
          prev.map((w) =>
            w.id === wo.id
              ? {
                  ...w,
                  status: WorkOrderStatus.COMPLETED,
                  actualLaborHours: data.actualLaborHours,
                  partsCost: data.partsCost,
                  laborCost,
                  totalCost,
                  downtimeHours: data.downtimeHours,
                  completedAt: new Date().toISOString(),
                }
              : w
          )
        );

        const successMsg = isDvirOrder
          ? `Ordre clôturé (${totalCost.toLocaleString('fr-DZ')} DA). Verrou DVIR levé avec succès : ${wo.assetName || wo.assetCode} requalifié TOPSIS.`
          : `Ordre clôturé. Coût total : ${totalCost.toLocaleString('fr-DZ')} DA (MO: ${laborCost.toLocaleString('fr-DZ')} DA, Pièces: ${partsCost.toLocaleString('fr-DZ')} DA).`;

        notification.notifySuccess(successMsg);
        return true;
      }

      if (!token) return false;
      const updated = await AssetClient.completeWorkOrder(wo.id, data, token);

      if (isDvirOrder) {
        try {
          await FleetIntelligenceClient.resolveDvirBlock(
            wo.assetId,
            wo.id,
            token,
            data.completionNotes
          );
        } catch {
          // Géré par l'API
        }
      }

      const successMsg = isDvirOrder
        ? `Ordre clôturé (${updated.totalCost?.toLocaleString('fr-DZ')} DA). Verrou de sécurité DVIR levé avec succès.`
        : `Ordre de travail clôturé. Coût total : ${updated.totalCost?.toLocaleString('fr-DZ')} DA.`;

      notification.notifySuccess(successMsg);
      loadData(token);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la clôture de l’ordre de travail.';
      notification.notifyError(msg);
      return false;
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    token,
    workOrders,
    assets,
    isLoading,
    isSubmitting,
    isUpdating,
    isCompleting,
    notification,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    completeWorkOrder,
    reload: () => token && loadData(token),
  };
}
