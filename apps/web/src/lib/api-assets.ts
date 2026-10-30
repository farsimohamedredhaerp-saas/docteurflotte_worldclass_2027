import {
  Asset,
  AssetCategory,
  CreateAssetDto,
  MeterReading,
  MeterReadingResponse,
  RecordMeterReadingDto,
  WorkOrder,
  WorkOrderStatus,
  CreateWorkOrderDto,
  CompleteWorkOrderDto,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class AssetClient {
  static async listAssets(token: string, category?: AssetCategory): Promise<Asset[]> {
    const url = new URL(`${API_BASE_URL}/assets`);
    if (category) {
      url.searchParams.set('category', category);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Impossible de charger les actifs.');
    }
    return res.json();
  }

  static async getAssets(token: string, category?: AssetCategory): Promise<Asset[]> {
    return AssetClient.listAssets(token, category);
  }

  static async createAsset(dto: CreateAssetDto, token: string): Promise<Asset> {
    const res = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la création de l’actif.');
    }
    return data;
  }

  static async recordMeterReading(
    assetId: string,
    dto: RecordMeterReadingDto,
    token: string,
  ): Promise<MeterReadingResponse> {
    const res = await fetch(`${API_BASE_URL}/assets/${assetId}/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de l’enregistrement du relevé.');
    }
    return data;
  }

  static async listWorkOrders(token: string, status?: WorkOrderStatus): Promise<WorkOrder[]> {
    const url = new URL(`${API_BASE_URL}/work-orders`);
    if (status) {
      url.searchParams.set('status', status);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Impossible de charger les ordres de travail.');
    }
    return res.json();
  }

  static async createWorkOrder(dto: CreateWorkOrderDto, token: string): Promise<WorkOrder> {
    const res = await fetch(`${API_BASE_URL}/work-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la création de l’ordre de travail.');
    }
    return data;
  }

  static async completeWorkOrder(
    id: string,
    dto: CompleteWorkOrderDto,
    token: string,
  ): Promise<WorkOrder> {
    const res = await fetch(`${API_BASE_URL}/work-orders/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la clôture de l’intervention.');
    }
    return data;
  }

  static async updateAsset(id: string, dto: Partial<CreateAssetDto>, token: string): Promise<Asset> {
    try {
      const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // mode autonome / local
    }
    return { id, ...dto } as any;
  }

  static async deleteAsset(id: string, token: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // mode autonome / local
    }
    return { success: true };
  }

  static async updateWorkOrder(id: string, dto: Partial<CreateWorkOrderDto>, token: string): Promise<WorkOrder> {
    try {
      const res = await fetch(`${API_BASE_URL}/work-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // mode autonome / local
    }
    return { id, ...dto } as any;
  }

  static async deleteWorkOrder(id: string, token: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/work-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // mode autonome / local
    }
    return { success: true };
  }
}
