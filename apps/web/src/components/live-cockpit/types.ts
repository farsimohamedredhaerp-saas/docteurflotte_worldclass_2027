/**
 * Types & Interfaces pour le Live Fleet Operations & Telemetry Cockpit
 * Conforme SAE J1939, OBD-II et Architecture Télématique Souveraine DocteurFlotte
 */

export type VehicleOperationalStatus =
  | 'MOTION'         // En route (vitesse > 0, vert emerald-500)
  | 'IDLE_WARNING'   // Ralenti excessif improductif (amber-500)
  | 'DTC_CRITICAL'   // Alerte défaut moteur / immobilisation (rose-500)
  | 'PARKED_OFF'     // Moteur éteint / stationné (slate-400)
  | 'OFFLINE';       // Déconnecté / perte GSM (slate-600)

export type VehicleCategory =
  | 'HEAVY_TRUCK'
  | 'CONSTRUCTION_BTP'
  | 'LIGHT_COMMERCIAL';

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  headingDegrees: number; // Cap 0-360°
  speedKmh: number;
}

export interface GpsBreadcrumbPoint extends GpsCoordinates {
  timestamp: string;
}

export interface GpsHardwareLink {
  satellitesCount: number;
  hdop: number;              // Dilution de précision horizontale (<1.5 = excellent)
  rssiGsmDbm: number;        // Qualité signal cellulaire (-110 à -50 dBm)
  cellularOperator: string;  // Mobilis, Djezzy, Ooredoo
  batteryVoltageV: number;   // Tension batterie véhicule (12V ou 24V nominal)
  lastPingSecondsAgo: number;// Horodatage exact de la dernière trame
}

export interface CanBusMetrics {
  engineRpm: number;                     // SPN 190 (tr/min)
  wheelSpeedKmh: number;                 // SPN 84 (km/h CAN)
  engineLoadPercent: number;             // SPN 92 (%)
  throttlePercent: number;               // SPN 91 (%)
  coolantTempC: number;                  // SPN 110 (°C, critique si > 102°C)
  oilPressureBar: number;                // SPN 100 (Bar / kPa)
  intakeAirTempC: number;                // SPN 105 (°C)
  boostPressureBar: number;              // SPN 102 (Bar)
  fuelLevelPercent: number;              // SPN 96 (%)
  fuelLiters: number;                    // Volume restant en litres
  instantFuelConsumptionL100km: number;  // SPN 183
  fuelDropAnomalyDetected: boolean;      // CUSUM Anti-Fraude
  adBlueLevelPercent: number;            // SPN 1761 (%)
  transmissionGear: string;              // 'N' | 'R' | 'D1'..'D12'
  parkingBrakeEngaged: boolean;          // SPN 70
}

export interface DtcAlert {
  id: string;
  codeString: string;          // Ex: SPN-1087-FMI-1 ou P0087
  protocol: 'J1939' | 'OBD2';
  subsystem: 'ENGINE' | 'COOLING' | 'BRAKES_APS' | 'FUEL_SYSTEM' | 'TRANSMISSION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL_IMMOBILIZATION';
  titleFr: string;
  technicalDescriptionFr: string;
  timestamp: string;
  recommendedWorkshopAction: string;
}

export interface CanRawFrame {
  id: string;
  timestamp: string;
  canIdHex: string;       // Ex: 0x18FEEE00
  pgn: number;            // Ex: 65262 (Engine Temp)
  name: string;           // Ex: ET1 (Engine Temperature 1)
  payloadHex: string;     // Ex: 5C 40 82 00 00 00 00 00
  decodedField: string;   // Ex: SPN 110: 92.0 °C
}

export interface GeofenceZone {
  id: string;
  name: string;
  category: 'LOGISTICS_HUB' | 'QUARRY_MINE' | 'PORT' | 'RESTRICTED_URBAN';
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  colorHex: string;
}

export interface VehicleTelemetryState {
  id: string;
  registrationNumber: string; // Ex: 00421-116-16
  vin: string;
  make: string;
  model: string;
  category: VehicleCategory;
  categoryLabel: string;
  status: VehicleOperationalStatus;
  driverName: string;
  driverPhone: string;
  currentSite: string;
  wilayaCode: string;

  // Mode Télématique Souverain (Master Spec v2.0 §1 & §3)
  telemetryMode?: 'MODE_0_ZERO_HARDWARE' | 'MODE_1_GPS_ONLY' | 'MODE_2_FULL_CAN';
  
  // Données GPS et Télémétriques vivantes
  gps: GpsCoordinates;
  hardware: GpsHardwareLink;
  can: CanBusMetrics;
  
  // Indices & Diagnostics Prédictifs (EPIC 3 & EPIC 4)
  vhiHealthScore: number; // 0-100 Vehicle Health Index
  vhiStatus?: 'OPTIMAL' | 'SURVEILLANCE' | 'MAINTENANCE_REQUISE' | 'CRITIQUE_VETO' | string;
  bottleneckComponent?: string;
  bottleneckScore?: number;
  hardVetoTriggered?: boolean;
  hardVetoOrgan?: string | null;
  organDetails?: Record<string, {
    organId: string;
    nameFr: string;
    nameAr: string;
    degradationIndex: number;
    healthScore: number;
    weight: number;
    isVitalSafetyOrgan: boolean;
    rulEstimate: { value: number; unit: string };
    physicalSummary: string;
  }>;
  odometerKm: number;
  engineHours: number;
  activeDtcs: DtcAlert[];
  
  // Moteur Décisionnel Financier & RUL (SAD -> ADS en DZD)
  financialRiskDzd?: number;
  preventiveCostDzd?: number;
  arbitrageRecommendationFr?: string;
  arbitrageRecommendationAr?: string;
  rulKilometersRemaining?: number;
  
  // Statut DVIR & Verrouillage de Sécurité Terrain (EPIC 5)
  dvirStatus?: {
    isBlocked: boolean;
    latestReportId?: string;
    criticalFailureReason?: string;
    generatedWorkOrderId?: string;
    submittedAt?: string;
  };

  // Historique cinématique récent (Trace Breadcrumb 15 min)
  breadcrumbs: GpsBreadcrumbPoint[];
}

export interface FleetAggregateStats {
  totalVehicles: number;
  inMotion: number;
  idling: number;
  dtcCritical: number;
  dvirBlockedCount?: number;
  offline: number;
  wsLatencyMs: number;
  msgPerSecond: number;
}
