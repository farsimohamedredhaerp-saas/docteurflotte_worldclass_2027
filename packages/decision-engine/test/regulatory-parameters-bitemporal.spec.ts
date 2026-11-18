import { describe, it, expect } from 'vitest';
import {
  RegPackResolver,
  DZ_LF_2025_OFFICIAL,
  DZ_LF_2026_OFFICIAL,
  DZ_LF_2027_DRAFT,
  DZ_BUSINESS_DEFAULTS_PACK,
  EngineDecimal,
  IfuAnaeEngine,
  IbsEngine,
} from '../src';

describe('Moteur Décisionnel Bitemporel Universel — Packs Réglementaires & Paramètres', () => {
  const allOfficialPacks = [DZ_LF_2025_OFFICIAL, DZ_LF_2026_OFFICIAL, DZ_LF_2027_DRAFT];

  describe('Exercice 2025 (Loi de Finances 2025)', () => {
    const state2025 = RegPackResolver.resolve(allOfficialPacks, {
      asOf: '2025-06-15',
      knownAt: '2026-11-18T00:00:00.000Z',
    });

    it('résout le minimum IFU ordinaire rehaussé à 30 000 DZD (LF 2025) et distinct de l\'auto-entrepreneur', () => {
      const ifuMinGeneral = state2025.getParameterDecimal('IFU_MINIMUM_GENERAL');
      const ifuMinAnae = state2025.getParameterDecimal('IFU_MINIMUM_AUTO_ENTREPRENEUR');

      expect(ifuMinGeneral.toFixed(2)).toBe('30000.00');
      expect(ifuMinAnae.toFixed(2)).toBe('10000.00');
    });

    it('résout le taux global CNAS à 34.5% et sa décomposition exacte (25.5% employeur + 9% salarié)', () => {
      const cnasGlobal = state2025.getParameterDecimal('CNAS_TAUX_GLOBAL');
      const cnasEmp = state2025.getParameterDecimal('CNAS_PART_EMPLOYEUR');
      const cnasSal = state2025.getParameterDecimal('CNAS_PART_SALARIE');

      expect(cnasGlobal.toFixed(3)).toBe('0.345');
      expect(cnasEmp.toFixed(3)).toBe('0.255');
      expect(cnasSal.toFixed(3)).toBe('0.090');
      expect(cnasEmp.plus(cnasSal).toFixed(3)).toBe(cnasGlobal.toFixed(3));
    });

    it('calcule l\'IRG progressif annuel exactement selon les 6 tranches de l\'Art. 104 CIDTA', () => {
      // Cas 1 : Revenu dans la 1ère tranche exonérée (ex: 200 000 DA)
      const resExonere = state2025.evaluateProgressiveBracket('IRG_BAREME_ANNUEL', '200000');
      expect(resExonere.totalTaxOrDuty.toFixed(2)).toBe('0.00');

      // Cas 2 : Revenu dans la 2ème tranche (ex: 300 000 DA)
      // Base tranche 2 = 300 000 - 240 000 = 60 000 DA à 23% = 13 800 DA
      const resT2 = state2025.evaluateProgressiveBracket('IRG_BAREME_ANNUEL', '300000');
      expect(resT2.totalTaxOrDuty.toFixed(2)).toBe('13800.00');

      // Cas 3 : Revenu dans la 3ème tranche (ex: 600 000 DA)
      // Tranche 1 (0-240k) : 0 DA
      // Tranche 2 (240k-480k) : 240 000 * 0.23 = 55 200 DA
      // Tranche 3 (480k-600k) : 120 000 * 0.27 = 32 400 DA
      // Total = 55 200 + 32 400 = 87 600 DA
      const resT3 = state2025.evaluateProgressiveBracket('IRG_BAREME_ANNUEL', '600000');
      expect(resT3.totalTaxOrDuty.toFixed(2)).toBe('87600.00');
    });

    it('calcule les droits de timbre sur espèces par tranches de 100 DA', () => {
      // 25 000 DA (tranche 1 : 1 DA par 100 DA) -> 250 tranches de 100 DA = 250 DA
      const resTimbre1 = state2025.evaluateProgressiveBracket('TIMBRE_ESPECES_BAREME', '25000');
      expect(resTimbre1.totalTaxOrDuty.toFixed(2)).toBe('250.00');

      // 50 000 DA :
      // Tranche 1 (0 à 30 000) = 300 tranches de 100 DA * 1.0 = 300 DA
      // Tranche 2 (30 001 à 50 000) = 20 000 / 100 = 200 tranches * 1.5 = 300 DA
      // Total = 600 DA
      const resTimbre2 = state2025.evaluateProgressiveBracket('TIMBRE_ESPECES_BAREME', '50000');
      expect(resTimbre2.totalTaxOrDuty.toFixed(2)).toBe('600.00');
    });

    it('fournit les paramètres au moteur IfuAnaeEngine pour appliquer le nouveau minimum de 30 000 DA', () => {
      // Petit artisan déclarant 100 000 DA de services à 12% = 12 000 DA calculés
      // Mais minimum fiscal = 30 000 DA -> Doit appliquer 30 000 DA
      const ifuResult = IfuAnaeEngine.evaluateIfu({
        fiscalYear: 2025,
        goodsRevenue: '0',
        servicesRevenue: '100000',
        goodsRate: state2025.getParameter<string>('IFU_TAUX_PRODUCTION_VENTE')!,
        servicesRate: state2025.getParameter<string>('IFU_TAUX_SERVICES')!,
        minimumTaxAmount: state2025.getParameter<string>('IFU_MINIMUM_GENERAL')!,
        eligibilityThreshold: state2025.getParameter<string>('IFU_CA_PLAFOND_GENERAL')!,
      });

      expect(ifuResult.totalCalculatedTax).toBe('12000.00');
      expect(ifuResult.minimumTaxApplied).toBe(true);
      expect(ifuResult.finalTaxDue).toBe('30000.00');
      expect(ifuResult.isEligible).toBe(true);
    });
  });

  describe('Exercice 2026 (Loi de Finances 2026)', () => {
    const state2026 = RegPackResolver.resolve(allOfficialPacks, {
      asOf: '2026-06-15',
      knownAt: '2026-11-18T00:00:00.000Z',
    });

    it('résout la revalorisation de l\'assiette et de la cotisation minimale CASNOS (288 000 / 43 200 DA)', () => {
      const assietteMin = state2026.getParameterDecimal('CASNOS_ASSIETTE_MINIMALE');
      const cotisMin = state2026.getParameterDecimal('CASNOS_COTISATION_MINIMALE');

      expect(assietteMin.toFixed(2)).toBe('288000.00');
      expect(cotisMin.toFixed(2)).toBe('43200.00');
      expect(assietteMin.times('0.15').toFixed(2)).toBe(cotisMin.toFixed(2));
    });

    it('résout les nouveaux dispositifs LF 2026 : Startups, TFPC/TAPP semestrielles, R&D et Prix de Transfert', () => {
      const startupInit = state2026.getParameterDecimal('STARTUP_EXONERATION_DUREE_INITIALE_ANNEES');
      const startupProlong = state2026.getParameterDecimal('STARTUP_EXONERATION_PROLONGATION_ANNEES');
      const tfpcSem = state2026.getParameterDecimal('TFPC_TAUX_SEMESTRIEL');
      const tappSem = state2026.getParameterDecimal('TAPP_TAUX_SEMESTRIEL');
      const rdRate = state2026.getParameterDecimal('CREDIT_IMPOT_RD_TAUX');
      const tpThreshold = state2026.getParameterDecimal('PRIX_TRANSFERT_SEUIL_CA');
      const tpPenalty = state2026.getParameterDecimal('PRIX_TRANSFERT_PENALITE');

      expect(startupInit.toNumber()).toBe(4);
      expect(startupProlong.toNumber()).toBe(2);
      expect(tfpcSem.toFixed(2)).toBe('0.01');
      expect(tappSem.toFixed(2)).toBe('0.01');
      expect(rdRate.toFixed(2)).toBe('0.35'); // 35%
      expect(tpThreshold.toFixed(0)).toBe('2000000000'); // 2 Milliards DA
      expect(tpPenalty.toFixed(0)).toBe('2500000'); // 2.5 Millions DA
    });

    it('permet à l\'IbsEngine d\'appliquer dynamiquement le taux production (19%) ou autres (26%) résolus du pack', () => {
      const rateProduction = state2026.getParameter<string>('IBS_TAUX_PRODUCTION')!;
      const rateServices = state2026.getParameter<string>('IBS_TAUX_AUTRES')!;

      const ibsEval = IbsEngine.evaluate({
        fiscalYear: 2026,
        hasSeparateAccounting: true,
        defaultFallbackRate: rateServices,
        segments: [
          {
            segmentCode: 'SEG_PROD',
            label: 'Transformation Agroalimentaire (éligible 19% LF 2026)',
            taxRate: rateProduction,
            accountingResult: '10000000',
            revenue: '50000000',
          },
          {
            segmentCode: 'SEG_SERV',
            label: 'Services Logistiques',
            taxRate: rateServices,
            accountingResult: '5000000',
            revenue: '20000000',
          },
        ],
      });

      // Segment Prod : 10M * 19% = 1.9M DA
      // Segment Serv : 5M * 26% = 1.3M DA
      // Total = 3.2M DA
      expect(ibsEval.segmentDetails[0].ibsAmount).toBe('1900000.00');
      expect(ibsEval.segmentDetails[1].ibsAmount).toBe('1300000.00');
      expect(ibsEval.totalIbsDue).toBe('3200000.00');
    });
  });

  describe('Exercice 2027 (Projet PLF 2027)', () => {
    const state2027 = RegPackResolver.resolve(allOfficialPacks, {
      asOf: '2027-03-01',
      knownAt: '2026-11-18T00:00:00.000Z',
    });

    it('résout la prévision de facturation électronique obligatoire pour les PME au 01/01/2027', () => {
      const eInvoicing = state2027.getParameter<string>('FACTURATION_ELECTRONIQUE_OBLIGATOIRE_PME');
      expect(eInvoicing).toBe('true');
    });
  });

  describe('Pack Métier (Niveau 2) & Bornes de Tolérance', () => {
    it('définit les barèmes métiers avec des bornes [Min, Max] et valeurs par défaut', () => {
      const sudParam = DZ_BUSINESS_DEFAULTS_PACK.FLEET_TOWING_FORFAIT_SUD_DZD;
      const nordParam = DZ_BUSINESS_DEFAULTS_PACK.FLEET_TOWING_FORFAIT_NORD_DZD;
      const downtimeParam = DZ_BUSINESS_DEFAULTS_PACK.FLEET_DOWNTIME_DAILY_COST_DZD;

      expect(sudParam.defaultUniversalValue).toBe('75000');
      expect(sudParam.allowedRange.minAllowed).toBe('50000');
      expect(sudParam.allowedRange.maxAllowed).toBe('120000');

      expect(nordParam.defaultUniversalValue).toBe('35000');
      expect(downtimeParam.defaultUniversalValue).toBe('25000');
    });

    it('compile un dictionnaire immuable de paramètres en mémoire', () => {
      const state = RegPackResolver.resolve(allOfficialPacks, {
        asOf: '2026-06-01',
        knownAt: '2026-11-18T00:00:00.000Z',
      });

      const map = state.compileParameterMap();
      expect(map.size).toBeGreaterThan(20);
      expect(map.has('IFU_MINIMUM_GENERAL')).toBe(true);
      expect(map.has('CASH_PAYMENT_LIMIT_DZD')).toBe(true);
      expect(map.get('CASH_PAYMENT_LIMIT_DZD')?.value).toBe('1000000');
    });
  });
});

