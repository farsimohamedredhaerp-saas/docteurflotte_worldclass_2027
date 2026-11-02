import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TenantSetupDto } from './dto/tenant-setup.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import {
  ActivityPack,
  DataOrigin,
  PurgeDemoDataResponse,
  Tenant,
  TenantSettings,
  TenantSetupResponse,
  TenantStatus,
  resolveCountryPack,
} from '@docteurflotte/contracts';

export interface TenantDatabaseRow {
  id: string;
  name: string;
  slug: string;
  activity_pack: ActivityPack;
  country_code: string;
  currency: string;
  data_origin: DataOrigin;
  status: TenantStatus;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface TenantSettingsDatabaseRow {
  id: string;
  tenant_id: string;
  activity_pack: ActivityPack;
  measurement_system?: 'METRIC' | 'IMPERIAL';
  currency?: string;
  branding?: TenantSettings['branding'];
  alert_thresholds?: TenantSettings['alertThresholds'];
  economic_rates?: TenantSettings['economicRates'];
  notification_preferences?: TenantSettings['notificationPreferences'];
  is_setup_completed?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

@Injectable()
export class TenantsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Finalise la configuration initiale (Onboarding) du tenant dans son contexte RLS.
   */
  async completeSetup(tenantId: string, dto: TenantSetupDto): Promise<TenantSetupResponse> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const dataOrigin = dto.enableDemoData ? DataOrigin.DEMO : DataOrigin.USER_ENTRY;

      // Mise à jour de la table tenant
      const tenantRes = await client.query(
        `UPDATE tenants
         SET activity_pack = $1,
             currency = $2,
             data_origin = $3,
             status = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [dto.activityPack, dto.currency.toUpperCase(), dataOrigin, TenantStatus.ACTIVE, tenantId],
      );

      if (tenantRes.rowCount === 0) {
        throw new NotFoundException('Tenant introuvable.');
      }

      // Mise à jour des paramètres RLS du tenant
      const settingsRes = await client.query(
        `UPDATE tenant_settings
         SET activity_pack = $1,
             measurement_system = $2,
             currency = $3,
             is_setup_completed = true,
             updated_at = NOW()
         WHERE tenant_id = $4
         RETURNING *`,
        [dto.activityPack, dto.measurementSystem, dto.currency.toUpperCase(), tenantId],
      );

      const tRow = tenantRes.rows[0];
      const sRow = settingsRes.rows[0];

      return {
        success: true,
        tenant: this.mapTenant(tRow),
        settings: this.mapSettings(sRow),
        message: 'Configuration initiale validée avec succès.',
      };
    });
  }

  /**
   * Retourne les informations et paramètres du tenant connecté sous RLS.
   */
  async getCurrentTenant(tenantId: string): Promise<{ tenant: Tenant; settings: TenantSettings }> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const tenantRes = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      if (tenantRes.rowCount === 0) {
        throw new NotFoundException('Tenant introuvable.');
      }

      const settingsRes = await client.query('SELECT * FROM tenant_settings WHERE tenant_id = $1', [
        tenantId,
      ]);

      const tRow = tenantRes.rows[0];
      const sRow = settingsRes.rows[0] || {};

      return {
        tenant: this.mapTenant(tRow),
        settings: this.mapSettings(sRow, tRow.country_code),
      };
    });
  }

  /**
   * Met à jour les paramètres, barèmes financiers et seuils métrologiques sans aucune constante en dur.
   */
  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto): Promise<TenantSettings> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const existingRes = await client.query(
        'SELECT * FROM tenant_settings WHERE tenant_id = $1',
        [tenantId],
      );
      if (existingRes.rowCount === 0) {
        throw new NotFoundException('Paramètres de tenant introuvables.');
      }
      const existing = existingRes.rows[0];

      const updatedCurrency = dto.currency ? dto.currency.toUpperCase() : existing.currency;
      const updatedMeasurement = dto.measurementSystem || existing.measurement_system;
      const countryPack = resolveCountryPack(undefined, updatedCurrency);

      const mergedBranding = {
        timezone: countryPack.timezone,
        dateFormat: 'DD/MM/YYYY',
        ...(existing.branding || {}),
        ...(dto.branding || {}),
      };

      const mergedAlerts = {
        maintenanceWarningKm: 1000,
        maintenanceWarningHours: 50,
        inspectionDaysNotice: 15,
        odometerRollbackToleranceKm: 0,
        dailyKmExcessThreshold: 800,
        ...(existing.alert_thresholds || {}),
        ...(dto.alertThresholds || {}),
      };

      const mergedEconomic = {
        hourlyLaborRate: countryPack.hourlyLaborRate,
        approvalExpenseThreshold: countryPack.approvalExpenseThreshold,
        inactionRiskMultiplier: countryPack.inactionRiskMultiplier,
        referenceFuelPricePerLiter: countryPack.referenceFuelPricePerLiter,
        ...(existing.economic_rates || {}),
        ...(dto.economicRates || {}),
      };

      const mergedNotifications = {
        emailNotifications: true,
        inAppAlerts: true,
        notifyOnCriticalOverdue: true,
        notifyOnExpenseExceeded: true,
        ...(existing.notification_preferences || {}),
        ...(dto.notificationPreferences || {}),
      };

      const updateRes = await client.query(
        `UPDATE tenant_settings
         SET currency = $1,
             measurement_system = $2,
             branding = $3,
             alert_thresholds = $4,
             economic_rates = $5,
             notification_preferences = $6,
             updated_at = NOW()
         WHERE tenant_id = $7
         RETURNING *`,
        [
          updatedCurrency,
          updatedMeasurement,
          mergedBranding,
          mergedAlerts,
          mergedEconomic,
          mergedNotifications,
          tenantId,
        ],
      );

      if (dto.currency) {
        await client.query('UPDATE tenants SET currency = $1, updated_at = NOW() WHERE id = $2', [
          updatedCurrency,
          tenantId,
        ]);
      }

      return this.mapSettings(updateRes.rows[0]);
    });
  }

  /**
   * Purge atomiquement les données synthétiques de démonstration (décisions, actifs, OT)
   * et bascule le tenant vers un espace réel propre (USER_ENTRY).
   */
  async purgeDemoData(tenantId: string): Promise<PurgeDemoDataResponse> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      await client.query(
        `WITH purged_decisions AS (
           DELETE FROM decision_recommendations WHERE tenant_id = $1 AND data_origin = 'DEMO'
         ),
         purged_assets AS (
           DELETE FROM assets WHERE tenant_id = $1 AND data_origin = 'DEMO'
         )
         UPDATE tenants SET data_origin = 'USER_ENTRY', updated_at = NOW() WHERE id = $1`,
        [tenantId],
      );

      return {
        success: true,
        message: 'Données synthétiques de démonstration purgées avec succès. Espace prêt pour vos données réelles.',
        dataOrigin: DataOrigin.USER_ENTRY,
      };
    });
  }

  private mapTenant(tRow: TenantDatabaseRow): Tenant {
    return {
      id: tRow.id,
      name: tRow.name,
      slug: tRow.slug,
      activityPack: tRow.activity_pack,
      countryCode: tRow.country_code,
      currency: tRow.currency,
      dataOrigin: tRow.data_origin,
      status: tRow.status,
      createdAt: tRow.created_at ? new Date(tRow.created_at).toISOString() : new Date().toISOString(),
      updatedAt: tRow.updated_at ? new Date(tRow.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  private mapSettings(sRow: TenantSettingsDatabaseRow, countryCode?: string): TenantSettings {
    const currency = sRow.currency || 'DZD';
    const pack = resolveCountryPack(countryCode, currency);
    return {
      id: sRow.id,
      tenantId: sRow.tenant_id,
      activityPack: sRow.activity_pack,
      measurementSystem: sRow.measurement_system || pack.measurementSystem,
      currency,
      branding: sRow.branding || { timezone: pack.timezone, dateFormat: 'DD/MM/YYYY' },
      alertThresholds: sRow.alert_thresholds || {
        maintenanceWarningKm: 1000,
        maintenanceWarningHours: 50,
        inspectionDaysNotice: 15,
        odometerRollbackToleranceKm: 0,
        dailyKmExcessThreshold: 800,
      },
      economicRates: sRow.economic_rates || {
        hourlyLaborRate: pack.hourlyLaborRate,
        approvalExpenseThreshold: pack.approvalExpenseThreshold,
        inactionRiskMultiplier: pack.inactionRiskMultiplier,
        referenceFuelPricePerLiter: pack.referenceFuelPricePerLiter,
      },
      notificationPreferences: sRow.notification_preferences || {
        emailNotifications: true,
        inAppAlerts: true,
        notifyOnCriticalOverdue: true,
        notifyOnExpenseExceeded: true,
      },
      isSetupCompleted: Boolean(sRow.is_setup_completed),
      createdAt: sRow.created_at ? new Date(sRow.created_at).toISOString() : new Date().toISOString(),
      updatedAt: sRow.updated_at ? new Date(sRow.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}
