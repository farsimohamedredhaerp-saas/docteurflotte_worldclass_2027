import { PhysicalPredictiveModelsService } from './physical-predictive-models.service';
import { TelemetryTier, NAFTAL_FUEL_PRICES_DZD } from '@docteurflotte/contracts';

describe('CorridorArrhenius & TopographicCusum Deterministic Engines', () => {
  let service: PhysicalPredictiveModelsService;

  beforeEach(() => {
    service = new PhysicalPredictiveModelsService();
  });

  describe('computeCorridorArrheniusRul', () => {
    it('doit accélérer l usure de l huile et réduire le RUL dans le Grand Sud (Wilaya 1 - Adrar) par rapport au littoral', () => {
      // 1. Camion standard à Alger (Wilaya 16)
      const algerResult = service.computeCorridorArrheniusRul({
        telemetryTier: TelemetryTier.MODE_1_GNSS,
        assetCode: 'CAM-ALGER-01',
        currentKm: 15000,
        baselineIntervalKm: 30000,
        wilayaCode: 16,
        ambientTempC: 26,
        corridorSilicaFactor: 1.05,
        engineProfile: 'STANDARD',
      });

      // 2. Camion Shacman Weichai sur piste à Adrar (Wilaya 1) sous canicule et silice
      const adrarResult = service.computeCorridorArrheniusRul({
        telemetryTier: TelemetryTier.MODE_2_CAN_J1939,
        assetCode: 'SHACMAN-ADRAR-02',
        currentKm: 15000,
        baselineIntervalKm: 30000,
        wilayaCode: 1,
        ambientTempC: 48,
        corridorSilicaFactor: 1.45,
        engineProfile: 'SHACMAN_WEICHAI',
        canMeasuredOilTempC: 104, // Température d huile élevée mesurée par CAN SPN 175
      });

      expect(adrarResult.isSaharaSevereCondition).toBe(true);
      expect(adrarResult.effectiveWearMultiplier).toBeGreaterThan(algerResult.effectiveWearMultiplier);
      expect(adrarResult.rulRemainingKm).toBeLessThan(algerResult.rulRemainingKm);
      expect(adrarResult.calculationProof).toContain('Arrhenius XAI');
    });
  });

  describe('computeTopographicCompensatedCusum', () => {
    it('doit refuser la détection fine de siphonnage en Mode 0 pour respecter l honnêteté de palier', () => {
      const result = service.computeTopographicCompensatedCusum({
        telemetryTier: TelemetryTier.MODE_0_DECLARATIVE,
        assetCode: 'VEH-MODE-0',
        fuelTankCapacityLiters: 400,
        rawLevelsLiters: [300, 250],
        roadGradePercent: 0,
      });

      expect(result.isTheftConfirmed).toBe(false);
      expect(result.explanation).toContain('Indisponible en Mode 0');
    });

    it('doit éliminer le faux positif de ballottement dans les cols montagneux (dévers de 11.5% dans la Chiffa)', () => {
      // Baisse apparente de 25L causée par l inclinaison du réservoir en montée
      const result = service.computeTopographicCompensatedCusum({
        telemetryTier: TelemetryTier.MODE_2_CAN_J1939,
        assetCode: 'KERAX-CHIFFA',
        fuelTankCapacityLiters: 400,
        rawLevelsLiters: [280, 275, 270, 260, 255], // Baisse apparente de 25 L
        roadGradePercent: 11.5, // Forte montée 11.5%
        tankLengthMeters: 1.8,
        sensorOffsetRatio: 0.25,
      });

      expect(result.isFalsePositiveSlope).toBe(true);
      expect(result.isTheftConfirmed).toBe(false);
      expect(result.apparentDropDueToSlopeLiters).toBeGreaterThan(15);
      expect(result.netLossCompensatedLiters).toBe(0);
      expect(result.financialPrejudiceDzd).toBe(0);
    });

    it('doit confirmer le vol réel sur terrain plat et chiffrer le préjudice exact en Dinars Algériens (DZD)', () => {
      // Perte réelle de 60L à l arrêt sur terrain plat (pente 0.2%)
      const result = service.computeTopographicCompensatedCusum({
        telemetryTier: TelemetryTier.MODE_2_CAN_J1939,
        assetCode: 'ACTROS-DEPOT',
        fuelTankCapacityLiters: 500,
        rawLevelsLiters: [380, 370, 350, 330, 320], // Baisse de 60 L
        roadGradePercent: 0.2,
      });

      expect(result.isFalsePositiveSlope).toBe(false);
      expect(result.isTheftConfirmed).toBe(true);
      expect(result.netLossCompensatedLiters).toBeGreaterThanOrEqual(58);
      expect(result.financialPrejudiceDzd).toBe(Math.round(result.netLossCompensatedLiters * NAFTAL_FUEL_PRICES_DZD.GASOIL * 100) / 100);
      expect(result.cusumScore).toBeGreaterThan(50);
    });
  });
});

