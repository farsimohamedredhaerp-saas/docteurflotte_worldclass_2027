import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { ActivityPack } from '@docteurflotte/contracts';

describe('Auth & Tenant Lifecycle (e2e)', () => {
  jest.setTimeout(45000);
  let app: INestApplication;
  let testEmail: string;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    testEmail = `test.e2e.${Date.now()}@flotte.dz`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. POST /auth/register-tenant (Rejet mot de passe faible)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: 'Flotte E2E Test',
        adminEmail: testEmail,
        adminPassword: '123', // Trop court
        adminFirstName: 'Karim',
        adminLastName: 'Meziane',
        activityPack: ActivityPack.TRANSPORT,
      });

    expect(res.status).toBe(400);
  });

  it('2. POST /auth/register-tenant (Création valide organisation et admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: 'Flotte E2E Test',
        adminEmail: testEmail,
        adminPassword: 'PasswordSecurise2027!',
        adminFirstName: 'Karim',
        adminLastName: 'Meziane',
        activityPack: ActivityPack.TRANSPORT,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toHaveProperty('email', testEmail);
    expect(res.body.user).toHaveProperty('role', 'TENANT_ADMIN');
    expect(res.body.tenant).toHaveProperty('name', 'Flotte E2E Test');
    expect(res.body.tenant.isSetupCompleted).toBe(false);

    authToken = res.body.accessToken;
    tenantId = res.body.tenant.id;
  });

  it('3. POST /auth/login (Authentification)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'PasswordSecurise2027!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('4. GET /auth/me (Accès protégé par Bearer JWT)', async () => {
    // Sans jeton -> 401
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    // Avec jeton valide -> 200
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.tenant.id).toBe(tenantId);
  });

  it('5. POST /tenants/setup (Configuration initiale & passage à ACTIVE)', async () => {
    const res = await request(app.getHttpServer())
      .post('/tenants/setup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        activityPack: ActivityPack.CONSTRUCTION,
        measurementSystem: 'METRIC',
        currency: 'DZD',
        enableDemoData: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tenant.status).toBe('ACTIVE');
    expect(res.body.settings.isSetupCompleted).toBe(true);
    expect(res.body.settings.activityPack).toBe(ActivityPack.CONSTRUCTION);
  });
});
