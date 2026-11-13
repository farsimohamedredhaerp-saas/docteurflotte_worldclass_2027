import { describe, it, expect } from 'vitest';
import {
  BenfordAnalyzer,
  InvoiceSplittingDetector,
  CashRegisterAuditor,
  CashThresholdChecker,
  IdentifierSyntaxValidator,
  RatioAnomalyDetector,
  AuditReportGenerator,
  Severity,
  EvidenceLevel,
  VerificationStatus,
} from '../src';

describe('Phase 6 — Moteur d Audit, Détection d Anomalies & Fraude Légale', () => {
  // =========================================================================
  // 1. LOI DE BENFORD (Analyses statistiques numériques)
  // =========================================================================
  describe('1. Loi de Benford (BenfordAnalyzer)', () => {
    it('doit refuser l évaluation si la taille d échantillon est insuffisante (< 50)', () => {
      const smallSample = ['1250.00', '2500.50', '3100.00', '4800.00'];
      const result = BenfordAnalyzer.analyze(smallSample, {
        testType: 'FIRST_DIGIT',
        minSampleSize: 50,
      });

      expect(result.isApplicable).toBe(false);
      expect(result.inapplicabilityReason).toContain('insuffisante');
      expect(result.trace.outcome).toBe('NOT_APPLICABLE');
      expect(result.mad).toBe('0.000000');
    });

    it('doit confirmer la conformité sur une distribution synthétique respectant Benford (1er chiffre)', () => {
      // Génération d'une série synthétique de 500 montants respectant les probabilités de Benford
      const amounts: string[] = [];
      const proportions = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
      const totalN = 500;

      proportions.forEach((prop, idx) => {
        const digit = idx + 1;
        const count = Math.round(prop * totalN);
        for (let i = 0; i < count; i++) {
          amounts.push(`${digit}${Math.floor(Math.random() * 899 + 100)}.00`);
        }
      });

      const result = BenfordAnalyzer.analyze(amounts, {
        testType: 'FIRST_DIGIT',
        minSampleSize: 50,
      });

      expect(result.isApplicable).toBe(true);
      expect(result.sampleSize).toBeGreaterThanOrEqual(450);
      expect(['CLOSE_CONFORMITY', 'ACCEPTABLE_CONFORMITY']).toContain(result.conformityLevel);
      expect(parseFloat(result.mad)).toBeLessThan(0.015);
      expect(result.trace.outcome).toBe('COMPLIANT');
      expect(result.trace.evidenceLevel).toBe(EvidenceLevel.STATISTICAL);
    });

    it('doit détecter une anomalie statistique majeure sur une série manipulée avec concentration anormale sur 7 et 8', () => {
      // 100 factures dont 75 commencent par 7 ou 8 (anomalie grossière de facturation)
      const manipulatedAmounts: string[] = [];
      for (let i = 0; i < 40; i++) manipulatedAmounts.push(`79${i}0.00`);
      for (let i = 0; i < 35; i++) manipulatedAmounts.push(`84${i}0.00`);
      for (let i = 0; i < 25; i++) manipulatedAmounts.push(`12${i}0.00`);

      const result = BenfordAnalyzer.analyze(manipulatedAmounts, {
        testType: 'FIRST_DIGIT',
        minSampleSize: 50,
      });

      expect(result.isApplicable).toBe(true);
      expect(result.conformityLevel).toBe('NON_CONFORMITY_RISK');
      expect(parseFloat(result.mad)).toBeGreaterThan(0.015);
      expect(result.suspectDigits).toContain(7);
      expect(result.suspectDigits).toContain(8);
      expect(result.trace.outcome).toBe('RISK_DETECTED');
      expect(result.trace.humanReviewRequired).toBe(true);
    });

    it('doit analyser les deux premiers chiffres (First-two digits)', () => {
      const amounts: string[] = [];
      for (let i = 10; i < 99; i++) {
        amounts.push(`${i}450.00`);
      }

      const result = BenfordAnalyzer.analyze(amounts, {
        testType: 'FIRST_TWO_DIGITS',
        minSampleSize: 50,
      });

      expect(result.isApplicable).toBe(true);
      expect(result.bins.length).toBe(90);
      expect(result.bins[0].digit).toBe(10);
      expect(result.bins[89].digit).toBe(99);
    });
  });

  // =========================================================================
  // 2. FRACTIONNEMENT DE FACTURES (Abus de droit art. 19 bis CPF)
  // =========================================================================
  describe('2. Détection de Fractionnement de Factures (InvoiceSplittingDetector)', () => {
    it('doit identifier une grappe de factures suspectes sous le seuil de 300 000 DA (art. 19 bis CPF)', () => {
      // 3 factures émises pour le même fournisseur SARL ATLAS sur 12 jours, juste sous 300 000 DA
      const targetThreshold = '300000.00';
      const invoices = [
        {
          id: 'INV-01',
          invoiceNumber: 'FAC-2026-001',
          partnerId: 'SUPP-ATLAS',
          partnerName: 'SARL ATLAS EQUIPEMENT',
          issueDate: '2026-03-05',
          amountTtc: '290000.00',
          paymentMethod: 'CASH',
        },
        {
          id: 'INV-02',
          invoiceNumber: 'FAC-2026-002',
          partnerId: 'SUPP-ATLAS',
          partnerName: 'SARL ATLAS EQUIPEMENT',
          issueDate: '2026-03-10',
          amountTtc: '285000.00',
          paymentMethod: 'CASH',
        },
        {
          id: 'INV-03',
          invoiceNumber: 'FAC-2026-003',
          partnerId: 'SUPP-ATLAS',
          partnerName: 'SARL ATLAS EQUIPEMENT',
          issueDate: '2026-03-17',
          amountTtc: '295000.00',
          paymentMethod: 'CASH',
        },
        {
          id: 'INV-04',
          invoiceNumber: 'FAC-2026-080',
          partnerId: 'SUPP-AUTRE',
          partnerName: 'EURL DIVERS',
          issueDate: '2026-03-12',
          amountTtc: '45000.00',
          paymentMethod: 'TRANSFER',
        },
      ];

      const result = InvoiceSplittingDetector.detect(invoices, {
        thresholdAmount: targetThreshold,
        windowDays: 30,
        marginRatio: '0.15', // Détection entre 255 000 et 300 000 DA
        minClusterSize: 2,
      });

      expect(result.hasSuspiciousSplitting).toBe(true);
      expect(result.totalClustersFound).toBe(1);
      const cluster = result.clusters[0];
      expect(cluster.partnerId).toBe('SUPP-ATLAS');
      expect(cluster.invoiceCount).toBe(3);
      expect(cluster.totalCumulativeAmount).toBe('870000.00'); // 290k + 285k + 295k
      expect(cluster.timeSpanDays).toBe(12);
      expect(cluster.legalQualificationFr).toContain('art. 19 bis CPF');
      expect(cluster.riskSeverity).toBe(Severity.MAJEUR);
      expect(result.trace.humanReviewRequired).toBe(true);
      expect(result.trace.outcome).toBe('RISK_DETECTED');
    });

    it('ne doit émettre aucune alerte si les factures sont espacées dans le temps (> 30 jours)', () => {
      const invoices = [
        {
          id: 'INV-01',
          invoiceNumber: 'FAC-2026-001',
          partnerId: 'SUPP-ATLAS',
          issueDate: '2026-01-05',
          amountTtc: '290000.00',
        },
        {
          id: 'INV-02',
          invoiceNumber: 'FAC-2026-002',
          partnerId: 'SUPP-ATLAS',
          issueDate: '2026-04-10', // 95 jours plus tard
          amountTtc: '285000.00',
        },
      ];

      const result = InvoiceSplittingDetector.detect(invoices, {
        thresholdAmount: '300000.00',
        windowDays: 30,
      });

      expect(result.hasSuspiciousSplitting).toBe(false);
      expect(result.totalClustersFound).toBe(0);
      expect(result.trace.outcome).toBe('COMPLIANT');
    });
  });

  // =========================================================================
  // 3. CONTRÔLE DE CAISSE (Solde créditeur & Ordre intra-journalier art. 43 CPF)
  // =========================================================================
  describe('3. Contrôle de Caisse (CashRegisterAuditor)', () => {
    it('doit bloquer immédiatement en cas de solde créditeur de fin de journée (DAILY_NET)', () => {
      const movements = [
        {
          id: 'MOV-1',
          date: '2026-02-15',
          label: 'Ventes comptoir',
          inflow: '20000.00',
          outflow: '0.00',
        },
        {
          id: 'MOV-2',
          date: '2026-02-15',
          label: 'Achat fournitures',
          inflow: '0.00',
          outflow: '35000.00', // Dépasse les 20 000 DA de recettes
        },
      ];

      const result = CashRegisterAuditor.audit(movements, {
        initialBalance: '5000.00', // Solde dispo: 5k + 20k = 25k, Sortie: 35k -> Fin: -10k
      });

      expect(result.isCompliant).toBe(false);
      expect(result.hasCriticalNegativeBalance).toBe(true);
      expect(result.finalBalance).toBe('-10000.00');
      expect(result.anomalies.length).toBe(1);
      expect(result.anomalies[0].severity).toBe(Severity.BLOQUANT);
      expect(result.anomalies[0].descriptionFr).toContain('créditeur');
      expect(result.trace.legalRef).toContain('Article 43');
    });

    it('doit détecter un découvert intra-journalier en mode SEQUENCED même si la journée termine positive', () => {
      // Solde début: 2 000 DA
      // 09h00 : Sortie 15 000 DA -> Solde courant = -13 000 DA (DÉCOUVERT PHYSIQUE)
      // 16h00 : Entrée 30 000 DA -> Solde fin = +17 000 DA (POSITIF)
      const movements = [
        {
          id: 'MOV-01',
          date: '2026-02-18',
          timestamp: '09:00:00',
          sequenceNumber: 1,
          label: 'Paiement transporteur',
          inflow: '0.00',
          outflow: '15000.00',
        },
        {
          id: 'MOV-02',
          date: '2026-02-18',
          timestamp: '16:00:00',
          sequenceNumber: 2,
          label: 'Encaissement client',
          inflow: '30000.00',
          outflow: '0.00',
        },
      ];

      const result = CashRegisterAuditor.audit(movements, {
        initialBalance: '2000.00',
        auditModes: ['SEQUENCED'],
      });

      expect(result.isCompliant).toBe(false);
      expect(result.hasCriticalNegativeBalance).toBe(true);
      expect(result.anomalies.length).toBe(1);
      const anom = result.anomalies[0];
      expect(anom.mode).toBe('SEQUENCED');
      expect(anom.lowestIntradayBalance).toBe('-13000.00');
      expect(anom.failingMovementId).toBe('MOV-01');
      expect(anom.severity).toBe(Severity.BLOQUANT);
    });

    it('doit alerter sur la sensibilité à l ordre de saisie en mode WORST_CASE_WITHIN_DAY sans blocage absolu', () => {
      // Sans horodatage précis : Solde début 10 000 DA, Entrée 50 000 DA, Sortie 40 000 DA.
      // Solde fin: +20 000 DA.
      // Mais dans le pire des cas (sortie avant entrée) : 10 000 - 40 000 = -30 000 DA.
      const movements = [
        {
          id: 'MOV-A',
          date: '2026-02-20',
          label: 'Ventes du jour',
          inflow: '50000.00',
          outflow: '0.00',
        },
        {
          id: 'MOV-B',
          date: '2026-02-20',
          label: 'Règlement fournisseur divers',
          inflow: '0.00',
          outflow: '40000.00',
        },
      ];

      const result = CashRegisterAuditor.audit(movements, {
        initialBalance: '10000.00',
        auditModes: ['DAILY_NET', 'WORST_CASE_WITHIN_DAY'],
      });

      expect(result.hasCriticalNegativeBalance).toBe(false);
      expect(result.hasOrderSensitivity).toBe(true);
      expect(result.anomalies.length).toBe(1);
      expect(result.anomalies[0].mode).toBe('WORST_CASE_WITHIN_DAY');
      expect(result.anomalies[0].severity).toBe(Severity.MAJEUR);
      expect(result.anomalies[0].descriptionFr).toContain('Sensibilité à l ordre de saisie');
    });
  });

  // =========================================================================
  // 4. PAIEMENTS EN ESPÈCES & SEUILS RÉGLEMENTAIRES
  // =========================================================================
  describe('4. Seuils de Paiement en Espèces (CashThresholdChecker)', () => {
    const config = {
      ibsDeductibilityThresholdTtc: '300000.00', // Art. 169 CIDTA (LF 2018)
      tvaDeductibilityThresholdTtc: '100000.00', // Seuil TVA distinct UNVERIFIED
      rejectionPolicy: 'FULL_INVOICE' as const,
      prohibitedSectors: ['REAL_ESTATE'],
    };

    it('doit exclure de déductibilité fiscale IBS une charge payée en espèces excédant 300 000 DA TTC', () => {
      const invoices = [
        {
          id: 'INV-10',
          invoiceNumber: 'FAC-CASH-01',
          partnerId: 'SUPP-01',
          date: '2026-04-10',
          amountHt: '350000.00',
          vatAmount: '66500.00',
          amountTtc: '416500.00', // > 300k DA
          paymentMethod: 'CASH',
        },
      ];

      const result = CashThresholdChecker.check(invoices, config);

      expect(result.hasViolations).toBe(true);
      expect(result.totalViolations).toBe(2); // Dépasse IBS (300k) et TVA (100k)
      expect(result.totalReintegratedIbs).toBe('350000.00'); // Réintégration du HT
      expect(result.totalDeniedVat).toBe('66500.00'); // Perte de TVA déductible
    });

    it('doit bloquer immédiatement tout paiement en espèces dans le secteur immobilier (art. 207 LF 2025)', () => {
      const invoices = [
        {
          id: 'INV-IMMO',
          invoiceNumber: 'FAC-IMMO-01',
          partnerId: 'NOTAIRE-01',
          date: '2026-05-15',
          amountHt: '500000.00',
          vatAmount: '0.00',
          amountTtc: '500000.00',
          paymentMethod: 'CASH',
          sectorCategory: 'REAL_ESTATE',
        },
      ];

      const result = CashThresholdChecker.check(invoices, config);

      expect(result.hasViolations).toBe(true);
      const immoViolation = result.violations.find((v) => v.violationType === 'PROHIBITED_SECTOR_CASH');
      expect(immoViolation).toBeDefined();
      expect(immoViolation!.severity).toBe(Severity.BLOQUANT);
      expect(immoViolation!.legalReference).toContain('2025');
    });

    it('ne doit signaler aucune infraction pour une facture de 250 000 DA payée par chèque ou virement', () => {
      const invoices = [
        {
          id: 'INV-BANK',
          invoiceNumber: 'FAC-BANK-01',
          partnerId: 'SUPP-02',
          date: '2026-04-12',
          amountHt: '250000.00',
          vatAmount: '47500.00',
          amountTtc: '297500.00',
          paymentMethod: 'TRANSFER',
        },
      ];

      const result = CashThresholdChecker.check(invoices, config);

      expect(result.hasViolations).toBe(false);
      expect(result.totalViolations).toBe(0);
      expect(result.trace.outcome).toBe('COMPLIANT');
    });
  });

  // =========================================================================
  // 5. VALIDATION SYNTAXIQUE DES IDENTIFIANTS (NIF / NIS / RC / AI)
  // =========================================================================
  describe('5. Validation Syntaxique des Identifiants (IdentifierSyntaxValidator)', () => {
    it('doit valider la syntaxe d un NIF à 15 ou 20 chiffres sans inventer d algorithme de clé', () => {
      const nif15 = '160012345678901'; // 15 chiffres, Wilaya 16 (Alger)
      const res15 = IdentifierSyntaxValidator.validate(nif15, 'NIF');

      expect(res15.isValid).toBe(true);
      expect(res15.wilayaCode).toBe('16');
      expect(res15.verificationStatus).toBe(VerificationStatus.UNVERIFIED);
      expect(res15.hasOfficialChecksum).toBe(false);

      const nif20 = '16001234567890123456'; // 20 chiffres
      const res20 = IdentifierSyntaxValidator.validate(nif20, 'NIF');
      expect(res20.isValid).toBe(true);
    });

    it('doit rejeter un NIF comportant des lettres ou une longueur erronée', () => {
      const invalidNif = '16001234567890A'; // Lettre
      const res = IdentifierSyntaxValidator.validate(invalidNif, 'NIF');
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toContain('exclusivement des caractères numériques');

      const shortNif = '160012345678'; // 12 chiffres
      const resShort = IdentifierSyntaxValidator.validate(shortNif, 'NIF');
      expect(resShort.isValid).toBe(false);
      expect(resShort.rejectionReason).toContain('Longueur invalide');
    });

    it('doit valider le NIS (11 chiffres) et le Registre du Commerce (RC)', () => {
      const validNis = '00011601234';
      const resNis = IdentifierSyntaxValidator.validate(validNis, 'NIS');
      expect(resNis.isValid).toBe(true);

      const validRc = '16/00-1234567B26';
      const resRc = IdentifierSyntaxValidator.validate(validRc, 'RC');
      expect(resRc.isValid).toBe(true);
      expect(resRc.wilayaCode).toBe('16');
    });
  });

  // =========================================================================
  // 6. INCOHÉRENCES DE RATIOS DE GESTION & AUDIT
  // =========================================================================
  describe('6. Détecteur d Incohérences de Ratios (RatioAnomalyDetector)', () => {
    const profile = {
      sectorCode: 'NEGOCE_GROS',
      sectorNameFr: 'Commerce de gros',
      minGrossMarginRatio: '0.1200', // Marge min attendue : 12%
      maxGrossMarginRatio: '0.4500',
      minStockTurnoverTimes: '3.00', // Rotation min : 3 fois/an
      maxDsoDays: 90, // Délai client max : 90 jours
    };

    it('doit détecter une marge brute commerciale négative (anomalie bloquante)', () => {
      // CA HT: 10 000 000 DA, Achats consommés: 11 000 000 DA -> Marge: -1 000 000 DA (-10%)
      const result = RatioAnomalyDetector.analyze(
        {
          revenueHt: '10000000.00',
          consumedPurchasesHt: '11000000.00',
          averageStock: '1000000.00',
          clientReceivablesTtc: '500000.00',
        },
        profile
      );

      expect(result.hasAnomalies).toBe(true);
      const marginAnom = result.anomalies.find((a) => a.ratioCode === 'GROSS_MARGIN');
      expect(marginAnom).toBeDefined();
      expect(marginAnom!.deviationType).toBe('NEGATIVE_MARGIN');
      expect(marginAnom!.severity).toBe(Severity.BLOQUANT);
    });

    it('doit détecter un délai de recouvrement clients (DSO) excessif', () => {
      // CA TTC: 36 500 000 DA, Créances clients: 15 000 000 DA -> DSO = (15M / 36.5M) * 365 = 150 jours
      const result = RatioAnomalyDetector.analyze(
        {
          revenueHt: '30672268.91',
          revenueTtc: '36500000.00',
          consumedPurchasesHt: '20000000.00',
          averageStock: '3000000.00',
          clientReceivablesTtc: '15000000.00',
        },
        profile
      );

      expect(result.hasAnomalies).toBe(true);
      const dsoAnom = result.anomalies.find((a) => a.ratioCode === 'DSO');
      expect(dsoAnom).toBeDefined();
      expect(dsoAnom!.deviationType).toBe('EXCESSIVE_DSO');
      expect(parseFloat(result.dsoDays)).toBeCloseTo(150, 0);
      expect(dsoAnom!.severity).toBe(Severity.MAJEUR);
    });

    it('doit détecter une rotation des stocks anormalement lente', () => {
      // Achats consommés: 2 000 000 DA, Stock moyen: 4 000 000 DA -> Rotation = 0.5 fois/an (soit 730 jours de stock)
      const result = RatioAnomalyDetector.analyze(
        {
          revenueHt: '5000000.00',
          consumedPurchasesHt: '2000000.00',
          averageStock: '4000000.00',
          clientReceivablesTtc: '300000.00',
        },
        profile
      );

      expect(result.hasAnomalies).toBe(true);
      const stockAnom = result.anomalies.find((a) => a.ratioCode === 'STOCK_TURNOVER');
      expect(stockAnom).toBeDefined();
      expect(stockAnom!.deviationType).toBe('BELOW_MINIMUM');
      expect(result.stockTurnoverTimes).toBe('0.50');
      expect(result.stockDaysOfSupply).toBe('730.00');
    });
  });

  // =========================================================================
  // 7. CONSOLIDATION D'AUDIT (AuditReportGenerator)
  // =========================================================================
  describe('7. Consolidation d Audit (AuditReportGenerator)', () => {
    it('doit générer un rapport consolidé et classifier le risque global en CRITIQUE lors d une caisse créditrice', () => {
      // Simulation d'un dossier client
      const cashRes = CashRegisterAuditor.audit(
        [
          {
            id: 'M1',
            date: '2026-06-01',
            label: 'Dépense urgente',
            inflow: '0.00',
            outflow: '50000.00',
          },
        ],
        { initialBalance: '10000.00' } // Solde fin: -40 000 DA
      );

      const splittingRes = InvoiceSplittingDetector.detect(
        [
          {
            id: 'I1',
            invoiceNumber: 'FAC-1',
            partnerId: 'SUPP-X',
            issueDate: '2026-06-02',
            amountTtc: '290000.00',
          },
          {
            id: 'I2',
            invoiceNumber: 'FAC-2',
            partnerId: 'SUPP-X',
            issueDate: '2026-06-05',
            amountTtc: '295000.00',
          },
        ],
        { thresholdAmount: '300000.00', windowDays: 30 }
      );

      const report = AuditReportGenerator.generate({
        companyId: 'TENANT-DZ-001',
        fiscalYear: 2026,
        cashAuditResult: cashRes,
        splittingResult: splittingRes,
      });

      expect(report.companyId).toBe('TENANT-DZ-001');
      expect(report.fiscalYear).toBe(2026);
      expect(report.overallRiskLevel).toBe('CRITIQUE'); // À cause de la caisse négative bloquante
      expect(report.findingsBySeverity.bloquant).toBe(1);
      expect(report.findingsBySeverity.majeur).toBe(1);
      expect(report.findings.length).toBe(2);
      expect(report.totalEstimatedExposureDzd).toBe('585000.00'); // 290k + 295k de fractionnement
      expect(report.globalConclusionFr).toContain('CRITIQUE');
      expect(report.trace.outcome).toBe('BLOCKED');
    });
  });
});

