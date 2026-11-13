/**
 * Tests Unitaires & Intégration : Moteur Comptable & Clôtures SCF (Phase 4)
 * 
 * Valide les exigences strictes de la Phase 4 :
 * 1. Stock CUMP :
 *    - 10 à 100 DA + entrée 10 à 110 DA -> CUMP = 105 DA
 *    - Sortie 15 à 105 DA -> Reste 5 à 105 DA (valeur 525 DA)
 *    - Frais d'approche tardifs de 200 DA sur stock nul -> imputés en charge, stock reste 0 DA
 *    - Rejeu idempotent sans dérive d'arrondi
 * 2. Amortissement linéaire & dégressif :
 *    - Machine 1 000 000 DA, 5 ans, linéaire, mise en service 15/04/2026 -> dotation 2026 exacte au jour près
 *    - Dégressif avec bascule linéaire
 *    - Sortie d'actif / mise au rebut avec calcul de VNC
 * 3. BTPH Contrats à long terme :
 *    - Marché 10M DA, CTET 11M DA, engagé 4M DA (alpha = 4/11) -> L = 1M DA, provision = 636 363.64 DA
 * 4. Liasse SCF :
 *    - Balance générale avant & après inventaire
 *    - Bilan équilibré Actif == Passif au centime près
 *    - Résultat Bilan == Résultat Compte de Résultat
 */

import { describe, it, expect } from 'vitest';
import {
  StockCumpEngine,
  DepreciationEngine,
  LongTermContractEngine,
  GeneralBalanceEngine,
  FinancialStatementsEngine,
  AccountRole,
  LedgerEntry,
} from '../src/index.js';

describe('Moteur Comptable & Clôtures SCF (Phase 4)', () => {
  // ===========================================================================
  // 1. VALORISATION DES STOCKS CUMP
  // ===========================================================================
  describe('1. Valorisation des stocks CUMP (par la valeur, sans dérive)', () => {
    it('calcule exactement : 10 à 100 DA + entrée 10 à 110 DA -> CUMP = 105 DA ; sortie 15 -> reste 5 à 525 DA ; frais tardifs 200 DA sur stock nul imputés en charge', () => {
      let state = StockCumpEngine.createInitialState();

      // Étape 1 : Stock initial 10 unités à 100 DA (Total 1 000 DA)
      const res1 = StockCumpEngine.applyMovement(state, {
        id: 'stk-001',
        date: '2026-01-10',
        type: 'ENTRY',
        quantity: '10',
        unitCost: '100.00',
        label: 'Stock initial',
      });
      state = res1.nextState;
      expect(state.quantity.toFixed(2)).toBe('10.00');
      expect(state.totalValue.toFixed(2)).toBe('1000.00');
      expect(state.cump.toFixed(2)).toBe('100.00');

      // Étape 2 : Entrée de 10 unités à 110 DA (Total 1 100 DA)
      // Nouveau stock : 20 unités, Valeur = 2 100 DA -> CUMP = 2100 / 20 = 105.00 DA
      const res2 = StockCumpEngine.applyMovement(state, {
        id: 'stk-002',
        date: '2026-01-15',
        type: 'ENTRY',
        quantity: '10',
        unitCost: '110.00',
        label: 'Réception fournisseur n°2',
      });
      state = res2.nextState;
      expect(state.quantity.toFixed(2)).toBe('20.00');
      expect(state.totalValue.toFixed(2)).toBe('2100.00');
      expect(state.cump.toFixed(2)).toBe('105.00');

      // Étape 3 : Sortie de 15 unités à 105 DA
      // Sortie valorisée = 15 * 105 = 1 575 DA
      // Reste : 5 unités, Valeur = 2 100 - 1 575 = 525.00 DA
      const res3 = StockCumpEngine.applyMovement(state, {
        id: 'stk-003',
        date: '2026-01-20',
        type: 'ISSUE',
        quantity: '15',
        label: 'Bon de livraison client BL-001',
      });
      state = res3.nextState;
      expect(res3.issuedValue.toFixed(2)).toBe('1575.00');
      expect(state.quantity.toFixed(2)).toBe('5.00');
      expect(state.totalValue.toFixed(2)).toBe('525.00');
      expect(state.cump.toFixed(2)).toBe('105.00');

      // Étape 4 : Sortie des 5 unités restantes -> vidage total
      const res4 = StockCumpEngine.applyMovement(state, {
        id: 'stk-004',
        date: '2026-01-25',
        type: 'ISSUE',
        quantity: '5',
        label: 'Vente solde stock',
      });
      state = res4.nextState;
      expect(res4.issuedValue.toFixed(2)).toBe('525.00');
      expect(state.quantity.toFixed(2)).toBe('0.00');
      expect(state.totalValue.toFixed(2)).toBe('0.00');

      // Étape 5 : Arrivée de frais d'approche tardifs de 200 DA quand le stock physique est NUL
      // RÈGLE SCF : Imputation en charge d'exploitation, valeur de stock reste 0 DA
      const res5 = StockCumpEngine.applyMovement(state, {
        id: 'stk-005',
        date: '2026-02-05',
        type: 'LATE_LANDED_COST',
        quantity: '0',
        totalCost: '200.00',
        label: 'Facture transitaire tardive sur lot épuisé',
      });
      state = res5.nextState;
      expect(res5.expenseValue.toFixed(2)).toBe('200.00');
      expect(state.quantity.toFixed(2)).toBe('0.00');
      expect(state.totalValue.toFixed(2)).toBe('0.00'); // La valeur du stock reste rigoureusement 0.00 DA !
    });

    it('garantit l idempotence : rejouer un mouvement déjà appliqué produit un delta de 0', () => {
      let state = StockCumpEngine.createInitialState();
      const mvt = {
        id: 'stk-replay-001',
        date: '2026-01-10',
        type: 'ENTRY' as const,
        quantity: '50',
        unitCost: '200.00',
        label: 'Lot A',
      };

      const res1 = StockCumpEngine.applyMovement(state, mvt);
      expect(res1.movementApplied).toBe(true);
      expect(res1.nextState.quantity.toFixed(2)).toBe('50.00');

      // Rejeu du même mouvement
      const res2 = StockCumpEngine.applyMovement(res1.nextState, mvt);
      expect(res2.movementApplied).toBe(false);
      expect(res2.issuedValue.toFixed(2)).toBe('0.00');
      expect(res2.nextState.quantity.toFixed(2)).toBe('50.00');
      expect(res2.nextState.totalValue.toFixed(2)).toBe('10000.00');
    });
  });

  // ===========================================================================
  // 2. AMORTISSEMENTS (LINÉAIRE, DÉGRESSIF & PRORATA EXACT)
  // ===========================================================================
  describe('2. Moteur d amortissements (Linéaire, Dégressif, Prorata exact au jour près)', () => {
    it('calcule la dotation exacte 2026 au jour près : Machine 1 000 000 DA, 5 ans, mise en service 15/04/2026', () => {
      // 2026 n'est pas bissextile (365 jours).
      // Du 15/04/2026 au 31/12/2026 = 261 jours.
      // Annuité pleine = 1 000 000 * 20% = 200 000 DA.
      // Dotation 2026 = 200 000 * (261 / 365) = 143 013.70 DA.
      const schedule = DepreciationEngine.generateSchedule({
        assetId: 'AST-MACHINE-001',
        label: 'Tour numérique CNC',
        acquisitionCost: '1000000.00',
        usefulLifeYears: 5,
        serviceDate: '2026-04-15',
        method: 'LINEAIRE',
        prorataConvention: 'EXACT_DAYS',
      });

      expect(schedule.length).toBe(6); // 2026 (prorata) + 4 années pleines + 2031 (solde)

      // Année 1 (2026) : 261 jours
      expect(schedule[0].fiscalYear).toBe(2026);
      expect(schedule[0].depreciation).toBe('143013.70');
      expect(schedule[0].closingVnc).toBe('856986.30');

      // Années 2027 à 2030 : annuités pleines de 200 000.00 DA
      expect(schedule[1].depreciation).toBe('200000.00');
      expect(schedule[2].depreciation).toBe('200000.00');
      expect(schedule[3].depreciation).toBe('200000.00');
      expect(schedule[4].depreciation).toBe('200000.00');

      // Année 6 (2031) : solde du prorata = 200 000 - 143 013.70 = 56 986.30 DA
      expect(schedule[5].fiscalYear).toBe(2031);
      expect(schedule[5].depreciation).toBe('56986.30');
      expect(schedule[5].closingVnc).toBe('0.00'); // Amortissement intégral au centime près
    });

    it('gère l amortissement dégressif avec bascule automatique en linéaire', () => {
      // Machine 1 000 000 DA, 5 ans, dégressif coefficient 2.0 (taux = 40%), mise en service 01/01/2026
      const schedule = DepreciationEngine.generateSchedule({
        assetId: 'AST-DEGRESSIF-001',
        label: 'Matériel informatique serveur',
        acquisitionCost: '1000000.00',
        usefulLifeYears: 5,
        serviceDate: '2026-01-01',
        method: 'DEGRESSIF',
        degressiveCoefficients: { threeToFourYears: '1.5', fiveToSixYears: '2.0', moreThanSixYears: '2.5' },
      });

      expect(schedule.length).toBe(5);

      // Année 1 : 1 000 000 * 40% = 400 000 DA (Dégressif)
      expect(schedule[0].fiscalYear).toBe(2026);
      expect(schedule[0].methodUsed).toBe('DEGRESSIF');
      expect(schedule[0].depreciation).toBe('400000.00');
      expect(schedule[0].closingVnc).toBe('600000.00');

      // Année 2 : 600 000 * 40% = 240 000 DA (Dégressif)
      expect(schedule[1].fiscalYear).toBe(2027);
      expect(schedule[1].methodUsed).toBe('DEGRESSIF');
      expect(schedule[1].depreciation).toBe('240000.00');
      expect(schedule[1].closingVnc).toBe('360000.00');

      // Année 3 : 360 000 * 40% = 144 000 DA (Linéaire résiduel = 1/3 = 33.33% < 40%)
      expect(schedule[2].fiscalYear).toBe(2028);
      expect(schedule[2].methodUsed).toBe('DEGRESSIF');
      expect(schedule[2].depreciation).toBe('144000.00');
      expect(schedule[2].closingVnc).toBe('216000.00');

      // Année 4 : Linéaire résiduel = 1/2 = 50% > 40% -> BASCULE EN LINÉAIRE !
      // Dotation = 216 000 / 2 = 108 000 DA
      expect(schedule[3].fiscalYear).toBe(2029);
      expect(schedule[3].methodUsed).toBe('LINEAIRE');
      expect(schedule[3].depreciation).toBe('108000.00');
      expect(schedule[3].closingVnc).toBe('108000.00');

      // Année 5 : Solde linéaire = 108 000 DA
      expect(schedule[4].fiscalYear).toBe(2030);
      expect(schedule[4].methodUsed).toBe('LINEAIRE');
      expect(schedule[4].depreciation).toBe('108000.00');
      expect(schedule[4].closingVnc).toBe('0.00');
    });

    it('calcule la VNC exacte lors d une mise au rebut anticipée', () => {
      const retirement = DepreciationEngine.retireAsset(
        {
          assetId: 'AST-REBUT-001',
          label: 'Véhicule utilitaire accidenté',
          acquisitionCost: '1000000.00',
          usefulLifeYears: 5,
          serviceDate: '2026-01-01',
          method: 'LINEAIRE',
        },
        '2027-06-30' // Mise au rebut au 30/06 de la 2ème année (181 jours sur 365)
      );

      // Année 2026 complète amortie : 200 000.00 DA
      // Dotation 2027 (181 jours) : 200 000 * (181 / 365) = 99 178.08 DA
      expect(retirement.partialYearDepreciation).toBe('99178.08');
      expect(retirement.totalCumulativeDepreciation).toBe('299178.08');
      expect(retirement.netBookValueAtRetirement).toBe('700821.92');
    });
  });

  // ===========================================================================
  // 3. CONTRATS À LONG TERME BTPH (PERTES À TERMINAISON)
  // ===========================================================================
  describe('3. Contrats à long terme BTPH & Pertes à terminaison', () => {
    it('calcule exactement : Marché 10M, CTET initial 8M révisé à 11M, engagé 4M (alpha = 4/11) -> L = 1M DA, provision = 636 363.64 DA', () => {
      const evalResult = LongTermContractEngine.evaluate({
        contractId: 'BTPH-AUTOROUTE-001',
        label: 'Construction tronçon autoroutier',
        marketPrice: '10000000.00',          // 10 M DA
        initialEstimatedCost: '8000000.00',   // 8 M DA initial
        revisedEstimatedCost: '11000000.00',  // 11 M DA révisé (perte prévisible)
        incurredCost: '4000000.00',          // 4 M DA engagés
        progressMethod: 'COST_TO_COST',
      });

      // 1. Taux d'avancement alpha = 4 000 000 / 11 000 000 = 4 / 11 = 0.363636...
      expect(evalResult.progressRate).toBe('0.363636');

      // 2. Chiffre d'affaires à l'avancement = 10 000 000 * (4/11) = 3 636 363.64 DA
      expect(evalResult.recognizedRevenue).toBe('3636363.64');

      // 3. Marge d'exploitation = 3 636 363.64 - 4 000 000 = -363 636.36 DA (perte constatée)
      expect(evalResult.operatingMargin).toBe('-363636.36');
      expect(evalResult.lossAlreadyRecognized).toBe('363636.36');

      // 4. Perte globale à terminaison : L = max(0, 11M - 10M) = 1 000 000.00 DA
      expect(evalResult.lossAtCompletionTotal).toBe('1000000.00');

      // 5. Provision pour perte à terminaison complémentaire au bilan :
      // Formule exacte : L * (1 - alpha) = 1 000 000 * (7/11) = 636 363.64 DA
      expect(evalResult.lossProvisionRequired).toBe('636363.64');

      // 6. Impact total d'exercice sur le résultat = 363 636.36 + 636 363.64 = 1 000 000.00 DA
      const totalImpact = parseFloat(evalResult.lossAlreadyRecognized) + parseFloat(evalResult.lossProvisionRequired);
      expect(totalImpact).toBe(1000000.00);
    });
  });

  // ===========================================================================
  // 4. LIASSE SCF (BALANCE, BILAN ÉQUILIBRÉ, COMPTE DE RÉSULTAT, TFT, TVCP)
  // ===========================================================================
  describe('4. Générateur des Liasses SCF & Invariants Bilanciels', () => {
    it('génère une liasse SCF complète avec Bilan équilibré au centime près et résultat réconcilié', () => {
      // Simuler une balance générale issue d'une activité réelle complète :
      // Capital : 1 000 000 DA
      // Vente de marchandises : 600 000 DA
      // Coût d'achat marchandises vendues : 300 000 DA
      // Salaires et charges : 120 000 DA
      // Dotation aux amortissements : 50 000 DA
      // Dotation provision perte BTPH : 30 000 DA
      // Immobilisations brutes : 500 000 DA, Amortissements cumulés : 50 000 DA
      // Trésorerie Banque/Caisse : 950 000 DA
      // Fournisseurs dettes : 100 000 DA
      // Dettes fiscales et sociales : 50 000 DA
      // Provision pour perte à terminaison : 30 000 DA
      // Clients créances : 100 000 DA
      const mockEntries: LedgerEntry[] = [
        // Apport en capital (Débit Banque 1 000 000 / Crédit Associés 1 000 000)
        {
          id: '1', tenantId: 't1', periodId: 'p1', pieceNumber: 'BQ-01', lineNumber: 1,
          localDate: '2026-01-01', recordedAt: '2026-01-01T08:00:00Z',
          accountRole: AccountRole.BANK, accountNumber: '512000', label: 'Banque',
          debit: '1000000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: '0', hash: 'h1', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '2', tenantId: 't1', periodId: 'p1', pieceNumber: 'BQ-01', lineNumber: 2,
          localDate: '2026-01-01', recordedAt: '2026-01-01T08:00:00Z',
          accountRole: AccountRole.CURRENT_ACCOUNT_PARTNERS, accountNumber: '455000', label: 'Apport Capital',
          debit: null, credit: '1000000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h1', hash: 'h2', status: 'VALIDATED', packHash: 'pk'
        },

        // Acquisition Immo 500 000 DA payée 400 000 DA par banque, 100 000 DA dette fournisseur
        {
          id: '3', tenantId: 't1', periodId: 'p1', pieceNumber: 'AC-01', lineNumber: 1,
          localDate: '2026-01-15', recordedAt: '2026-01-15T08:00:00Z',
          accountRole: AccountRole.FIXED_ASSETS, accountNumber: '215000', label: 'Machine outil',
          debit: '500000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h2', hash: 'h3', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '4', tenantId: 't1', periodId: 'p1', pieceNumber: 'AC-01', lineNumber: 2,
          localDate: '2026-01-15', recordedAt: '2026-01-15T08:00:00Z',
          accountRole: AccountRole.BANK, accountNumber: '512000', label: 'Règlement immo',
          debit: null, credit: '400000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h3', hash: 'h4', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '5', tenantId: 't1', periodId: 'p1', pieceNumber: 'AC-01', lineNumber: 3,
          localDate: '2026-01-15', recordedAt: '2026-01-15T08:00:00Z',
          accountRole: AccountRole.SUPPLIER_FIXED_ASSETS, accountNumber: '404000', label: 'Dette immo fournisseur',
          debit: null, credit: '100000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h4', hash: 'h5', status: 'VALIDATED', packHash: 'pk'
        },

        // Vente de 600 000 DA (500 000 encaissés en banque, 100 000 en créance client)
        {
          id: '6', tenantId: 't1', periodId: 'p1', pieceNumber: 'VT-01', lineNumber: 1,
          localDate: '2026-02-01', recordedAt: '2026-02-01T08:00:00Z',
          accountRole: AccountRole.BANK, accountNumber: '512000', label: 'Encaissement vente',
          debit: '500000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h5', hash: 'h6', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '7', tenantId: 't1', periodId: 'p1', pieceNumber: 'VT-01', lineNumber: 2,
          localDate: '2026-02-01', recordedAt: '2026-02-01T08:00:00Z',
          accountRole: AccountRole.CLIENT, accountNumber: '411000', label: 'Créance client',
          debit: '100000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h6', hash: 'h7', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '8', tenantId: 't1', periodId: 'p1', pieceNumber: 'VT-01', lineNumber: 3,
          localDate: '2026-02-01', recordedAt: '2026-02-01T08:00:00Z',
          accountRole: AccountRole.REVENUE_SALES, accountNumber: '700000', label: 'Chiffre d affaires',
          debit: null, credit: '600000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h7', hash: 'h8', status: 'VALIDATED', packHash: 'pk'
        },

        // Coût d'achat des marchandises vendues 300 000 DA (payé par banque)
        {
          id: '9', tenantId: 't1', periodId: 'p1', pieceNumber: 'AC-02', lineNumber: 1,
          localDate: '2026-02-10', recordedAt: '2026-02-10T08:00:00Z',
          accountRole: AccountRole.COGS_MERCHANDISE, accountNumber: '600000', label: 'Achats marchandises',
          debit: '300000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h8', hash: 'h9', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '10', tenantId: 't1', periodId: 'p1', pieceNumber: 'AC-02', lineNumber: 2,
          localDate: '2026-02-10', recordedAt: '2026-02-10T08:00:00Z',
          accountRole: AccountRole.BANK, accountNumber: '512000', label: 'Paiement achats',
          debit: null, credit: '300000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h9', hash: 'h10', status: 'VALIDATED', packHash: 'pk'
        },

        // Salaires 120 000 DA (70 000 payés net par banque, 50 000 dettes sociales/fiscales à payer)
        {
          id: '11', tenantId: 't1', periodId: 'p1', pieceNumber: 'PA-01', lineNumber: 1,
          localDate: '2026-02-28', recordedAt: '2026-02-28T08:00:00Z',
          accountRole: AccountRole.EXPENSE_PAYROLL, accountNumber: '631000', label: 'Salaires bruts',
          debit: '120000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h10', hash: 'h11', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '12', tenantId: 't1', periodId: 'p1', pieceNumber: 'PA-01', lineNumber: 2,
          localDate: '2026-02-28', recordedAt: '2026-02-28T08:00:00Z',
          accountRole: AccountRole.BANK, accountNumber: '512000', label: 'Virement salaires nets',
          debit: null, credit: '70000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h11', hash: 'h12', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '13', tenantId: 't1', periodId: 'p1', pieceNumber: 'PA-01', lineNumber: 3,
          localDate: '2026-02-28', recordedAt: '2026-02-28T08:00:00Z',
          accountRole: AccountRole.SOCIAL_CHARGES_PAYABLE, accountNumber: '431000', label: 'CNAS & IRG à payer',
          debit: null, credit: '50000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h12', hash: 'h13', status: 'VALIDATED', packHash: 'pk'
        },

        // OD D'INVENTAIRE : Dotation amortissement 50 000 DA
        {
          id: '14', tenantId: 't1', periodId: 'p1', pieceNumber: 'OD-CLOTURE-01', lineNumber: 1,
          localDate: '2026-12-31', recordedAt: '2026-12-31T20:00:00Z',
          accountRole: AccountRole.DEPRECIATION_EXPENSE, accountNumber: '681000', label: 'Dotation amortissement immo',
          debit: '50000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h13', hash: 'h14', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '15', tenantId: 't1', periodId: 'p1', pieceNumber: 'OD-CLOTURE-01', lineNumber: 2,
          localDate: '2026-12-31', recordedAt: '2026-12-31T20:00:00Z',
          accountRole: AccountRole.DEPRECIATION_ACCUMULATED, accountNumber: '281500', label: 'Amortissements cumulés',
          debit: null, credit: '50000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h14', hash: 'h15', status: 'VALIDATED', packHash: 'pk'
        },

        // OD D'INVENTAIRE : Provision pour perte à terminaison BTPH 30 000 DA
        {
          id: '16', tenantId: 't1', periodId: 'p1', pieceNumber: 'OD-CLOTURE-02', lineNumber: 1,
          localDate: '2026-12-31', recordedAt: '2026-12-31T20:00:00Z',
          accountRole: AccountRole.PROVISION_EXPENSE, accountNumber: '683000', label: 'Dotation provision perte BTPH',
          debit: '30000.00', credit: null, amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h15', hash: 'h16', status: 'VALIDATED', packHash: 'pk'
        },
        {
          id: '17', tenantId: 't1', periodId: 'p1', pieceNumber: 'OD-CLOTURE-02', lineNumber: 2,
          localDate: '2026-12-31', recordedAt: '2026-12-31T20:00:00Z',
          accountRole: AccountRole.LOSS_AT_COMPLETION_PROVISION, accountNumber: '151000', label: 'Provision pour risques 151',
          debit: null, credit: '30000.00', amountHt: null, vatAmount: null, tags: [],
          prevHash: 'h16', hash: 'h17', status: 'VALIDATED', packHash: 'pk'
        },
      ];

      // 1. Calcul de la balance générale après inventaire
      const balance = GeneralBalanceEngine.computeBalance(mockEntries, {
        fiscalYear: 2026,
        periodCode: '2026-FY',
        isPostInventory: true,
      });

      expect(balance.isBalanced).toBe(true);
      expect(balance.grandTotalDebitMovements).toBe('2600000.00');
      expect(balance.grandTotalCreditMovements).toBe('2600000.00');
      expect(balance.grandTotalDebitBalances).toBe('1830000.00');
      expect(balance.grandTotalCreditBalances).toBe('1830000.00');

      // 2. Génération de la Liasse SCF
      const statements = FinancialStatementsEngine.generateStatements(balance);

      // A. Vérification du Compte de Résultat :
      // Produits : CA = 600 000 DA
      // Charges : Consommation = 300 000 DA, Salaires = 120 000 DA, Dotations = 50 000 (amort) + 30 000 (prov) = 80 000 DA
      // Résultat Net = 600 000 - 300 000 - 120 000 - 80 000 = 100 000.00 DA !
      expect(statements.compteDeResultat.chiffreAffairesVentes).toBe('600000.00');
      expect(statements.compteDeResultat.consommationExercice).toBe('300000.00');
      expect(statements.compteDeResultat.chargesPersonnel).toBe('120000.00');
      expect(statements.compteDeResultat.dotationsAmortissementsEtProvisions).toBe('80000.00');
      expect(statements.compteDeResultat.resultatNetExercice).toBe('100000.00');

      // B. Vérification du Bilan Actif :
      // Immo nettes = 500 000 - 50 000 = 450 000 DA
      // Clients = 100 000 DA
      // Banque solde net = 1 000 000 - 400 000 + 500 000 - 300 000 - 70 000 = 730 000 DA
      // Total Actif = 450 000 + 100 000 + 730 000 = 1 280 000.00 DA
      expect(statements.bilanActif.immobilisationsCorporellesNettes).toBe('450000.00');
      expect(statements.bilanActif.creancesClients).toBe('100000.00');
      expect(statements.bilanActif.disponibilitesTresorerie).toBe('730000.00');
      expect(statements.bilanActif.totalActif).toBe('1280000.00');

      // C. Vérification du Bilan Passif :
      // Capitaux Propres = Capital 1 000 000 + Résultat Net 100 000 = 1 100 000 DA
      // Provisions pour risques = 30 000 DA
      // Fournisseurs = 100 000 DA
      // Dettes fiscales & sociales = 50 000 DA
      // Total Passif = 1 100 000 + 30 000 + 100 000 + 50 000 = 1 280 000.00 DA
      expect(statements.bilanPassif.capitalEtComptesExploitant).toBe('1000000.00');
      expect(statements.bilanPassif.resultatNetExercice).toBe('100000.00');
      expect(statements.bilanPassif.totalCapitauxPropres).toBe('1100000.00');
      expect(statements.bilanPassif.provisionsPourCharges).toBe('30000.00');
      expect(statements.bilanPassif.dettesFournisseurs).toBe('100000.00');
      expect(statements.bilanPassif.dettesFiscalesEtSociales).toBe('50000.00');
      expect(statements.bilanPassif.totalPassif).toBe('1280000.00');

      // D. RÈGLE CRITIQUE SCF : ÉGALITÉ PARFAITE ACTIF == PASSIF AU CENTIME PRÈS
      expect(statements.isBilanBalanced).toBe(true);
      expect(statements.bilanDiscrepancy).toBe('0.00');
      expect(statements.bilanActif.totalActif).toBe(statements.bilanPassif.totalPassif);

      // E. RÈGLE CRITIQUE SCF : RÉSULTAT COMPTE DE RÉSULTAT == RÉSULTAT BILAN
      expect(statements.bilanPassif.resultatNetExercice).toBe(statements.compteDeResultat.resultatNetExercice);
    });
  });
});
