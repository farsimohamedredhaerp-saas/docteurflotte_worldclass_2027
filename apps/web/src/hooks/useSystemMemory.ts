'use client';

import { useState, useEffect } from 'react';
import { SystemMemoryMetrics } from '@docteurflotte/contracts';

export interface MemoryTelemetry {
  systemRam: {
    totalGb: number;
    freeGb: number;
    usedGb: number;
    pct: number;
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    isSaturated: boolean;
  };
  browserHeap: {
    usedMb: number;
    totalMb: number;
    limitMb: number;
    pct: number;
  } | null;
  processWorkingSetMb?: number;
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSystemMemory(pollIntervalMs = 4000): MemoryTelemetry {
  const [telemetry, setTelemetry] = useState<MemoryTelemetry>(() => {
    return {
      systemRam: {
        totalGb: 8.0,
        freeGb: 0.8,
        usedGb: 7.2,
        pct: 90.0,
        status: 'CRITICAL',
        isSaturated: true,
      },
      browserHeap: null,
      timestamp: new Date().toISOString(),
    };
  });

  useEffect(() => {
    let isMounted = true;

    const checkMemory = async () => {
      // 1. Détection locale de l'empreinte mémoire JavaScript (Chromium Performance Memory API)
      let browserHeap: MemoryTelemetry['browserHeap'] = null;
      if (typeof window !== 'undefined' && (window.performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory) {
        const perfMem = (window.performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        const usedMb = Math.round(perfMem.usedJSHeapSize / (1024 * 1024));
        const totalMb = Math.round(perfMem.totalJSHeapSize / (1024 * 1024));
        const limitMb = Math.round(perfMem.jsHeapSizeLimit / (1024 * 1024));
        browserHeap = {
          usedMb,
          totalMb,
          limitMb,
          pct: Math.round((usedMb / limitMb) * 100),
        };
      }

      // 2. Télémétrie en temps réel de la RAM système hôte via l'API NestJS
      try {
        const res = await fetch(`${API_BASE_URL}/health/memory`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data: SystemMemoryMetrics = await res.json();
          if (isMounted) {
            setTelemetry({
              systemRam: {
                totalGb: Math.round((data.totalRamMb / 1024) * 10) / 10,
                freeGb: Math.round((data.freeRamMb / 1024) * 10) / 10,
                usedGb: Math.round((data.usedRamMb / 1024) * 10) / 10,
                pct: data.ramUsagePercent,
                status: data.status,
                isSaturated: data.isSaturated,
              },
              browserHeap,
              processWorkingSetMb: data.processWorkingSetMb,
              timestamp: data.timestamp,
            });
            return;
          }
        }
      } catch {
        // En cas d'API non joignable temporairement, mise à jour du heap navigateur seul
      }

      if (isMounted && browserHeap) {
        setTelemetry((prev) => ({
          ...prev,
          browserHeap,
          timestamp: new Date().toISOString(),
        }));
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, pollIntervalMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return telemetry;
}

