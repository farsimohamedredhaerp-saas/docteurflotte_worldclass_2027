'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  saveDvirOffline,
  getPendingOfflineInspections,
  markDvirSynced,
  getOfflineQueueStats,
  OfflineDvirRecord,
} from '../lib/offline-dvir-storage';

export function useOfflineDvir() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queueStats, setQueueStats] = useState<{ pending: number; synced: number; total: number }>({
    pending: 0,
    synced: 0,
    total: 0,
  });

  const refreshStats = useCallback(async () => {
    const stats = await getOfflineQueueStats();
    setQueueStats(stats);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      refreshStats();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshStats();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshStats]);

  const submitInspection = useCallback(
    async (
      data: Omit<OfflineDvirRecord, 'id' | 'syncStatus' | 'createdAt'>,
      apiSubmitFn?: (record: OfflineDvirRecord) => Promise<{ success: boolean; id?: string }>,
    ): Promise<{ record: OfflineDvirRecord; syncedDirectly: boolean }> => {
      // 1. Toujours enregistrer d abord dans IndexedDB (Garantie Offline-First)
      const record = await saveDvirOffline(data);
      await refreshStats();

      // 2. Si le terminal est en ligne et qu une fonction de soumission API est fournie, tenter l envoi direct
      if (navigator.onLine && apiSubmitFn) {
        try {
          const res = await apiSubmitFn(record);
          if (res.success) {
            await markDvirSynced(record.id);
            await refreshStats();
            return { record: { ...record, syncStatus: 'SYNCED' }, syncedDirectly: true };
          }
        } catch {
          // Échec réseau silencieux : la fiche reste dans IndexedDB avec statut PENDING_OFFLINE
        }
      }

      return { record, syncedDirectly: false };
    },
    [refreshStats],
  );

  const syncPendingQueue = useCallback(
    async (
      apiSubmitFn: (record: OfflineDvirRecord) => Promise<{ success: boolean }>,
    ): Promise<{ syncedCount: number; failedCount: number }> => {
      if (!navigator.onLine) {
        return { syncedCount: 0, failedCount: 0 };
      }

      setIsSyncing(true);
      const pending = await getPendingOfflineInspections();
      let syncedCount = 0;
      let failedCount = 0;

      for (const item of pending) {
        try {
          const res = await apiSubmitFn(item);
          if (res.success) {
            await markDvirSynced(item.id);
            syncedCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      await refreshStats();
      setIsSyncing(false);
      return { syncedCount, failedCount };
    },
    [refreshStats],
  );

  return {
    isOnline,
    isSyncing,
    queueStats,
    submitInspection,
    syncPendingQueue,
    refreshStats,
  };
}
