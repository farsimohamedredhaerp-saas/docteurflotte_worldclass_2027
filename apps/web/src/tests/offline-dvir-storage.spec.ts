import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveDvirOffline,
  getPendingOfflineInspections,
  markDvirSynced,
  deleteOfflineDvir,
  getOfflineQueueStats,
  OfflineDvirRecord,
} from '../lib/offline-dvir-storage';

describe('offline-dvir-storage (PWA Offline-First IndexedDB)', () => {
  let mockStore: Map<string, OfflineDvirRecord>;

  beforeEach(() => {
    mockStore = new Map();

    const mockIDBDatabase = {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn((record: OfflineDvirRecord) => {
            mockStore.set(record.id, record);
            const req = { onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess?.({ target: { result: record.id } }), 0);
            return req;
          }),
          get: vi.fn((id: string) => {
            const req = { result: mockStore.get(id), onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess?.({ target: { result: req.result } }), 0);
            return req;
          }),
          getAll: vi.fn(() => {
            const req = { result: Array.from(mockStore.values()), onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess?.({ target: { result: req.result } }), 0);
            return req;
          }),
          delete: vi.fn((id: string) => {
            mockStore.delete(id);
            const req = { onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess?.({ target: { result: undefined } }), 0);
            return req;
          }),
          index: vi.fn(() => ({
            getAll: vi.fn((val: string) => {
              const matches = Array.from(mockStore.values()).filter((r) => r.syncStatus === val);
              const req = { result: matches, onsuccess: null as any, onerror: null as any };
              setTimeout(() => req.onsuccess?.({ target: { result: req.result } }), 0);
              return req;
            }),
          })),
        })),
      })),
      objectStoreNames: {
        contains: vi.fn(() => true),
      },
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).indexedDB = {
      open: vi.fn(() => {
        const req = {
          result: mockIDBDatabase,
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
        };
        setTimeout(() => req.onsuccess?.({ target: { result: mockIDBDatabase } }), 0);
        return req;
      }),
    };
  });

  it('doit enregistrer une fiche DVIR en mode hors-ligne avec statut PENDING_OFFLINE', async () => {
    const record = await saveDvirOffline({
      assetId: 'ast-shacman-01',
      assetPlate: '01-104-16',
      driverId: 'drv-01',
      driverName: 'Mourad Belkacem',
      inspectionType: 'PRE_TRIP',
      odometerKm: 185400,
      items: [
        {
          code: 'BRAKES',
          label: 'Freinage ENACTA',
          category: 'BRAKES',
          status: 'PASS',
        },
      ],
      deviceTimestamp: '2026-11-04T07:30:00Z',
    });

    expect(record.id).toMatch(/^dvir-offline-/);
    expect(record.syncStatus).toBe('PENDING_OFFLINE');
    expect(record.assetPlate).toBe('01-104-16');

    const pending = await getPendingOfflineInspections();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(record.id);
  });

  it('doit marquer une fiche comme SYNCED après confirmation réseau', async () => {
    const record = await saveDvirOffline({
      assetId: 'ast-kerax-02',
      assetPlate: '16-118-09',
      driverId: 'drv-02',
      driverName: 'Karim Hadj',
      inspectionType: 'POST_TRIP',
      odometerKm: 210500,
      items: [],
      deviceTimestamp: '2026-11-04T18:00:00Z',
    });

    await markDvirSynced(record.id);

    const pending = await getPendingOfflineInspections();
    expect(pending).toHaveLength(0);

    const stats = await getOfflineQueueStats();
    expect(stats.synced).toBe(1);
    expect(stats.pending).toBe(0);
  });

  it('doit supprimer une inspection locale de la base IndexedDB', async () => {
    const record = await saveDvirOffline({
      assetId: 'ast-test-03',
      assetPlate: '31-200-14',
      driverId: 'drv-03',
      driverName: 'Samir Mécanicien',
      inspectionType: 'PRE_TRIP',
      odometerKm: 95000,
      items: [],
      deviceTimestamp: '2026-11-04T08:00:00Z',
    });

    await deleteOfflineDvir(record.id);
    const stats = await getOfflineQueueStats();
    expect(stats.total).toBe(0);
  });
});
