import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { ActivityPack } from '@docteurflotte/contracts';

describe('Multi-Tenant RLS & Inter-Tenant Isolation (e2e)', () => {
  jest.setTimeout(45000);
  let app: INestApplication;
  let databaseService: DatabaseService;

  let tenantAId: string;
  let tokenA: string;
  let emailA: string;

  let tenantBId: string;
  let tokenB: string;
  let emailB: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    emailA = `tenant.a.${timestamp}@flotte.dz`;
    emailB = `tenant.b.${timestamp}@flotte.dz`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    databaseService = app.get<DatabaseService>(DatabaseService);

    // 1. Enregistrement Tenant A
    const resA = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Entreprise Alpha ${timestamp}`,
        adminEmail: emailA,
        adminPassword: 'PasswordAlpha2027!',
        adminFirstName: 'Karim',
        adminLastName: 'Alpha',
        activityPack: ActivityPack.TRANSPORT,
      });

    expect(resA.status).toBe(201);
    tenantAId = resA.body.tenant.id;
    tokenA = resA.body.accessToken;

    // 2. Enregistrement Tenant B
    const resB = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Entreprise Beta ${timestamp}`,
        adminEmail: emailB,
        adminPassword: 'PasswordBeta2027!',
        adminFirstName: 'Nadia',
        adminLastName: 'Beta',
        activityPack: ActivityPack.CONSTRUCTION,
      });

    expect(resB.status).toBe(201);
    tenantBId = resB.body.tenant.id;
    tokenB = resB.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Isolation au niveau API (Controllers & Guards)', () => {
    it('Tenant A ne peut accéder qu’à son propre profil et organisation', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.user.email).toBe(emailA);
      expect(res.body.tenant.id).toBe(tenantAId);
      expect(res.body.tenant.id).not.toBe(tenantBId);
    });

    it('Tenant B ne peut accéder qu’à son propre profil et organisation', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body.user.email).toBe(emailB);
      expect(res.body.tenant.id).toBe(tenantBId);
      expect(res.body.tenant.id).not.toBe(tenantAId);
    });

    it('Tenant A exécutant un setup ne modifie jamais les paramètres de Tenant B', async () => {
      await request(app.getHttpServer())
        .post('/tenants/setup')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          activityPack: ActivityPack.LIGHT_VEHICLES,
          measurementSystem: 'METRIC',
          currency: 'DZD',
          enableDemoData: true,
        })
        .expect(200);

      // Vérifier que Tenant B a conservé son pack initial intact (CONSTRUCTION)
      const resB = await request(app.getHttpServer())
        .get('/tenants/current')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(resB.body.tenant.activityPack).toBe(ActivityPack.CONSTRUCTION);
    });
  });

  describe('Étanchéité PostgreSQL Row-Level Security (RLS)', () => {
    it('Fail-Closed : Une session sans contexte tenant ne voit aucun utilisateur', async () => {
      const pool = databaseService.getPool();
      if (!pool) return;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE df_tenant_role');
        // Contexte délibérément vide ou non initialisé
        await client.query("SELECT set_config('app.current_tenant_id', '', true)");
        const res = await client.query('SELECT * FROM users');
        await client.query('ROLLBACK');

        expect(res.rowCount).toBe(0);
      } finally {
        client.release();
      }
    });

    it('Sous contexte Tenant A, la table users ne renvoie strictement QUE les utilisateurs de Tenant A', async () => {
      const usersA = await databaseService.withTenantContext(tenantAId, async (client) => {
        const res = await client.query('SELECT id, email, tenant_id FROM users');
        return res.rows;
      });

      expect(usersA.length).toBeGreaterThan(0);
      // Tous les utilisateurs renvoyés appartiennent exclusivement à Tenant A
      for (const u of usersA) {
        expect(u.tenant_id).toBe(tenantAId);
        expect(u.tenant_id).not.toBe(tenantBId);
      }
    });

    it('Tenant A ne peut ni modifier ni corrompre les utilisateurs de Tenant B sous RLS', async () => {
      const affectedRows = await databaseService.withTenantContext(tenantAId, async (client) => {
        // Tentative malveillante de Tenant A d'altérer un compte de Tenant B
        const res = await client.query(
          "UPDATE users SET email = 'corrupted@exploit.dz' WHERE tenant_id = $1",
          [tenantBId],
        );
        return res.rowCount;
      });

      // Strictement 0 ligne affectée grâce à la politique RLS Fail-Closed
      expect(affectedRows).toBe(0);
    });
  });
});
