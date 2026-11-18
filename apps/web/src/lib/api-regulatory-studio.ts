const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RegPackSummary {
  packCode: string;
  version: string;
  descriptionFr: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';
  authorEmail: string;
  publishedByEmail?: string;
  validatedByExpert?: string;
  createdAt: string;
  publishedAt?: string;
  itemsCount: number;
  hasSignature: boolean;
  contentHash?: string;
}

export interface RegPackItem {
  code: string;
  kind: string;
  sourceHierarchy: string;
  validFrom: string;
  validTo: string | null;
  recordedAt: string;
  supersededAt: string | null;
  legalRef: string;
  legalBasisVerified: boolean;
  descriptionFr?: string;
  payload: {
    parameterKey: string;
    parameterGroup?: string;
    type: string;
    value: string;
    unit?: string;
    labelFr: string;
    tranches?: any[];
    sectorCodes?: string[];
    sourceHash?: string;
    modifiedBy?: string;
  };
}

export interface RegPackDetail extends RegPackSummary {
  items: RegPackItem[];
  signatureEd25519?: string;
}

export interface SimulationResultDto {
  packCode: string;
  fiscalYear: number;
  caseType: string;
  asOf: string;
  summaryFr: string;
  metrics: Record<string, string | number | boolean>;
  details: Record<string, any>;
}

export class RegulatoryStudioClient {
  private static async request<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/regulatory-packs${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = 'Erreur lors de la communication avec le Regulatory Studio.';
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

  static async listPacks(token: string): Promise<RegPackSummary[]> {
    return this.request<RegPackSummary[]>('', token);
  }

  static async getPack(packCode: string, token: string): Promise<RegPackDetail> {
    return this.request<RegPackDetail>(`/${packCode}`, token);
  }

  static async clonePack(
    data: {
      sourcePackId: string;
      newPackId: string;
      newVersion: string;
      descriptionFr: string;
    },
    token: string
  ): Promise<RegPackDetail> {
    return this.request<RegPackDetail>('/clone', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateParameter(
    packCode: string,
    parameterKey: string,
    data: {
      value: string;
      type: string;
      legalReference: string;
      joradpCitation?: string;
      applicableFrom: string;
      applicableTo?: string | null;
      labelFr?: string;
      unit?: string;
    },
    token: string
  ): Promise<RegPackDetail> {
    return this.request<RegPackDetail>(`/${packCode}/parameters/${parameterKey}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async simulate(
    packCode: string,
    caseType: string,
    token: string
  ): Promise<SimulationResultDto> {
    return this.request<SimulationResultDto>(`/${packCode}/simulate`, token, {
      method: 'POST',
      body: JSON.stringify({ caseType }),
    });
  }

  static async publish(
    packCode: string,
    data: {
      publishedByEmail: string;
      validatedByExpert: string;
      approverEmail?: string;
    },
    token: string
  ): Promise<RegPackDetail> {
    return this.request<RegPackDetail>(`/${packCode}/publish`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
