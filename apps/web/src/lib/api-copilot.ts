import {
  CopilotResponse,
  CopilotInsightItem,
  CopilotQueryDto,
  CopilotActionSuggestion,
  OllamaStatusResponse,
  OllamaInferenceLogEntry,
  OllamaPlaygroundRequestDto,
  OllamaPlaygroundResponseDto,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class CopilotClient {
  private static async request<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE_URL}/copilot${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = 'Erreur lors de la requête vers le Copilote.';
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

  static async getAiStatus(token?: string): Promise<OllamaStatusResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/copilot/ai-status`, {
        headers: token
          ? {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            }
          : { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fallback
    }
    return {
      available: false,
      model: 'docteurflotte (qwen2.5:1.5b-instruct)',
      baseUrl: 'http://localhost:11434',
      sovereign: true,
      loi1807Compliant: true,
      mode: 'DETERMINISTIC_FALLBACK',
    };
  }

  static async getAiLogs(token?: string): Promise<OllamaInferenceLogEntry[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/copilot/ai-logs`, {
        headers: token
          ? {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            }
          : { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fallback
    }
    return [];
  }

  static async testInference(
    dto: OllamaPlaygroundRequestDto,
    token?: string
  ): Promise<OllamaPlaygroundResponseDto> {
    const res = await fetch(`${API_BASE_URL}/copilot/test-inference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Erreur lors de l'exécution de l'inférence locale.");
    }
    return res.json();
  }

  static async ask(
    queryDto: CopilotQueryDto,
    token: string
  ): Promise<CopilotResponse> {
    return this.request<CopilotResponse>('/query', token, {
      method: 'POST',
      body: JSON.stringify(queryDto),
    });
  }

  static async getInsights(token: string): Promise<CopilotInsightItem[]> {
    return this.request<CopilotInsightItem[]>('/insights', token);
  }

  static async getPendingActions(token: string): Promise<CopilotActionSuggestion[]> {
    return this.request<CopilotActionSuggestion[]>('/actions/pending', token);
  }

  static async executeAction(
    actionId: string,
    justification: string,
    token: string
  ): Promise<{ success: boolean; generatedWorkOrderId: string; message: string; confirmationCode?: string }> {
    return this.request(`/actions/${actionId}/execute`, token, {
      method: 'POST',
      body: JSON.stringify({ actionId, justification }),
    });
  }

  static async approveAction(
    actionId: string,
    justification: string,
    token: string
  ): Promise<{ success: boolean; generatedWorkOrderId: string; message: string; confirmationCode?: string }> {
    return this.request(`/actions/${actionId}/approve`, token, {
      method: 'POST',
      body: JSON.stringify({ actionId, justification }),
    });
  }

  static async rejectAction(
    actionId: string,
    reason: string,
    token: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.request(`/actions/${actionId}/reject`, token, {
      method: 'POST',
      body: JSON.stringify({ actionId, reason }),
    });
  }
}
