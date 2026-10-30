import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {}

  private resolveConnectionString(): string {
    const directUrl = this.configService.get<string>('DATABASE_URL');
    if (directUrl) {
      return directUrl;
    }

    const host = this.configService.get<string>('DATABASE_HOST');
    const port = this.configService.get<string>('DATABASE_PORT') || '5432';
    const user = this.configService.get<string>('DATABASE_USER');
    const password = this.configService.get<string>('DATABASE_PASSWORD');
    const dbName = this.configService.get<string>('DATABASE_NAME');

    if (host && user && dbName) {
      const encodedPass = password ? `:${encodeURIComponent(password)}` : '';
      return `postgresql://${encodeURIComponent(user)}${encodedPass}@${host}:${port}/${encodeURIComponent(dbName)}`;
    }

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error(
        'FATAL: DATABASE_URL (ou DATABASE_HOST/DATABASE_USER/DATABASE_NAME) est obligatoire en production.',
      );
    }

    return 'postgresql://docteurflotte:docteurflotte_dev_password_local_only@localhost:5434/docteurflotte_dev';
  }

  async onModuleInit(): Promise<void> {
    const connectionString = this.resolveConnectionString();

    this.pool = new Pool({
      connectionString,
      max: Number(this.configService.get<string>('DB_POOL_MAX') || 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    try {
      const client = await this.pool.connect();
      try {
        await this.runMigrations(client);
        this.logger.log('Connexion PostgreSQL établie et schéma multi-tenant initialisé.');
      } finally {
        client.release();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Initialisation automatique du schéma reportée (PostgreSQL non disponible ou erreur: ${msg})`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Pool de connexions PostgreSQL fermé.');
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }

  /**
   * Exécute une série de requêtes dans une transaction isolée avec RLS
   * en fixant strictement `SET LOCAL app.current_tenant_id` et `SET LOCAL ROLE df_tenant_role`.
   */
  async withTenantContext<T>(tenantId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Base de données non disponible.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL ROLE df_tenant_role');
      await client.query('SELECT set_config($1, $2, true)', ['app.system_context', 'false']);
      await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenantId]);
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Exécute une requête système contrôlée (Authentification, Control Plane SuperAdmin, Résolution IMEI)
   * compatible avec les bases PostgreSQL managées Cloud (RDS, Cloud SQL, Supabase) sans privilège SUPERUSER.
   */
  async withSystemContext<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Base de données non disponible.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.system_context', 'true']);
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Exécute une requête administrative ou de découverte hors contexte tenant restreint.
   */
  async query<R extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
    if (!this.pool) {
      throw new Error('Base de données non disponible.');
    }
    return this.pool.query<R>(text, params);
  }

  private async runMigrations(client: PoolClient): Promise<void> {
    const defaultApprovalThreshold = 100 * 1000;
    const defaultEconomicRatesJson = JSON.stringify({
      hourlyLaborRate: 1500,
      approvalExpenseThreshold: defaultApprovalThreshold,
      inactionRiskMultiplier: 3.5,
      referenceFuelPricePerLiter: 29.0,
    });

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Table principale des Tenants
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        activity_pack VARCHAR(50) NOT NULL DEFAULT 'TRANSPORT',
        country_code VARCHAR(10) NOT NULL DEFAULT 'DZ',
        currency VARCHAR(10) NOT NULL DEFAULT 'DZD',
        data_origin VARCHAR(50) NOT NULL DEFAULT 'DEMO',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING_SETUP',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Table des Utilisateurs
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'TENANT_ADMIN',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
      );

      CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      -- Table des Paramètres Tenant & Setup Initial
      CREATE TABLE IF NOT EXISTS tenant_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
        activity_pack VARCHAR(50) NOT NULL DEFAULT 'TRANSPORT',
        measurement_system VARCHAR(20) NOT NULL DEFAULT 'METRIC',
        currency VARCHAR(10) NOT NULL DEFAULT 'DZD',
        alert_thresholds JSONB NOT NULL DEFAULT '{"maintenanceWarningKm": 1000, "maintenanceWarningHours": 50, "inspectionDaysNotice": 15}'::jsonb,
        is_setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

      ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{"timezone": "Africa/Algiers", "dateFormat": "DD/MM/YYYY"}'::jsonb;
      ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS economic_rates JSONB NOT NULL DEFAULT '${defaultEconomicRatesJson}'::jsonb;
      ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"emailNotifications": true, "inAppAlerts": true, "notifyOnCriticalOverdue": true, "notifyOnExpenseExceeded": true}'::jsonb;

      -- Table des Actifs Opérationnels (Gate 2)
      CREATE TABLE IF NOT EXISTS assets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        year INT,
        status VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL',
        data_origin VARCHAR(50) NOT NULL DEFAULT 'USER_ENTRY',
        primary_meter_type VARCHAR(50) NOT NULL DEFAULT 'ODOMETER_KM',
        current_meter_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
        maintenance_interval_value NUMERIC(12, 2),
        next_maintenance_meter_value NUMERIC(12, 2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_tenant_asset_code UNIQUE (tenant_id, code)
      );

      CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

      -- Table des Relevés Métrologiques & Compteurs (Gate 2)
      CREATE TABLE IF NOT EXISTS meter_readings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        meter_type VARCHAR(50) NOT NULL,
        value NUMERIC(12, 2) NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
        is_validated BOOLEAN NOT NULL DEFAULT TRUE,
        validation_error TEXT,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_meter_readings_tenant_id ON meter_readings(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_meter_readings_asset_id ON meter_readings(asset_id);

      -- Table des Ordres de Travail & Maintenance (Gate 2)
      CREATE TABLE IF NOT EXISTS work_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
        status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
        trigger_meter_value NUMERIC(12, 2),
        estimated_labor_hours NUMERIC(6, 2) DEFAULT 0,
        actual_labor_hours NUMERIC(6, 2) DEFAULT 0,
        hourly_rate_applied NUMERIC(10, 2) DEFAULT 0,
        labor_cost NUMERIC(12, 2) DEFAULT 0,
        parts_cost NUMERIC(12, 2) DEFAULT 0,
        total_cost NUMERIC(12, 2) DEFAULT 0,
        downtime_hours NUMERIC(8, 2) DEFAULT 0,
        assigned_to VARCHAR(150),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);
      CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

      -- Table des Boîtiers Télématiques / Dispositifs GPS (Gate 3)
      CREATE TABLE IF NOT EXISTS telematics_devices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        traccar_id INT,
        unique_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
        last_update TIMESTAMPTZ,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_tenant_device_unique_id UNIQUE (tenant_id, unique_id)
      );

      CREATE INDEX IF NOT EXISTS idx_telematics_devices_tenant_id ON telematics_devices(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_telematics_devices_unique_id ON telematics_devices(unique_id);

      -- Table d'Appairage Horodaté Actif-Boîtier (Gate 3)
      CREATE TABLE IF NOT EXISTS asset_device_bindings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        device_id UUID NOT NULL REFERENCES telematics_devices(id) ON DELETE CASCADE,
        bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        unbound_at TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_asset_device_bindings_tenant_id ON asset_device_bindings(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_asset_device_bindings_asset_id ON asset_device_bindings(asset_id);
      CREATE INDEX IF NOT EXISTS idx_asset_device_bindings_device_id ON asset_device_bindings(device_id);
      CREATE INDEX IF NOT EXISTS idx_asset_device_bindings_active ON asset_device_bindings(tenant_id, is_active);

      -- Table des Positions Télématiques Idempotentes (Gate 3)
      CREATE TABLE IF NOT EXISTS telematics_positions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        traccar_position_id VARCHAR(100) NOT NULL,
        device_id UUID NOT NULL REFERENCES telematics_devices(id) ON DELETE CASCADE,
        asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
        latitude NUMERIC(10, 7) NOT NULL,
        longitude NUMERIC(10, 7) NOT NULL,
        speed NUMERIC(8, 2) NOT NULL DEFAULT 0,
        altitude NUMERIC(8, 2),
        course NUMERIC(6, 2),
        ignition BOOLEAN NOT NULL DEFAULT FALSE,
        odometer_km NUMERIC(12, 2),
        engine_hours NUMERIC(12, 2),
        recorded_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT uq_tenant_traccar_position_id UNIQUE (tenant_id, traccar_position_id)
      );

      CREATE INDEX IF NOT EXISTS idx_telematics_positions_tenant_id ON telematics_positions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_telematics_positions_device_id ON telematics_positions(device_id);
      CREATE INDEX IF NOT EXISTS idx_telematics_positions_recorded_at ON telematics_positions(recorded_at);

      -- Table des Arbitrages & Décisions Explicables (Gate 4)
      CREATE TABLE IF NOT EXISTS decision_recommendations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        rule_id VARCHAR(100) NOT NULL,
        rule_version VARCHAR(20) NOT NULL DEFAULT '1.0',
        urgency VARCHAR(50) NOT NULL DEFAULT 'warning',
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        estimated_action_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
        cost_inaction_risk NUMERIC(12, 2) NOT NULL DEFAULT 0,
        net_expected_savings NUMERIC(12, 2) NOT NULL DEFAULT 0,
        confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 95,
        explanation_dossier JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        resolved_work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
        data_origin VARCHAR(50) NOT NULL DEFAULT 'ESTIMATED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_decision_recommendations_tenant_id ON decision_recommendations(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_decision_recommendations_asset_id ON decision_recommendations(asset_id);
      CREATE INDEX IF NOT EXISTS idx_decision_recommendations_status ON decision_recommendations(status);

      -- Table des Budgets Prévisionnels de Maintenance (Gate 4)
      CREATE TABLE IF NOT EXISTS maintenance_budgets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        period_year INT NOT NULL,
        period_month INT,
        budget_amount NUMERIC(14, 2) NOT NULL,
        allocated_category VARCHAR(50) NOT NULL DEFAULT 'GLOBAL',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_maintenance_budgets_tenant_period ON maintenance_budgets(tenant_id, period_year);

      -- Table des Gabarits Constructeurs OEM RMI (Référentiel global partagé)
      CREATE TABLE IF NOT EXISTS oem_maintenance_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        wmi_prefix VARCHAR(10) NOT NULL,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        engine_code VARCHAR(100) NOT NULL,
        asset_category VARCHAR(50) NOT NULL,
        fuel_type VARCHAR(50) NOT NULL DEFAULT 'DIESEL',
        ref_consumption_l_100km NUMERIC(6, 2) NOT NULL DEFAULT 0,
        ref_consumption_l_hour NUMERIC(6, 2) NOT NULL DEFAULT 0,
        oil_capacity_liters NUMERIC(6, 2) NOT NULL DEFAULT 0,
        oil_norm_spec VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_oem_template_make_model_engine UNIQUE (make, model, engine_code)
      );

      CREATE INDEX IF NOT EXISTS idx_oem_templates_wmi ON oem_maintenance_templates(wmi_prefix);
      CREATE INDEX IF NOT EXISTS idx_oem_templates_make_model ON oem_maintenance_templates(make, model);

      -- Table des Opérations de Maintenance Constructeurs (Normal & Sévère)
      CREATE TABLE IF NOT EXISTS oem_maintenance_tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        template_id UUID NOT NULL REFERENCES oem_maintenance_templates(id) ON DELETE CASCADE,
        task_code VARCHAR(100) NOT NULL,
        task_name VARCHAR(255) NOT NULL,
        subsystem VARCHAR(50) NOT NULL,
        normal_interval_km INT,
        normal_interval_months INT,
        normal_interval_engine_hours INT,
        severe_interval_km INT,
        severe_interval_months INT,
        severe_interval_engine_hours INT,
        standard_labor_minutes INT DEFAULT 60,
        criticality_weight NUMERIC(4, 2) DEFAULT 1.0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_oem_template_task_code UNIQUE (template_id, task_code)
      );

      CREATE INDEX IF NOT EXISTS idx_oem_tasks_template_id ON oem_maintenance_tasks(template_id);
      CREATE INDEX IF NOT EXISTS idx_oem_tasks_task_code ON oem_maintenance_tasks(task_code);

      -- Table des Véhicules d'exploitation (Supporte Mode 0, 1 et 2)
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        oem_template_id UUID REFERENCES oem_maintenance_templates(id) ON DELETE SET NULL,
        vin VARCHAR(50),
        device_imei VARCHAR(64),
        registration_plate VARCHAR(50) NOT NULL,
        telemetry_mode VARCHAR(50) NOT NULL DEFAULT 'MODE_0_NO_BOX',
        ingestion_provider VARCHAR(50) NOT NULL DEFAULT 'NONE',
        operating_climate_zone VARCHAR(50) NOT NULL DEFAULT 'TELL_URBAN',
        current_odometer_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
        current_engine_hours NUMERIC(12, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_tenant_vehicle_plate UNIQUE (tenant_id, registration_plate)
      );

      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS device_imei VARCHAR(64);
      CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_vehicles_oem_template_id ON vehicles(oem_template_id);
      CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
      CREATE INDEX IF NOT EXISTS idx_vehicles_device_imei ON vehicles(device_imei);

      -- Table des Échéanciers Prédictifs de Maintenance par Véhicule
      CREATE TABLE IF NOT EXISTS vehicle_maintenance_schedules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        oem_task_id UUID NOT NULL REFERENCES oem_maintenance_tasks(id) ON DELETE CASCADE,
        last_performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_performed_km NUMERIC(12, 2) NOT NULL DEFAULT 0,
        last_performed_engine_hours NUMERIC(12, 2) NOT NULL DEFAULT 0,
        effective_interval_km INT,
        effective_interval_hours INT,
        effective_interval_days INT,
        wear_ratio_pct NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
        predicted_rul_days INT,
        predicted_rul_km INT,
        status VARCHAR(50) NOT NULL DEFAULT 'OK',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_vehicle_oem_schedule UNIQUE (vehicle_id, oem_task_id)
      );

      CREATE INDEX IF NOT EXISTS idx_schedules_vehicle_id ON vehicle_maintenance_schedules(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_status ON vehicle_maintenance_schedules(status);

      -- Activation et imposition stricte de Row-Level Security (RLS)
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users FORCE ROW LEVEL SECURITY;
      ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tenant_settings FORCE ROW LEVEL SECURITY;
      ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE assets FORCE ROW LEVEL SECURITY;
      ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE meter_readings FORCE ROW LEVEL SECURITY;
      ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE work_orders FORCE ROW LEVEL SECURITY;
      ALTER TABLE telematics_devices ENABLE ROW LEVEL SECURITY;
      ALTER TABLE telematics_devices FORCE ROW LEVEL SECURITY;
      ALTER TABLE asset_device_bindings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE asset_device_bindings FORCE ROW LEVEL SECURITY;
      ALTER TABLE telematics_positions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE telematics_positions FORCE ROW LEVEL SECURITY;
      ALTER TABLE decision_recommendations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE decision_recommendations FORCE ROW LEVEL SECURITY;
      ALTER TABLE maintenance_budgets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE maintenance_budgets FORCE ROW LEVEL SECURITY;
      ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;
      ALTER TABLE vehicle_maintenance_schedules ENABLE ROW LEVEL SECURITY;
      ALTER TABLE vehicle_maintenance_schedules FORCE ROW LEVEL SECURITY;

      -- Création des politiques RLS Fail-Closed compatibles Cloud Managé (RDS / Cloud SQL / Supabase)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'tenant_isolation_users'
        ) THEN
          CREATE POLICY tenant_isolation_users ON users
            USING (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'tenant_settings' AND policyname = 'tenant_isolation_settings'
        ) THEN
          CREATE POLICY tenant_isolation_settings ON tenant_settings
            USING (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'tenant_isolation_assets'
        ) THEN
          CREATE POLICY tenant_isolation_assets ON assets
            USING (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'meter_readings' AND policyname = 'tenant_isolation_meter_readings'
        ) THEN
          CREATE POLICY tenant_isolation_meter_readings ON meter_readings
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'tenant_isolation_work_orders'
        ) THEN
          CREATE POLICY tenant_isolation_work_orders ON work_orders
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'telematics_devices' AND policyname = 'tenant_isolation_telematics_devices'
        ) THEN
          CREATE POLICY tenant_isolation_telematics_devices ON telematics_devices
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'asset_device_bindings' AND policyname = 'tenant_isolation_asset_device_bindings'
        ) THEN
          CREATE POLICY tenant_isolation_asset_device_bindings ON asset_device_bindings
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'telematics_positions' AND policyname = 'tenant_isolation_telematics_positions'
        ) THEN
          CREATE POLICY tenant_isolation_telematics_positions ON telematics_positions
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'decision_recommendations' AND policyname = 'tenant_isolation_decisions'
        ) THEN
          CREATE POLICY tenant_isolation_decisions ON decision_recommendations
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_budgets' AND policyname = 'tenant_isolation_maintenance_budgets'
        ) THEN
          CREATE POLICY tenant_isolation_maintenance_budgets ON maintenance_budgets
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'tenant_isolation_vehicles'
        ) THEN
          CREATE POLICY tenant_isolation_vehicles ON vehicles
            USING (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            )
            WITH CHECK (
              tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
            );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_maintenance_schedules' AND policyname = 'tenant_isolation_vehicle_schedules'
        ) THEN
          CREATE POLICY tenant_isolation_vehicle_schedules ON vehicle_maintenance_schedules
            USING (
              vehicle_id IN (
                SELECT id FROM vehicles
                WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              )
            );
        END IF;
      END $$;

      -- Création du rôle applicatif non-superuser pour l'imposition RLS
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
          CREATE ROLE df_tenant_role WITH NOINHERIT NOBYPASSRLS;
        END IF;
        GRANT USAGE ON SCHEMA public TO df_tenant_role;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO df_tenant_role;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO df_tenant_role;
      END $$;

      -- Fonction stockée d'initialisation automatique d'échéancier constructeur par véhicule
      CREATE OR REPLACE FUNCTION fn_bootstrap_vehicle_oem_schedule(p_vehicle_id UUID)
      RETURNS INTEGER AS $fn$
      DECLARE
          v_vehicle RECORD;
          v_task RECORD;
          v_use_severe BOOLEAN;
          v_eff_km INTEGER;
          v_eff_hours INTEGER;
          v_eff_days INTEGER;
          v_inserted_count INTEGER := 0;
      BEGIN
          SELECT * INTO v_vehicle FROM vehicles WHERE id = p_vehicle_id;
          IF NOT FOUND OR v_vehicle.oem_template_id IS NULL THEN
              RETURN 0;
          END IF;

          v_use_severe := (v_vehicle.operating_climate_zone IN ('TELL_URBAN', 'SAHARA_SOUTH'));

          FOR v_task IN
              SELECT * FROM oem_maintenance_tasks WHERE template_id = v_vehicle.oem_template_id
          LOOP
              IF v_use_severe THEN
                  v_eff_km := v_task.severe_interval_km;
                  v_eff_hours := v_task.severe_interval_engine_hours;
                  v_eff_days := v_task.severe_interval_months * 30;
              ELSE
                  v_eff_km := v_task.normal_interval_km;
                  v_eff_hours := v_task.normal_interval_engine_hours;
                  v_eff_days := v_task.normal_interval_months * 30;
              END IF;

              INSERT INTO vehicle_maintenance_schedules (
                  vehicle_id, oem_task_id,
                  last_performed_at, last_performed_km, last_performed_engine_hours,
                  effective_interval_km, effective_interval_hours, effective_interval_days,
                  wear_ratio_pct, predicted_rul_days, predicted_rul_km, status
              ) VALUES (
                  v_vehicle.id, v_task.id,
                  NOW(), v_vehicle.current_odometer_km, v_vehicle.current_engine_hours,
                  v_eff_km, v_eff_hours, v_eff_days,
                  0.00, v_eff_days, v_eff_km, 'OK'
              )
              ON CONFLICT DO NOTHING;

              v_inserted_count := v_inserted_count + 1;
          END LOOP;

          RETURN v_inserted_count;
      END;
      $fn$ LANGUAGE plpgsql;
    `);

    // Exécution idempotente des fichiers de migrations additionnels (Control Plane & TimescaleDB)
    const migrationsDirs = [
      path.resolve(process.cwd(), 'database', 'migrations'),
      path.resolve(process.cwd(), '..', '..', 'database', 'migrations'),
    ];
    for (const dir of migrationsDirs) {
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter((f) => f.endsWith('.sql'))
          .sort();
        for (const file of files) {
          try {
            const sql = fs.readFileSync(path.join(dir, file), 'utf8');
            await client.query(sql);
          } catch (migErr: unknown) {
            const msg = migErr instanceof Error ? migErr.message : String(migErr);
            this.logger.debug(`Migration ${file} ignorée ou déjà appliquée: ${msg}`);
          }
        }
        break;
      }
    }
  }
}
