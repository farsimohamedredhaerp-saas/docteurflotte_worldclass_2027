import {
  TmdDriverCertification,
  CreateTmdDriverCertificationDto,
  FuelTankerCompartment,
  CreateFuelTankerCompartmentDto,
  UpdateCompartmentTelemetryDto,
  TmdTransportMission,
  CreateTmdTransportMissionDto,
  HazardClass,
  TankerProductType,
  ValveStatus,
  TmdMissionStatus,
} from '@docteurflotte/contracts';

export { HazardClass, TankerProductType, ValveStatus, TmdMissionStatus };
export type {
  TmdDriverCertification,
  CreateTmdDriverCertificationDto,
  FuelTankerCompartment,
  CreateFuelTankerCompartmentDto,
  UpdateCompartmentTelemetryDto,
  TmdTransportMission,
  CreateTmdTransportMissionDto,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class TmdClient {
  static async listDrivers(token?: string): Promise<TmdDriverCertification[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/v1/tmd/drivers`, {
        method: 'GET',
        headers,
      });
      if (res.ok) return await res.json();
    } catch {
      // Repli gracieux
    }
    return [];
  }

  static async createDriver(dto: CreateTmdDriverCertificationDto, token: string): Promise<TmdDriverCertification> {
    const res = await fetch(`${API_BASE_URL}/api/v1/tmd/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement de l’habilitation TMD.');
    }
    return res.json();
  }

  static async listCompartments(assetId?: string, token?: string): Promise<FuelTankerCompartment[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = new URL(`${API_BASE_URL}/api/v1/tmd/compartments`);
      if (assetId) url.searchParams.set('assetId', assetId);

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

  static async createCompartment(dto: CreateFuelTankerCompartmentDto, token: string): Promise<FuelTankerCompartment> {
    const res = await fetch(`${API_BASE_URL}/api/v1/tmd/compartments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création du compartiment citerne.');
    }
    return res.json();
  }

  static async updateCompartmentTelemetry(
    dto: UpdateCompartmentTelemetryDto,
    token: string,
  ): Promise<FuelTankerCompartment> {
    const res = await fetch(`${API_BASE_URL}/api/v1/tmd/compartments/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de mise à jour télémétrie citerne.');
    }
    return res.json();
  }

  static async listMissions(
    params?: { assetId?: string; status?: TmdMissionStatus },
    token?: string,
  ): Promise<TmdTransportMission[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = new URL(`${API_BASE_URL}/api/v1/tmd/missions`);
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

  static async createMission(dto: CreateTmdTransportMissionDto, token: string): Promise<TmdTransportMission> {
    const res = await fetch(`${API_BASE_URL}/api/v1/tmd/missions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création de la mission TMD.');
    }
    return res.json();
  }

  static async recordValveEvent(
    missionId: string,
    isWithinAuthorizedGeofence: boolean,
    token: string,
  ): Promise<TmdTransportMission> {
    const res = await fetch(`${API_BASE_URL}/api/v1/tmd/missions/${missionId}/valve-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isWithinAuthorizedGeofence }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement événement vanne dépotage.');
    }
    return res.json();
  }
}

