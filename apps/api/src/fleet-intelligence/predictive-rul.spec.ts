import {
  PredictiveRulEngine,
  PredictiveRulEngineParams,
} from '@docteurflotte/contracts';

describe('PredictiveRulEngine (Formules Déterministes & Maintenance 4.0)', () => {
  it('devrait calculer le RUL avec pénalité conditions sévères et ralenti', () => {
    const params: PredictiveRulEngineParams = {
      vehicleId: 'veh-renault-k-01',
      subsystem: 'ENGINE',
      intervalOemKm: 30000,
      intervalOemHours: 600,
      intervalOemDays: 180,
      deltaOdometerKm: 15000,
      deltaEngineHours: 320,
      deltaDays: 80,
      idleHoursSinceLastService: 45, // 45h * 33 = 1485 km équivalents
      severeDutyFactor: 0.75, // Réduit l'intervalle à 22 500 km et 450h
      avgDailyKm: 200,
      avgDailyEngineHours: 8,
      readings: [],
      activeDtcs: [],
    };

    const result = PredictiveRulEngine.calculateRul(params);

    expect(result.effectiveIntervalKm).toBe(22500);
    expect(result.effectiveIntervalHours).toBe(450);
    expect(result.equivalentKm).toBe(15000 + 45 * 33); // 16485 km
    expect(result.telemetryAccelerationFactor).toBe(1.0);
    expect(result.wearPercent).toBeGreaterThan(60);
    expect(result.rulRemainingKm).toBeGreaterThan(0);
    expect(result.rulRemainingHours).toBeGreaterThan(0);
    expect(result.failureProbability30d).toBeGreaterThan(0);
    expect(result.mathematicalProof.steps.length).toBe(5);
  });

  it('devrait accélérer l’usure sous alertes télématiques CAN (SPN 110 et SPN 1087) et déclencher un OT', () => {
    const params: PredictiveRulEngineParams = {
      vehicleId: 'veh-scania-r-02',
      subsystem: 'BRAKES_APS',
      intervalOemKm: 60000,
      intervalOemHours: 1200,
      intervalOemDays: 365,
      deltaOdometerKm: 52000,
      deltaEngineHours: 1050,
      deltaDays: 320,
      idleHoursSinceLastService: 20,
      severeDutyFactor: 0.85,
      avgDailyKm: 250,
      avgDailyEngineHours: 9,
      readings: [
        { spn: 1087, value: 7.2 }, // Dérive APS Scania (< 7.8 bar) -> +0.25
        { spn: 110, value: 106.0 }, // Surchauffe LDR -> +0.18
      ],
      activeDtcs: [
        { codeString: 'SPN-1087-FMI-1', severityLevel: 'CRITICAL_IMMOBILIZATION', rulPenaltyFactor: 0.25 },
      ],
    };

    const result = PredictiveRulEngine.calculateRul(params);

    // gamma_CAN = 1.0 + 0.25 + 0.18 + 0.25 = 1.68
    expect(result.telemetryAccelerationFactor).toBeCloseTo(1.68, 2);
    expect(result.wearPercent).toBeGreaterThanOrEqual(95);
    expect(result.apsFailureRiskScore).toBeGreaterThan(0.5);
    expect(result.failureProbability30d).toBeGreaterThan(0.70);
    expect(result.autoWorkOrderTriggered).toBe(true);
    expect(result.workOrderRecommendation).toBeDefined();
    expect(result.workOrderRecommendation?.priority).toBe('URGENT_CRITICAL');
  });

  it('devrait calculer la probabilité de panne via Weibull et borner le RUL', () => {
    const params: PredictiveRulEngineParams = {
      vehicleId: 'veh-cat-320',
      subsystem: 'HYDRAULICS',
      intervalOemKm: 0,
      intervalOemHours: 500,
      intervalOemDays: 120,
      deltaOdometerKm: 0,
      deltaEngineHours: 490,
      deltaDays: 115,
      idleHoursSinceLastService: 10,
      severeDutyFactor: 0.65, // BTP Sévère
      avgDailyKm: 0,
      avgDailyEngineHours: 7,
      weibullBeta: 2.5,
    };

    const result = PredictiveRulEngine.calculateRul(params);

    // Dépassement d'intervalle effectif (500 * 0.65 = 325h < 490h)
    expect(result.wearPercent).toBe(100);
    expect(result.rulRemainingHours).toBe(0);
    expect(result.rulRemainingDays).toBe(0);
    expect(result.healthStatus).toBe('CRITICAL_OVERDUE');
    expect(result.autoWorkOrderTriggered).toBe(true);
  });
});
