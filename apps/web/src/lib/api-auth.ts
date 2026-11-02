import {
  AuthResponse,
  AuthUser,
  LoginDto,
  RegisterTenantDto,
  TenantSettings,
  TenantSetupDto,
  TenantSetupResponse,
  UpdateTenantSettingsDto,
  PurgeDemoDataResponse,
  UserProfileResponse,
} from '@docteurflotte/contracts';

export interface NavbarSession {
  token: string | null;
  user: AuthUser | null;
  tenant: AuthResponse['tenant'] | null;
}

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

  static async getProfile(token: string): Promise<UserProfileResponse> {
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

  // Stockage local de session sécurisé avec notification inter-composants
  static saveSession(auth: AuthResponse): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('df_auth_token', auth.accessToken);
        localStorage.setItem('df_auth_user', JSON.stringify(auth.user));
        localStorage.setItem('df_auth_tenant', JSON.stringify(auth.tenant));
        window.dispatchEvent(new CustomEvent('auth:session-changed', { detail: auth }));
      } catch (err) {
        console.error('[AuthClient] Erreur lors de la sauvegarde de session:', err);
      }
    }
  }

  static getSession(): NavbarSession {
    if (typeof window === 'undefined') {
      return { token: null, user: null, tenant: null };
    }
    try {
      const token = localStorage.getItem('df_auth_token');
      const userStr = localStorage.getItem('df_auth_user');
      const tenantStr = localStorage.getItem('df_auth_tenant');

      let user: AuthUser | null = null;
      let tenant: AuthResponse['tenant'] | null = null;

      if (userStr) {
        user = JSON.parse(userStr);
      }
      if (tenantStr) {
        tenant = JSON.parse(tenantStr);
      }

      return { token, user, tenant };
    } catch (err) {
      console.error('[AuthClient] Erreur lors de la lecture de session:', err);
      return { token: null, user: null, tenant: null };
    }
  }

  static getToken(): string | null {
    return AuthClient.getSession().token;
  }

  static clearSession(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('df_auth_token');
        localStorage.removeItem('df_auth_user');
        localStorage.removeItem('df_auth_tenant');
        window.dispatchEvent(new CustomEvent('auth:session-changed', { detail: null }));
      } catch (err) {
        console.error('[AuthClient] Erreur lors du nettoyage de session:', err);
      }
    }
  }
}
