import {
  AuthResponse,
  LoginDto,
  RegisterTenantDto,
  TenantSettings,
  TenantSetupDto,
  TenantSetupResponse,
  UpdateTenantSettingsDto,
  PurgeDemoDataResponse,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class AuthClient {
  static getBaseUrl(): string {
    return API_BASE_URL;
  }

  static async registerTenant(dto: RegisterTenantDto): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la création de l’organisation.');
    }
    return data;
  }

  static async login(dtoOrEmail: LoginDto | string, password?: string): Promise<AuthResponse & { token: string }> {
    const payload = typeof dtoOrEmail === 'string' ? { email: dtoOrEmail, password: password || '' } : dtoOrEmail;
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Identifiants invalides.');
    }
    return { ...data, token: data.accessToken };
  }

  static async completeSetup(dto: TenantSetupDto, token: string): Promise<TenantSetupResponse> {
    const res = await fetch(`${API_BASE_URL}/tenants/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la configuration initiale.');
    }
    return data;
  }

  static async getProfile(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Session expirée ou non autorisée.');
    }
    return res.json();
  }

  static async getSettings(token: string): Promise<TenantSettings> {
    const res = await fetch(`${API_BASE_URL}/tenants/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Impossible de charger les paramètres de l’organisation.');
    }
    return res.json();
  }

  static async updateSettings(dto: UpdateTenantSettingsDto, token: string): Promise<TenantSettings> {
    const res = await fetch(`${API_BASE_URL}/tenants/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la mise à jour des paramètres.');
    }
    return data;
  }

  static async purgeDemo(token: string): Promise<PurgeDemoDataResponse> {
    const res = await fetch(`${API_BASE_URL}/tenants/purge-demo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la purge des données de démo.');
    }
    return data;
  }

  // Stockage local de session sécurisé
  static saveSession(auth: AuthResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('df_auth_token', auth.accessToken);
      localStorage.setItem('df_auth_user', JSON.stringify(auth.user));
      localStorage.setItem('df_auth_tenant', JSON.stringify(auth.tenant));
    }
  }

  static getSession(): { token: string | null; user: any | null; tenant: any | null } {
    if (typeof window === 'undefined') {
      return { token: null, user: null, tenant: null };
    }
    const token = localStorage.getItem('df_auth_token');
    const userStr = localStorage.getItem('df_auth_user');
    const tenantStr = localStorage.getItem('df_auth_tenant');

    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      tenant: tenantStr ? JSON.parse(tenantStr) : null,
    };
  }

  static getToken(): string | null {
    return AuthClient.getSession().token;
  }

  static clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('df_auth_token');
      localStorage.removeItem('df_auth_user');
      localStorage.removeItem('df_auth_tenant');
    }
  }
}
