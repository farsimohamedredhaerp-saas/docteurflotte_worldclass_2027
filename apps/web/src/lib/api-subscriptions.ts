import {
  SubscriptionPlan,
  TenantSubscription,
  SubscriptionInvoice,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  UpdateTenantSubscriptionDto,
  GenerateInvoiceDto,
  ClientQuoteRequestDto,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class SubscriptionsClient {
  private static getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Client (Tenant) ---

  static async getPublicPlans(): Promise<SubscriptionPlan[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // fallback
    }
    return [];
  }

  static async getCurrentSubscription(token: string): Promise<TenantSubscription | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // fallback
    }
    return null;
  }

  static async getTenantInvoices(token: string): Promise<SubscriptionInvoice[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/invoices`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // fallback
    }
    return [];
  }

  static async submitQuoteRequest(
    token: string,
    dto: ClientQuoteRequestDto
  ): Promise<{ success: boolean; message: string; quoteRef?: string }> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/quote-request`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error(`Erreur lors de la demande de devis (${res.status})`);
    }
    return res.json();
  }

  // --- SuperAdmin ---

  static async getAllPlansAdmin(token: string): Promise<SubscriptionPlan[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // fallback
    }
    return [];
  }

  static async createPlanAdmin(token: string, dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error(`Erreur de création de plan (${res.status})`);
    }
    return res.json();
  }

  static async updatePlanAdmin(
    token: string,
    id: string,
    dto: UpdateSubscriptionPlanDto
  ): Promise<SubscriptionPlan> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error(`Erreur de mise à jour du plan (${res.status})`);
    }
    return res.json();
  }

  static async deletePlanAdmin(token: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
    if (!res.ok) {
      throw new Error(`Erreur d'archivage du plan (${res.status})`);
    }
  }

  static async getAllTenantSubscriptionsAdmin(token: string): Promise<TenantSubscription[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/admin/tenants`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // fallback
    }
    return [];
  }

  static async updateTenantSubscriptionAdmin(
    token: string,
    tenantId: string,
    dto: UpdateTenantSubscriptionDto
  ): Promise<TenantSubscription> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/admin/tenants/${tenantId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error(`Erreur de mise à jour de l'abonnement tenant (${res.status})`);
    }
    return res.json();
  }

  static async generateInvoiceAdmin(
    token: string,
    tenantId: string,
    dto: GenerateInvoiceDto
  ): Promise<SubscriptionInvoice> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/admin/tenants/${tenantId}/invoice`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error(`Erreur d'émission de la facture (${res.status})`);
    }
    return res.json();
  }
}

