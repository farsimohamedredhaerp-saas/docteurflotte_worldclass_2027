import { ActivityPack, Tenant, TenantStatus } from './tenant';
import { DataOrigin } from './assets';

export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  MAINTENANCE_SUPERVISOR = 'MAINTENANCE_SUPERVISOR',
  TECHNICIAN = 'TECHNICIAN',
  FINANCIAL_CONTROLLER = 'FINANCIAL_CONTROLLER',
  OPERATOR = 'OPERATOR',
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface RegisterTenantDto {
  companyName: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  activityPack: ActivityPack;
  countryCode?: string;
  currency?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    activityPack: ActivityPack;
    isSetupCompleted: boolean;
    dataOrigin?: DataOrigin;
  };
}

export interface UserProfileResponse {
  user: AuthUser;
  tenant: Tenant & {
    is_setup_completed?: boolean;
    measurement_system?: string;
  };
}

export interface JwtPayload {
  sub: string; // user id
  tenantId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
