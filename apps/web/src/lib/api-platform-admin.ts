import {
  PlatformAuditLog,
  PlatformConfigPublication,
  PlatformDecisionEngineConfig,
  PlatformFiscalFuelPrice,
  PlatformOverviewKpis,
  PlatformRegulatoryEnactaRule,
  PlatformTelematicsGateway,
  PlatformTenant,
  PlatformVignetteTarif,
  CreateDecisionConfigDto,
  UpdateDecisionConfigDto,
  UpdatePlatformRegulatoryEnactaRuleDto,
  DecisionEngineSimulationParams,
  DecisionEngineSimulationResult,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class PlatformAdminClient {
  private static async request<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = 'Erreur lors de la requête administrative.';
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  static async getOverview(token: string): Promise<PlatformOverviewKpis> {
    return this.request<PlatformOverviewKpis>('/overview', token);
  }

  // Tenants
  static async getTenants(token: string): Promise<PlatformTenant[]> {
    return this.request<PlatformTenant[]>('/tenants', token);
  }

  static async getTenantById(id: string, token: string): Promise<PlatformTenant> {
    return this.request<PlatformTenant>(`/tenants/${id}`, token);
  }

  static async updateTenant(
    id: string,
    dto: Partial<PlatformTenant>,
    token: string
  ): Promise<PlatformTenant> {
    return this.request<PlatformTenant>(`/tenants/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // Decision Engine
  static async getDecisionConfigs(token: string): Promise<PlatformDecisionEngineConfig[]> {
    return this.request<PlatformDecisionEngineConfig[]>('/decision-engine/configs', token);
  }

  static async getDecisionConfigById(id: string, token: string): Promise<PlatformDecisionEngineConfig> {
    return this.request<PlatformDecisionEngineConfig>(`/decision-engine/configs/${id}`, token);
  }

  static async createDecisionConfigDraft(
    dto: CreateDecisionConfigDto,
    token: string
  ): Promise<PlatformDecisionEngineConfig> {
    return this.request<PlatformDecisionEngineConfig>('/decision-engine/drafts', token, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  static async updateDecisionConfigDraft(
    id: string,
    dto: UpdateDecisionConfigDto,
    token: string
  ): Promise<PlatformDecisionEngineConfig> {
    return this.request<PlatformDecisionEngineConfig>(`/decision-engine/drafts/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  static async approveDecisionConfig(
    id: string,
    token: string
  ): Promise<PlatformDecisionEngineConfig> {
    return this.request<PlatformDecisionEngineConfig>(`/decision-engine/drafts/${id}/approve`, token, {
      method: 'POST',
    });
  }

  static async simulateDecisionConfig(
    params: DecisionEngineSimulationParams,
    token: string
  ): Promise<DecisionEngineSimulationResult> {
    return this.request<DecisionEngineSimulationResult>('/decision-engine/simulate', token, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async getActivePublication(token: string): Promise<PlatformConfigPublication | null> {
    return this.request<PlatformConfigPublication | null>('/decision-engine/active', token);
  }

  static async getPublications(token: string): Promise<PlatformConfigPublication[]> {
    return this.request<PlatformConfigPublication[]>('/decision-engine/publications', token);
  }

  static async activateConfig(
    configId: string,
    token: string,
    justification?: string
  ): Promise<{ publicationId: string; version: string }> {
    return this.request<{ publicationId: string; version: string }>(
      '/decision-engine/activate',
      token,
      {
        method: 'POST',
        body: JSON.stringify({ configId, justification }),
      }
    );
  }

  static async rollbackConfig(
    token: string,
    justification?: string
  ): Promise<{ publicationId: string; version: string }> {
    return this.request<{ publicationId: string; version: string }>(
      '/decision-engine/rollback',
      token,
      {
        method: 'POST',
        body: JSON.stringify({ justification }),
      }
    );
  }

  // Fiscal & Regulatory
  static async getFuelPrices(token: string): Promise<PlatformFiscalFuelPrice[]> {
    return this.request<PlatformFiscalFuelPrice[]>('/fiscal/fuel-prices', token);
  }

  static async updateFuelPrice(
    id: string,
    dto: Partial<PlatformFiscalFuelPrice>,
    token: string
  ): Promise<PlatformFiscalFuelPrice> {
    return this.request<PlatformFiscalFuelPrice>(`/fiscal/fuel-prices/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  static async getVignettes(token: string): Promise<PlatformVignetteTarif[]> {
    return this.request<PlatformVignetteTarif[]>('/fiscal/vignettes', token);
  }

  static async getEnactaRules(token: string): Promise<PlatformRegulatoryEnactaRule[]> {
    return this.request<PlatformRegulatoryEnactaRule[]>('/fiscal/enacta', token);
  }

  static async updateEnactaRule(
    id: string,
    dto: UpdatePlatformRegulatoryEnactaRuleDto,
    token: string
  ): Promise<PlatformRegulatoryEnactaRule> {
    return this.request<PlatformRegulatoryEnactaRule>(`/fiscal/enacta/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // Gateways
  static async getGateways(token: string): Promise<PlatformTelematicsGateway[]> {
    return this.request<PlatformTelematicsGateway[]>('/gateways', token);
  }

  static async updateGateway(
    id: string,
    dto: Partial<PlatformTelematicsGateway>,
    token: string
  ): Promise<PlatformTelematicsGateway> {
    return this.request<PlatformTelematicsGateway>(`/gateways/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // Audit Logs
  static async getAuditLogs(token: string): Promise<PlatformAuditLog[]> {
    return this.request<PlatformAuditLog[]>('/audit-logs', token);
  }
}
