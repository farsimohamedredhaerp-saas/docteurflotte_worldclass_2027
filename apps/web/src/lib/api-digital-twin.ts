import {
  DigitalTwinAsset,
  DigitalTwinSimulationParams,
  DigitalTwinUiConfig,
  DEFAULT_DIGITAL_TWIN_CONFIG,
  DigitalTwinUiConfigSchema,
  DigitalTwinAssetSchema,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class DigitalTwinClient {
  private static async request<T>(
    endpoint: string,
    token?: string | null,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/digital-twin${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'Erreur lors de la communication avec le service jumeau numérique.';
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

  static async getConfig(
    token?: string | null,
    signal?: AbortSignal
  ): Promise<DigitalTwinUiConfig> {
    try {
      const data = await this.request<unknown>('/config', token, { signal });
      const parsed = DigitalTwinUiConfigSchema.safeParse(data);
      if (parsed.success) {
        return parsed.data;
      }
      console.warn('[DigitalTwinClient] Invalid config schema from API, using default config:', parsed.error);
      return DEFAULT_DIGITAL_TWIN_CONFIG;
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        throw err;
      }
      console.warn('[DigitalTwinClient] Failed to fetch /digital-twin/config, using default config:', err);
      return DEFAULT_DIGITAL_TWIN_CONFIG;
    }
  }

  static async listTwins(
    token?: string | null,
    signal?: AbortSignal
  ): Promise<DigitalTwinAsset[]> {
    const raw = await this.request<unknown[]>('/assets', token, { signal });
    return (raw || []).map((item) => {
      const parsed = DigitalTwinAssetSchema.safeParse(item);
      return parsed.success ? parsed.data : (item as DigitalTwinAsset);
    });
  }

  static async getTwin(
    assetId: string,
    token?: string | null,
    signal?: AbortSignal
  ): Promise<DigitalTwinAsset> {
    const data = await this.request<unknown>(`/assets/${encodeURIComponent(assetId)}`, token, { signal });
    const parsed = DigitalTwinAssetSchema.safeParse(data);
    if (!parsed.success) {
      console.warn(`[DigitalTwinClient] Jumeau ${assetId} incomplet selon le schéma:`, parsed.error);
      return data as DigitalTwinAsset;
    }
    return parsed.data;
  }

  static async simulateTwin(
    assetId: string,
    params: DigitalTwinSimulationParams,
    token?: string | null,
    signal?: AbortSignal
  ): Promise<DigitalTwinAsset> {
    const data = await this.request<unknown>(
      `/assets/${encodeURIComponent(assetId)}/simulate`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(params),
        signal,
      }
    );
    const parsed = DigitalTwinAssetSchema.safeParse(data);
    if (!parsed.success) {
      console.warn(`[DigitalTwinClient] Simulation pour ${assetId} invalide selon schéma:`, parsed.error);
      return data as DigitalTwinAsset;
    }
    return parsed.data;
  }
}
