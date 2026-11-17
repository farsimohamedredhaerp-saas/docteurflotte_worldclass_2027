import {
  MiningSite,
  CreateMiningSiteDto,
  OtrTire,
  CreateOtrTireDto,
  UpdateOtrTireTelemetryDto,
  DumperHaulingCycle,
  RecordHaulingCycleDto,
  MiningSiteType,
  OtrTirePosition,
  OtrTireStatus,
} from '@docteurflotte/contracts';

export { MiningSiteType, OtrTirePosition, OtrTireStatus };
export type {
  MiningSite,
  CreateMiningSiteDto,
  OtrTire,
  CreateOtrTireDto,
  UpdateOtrTireTelemetryDto,
  DumperHaulingCycle,
  RecordHaulingCycleDto,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class MiningClient {
  static async listSites(token?: string): Promise<MiningSite[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/mining/sites`, {
        method: 'GET',
        headers,
      });
      if (res.ok) return await res.json();
    } catch {
      // Repli gracieux
    }
    return [];
  }

  static async createSite(dto: CreateMiningSiteDto, token: string): Promise<MiningSite> {
    const res = await fetch(`${API_BASE_URL}/api/v1/mining/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création du site minier.');
    }
    return res.json();
  }

  static async listTires(
    params?: { assetId?: string; status?: OtrTireStatus },
    token?: string,
  ): Promise<OtrTire[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = new URL(`${API_BASE_URL}/api/v1/mining/tires`);
      if (params?.assetId) url.searchParams.set('assetId', params.assetId);
      if (params?.status) url.searchParams.set('status', params.status);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });
      if (res.ok) return await res.json();
    } catch {
      // Repli gracieux
    }
    return [];
  }

  static async createTire(dto: CreateOtrTireDto, token: string): Promise<OtrTire> {
    const res = await fetch(`${API_BASE_URL}/api/v1/mining/tires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement du pneu OTR.');
    }
    return res.json();
  }

  static async updateTireTelemetry(
    dto: UpdateOtrTireTelemetryDto,
    token: string,
  ): Promise<OtrTire> {
    const res = await fetch(`${API_BASE_URL}/api/v1/mining/tires/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de mise à jour télémétrie pneu OTR.');
    }
    return res.json();
  }

  static async listCycles(
    params?: { siteId?: string; assetId?: string; limit?: number },
    token?: string,
  ): Promise<DumperHaulingCycle[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = new URL(`${API_BASE_URL}/api/v1/mining/cycles`);
      if (params?.siteId) url.searchParams.set('siteId', params.siteId);
      if (params?.assetId) url.searchParams.set('assetId', params.assetId);
      if (params?.limit) url.searchParams.set('limit', String(params.limit));

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });
      if (res.ok) return await res.json();
    } catch {
      // Repli gracieux
    }
    return [];
  }

  static async recordCycle(
    dto: RecordHaulingCycleDto,
    token: string,
  ): Promise<DumperHaulingCycle> {
    const res = await fetch(`${API_BASE_URL}/api/v1/mining/cycles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement du cycle de roulage dumper.');
    }
    return res.json();
  }
}
