/**
 * deterministic-physics-engine.ts — Moteur de Physique Déterministe Incrémental en Temps Réel (12 Modules)
 * Zéro ML "Black-Box" — Conforme aux principes de mécanique, thermodynamique et tribologie
 * Complexité O(1) par trame de télémétrie
 */

import {
  TelemetryFrame,
  VehiclePhysicsConfig,
  VehiclePhysicsState,
  OrganId,
} from '@docteurflotte/contracts';
import { OnlineRainflowCounter } from './online-rainflow';

export interface PhysicsEngineStepResult {
  nextState: VehiclePhysicsState;
  degradations: Record<OrganId, number>;
  metrics: Record<string, number | boolean | string>;
}

export class DeterministicPhysicsEngine {
  /**
   * Crée un état physique initial vierge pour un véhicule neuf ou après révision complète
   */
  public static createInitialState(config: VehiclePhysicsConfig): VehiclePhysicsState {
    const is24V = config.systemVoltage === 24;
    return {
      lastTimestamp: 0,
      oilEquivalentHours: 0,
      batteryRiEwmaOhms: config.riNewOhms,
      lastCrankVMin: null,
      theoreticalCoolantTempC: 85.0,
      ewmaThermalResidueC: 0.0,
      cumulativeBrakeEnergyJoules: 0,
      estimatedDiscTempC: 40.0,
      brakePadWearVolumeMm3: 0,
      dpfSootMassGrams: 0,
      dpfAshMassGrams: 0,
      dpfHydraulicResistance: config.hydraulicResistanceNew,
      fuelCusumSMinusLiters: 0,
      lastFuelLevelPct: null,
      fuelSiphonAlertActive: false,
      rainflowTurningPoints: [],
      accumulatedChassisFatigueDamage: 0,
      currentTreadDepthMm: config.treadDepthInitialMm,
      cumulativeClutchEnergyJoules: 0,
      railPressureRollingBuffer: [],
      stftRollingBuffer: [],
      chraBodyTempC: 90.0,
      turboAccumulatedDamage: 0,
      lastIgnitionState: false,
      accumulatedBeltRevolutions: 0,
      alternatorVoltageAnomaliesDurationS: 0,
    };
  }

  /**
   * Exécute un pas de temps incrémental O(1) sur la trame reçue
   */
  public step(
    currentState: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
  ): PhysicsEngineStepResult {
    // Plafonnement du pas de temps pour immunité aux coupures réseau (anti-explosion d'intégration)
    const dt = Math.max(0.01, Math.min(30.0, frame.dt || (currentState.lastTimestamp > 0 ? frame.timestamp - currentState.lastTimestamp : 1.0)));
    const nextState: VehiclePhysicsState = {
      ...currentState,
      lastTimestamp: frame.timestamp,
    };

    // 1. Module 1 : Huile Moteur (Arrhenius & Cisaillement)
    const degOil = this.computeOilDegradation(nextState, frame, config, dt);

    // 2. Module 2 : Batterie & Démarreur (Cranking & Résistance Interne)
    const degBattery = this.computeBatteryHealth(nextState, frame, config);

    // 3. Module 3 : Culasse & Échangeur (Thermique ε-NTU + EWMA)
    const degCulasse = this.computeCoolingSystem(nextState, frame, config, dt);

    // 4. Module 4 : Freins (Loi d'Archard Modifiée)
    const degFreins = this.computeBrakeTribology(nextState, frame, config, dt);

    // 5. Module 5 : Filtre à Particules DPF (Darcy-Forchheimer & Bilan Suie)
    const degDpf = this.computeDpfFilter(nextState, frame, config, dt);

    // 6. Module 6 : Bilan Carburant & Anti-Siphon (CUSUM Page-Hinkley)
    const degFuel = this.computeFuelBalance(nextState, frame, config, dt);

    // 7. Module 7 : Fatigue Châssis & Suspensions (Rainflow 4-Points + Basquin)
    const degChassis = this.computeChassisFatigue(nextState, frame, config);

    // 8. Module 8 : Abrasion Pneumatiques (Schallamach)
    const degTyres = this.computeTyreAbrasion(nextState, frame, config, dt);

    // 9. Module 9 : Embrayage (Dissipation Patinage)
    const degClutch = this.computeClutchWear(nextState, frame, config, dt);

    // 10. Module 10 : Dérive d'Injection & Rampe Haute Pression
    const degInjection = this.computeInjectionDrift(nextState, frame, config);

    // 11. Module 11 : Turbocompresseur (CHRA & Hot Shutdown)
    const degTurbo = this.computeTurbocharger(nextState, frame, config, dt);

    // 12. Module 12 : Alternateur & Courroie d'Accessoires
    const degBelt = this.computeAlternatorBelt(nextState, frame, config, dt);

    // Mémorisation de l'état du contact pour la détection de coupure moteur à la prochaine trame
    nextState.lastIgnitionState = frame.ignition_on;

    const degradations: Record<OrganId, number> = {
      engineOil: degOil,
      batteryCranking: degBattery,
      cylinderHead: degCulasse,
      brakeTribology: degFreins,
      dpfFilter: degDpf,
      fuelAntiSiphon: degFuel,
      chassisFatigue: degChassis,
      tyreAbrasion: degTyres,
      clutchWear: degClutch,
      injectionDrift: degInjection,
      turbocharger: degTurbo,
      alternatorBelt: degBelt,
    };

    const metrics: Record<string, number | boolean | string> = {
      oilEquivalentHours: Number(nextState.oilEquivalentHours.toFixed(2)),
      batteryRiEwmaMilliOhms: Number((nextState.batteryRiEwmaOhms * 1000).toFixed(2)),
      thermalResidueC: Number(nextState.ewmaThermalResidueC.toFixed(2)),
      discTempC: Number(nextState.estimatedDiscTempC.toFixed(1)),
      dpfSootGrams: Number(nextState.dpfSootMassGrams.toFixed(1)),
      fuelCusumLiters: Number(nextState.fuelCusumSMinusLiters.toFixed(2)),
      fuelSiphonAlert: nextState.fuelSiphonAlertActive,
      treadDepthMm: Number(nextState.currentTreadDepthMm.toFixed(2)),
      clutchEnergyMj: Number((nextState.cumulativeClutchEnergyJoules / 1e6).toFixed(2)),
      turboTempC: Number(nextState.chraBodyTempC.toFixed(1)),
      beltRevolutionsM: Number((nextState.accumulatedBeltRevolutions / 1e6).toFixed(2)),
    };

    return {
      nextState,
      degradations,
      metrics,
    };
  }

  // ==========================================================================
  // MODULE 1 : HUILE MOTEUR (ARRHENIUS & CISAILLEMENT)
  // ==========================================================================
  private computeOilDegradation(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    if (!frame.ignition_on && frame.rpm < 100) {
      return Math.min(1.0, state.oilEquivalentHours / config.nominalDrainIntervalHours);
    }

    // Estimation robuste si température d'huile non remontée par le bus CAN
    const oilTempC = frame.oil_temp_c != null
      ? Math.max(20.0, frame.oil_temp_c)
      : Math.max(20.0, frame.coolant_temp_c + 4.0 + (frame.engine_load_pct / 100.0) * 12.0);

    const tRefK = 100.0 + 273.15; // 373.15 K
    const tOilK = oilTempC + 273.15;

    // Facteur d'accélération thermique Arrhenius k(T)
    const exponent = (config.eaArrheniusJPerMol / config.rGasConstant) * (1.0 / tRefK - 1.0 / tOilK);
    const kThermal = Math.exp(Math.max(-2.0, Math.min(4.5, exponent)));

    // Facteur de cisaillement mécanique sous charge
    const rpmRatio = Math.max(0.1, frame.rpm / Math.max(1, config.rpmNominal));
    const loadRatio = Math.max(0.0, Math.min(1.0, frame.engine_load_pct / 100.0));
    const betaLoad = 1.0 + config.c1LoadFactor * rpmRatio * loadRatio;

    // Incrément d'heures équivalentes de vieillissement
    const deltaHours = (kThermal * betaLoad * dt) / 3600.0;
    state.oilEquivalentHours += deltaHours;

    return Math.max(0.0, Math.min(1.0, state.oilEquivalentHours / config.nominalDrainIntervalHours));
  }

  // ==========================================================================
  // MODULE 2 : SANTÉ BATTERIE (CRANKING & RÉSISTANCE INTERNE)
  // ==========================================================================
  private computeBatteryHealth(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
  ): number {
    const is24V = config.systemVoltage === 24;
    const vRestNominal = is24V ? 25.4 : 12.7;

    // Mise à jour de la résistance interne uniquement si un démarrage est détecté
    if (frame.cranking_v_min != null && frame.cranking_v_min > 4.0 && frame.cranking_v_min !== state.lastCrankVMin) {
      state.lastCrankVMin = frame.cranking_v_min;

      // Correction thermique : γ_T * (20 - T_amb)
      const vCorr = frame.cranking_v_min + config.gammaTempCoeff * (20.0 - frame.ambient_temp_c);
      const measuredRi = Math.max(0.001, (vRestNominal - vCorr) / config.nominalCrankingCurrentA);

      // Si premier démarrage enregistré, initialiser directement à measuredRi
      if (state.batteryRiEwmaOhms === config.riNewOhms) {
        state.batteryRiEwmaOhms = measuredRi;
      } else {
        state.batteryRiEwmaOhms =
          config.ewmaLambdaBattery * measuredRi + (1.0 - config.ewmaLambdaBattery) * state.batteryRiEwmaOhms;
      }
    }

    const riRange = config.riCriticalOhms - config.riNewOhms;
    const deg = (state.batteryRiEwmaOhms - config.riNewOhms) / Math.max(0.001, riRange);
    return Math.max(0.0, Math.min(1.0, deg));
  }

  // ==========================================================================
  // MODULE 3 : CULASSE & ÉCHANGEUR (MODÈLE ε-NTU + EWMA)
  // ==========================================================================
  private computeCoolingSystem(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    const vMs = Math.max(0.0, frame.speed_kmh / 3.6);
    // Convection forcée U(v) = U0 + U1 * sqrt(v)
    const uConvection = config.u0ConvectionBaseWPerK + config.u1ConvectionVelocityWPerKMs * Math.sqrt(vMs);

    // Chaleur dégagée par la combustion transférée au fluide de refroidissement
    const fuelFlowKgs = (Math.max(0.0, frame.fuel_rate_lh) * 0.84) / 3600.0;
    const qIn = config.alphaCombustionFraction * fuelFlowKgs * config.fuelPciJPerKg;

    // Modèle thermodynamique de thermostat : modulation du débit radiateur
    // Le thermostat commence à s'ouvrir à 80°C et est totalement ouvert à 90°C
    const tNominalThermostat = 85.0;
    const thermostatOpening = Math.max(0.05, Math.min(1.0, (state.theoreticalCoolantTempC - (tNominalThermostat - 5.0)) / 10.0));

    // Dissipation du radiateur modulée par l'ouverture du thermostat
    const deltaTLoop = Math.max(0.0, state.theoreticalCoolantTempC - frame.ambient_temp_c);
    const qOut = uConvection * config.radiatorAreaM2 * thermostatOpening * deltaTLoop;

    // Évolution température théorique
    const deltaTemp = (dt / config.thermalCapacityJPerK) * (qIn - qOut);
    state.theoreticalCoolantTempC = Math.max(
      frame.ambient_temp_c,
      Math.min(125.0, state.theoreticalCoolantTempC + deltaTemp),
    );

    // Résidu thermique mesuré vs théorique
    const measuredCoolant = Math.max(20.0, frame.coolant_temp_c);
    const residual = Math.max(0.0, measuredCoolant - state.theoreticalCoolantTempC);

    // Lissage EWMA
    state.ewmaThermalResidueC =
      config.ewmaLambdaThermal * residual + (1.0 - config.ewmaLambdaThermal) * state.ewmaThermalResidueC;

    // Pénalité déterministe d'ébullition si dépassement de seuil critique
    const overheatPenalty = measuredCoolant > config.coolantCriticalTempC ? 0.50 : 0.0;
    const rawDeg = state.ewmaThermalResidueC / config.deltaTMaxToleratedC + overheatPenalty;

    return Math.max(0.0, Math.min(1.0, rawDeg));
  }

  // ==========================================================================
  // MODULE 4 : FREINS (LOI D'ARCHARD MODIFIÉE)
  // ==========================================================================
  private computeBrakeTribology(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    const vMs = Math.max(0.0, frame.speed_kmh / 3.6);
    const axDecel = -frame.imu_ax; // positif si décélération

    if (axDecel > config.engineBrakingMaxDecelMs2 && vMs > 0.5) {
      const mass = Math.max(800, frame.vehicle_mass_kg);
      const fInertia = mass * axDecel;
      const fAero = 0.5 * 1.225 * config.cxDragCoeffArea * (vMs * vMs);
      const fEngineBrake = mass * config.engineBrakingMaxDecelMs2;
      const fBrake = Math.max(0.0, fInertia - fAero - fEngineBrake);

      const pBrake = fBrake * vMs;
      const deltaEnergyJ = pBrake * dt;
      state.cumulativeBrakeEnergyJoules += deltaEnergyJ;

      // Échauffement thermique des disques de freins
      const deltaTempIn = deltaEnergyJ / (config.discMassKg * config.discSpecificHeatJPerKgK);
      const deltaTempOut =
        (config.discCoolingNewtonWPerK * Math.max(0.0, state.estimatedDiscTempC - frame.ambient_temp_c) * dt) /
        (config.discMassKg * config.discSpecificHeatJPerKgK);

      state.estimatedDiscTempC = Math.max(
        frame.ambient_temp_c,
        Math.min(750.0, state.estimatedDiscTempC + deltaTempIn - deltaTempOut),
      );

      // Volume d'usure d'Archard thermo-sensible
      const tempFactor = 1.0 + Math.max(0.0, (state.estimatedDiscTempC - 200.0) / 150.0);
      const kArchard = config.archardWearCoeffM3PerJ * tempFactor;
      const deltaVolumeMm3 = kArchard * deltaEnergyJ * 1e9;
      state.brakePadWearVolumeMm3 += deltaVolumeMm3;
    } else {
      // Refroidissement passif en roulage stabilisé ou arrêt
      const deltaTempOut =
        (config.discCoolingNewtonWPerK * Math.max(0.0, state.estimatedDiscTempC - frame.ambient_temp_c) * dt) /
        (config.discMassKg * config.discSpecificHeatJPerKgK);
      state.estimatedDiscTempC = Math.max(frame.ambient_temp_c, state.estimatedDiscTempC - deltaTempOut);
    }

    return Math.max(0.0, Math.min(1.0, state.cumulativeBrakeEnergyJoules / config.maxPadWearJoules));
  }

  // ==========================================================================
  // MODULE 5 : FILTRE À PARTICULES DPF (DARCY-FORCHHEIMER & MASSE)
  // ==========================================================================
  private computeDpfFilter(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    const tExhaustK = Math.max(150.0, frame.coolant_temp_c * 2.8) + 273.15;
    const qExhaustM3s = (Math.max(1.0, frame.maf_gs) / 1.225) * (tExhaustK / 293.15) * 1e-3;

    // Résistance hydraulique de Darcy
    state.dpfHydraulicResistance = frame.dpf_delta_p_kpa / Math.max(0.005, qExhaustM3s);

    // Bilan massique suie (génération vs régénération passive)
    if (frame.ignition_on && frame.rpm > 300) {
      const sootGen = config.sootGenerationCoeff * (frame.rpm / 1000.0) * (frame.engine_load_pct / 100.0);
      const sootOxidation = tExhaustK > 773.15
        ? config.sootOxidationCoeff * ((tExhaustK - 773.15) / 100.0)
        : 0.0;

      const deltaSoot = (sootGen - sootOxidation) * dt;
      state.dpfSootMassGrams = Math.max(0.0, Math.min(config.sootMaxGrams * 1.5, state.dpfSootMassGrams + deltaSoot));
    }

    const sootRatio = state.dpfSootMassGrams / config.sootMaxGrams;
    const rSpan = config.hydraulicResistanceClogged - config.hydraulicResistanceNew;
    const resistanceRatio = (state.dpfHydraulicResistance - config.hydraulicResistanceNew) / Math.max(0.01, rSpan);

    return Math.max(0.0, Math.min(1.0, Math.max(sootRatio, resistanceRatio)));
  }

  // ==========================================================================
  // MODULE 6 : CARBURANT & ANTI-SIPHONAGE (CUSUM DE PAGE-HINKLEY)
  // ==========================================================================
  private computeFuelBalance(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    // Filtrage dynamique IMU : en cas de fort dévers ou virage prononcé, la surface du carburant bascule
    const pitchAngleRad = Math.asin(Math.max(-1.0, Math.min(1.0, frame.imu_ax / 9.81)));
    const rollAngleRad = Math.asin(Math.max(-1.0, Math.min(1.0, frame.imu_ay / 9.81)));

    if (Math.abs(pitchAngleRad) > config.maxInclineImuAngleRad || Math.abs(rollAngleRad) > config.maxInclineImuAngleRad) {
      // Conservation de l'état sans accumulation faussée
      return Math.max(0.0, Math.min(1.0, state.fuelCusumSMinusLiters / config.cusumSiphonThresholdLiters));
    }

    const currentLiters = (Math.max(0.0, Math.min(100.0, frame.fuel_level_pct)) / 100.0) * config.tankCapacityLiters;

    if (state.lastFuelLevelPct == null) {
      state.lastFuelLevelPct = frame.fuel_level_pct;
      return 0.0;
    }

    const prevLiters = (state.lastFuelLevelPct / 100.0) * config.tankCapacityLiters;
    const deltaJauge = currentLiters - prevLiters;
    const injectedLiters = (Math.max(0.0, frame.fuel_rate_lh) * dt) / 3600.0;

    // Erreur de conservation massique : e_k = ΔV_jauge - (-V_inj) = ΔV_jauge + V_inj
    const massError = deltaJauge + injectedLiters;

    // Somme cumulative unilatérale négative (Page-Hinkley)
    const noiseMargin = config.cusumNoiseMarginLiters * dt;
    state.fuelCusumSMinusLiters = Math.max(0.0, state.fuelCusumSMinusLiters - massError - noiseMargin);

    if (state.fuelCusumSMinusLiters >= config.cusumSiphonThresholdLiters) {
      state.fuelSiphonAlertActive = true;
    }

    state.lastFuelLevelPct = frame.fuel_level_pct;
    return Math.max(0.0, Math.min(1.0, state.fuelCusumSMinusLiters / config.cusumSiphonThresholdLiters));
  }

  // ==========================================================================
  // MODULE 7 : CHÂSSIS & SUSPENSIONS (RAINFLOW 4-POINTS + BASQUIN)
  // ==========================================================================
  private computeChassisFatigue(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
  ): number {
    const rainflow = new OnlineRainflowCounter(
      {
        suspensionStiffnessCoeff: config.suspensionStiffnessCoeff,
        fatigueEnduranceLimitPa: config.fatigueEnduranceLimitPa,
        wohlerExponentB: config.wohlerExponentB,
        n0EnduranceCycles: config.n0EnduranceCycles,
      },
      state.rainflowTurningPoints,
    );

    // Accélération verticale centrée (enlevant la gravité 1g)
    const azDynamic = frame.imu_az - 9.81;
    const cycles = rainflow.processPoint(azDynamic, frame.vehicle_mass_kg);

    for (const cycle of cycles) {
      state.accumulatedChassisFatigueDamage += cycle.damage;
    }

    state.rainflowTurningPoints = rainflow.getStack();
    return Math.max(0.0, Math.min(1.0, state.accumulatedChassisFatigueDamage));
  }

  // ==========================================================================
  // MODULE 8 : ABRASION PNEUMATIQUES (MODÈLE DE SCHALLAMACH)
  // ==========================================================================
  private computeTyreAbrasion(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    const vMs = Math.max(0.0, frame.speed_kmh / 3.6);
    const mass = Math.max(800, frame.vehicle_mass_kg);

    // Puissance mécanique de glissement (Friction Work)
    const fLong = mass * frame.imu_ax;
    const fLat = mass * frame.imu_ay;
    const pFriction = vMs * (config.kappaSlipLongitudinal * (fLong * fLong) + config.kappaSlipLateral * (fLat * fLat));

    // Sensibilité thermique de la gomme en milieu saharien
    const phiTemp = 1.0 + config.alphaRubberThermal * Math.max(0.0, frame.ambient_temp_c - 25.0);

    // Usure d'épaisseur de gomme
    const deltaHeightMm = config.kSchallamachMmPerJ * phiTemp * pFriction * dt;
    state.currentTreadDepthMm = Math.max(0.0, state.currentTreadDepthMm - deltaHeightMm);

    const usableDepth = config.treadDepthInitialMm - config.treadDepthLegalMm;
    const depthLost = config.treadDepthInitialMm - state.currentTreadDepthMm;

    return Math.max(0.0, Math.min(1.0, depthLost / Math.max(0.1, usableDepth)));
  }

  // ==========================================================================
  // MODULE 9 : EMBRAYAGE (DISSIPATION ÉNERGÉTIQUE DE PATINAGE)
  // ==========================================================================
  private computeClutchWear(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    const vMs = Math.max(0.0, frame.speed_kmh / 3.6);
    const omegaEngine = (frame.rpm * 2.0 * Math.PI) / 60.0;

    if (vMs > 0.5 && omegaEngine > 40.0) {
      const omegaWheel = vMs / config.wheelRadiusM;
      const ratioCurrent = omegaEngine / Math.max(0.1, omegaWheel);

      // Détection de rapport engagé et verrouillé
      let isGearLocked = false;
      let nearestRatio = config.gearRatios[0];
      let minDelta = Infinity;

      for (const ratio of config.gearRatios) {
        const delta = Math.abs(ratioCurrent - ratio);
        if (delta < minDelta) {
          minDelta = delta;
          nearestRatio = ratio;
        }
        if (delta / ratio <= config.gearTolerancePct) {
          isGearLocked = true;
          break;
        }
      }

      // Si le rapport n'est pas verrouillé et qu'une charge motrice est appliquée => patinage
      if (!isGearLocked && frame.engine_load_pct > 15.0) {
        const nominalMaxTorque = frame.vehicle_mass_kg > 5000 ? 2100.0 : 380.0;
        const currentTorque = (frame.engine_load_pct / 100.0) * nominalMaxTorque;
        const slipSpeedRadS = Math.abs(omegaEngine - omegaWheel * nearestRatio);
        const pClutch = currentTorque * slipSpeedRadS;

        state.cumulativeClutchEnergyJoules += pClutch * dt;
      }
    }

    return Math.max(0.0, Math.min(1.0, state.cumulativeClutchEnergyJoules / config.maxClutchDissipationJoules));
  }

  // ==========================================================================
  // MODULE 10 : DÉRIVE D'INJECTION & RAMPE HAUTE PRESSION
  // ==========================================================================
  private computeInjectionDrift(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
  ): number {
    // Indice de dérive d'injection
    const trimIndex = Math.abs(frame.ltft_pct) + 0.5 * Math.abs(frame.stft_pct);

    // Maintien du tampon glissant de pression rail (taille 20)
    state.railPressureRollingBuffer.push(frame.rail_pressure_bar);
    if (state.railPressureRollingBuffer.length > 20) {
      state.railPressureRollingBuffer.shift();
    }

    // Calcul de l'écart-type glissant de pression rail
    let sigmaRail = 0.0;
    const buf = state.railPressureRollingBuffer;
    if (buf.length >= 5) {
      const mean = buf.reduce((a, b) => a + b, 0) / buf.length;
      const variance = buf.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / buf.length;
      sigmaRail = Math.sqrt(variance);
    }

    const trimScore = trimIndex / config.trimLimitPct;
    const railScore = sigmaRail / config.sigmaRailCriticalBar;
    const rawDeg = config.w1TrimWeight * trimScore + config.w2RailWeight * railScore;

    return Math.max(0.0, Math.min(1.0, rawDeg));
  }

  // ==========================================================================
  // MODULE 11 : TURBOCOMPRESSEUR (CHRA & HOT SHUTDOWN)
  // ==========================================================================
  private computeTurbocharger(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    // Température cible du corps central (CHRA) selon charge, RPM et suralimentation
    const boostKpa = Math.max(0.0, frame.map_kpa - 100.0);
    const targetTemp =
      100.0 +
      (frame.engine_load_pct / 100.0) * 260.0 +
      (frame.rpm / 2000.0) * 80.0 +
      boostKpa * 0.9;

    // Modèle de premier ordre avec constante de temps thermique
    const dTemp = (dt / config.chraThermalTimeConstantS) * (targetTemp - state.chraBodyTempC);
    state.chraBodyTempC = Math.max(frame.ambient_temp_c, state.chraBodyTempC + dTemp);

    // PÉNALITÉ D'ARRÊT À CHAUD ("HOT SHUTDOWN")
    // Transition contact ON -> OFF alors que le turbo est surchauffé
    if (state.lastIgnitionState && !frame.ignition_on) {
      if (state.chraBodyTempC > config.turboCokefactionTempC) {
        const deltaOverheat = state.chraBodyTempC - config.turboCokefactionTempC;
        const penalty = config.hotShutdownBasePenalty * Math.exp(Math.min(3.0, deltaOverheat / 50.0));
        state.turboAccumulatedDamage += penalty;
      }
    }

    // Fatigue thermique progressive si utilisation prolongée au-delà de 280°C
    const creepWear = state.chraBodyTempC > 280.0 ? ((state.chraBodyTempC - 280.0) / 100.0) * (dt / 3600.0) * 0.05 : 0.0;
    state.turboAccumulatedDamage += creepWear;

    return Math.max(0.0, Math.min(1.0, state.turboAccumulatedDamage));
  }

  // ==========================================================================
  // MODULE 12 : ALTERNATEUR & COURROIE D'ACCESSOIRES
  // ==========================================================================
  private computeAlternatorBelt(
    state: VehiclePhysicsState,
    frame: TelemetryFrame,
    config: VehiclePhysicsConfig,
    dt: number,
  ): number {
    if (frame.ignition_on && frame.rpm > 800) {
      // Révolution cumulée poulie alternateur
      const revs = (frame.rpm / 60.0) * config.pulleySpeedRatio * dt;
      state.accumulatedBeltRevolutions += revs;

      // Anomalie de tension du régulateur
      const undercharge = Math.max(0.0, config.vChargeMinNominal - frame.battery_voltage_v);
      const overcharge = Math.max(0.0, frame.battery_voltage_v - config.vChargeMaxNominal);

      if (undercharge > 0.25 || overcharge > 0.25) {
        state.alternatorVoltageAnomaliesDurationS += dt;
      }
    }

    const beltRatio = state.accumulatedBeltRevolutions / config.maxBeltRevolutions;
    // 3 minutes continues d'anomalie de régulation entraînent une dégradation maximale
    const regulatorRatio = state.alternatorVoltageAnomaliesDurationS / 180.0;

    return Math.max(0.0, Math.min(1.0, 0.60 * beltRatio + 0.40 * regulatorRatio));
  }
}
