import { DataOrigin } from './assets';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  PENDING_SETUP = 'PENDING_SETUP',
  SUSPENDED = 'SUSPENDED',
}

export enum ActivityPack {
  TRANSPORT = 'TRANSPORT', // Poids lourds & transport routier
  CONSTRUCTION = 'CONSTRUCTION', // Engins de chantier & travaux publics (BTP)
  LIGHT_VEHICLES = 'LIGHT_VEHICLES', // Véhicules légers et utilitaires
  CUSTOM = 'CUSTOM', // Mixte / Industriel
}

export interface TenantBranding {
  displayName?: string;
  timezone: string;
  dateFormat: string;
  logoUrl?: string;
}

export interface OperationalThresholds {
  /** @deprecated Les intervalles et seuils d'entretien mécanique sont désormais gérés par actif (OEM-First). */
  maintenanceWarningKm?: number;
  /** @deprecated Les intervalles et seuils d'entretien mécanique sont désormais gérés par actif (OEM-First). */
  maintenanceWarningHours?: number;
  inspectionDaysNotice: number;
  odometerRollbackToleranceKm: number;
  dailyKmExcessThreshold: number;
}


export interface EconomicRates {
  hourlyLaborRate: number;
  approvalExpenseThreshold: number;
  inactionRiskMultiplier: number;
  referenceFuelPricePerLiter: number;
  towingBaseRateTellDzd?: number;
  towingSurchargeSaharaDzd?: number;
  dailyImmobilizationCostDzd?: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppAlerts: boolean;
  notifyOnCriticalOverdue: boolean;
  notifyOnExpenseExceeded: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  activityPack: ActivityPack;
  countryCode: string;
  currency: string;
  dataOrigin: DataOrigin;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  activityPack: ActivityPack;
  measurementSystem: 'METRIC' | 'IMPERIAL';
  currency: string;
  branding: TenantBranding;
  alertThresholds: OperationalThresholds;
  economicRates: EconomicRates;
  notificationPreferences: NotificationPreferences;
  isSetupCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSetupDto {
  activityPack: ActivityPack;
  measurementSystem: 'METRIC' | 'IMPERIAL';
  currency: string;
  enableDemoData: boolean;
}

export interface TenantSetupResponse {
  success: boolean;
  tenant: Tenant;
  settings: TenantSettings;
  message: string;
}

export interface UpdateTenantSettingsDto {
  currency?: string;
  measurementSystem?: 'METRIC' | 'IMPERIAL';
  branding?: Partial<TenantBranding>;
  alertThresholds?: Partial<OperationalThresholds>;
  economicRates?: Partial<EconomicRates>;
  notificationPreferences?: Partial<NotificationPreferences>;
}

export interface PurgeDemoDataResponse {
  success: boolean;
  message: string;
  dataOrigin: DataOrigin;
}
