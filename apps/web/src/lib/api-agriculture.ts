import {
  FarmProperty,
  CreateFarmPropertyDto,
  IrrigationPivot,
  CreateIrrigationPivotDto,
  IrrigationTelemetryLog,
  RecordIrrigationTelemetryDto,
  HarvestCampaignLog,
  RecordHarvestCampaignDto,
  CropType,
  PivotStatus,
  AgriculturalTaskType,
} from '@docteurflotte/contracts';

export { CropType, PivotStatus, AgriculturalTaskType };
export type {
  FarmProperty,
  CreateFarmPropertyDto,
  IrrigationPivot,
  CreateIrrigationPivotDto,
  IrrigationTelemetryLog,
  RecordIrrigationTelemetryDto,
  HarvestCampaignLog,
  RecordHarvestCampaignDto,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class AgricultureClient {
  static async listFarms(token?: string): Promise<FarmProperty[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/agriculture/farms`, {
        method: 'GET',
        headers,
      });
      if (res.ok) return await res.json();
    } catch {
      // Repli gracieux
    }
    return [];
  }

  static async createFarm(dto: CreateFarmPropertyDto, token: string): Promise<FarmProperty> {
    const res = await fetch(`${API_BASE_URL}/api/v1/agriculture/farms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création du domaine agricole.');
    }
    return res.json();
  }

  static async listPivots(farmId?: string, token?: string): Promise<IrrigationPivot[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = new URL(`${API_BASE_URL}/api/v1/agriculture/pivots`);
      if (farmId) url.searchParams.set('farmId', farmId);

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

  static async createPivot(dto: CreateIrrigationPivotDto, token: string): Promise<IrrigationPivot> {
    const res = await fetch(`${API_BASE_URL}/api/v1/agriculture/pivots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création du pivot d’irrigation.');
    }
    return res.json();
  }

  static async recordPivotTelemetry(
    dto: RecordIrrigationTelemetryDto,
    token: string,
  ): Promise<IrrigationTelemetryLog> {
    const res = await fetch(`${API_BASE_URL}/api/v1/agriculture/pivots/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement télémétrie pivot.');
    }
    return res.json();
  }

  static async listPivotTelemetry(
    pivotId: string,
    token?: string,
    limit = 50,
  ): Promise<IrrigationTelemetryLog[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/agriculture/pivots/${pivotId}/telemetry?limit=${limit}`, {
        method: 'GET',
        headers,
      });
      if (res.ok) return await res.json();
    } catch {
      // Repli gracieux
    }
    return [];
  }

  static async listHarvestLogs(
    params?: { farmId?: string; year?: number },
    token?: string,
  ): Promise<HarvestCampaignLog[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = new URL(`${API_BASE_URL}/api/v1/agriculture/harvest`);
      if (params?.farmId) url.searchParams.set('farmId', params.farmId);
      if (params?.year) url.searchParams.set('year', String(params.year));

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

  static async recordHarvest(
    dto: RecordHarvestCampaignDto,
    token: string,
  ): Promise<HarvestCampaignLog> {
    const res = await fetch(`${API_BASE_URL}/api/v1/agriculture/harvest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement moisson-battage.');
    }
    return res.json();
  }
}
