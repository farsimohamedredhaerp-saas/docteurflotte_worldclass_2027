import { describe, it, expect } from 'vitest';
import { CalculationProofBuilder } from '../lib/calculation-proofs';
import { ADS_SIMULATION_SCENARIOS, URGENCY_OPTIONS } from '../app/decisions/constants';
import type { DecisionItem } from '../app/decisions/types';
import type { DispatchDecisionResult } from '../lib/api-fleet-intelligence';

describe('Decisions Cockpit & Arbitrage SAD -> ADS (Lot 4 Target 3)', () => {
  const mockDecisions: DecisionItem[] = [
    {
      id: 'dec-1',
      assetId: 'ast-1',
      assetName: 'Renault Kerax 440',
      assetCode: 'TRK-001',
      assetCategory: 'HEAVY_TRUCK',
      ruleId: 'RULE-OIL-ARRHENIUS-01',
      urgency: 'danger',
      title: 'Vidange huile moteur critique',
      description: 'Oxydation sévère Arrhenius constatée en zone Tell/Sahara.',
      estimatedActionCost: 45000,
      costInactionRisk: 380000,
      netExpectedSavings: 335000,
      confidenceScore: 98,
      status: 'PENDING',
      dataOrigin: 'DEMO',
      explanationDossier: {
        potentialFailureModes: ['Casse bielle', 'Serrage moteur'],
        mitigationAction: 'Vidange immédiate et remplacement filtre 15W40',
      },
    },
    {
      id: 'dec-2',
      assetId: 'ast-2',
      assetName: 'Toyota Hilux 4x4',
      assetCode: 'HLX-002',
      assetCategory: 'LIGHT_VEHICLE',
      ruleId: 'RULE-BRAKE-ARCHARD-02',
      urgency: 'warning',
      title: 'Plaquettes de frein avant usées',
      description: 'Loi tribologique d Archard : énergie dissipée critique.',
      estimatedActionCost: 18000,
      costInactionRisk: 95000,
      netExpectedSavings: 77000,
      confidenceScore: 89,
      status: 'PENDING',
      dataOrigin: 'DEMO',
    },
  ];

  it('calcule correctement les métriques financières actuarielles globales (DZD)', () => {
    const totalActionCost = mockDecisions.reduce((acc, d) => acc + d.estimatedActionCost, 0);
    const totalInactionRisk = mockDecisions.reduce((acc, d) => acc + d.costInactionRisk, 0);
    const totalExpectedSavings = totalInactionRisk - totalActionCost;

    expect(totalActionCost).toBe(63000);
    expect(totalInactionRisk).toBe(475000);
    expect(totalExpectedSavings).toBe(412000);
    expect(totalExpectedSavings).toBeGreaterThan(0);
  });

  it('filtre fidèlement les arbitrages selon le niveau d urgence', () => {
    const all = mockDecisions.filter((d) => true);
    const dangerOnly = mockDecisions.filter((d) => d.urgency === 'danger');
    const warningOnly = mockDecisions.filter((d) => d.urgency === 'warning');

    expect(all).toHaveLength(2);
    expect(dangerOnly).toHaveLength(1);
    expect(dangerOnly[0].id).toBe('dec-1');
    expect(warningOnly).toHaveLength(1);
    expect(warningOnly[0].id).toBe('dec-2');
  });

  it('définit les scénarios réglementaires algériens officiels pour le banc ADS', () => {
    expect(ADS_SIMULATION_SCENARIOS).toHaveLength(4);
    const scenarioIds = ADS_SIMULATION_SCENARIOS.map((s) => s.id);
    expect(scenarioIds).toContain('ALGER_RESTRICTION');
    expect(scenarioIds).toContain('ENACTA_EXPIRED');
    expect(scenarioIds).toContain('VHI_CRITICAL');
    expect(scenarioIds).toContain('COMPLIANT_MISSION');

    expect(URGENCY_OPTIONS).toHaveLength(3);
  });

  it('génère un dossier de preuve déterministe valide pour un arbitrage de maintenance', () => {
    const proof = CalculationProofBuilder.buildMaintenanceDecisionProof(mockDecisions[0]);
    expect(proof).toBeDefined();
    expect(proof.title).toContain("Preuve de l'Arbitrage Économique");
    expect(proof.ruleId).toBe('RULE-OIL-ARRHENIUS-01');
    expect(proof.deterministicFormula).toContain("Économie Nette");
    expect(proof.variables.length).toBeGreaterThan(0);
    expect(proof.steps.length).toBeGreaterThan(0);
  });

  it('génère un dossier de preuve d affectation ADS conforme aux 4 portes', () => {
    const mockDispatchResult: DispatchDecisionResult = {
      missionId: 'msn-001',
      decisionOutcome: 'APPROVED_AS_REQUESTED',
      decisionTimestampUtc: new Date().toISOString(),
      originalEtdUtc: new Date().toISOString(),
      recommendedEtdUtc: new Date().toISOString(),
      valhallaAvoidPolygons: [],
      assignedVehicleId: 'veh-101',
      assignedRegistrationPlate: '00123-116-16',
      assignedDriverId: 'drv-202',
      assignedDriverName: 'Amine B.',
      violationsDetected: [],
      generatedWorkOrders: [],
      routeAdvisoryNotes: ['Route conforme via A1 Est-Ouest'],
      rankedSubstitutions: [
        {
          vehicleId: 'veh-101',
          registrationPlate: '00123-116-16',
          makeModel: 'Shacman X3000',
          totalScore100: 94.5,
          vhiScoreComponent: 95,
          fuelCostComponent: 92,
          approachDistanceComponent: 96,
          fleetBalancingComponent: 95,
          approachDistanceKm: 12,
          estimatedFuelCostDzd: 1850,
          driverId: 'drv-202',
          driverName: 'Amine B.',
          auditJustification: 'Véhicule optimal selon arbitrage multi-critères TOPSIS',
        },
      ],
    };

    const proof = CalculationProofBuilder.buildDispatchProof(mockDispatchResult);
    expect(proof).toBeDefined();
    expect(proof.decisionOrMetricName).toContain('Affectation Mission');
    expect(proof.deterministicFormula).toContain('Porte_4(TOPSIS)');
    expect(proof.finalResult.value).toBe('APPROVED_AS_REQUESTED');
  });
});
