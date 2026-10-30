import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { ActivityPack, DataOrigin } from '@docteurflotte/contracts';

describe('Tenant Settings & Dynamic Customization Isolation (e2e)', () => {
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
    emailA = `settings.a.${timestamp}@flotte.dz`;
    emailB = `settings.b.${timestamp}@flotte.dz`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    databaseService = app.get<DatabaseService>(DatabaseService);

    // 1. Enregistrement Tenant A
    const resA = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Société Alpha Logistics ${timestamp}`,
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
        companyName: `Société Beta BTP ${timestamp}`,
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

  describe('GET /tenants/settings', () => {
    it('Doit refuser un accès non authentifié (401)', async () => {
      await request(app.getHttpServer())
        .get('/tenants/settings')
        .expect(401);
    });

    it('Doit renvoyer les paramètres par défaut du Tenant A', async () => {
      const res = await request(app.getHttpServer())
        .get('/tenants/settings')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.tenantId).toBe(tenantAId);
      expect(res.body.currency).toBe('DZD');
      expect(res.body.alertThresholds).toBeDefined();
      expect(res.body.alertThresholds.maintenanceWarningKm).toBe(1000);
      expect(res.body.alertThresholds.maintenanceWarningHours).toBe(50);
      expect(res.body.economicRates).toBeDefined();
      expect(res.body.economicRates.hourlyLaborRate).toBe(1500);
    });
  });

  describe('PUT /tenants/settings — Validation & Mise à jour sans constante en dur', () => {
    it('Doit rejeter des valeurs économiques ou seuils négatifs avec HTTP 400', async () => {
      // Test taux horaire négatif
      await request(app.getHttpServer())
        .put('/tenants/settings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          economicRates: {
            hourlyLaborRate: -500,
          },
        })
        .expect(400);

      // Test seuil d alerte km négatif
      await request(app.getHttpServer())
        .put('/tenants/settings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          alertThresholds: {
            maintenanceWarningKm: -100,
          },
        })
        .expect(400);
    });

    it('Tenant A personnalise ses seuils opérationnels et barèmes économiques', async () => {
      const payloadA = {
        currency: 'EUR',
        alertThresholds: {
          maintenanceWarningKm: 3500,
          maintenanceWarningHours: 180,
          inspectionDaysNotice: 25,
          odometerRollbackToleranceKm: 15,
        },
        economicRates: {
          hourlyLaborRate: 2800,
          approvalExpenseThreshold: 120000,
          inactionRiskMultiplier: 3.5,
          referenceFuelPricePerLiter: 42,
        },
        branding: {
          displayName: 'Alpha Logistics Algérie',
        },
      };

      const resA = await request(app.getHttpServer())
        .put('/tenants/settings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payloadA)
        .expect(200);

      expect(resA.body.currency).toBe('EUR');
      expect(resA.body.alertThresholds.maintenanceWarningKm).toBe(3500);
      expect(resA.body.alertThresholds.maintenanceWarningHours).toBe(180);
      expect(resA.body.alertThresholds.inspectionDaysNotice).toBe(25);
      expect(resA.body.alertThresholds.odometerRollbackToleranceKm).toBe(15);
      expect(resA.body.economicRates.hourlyLaborRate).toBe(2800);
      expect(resA.body.economicRates.inactionRiskMultiplier).toBe(3.5);
      expect(resA.body.branding.displayName).toBe('Alpha Logistics Algérie');
    });

    it('Strict Inter-Tenant Isolation : Les modifications de Tenant A n affectent PAS Tenant B', async () => {
      // Consultation par Tenant B
      const resB = await request(app.getHttpServer())
        .get('/tenants/settings')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(resB.body.tenantId).toBe(tenantBId);
      // Devise par défaut de Tenant B inchangée
      expect(resB.body.currency).toBe('DZD');
      // Les seuils de Tenant B doivent être ses valeurs d origine (non impactées par 3500 km ou 2800 DZD d Alpha)
      expect(resB.body.alertThresholds.maintenanceWarningKm).toBe(1000);
      expect(resB.body.alertThresholds.maintenanceWarningHours).toBe(50);
      expect(resB.body.alertThresholds.inspectionDaysNotice).toBe(15);
      expect(resB.body.economicRates.hourlyLaborRate).toBe(1500);
      expect(resB.body.economicRates.inactionRiskMultiplier).toBe(3.5);
    });
  });

  describe('POST /tenants/purge-demo — Purge étanche des données de démonstration', () => {
    it('Tenant A exécute la purge de ses données de démonstration', async () => {
      const purgeRes = await request(app.getHttpServer())
        .post('/tenants/purge-demo')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(purgeRes.body.success).toBe(true);
      expect(purgeRes.body.dataOrigin).toBe(DataOrigin.USER_ENTRY);
    });

    it('La purge de Tenant A bascule son data_origin sans altérer le statut de démonstration de Tenant B', async () => {
      // Vérification base directe de Tenant A sur la table tenants
      const tenantARow = await databaseService.withTenantContext(tenantAId, async (client) => {
        const res = await client.query('SELECT data_origin FROM tenants WHERE id = $1', [tenantAId]);
        return res.rows[0];
      });
      expect(tenantARow.data_origin).toBe(DataOrigin.USER_ENTRY);

      // Vérification base directe de Tenant B sur la table tenants
      const tenantBRow = await databaseService.withTenantContext(tenantBId, async (client) => {
        const res = await client.query('SELECT data_origin FROM tenants WHERE id = $1', [tenantBId]);
        return res.rows[0];
      });
      expect(tenantBRow.data_origin).toBe(DataOrigin.DEMO);

      // Tentative de modification illégitime de Tenant B par Tenant A sous RLS
      const illegalUpdate = await databaseService.withTenantContext(tenantAId, async (client) => {
        const res = await client.query(
          "UPDATE tenant_settings SET currency = 'HACKED' WHERE tenant_id = $1",
          [tenantBId],
        );
        return res.rowCount;
      });
      expect(illegalUpdate).toBe(0);
    });
  });
});
