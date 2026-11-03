/**
 * deterministic-physics.ts — Contrats & Interfaces du Moteur de Physique Déterministe (12 Modules & VHI)
 * Conforme à MASTER_SPEC v3.0, Zéro ML "Black-Box", Explicabilité Intégrale (XAI)
 * Lois physiques : Arrhenius, Archard, Darcy-Forchheimer, CUSUM, Basquin/Rainflow, Schallamach, Bernoulli, CHRA.
 */

// ============================================================================
// 1. TRAME TÉLÉMÉTRIQUE NORMALISÉE (CAN / J1939 / OBD-II / IMU)
// ============================================================================

export interface TelemetryFrame {
  /** Horodatage UNIX en secondes */
  timestamp: number;
  /** Pas de temps en secondes entre deux trames (plafonné pour résilience) */
  dt: number;
  /** Régime moteur en tr/min (RPM) */
  rpm: number;
  /** Vitesse véhicule en km/h */
  speed_kmh: number;
  /** Charge moteur en % [0, 100] */
  engine_load_pct: number;
  /** Température liquide de refroidissement (°C) */
  coolant_temp_c: number;
  /** Température huile moteur (°C) - fallback sur coolant_temp_c + charge si omise */
  oil_temp_c?: number | null;
  /** Température ambiante extérieure (°C) */
  ambient_temp_c: number;
  /** Tension batterie instantanée (Volts) */
  battery_voltage_v: number;
  /** Tension minimale mesurée lors du dernier démarrage (Volts) */
  cranking_v_min?: number | null;
  /** Pression absolue collecteur admission (kPa) */
  map_kpa: number;
  /** Débit massique d'air admission (g/s) */
  maf_gs: number;
  /** Pression différentielle FAP / DPF (kPa) */
  dpf_delta_p_kpa: number;
  /** Niveau de carburant jauge en % [0, 100] */
  fuel_level_pct: number;
  /** Débit carburant calculateur en L/h */
  fuel_rate_lh: number;
  /** Pression rampe commune Common Rail (bar) */
  rail_pressure_bar: number;
  /** Short Term Fuel Trim (%) */
  stft_pct: number;
  /** Long Term Fuel Trim (%) */
  ltft_pct: number;
  /** Accélération longitudinale IMU (m/s²) */
  imu_ax: number;
  /** Accélération latérale IMU (m/s²) */
  imu_ay: number;
  /** Accélération verticale IMU (m/s²) */
  imu_az: number;
  /** Statut contact / moteur en marche */
  ignition_on: boolean;
  /** Masse totale statique ou estimée (kg) */
  vehicle_mass_kg: number;
}

// ============================================================================
// 2. CONFIGURATION PHYSIQUE DU VÉHICULE (CALIBRATION PAR SEGMENT)
// ============================================================================

export type VehicleSegmentType = 'LIGHT_COMMERCIAL' | 'HEAVY_TRUCK' | 'OFF_ROAD_BTP';

export interface VehiclePhysicsConfig {
  segment: VehicleSegmentType;

  // Module 1 : Huile Moteur (Arrhenius)
  nominalDrainIntervalHours: number;
  rpmNominal: number;
  c1LoadFactor: number;
  eaArrheniusJPerMol: number;
  rGasConstant: number;

  // Module 2 : Batterie & Démarreur
  systemVoltage: 12 | 24;
  nominalCrankingCurrentA: number;
  riNewOhms: number;
  riCriticalOhms: number;
  gammaTempCoeff: number;
  ewmaLambdaBattery: number;

  // Module 3 : Thermique Culasse & Échangeur
  thermalCapacityJPerK: number;
  alphaCombustionFraction: number;
  fuelPciJPerKg: number;
  u0ConvectionBaseWPerK: number;
  u1ConvectionVelocityWPerKMs: number;
  radiatorAreaM2: number;
  deltaTMaxToleratedC: number;
  coolantCriticalTempC: number;
  ewmaLambdaThermal: number;

  // Module 4 : Freins (Loi d'Archard)
  cxDragCoeffArea: number;
  engineBrakingMaxDecelMs2: number;
  archardWearCoeffM3PerJ: number;
  maxPadWearJoules: number;
  discMassKg: number;
  discSpecificHeatJPerKgK: number;
  discCoolingNewtonWPerK: number;

  // Module 5 : Filtre à Particules FAP (Darcy-Forchheimer)
  hydraulicResistanceNew: number;
  hydraulicResistanceClogged: number;
  sootMaxGrams: number;
  sootGenerationCoeff: number;
  sootOxidationCoeff: number;

  // Module 6 : Carburant & Anti-Siphon (CUSUM)
  tankCapacityLiters: number;
  cusumNoiseMarginLiters: number;
  cusumSiphonThresholdLiters: number;
  maxInclineImuAngleRad: number;

  // Module 7 : Châssis & Suspension (Rainflow / Basquin)
  suspensionStiffnessCoeff: number;
  fatigueEnduranceLimitPa: number;
  wohlerExponentB: number;
  n0EnduranceCycles: number;

  // Module 8 : Abrasion Pneumatiques (Schallamach)
  kappaSlipLongitudinal: number;
  kappaSlipLateral: number;
  alphaRubberThermal: number;
  kSchallamachMmPerJ: number;
  treadDepthInitialMm: number;
  treadDepthLegalMm: number;

  // Module 9 : Embrayage (Dissipation Patinage)
  wheelRadiusM: number;
  gearRatios: number[];
  gearTolerancePct: number;
  maxClutchDissipationJoules: number;

  // Module 10 : Injection & Rampe Haute Pression
  trimLimitPct: number;
  sigmaRailCriticalBar: number;
  w1TrimWeight: number;
  w2RailWeight: number;

  // Module 11 : Turbocompresseur (CHRA & Hot Shutdown)
  chraThermalTimeConstantS: number;
  turboCokefactionTempC: number;
  hotShutdownBasePenalty: number;

  // Module 12 : Alternateur & Courroie d'Accessoires
  vChargeMinNominal: number;
  vChargeMaxNominal: number;
  pulleySpeedRatio: number;
  maxBeltRevolutions: number;
}

// ============================================================================
// 3. ÉTAT PERSISTANT ENTRE DEUX TRAMES (STATEFUL STREAM REGISTERS)
// ============================================================================

export interface VehiclePhysicsState {
  lastTimestamp: number;

  // Module 1
  oilEquivalentHours: number;

  // Module 2
  batteryRiEwmaOhms: number;
  lastCrankVMin: number | null;

  // Module 3
  theoreticalCoolantTempC: number;
  ewmaThermalResidueC: number;

  // Module 4
  cumulativeBrakeEnergyJoules: number;
  estimatedDiscTempC: number;
  brakePadWearVolumeMm3: number;

  // Module 5
  dpfSootMassGrams: number;
  dpfAshMassGrams: number;
  dpfHydraulicResistance: number;

  // Module 6
  fuelCusumSMinusLiters: number;
  lastFuelLevelPct: number | null;
  fuelSiphonAlertActive: boolean;

  // Module 7
  rainflowTurningPoints: number[];
  accumulatedChassisFatigueDamage: number;

  // Module 8
  currentTreadDepthMm: number;

  // Module 9
  cumulativeClutchEnergyJoules: number;

  // Module 10
  railPressureRollingBuffer: number[];
  stftRollingBuffer: number[];

  // Module 11
  chraBodyTempC: number;
  turboAccumulatedDamage: number;
  lastIgnitionState: boolean;

  // Module 12
  accumulatedBeltRevolutions: number;
  alternatorVoltageAnomaliesDurationS: number;
}

// ============================================================================
// 4. RAPPORT VHI (VEHICLE HEALTH INDEX) & EXPLICABILITÉ (XAI)
// ============================================================================

export type OrganId =
  | 'engineOil'
  | 'batteryCranking'
  | 'cylinderHead'
  | 'brakeTribology'
  | 'dpfFilter'
  | 'fuelAntiSiphon'
  | 'chassisFatigue'
  | 'tyreAbrasion'
  | 'clutchWear'
  | 'injectionDrift'
  | 'turbocharger'
  | 'alternatorBelt';

export type OperationalStatus =
  | 'OPTIMAL'
  | 'SURVEILLANCE'
  | 'MAINTENANCE_REQUISE'
  | 'CRITIQUE_VETO';

export interface VHIComponentDetail {
  organId: OrganId;
  nameFr: string;
  nameAr: string;
  degradationIndex: number; // D_i in [0, 1]
  healthScore: number;      // S_i in [1, 100]
  weight: number;
  alphaNonLinearity: number;
  isVitalSafetyOrgan: boolean;
  rulEstimate: {
    value: number;
    unit: 'HOURS' | 'KM' | 'DAYS';
  };
  physicalSummary: string;
}

export interface VHIReport {
  vhiFinal: number; // Score final agrégé après Hard Veto [1, 100]
  vhiSoft: number;  // Score agrégé moyenne harmonique L_-p [1, 100]
  operationalStatus: OperationalStatus;
  bottleneckComponent: OrganId;
  bottleneckScore: number;
  hardVetoTriggered: boolean;
  hardVetoOrgan: OrganId | null;
  organDetails: Record<OrganId, VHIComponentDetail>;
  timestamp: number;
  explanation: string;
}

// ============================================================================
// 5. CALIBRATIONS PAR DÉFAUT PAR SEGMENT
// ============================================================================

export const LIGHT_COMMERCIAL_PRESET: VehiclePhysicsConfig = {
  segment: 'LIGHT_COMMERCIAL',
  // Huile
  nominalDrainIntervalHours: 350,
  rpmNominal: 2800,
  c1LoadFactor: 0.6,
  eaArrheniusJPerMol: 85000,
  rGasConstant: 8.314,
  // Batterie (12V)
  systemVoltage: 12,
  nominalCrankingCurrentA: 450,
  riNewOhms: 0.005,
  riCriticalOhms: 0.025,
  gammaTempCoeff: 0.015,
  ewmaLambdaBattery: 0.25,
  // Culasse
  thermalCapacityJPerK: 55000,
  alphaCombustionFraction: 0.28,
  fuelPciJPerKg: 42.6e6,
  u0ConvectionBaseWPerK: 210,
  u1ConvectionVelocityWPerKMs: 50,
  radiatorAreaM2: 0.50,
  deltaTMaxToleratedC: 15.0,
  coolantCriticalTempC: 105.0,
  ewmaLambdaThermal: 0.05,
  // Freins
  cxDragCoeffArea: 0.85,
  engineBrakingMaxDecelMs2: 0.35,
  archardWearCoeffM3PerJ: 1.2e-11,
  maxPadWearJoules: 4.5e8,
  discMassKg: 28,
  discSpecificHeatJPerKgK: 460,
  discCoolingNewtonWPerK: 35,
  // FAP
  hydraulicResistanceNew: 1.0,
  hydraulicResistanceClogged: 4.2,
  sootMaxGrams: 45,
  sootGenerationCoeff: 0.00015,
  sootOxidationCoeff: 0.00022,
  // Carburant CUSUM
  tankCapacityLiters: 70,
  cusumNoiseMarginLiters: 0.08,
  cusumSiphonThresholdLiters: 6.0,
  maxInclineImuAngleRad: 0.14,
  // Châssis Rainflow
  suspensionStiffnessCoeff: 1.2,
  fatigueEnduranceLimitPa: 140e6,
  wohlerExponentB: 3.8,
  n0EnduranceCycles: 2e6,
  // Pneus Schallamach
  kappaSlipLongitudinal: 1.6e-6,
  kappaSlipLateral: 2.8e-6,
  alphaRubberThermal: 0.015,
  kSchallamachMmPerJ: 3.2e-9,
  treadDepthInitialMm: 8.5,
  treadDepthLegalMm: 1.6,
  // Embrayage
  wheelRadiusM: 0.32,
  gearRatios: [14.5, 8.2, 5.1, 3.4, 2.1, 1.0],
  gearTolerancePct: 0.09,
  maxClutchDissipationJoules: 1.2e8,
  // Injection
  trimLimitPct: 25.0,
  sigmaRailCriticalBar: 40.0,
  w1TrimWeight: 0.6,
  w2RailWeight: 0.4,
  // Turbo
  chraThermalTimeConstantS: 45,
  turboCokefactionTempC: 320,
  hotShutdownBasePenalty: 0.04,
  // Alternateur / Courroie
  vChargeMinNominal: 13.7,
  vChargeMaxNominal: 14.8,
  pulleySpeedRatio: 2.8,
  maxBeltRevolutions: 1.2e8,
};

export const HEAVY_TRUCK_PRESET: VehiclePhysicsConfig = {
  segment: 'HEAVY_TRUCK',
  // Huile
  nominalDrainIntervalHours: 600,
  rpmNominal: 1900,
  c1LoadFactor: 0.6,
  eaArrheniusJPerMol: 85000,
  rGasConstant: 8.314,
  // Batterie (24V)
  systemVoltage: 24,
  nominalCrankingCurrentA: 800,
  riNewOhms: 0.009,
  riCriticalOhms: 0.038,
  gammaTempCoeff: 0.030,
  ewmaLambdaBattery: 0.20,
  // Culasse
  thermalCapacityJPerK: 140000,
  alphaCombustionFraction: 0.27,
  fuelPciJPerKg: 42.6e6,
  u0ConvectionBaseWPerK: 450,
  u1ConvectionVelocityWPerKMs: 110,
  radiatorAreaM2: 1.35,
  deltaTMaxToleratedC: 12.0,
  coolantCriticalTempC: 103.0,
  ewmaLambdaThermal: 0.04,
  // Freins
  cxDragCoeffArea: 6.8,
  engineBrakingMaxDecelMs2: 0.45,
  archardWearCoeffM3PerJ: 1.5e-11,
  maxPadWearJoules: 2.5e9,
  discMassKg: 180,
  discSpecificHeatJPerKgK: 460,
  discCoolingNewtonWPerK: 120,
  // FAP
  hydraulicResistanceNew: 1.0,
  hydraulicResistanceClogged: 4.8,
  sootMaxGrams: 180,
  sootGenerationCoeff: 0.00030,
  sootOxidationCoeff: 0.00045,
  // Carburant CUSUM
  tankCapacityLiters: 450,
  cusumNoiseMarginLiters: 0.15,
  cusumSiphonThresholdLiters: 10.0,
  maxInclineImuAngleRad: 0.12,
  // Châssis Rainflow
  suspensionStiffnessCoeff: 1.8,
  fatigueEnduranceLimitPa: 160e6,
  wohlerExponentB: 4.0,
  n0EnduranceCycles: 3e6,
  // Pneus Schallamach (315/80 R22.5)
  kappaSlipLongitudinal: 1.2e-6,
  kappaSlipLateral: 2.2e-6,
  alphaRubberThermal: 0.016,
  kSchallamachMmPerJ: 2.5e-9,
  treadDepthInitialMm: 16.0,
  treadDepthLegalMm: 1.6,
  // Embrayage
  wheelRadiusM: 0.518,
  gearRatios: [16.4, 12.8, 9.5, 7.1, 5.3, 3.9, 2.9, 2.1, 1.5, 1.0],
  gearTolerancePct: 0.08,
  maxClutchDissipationJoules: 6.5e8,
  // Injection
  trimLimitPct: 25.0,
  sigmaRailCriticalBar: 55.0,
  w1TrimWeight: 0.6,
  w2RailWeight: 0.4,
  // Turbo
  chraThermalTimeConstantS: 60,
  turboCokefactionTempC: 320,
  hotShutdownBasePenalty: 0.05,
  // Alternateur / Courroie
  vChargeMinNominal: 27.4,
  vChargeMaxNominal: 29.2,
  pulleySpeedRatio: 3.2,
  maxBeltRevolutions: 1.8e8,
};

export const OFF_ROAD_BTP_PRESET: VehiclePhysicsConfig = {
  ...HEAVY_TRUCK_PRESET,
  segment: 'OFF_ROAD_BTP',
  nominalDrainIntervalHours: 350,
  tankCapacityLiters: 550,
  cusumSiphonThresholdLiters: 12.0,
  treadDepthInitialMm: 24.0,
  maxPadWearJoules: 3.2e9,
  coolantCriticalTempC: 102.0,
};
