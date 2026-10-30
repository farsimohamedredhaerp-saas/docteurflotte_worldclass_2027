import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponse,
  AuthUser,
  DataOrigin,
  TenantStatus,
  UserRole,
  resolveCountryPack,
} from '@docteurflotte/contracts';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Enregistre une nouvelle organisation (Tenant), son premier administrateur,
   * et initialise ses paramètres régionaux et économiques dynamiques dans une transaction sécurisée.
   */
  async registerTenant(dto: RegisterTenantDto): Promise<AuthResponse> {
    const strength = this.passwordService.validateStrength(dto.adminPassword);
    if (!strength.isValid) {
      throw new BadRequestException(strength.message);
    }

    const baseSlug = this.generateSlug(dto.companyName);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const passwordHash = await this.passwordService.hashPassword(dto.adminPassword);

    const countryCode = (dto.countryCode || 'DZ').toUpperCase();
    const countryPack = resolveCountryPack(countryCode, dto.currency);
    const currency = (dto.currency || countryPack.currency).toUpperCase();

    const pool = this.databaseService.getPool();
    if (!pool) {
      throw new Error('Base de données PostgreSQL indisponible.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Création du Tenant (initialisé en DEMO avant onboarding Setup, conformément aux tests E2E)
      const tenantRes = await client.query(
        `INSERT INTO tenants (name, slug, activity_pack, country_code, currency, data_origin, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, slug, activity_pack, country_code, currency, data_origin, status, created_at, updated_at`,
        [
          dto.companyName.trim(),
          slug,
          dto.activityPack,
          countryCode,
          currency,
          DataOrigin.DEMO,
          TenantStatus.PENDING_SETUP,
        ],
      );
      const tenant = tenantRes.rows[0];

      // Configuration RLS locale pour la transaction
      await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenant.id]);

      // 2. Création de l'utilisateur Administrateur du Tenant
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, tenant_id, email, first_name, last_name, role, is_active, created_at`,
        [
          tenant.id,
          dto.adminEmail.toLowerCase().trim(),
          passwordHash,
          dto.adminFirstName.trim(),
          dto.adminLastName.trim(),
          UserRole.TENANT_ADMIN,
          true,
        ],
      );
      const user = userRes.rows[0];

      // 3. Initialisation des paramètres de Tenant selon le Pack Pays
      await client.query(
        `INSERT INTO tenant_settings (tenant_id, activity_pack, measurement_system, currency, is_setup_completed)
         VALUES ($1, $2, $3, $4, $5)`,
        [tenant.id, dto.activityPack, countryPack.measurementSystem, currency, false],
      );

      await client.query('COMMIT');

      const authUser: AuthUser = {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role as UserRole,
        isActive: user.is_active,
        createdAt: user.created_at.toISOString(),
      };

      const accessToken = this.tokenService.sign({
        sub: user.id,
        tenantId: tenant.id,
        email: user.email,
        role: user.role as UserRole,
      });

      return {
        accessToken,
        user: authUser,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status as TenantStatus,
          activityPack: tenant.activity_pack,
          isSetupCompleted: false,
        },
      };
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('uq_tenant_user_email') || msg.includes('duplicate key')) {
        throw new ConflictException('Un compte existe déjà pour cette entreprise ou cet email.');
      }
      this.logger.error(`Erreur lors de l'enregistrement du tenant: ${msg}`);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Authentifie un utilisateur, vérifie son mot de passe et génère un jeton JWT.
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();

    let queryText = `
      SELECT u.id, u.tenant_id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.is_active, u.created_at,
             t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status, t.activity_pack,
             s.is_setup_completed
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      LEFT JOIN tenant_settings s ON s.tenant_id = t.id
      WHERE u.email = $1
    `;
    const params: any[] = [email];

    if (dto.tenantSlug) {
      queryText += ' AND t.slug = $2';
      params.push(dto.tenantSlug.trim());
    }

    queryText += ' ORDER BY u.created_at DESC';

    const res =
      typeof (this.databaseService as any).withSystemContext === 'function'
        ? await (this.databaseService as any).withSystemContext((client: any) =>
            client.query(queryText, params),
          )
        : await this.databaseService.query(queryText, params);

    if (res.rowCount === 0) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const row = res.rows[0];
    if (!row.is_active) {
      throw new UnauthorizedException('Compte utilisateur désactivé. Veuillez contacter votre administrateur.');
    }

    const isMatch = await this.passwordService.verifyPassword(dto.password, row.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const authUser: AuthUser = {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    };

    const accessToken = this.tokenService.sign({
      sub: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      role: row.role as UserRole,
    });

    return {
      accessToken,
      user: authUser,
      tenant: {
        id: row.tenant_id,
        name: row.tenant_name,
        slug: row.tenant_slug,
        status: row.tenant_status as TenantStatus,
        activityPack: row.activity_pack,
        isSetupCompleted: Boolean(row.is_setup_completed),
      },
    };
  }

  /**
   * Retourne le profil utilisateur et son organisation dans le contexte tenant validé.
   */
  async getProfile(userId: string, tenantId: string): Promise<{ user: AuthUser; tenant: any }> {
    return this.databaseService.withTenantContext(tenantId, async (client) => {
      const userRes = await client.query(
        `SELECT id, tenant_id, email, first_name, last_name, role, is_active, created_at
         FROM users WHERE id = $1`,
        [userId],
      );

      if (userRes.rowCount === 0) {
        throw new NotFoundException('Utilisateur introuvable dans ce tenant.');
      }

      const tenantRes = await client.query(
        `SELECT t.*, s.is_setup_completed, s.measurement_system
         FROM tenants t
         LEFT JOIN tenant_settings s ON s.tenant_id = t.id
         WHERE t.id = $1`,
        [tenantId],
      );

      const user = userRes.rows[0];
      const tenant = tenantRes.rows[0];

      return {
        user: {
          id: user.id,
          tenantId: user.tenant_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at.toISOString(),
        },
        tenant,
      };
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    const res = await this.databaseService.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [baseSlug],
    );
    if (res.rowCount === 0) {
      return baseSlug;
    }
    const suffix = crypto.randomBytes(2).toString('hex');
    return `${baseSlug}-${suffix}`;
  }
}
