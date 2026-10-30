import {
  DigitalTwinAsset,
  DigitalTwinSimulationParams,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class DigitalTwinClient {
  private static async request<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/digital-twin${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = 'Erreur lors de la récupération du jumeau numérique.';
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  static async listTwins(token: string): Promise<DigitalTwinAsset[]> {
    return this.request<DigitalTwinAsset[]>('/assets', token);
  }

  static async getTwin(assetId: string, token: string): Promise<DigitalTwinAsset> {
    return this.request<DigitalTwinAsset>(`/assets/${assetId}`, token);
  }

  static async simulateTwin(
    assetId: string,
    params: DigitalTwinSimulationParams,
    token: string
  ): Promise<DigitalTwinAsset> {
    return this.request<DigitalTwinAsset>(`/assets/${assetId}/simulate`, token, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
