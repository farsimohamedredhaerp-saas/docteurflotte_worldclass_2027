/**
 * Module de Persistance Locale IndexedDB pour PWA Offline-First
 * Conforme Loi 18-07 (ANPDP) : Stockage 100% local sur le terminal, tolérance aux zones blanches sahariennes.
 */

export interface OfflineDvirChecklistItem {
  code: string;
  label: string;
  category: string;
  status: string;
  comment?: string;
  photoUrl?: string;
}

export interface OfflineDvirRecord {
  id: string;
  tenantId?: string;
  assetId: string;
  assetPlate: string;
  driverId: string;
  driverName: string;
  inspectionType: 'PRE_TRIP' | 'POST_TRIP';
  odometerKm: number;
  engineHours?: number;
  wilayaCode?: number;
  items: OfflineDvirChecklistItem[];
  photosBase64?: string[];
  signatureBase64?: string;
  deviceTimestamp: string;
  syncStatus: 'PENDING_OFFLINE' | 'SYNCING' | 'SYNCED' | 'FAILED';
  createdAt: string;
  syncedAt?: string;
  syncError?: string;
}

const DB_NAME = 'docteurflotte_pwa_offline';
const DB_VERSION = 1;
const STORE_NAME = 'dvir_inspections';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non disponible dans cet environnement'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('deviceTimestamp', 'deviceTimestamp', { unique: false });
        store.createIndex('assetId', 'assetId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enregistre une inspection DVIR dans la file d attente locale IndexedDB en mode hors-ligne
 */
export async function saveDvirOffline(
  data: Omit<OfflineDvirRecord, 'id' | 'syncStatus' | 'createdAt'>,
): Promise<OfflineDvirRecord> {
  const db = await openDatabase();
  const id = `dvir-offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const record: OfflineDvirRecord = {
    ...data,
    id,
    syncStatus: 'PENDING_OFFLINE',
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Récupère toutes les inspections DVIR en attente de synchronisation réseau
 */
export async function getPendingOfflineInspections(): Promise<OfflineDvirRecord[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('syncStatus');
    const request = index.getAll('PENDING_OFFLINE');

    request.onsuccess = () => {
      const records = (request.result as OfflineDvirRecord[]) || [];
      // Tri chronologique strict par horodatage matériel (deviceTimestamp)
      records.sort((a, b) => new Date(a.deviceTimestamp).getTime() - new Date(b.deviceTimestamp).getTime());
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Récupère toutes les inspections locales enregistrées
 */
export async function getAllOfflineInspections(): Promise<OfflineDvirRecord[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = (request.result as OfflineDvirRecord[]) || [];
      records.sort((a, b) => new Date(b.deviceTimestamp).getTime() - new Date(a.deviceTimestamp).getTime());
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Marque une inspection comme synchronisée avec le serveur
 */
export async function markDvirSynced(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as OfflineDvirRecord;
      if (!record) {
        resolve();
        return;
      }
      record.syncStatus = 'SYNCED';
      record.syncedAt = new Date().toISOString();
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Supprime une inspection locale
 */
export async function deleteOfflineDvir(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Statistiques de la file d attente hors-ligne
 */
export async function getOfflineQueueStats(): Promise<{ pending: number; synced: number; total: number }> {
  try {
    const all = await getAllOfflineInspections();
    const pending = all.filter((r) => r.syncStatus === 'PENDING_OFFLINE').length;
    const synced = all.filter((r) => r.syncStatus === 'SYNCED').length;
    return { pending, synced, total: all.length };
  } catch {
    return { pending: 0, synced: 0, total: 0 };
  }
}
