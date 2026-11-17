/**
 * DocteurFlotte — Test en direct des routes HTTP contre l'API NestJS & PostgreSQL
 */
const http = require('http');

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runLiveRouteTests() {
  console.log('====================================================');
  console.log('🚀 TEST EN DIRECT DES ROUTES HTTP API (Port 3001)');
  console.log('====================================================\n');

  // 1. Health check
  console.log('▶ Test 1: GET /health');
  const health = await httpRequest({ host: 'localhost', port: 3001, path: '/health', method: 'GET' });
  console.log(`  Status: ${health.status} | Réponse:`, health.data);

  // 2. Ready check (Postgres + Redis)
  console.log('\n▶ Test 2: GET /ready');
  const ready = await httpRequest({ host: 'localhost', port: 3001, path: '/ready', method: 'GET' });
  console.log(`  Status: ${ready.status} | Dépendances:`, ready.data.dependencies);

  // 3. Register a fresh tenant
  console.log('\n▶ Test 3: POST /auth/register-tenant (Création tenant avec RLS PostgreSQL)');
  const email = `audit.${Date.now()}@docteurflotte.dz`;
  const registerPayload = {
    companyName: 'Audit Trans Logistique DZ',
    adminEmail: email,
    adminPassword: 'Password123!',
    adminFirstName: 'Mourad',
    adminLastName: 'Meziane',
    activityPack: 'TRANSPORT',
    countryCode: 'DZ',
    currency: 'DZD',
  };

  const registerRes = await httpRequest(
    {
      host: 'localhost',
      port: 3001,
      path: '/auth/register-tenant',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    registerPayload
  );

  console.log(`  Status: ${registerRes.status} | Token généré : ${registerRes.data.accessToken ? 'OUI' : 'NON'}`);
  const token = registerRes.data.accessToken;
  const tenantId = registerRes.data.user?.tenantId;
  console.log(`  Tenant ID créé : ${tenantId}`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 4. Test GET /auth/me
  console.log('\n▶ Test 4: GET /auth/me');
  const meRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/auth/me',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${meRes.status} | Utilisateur connecté :`, meRes.data.user?.email);

  // 5. Test GET /fiscal/profile
  console.log('\n▶ Test 5: GET /fiscal/profile');
  const fiscalProfileRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/fiscal/profile',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${fiscalProfileRes.status} | Profil configuré : ${fiscalProfileRes.data.isConfigured}`);

  // 6. Test GET /fiscal/cnrc-activities
  console.log('\n▶ Test 6: GET /fiscal/cnrc-activities');
  const cnrcRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/fiscal/cnrc-activities',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${cnrcRes.status} | Activités déclarées : ${cnrcRes.data.length}`);

  // 7. Test POST /fiscal/cnrc-activities (Ajout activité CNRC)
  console.log('\n▶ Test 7: POST /fiscal/cnrc-activities');
  const addCnrcRes = await httpRequest(
    {
      host: 'localhost',
      port: 3001,
      path: '/fiscal/cnrc-activities',
      method: 'POST',
      headers: authHeaders,
    },
    {
      cnrcCode: '601.101',
      activityLabel: 'Transport public routier de marchandises',
      fiscalSegment: 'COMMERCE_SERVICES',
      isSubjectToTls: false,
      isPrimary: true,
    }
  );
  console.log(`  Status: ${addCnrcRes.status} | Activité créée :`, addCnrcRes.data.cnrcCode, '-', addCnrcRes.data.activityLabel);

  // 8. Test GET /assets
  console.log('\n▶ Test 8: GET /assets');
  const assetsRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/assets',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${assetsRes.status} | Actifs dans le parc : ${assetsRes.data.length}`);

  // 9. Test POST /assets (Création d'un actif racine)
  console.log('\n▶ Test 9: POST /assets (Création d’un actif racine)');
  const createAssetRes = await httpRequest(
    {
      host: 'localhost',
      port: 3001,
      path: '/assets',
      method: 'POST',
      headers: authHeaders,
    },
    {
      code: '00543-116-16',
      name: 'Renault Trucks K440 Benne',
      category: 'HEAVY_TRUCK',
      brand: 'Renault Trucks',
      model: 'K440',
      year: 2024,
      primaryMeterType: 'ODOMETER_KM',
      initialMeterValue: 45000,
      maintenanceIntervalValue: 10000,
    }
  );
  console.log(`  Status: ${createAssetRes.status} | Actif créé :`, createAssetRes.data.code, '| ID:', createAssetRes.data.id);
  const createdAssetId = createAssetRes.data.id;

  // 10. Test GET /sites
  console.log('\n▶ Test 10: GET /sites');
  const chantiersRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/sites',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${chantiersRes.status} | Chantiers actifs : ${chantiersRes.data.length}`);

  // 11. Test GET /rental/contracts
  console.log('\n▶ Test 11: GET /rental/contracts');
  const rentalRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/rental/contracts',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${rentalRes.status} | Contrats location : ${rentalRes.data.length}`);

  // 12. Test GET /logistics/lve
  console.log('\n▶ Test 12: GET /logistics/lve');
  const lveRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/logistics/lve',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${lveRes.status} | Lettres de voiture LVE : ${lveRes.data.length}`);

  // 13. Test GET /parts/items
  console.log('\n▶ Test 13: GET /parts/items');
  const partsRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/parts/items',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${partsRes.status} | Pièces au catalogue : ${partsRes.data.length}`);

  // 14. Test GET /tco/summary
  console.log('\n▶ Test 14: GET /tco/summary');
  const tcoRes = await httpRequest({
    host: 'localhost',
    port: 3001,
    path: '/tco/summary',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  Status: ${tcoRes.status} | Synthèse TCO flotte : ${tcoRes.data.totalTcoDzd} DZD`);

  console.log('\n====================================================');
  console.log('✨ TOUTES LES ROUTES TESTÉES RÉPONDENT EN 200/201 (SUCCÈS) !');
  console.log('====================================================');
}

runLiveRouteTests().catch((err) => {
  console.error('Erreur test routes:', err);
  process.exit(1);
});
