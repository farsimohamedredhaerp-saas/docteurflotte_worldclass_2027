import { PlatformHealthSummary } from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class PlatformHealthClient {
  static async getHealthSummary(): Promise<PlatformHealthSummary> {
    try {
      const res = await fetch(`${API_BASE_URL}/platform/health-summary`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch {
      // Fallback déterministe résilient si le backend démarre ou est temporairement inaccessible
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        telematics: {
          state: 'offline',
          latencyMs: null,
          checkedAt: new Date().toISOString(),
          details: 'Passerelle locale en attente',
          provider: 'TRACCAR_SELF_HOSTED',
          mode: 'OEM-First (0 / 1 / 2)',
          port: 5055,
        },
        ai: {
          state: 'offline',
          latencyMs: null,
          checkedAt: new Date().toISOString(),
          details: 'Mode Déterministe Actif (Arrhenius/Archard)',
          model: 'qwen2.5:1.5b-instruct',
          localSovereign: true,
        },
        security: {
          state: 'checking',
          latencyMs: null,
          checkedAt: new Date().toISOString(),
          details: 'Contrôles RLS en cours',
          rlsEnforced: true,
          sovereignHosting: true,
          complianceNote: 'Hébergement Souverain • Loi 18-07 (ANPDP)',
        },
      };
    }
  }
}

