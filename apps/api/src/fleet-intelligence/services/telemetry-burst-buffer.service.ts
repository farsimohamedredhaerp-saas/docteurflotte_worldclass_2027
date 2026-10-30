import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  CanonicalTelemetryEvent,
  TelematicsConnectivityStatus,
} from '../dto/telemetry-ingestion.dto';
import { TelemetryStorageService } from './telemetry-storage.service';

export interface BurstProcessingSummary {
  totalReceived: number;
  deduplicatedCount: number;
  chronologicallySorted: boolean;
  oldestPacketTimestamp: string;
  newestPacketTimestamp: string;
  batchCount: number;
  lastKnownStateUpdated: boolean;
  connectivityStatus: TelematicsConnectivityStatus;
}

export const SAHARA_DARK_ZONE_WILAYAS = new Set([
  '01', // Adrar
  '11', // Tamanrasset
  '33', // Illizi
  '37', // Tindouf
  '49', // Timimoun
  '50', // Bordj Badji Mokhtar
  '52', // Béni Abbès
  '53', // In Salah
  '54', // In Guezzam
  '56', // Djanet
]);

@Injectable()
export class TelemetryBurstBufferService {
  private readonly logger = new Logger(TelemetryBurstBufferService.name);

  constructor(@Optional() private readonly storageService?: TelemetryStorageService) {}

  evaluateConnectivityStatus(
    event: CanonicalTelemetryEvent,
    now: Date = new Date(),
    wilayaCode?: string,
    hasActiveMission: boolean = false,
  ): TelematicsConnectivityStatus {
    const eventDate = new Date(event.time);
    const elapsedSeconds = Math.max(0, (now.getTime() - eventDate.getTime()) / 1000);

    if (
      event.batteryMv !== null &&
      event.batteryMv !== undefined &&
      event.batteryMv > 0 &&
      event.batteryMv < 8000 &&
      event.ignitionOn
    ) {
      return TelematicsConnectivityStatus.TAMPER_SUSPECTED;
    }

    if (elapsedSeconds <= 120) {
      if (
        event.speedKmh > 2.5 ||
        (event.engineRpm !== null && event.engineRpm > 600 && event.speedKmh > 2)
      ) {
        return TelematicsConnectivityStatus.ONLINE;
      }
      if (event.ignitionOn || (event.engineRpm !== null && event.engineRpm >= 400)) {
        return TelematicsConnectivityStatus.IDLE;
      }
      return TelematicsConnectivityStatus.ONLINE;
    }

    if (elapsedSeconds > 300) {
      const isSaharaWilaya = wilayaCode ? SAHARA_DARK_ZONE_WILAYAS.has(wilayaCode) : false;
      const isSaharaCoordinates = event.latitude < 32.0;

      if ((isSaharaWilaya || isSaharaCoordinates) && hasActiveMission) {
        return TelematicsConnectivityStatus.OFFLINE_DARK_ZONE;
      }
    }

    return TelematicsConnectivityStatus.OFFLINE;
  }

  async processStoreAndForwardBurst(
    events: CanonicalTelemetryEvent[],
    cachedLastSeenIso?: string,
  ): Promise<BurstProcessingSummary> {
    if (!events || events.length === 0) {
      return {
        totalReceived: 0,
        deduplicatedCount: 0,
        chronologicallySorted: true,
        oldestPacketTimestamp: '',
        newestPacketTimestamp: '',
        batchCount: 0,
        lastKnownStateUpdated: false,
        connectivityStatus: TelematicsConnectivityStatus.OFFLINE,
      };
    }

    const totalReceived = events.length;

    // 1. Dédoublonnage Idempotent
    const seenMap = new Map<string, CanonicalTelemetryEvent>();
    for (const evt of events) {
      const dedupKey = `${evt.vehicleId}:${evt.time}`;
      if (!seenMap.has(dedupKey)) {
        seenMap.set(dedupKey, evt);
      }
    }
    const deduplicatedEvents = Array.from(seenMap.values());
    const deduplicatedCount = deduplicatedEvents.length;

    // 2. Tri chronologique ascendant par device_timestamp
    deduplicatedEvents.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );

    const oldestPacket = deduplicatedEvents[0];
    const newestPacket = deduplicatedEvents[deduplicatedEvents.length - 1];

    // 3. Batching réel (lots de 500 max via persistCanonicalEventBatch)
    const BATCH_SIZE = 500;
    const batches: CanonicalTelemetryEvent[][] = [];
    for (let i = 0; i < deduplicatedEvents.length; i += BATCH_SIZE) {
      batches.push(deduplicatedEvents.slice(i, i + BATCH_SIZE));
    }

    if (this.storageService) {
      for (const batch of batches) {
        if (typeof (this.storageService as any).persistCanonicalEventBatch === 'function') {
          await this.storageService.persistCanonicalEventBatch(batch);
        } else {
          for (const evt of batch) {
            await this.storageService.persistCanonicalEvent(evt);
          }
        }
      }
    }

    // 4. Protection Anti-Régression du Last Known State
    let lastKnownStateUpdated = false;
    if (cachedLastSeenIso) {
      const cachedTime = new Date(cachedLastSeenIso).getTime();
      const newestTime = new Date(newestPacket.time).getTime();
      lastKnownStateUpdated = newestTime > cachedTime;
    } else {
      lastKnownStateUpdated = true;
    }

    const connectivityStatus = this.evaluateConnectivityStatus(newestPacket);

    return {
      totalReceived,
      deduplicatedCount,
      chronologicallySorted: true,
      oldestPacketTimestamp: oldestPacket.time,
      newestPacketTimestamp: newestPacket.time,
      batchCount: batches.length,
      lastKnownStateUpdated,
      connectivityStatus,
    };
  }
}
