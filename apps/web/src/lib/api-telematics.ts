import {
  AssetDeviceBinding,
  BindDeviceDto,
  FleetLiveAsset,
  RegisterDeviceDto,
  TelematicsDevice,
  TraccarGatewayHealth,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class TelematicsClient {
  static async listDevices(token: string): Promise<TelematicsDevice[]> {
    const res = await fetch(`${API_BASE_URL}/telematics/devices`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erreur lors de la récupération des boîtiers GPS (${res.status})`);
    }
    return res.json();
  }

  static async registerDevice(dto: RegisterDeviceDto, token: string): Promise<TelematicsDevice> {
    const res = await fetch(`${API_BASE_URL}/telematics/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Échec de l'enregistrement du boîtier (${res.status})`);
    }
    return res.json();
  }

  static async listBindings(token: string): Promise<AssetDeviceBinding[]> {
    const res = await fetch(`${API_BASE_URL}/telematics/bindings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erreur lors de la récupération des appairages (${res.status})`);
    }
    return res.json();
  }

  static async bindDevice(dto: BindDeviceDto, token: string): Promise<AssetDeviceBinding> {
    const res = await fetch(`${API_BASE_URL}/telematics/bindings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Échec de l'appairage (${res.status})`);
    }
    return res.json();
  }

  static async unbindDevice(bindingId: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/telematics/bindings/${bindingId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Échec du désappairage (${res.status})`);
    }
  }

  static async getFleetLive(token: string): Promise<FleetLiveAsset[]> {
    const res = await fetch(`${API_BASE_URL}/telematics/fleet-live`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erreur lors de la récupération du flux Fleet Live (${res.status})`);
    }
    return res.json();
  }

  static async getHealth(token: string): Promise<TraccarGatewayHealth> {
    const res = await fetch(`${API_BASE_URL}/telematics/health`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erreur lors du contrôle de santé de la passerelle (${res.status})`);
    }
    return res.json();
  }
}
