import {
  calculateHydraulicWorkAndFraud,
  evaluateScrAdblueIntegrity,
  calculateKinematicMicroSlipTire,
  calculateBrakeEnergyPartitioning,
  analyzeCrankingImpedanceCompression,
} from '@docteurflotte/contracts';

describe('INNOVATIONS TECHNOLOGIQUES DE RUPTURE — MONOPOLE INDUSTRIEL (COÛT MATÉRIEL = 0 DA)', () => {
  // ==========================================================================
  // 1. HWFA : HYDRAULIC-WORK-FRAUD-AUDITOR (BTPH & CARRIÈRES)
  // ==========================================================================
  describe('Innovation 1 : HWFA — Audit Calorimétrique & Travail Hydraulique Réel (0 Capteur)', () => {
    it('doit valider une excavation rocheuse lourde (rendement calorifique élevé et couple fort)', () => {
      const res = calculateHydraulicWorkAndFraud({
        engineRpm: 1800,
        actualTorquePct: 82.0, // Forte charge
        fuelRateLh: 28.5,
        coolantTempC: 88.0,
        hydraulicTempC: 68.0,
        boostPressureKpa: 165.0,
        groundSpeedKmh: 0.0,
        durationSeconds: 3600, // 1 heure
        nominalMaxTorqueNm: 1650,
        nominalPowerKw: 230,
      });

      expect(res.workClassification).toBe('EXCAVATION_FORTE_CHARGE');
      expect(res.isFraudulentHoursBilled).toBe(false);
      expect(res.hydraulicPowerKw).toBeGreaterThan(120.0);
      expect(res.caloricEfficiencyEta).toBeGreaterThanOrEqual(0.22);
      expect(res.unjustifiedBilledCostDzd).toBe(0);
      expect(res.confidenceScore).toBeGreaterThanOrEqual(95);
    });

    it('doit intercepter la fraude des heures fantômes au ralenti forcé avec clim en cabine', () => {
      const res = calculateHydraulicWorkAndFraud({
        engineRpm: 1200, // Ralenti accéléré artificiel
        actualTorquePct: 18.0, // Faible couple (pompes à débit nul)
        fuelRateLh: 12.0,
        coolantTempC: 84.0,
        hydraulicTempC: 52.0,
        boostPressureKpa: 25.0,
        groundSpeedKmh: 0.0,
        durationSeconds: 7200, // 2 heures
        nominalMaxTorqueNm: 1650,
        nominalPowerKw: 230,
        hourlyRentalRateDzd: 6500,
      });

      expect(res.workClassification).toBe('RALENTI_FORCÉ_FRAUDE');
      expect(res.isFraudulentHoursBilled).toBe(true);
      expect(res.unjustifiedBilledCostDzd).toBeGreaterThan(13000); // 2h * 6500 + carburant
      expect(res.proof).toContain('Surfacturation arrêtée');
    });
  });

  // ==========================================================================
  // 2. SES-UEB : SCR-EMULATOR-SNIFFER & UREA-ENTHALPIC-BALANCE
  // ==========================================================================
  describe('Innovation 2 : SES-UEB — Détection Émulateur SCR & Dilution Urée (0 Capteur Chimique)', () => {
    it('doit confirmer le fonctionnement conforme du SCR lorsque l abaissement thermique correspond à l enthalpie', () => {
      const res = evaluateScrAdblueIntegrity({
        exhaustTempInC: 320.0,
        scrTempInC: 315.0,
        scrTempOutC: 313.9, // ~1.1°C d'abaissement réel (conforme à l'enthalpie ~1.08°C)
        defDosingRateGh: 550.0,
        defTankLevelPct: 75.0,
        defConcentrationPct: 32.5,
        fuelRateLh: 26.0,
        engineRpm: 1450,
        boostPressureKpa: 140.0,
        intakeTempC: 38.0,
        engineDisplacementLiters: 12.8,
        canFrameJitterVarianceMs2: 3.2,
      });

      expect(res.systemIntegrity).toBe('SCR_CONFORME');
      expect(res.fraudDetected).toBe(false);
      expect(res.riskDamageCostDzd).toBe(0);
    });

    it('doit démasquer un émulateur SCR pirate (injection déclarée mais abaissement thermique nul)', () => {
      const res = evaluateScrAdblueIntegrity({
        exhaustTempInC: 340.0,
        scrTempInC: 338.0,
        scrTempOutC: 337.9, // Delta T = 0.1°C (aucun liquide ne passe)
        defDosingRateGh: 620.0, // L'émulateur affirme injecter 620 g/h
        defTankLevelPct: 80.0,
        defConcentrationPct: 32.5,
        fuelRateLh: 28.0,
        engineRpm: 1500,
        boostPressureKpa: 155.0,
        intakeTempC: 35.0,
        engineDisplacementLiters: 12.8,
      });

      expect(res.systemIntegrity).toBe('EMULATEUR_SCR_PIRATE_ACTIF');
      expect(res.fraudDetected).toBe(true);
      expect(res.riskDamageCostDzd).toBe(1850000);
      expect(res.tamperingEvidence).toContain('Émulateur SCR détecté');
    });

    it('doit identifier l injection d eau pure au lieu d AdBlue (sur-abaissement thermique)', () => {
      const res = evaluateScrAdblueIntegrity({
        exhaustTempInC: 320.0,
        scrTempInC: 320.0,
        scrTempOutC: 305.0, // Chute thermique excessive de 15°C
        defDosingRateGh: 350.0,
        defTankLevelPct: 60.0,
        defConcentrationPct: 32.5,
        fuelRateLh: 20.0,
        engineRpm: 1350,
        boostPressureKpa: 110.0,
        intakeTempC: 30.0,
        engineDisplacementLiters: 12.8,
      });

      expect(res.systemIntegrity).toBe('UREE_ALTEREE_EAU_DETECTEE');
      expect(res.fraudDetected).toBe(true);
    });
  });

  // ==========================================================================
  // 3. KMSO : KINEMATIC-MICRO-SLIP & TIRE-DEFICIT-OBSERVER (0 CAPTEUR TPMS)
  // ==========================================================================
  describe('Innovation 3 : KMSO — Capteur Virtuel de Sous-Gonflage & Risque Éclatement (0 TPMS)', () => {
    it('doit valider une pression nominale lorsque les vitesses angulaires gauche/droite sont identiques', () => {
      const res = calculateKinematicMicroSlipTire({
        wheelSpeedLeftKmh: 80.0,
        wheelSpeedRightKmh: 80.05,
        gnssDopplerSpeedKmh: 80.0,
        yawRateDegS: 0.02,
        lateralAccelMs2: 0.01,
        engineTorquePct: 20.0,
      });

      expect(res.tireIntegrityStatus).toBe('PRESSION_OPTIMALE');
      expect(res.burstRiskAlert).toBe(false);
      expect(res.estimatedPressureDeficitBar).toBeLessThan(0.3);
    });

    it('doit alerter sur un danger d éclatement imminent si la sur-vitesse cinématique dépasse 1.25%', () => {
      const res = calculateKinematicMicroSlipTire({
        wheelSpeedLeftKmh: 81.3, // Pneu affaissé tournant plus vite
        wheelSpeedRightKmh: 80.0,
        gnssDopplerSpeedKmh: 80.0,
        yawRateDegS: 0.05, // Ligne droite
        lateralAccelMs2: 0.03,
        engineTorquePct: 15.0,
      });

      expect(res.tireIntegrityStatus).toBe('DANGER_ECLATEMENT_IMMINENT');
      expect(res.burstRiskAlert).toBe(true);
      expect(res.estimatedPressureDeficitBar).toBeGreaterThanOrEqual(1.8);
      expect(res.excessFuelLossPer1000KmDzd).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 4. BEP-VCO : BRAKE-ENERGY-PARTITIONING & RETARDER CO-OPTIMIZER
  // ==========================================================================
  describe('Innovation 4 : BEP-VCO — Bilan Calorifique Descente & Co-Optimisation Ralentisseur', () => {
    it('doit attribuer une conduite exemplaire si le ralentisseur absorbe > 90% de l énergie', () => {
      const res = calculateBrakeEnergyPartitioning({
        vehicleTotalMassKg: 40000, // 40 tonnes
        vehicleSpeedKmh: 60.0,
        roadGradePercent: -5.5, // Descente de col 5.5%
        retarderTorquePct: 95.0, // Ralentisseur pleinement actif
        retarderMaxTorqueNm: 3200,
        brakePedalPositionPct: 0.0, // Pied levé de la pédale
        durationSeconds: 45,
      });

      expect(res.drivingSafetyStatus).toBe('CONDUITE_EXEMPLAIRE_DISQUES_FROIDS');
      expect(res.fadeRiskAlert).toBe(false);
      expect(res.retarderUsageRatio).toBeGreaterThanOrEqual(0.88);
      expect(res.estimatedDiscTempC).toBeLessThan(200);
    });

    it('doit détecter la surchauffe critique (fade) si le chauffeur descend au frein à friction', () => {
      const res = calculateBrakeEnergyPartitioning({
        vehicleTotalMassKg: 44000, // 44 tonnes (surcharge)
        vehicleSpeedKmh: 65.0,
        roadGradePercent: -7.0, // Forte pente
        retarderTorquePct: 10.0, // Ralentisseur négligé
        retarderMaxTorqueNm: 3200,
        brakePedalPositionPct: 70.0, // Pied sur le frein en continu
        durationSeconds: 60,
      });

      expect(res.drivingSafetyStatus).toBe('SURCHAUFFE_DANGER_FADE');
      expect(res.fadeRiskAlert).toBe(true);
      expect(res.frictionBrakesPowerKw).toBeGreaterThan(100.0);
      expect(res.estimatedDiscTempC).toBeGreaterThanOrEqual(380);
      expect(res.estimatedFinancialLossPerDescentDzd).toBeGreaterThan(100000);
    });
  });

  // ==========================================================================
  // 5. CSIS : CRANKING-SUB-CYCLE-IMPEDANCE-SPECTROMETRY (ADC 24V À 250 Hz)
  // ==========================================================================
  describe('Innovation 5 : CSIS — Oscilloscope Virtuel de Compression Cylindres par ADC 24V', () => {
    it('doit valider un moteur neuf aux compressions parfaitement équilibrées', () => {
      // 10 échantillons de repos à 24.5V, puis 6 creux de tension symétriques à ~18.8V
      const samples: number[] = [24.5, 24.5, 24.4, 24.5, 24.5];
      for (let c = 0; c < 6; c++) {
        for (let s = 0; s < 15; s++) {
          const dip = 18.8 + Math.sin((s / 15) * Math.PI) * -0.3;
          samples.push(dip);
        }
      }

      const res = analyzeCrankingImpedanceCompression({
        engineDisplacementLiters: 12.8,
        cylinderCount: 6,
        batteryVoltageSamples250Hz: samples,
        coolantTempC: 22.0,
        crankingRpm: 155,
      });

      expect(res.engineCompressionHealth).toBe('EQUILIBRAGE_PARFAIT_NEUF');
      expect(res.needsImmediateWorkshop).toBe(false);
      expect(res.minCompressionRatioPct).toBeGreaterThanOrEqual(95);
    });

    it('doit localiser un cylindre avec fuite de compression critique (creux anormalement faible)', () => {
      // 5 échantillons à 24.5V, puis 5 cylindres à 18.5V, et le cylindre #4 ne descend qu'à 22.2V (manque d'effort)
      const samples: number[] = [24.5, 24.5, 24.4, 24.5, 24.5];
      for (let c = 0; c < 6; c++) {
        const targetVoltage = c === 3 ? 22.2 : 18.5; // Cylindre 4 a une fuite
        for (let s = 0; s < 15; s++) {
          samples.push(targetVoltage);
        }
      }

      const res = analyzeCrankingImpedanceCompression({
        engineDisplacementLiters: 12.8,
        cylinderCount: 6,
        batteryVoltageSamples250Hz: samples,
        coolantTempC: 20.0,
        crankingRpm: 160,
      });

      expect(res.weakestCylinderIndex).toBe(4);
      expect(res.engineCompressionHealth).toBe('FUITE_CRITIQUE_SOUPAPE_SEGMENT');
      expect(res.needsImmediateWorkshop).toBe(true);
      expect(res.estimatedAvoidedEngineCostDzd).toBeGreaterThanOrEqual(2000000);
      expect(res.proof).toContain('Cylindre le plus faible: #4');
    });
  });
});
