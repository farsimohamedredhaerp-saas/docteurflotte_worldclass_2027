export enum IndustrySector {
  TRANSPORT = 'TRANSPORT',
  LOGISTICS = 'LOGISTICS',
  BTP = 'BTP',
  AGRICULTURE = 'AGRICULTURE',
  COLD_CHAIN = 'COLD_CHAIN',
}

export enum ClimateZoneDZ {
  TELL_URBAN = 'TELL_URBAN',
  HIGH_PLATEAUS = 'HIGH_PLATEAUS',
  SAHARA_SOUTH = 'SAHARA_SOUTH',
}

export enum DispatchAssetCategory {
  LIGHT_VEHICLE = 'LIGHT_VEHICLE',
  VAN = 'VAN',
  HEAVY_TRUCK_RIGID = 'HEAVY_TRUCK_RIGID',
  TRACTOR_TRAILER = 'TRACTOR_TRAILER',
  REEFER_TRUCK = 'REEFER_TRUCK',
  HAZMAT_TANKER = 'HAZMAT_TANKER',
  CONSTRUCTION_EQUIP = 'CONSTRUCTION_EQUIP',
  AGRI_TRACTOR = 'AGRI_TRACTOR',
}

export enum LicenseCategoryDZ {
  B = 'B',
  C1 = 'C1',
  C2 = 'C2',
  E = 'E',
  D = 'D',
}

export enum DocumentTypeDZ {
  CONTROLE_TECHNIQUE_ENACTA = 'CONTROLE_TECHNIQUE_ENACTA',
  ASSURANCE_RC_CATNAT = 'ASSURANCE_RC_CATNAT',
  VIGNETTE_AUTOMOBILE = 'VIGNETTE_AUTOMOBILE',
  AUTORISATION_CIRCULATION_MARCHANDISES = 'AUTORISATION_CIRCULATION_MARCHANDISES',
  AGREMENT_MATIERES_DANGEREUSES_ADR = 'AGREMENT_MATIERES_DANGEREUSES_ADR',
  CERTIFICAT_ATP_CHAINE_FROID = 'CERTIFICAT_ATP_CHAINE_FROID',
  CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE = 'CERTIFICAT_ETALONNAGE_CHRONOTACHYGRAPHE',
  PERMIS_CONDUIRE = 'PERMIS_CONDUIRE',
  BREVET_PROFESSIONNEL_CONDUCTEUR = 'BREVET_PROFESSIONNEL_CONDUCTEUR',
}

export enum DispatchStatus {
  AVAILABLE = 'AVAILABLE',
  IN_MISSION = 'IN_MISSION',
  MAINTENANCE_WARN = 'MAINTENANCE_WARN',
  BLOCKED_SAFETY = 'BLOCKED_SAFETY',
  BLOCKED_REGULATORY = 'BLOCKED_REGULATORY',
}

export interface RegulatoryDocument {
  docType: DocumentTypeDZ;
  docNumber: string;
  issuedAt: string;
  expiresAt: string;
}

export interface SubsystemRUL {
  taskCode: string;
  taskName: string;
  subsystem: string;
  wearRatioPct: number;
  rulKm: number;
  rulEngineHours: number;
  rulDays: number;
  isCriticalSafety: boolean;
}

export interface ActiveDTC {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL_STOP';
  description: string;
}

export interface VehicleStateDto {
  vehicleId: string;
  registrationPlate: string;
  makeModel: string;
  category: DispatchAssetCategory;
  maxPayloadTons: number;
  grossVehicleWeightTons: number;
  fuelType: 'DIESEL' | 'GASOLINE' | 'LPG_GPL';
  refConsumptionL100Km: number;
  hasWorkingReefer: boolean;
  hasWorkingPto: boolean;
  currentWilayaCode: number;
  currentLat: number;
  currentLon: number;
  currentOdometerKm: number;
  currentEngineHours: number;
  annualTargetKm: number;
  ytdDrivenKm: number;
  vehicleHealthIndex: number;
  batterySohPct: number;
  coolingEwmaResidualC: number;
  dispatchStatus: DispatchStatus;
  documents: RegulatoryDocument[];
  subsystemRuls: SubsystemRUL[];
  activeDtcs: ActiveDTC[];
  hasCriticalDvirFailure?: boolean;
  latestDvirInspectionId?: string;
}

export interface DriverStateDto {
  driverId: string;
  fullName: string;
  phoneDz: string;
  licenseCategories: LicenseCategoryDZ[];
  hasBrevetProfessionnel: boolean;
  hasAdrHazmatCert: boolean;
  currentWilayaCode: number;
  continuousDrivingHours: number;
  dailyDrivingHoursToday: number;
  restHoursLast24h: number;
  safetyScore: number;
  isAvailable: boolean;
}

export interface MissionRequestDto {
  missionId: string;
  tenantId: string;
  industrySector: IndustrySector;
  requestedVehicleId: string;
  requestedDriverId: string;
  originName: string;
  originWilayaCode: number;
  originLat: number;
  originLon: number;
  destinationName: string;
  destinationWilayaCode: number;
  transitWilayaCodes: number[];
  plannedDepartureUtc: string;
  routeDistanceKm: number;
  estimatedDrivingHours: number;
  requiredPayloadTons: number;
  targetClimateZone: ClimateZoneDZ;
  requiresReeferColdChain: boolean;
  requiresHazmatAdr: boolean;
  requiresPtoHydraulics: boolean;
}

export interface ViolationDetail {
  code: string;
  gate: 'REGULATORY' | 'WILAYA_RESTRICTION' | 'PREDICTIVE_VHI_RUL' | 'CAPACITY_MATCH';
  severity: 'HARD_BLOCK' | 'SOFT_WARNING_ADJUSTABLE';
  messageFr: string;
  blockingEntityId: string;
}

export interface WorkOrderGenerated {
  workOrderId: string;
  vehicleId: string;
  registrationPlate: string;
  priority: 'URGENT_IMMOBILIZATION' | 'HIGH_PREVENTIVE' | 'ADMINISTRATIVE_RENEWAL';
  category: 'MECHANICAL_PREDICTIVE' | 'REGULATORY_ENACTA_INSURANCE';
  title: string;
  tasksToPerform: string[];
  estimatedDowntimeHours: number;
  createdAtUtc: string;
}

export interface SubstitutionCandidateScore {
  vehicleId: string;
  registrationPlate: string;
  makeModel: string;
  driverId: string;
  driverName: string;
  totalScore100: number;
  vhiScoreComponent: number;
  fuelCostComponent: number;
  approachDistanceComponent: number;
  fleetBalancingComponent: number;
  approachDistanceKm: number;
  estimatedFuelCostDzd: number;
  auditJustification: string;
}

export interface DispatchDecisionResult {
  missionId: string;
  decisionTimestampUtc: string;
  decisionOutcome:
    | 'APPROVED_AS_REQUESTED'
    | 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT'
    | 'SUBSTITUTED_AUTOMATICALLY'
    | 'REJECTED_NO_ELIGIBLE_ASSET';
  assignedVehicleId: string | null;
  assignedRegistrationPlate: string | null;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  originalEtdUtc: string;
  recommendedEtdUtc: string;
  valhallaAvoidPolygons: Record<string, unknown>[];
  routeAdvisoryNotes: string[];
  violationsDetected: ViolationDetail[];
  generatedWorkOrders: WorkOrderGenerated[];
  rankedSubstitutions: SubstitutionCandidateScore[];
}

export interface DispatchEvaluationPayloadDto {
  mission: MissionRequestDto;
  fleetVehicles: VehicleStateDto[];
  fleetDrivers: DriverStateDto[];
}
