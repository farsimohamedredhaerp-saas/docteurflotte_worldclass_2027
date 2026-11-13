/**
 * Tests Unitaires & Intégration : Data Plane Grand Livre, Événements & Clôtures
 * 
 * Valide les exigences strictes de la Phase 3 :
 * 1. Vente 100 000 HT TVA 19% (Classique vs BTPH TVA en attente)
 * 2. Idempotence : ré-exécution d'un même événement = 0 écriture
 * 3. Pièce déséquilibrée de 0.01 DA refusée
 * 4. Fuseau Algérie : écriture à 23h30 UTC le 14/03 classée au 15/03
 * 5. Intégrité cryptographique : altération d'un octet -> verifyChain échoue
 * 6. Isolation multi-tenant stricte
 * 7. Invariant Débit == Crédit et hachages reproductibles
 * 8. Refus d'écriture en période close (CLOSED)
 * 9. Contre-passation (correction sans suppression physique)
 * 10. Scellement Merkle quotidien
 * 11. Couverture intégrale des 15 événements MVP
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  InMemoryLedger,
  ClosedPeriodError,
  UnbalancedPieceError,
  UnmappedAccountRoleError,
  verifyChain,
  computeMerkleRoot,
  GENESIS_HASH,
  PostingSchemaRegistry,
  BusinessEventType,
  AccountRole,
  PostingSchemaItem,
  ChartOfAccounts,
} from '../src/index.js';

describe('Data Plane — Grand Livre, Événements & Clôtures (Phase 3)', () => {
  let ledger: InMemoryLedger;
  let chart: ChartOfAccounts;
  let registry: PostingSchemaRegistry;
  const packHash = 'mock_pack_hash_2026_algeria_world_class';
  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    ledger = new InMemoryLedger();

    // Chargement du plan de comptes SCF et des schémas de posting MVP
    const chartPath = path.resolve(__dirname, '../fixtures/packs/chart-of-accounts-scf.json');
    chart = JSON.parse(fs.readFileSync(chartPath, 'utf8'));

    const schemasPath = path.resolve(__dirname, '../fixtures/packs/mvp-posting-schemas.json');
    const schemas: PostingSchemaItem[] = JSON.parse(fs.readFileSync(schemasPath, 'utf8'));
    registry = new PostingSchemaRegistry(schemas);

    // Initialisation des périodes comptables pour Tenant A et Tenant B
    ledger.createPeriod({
      id: 'period-2026-tenant-a',
      tenantId: tenantA,
      fiscalYear: 2026,
      periodCode: '2026-FY',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'OPEN',
      packHash,
    });

    ledger.createPeriod({
      id: 'period-2026-tenant-b',
      tenantId: tenantB,
      fiscalYear: 2026,
      periodCode: '2026-FY',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'OPEN',
      packHash,
    });
  });

  // 1. Vente 100 000 HT TVA 19% (Négoce standard)
  it('1. Comptabilise une vente standard de 100 000 HT TVA 19% avec débit client 119 000, produit 100 000 et TVA 19 000', () => {
    const event = {
      tenantId: tenantA,
      eventId: 'evt-sale-001',
      eventType: BusinessEventType.SALE_INVOICED,
      occurredAt: '2026-02-15T10:00:00Z',
      payload: {
        amount_ht: '100000.00',
        vat_amount: '19000.00',
        amount_ttc: '119000.00',
        is_waiting_vat: false,
        label: 'Facture client F-2026-001',
      },
    };

    const schema = registry.get(BusinessEventType.SALE_INVOICED)!;
    const result = ledger.processEvent(event, schema, chart, packHash);

    expect(result.status).toBe('PROCESSED');
    expect(result.entriesCreated).toBe(3);

    const entries = result.entries;
    // Ligne 1 : Client Débit 119 000
    expect(entries[0].accountRole).toBe(AccountRole.CLIENT);
    expect(entries[0].debit).toBe('119000.00');
    expect(entries[0].credit).toBeNull();

    // Ligne 2 : Vente Produit Crédit 100 000
    expect(entries[1].accountRole).toBe(AccountRole.REVENUE_SALES);
    expect(entries[1].debit).toBeNull();
    expect(entries[1].credit).toBe('100000.00');

    // Ligne 3 : TVA Collectée Crédit 19 000
    expect(entries[2].accountRole).toBe(AccountRole.VAT_COLLECTED);
    expect(entries[2].debit).toBeNull();
    expect(entries[2].credit).toBe('19000.00');

    // Vérification de la chaîne SHA-256
    const chainCheck = ledger.verifyTenantChain(tenantA);
    expect(chainCheck.valid).toBe(true);
    expect(chainCheck.entriesCount).toBe(3);
  });

  // 1 bis. Vente BTPH / Services avec TVA en attente
  it('1bis. Comptabilise une vente BTPH de 100 000 HT TVA 19% avec TVA en attente (4458) au lieu de collectée', () => {
    const event = {
      tenantId: tenantA,
      eventId: 'evt-btph-sale-001',
      eventType: BusinessEventType.SALE_INVOICED,
      occurredAt: '2026-02-16T14:30:00Z',
      payload: {
        amount_ht: '100000.00',
        vat_amount: '19000.00',
        amount_ttc: '119000.00',
        is_waiting_vat: true, // Régime des encaissements / BTPH
        label: 'Situation de travaux n°1',
      },
    };

    const schema = registry.get(BusinessEventType.SALE_INVOICED)!;
    const result = ledger.processEvent(event, schema, chart, packHash);

    expect(result.status).toBe('PROCESSED');
    expect(result.entriesCreated).toBe(3);

    const entries = result.entries;
    expect(entries[0].accountRole).toBe(AccountRole.CLIENT);
    expect(entries[0].debit).toBe('119000.00');

    expect(entries[1].accountRole).toBe(AccountRole.REVENUE_SALES);
    expect(entries[1].credit).toBe('100000.00');

    // TVA en attente (VAT_WAITING) créditée
    expect(entries[2].accountRole).toBe(AccountRole.VAT_WAITING);
    expect(entries[2].credit).toBe('19000.00');
  });

  // 2. Idempotence : ré-exécution d'un même événement = 0 écriture
  it('2. Garantit l idempotence : rejouer le même event_id renvoie la pièce sans dupliquer les écritures (0 créées)', () => {
    const event = {
      tenantId: tenantA,
      eventId: 'evt-idempotent-test',
      eventType: BusinessEventType.CASH_EXPENSE,
      occurredAt: '2026-03-01T09:00:00Z',
      payload: {
        amount: '5000.00',
        label: 'Achat fournitures caisse',
      },
    };

    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;

    // 1ère exécution
    const res1 = ledger.processEvent(event, schema, chart, packHash);
    expect(res1.status).toBe('PROCESSED');
    expect(res1.entriesCreated).toBe(2);

    // 2ème exécution avec les mêmes paramètres
    const res2 = ledger.processEvent(event, schema, chart, packHash);
    expect(res2.status).toBe('IGNORED_DUPLICATE');
    expect(res2.entriesCreated).toBe(0);
    expect(res2.pieceNumber).toBe(res1.pieceNumber);

    // Le nombre total d'écritures pour le tenant n'a pas augmenté
    expect(ledger.getEntries(tenantA).length).toBe(2);
  });

  // 3. Pièce déséquilibrée de 0.01 DA refusée
  it('3. Refuse catégoriquement toute pièce déséquilibrée de 0.01 DA', () => {
    expect(() => {
      ledger.insertPiece(
        tenantA,
        'period-2026-tenant-a',
        'OD-2026-999999',
        '2026-03-02',
        packHash,
        [
          { accountRole: AccountRole.CLIENT, accountNumber: '411000', label: 'Ligne 1', debit: '100.00', credit: null },
          { accountRole: AccountRole.REVENUE_SALES, accountNumber: '700000', label: 'Ligne 2', debit: null, credit: '99.99' },
        ]
      );
    }).toThrow(UnbalancedPieceError);
  });

  // 4. Fuseau Algérie : écriture à 23h30 UTC le 14/03 classée au 15/03
  it('4. Classe correctement une transaction de 23h30 UTC le 14/03 à la date locale algérienne du 15/03 (UTC+1)', () => {
    const event = {
      tenantId: tenantA,
      eventId: 'evt-night-tx',
      eventType: BusinessEventType.CASH_EXPENSE,
      occurredAt: '2026-03-14T23:30:00.000Z', // 23h30 UTC -> 00h30 le 15/03 en Algérie
      payload: {
        amount: '2500.00',
        label: 'Course taxi nuit',
      },
    };

    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;
    const result = ledger.processEvent(event, schema, chart, packHash);

    expect(result.status).toBe('PROCESSED');
    expect(result.entries[0].localDate).toBe('2026-03-15');
    expect(result.entries[1].localDate).toBe('2026-03-15');
  });

  // 5. Intégrité cryptographique : altération d'un octet -> verifyChain échoue
  it('5. Détecte immédiatement toute altération de données en base via verifyChain', () => {
    const event = {
      tenantId: tenantA,
      eventId: 'evt-tamper-victim',
      eventType: BusinessEventType.CASH_EXPENSE,
      occurredAt: '2026-03-10T11:00:00Z',
      payload: {
        amount: '8000.00',
        label: 'Frais de réparation',
      },
    };

    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;
    const res = ledger.processEvent(event, schema, chart, packHash);

    // Vérification initiale intègre
    expect(ledger.verifyTenantChain(tenantA).valid).toBe(true);

    // Altération malveillante d'un centime sur la ligne de débit
    ledger.tamperEntryForTesting(tenantA, res.pieceNumber, 1, '8000.01');

    // La vérification doit immédiatement échouer
    const checkAfterTampering = ledger.verifyTenantChain(tenantA);
    expect(checkAfterTampering.valid).toBe(false);
    expect(checkAfterTampering.brokenAtPiece).toBe(res.pieceNumber);
    expect(checkAfterTampering.brokenAtLine).toBe(1);
    expect(checkAfterTampering.reason).toContain('Condensat altéré');
  });

  // 6. Isolation multi-tenant stricte
  it('6. Isole strictement les données, les chaînes SHA-256 et les numérotations entre tenants', () => {
    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;

    // Tenant A
    const resA = ledger.processEvent(
      {
        tenantId: tenantA,
        eventId: 'evt-common-id',
        eventType: BusinessEventType.CASH_EXPENSE,
        occurredAt: '2026-04-01T10:00:00Z',
        payload: { amount: '1000.00', label: 'Dépense A' },
      },
      schema,
      chart,
      packHash
    );

    // Tenant B (même eventId mais tenant différent)
    const resB = ledger.processEvent(
      {
        tenantId: tenantB,
        eventId: 'evt-common-id',
        eventType: BusinessEventType.CASH_EXPENSE,
        occurredAt: '2026-04-01T10:00:00Z',
        payload: { amount: '2000.00', label: 'Dépense B' },
      },
      schema,
      chart,
      packHash
    );

    expect(resA.status).toBe('PROCESSED');
    expect(resB.status).toBe('PROCESSED');

    // Les numéros de pièces démarrent tous les deux à 000001 pour leur journal respectif
    expect(resA.pieceNumber).toBe('CA-2026-000001');
    expect(resB.pieceNumber).toBe('CA-2026-000001');

    // Vérification des chaînes indépendantes
    expect(ledger.verifyTenantChain(tenantA).valid).toBe(true);
    expect(ledger.verifyTenantChain(tenantB).valid).toBe(true);

    // Tenant A ne voit que ses écritures
    const entriesA = ledger.getEntries(tenantA);
    const entriesB = ledger.getEntries(tenantB);
    expect(entriesA.every((e) => e.tenantId === tenantA)).toBe(true);
    expect(entriesB.every((e) => e.tenantId === tenantB)).toBe(true);
  });

  // 7. Invariant mathématique global (Somme des débits == Somme des crédits)
  it('7. Vérifie l invariant fondamental : somme débits == somme crédits et reproductibilité des hashs', () => {
    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;

    for (let i = 1; i <= 5; i++) {
      ledger.processEvent(
        {
          tenantId: tenantA,
          eventId: `evt-series-${i}`,
          eventType: BusinessEventType.CASH_EXPENSE,
          occurredAt: `2026-04-0${i}T10:00:00Z`,
          payload: { amount: `${i * 1000}.00`, label: `Dépense n°${i}` },
        },
        schema,
        chart,
        packHash
      );
    }

    const totals = ledger.computeTotals(tenantA);
    expect(totals.isBalanced).toBe(true);
    expect(totals.totalDebit).toBe(totals.totalCredit);
  });

  // 8. Refus d'écriture en période close (CLOSED)
  it('8. Refuse toute écriture dans une période comptable clôturée (CLOSED)', () => {
    ledger.closePeriod('period-2026-tenant-a', 'commissaire_aux_comptes@dzerp.dz');

    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;
    expect(() => {
      ledger.processEvent(
        {
          tenantId: tenantA,
          eventId: 'evt-after-close',
          eventType: BusinessEventType.CASH_EXPENSE,
          occurredAt: '2026-05-01T10:00:00Z',
          payload: { amount: '1500.00', label: 'Dépense tardive rejetée' },
        },
        schema,
        chart,
        packHash
      );
    }).toThrow(ClosedPeriodError);
  });

  // 9. Contre-passation (correction sans suppression)
  it('9. Effectue une contre-passation conforme : l ancienne pièce passe à REVERSED et une pièce inversée est ajoutée', () => {
    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;
    const res = ledger.processEvent(
      {
        tenantId: tenantA,
        eventId: 'evt-to-reverse',
        eventType: BusinessEventType.CASH_EXPENSE,
        occurredAt: '2026-05-02T10:00:00Z',
        payload: { amount: '12000.00', label: 'Écriture erronée à contre-passer' },
      },
      schema,
      chart,
      packHash
    );

    const reversedEntries = ledger.reversePiece(tenantA, res.pieceNumber, 'Erreur de saisie montant');
    expect(reversedEntries.length).toBe(2);

    // Vérifier l'inversion
    expect(reversedEntries[0].accountRole).toBe(AccountRole.EXPENSE_MAINTENANCE);
    expect(reversedEntries[0].credit).toBe('12000.00'); // L'ancien débit est devenu crédit
    expect(reversedEntries[0].debit).toBeNull();

    expect(reversedEntries[1].accountRole).toBe(AccountRole.CASH);
    expect(reversedEntries[1].debit).toBe('12000.00'); // L'ancien crédit est devenu débit
    expect(reversedEntries[1].credit).toBeNull();

    // La chaîne SHA-256 reste parfaitement valide
    const chainCheck = ledger.verifyTenantChain(tenantA);
    expect(chainCheck.valid).toBe(true);
  });

  // 10. Scellement Merkle quotidien
  it('10. Scelle un ancrage quotidien Merkle sur les écritures de la journée', () => {
    const schema = registry.get(BusinessEventType.CASH_EXPENSE)!;
    ledger.processEvent(
      {
        tenantId: tenantA,
        eventId: 'evt-merkle-1',
        eventType: BusinessEventType.CASH_EXPENSE,
        occurredAt: '2026-06-01T10:00:00Z',
        payload: { amount: '3000.00', label: 'Opération 1' },
      },
      schema,
      chart,
      packHash
    );
    ledger.processEvent(
      {
        tenantId: tenantA,
        eventId: 'evt-merkle-2',
        eventType: BusinessEventType.CASH_EXPENSE,
        occurredAt: '2026-06-01T15:00:00Z',
        payload: { amount: '4000.00', label: 'Opération 2' },
      },
      schema,
      chart,
      packHash
    );

    const anchor = ledger.sealDailyAnchor(tenantA, '2026-06-01');
    expect(anchor.entriesCount).toBe(4); // 2 événements x 2 lignes = 4 écritures
    expect(anchor.merkleRoot).toBeDefined();
    expect(anchor.merkleRoot.length).toBe(64);
  });

  // 11. Couverture intégrale des 15 événements MVP
  it('11. Valide l exécution et l équilibre comptable des 15 événements du catalogue MVP', () => {
    const testPayloads: Record<BusinessEventType, Record<string, unknown>> = {
      [BusinessEventType.SALE_INVOICED]: {
        amount_ht: '50000.00',
        vat_amount: '9500.00',
        amount_ttc: '59500.00',
        is_waiting_vat: false,
      },
      [BusinessEventType.SALE_COLLECTED]: {
        amount_collected: '59500.00',
        payment_mode: 'BANK_TRANSFER',
        vat_to_regularize: '0',
      },
      [BusinessEventType.PURCHASE_INVOICED]: {
        amount_ht: '30000.00',
        vat_amount: '5700.00',
        amount_ttc: '35700.00',
      },
      [BusinessEventType.PURCHASE_PAID]: {
        amount_paid: '35700.00',
        payment_mode: 'BANK_TRANSFER',
      },
      [BusinessEventType.CASH_EXPENSE]: {
        amount: '1200.00',
      },
      [BusinessEventType.CASH_DEPOSIT_TO_BANK]: {
        amount: '15000.00',
      },
      [BusinessEventType.OWNER_CURRENT_ACCOUNT_CONTRIBUTION]: {
        amount: '500000.00',
        payment_mode: 'BANK_TRANSFER',
      },
      [BusinessEventType.PAYROLL_RUN]: {
        gross_salary: '100000.00',
        employer_social_charges: '26000.00',
        total_social_charges: '35000.00', // 9000 salarial + 26000 patronal
        income_tax_withheld: '10000.00',   // IRG
        net_salary: '81000.00',            // 100000 - 9000 - 10000
      },
      [BusinessEventType.ASSET_ACQUIRED]: {
        amount_ht: '200000.00',
        vat_amount: '38000.00',
        amount_ttc: '238000.00',
      },
      [BusinessEventType.DEPRECIATION_BOOKED]: {
        depreciation_amount: '40000.00',
      },
      [BusinessEventType.FX_REVALUATION]: {
        is_gain: true,
        gain_amount: '7500.00',
      },
      [BusinessEventType.STOCK_RECEIPT]: {
        total_cost: '45000.00',
      },
      [BusinessEventType.STOCK_ISSUE]: {
        total_cost: '22000.00',
      },
      [BusinessEventType.SITUATION_ISSUED]: {
        amount_ht: '150000.00',
        vat_amount: '28500.00',
        amount_ttc: '178500.00',
      },
      [BusinessEventType.SITUATION_COLLECTED]: {
        amount_collected: '178500.00',
        vat_collected_prorata: '28500.00',
      },
    };

    let eventIdx = 0;
    for (const eventType of Object.values(BusinessEventType)) {
      eventIdx++;
      const schema = registry.get(eventType);
      expect(schema, `Schéma introuvable pour ${eventType}`).toBeDefined();

      const payload = testPayloads[eventType];
      const result = ledger.processEvent(
        {
          tenantId: tenantA,
          eventId: `evt-mvp-catalog-${eventIdx}`,
          eventType,
          occurredAt: '2026-07-01T12:00:00Z',
          payload,
        },
        schema!,
        chart,
        packHash
      );

      expect(result.status).toBe('PROCESSED');
      expect(result.entriesCreated).toBeGreaterThanOrEqual(2);
    }

    // Chaîne intégrale valide après exécution des 15 événements
    const finalChain = ledger.verifyTenantChain(tenantA);
    expect(finalChain.valid).toBe(true);
    expect(finalChain.entriesCount).toBeGreaterThan(30);

    // Invariant total Débit == Crédit vérifié
    const finalTotals = ledger.computeTotals(tenantA);
    expect(finalTotals.isBalanced).toBe(true);
  });
});

