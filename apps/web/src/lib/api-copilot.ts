import {
  CopilotResponse,
  CopilotInsightItem,
  CopilotQueryDto,
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

  static async executeAction(
    actionId: string,
    justification: string,
    token: string
  ): Promise<{ success: boolean; generatedWorkOrderId: string; message: string }> {
    return this.request(`/actions/${actionId}/execute`, token, {
      method: 'POST',
      body: JSON.stringify({ actionId, justification }),
    });
  }
}
