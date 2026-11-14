import { describe, it, expect } from 'vitest';
import { CalculationProofBuilder } from '../lib/calculation-proofs';
import {
  DigitalTwinAsset,
  ModelParameters,
  DEFAULT_DIGITAL_TWIN_CONFIG,
} from '@docteurflotte/contracts';

const mockTwin: DigitalTwinAsset = {
  assetId: 'ast-test-01',
  assetName: 'Renault Kangoo 1.5 dCi',
  assetCode: 'VEH-016-ALG',
  category: 'LIGHT_COMMERCIAL',
  brand: 'Renault',
  model: 'Kangoo',
  year: 2022,
  currentOdometerKm: 120000,
  currentVhi: 78,
  wilayaLocation: '16 - Alger',
  wilayaCode: 16,
  driverAggressivenessScore: 1.1,
  climateSeverityFactor: 1.15,
  organs: [
    {
      organ: 'ENGINE_OIL',
      name: 'Huile Moteur',
      icon: 'OIL',
      healthPercent: 72,
      remainingUsefulLifeValue: 3450,
      remainingUsefulLifeUnit: 'KM',
      status: 'HEALTHY',
      physicsAlgorithm: 'Arrhenius Cinétique (Ea/R = 6500 K)',
      observedMetrics: [
        { label: 'Facteur Arrhenius', value: 'x1.26', threshold: '< 1.50' },
      ],
      explanation: 'Usure normale sous contraintes thermiques.',
    },
    {
      organ: 'BRAKE_PADS',
      name: 'Plaquettes de Frein',
      icon: 'BRK',
      healthPercent: 54,
      remainingUsefulLifeValue: 4800,
      remainingUsefulLifeUnit: 'KM',
      status: 'PRE_CRITICAL',
      physicsAlgorithm: 'Loi Tribologique d’Archard',
      observedMetrics: [
        { label: 'Épaisseur', value: 4.2, threshold: 3.0 },
      ],
      explanation: 'Épaisseur proche du seuil critique constructeur.',
    },
  ],
  financialArbitrage: {
    preventiveInterventionCostDzd: 18500,
    unplannedBreakdownRiskDzd: 42500,
    desertTowingCostDzd: 35000,
    dailyImmobilizationLossDzd: 25000,
    netBenefitDzd: 24000,
    roiRatio: 2.3,
    recommendedAction: 'SURVEILLANCE_APPROFONDIE',
    actionDeadlineDays: 21,
  },
  projectionTrajectory: {
    day0Vhi: 78,
    day30VhiWithoutAction: 63,
    day60VhiWithoutAction: 48,
    day90VhiWithoutAction: 32,
    day30VhiWithAction: 94,
  },
  modelParameters: {
    degradationRate30d: 12,
    degradationRate90d: 42,
    sadRecoveryPoints: 18,
    vhiCap: 96,
    immobilizationDays: 2,
    desertTowingCostDzd: 35000,
    substitutionVhiThreshold: 65,
    dailyImmobilizationLossDzd: 25000,
    specVersion: 'MASTER_SPEC v2.0 §4.6 (Projection Temporelle & SAD)',
    ruleId: 'ALGO-TRAJECTORY-90D',
  },
  specVersion: 'MASTER_SPEC v2.0 (OEM-First)',
};

describe('CalculationProofBuilder', () => {
  describe('buildTrajectoryProof', () => {
    it('génère une preuve déterministe avec les coefficients du modèle configuré', () => {
      const proof = CalculationProofBuilder.buildTrajectoryProof(mockTwin, DEFAULT_DIGITAL_TWIN_CONFIG);
      expect(proof).not.toBeNull();

      expect(proof!.title).toContain('Trajectoire Prédictive Déterministe');
      expect(proof!.ruleId).toBe('ALGO-TRAJECTORY-90D');
      expect(proof!.category).toBe('PHYSICS_RUL');

      // Vérifie les étapes de calcul sans valeur codée en dur dans la méthode
      expect(proof!.steps.length).toBe(3);
      expect(proof!.steps[0].formula).toContain('12');
      expect(proof!.steps[1].formula).toContain('96');
      expect(proof!.steps[1].formula).toContain('18');
      expect(proof!.steps[2].formula).toContain('42');

      // Vérifie les variables
      const vhi0Var = proof!.variables.find((v) => v.symbol === 'VHI_0');
      expect(vhi0Var?.value).toBe(78);

      const stressVar = proof!.variables.find((v) => v.symbol === 'K_stress');
      expect(stressVar?.value).toBe(`x${(1.15 * 1.1).toFixed(2)}`);
    });

    it('affiche "Donnée indisponible" si les paramètres du modèle sont absents au lieu d\'inventer des valeurs', () => {
      const twinWithoutParams: DigitalTwinAsset = {
        ...mockTwin,
        modelParameters: undefined,
      };

      const proof = CalculationProofBuilder.buildTrajectoryProof(twinWithoutParams, {
        ...DEFAULT_DIGITAL_TWIN_CONFIG,
        modelParameters: {} as unknown as ModelParameters,
      });
      expect(proof).not.toBeNull();

      expect(proof!.steps[0].formula).toContain('Taux_30');
      expect(proof!.steps[0].calculation).toBe('Donnée indisponible');
      expect(proof!.steps[1].formula).toContain('min(Cap, VHI_0 + Gain)');
    });
  });

  describe('buildFinancialProof', () => {
    it('génère une preuve financière d\'arbitrage SAD avec devise et locale configurées', () => {
      const proof = CalculationProofBuilder.buildFinancialProof(mockTwin, DEFAULT_DIGITAL_TWIN_CONFIG);
      expect(proof).not.toBeNull();

      expect(proof!.category).toBe('FINANCIAL');
      expect(proof!.ruleId).toBe('ALGO-TRAJECTORY-90D');
      expect(proof!.variables.length).toBeGreaterThanOrEqual(6);

      const cPrevVar = proof!.variables.find((v) => v.symbol === 'C_prev');
      expect(cPrevVar?.value).toContain('18');

      const roiVar = proof!.variables.find((v) => v.symbol === 'ROI');
      expect(roiVar?.value).toBe('2.3x');

      expect(proof!.finalResult.value).toContain('24');
    });

    it('gère l\'absence d\'arbitrage financier sans crash et avec mention "Donnée indisponible"', () => {
      const twinWithoutArb: DigitalTwinAsset = {
        ...mockTwin,
        financialArbitrage: undefined as unknown as DigitalTwinAsset['financialArbitrage'],
      };

      const proof = CalculationProofBuilder.buildFinancialProof(twinWithoutArb, DEFAULT_DIGITAL_TWIN_CONFIG);
      expect(proof).not.toBeNull();

      expect(proof!.finalResult.value).toBe('Donnée indisponible');
      expect(proof!.steps).toEqual([]);
    });
  });

  describe('buildOrganProof', () => {
    it('construit la preuve pour l\'usure des plaquettes de frein sans seuil magique', () => {
      const brakeOrgan = mockTwin.organs.find((o) => o.organ === 'BRAKE_PADS')!;
      const proof = CalculationProofBuilder.buildOrganProof(brakeOrgan, mockTwin, DEFAULT_DIGITAL_TWIN_CONFIG);
      expect(proof).not.toBeNull();

      expect(proof!.category).toBe('PHYSICS_RUL');
      expect(proof!.steps.length).toBe(2);
      expect(proof!.variables.find((v) => v.symbol === 'E_min')?.value).toBe('3');
    });
  });
});
