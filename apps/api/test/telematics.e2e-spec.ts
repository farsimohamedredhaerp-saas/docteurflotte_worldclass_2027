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
} from '@docteurflotte/contracts';

describe('Telematics Traccar & Fleet Live Isolation (e2e)', () => {
  jest.setTimeout(45000);
  let app: INestApplication;
  let databaseService: DatabaseService;

  let tenantAId: string;
  let tokenA: string;
  let assetAId: string;
  let deviceAId: string;
  let bindingAId: string;

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

    // 1. Tenant A (Flotte Logistique Est)
    const resA = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Logistique Est ${timestamp}`,
        adminEmail: `logistique.est.${timestamp}@flotte.dz`,
        adminPassword: 'PasswordEst2027!',
        adminFirstName: 'Yacine',
        adminLastName: 'Logistique',
        activityPack: ActivityPack.TRANSPORT,
      });

    expect(resA.status).toBe(201);
    tenantAId = resA.body.tenant.id;
    tokenA = resA.body.accessToken;

    // 2. Tenant B (Flotte Ouest)
    const resB = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Flotte Ouest ${timestamp}`,
        adminEmail: `flotte.ouest.${timestamp}@flotte.dz`,
        adminPassword: 'PasswordOuest2027!',
        adminFirstName: 'Nabil',
        adminLastName: 'Ouest',
        activityPack: ActivityPack.CONSTRUCTION,
      });

    expect(resB.status).toBe(201);
    tenantBId = resB.body.tenant.id;
    tokenB = resB.body.accessToken;

    // 3. Créer un actif pour Tenant A avec seuil préventif à 50 000 km
    const assetRes = await request(app.getHttpServer())
      .post('/assets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Renault T480 Télématique',
        code: `RN-${timestamp}`,
        category: AssetCategory.HEAVY_TRUCK,
        primaryMeterType: MeterType.ODOMETER_KM,
        initialMeterValue: 48500,
        maintenanceIntervalValue: 1500, // Seuil révision = 50 000 km
      });

    expect(assetRes.status).toBe(201);
    assetAId = assetRes.body.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Tenant A enregistre un terminal GPS Traccar', async () => {
    const res = await request(app.getHttpServer())
      .post('/telematics/devices')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        uniqueId: '864200050011223',
        name: 'Boîtier GPS Renault T480',
        model: 'Teltonika FMB920',
      });

    expect(res.status).toBe(201);
    expect(res.body.uniqueId).toBe('864200050011223');
    deviceAId = res.body.id;
  });

  it('2. Tenant A appaire le boîtier GPS à son actif opérationnel', async () => {
    const res = await request(app.getHttpServer())
      .post('/telematics/bindings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        assetId: assetAId,
        deviceId: deviceAId,
      });

    expect(res.status).toBe(201);
    expect(res.body.isActive).toBe(true);
    expect(res.body.assetId).toBe(assetAId);
    expect(res.body.deviceId).toBe(deviceAId);
    bindingAId = res.body.id;
  });

  it('3. Ingestion de position normale avec mise à jour du compteur kilométrique', async () => {
    const res = await request(app.getHttpServer())
      .post('/telematics/positions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        traccarPositionId: 'POS-DZ-001',
        uniqueId: '864200050011223',
        latitude: 36.7538,
        longitude: 3.0588,
        speed: 78.5,
        ignition: true,
        odometerKm: 49200, // Progrès kilométrique normal (inférieur au seuil de 50 000)
        recordedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.duplicate).toBe(false);
    expect(res.body.assetUpdated.newMeterValue).toBe(49200);
    expect(res.body.assetUpdated.maintenanceTriggered).toBe(false);
  });

  it('4. Test d Idempotence : Renvoyer la même position (POS-DZ-001) ne crée aucun doublon', async () => {
    const res = await request(app.getHttpServer())
      .post('/telematics/positions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        traccarPositionId: 'POS-DZ-001',
        uniqueId: '864200050011223',
        latitude: 36.7538,
        longitude: 3.0588,
        speed: 78.5,
        ignition: true,
        odometerKm: 49200,
        recordedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.duplicate).toBe(true);
  });

  it('5. Ingestion franchissant le seuil préventif (50 150 km >= 50 000 km) -> Déclenchement automatique d OT préventif', async () => {
    const res = await request(app.getHttpServer())
      .post('/telematics/positions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        traccarPositionId: 'POS-DZ-002',
        uniqueId: '864200050011223',
        latitude: 36.7545,
        longitude: 3.0612,
        speed: 82.0,
        ignition: true,
        odometerKm: 50150, // Franchit les 50 000 km
        recordedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.duplicate).toBe(false);
    expect(res.body.assetUpdated.maintenanceTriggered).toBe(true);

    // Vérifier l'actif : son statut est passé à MAINTENANCE_REQUIRED
    const assetCheck = await request(app.getHttpServer())
      .get(`/assets/${assetAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(assetCheck.status).toBe(200);
    expect(assetCheck.body.status).toBe(AssetStatus.MAINTENANCE_REQUIRED);
    expect(Number(assetCheck.body.currentMeterValue)).toBe(50150);

    // Vérifier les ordres de travail : un OT préventif a été créé
    const wos = await request(app.getHttpServer())
      .get('/work-orders')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(wos.status).toBe(200);
    const triggeredWo = wos.body.find((w: any) => w.assetId === assetAId);
    expect(triggeredWo).toBeDefined();
    expect(triggeredWo.title).toContain('Révision Préventive Télématique');
  });

  it('6. Consultation Fleet Live : Renvoie la position GPS, vitesse et statut de contact de l actif', async () => {
    const res = await request(app.getHttpServer())
      .get('/telematics/fleet-live')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const assetLive = res.body.find((a: any) => a.assetId === assetAId);
    expect(assetLive).toBeDefined();
    expect(assetLive.deviceUniqueId).toBe('864200050011223');
    expect(assetLive.latitude).toBeCloseTo(36.7545, 3);
    expect(assetLive.longitude).toBeCloseTo(3.0612, 3);
    expect(assetLive.speed).toBe(82.0);
    expect(assetLive.ignition).toBe(true);
    expect(assetLive.maintenanceDue).toBe(true);
  });

  it('7. Isolation Multi-Tenant RLS Stricte : Le Tenant B ne voit AUCUN boîtier ni position du Tenant A', async () => {
    // Tenant B consulte les devices
    const devicesB = await request(app.getHttpServer())
      .get('/telematics/devices')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(devicesB.status).toBe(200);
    expect(devicesB.body.some((d: any) => d.id === deviceAId)).toBe(false);

    // Tenant B consulte les bindings
    const bindingsB = await request(app.getHttpServer())
      .get('/telematics/bindings')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(bindingsB.status).toBe(200);
    expect(bindingsB.body.some((b: any) => b.id === bindingAId)).toBe(false);

    // Tenant B consulte Fleet Live
    const fleetLiveB = await request(app.getHttpServer())
      .get('/telematics/fleet-live')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(fleetLiveB.status).toBe(200);
    expect(fleetLiveB.body.some((a: any) => a.assetId === assetAId)).toBe(false);
  });
});
