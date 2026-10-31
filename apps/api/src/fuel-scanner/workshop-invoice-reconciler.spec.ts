// Fichier : apps/api/src/fuel-scanner/workshop-invoice-reconciler.spec.ts
import {
  WorkshopInvoiceReconcilerService,
  InvoiceReconciliationInput,
} from './services/workshop-invoice-reconciler.service';

describe('Pilier 4 : Matrice de Réconciliation Factures à 3 Scénarios (TVA 19%, Timbre DGI, Remise & Arrondis)', () => {
  let reconciler: WorkshopInvoiceReconcilerService;

  beforeEach(() => {
    reconciler = new WorkshopInvoiceReconcilerService();
  });

  describe('1. Scénario 1 : Réconciliation Brute Hors Taxe (Bon de caisse atelier informel)', () => {
    it('should reconcile when exact sum of line items matches claimed total within 5 DZD tolerance', () => {
      const input: InvoiceReconciliationInput = {
        invoiceNumber: 'FAC-2026-DZ-041',
        vendorName: 'EURL Pièces Poids Lourds Rouiba',
        lineItems: [
          { designation: 'Filtre à huile Kerax DXi11', quantity: 2, unitPriceDzd: 4500, totalDzd: 9000 },
          { designation: 'Filtre à gasoil décanteur', quantity: 1, unitPriceDzd: 3800, totalDzd: 3800 },
          { designation: 'Huile 15W40 fût 20L', quantity: 1, unitPriceDzd: 16200, totalDzd: 16200 },
        ],
        // Total exact = 9000 + 3800 + 16200 = 29000 DZD. Facture réclamée avec 2 DZD d'arrondi = 29002 DZD.
        claimedTotalDzd: 29002,
      };

      const result = reconciler.reconcile(input);

      expect(result.status).toBe('RECONCILIE_AUTOMATIQUE');
      expect(result.winningScenario).toBe('SCENARIO_1_BRUT_HT');
      expect(result.linesSumDzd).toBe(29000);
      expect(result.discrepancyDzd).toBe(2.0);
      expect(result.details.mathematicalCheckPassed).toBe(true);
      expect(result.explanation).toContain('somme exacte des lignes');
    });
  });

  describe('2. Scénario 2 : Soumission avec TVA Algérienne 19% (Facture formelle)', () => {
    it('should reconcile when claimed total represents sum of lines multiplied by 1.19 (TVA standard)', () => {
      const input: InvoiceReconciliationInput = {
        invoiceNumber: 'FAC-TVA-1982',
        vendorName: 'SARL Maghreb Poids Lourds Bab Ezzouar',
        lineItems: [
          { designation: 'Plaquettes de frein Knorr SN7 Actros', quantity: 2, unitPriceDzd: 22000, totalDzd: 44000 },
          { designation: 'Disque de frein ventilé 45mm', quantity: 2, unitPriceDzd: 35000, totalDzd: 70000 },
        ],
        // Somme HT = 114 000 DZD. TTC attendu à 19% = 114 000 * 1.19 = 135 660 DZD.
        claimedTotalDzd: 135660,
      };

      const result = reconciler.reconcile(input);

      expect(result.status).toBe('RECONCILIE_AUTOMATIQUE');
      expect(result.winningScenario).toBe('SCENARIO_2_TTC_19PCT');
      expect(result.linesSumDzd).toBe(114000);
      expect(result.discrepancyDzd).toBe(0.0);
      expect(result.details.appliedVatRatePct).toBe(19);
      expect(result.explanation).toContain('TVA 19%');
    });
  });

  describe('3. Scénario 3 : Ajustement Timbre Fiscal DGI & Remise de Bas de Page', () => {
    it('should reconcile when total matches line items + DGI 1% stamp duty - discount', () => {
      const input: InvoiceReconciliationInput = {
        invoiceNumber: 'BON-CASH-771',
        vendorName: 'Atelier Mécanique du Sud (Hassi Messaoud)',
        lineItems: [
          { designation: 'Courroie alternateur Poly-V', quantity: 1, unitPriceDzd: 8500, totalDzd: 8500 },
          { designation: 'Tendeur automatique', quantity: 1, unitPriceDzd: 14000, totalDzd: 14000 },
        ],
        // Somme HT = 22 500 DZD.
        // Timbre espèces 1% DGI = 225 DZD.
        // Remise accordée par le mécanicien = 500 DZD.
        // Total net payé = 22 500 + 225 - 500 = 22 225 DZD.
        claimedTotalDzd: 22225,
        claimedDiscountDzd: 500,
        stampDutyDzd: 225,
      };

      const result = reconciler.reconcile(input);

      expect(result.status).toBe('RECONCILIE_AUTOMATIQUE');
      expect(result.winningScenario).toBe('SCENARIO_3_TIMBRE_ET_REMISE');
      expect(result.discrepancyDzd).toBe(0.0);
      expect(result.details.appliedStampDutyDzd).toBe(225);
      expect(result.details.appliedDiscountDzd).toBe(500);
    });
  });

  describe('4. Garde-Fou Comptable : Détection d Écart Inconciliable', () => {
    it('should route to RELECTURE_MANUELLE_REQUISE when discrepancy exceeds 5 DZD on all 3 scenarios', () => {
      const input: InvoiceReconciliationInput = {
        invoiceNumber: 'BON-SUSPECT-999',
        vendorName: 'Fournisseur Inconnu',
        lineItems: [
          { designation: 'Injecteur Common Rail Bosch', quantity: 1, unitPriceDzd: 42000, totalDzd: 42000 },
        ],
        // Somme = 42000. Réclamé = 48000 (écart de 6000 DZD ne correspondant ni à la TVA 19%, ni au timbre)
        claimedTotalDzd: 48000,
      };

      const result = reconciler.reconcile(input);

      expect(result.status).toBe('RELECTURE_MANUELLE_REQUISE');
      expect(result.winningScenario).toBe('AUCUN_SCENARIO_VALIDE');
      expect(result.discrepancyDzd).toBeGreaterThan(5.0);
      expect(result.details.mathematicalCheckPassed).toBe(false);
      expect(result.explanation).toContain('Divergence arithmétique constatée');
    });
  });

  describe('5. Précision Arithmétique & Immunité Float', () => {
    it('should compute accurately in integer cents without 0.1 + 0.2 floating point inaccuracies', () => {
      const input: InvoiceReconciliationInput = {
        lineItems: [
          { designation: 'Article A', quantity: 1, unitPriceDzd: 10.1, totalDzd: 10.1 },
          { designation: 'Article B', quantity: 1, unitPriceDzd: 20.2, totalDzd: 20.2 },
        ],
        claimedTotalDzd: 30.3,
      };

      const result = reconciler.reconcile(input);

      expect(result.status).toBe('RECONCILIE_AUTOMATIQUE');
      expect(result.linesSumDzd).toBe(30.3);
      expect(result.discrepancyDzd).toBe(0.0);
    });
  });
});
