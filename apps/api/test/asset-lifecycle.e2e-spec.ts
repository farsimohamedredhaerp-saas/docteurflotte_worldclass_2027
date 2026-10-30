import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import {
  ActivityPack,
  AssetCategory,
  AssetStatus,
  MeterType,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@docteurflotte/contracts';

describe('Asset Lifecycle & Maintenance Core Isolation (e2e)', () => {
  jest.setTimeout(45000);
  let app: INestApplication;
  let databaseService: DatabaseService;

  let tenantAId: string;
  let tokenA: string;
  let assetAId: string;
  let generatedWoId: string;

  let tenantBId: string;
  let tokenB: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    databaseService = app.get<DatabaseService>(DatabaseService);

    // 1. Enregistrement Tenant A (Transporteur Alpha)
    const resA = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Transport Alpha ${timestamp}`,
        adminEmail: `transport.alpha.${timestamp}@flotte.dz`,
        adminPassword: 'PasswordAlpha2027!',
        adminFirstName: 'Karim',
        adminLastName: 'Alpha',
        activityPack: ActivityPack.TRANSPORT,
      });

    expect(resA.status).toBe(201);
    tenantAId = resA.body.tenant.id;
    tokenA = resA.body.accessToken;

    // 2. Enregistrement Tenant B (Chantier Beta)
    const resB = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Chantier Beta ${timestamp}`,
        adminEmail: `chantier.beta.${timestamp}@flotte.dz`,
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

  describe('1. Création et Inventaire des Actifs', () => {
    it('Tenant A crée un actif multi-métier avec compteur initial et révision projetée', async () => {
      const res = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Scania R450 Streamline',
          code: 'PL-16-042-DZ',
          category: AssetCategory.HEAVY_TRUCK,
          brand: 'Scania',
          model: 'R450',
          year: 2022,
          primaryMeterType: MeterType.ODOMETER_KM,
          initialMeterValue: 100000,
          maintenanceIntervalValue: 10000, // Révision tous les 10 000 km
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.tenantId).toBe(tenantAId);
      expect(res.body.currentMeterValue).toBe(100000);
      expect(res.body.nextMaintenanceMeterValue).toBe(110000);
      expect(res.body.status).toBe(AssetStatus.OPERATIONAL);

      assetAId = res.body.id;
    });

    it('Tenant A liste ses actifs et retrouve son Scania R450', async () => {
      const res = await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((a: any) => a.id === assetAId);
      expect(found).toBeDefined();
      expect(found.code).toBe('PL-16-042-DZ');
    });
  });

  describe('2. Détection d Anomalie Métrologique (Recul Odomètre)', () => {
    it('Rejette un recul kilométrique anormal avec alerte METER_ROLLBACK_DETECTED', async () => {
      // Relevé à 95 000 km alors que le compteur est à 100 000 km
      const res = await request(app.getHttpServer())
        .post(`/assets/${assetAId}/readings`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          meterType: MeterType.ODOMETER_KM,
          value: 95000,
        })
        .expect(201);

      expect(res.body.success).toBe(false);
      expect(res.body.rollbackDetected).toBe(true);
      expect(res.body.currentValue).toBe(100000); // Non altéré
      expect(res.body.reading.isValidated).toBe(false);
      expect(res.body.reading.validationError).toBe('METER_ROLLBACK_DETECTED');
    });
  });

  describe('3. Avancement Compteur & Déclenchement Automatique de Maintenance', () => {
    it('Franchit le seuil préventif (110 500 >= 110 000) et déclenche un Ordre de Travail', async () => {
      const res = await request(app.getHttpServer())
        .post(`/assets/${assetAId}/readings`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          meterType: MeterType.ODOMETER_KM,
          value: 110500,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.rollbackDetected).toBe(false);
      expect(res.body.maintenanceTriggered).toBe(true);
      expect(res.body.currentValue).toBe(110500);

      // Vérifier le changement d état de santé de l actif
      const assetRes = await request(app.getHttpServer())
        .get(`/assets/${assetAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(assetRes.body.status).toBe(AssetStatus.MAINTENANCE_REQUIRED);
    });

    it('Vérifie la présence de l Ordre de Travail généré pour Tenant A', async () => {
      const res = await request(app.getHttpServer())
        .get('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const generatedWo = res.body.find((wo: any) => wo.assetId === assetAId);
      expect(generatedWo).toBeDefined();
      expect(generatedWo.priority).toBe(WorkOrderPriority.HIGH);
      expect(generatedWo.status).toBe(WorkOrderStatus.SCHEDULED);
      expect(generatedWo.triggerMeterValue).toBe(110500);

      generatedWoId = generatedWo.id;
    });
  });

  describe('4. Clôture de l Ordre de Travail, Calcul des Coûts & Réarmement', () => {
    it('Clôture l OT, applique le barème dynamique du tenant, calcule le downtime et réarme l actif', async () => {
      // Barème par défaut du tenant = 1500 DA/h
      // 4 heures MO réelles + 20 000 DA de pièces + 6 heures downtime
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${generatedWoId}/complete`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          actualLaborHours: 4,
          partsCost: 20000,
          downtimeHours: 6,
          completionNotes: 'Vidange moteur, remplacement cartouche dessiccateur et filtre gazole.',
        })
        .expect(201);

      expect(res.body.status).toBe(WorkOrderStatus.COMPLETED);
      expect(res.body.actualLaborHours).toBe(4);
      expect(res.body.laborCost).toBe(6000); // 4h * 1500 DA
      expect(res.body.partsCost).toBe(20000);
      expect(res.body.totalCost).toBe(26000); // 6000 + 20000
      expect(res.body.downtimeHours).toBe(6);

      // Vérifier que l actif est réarmé à OPERATIONAL avec nouvelle révision projetée
      const assetRes = await request(app.getHttpServer())
        .get(`/assets/${assetAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(assetRes.body.status).toBe(AssetStatus.OPERATIONAL);
      // Nouveau seuil projeté = 110 500 + 10 000 = 120 500 km
      expect(assetRes.body.nextMaintenanceMeterValue).toBe(120500);
    });
  });

  describe('5. Étanchéité Multi-Tenant PostgreSQL RLS Absolue', () => {
    it('Tenant B ne voit aucun actif du Tenant A via l API', async () => {
      const resB = await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      // Tenant B n a créé aucun actif, il doit voir un tableau vide
      expect(resB.body.length).toBe(0);
    });

    it('Tenant B ne voit aucun ordre de travail du Tenant A via l API', async () => {
      const resB = await request(app.getHttpServer())
        .get('/work-orders')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(resB.body.length).toBe(0);
    });

    it('Sous contexte PostgreSQL RLS df_tenant_role, Tenant B ne peut ni lire ni corrompre l actif de Tenant A', async () => {
      // 1. Lecture RLS directe sous contexte Tenant B
      const assetsSeenByB = await databaseService.withTenantContext(tenantBId, async (client) => {
        const res = await client.query('SELECT * FROM assets WHERE id = $1', [assetAId]);
        return res.rows;
      });
      expect(assetsSeenByB.length).toBe(0);

      // 2. Tentative de corruption malveillante sous contexte Tenant B
      const rowsCorrupted = await databaseService.withTenantContext(tenantBId, async (client) => {
        const res = await client.query(
          "UPDATE assets SET name = 'CORRUPTED_BY_B' WHERE id = $1",
          [assetAId],
        );
        return res.rowCount;
      });
      expect(rowsCorrupted).toBe(0);
    });
  });
});
