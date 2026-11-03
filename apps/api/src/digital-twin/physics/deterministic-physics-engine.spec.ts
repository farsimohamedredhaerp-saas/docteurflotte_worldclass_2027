/**
 * deterministic-physics-engine.spec.ts — Suite de Tests Complète du Moteur Physique Déterministe & VHI
 * Vérifie les 12 modules, l'algorithme Rainflow 4-points, l'anti-siphonage CUSUM, le Hot Shutdown et le Hard Veto.
 */

import {
  TelemetryFrame,
  HEAVY_TRUCK_PRESET,
  LIGHT_COMMERCIAL_PRESET,
  VehiclePhysicsConfig,
} from '@docteurflotte/contracts';
import { OnlineRainflowCounter } from './online-rainflow';
import { DeterministicPhysicsEngine } from './deterministic-physics-engine';
import { VHICalculator } from './vhi-calculator';

describe('DeterministicPhysicsEngine & VHICalculator (12 Modules & Hard Veto)', () => {
  let engine: DeterministicPhysicsEngine;
  let truckConfig: VehiclePhysicsConfig;

  beforeEach(() => {
    engine = new DeterministicPhysicsEngine();
    truckConfig = { ...HEAVY_TRUCK_PRESET };
  });

  // ==========================================================================
  // 1. TESTS ONLINE RAINFLOW COUNTER (ASTM E1049-85 & BASQUIN)
  // ==========================================================================
  describe('OnlineRainflowCounter (4-Points Incremental)', () => {
    it('devrait extraire des cycles fermés et accumuler le dommage de fatigue Palmgren-Miner', () => {
      const rainflow = new OnlineRainflowCounter({
        suspensionStiffnessCoeff: truckConfig.suspensionStiffnessCoeff,
        fatigueEnduranceLimitPa: truckConfig.fatigueEnduranceLimitPa,
        wohlerExponentB: truckConfig.wohlerExponentB,
        n0EnduranceCycles: truckConfig.n0EnduranceCycles,
        minRangeThresholdMs2: 0.2,
      });

      // Profil oscillant représentatif d'une piste saharienne dégradée avec boucles d'hystérésis fermées
      const signal = [0, 5.0, 2.0, 4.0, 1.0, 6.0, -3.0, 0];
      const massKg = 24000;
      let totalCycles = 0;
      let accumulatedDamage = 0;

      for (const val of signal) {
        const cycles = rainflow.processPoint(val, massKg);
        for (const c of cycles) {
          totalCycles++;
          accumulatedDamage += c.damage;
          expect(c.range).toBeGreaterThanOrEqual(0.2);
          expect(c.stressPa).toBeGreaterThan(0);
        }
      }

      // En fin d'épisode, flush des demi-cycles résiduels (ASTM E1049-85 Section 5.4.4)
      const flushed = rainflow.flush(massKg);
      for (const c of flushed) {
        totalCycles++;
        accumulatedDamage += c.damage;
      }

      expect(totalCycles).toBeGreaterThan(0);
      expect(accumulatedDamage).toBeGreaterThan(0);
      expect(accumulatedDamage).toBeLessThan(0.05); // Dommage raisonnable pour quelques cycles
      expect(rainflow.getStack().length).toBe(0);
    });

    it('devrait maintenir une pile bornée même sous une longue série de micro-vibrations', () => {
      const rainflow = new OnlineRainflowCounter({
        suspensionStiffnessCoeff: 1.5,
        fatigueEnduranceLimitPa: 150e6,
        wohlerExponentB: 3.8,
        n0EnduranceCycles: 2e6,
      });

      // Injection de 200 oscillations
      for (let i = 0; i < 200; i++) {
        const az = Math.sin(i * 0.4) * 2.5;
        rainflow.processPoint(az, 18000);
      }

      expect(rainflow.getStack().length).toBeLessThanOrEqual(20);
    });
  });

  // ==========================================================================
  // 2. SCÉNARIO 1 : CONDUITE AUTOROUTIÈRE NOMINALE (A1 ALGER - SÉTIF)
  // ==========================================================================
  describe('Scénario 1 : Roulage Nominal Stabilisé', () => {
    it('devrait maintenir un état sain et des scores de santé optimaux sur 100 trames stables', () => {
      let state = DeterministicPhysicsEngine.createInitialState(truckConfig);

      // Simulation de 100 trames à 1 trame/seconde
      for (let t = 1; t <= 100; t++) {
        const frame: TelemetryFrame = {
          timestamp: 1730000000 + t,
          dt: 1.0,
          rpm: 1450,
          speed_kmh: 85.0,
          engine_load_pct: 45.0,
          coolant_temp_c: 88.0,
          oil_temp_c: 94.0,
          ambient_temp_c: 28.0,
          battery_voltage_v: 28.2, // Alternateur 24V parfait
          cranking_v_min: null,
          map_kpa: 140.0,
          maf_gs: 120.0,
          dpf_delta_p_kpa: 0.20, // FAP propre en roulage stabilisé (2 mbar)
          fuel_level_pct: 85.0 - (t * 0.005),
          fuel_rate_lh: 24.0,
          rail_pressure_bar: 1650.0,
          stft_pct: 1.2,
          ltft_pct: -0.8,
          imu_ax: 0.0,
          imu_ay: 0.0,
          imu_az: 9.81,
          ignition_on: true,
          vehicle_mass_kg: 26000,
        };

        const res = engine.step(state, frame, truckConfig);
        state = res.nextState;

        if (t === 100) {
          // Vérifications physiques
          expect(res.degradations.cylinderHead).toBeLessThan(0.05);
          expect(res.degradations.brakeTribology).toBe(0.0); // Pas de freinage
          expect(res.degradations.fuelAntiSiphon).toBe(0.0);
          expect(state.fuelSiphonAlertActive).toBe(false);

          // VHI Aggregator
          const report = VHICalculator.calculate(res.degradations, frame.timestamp);
          expect(report.vhiFinal).toBeGreaterThanOrEqual(90.0);
          expect(report.operationalStatus).toBe('OPTIMAL');
          expect(report.hardVetoTriggered).toBe(false);
        }
      }
    });
  });

  // ==========================================================================
  // 3. SCÉNARIO 2 : COL DES CARAVANES / GORGES DE LA CHIFFA (SURCHAUFFE & FREINS)
  // ==========================================================================
  describe('Scénario 2 : Montée Sévère, Entartrage Radiateur & Descente sur les Freins', () => {
    it('devrait détecter la surchauffe culasse, activer le Hard Veto et plafonner le VHI', () => {
      let state = DeterministicPhysicsEngine.createInitialState(truckConfig);
      // Pré-état d'échauffement
      state.theoreticalCoolantTempC = 92.0;

      // 60 secondes en côte à 95% de charge avec thermostat bloqué / liquide à 112°C (> critique 103°C)
      let lastReport = VHICalculator.calculate({
        engineOil: 0, batteryCranking: 0, cylinderHead: 0, brakeTribology: 0, dpfFilter: 0,
        fuelAntiSiphon: 0, chassisFatigue: 0, tyreAbrasion: 0, clutchWear: 0, injectionDrift: 0,
        turbocharger: 0, alternatorBelt: 0,
      });

      for (let t = 1; t <= 60; t++) {
        const frame: TelemetryFrame = {
          timestamp: 1730001000 + t,
          dt: 1.0,
          rpm: 2100,
          speed_kmh: 42.0,
          engine_load_pct: 95.0,
          coolant_temp_c: 112.5, // Surchauffe critique !
          oil_temp_c: 122.0,
          ambient_temp_c: 44.0, // Canicule estivale Wilaya de Blida
          battery_voltage_v: 27.8,
          cranking_v_min: null,
          map_kpa: 210.0,
          maf_gs: 190.0,
          dpf_delta_p_kpa: 9.0,
          fuel_level_pct: 70.0,
          fuel_rate_lh: 38.0,
          rail_pressure_bar: 2000.0,
          stft_pct: 3.0,
          ltft_pct: 2.5,
          imu_ax: t > 45 ? -3.0 : 0.1, // Montée puis fort freinage en descente
          imu_ay: 0.1,
          imu_az: 9.81,
          ignition_on: true,
          vehicle_mass_kg: 32000,
        };

        const res = engine.step(state, frame, truckConfig);
        state = res.nextState;
        lastReport = VHICalculator.calculate(res.degradations, frame.timestamp);
      }

      // 1. Dégradation culasse sévère
      const culasseScore = lastReport.organDetails.cylinderHead.healthScore;
      expect(culasseScore).toBeLessThan(50); // Organe vital endommagé

      // 2. Échauffement des disques de frein
      expect(state.estimatedDiscTempC).toBeGreaterThan(100);
      expect(state.cumulativeBrakeEnergyJoules).toBeGreaterThan(1e5);

      // 3. Déclenchement du HARD VETO
      expect(lastReport.hardVetoTriggered).toBe(true);
      expect(lastReport.hardVetoOrgan).toBe('cylinderHead');
      // Le VHI final ne peut dépasser culasseScore + 10
      expect(lastReport.vhiFinal).toBeLessThanOrEqual(culasseScore + 10.0);
      expect(lastReport.operationalStatus).toMatch(/CRITIQUE_VETO|MAINTENANCE_REQUISE/);
    });
  });

  // ==========================================================================
  // 4. SCÉNARIO 3 : DÉTECTION DE FRAUDE / SIPHONAGE PAR CUSUM DE PAGE-HINKLEY
  // ==========================================================================
  describe('Scénario 3 : Vol de Carburant & Immunité aux Dévers IMU', () => {
    it('devrait détecter un siphonage de 30L en stationnement plat et déclencher l alerte', () => {
      let state = DeterministicPhysicsEngine.createInitialState(truckConfig);
      // Véhicule arrêté à plat (moteur coupé ou ralenti)
      state.lastFuelLevelPct = 80.0; // 80% de 450L = 360L

      // Chute brutale de la jauge : perte de 30L (6.67% de 450L) en 15 secondes
      let finalRes: any;
      for (let t = 1; t <= 15; t++) {
        const frame: TelemetryFrame = {
          timestamp: 1730002000 + t,
          dt: 1.0,
          rpm: 0,
          speed_kmh: 0,
          engine_load_pct: 0,
          coolant_temp_c: 40.0,
          oil_temp_c: 40.0,
          ambient_temp_c: 25.0,
          battery_voltage_v: 24.8,
          cranking_v_min: null,
          map_kpa: 101.3,
          maf_gs: 0,
          dpf_delta_p_kpa: 0,
          // Jauge qui descend rapidement sans injection moteur
          fuel_level_pct: 80.0 - (t * (30.0 / 450.0 * 100) / 15.0),
          fuel_rate_lh: 0.0,
          rail_pressure_bar: 0,
          stft_pct: 0,
          ltft_pct: 0,
          imu_ax: 0.0, // Plat parfait
          imu_ay: 0.0,
          imu_az: 9.81,
          ignition_on: false,
          vehicle_mass_kg: 18000,
        };

        finalRes = engine.step(state, frame, truckConfig);
        state = finalRes.nextState;
      }

      // CUSUM doit dépasser le seuil de 10L et lever l'alerte
      expect(state.fuelCusumSMinusLiters).toBeGreaterThanOrEqual(10.0);
      expect(state.fuelSiphonAlertActive).toBe(true);
      expect(finalRes.degradations.fuelAntiSiphon).toBe(1.0);
    });

    it('devrait ignorer les fluctuations de jauge dues à un dévers routier sévère (anti-faux positif)', () => {
      let state = DeterministicPhysicsEngine.createInitialState(truckConfig);
      state.lastFuelLevelPct = 80.0;

      // Véhicule engagé sur une forte pente à 12% (imu_ax = 1.17 m/s² > seuil limite 0.12 rad)
      for (let t = 1; t <= 10; t++) {
        const frame: TelemetryFrame = {
          timestamp: 1730003000 + t,
          dt: 1.0,
          rpm: 1500,
          speed_kmh: 30,
          engine_load_pct: 60,
          coolant_temp_c: 85.0,
          ambient_temp_c: 25.0,
          battery_voltage_v: 28.0,
          map_kpa: 130.0,
          maf_gs: 80.0,
          dpf_delta_p_kpa: 3.0,
          // Jauge qui fluctue temporairement à cause du balancement du réservoir
          fuel_level_pct: 73.0, // Apparente chute de 7%
          fuel_rate_lh: 20.0,
          rail_pressure_bar: 1600.0,
          stft_pct: 0,
          ltft_pct: 0,
          imu_ax: 1.5, // Pente forte détectée !
          imu_ay: 0.2,
          imu_az: 9.7,
          ignition_on: true,
          vehicle_mass_kg: 24000,
        };

        const res = engine.step(state, frame, truckConfig);
        state = res.nextState;
      }

      // Grâce au filtre inclinomètre IMU, aucune alerte fausse n'est levée
      expect(state.fuelSiphonAlertActive).toBe(false);
      expect(state.fuelCusumSMinusLiters).toBe(0.0);
    });
  });

  // ==========================================================================
  // 5. SCÉNARIO 4 : COUPURE MOTEUR À CHAUD ("HOT SHUTDOWN" TURBO)
  // ==========================================================================
  describe('Scénario 4 : Arrêt Brutal du Moteur Turbo Surchauffé', () => {
    it('devrait infliger une pénalité exponentielle de cokéfaction des paliers turbo lors d un arrêt à chaud', () => {
      let state = DeterministicPhysicsEngine.createInitialState(truckConfig);
      // Corps du turbo monté à 365°C (> seuil de cokéfaction 320°C) suite à un effort prolongé
      state.chraBodyTempC = 365.0;
      state.lastIgnitionState = true;

      // Trame de coupure contact immédiate (ignition_on passe à false)
      const frameShutoff: TelemetryFrame = {
        timestamp: 1730004000,
        dt: 1.0,
        rpm: 0,
        speed_kmh: 0,
        engine_load_pct: 0,
        coolant_temp_c: 98.0,
        oil_temp_c: 108.0,
        ambient_temp_c: 32.0,
        battery_voltage_v: 25.0,
        cranking_v_min: null,
        map_kpa: 101.3,
        maf_gs: 0,
        dpf_delta_p_kpa: 0,
        fuel_level_pct: 50.0,
        fuel_rate_lh: 0,
        rail_pressure_bar: 0,
        stft_pct: 0,
        ltft_pct: 0,
        imu_ax: 0,
        imu_ay: 0,
        imu_az: 9.81,
        ignition_on: false, // CONTACT COUPÉ !
        vehicle_mass_kg: 22000,
      };

      const res = engine.step(state, frameShutoff, truckConfig);

      // Le dommage cumulé du turbo doit avoir bondi
      expect(res.nextState.turboAccumulatedDamage).toBeGreaterThan(0.05);
      expect(res.degradations.turbocharger).toBeGreaterThan(0.05);

      const report = VHICalculator.calculate(res.degradations, frameShutoff.timestamp);
      expect(report.organDetails.turbocharger.healthScore).toBeLessThan(95);
    });
  });

  // ==========================================================================
  // 6. SCÉNARIO 5 : VÉHICULE UTILITAIRE LÉGER (CALIBRATION VUL 12V)
  // ==========================================================================
  describe('Scénario 5 : Calibration VUL (Renault Kangoo / 12V)', () => {
    it('devrait calibrer correctement la batterie 12V et le cranking minimal', () => {
      const vulConfig = { ...LIGHT_COMMERCIAL_PRESET };
      let state = DeterministicPhysicsEngine.createInitialState(vulConfig);

      // Trame avec démarrage difficile en hiver (V_min = 8.6V à 0°C)
      const frameStart: TelemetryFrame = {
        timestamp: 1730005000,
        dt: 1.0,
        rpm: 450,
        speed_kmh: 0,
        engine_load_pct: 40,
        coolant_temp_c: 2.0,
        oil_temp_c: 2.0,
        ambient_temp_c: 0.0, // Froid steppique (Sétif/Batna)
        battery_voltage_v: 11.8,
        cranking_v_min: 8.6, // Chute sévère !
        map_kpa: 100.0,
        maf_gs: 20.0,
        dpf_delta_p_kpa: 1.0,
        fuel_level_pct: 60.0,
        fuel_rate_lh: 3.5,
        rail_pressure_bar: 450.0,
        stft_pct: 0,
        ltft_pct: 0,
        imu_ax: 0,
        imu_ay: 0,
        imu_az: 9.81,
        ignition_on: true,
        vehicle_mass_kg: 2100,
      };

      const res = engine.step(state, frameStart, vulConfig);
      expect(res.nextState.batteryRiEwmaOhms).toBeGreaterThan(vulConfig.riNewOhms);
      expect(res.degradations.batteryCranking).toBeGreaterThan(0.15);

      const report = VHICalculator.calculate(res.degradations, frameStart.timestamp);
      expect(report.organDetails.batteryCranking.healthScore).toBeLessThan(90);
    });
  });
});
