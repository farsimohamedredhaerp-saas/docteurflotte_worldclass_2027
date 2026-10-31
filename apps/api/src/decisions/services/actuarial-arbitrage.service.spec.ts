import { Test, TestingModule } from '@nestjs/testing';
import { ActuarialArbitrageService, ActuarialArbitrageRequest } from './actuarial-arbitrage.service';
import { DatabaseService } from '../../database/database.service';

describe('ActuarialArbitrageService (Pilier 6 — Arbitrage Financier Actuariel en DZD)', () => {
  let service: ActuarialArbitrageService;
  let mockDbService: Partial<DatabaseService>;

  beforeEach(async () => {
    mockDbService = {
      getPool: jest.fn(),
      withTenantContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActuarialArbitrageService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<ActuarialArbitrageService>(ActuarialArbitrageService);
  });

  it('devrait calculer un arbitrage CRITIQUE pour des freins en fin de vie avec véhicule de substitution', async () => {
    const request: ActuarialArbitrageRequest = {
      tenantId: 'tenant-dz-logistics',
      vehiclePlate: '01894-112-16',
      subsystem: 'FREINAGE',
      operationalDaysInService: 230,
      currentWearMetric: 3.2, // 3.2 mm restants (critique ENACTA à 3.0 mm)
      isSaharaClimaticStress: true,
      costPreventivePartsDzd: 44000,
      costPreventiveLaborDzd: 8000,
      costFailurePartsDzd: 180000, // Disques voilés + étriers calcinés
      costFailureLaborDzd: 25000,
      costTowingDzd: 35000, // Dépannage plateau RN1 Djelfa
      dailyContractPenaltyDzd: 50000,
      estimatedImmobilizationDaysOnFailure: 4,
      wilayaCode: 16, // Alger
    };

    const res = await service.computeArbitrage(request);

    // 1. Vérification Weibull & Physique
    expect(res.weibullParameters.shapeBeta).toBe(2.8);
    expect(res.weibullParameters.saharaStressMultiplier).toBe(1.45);
    expect(res.weibullParameters.cumulativeFailureProbability).toBeGreaterThan(0.6);

    // 2. Vérification Financière en DZD
    expect(res.financialArbitrageDzd.preventiveActionCost).toBe(52000); // 44k + 8k
    expect(res.financialArbitrageDzd.nominalFailureCost).toBe(440000); // 180k + 25k + 35k + (4*50k)
    expect(res.financialArbitrageDzd.weightedInactionRiskCost).toBeGreaterThan(250000);
    expect(res.financialArbitrageDzd.netExpectedBenefit).toBeGreaterThan(150000);
    expect(res.financialArbitrageDzd.costBenefitRatio).toBeGreaterThan(4.0);

    // 3. Statut & Substitution
    expect(res.recommendation.urgencyLevel).toBe('CRITIQUE_IMMEDIAT');
    expect(res.recommendation.summaryFr).toContain('Intervention d\'urgence requise');
    expect(res.recommendation.summaryDarja).toContain('Lazem dkhoul l\'atelier');
    expect(res.substitutionAsset).toBeDefined();
    expect(res.substitutionAsset?.wilayaCode).toBe(16);
    expect(res.substitutionAsset?.healthScoreVhi).toBeGreaterThan(90);

    // 4. Audit & Souveraineté
    expect(res.auditProof.currency).toBe('DZD');
  });

  it('devrait préconiser le MAINTIEN_SOUS_SURVEILLANCE pour un moteur neuf', async () => {
    const request: ActuarialArbitrageRequest = {
      tenantId: 'tenant-dz-logistics',
      vehiclePlate: '00412-116-17',
      subsystem: 'MOTEUR',
      operationalDaysInService: 20, // 20 jours seulement
      currentWearMetric: 0.1,
      isSaharaClimaticStress: false,
      costPreventivePartsDzd: 25000,
      costPreventiveLaborDzd: 5000,
      costFailurePartsDzd: 650000,
      costFailureLaborDzd: 80000,
      costTowingDzd: 40000,
      dailyContractPenaltyDzd: 60000,
      estimatedImmobilizationDaysOnFailure: 5,
      wilayaCode: 17, // Djelfa
    };

    const res = await service.computeArbitrage(request);

    expect(res.weibullParameters.cumulativeFailureProbability).toBeLessThan(0.05);
    expect(res.recommendation.urgencyLevel).toBe('MAINTIEN_SOUS_SURVEILLANCE');
    expect(res.recommendation.summaryFr).toContain('Organe dans sa fenêtre nominale');
    expect(res.substitutionAsset).toBeUndefined(); // Aucun véhicule nécessaire
  });
});
