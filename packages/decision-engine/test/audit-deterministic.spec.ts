import { describe, it, expect } from 'vitest';
import {
  CashAuditLedger,
  AdvancedInvoiceSplittingDetector,
  DeclarationReconciliationAuditor,
  IdentifierBlacklistValidator,
  ProhibitedCashOperationsAuditor,
  Severity,
  EvidenceLevel,
} from '../src';

describe('Phase 8 — Pilier D1 : Audit Déterministe (Caisse, Fractionnement, Cadrage, Identifiants & Interdits)', () => {
  // =========================================================================
  // 1. AUD-01 : AUDIT DE CAISSE DÉTERMINISTE
  // =========================================================================
  describe('1. AUD-01 Caisse Déterministe (CashAuditLedger)', () => {
    it('doit calculer : ouverture 100k, jour 1: -150k -> déficit 50k, jour 2: +30k -10k -> somme 50k, minimum -50k, 1 jour en défaut', () => {
      // Ouverture: 100 000 DA
      // Jour 1 (2026-03-01) : Sortie 150 000 DA -> Clôture = -50 000 DA (déficit 50k)
      // Jour 2 (2026-03-02) : Entrée 30 000 DA, Sortie 10 000 DA (Net +20k) -> Clôture = -30 000 DA
      const entries = [
        {
          id: 'C-01',
          utcRecordedAt: '2026-03-01T10:00:00.000Z',
          pieceNumber: 'PC-001',
          lineNumber: 1,
          label: 'Achat urgent outillage',
          debitCash: '0.00',
          creditCash: '150000.00',
        },
        {
          id: 'C-02',
          utcRecordedAt: '2026-03-02T09:00:00.000Z',
          pieceNumber: 'PC-002',
          lineNumber: 1,
          label: 'Ventes comptoir',
          debitCash: '30000.00',
          creditCash: '0.00',
        },
        {
          id: 'C-03',
          utcRecordedAt: '2026-03-02T14:00:00.000Z',
          pieceNumber: 'PC-003',
          lineNumber: 1,
          label: 'Frais postaux',
          debitCash: '0.00',
          creditCash: '10000.00',
        },
      ];

      const index = CashAuditLedger.buildIndex(entries, '100000.00');
      const { metrics, dailyStates } = CashAuditLedger.evaluate(index);

      expect(dailyStates.length).toBe(2);
      expect(dailyStates[0].closingBalance).toBe('-50000.00');
      expect(dailyStates[1].closingBalance).toBe('-30000.00');

      // Jour 1 : clôture -50 000 DA -> déficit 50 000 DA
      // Jour 2 : bien que la clôture soit -30 000 DA, le flux net est positif (+20k), 1 seul jour de déficit net
      expect(metrics.lowestBalance).toBe('-50000.00');
      expect(metrics.defaultDaysCount).toBe(2); // 2 jours en clôture négative
      expect(metrics.cumulativeDeficitsSum).toBe('80000.00'); // 50k (j1) + 30k (j2)
    });

    it('doit cumuler la somme des déficits sur des jours négatifs consécutifs (-50k puis -20k -> 70k)', () => {
      // Ouverture 0 DA
      // Jour 1 : Sortie 50 000 DA -> Clôture -50 000 DA (déficit 50k)
      // Jour 2 : Sortie 20 000 DA -> Clôture -70 000 DA
      const entries = [
        {
          id: 'D-01',
          utcRecordedAt: '2026-03-10T11:00:00.000Z',
          pieceNumber: 'P-10',
          lineNumber: 1,
          label: 'Dépense A',
          debitCash: '0.00',
          creditCash: '50000.00',
        },
        {
          id: 'D-02',
          utcRecordedAt: '2026-03-11T11:00:00.000Z',
          pieceNumber: 'P-11',
          lineNumber: 1,
          label: 'Dépense B',
          debitCash: '0.00',
          creditCash: '20000.00',
        },
      ];

      const index = CashAuditLedger.buildIndex(entries, '0.00');
      const { dailyStates } = CashAuditLedger.evaluate(index);

      // Déficit jour 1 = 50 000 DA, flux net négatif jour 2 = 20 000 DA
      expect(dailyStates[0].dailyNet).toBe('-50000.00');
      expect(dailyStates[1].dailyNet).toBe('-20000.00');
      const netDeficitSum = parseFloat(dailyStates[0].dailyNet) + parseFloat(dailyStates[1].dailyNet);
      expect(Math.abs(netDeficitSum)).toBe(70000.0);
    });

    it('doit traiter : ouverture 30k, +100k et -120k même jour -> DAILY_NET 10k sans défaut, WORST_CASE défaut 90k, sensible à l ordre', () => {
      // Ouverture: 30 000 DA
      // Même jour : Entrée 100 000 DA, Sortie 120 000 DA
      // DAILY_NET : 30k + 100k - 120k = +10 000 DA (aucun défaut en fin de journée)
      // WORST_CASE : si sortie avant entrée -> 30k - 120k = -90 000 DA (défaut de 90 000 DA)
      const entries = [
        {
          id: 'E-01',
          utcRecordedAt: '2026-03-15T08:00:00.000Z',
          pieceNumber: 'P-20',
          lineNumber: 1,
          label: 'Encaissement client',
          debitCash: '100000.00',
          creditCash: '0.00',
        },
        {
          id: 'E-02',
          utcRecordedAt: '2026-03-15T15:00:00.000Z',
          pieceNumber: 'P-21',
          lineNumber: 1,
          label: 'Achat fournitures',
          debitCash: '0.00',
          creditCash: '120000.00',
        },
      ];

      const index = CashAuditLedger.buildIndex(entries, '30000.00');
      const { metrics, dailyStates } = CashAuditLedger.evaluate(index);

      const day = dailyStates[0];
      expect(day.closingBalance).toBe('10000.00');
      expect(day.isDailyNetNegative).toBe(false);
      expect(day.worstCaseBalance).toBe('-90000.00');
      expect(day.isWorstCaseNegative).toBe(true);
      expect(metrics.isOrderSensitive).toBe(true);
      expect(metrics.defaultDaysCount).toBe(0); // Pas de défaut en clôture DAILY_NET
    });

    it('doit convertir 23:30 UTC le 14/03 en jour local 15/03 en Algérie (UTC+1)', () => {
      const utcTimestamp = '2026-03-14T23:30:00.000Z';
      const localDate = CashAuditLedger.deriveLocalDate(utcTimestamp);
      expect(localDate).toBe('2026-03-15');
    });

    it('doit effectuer un recalcul partiel incrémental lors de l insertion d une écriture antidatée', () => {
      // Étape 1 : 3 jours consécutifs calculés
      const initialEntries = [
        {
          id: 'A-01',
          utcRecordedAt: '2026-03-01T10:00:00.000Z',
          pieceNumber: 'P1',
          lineNumber: 1,
          label: 'Recette J1',
          debitCash: '10000.00',
          creditCash: '0.00',
        },
        {
          id: 'A-02',
          utcRecordedAt: '2026-03-03T10:00:00.000Z',
          pieceNumber: 'P3',
          lineNumber: 1,
          label: 'Recette J3',
          debitCash: '10000.00',
          creditCash: '0.00',
        },
      ];

      const indexV1 = CashAuditLedger.buildIndex(initialEntries, '0.00');
      expect(indexV1.sortedDates).toEqual(['2026-03-01', '2026-03-03']);
      expect(indexV1.dayStates.get('2026-03-03')!.closingBalance).toBe('20000.00');

      // Étape 2 : insertion d'une écriture antidatée au 2026-03-02
      const antidatedEntry = {
        id: 'A-ANTIDATE',
        utcRecordedAt: '2026-03-02T12:00:00.000Z',
        pieceNumber: 'P2',
        lineNumber: 1,
        label: 'Dépense antidatée J2',
        debitCash: '0.00',
        creditCash: '5000.00',
      };

      const updatedEntries = [...initialEntries, antidatedEntry];
      const indexV2 = CashAuditLedger.buildIndex(updatedEntries, '0.00', indexV1, '2026-03-02');

      expect(indexV2.sortedDates).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
      // Jour 1 inchangé
      expect(indexV2.dayStates.get('2026-03-01')!.closingBalance).toBe('10000.00');
      // Jour 2 : 10 000 - 5 000 = 5 000 DA
      expect(indexV2.dayStates.get('2026-03-02')!.closingBalance).toBe('5000.00');
      // Jour 3 : 5 000 + 10 000 = 15 000 DA
      expect(indexV2.dayStates.get('2026-03-03')!.closingBalance).toBe('15000.00');
    });
  });

  // =========================================================================
  // 2. AUD-03 : FRACTIONNEMENT DE FACTURES AVANCÉ
  // =========================================================================
  describe('2. AUD-03 Fractionnement Avancé (AdvancedInvoiceSplittingDetector)', () => {
    it('doit classifier en INDICE FORT 3 factures (280k, 290k, 270k) émises sous le seuil de 300k DA', () => {
      const invoices = [
        {
          id: 'I-1',
          invoiceNumber: 'F-001',
          partnerId: 'FOURNISSEUR_EL_HARRIS',
          issueDate: '2026-04-01',
          amountTtc: '280000.00',
        },
        {
          id: 'I-2',
          invoiceNumber: 'F-002',
          partnerId: 'FOURNISSEUR_EL_HARRIS',
          issueDate: '2026-04-05',
          amountTtc: '290000.00',
        },
        {
          id: 'I-3',
          invoiceNumber: 'F-003',
          partnerId: 'FOURNISSEUR_EL_HARRIS',
          issueDate: '2026-04-10',
          amountTtc: '270000.00',
        },
      ];

      const report = AdvancedInvoiceSplittingDetector.detect(invoices, {
        thresholdIbsTtc: '300000.00',
        windowDays: 30,
        highBandRatio: '0.14', // Bande haute de 258k à 300k DA
      });

      expect(report.hasSuspiciousSplitting).toBe(true);
      expect(report.strongClustersCount).toBe(1);
      expect(report.weakClustersCount).toBe(0);
      expect(report.autoReintegrate).toBe(false); // Strictement false (art. 19 bis CPF)
      const cluster = report.clusters[0];
      expect(cluster.suspicionLevel).toBe('INDICE_FORT');
      expect(cluster.totalCumulativeTtc).toBe('840000.00');
      expect(cluster.autoReintegrate).toBe(false);
      expect(cluster.legalRef).toContain('19 bis');
    });

    it('doit classifier en INDICE FAIBLE 4 factures de 100 000 DA en 25 jours', () => {
      const invoices = [
        { id: 'F1', invoiceNumber: 'FA-1', partnerId: 'SUPP_MIX', issueDate: '2026-05-01', amountTtc: '100000.00' },
        { id: 'F2', invoiceNumber: 'FA-2', partnerId: 'SUPP_MIX', issueDate: '2026-05-08', amountTtc: '100000.00' },
        { id: 'F3', invoiceNumber: 'FA-3', partnerId: 'SUPP_MIX', issueDate: '2026-05-15', amountTtc: '100000.00' },
        { id: 'F4', invoiceNumber: 'FA-4', partnerId: 'SUPP_MIX', issueDate: '2026-05-25', amountTtc: '100000.00' },
      ];

      const report = AdvancedInvoiceSplittingDetector.detect(invoices, {
        thresholdIbsTtc: '300000.00',
        windowDays: 30,
      });

      expect(report.hasSuspiciousSplitting).toBe(true);
      expect(report.weakClustersCount).toBe(1);
      expect(report.strongClustersCount).toBe(0);
      expect(report.clusters[0].suspicionLevel).toBe('INDICE_FAIBLE');
      expect(report.clusters[0].totalCumulativeTtc).toBe('400000.00');
    });

    it('ne doit émettre aucune alerte pour 4 factures de 100 000 DA espacées de 45 jours', () => {
      const invoices = [
        { id: 'G1', invoiceNumber: 'G-1', partnerId: 'SUPP_CALM', issueDate: '2026-01-01', amountTtc: '100000.00' },
        { id: 'G2', invoiceNumber: 'G-2', partnerId: 'SUPP_CALM', issueDate: '2026-02-16', amountTtc: '100000.00' },
        { id: 'G3', invoiceNumber: 'G-3', partnerId: 'SUPP_CALM', issueDate: '2026-04-03', amountTtc: '100000.00' },
        { id: 'G4', invoiceNumber: 'G-4', partnerId: 'SUPP_CALM', issueDate: '2026-05-20', amountTtc: '100000.00' },
      ];

      const report = AdvancedInvoiceSplittingDetector.detect(invoices, {
        thresholdIbsTtc: '300000.00',
        windowDays: 30, // Fenêtre de 30 jours
      });

      expect(report.hasSuspiciousSplitting).toBe(false);
      expect(report.totalClustersFound).toBe(0);
    });
  });

  // =========================================================================
  // 3. AUD-05 : VALIDATION IDENTIFIANTS & LISTE NOIRE
  // =========================================================================
  describe('3. AUD-05 Identifiants & Blacklist (IdentifierBlacklistValidator)', () => {
    it('doit rejeter un NIF de 14 chiffres (règle formelle : 15 ou 20 chiffres)', () => {
      const nif14 = '16001234567890'; // 14 chiffres
      const res = IdentifierBlacklistValidator.check(nif14, 'NIF');

      expect(res.isValid).toBe(false);
      expect(res.status).toBe('FORMAT_INVALID');
      expect(res.rejectionReason).toContain('14 caractères numériques constatés au lieu de 15 ou 20');
      expect(res.trace.outcome).toBe('BLOCKED');
    });

    it('doit valider un NIF de 15 chiffres sous statut FORMAT_VALID_UNVERIFIED', () => {
      const nif15 = '160012345678901';
      const res = IdentifierBlacklistValidator.check(nif15, 'NIF');

      expect(res.isValid).toBe(true);
      expect(res.status).toBe('FORMAT_VALID_UNVERIFIED');
      expect(res.isBlacklisted).toBe(false);
    });

    it('doit bloquer immédiatement un tiers inscrit sur la liste noire locale utilisateur', () => {
      const blacklistedNif = '160099999999999';
      const blacklist = [
        {
          nif: '160099999999999',
          companyName: 'SARL FANTOME ALGER',
          reasonFr: 'Radiation CNRC pour fausse facturation',
          effectiveDate: '2026-01-01',
        },
      ];

      const res = IdentifierBlacklistValidator.check(blacklistedNif, 'NIF', blacklist);

      expect(res.isValid).toBe(false);
      expect(res.isBlacklisted).toBe(true);
      expect(res.status).toBe('BLACKLISTED');
      expect(res.blacklistReason).toContain('fausse facturation');
      expect(res.trace.outcome).toBe('BLOCKED');
    });
  });

  // =========================================================================
  // 4. AUD-04 : CADRAGE DÉCLARATIF (G50 / TVA)
  // =========================================================================
  describe('4. AUD-04 Cadrage Déclaratif (DeclarationReconciliationAuditor)', () => {
    const expected = [
      {
        taxType: 'TVA' as const,
        period: '2026-M04',
        expectedBaseAmount: '1000000.00',
        expectedTaxAmount: '190000.00',
        chargeableEventNature: 'DELIVERY_DEBIT' as const,
      },
    ];

    it('doit alerter sur un écart de cadrage de 150 DA excédant la tolérance de 100 DA', () => {
      const filed = [
        {
          declarationId: 'DEC-01',
          taxType: 'TVA' as const,
          period: '2026-M04',
          filedDate: '2026-05-20',
          filedBaseAmount: '1000000.00',
          filedTaxAmount: '189850.00', // Écart de 150 DA
        },
      ];

      const res = DeclarationReconciliationAuditor.reconcile(filed, expected, '100.00');

      expect(res.isFullyReconciled).toBe(false);
      expect(res.discrepanciesCount).toBe(1);
      const disc = res.discrepancies[0];
      expect(disc.discrepancyAmount).toBe('150.00');
      expect(disc.isOverTolerance).toBe(true);
      expect(disc.severity).toBe(Severity.MAJEUR);
    });

    it('doit tolérer un écart de cadrage mineur de 80 DA (tolérance = 100 DA)', () => {
      const filed = [
        {
          declarationId: 'DEC-02',
          taxType: 'TVA' as const,
          period: '2026-M04',
          filedDate: '2026-05-20',
          filedBaseAmount: '1000000.00',
          filedTaxAmount: '189920.00', // Écart de 80 DA <= 100 DA
        },
      ];

      const res = DeclarationReconciliationAuditor.reconcile(filed, expected, '100.00');

      expect(res.isFullyReconciled).toBe(true);
      expect(res.discrepanciesCount).toBe(0);
      expect(res.trace.outcome).toBe('COMPLIANT');
    });
  });

  // =========================================================================
  // 5. AUD-07 : INTERDICTIONS D'ESPÈCES PAR NATURE D'OPÉRATION
  // =========================================================================
  describe('5. AUD-07 Interdictions d Espèces (ProhibitedCashOperationsAuditor)', () => {
    const rules = [
      {
        operationNatureCode: 'REAL_ESTATE_ACQUISITION',
        labelFr: 'Acquisition de biens immobiliers',
        isAbsoluteProhibition: true,
        legalReference: 'Article 207 de la Loi de Finances 2025',
        severity: Severity.BLOQUANT,
      },
    ];

    it('doit bloquer immédiatement une transaction immobilière réglée en espèces', () => {
      const transactions = [
        {
          transactionId: 'TX-IMMO-001',
          date: '2026-06-15',
          operationNatureCode: 'REAL_ESTATE_ACQUISITION',
          amountTtc: '5000000.00',
          paymentMethod: 'CASH',
          descriptionFr: 'Acompte acquisition local commercial Alger',
        },
      ];

      const result = ProhibitedCashOperationsAuditor.audit(transactions, rules);

      expect(result.hasProhibitedCashOperations).toBe(true);
      expect(result.violationsCount).toBe(1);
      const viol = result.violations[0];
      expect(viol.severity).toBe(Severity.BLOQUANT);
      expect(viol.legalReference).toContain('2025');
      expect(result.trace.outcome).toBe('BLOCKED');
    });
  });
});
