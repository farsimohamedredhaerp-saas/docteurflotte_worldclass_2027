const { Client } = require('../apps/api/node_modules/pg');

async function main() {
  console.log('--- TEST DES RÈGLES DE CONTRÔLE FISCAL SECTION 5 (RÈGLES 5 À 8) ---');
  const API_URL = 'http://localhost:3001';

  // 1. Inscription d'un tenant test
  const uniqueSuffix = Date.now().toString().slice(-5);
  const email = `audit.fiscal.${uniqueSuffix}@docteurflotte.dz`;
  const regRes = await fetch(`${API_URL}/auth/register-tenant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: `Groupe Industriel DZ ${uniqueSuffix}`,
      adminEmail: email,
      adminPassword: 'Password123!',
      adminFirstName: 'Karim',
      adminLastName: 'Audit',
      activityPack: 'CONSTRUCTION',
    }),
  });
  const regData = await regRes.json();
  const token = regData.accessToken;
  const tenantId = regData.user?.tenantId;
  console.log(`[1/5] Tenant créé : ${tenantId}`);

  // 2. Configuration du profil fiscal et activité CNRC (BTPH - 23% IBS)
  await fetch(`${API_URL}/fiscal/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      legalName: `SARL GROUPE BTPH ${uniqueSuffix}`,
      nif: '000123456789012',
      rcNumber: '16/00-1234567B16',
      articleImposition: '16010099999',
      taxRegime: 'REEL_NORMAL',
      wilayaCode: 16,
    }),
  });
  await fetch(`${API_URL}/fiscal/cnrc-activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      cnrcCode: '109.201',
      activityLabel: 'Travaux publics et terrassement',
      fiscalSegment: 'BTPH_TOURISME',
      isPrimary: true,
    }),
  });
  console.log('[2/5] Profil fiscal et activité CNRC BTPH configurés (IBS 23%).');

  // Création de 2 actifs : Un camion lourd et un VP de direction
  const truckRes = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Tracteur Routier Actros',
      code: `TRUCK-${uniqueSuffix}`,
      category: 'HEAVY_TRUCK',
      primaryMeterType: 'ODOMETER_KM',
      initialMeterValue: 100000,
    }),
  });
  const truck = await truckRes.json();

  const vpRes = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Berline Passat Direction',
      code: `VP-${uniqueSuffix}`,
      category: 'ROAD_VEHICLE',
      primaryMeterType: 'ODOMETER_KM',
      initialMeterValue: 20000,
    }),
  });
  const vp = await vpRes.json();

  // Mise à jour de la valeur d'acquisition du VP à 5 200 000 DZD (> 3 000 000 DZD)
  const pgClient = new Client({ connectionString: 'postgresql://docteurflotte:docteurflotte_dev_password_local_only@localhost:5434/docteurflotte_dev' });
  await pgClient.connect();
  await pgClient.query(
    `UPDATE assets SET physics_state = jsonb_build_object('acquisition_cost_dzd', 5200000, 'is_core_business_tool', false) WHERE id = $1`,
    [vp.id]
  );
  await pgClient.end();

  // --- TEST RÈGLE 5 : Plafond espèces > 1 000 000 DZD TTC ---
  const docCashRes = await fetch(`${API_URL}/fiscal/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      assetId: truck.id,
      documentType: 'FACTURE_FOURNISSEUR',
      documentNumber: `FAC-CASH-${uniqueSuffix}`,
      documentDate: '2026-11-16',
      paymentMethod: 'CASH',
      amountHtDzd: 1500000,
      vatRatePct: 19,
      totalTtcDzd: 1785000,
      thirdPartyName: 'Fournisseur Matériaux',
      thirdPartyNif: '00012345678901234567',
      thirdPartyRc: '16/00-9876543B16',
      articleImpositionThirdParty: '16010055555',
    }),
  });
  const docCash = await docCashRes.json();
  if (docCash.statusCode) console.log('DOC_CASH_ERR:', docCash);
  console.log(`[3/5] Test Règle 5 (Espèces > 1 000 000 DZD) :`);
  console.log(`  -> Déductible: ${docCash.isVatDeductible} (attendu: false)`);
  console.log(`  -> Statut de vérification: ${docCash.verificationStatus} (attendu: SUSPICIOUS)`);
  console.log(`  -> Alerte levée: ${docCash.rejectionReason}`);
  if (docCash.isVatDeductible !== false || docCash.verificationStatus !== 'SUSPICIOUS' || !docCash.rejectionReason.includes('CASH_THRESHOLD_EXCEEDED')) {
    throw new Error('Échec du test Règle 5 !');
  }

  // --- TEST RÈGLE 6 : Mentions légales obligatoires du Tiers (Art. 64 CPF) ---
  const docArt64Res = await fetch(`${API_URL}/fiscal/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      assetId: truck.id,
      documentType: 'FACTURE_FOURNISSEUR',
      documentNumber: `FAC-NIF-ERR-${uniqueSuffix}`,
      documentDate: '2026-11-16',
      paymentMethod: 'BANK_TRANSFER',
      amountHtDzd: 200000,
      vatRatePct: 19,
      totalTtcDzd: 238000,
      thirdPartyName: 'Garage Inconnu',
      thirdPartyNif: '123456', // Invalide ! Ni 15 ni 20 chiffres
      thirdPartyRc: '',       // Manquant !
      articleImpositionThirdParty: '',
    }),
  });
  const docArt64 = await docArt64Res.json();
  console.log(`[4/5] Test Règle 6 (Art. 64 CPF - Mentions Tiers) :`);
  console.log(`  -> Déductible: ${docArt64.isVatDeductible} (attendu: false)`);
  console.log(`  -> Statut de vérification: ${docArt64.verificationStatus} (attendu: SUSPICIOUS)`);
  console.log(`  -> Alerte levée: ${docArt64.rejectionReason}`);
  if (docArt64.isVatDeductible !== false || docArt64.verificationStatus !== 'SUSPICIOUS' || !docArt64.rejectionReason.includes('MISSING_LEGAL_MENTIONS_ART_64_CPF')) {
    throw new Error('Échec du test Règle 6 !');
  }

  // --- TEST RÈGLE 7 : Fait générateur hybride (Débit vs Encaissement) ---
  // Document BTP non encore encaissé (isSettled = false)
  const docUnsettledRes = await fetch(`${API_URL}/fiscal/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      assetId: truck.id,
      documentType: 'SITUATION_TRAVAUX',
      documentNumber: `SIT-UNSETTLED-${uniqueSuffix}`,
      documentDate: '2026-11-16',
      amountHtDzd: 2000000,
      vatRatePct: 19,
      totalTtcDzd: 2380000,
      vatTaxPoint: 'ENCAISSEMENT',
      isSettled: false, // NON ENCAISSÉ
    }),
  });
  const docUnsettled = await docUnsettledRes.json();

  // Document réglé (isSettled = true)
  const docSettledRes = await fetch(`${API_URL}/fiscal/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      assetId: truck.id,
      documentType: 'CONTRAT_LOCATION',
      documentNumber: `FAC-SETTLED-${uniqueSuffix}`,
      documentDate: '2026-11-16',
      amountHtDzd: 500000,
      vatRatePct: 19,
      totalTtcDzd: 595000,
      vatTaxPoint: 'ENCAISSEMENT',
      isSettled: true, // ENCAISSÉ
    }),
  });
  const docSettled = await docSettledRes.json();

  // Création d'une amende de circulation pour Règle 8
  await fetch(`${API_URL}/fiscal/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      assetId: truck.id,
      documentType: 'AMENDE',
      documentNumber: `AMN-${uniqueSuffix}`,
      documentDate: '2026-11-16',
      amountHtDzd: 15000,
      totalTtcDzd: 15000,
    }),
  });

  // Calcul du brouillon G50 pour vérifier Règle 7
  const draftRes = await fetch(`${API_URL}/fiscal/declarations/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ periodYear: 2026, periodMonth: 11 }),
  });
  const draft = await draftRes.json();
  console.log(`[5/5] Test Règle 7 (Fait générateur hybride sur G50) :`);
  console.log(`  -> TVA Collectée totale appelée: ${draft.totalVatCollectedDzd} DZD`);
  console.log(`  -> Attendu: 95 000 DZD (seulement les 500 000 DA encaissés, PAS les 2 000 000 DA en attente)`);
  if (draft.totalVatCollectedDzd !== 95000) {
    throw new Error(`Échec du test Règle 7 ! TVA collectée incorrecte : ${draft.totalVatCollectedDzd}`);
  }

  // --- TEST RÈGLE 8 : Tableau 9 Liasse SCF ---
  const tab9Res = await fetch(`${API_URL}/fiscal/liasse/tableau-9?year=2026`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tab9 = await tab9Res.json();
  console.log('--- TEST RÈGLE 8 : TABLEAU 9 DE LA LIASSE FISCALE SCF ---');
  console.log(`  -> Raison sociale: ${tab9.legalName} (NIF: ${tab9.nif})`);
  console.log(`  -> Amendes et pénalités réintégrées (Art. 169 CIDTA): ${tab9.reintegrations.penaltiesAndFinesDzd} DZD`);
  console.log(`  -> Paiements espèces au-delà du plafond réintégrés (Art. 30): ${tab9.reintegrations.cashPaymentsOverCeilingDzd} DZD`);
  console.log(`  -> Amortissement excédentaire VP réintégré (Art. 141-2 CIDTA): ${tab9.reintegrations.excessDepreciationVpDzd} DZD`);
  console.log(`  -> Total des réintégrations: ${tab9.reintegrations.totalReintegrationsDzd} DZD`);
  console.log(`  -> Taux IBS appliqué: ${tab9.appliedIbsRatePct}% (BTPH)`);
  console.log(`  -> Empreinte SHA-256 infalsifiable: ${tab9.sha256Seal}`);

  // Vérifications
  // VP acquis à 5 200 000 DZD (plafond 3 000 000 DZD) -> Excédent annuel = (5 200 000 - 3 000 000) / 5 = 440 000 DZD
  if (tab9.reintegrations.excessDepreciationVpDzd !== 440000) {
    throw new Error(`Amortissement excédentaire VP erroné: ${tab9.reintegrations.excessDepreciationVpDzd} DZD (attendu: 440 000 DZD)`);
  }
  if (tab9.reintegrations.penaltiesAndFinesDzd !== 15000) {
    throw new Error(`Amendes réintégrées erronées: ${tab9.reintegrations.penaltiesAndFinesDzd} DZD`);
  }
  if (tab9.appliedIbsRatePct !== 23) {
    throw new Error(`Taux IBS erroné: ${tab9.appliedIbsRatePct}% (attendu 23% BTPH)`);
  }

  console.log('\n[PASS] LES 4 RÈGLES DE CONTRÔLE (RÈGLES 5 À 8) SONT PLEINEMENT DÉVELOPPÉES ET VALIDÉES EN DIRECT !');
}

main().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});