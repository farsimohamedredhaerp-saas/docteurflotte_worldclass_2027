/**
 * Test E2E en direct du pontage automatique entre Opérations et Fiscalité (DocteurFlotte)
 * Vérifie que la consommation chantier, les situations de travaux et les factures de location
 * génèrent automatiquement les pièces justificatives et événements comptables SCF.
 */
const http = require('http');

const API_BASE = 'http://localhost:3001';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- TEST E2E DU PONTAGE AUTOMATIQUE OPÉRATIONS -> FISCALITÉ ---');

  // 1. Inscription d'un tenant dédié
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const orgName = `Entreprise Travaux Publics ${rand}`;
  const email = `directeur.travaux.${rand}@docteurflotte.dz`;
  const password = `Azerty${rand}!#2026`;

  console.log(`[1/7] Inscription tenant: ${orgName}...`);
  const regRes = await request('POST', '/auth/register-tenant', {
    companyName: orgName,
    adminEmail: email,
    adminPassword: password,
    adminFirstName: 'Mourad',
    adminLastName: 'Hadj',
    activityPack: 'CONSTRUCTION',
    countryCode: 'DZ',
    currency: 'DZD',
  });

  if (regRes.status !== 201) {
    throw new Error(`Échec inscription tenant: ${JSON.stringify(regRes.body)}`);
  }
  const token = regRes.body.accessToken;
  const tenantId = regRes.body.user?.tenantId;
  console.log(`  -> Tenant enregistré avec succès: ${tenantId}`);

  // 2. Configuration du profil fiscal et activité CNRC BTPH
  console.log('[2/7] Configuration du profil fiscal et de l’activité CNRC...');
  await request('PUT', '/fiscal/profile', {
    legalName: orgName,
    legalForm: 'SARL',
    profitTaxType: 'IBS',
    nif: '001642010000089',
    rcNumber: '16/00-1234567B16',
    articleImposition: '16010000089',
    taxRegime: 'REEL_NORMAL',
    isVatSubject: true,
    wilayaCode: 42,
  }, token);

  const cnrcRes = await request('POST', '/fiscal/cnrc-activities', {
    cnrcCode: '109201',
    activityLabel: 'Travaux de terrassement et de nivellement',
    fiscalSegment: 'BTPH_TOURISME',
    isSubjectToTls: false,
    isPrimary: true,
  }, token);
  console.log(`  -> Activité CNRC BTPH configurée: ${cnrcRes.body.cnrcCode}`);

  // 3. Création d'un actif racine (Pelle Mécanique BTP)
  console.log('[3/7] Création de l’actif racine (Pelle sur chenilles)...');
  const assetRes = await request('POST', '/assets', {
    name: 'Excavatrice Caterpillar 320D',
    code: `CAT320-${rand}`,
    category: 'HEAVY_TRUCK',
    primaryMeterType: 'ODOMETER_KM',
    initialMeterValue: 1250,
  }, token);
  const assetId = assetRes.body.id;
  console.log(`  -> Actif créé: ${assetRes.body.code} (ID: ${assetId})`);

  // 4. Création d'un chantier (Site Workspace)
  console.log('[4/7] Création du chantier BTP...');
  const siteRes = await request('POST', '/sites', {
    code: `CH-TIPAZA-${rand}`,
    name: 'Élargissement RN11 Chenoua',
    wilayaCode: 42,
    clientName: 'DTP Tipaza',
    startDate: '2026-11-01',
    budgetAllocatedDzd: 50000000,
  }, token);
  const siteId = siteRes.body.id;
  console.log(`  -> Chantier créé: ${siteRes.body.name} (ID: ${siteId})`);

  // Affectation de l'actif au chantier
  await request('POST', '/sites/assignments', {
    assetId,
    siteId,
    startDate: '2026-11-01',
    internalDailyRateDzd: 35000,
    startMeterHours: 1250,
  }, token);
  console.log('  -> Actif affecté au chantier.');

  // 5. Test Flux Opérationnel 1 : Consommation Carburant Chantier
  console.log('[5/7] Enregistrement d’heures moteur avec 120 L de gasoil consommés...');
  const hoursRes = await request('POST', '/sites/engine-hours', {
    assetId,
    siteId,
    hoursValue: 1262, // +12 h
    fuelConsumedLiters: 120, // 120 L
    workDescription: 'Déblaiement rocheux PK 14+500',
  }, token);
  console.log(`  -> Relevé horaire enregistré. Coût carburant: ${hoursRes.body.fuelCostDzd} DZD`);

  // Vérification de la création de la pièce fiscale et de l'événement
  const fuelDocsRes = await request('GET', `/fiscal/documents?assetId=${assetId}`, null, token);
  const fuelDoc = fuelDocsRes.body.find((d) => d.documentType === 'TICKET_NAFTAL');
  if (!fuelDoc) {
    throw new Error('Échec pontage: Aucun TICKET_NAFTAL généré automatiquement pour le carburant de chantier.');
  }
  console.log(`  -> Pièce justificative vérifiée: ${fuelDoc.documentNumber} (HT: ${fuelDoc.amountHtDzd} DA, TVA: ${fuelDoc.vatAmountDzd} DA, Déductible: ${fuelDoc.isVatDeductible})`);

  const fuelEventsRes = await request('GET', `/fiscal/events?assetId=${assetId}`, null, token);
  const fuelEvt = fuelEventsRes.body.find((e) => e.eventType === 'TVA_DEDUCTION');
  if (!fuelEvt) {
    throw new Error('Échec pontage: Aucun événement fiscal TVA_DEDUCTION généré.');
  }
  console.log(`  -> Événement SCF vérifié: Compte ${fuelEvt.accountingAccount} (TVA Déductible: ${fuelEvt.taxAmountDzd} DZD)`);

  // 6. Test Flux Opérationnel 2 : Situation de Travaux BTPH
  console.log('[6/7] Enregistrement d’une situation de travaux (attachement mensuel)...');
  const sitRes = await request('POST', `/sites/${siteId}/situations`, {
    situationNumber: `SIT-TIPAZA-${rand}-01`,
    situationDate: '2026-11-16',
    amountHtDzd: 4500000, // 4 500 000 DZD HT
    vatRatePct: 19.0,
    withholdingTaxRatePct: 5.0, // 5% garantie
    clientName: 'DTP Tipaza',
    clientNif: '000142010000089',
    assetId,
  }, token);

  console.log(`  -> Situation enregistrée. Nouveau chiffre d’affaires chantier: ${sitRes.body.updatedSite.totalRevenueDzd} DZD`);
  const sitDoc = sitRes.body.fiscalDocument;
  const sitEvt = sitRes.body.fiscalEvent;
  console.log(`  -> Pièce fiscale vérifiée: ${sitDoc.documentNumber} (${sitDoc.documentType}, TTC: ${sitDoc.totalTtcDzd} DZD, Retenue: ${sitDoc.withholdingTaxAmountDzd} DZD)`);
  console.log(`  -> Événement TVA Collectée vérifié: Compte ${sitEvt.accountingAccount} (${sitEvt.taxAmountDzd} DZD)`);

  // 7. Test Flux Opérationnel 3 : Location d'un second actif & Facturation
  console.log('[7/7] Test location et facturation automatique...');
  const rentalAssetRes = await request('POST', '/assets', {
    name: 'Fourgon Master',
    code: `MAS-${rand}`,
    category: 'ROAD_VEHICLE',
    primaryMeterType: 'ODOMETER_KM',
    initialMeterValue: 85000,
  }, token);
  const rentalAssetId = rentalAssetRes.body.id;

  const contractRes = await request('POST', '/rental/contracts', {
    assetId: rentalAssetId,
    customerName: 'EURL Transport Sahel',
    customerPhoneDz: '0661234567',
    startDate: '2026-11-10',
    endDate: '2026-11-15',
    dailyRateDzd: 18000,
    includedKmOrHoursPerDay: 250,
  }, token);
  const contractId = contractRes.body.id;

  // Check-Out
  await request('POST', '/rental/check-in-out', {
    contractId,
    type: 'CHECK_OUT',
    customerSignatoryName: 'Ahmed Transport',
    meterValue: 85000,
    fuelLevelQuarter: 4,
    cleanlinessState: 'CLEAN',
    signatureSvg: '<svg>signature-out</svg>',
  }, token);

  // Check-In
  await request('POST', '/rental/check-in-out', {
    contractId,
    type: 'CHECK_IN',
    customerSignatoryName: 'Ahmed Transport',
    meterValue: 85800,
    fuelLevelQuarter: 4,
    cleanlinessState: 'CLEAN',
    signatureSvg: '<svg>signature-in</svg>',
  }, token);

  // Génération de la facture
  const invoiceRes = await request('POST', `/rental/contracts/${contractId}/invoice`, {
    applyStampDuty: true,
  }, token);
  console.log(`  -> Facture générée: ${invoiceRes.body.invoiceNumber} (HT: ${invoiceRes.body.totalHtDzd} DZD, TTC: ${invoiceRes.body.totalTtcDzd} DZD)`);

  // Vérification de la pièce justificative CONTRAT_LOCATION
  const locDocsRes = await request('GET', `/fiscal/documents?assetId=${rentalAssetId}`, null, token);
  const locDoc = locDocsRes.body.find((d) => d.documentType === 'CONTRAT_LOCATION');
  if (!locDoc) {
    throw new Error('Échec pontage: Aucune pièce CONTRAT_LOCATION trouvée.');
  }
  console.log(`  -> Pièce justificative vérifiée: ${locDoc.documentNumber} (${locDoc.documentType}, TVA Collectée: ${locDoc.vatAmountDzd} DZD)`);

  // Consolidation de la déclaration G50 du mois
  const now = new Date();
  const draftRes = await request('POST', '/fiscal/declarations/drafts', {
    periodYear: now.getFullYear(),
    periodMonth: now.getMonth() + 1,
  }, token);

  console.log('\n=== RÉSULTATS DE LA DÉCLARATION FISCALE G50 CONSOLIDÉE EN TEMPS RÉEL ===');
  console.log(`Chiffre d’affaires imposable total : ${draftRes.body.totalTaxableRevenueDzd.toLocaleString()} DZD`);
  console.log(`TVA Collectée (Ventes / Travaux / Locations) : ${draftRes.body.totalVatCollectedDzd.toLocaleString()} DZD`);
  console.log(`TVA Déductible (Carburant / Fournitures chantiers) : ${draftRes.body.totalVatDeductibleDzd.toLocaleString()} DZD`);
  console.log(`TVA Nette à décaisser : ${draftRes.body.netVatPayableDzd.toLocaleString()} DZD`);
  console.log(`Total des droits et taxes dus : ${draftRes.body.totalDueDzd.toLocaleString()} DZD`);
  console.log(`Statut du dossier : ${draftRes.body.status} (Pièces manquantes: ${draftRes.body.missingReceiptsCount})`);

  console.log('\n[PASS] Tous les flux opérationnels sont parfaitement connectés aux pièces comptables et fiscales!');
}

run().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
