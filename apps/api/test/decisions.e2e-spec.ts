import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import {
  ActivityPack,
  AssetCategory,
  DecisionStatus,
  MeterSource,
  MeterType,
} from '@docteurflotte/contracts';

describe('Decisions & Economics Governance Isolation (e2e)', () => {
  jest.setTimeout(45000);
  let app: INestApplication;

  let tenantAId: string;
  let tokenA: string;
  let assetAId: string;
  let decisionAId: string;

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

    // 1. Tenant A (Transport Express)
    const resA = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `Express Décisionnel ${timestamp}`,
        adminEmail: `express.decision.${timestamp}@flotte.dz`,
        adminPassword: 'PasswordExp2027!',
        adminFirstName: 'Samir',
        adminLastName: 'Express',
        activityPack: ActivityPack.TRANSPORT,
      });

    expect(resA.status).toBe(201);
    tenantAId = resA.body.tenant.id;
    tokenA = resA.body.accessToken;

    // 2. Tenant B (BTP Centre)
    const resB = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        companyName: `BTP Centre ${timestamp}`,
        adminEmail: `btp.centre.${timestamp}@flotte.dz`,
        adminPassword: 'PasswordBtp2027!',
        adminFirstName: 'Mourad',
        adminLastName: 'Centre',
        activityPack: ActivityPack.CONSTRUCTION,
      });

    expect(resB.status).toBe(201);
    tenantBId = resB.body.tenant.id;
    tokenB = resB.body.accessToken;

    // 3. Créer un actif pour Tenant A (seuil projeté à 120 000 km)
    const assetRes = await request(app.getHttpServer())
      .post('/assets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Tracteur Décisionnel R450',
        code: `DEC-${timestamp}`,
        category: AssetCategory.HEAVY_TRUCK,
        primaryMeterType: MeterType.ODOMETER_KM,
        initialMeterValue: 100000,
        maintenanceIntervalValue: 20000, // Prochaine échéance = 120 000 km
      });

    expect(assetRes.status).toBe(201);
    assetAId = assetRes.body.id;

    // 4. Enregistrer un relevé de compteur à 121 500 km (échéance dépassée de 1 500 km)
    const meterRes = await request(app.getHttpServer())
      .post(`/assets/${assetAId}/readings`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        meterType: MeterType.ODOMETER_KM,
        value: 121500,
        source: MeterSource.MANUAL,
      });

    expect(meterRes.status).toBe(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Évaluation décisionnelle : Détecte l actif en retard et génère un arbitrage chiffré', async () => {
    const res = await request(app.getHttpServer())
      .post('/decisions/evaluate')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const dec = res.body.find((d: any) => d.assetId === assetAId);
    expect(dec).toBeDefined();
    expect(dec.urgency).toBe('danger');
    expect(dec.estimatedActionCost).toBeGreaterThan(0);
    expect(dec.costInactionRisk).toBeGreaterThan(dec.estimatedActionCost);
    expect(dec.netExpectedSavings).toBe(dec.costInactionRisk - dec.estimatedActionCost);
    expect(dec.confidenceScore).toBe(98);
    decisionAId = dec.id;
  });

  it('2. Approbation de la décision : Marque APPROVED et génère automatiquement l Ordre de Travail budgété', async () => {
    const res = await request(app.getHttpServer())
      .post(`/decisions/${decisionAId}/approve`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        assignedTo: 'Atelier Principal Oran',
        notes: 'Approuvé en comité de gestion hebdomadaire.',
      });

    expect(res.status).toBe(201);
    expect(res.body.decision.status).toBe(DecisionStatus.APPROVED);
    expect(res.body.workOrderId).toBeDefined();

    // Vérifier l'ordre de travail dans le module maintenance
    const wos = await request(app.getHttpServer())
      .get('/work-orders')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(wos.status).toBe(200);
    const linkedWo = wos.body.find((w: any) => w.id === res.body.workOrderId);
    expect(linkedWo).toBeDefined();
    expect(linkedWo.title).toContain('OT Arbitré');
  });

  it('3. Contrôle de gestion : Enregistrement d un budget et calcul du rapport d écarts', async () => {
    // Définir un budget prévisionnel de 2 000 000 DA
    const budgetRes = await request(app.getHttpServer())
      .post('/decisions/budgets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        periodYear: 2026,
        budgetAmount: 2000000,
        allocatedCategory: 'Poids Lourds',
      });

    expect(budgetRes.status).toBe(201);

    // Récupérer le rapport d'écarts
    const varianceRes = await request(app.getHttpServer())
      .get('/decisions/budget-variance?year=2026')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(varianceRes.status).toBe(200);
    expect(varianceRes.body.totalBudget).toBe(2000000);
    expect(varianceRes.body.periodYear).toBe(2026);
    expect(varianceRes.body.currency).toBeDefined();
    expect(Array.isArray(varianceRes.body.categories)).toBe(true);
  });

  it('4. Isolation Multi-Tenant RLS Stricte : Le Tenant B ne voit aucune décision ni budget du Tenant A', async () => {
    const decisionsB = await request(app.getHttpServer())
      .get('/decisions')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(decisionsB.status).toBe(200);
    expect(decisionsB.body.some((d: any) => d.id === decisionAId)).toBe(false);

    // Tenant B ne peut pas approuver la décision de Tenant A
    const approveFail = await request(app.getHttpServer())
      .post(`/decisions/${decisionAId}/approve`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({});

    expect(approveFail.status).toBe(404);
  });
});
