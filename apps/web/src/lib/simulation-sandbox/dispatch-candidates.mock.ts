import {
  DocumentTypeDZ,
  DispatchStatus,
  LicenseCategoryDZ,
  IndustrySector,
  ClimateZoneDZ,
} from '@docteurflotte/contracts';
import { AssetCategory as IntelAssetCategory } from '../api-fleet-intelligence';

export interface DispatchCandidateVehicle {
  vehicleId: string;
  registrationPlate: string;
  makeModel: string;
  category: IntelAssetCategory;
  maxPayloadTons: number;
  grossVehicleWeightTons: number;
  fuelType: 'DIESEL' | 'ESSENCE' | 'GPL' | 'CNG';
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
  documents: Array<{
    docType: DocumentTypeDZ;
    docNumber: string;
    issuedAt: string;
    expiresAt: string;
  }>;
  subsystemRuls: unknown[];
  activeDtcs: Array<{
    code: string;
    severity: 'CRITICAL_STOP' | 'WARNING';
    description: string;
  }>;
}

export interface DispatchCandidateDriver {
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

export function getMockSandboxDispatchVehicles(scenario?: string): DispatchCandidateVehicle[] {
  return [
    {
      vehicleId: 'veh-renault-t480',
      registrationPlate: '16-12345-00',
      makeModel: 'Renault Trucks T480 (DTI 13)',
      category: IntelAssetCategory.TRACTOR_TRAILER,
      maxPayloadTons: 28.0,
      grossVehicleWeightTons: 40.0,
      fuelType: 'DIESEL',
      refConsumptionL100Km: 33.5,
      hasWorkingReefer: false,
      hasWorkingPto: false,
      currentWilayaCode: 16,
      currentLat: 36.73,
      currentLon: 3.18,
      currentOdometerKm: 185000,
      currentEngineHours: 4200,
      annualTargetKm: 120000,
      ytdDrivenKm: 98000,
      vehicleHealthIndex: scenario === 'CRITICAL_VHI' ? 38 : 78,
      batterySohPct: 88,
      coolingEwmaResidualC: 1.2,
      dispatchStatus: DispatchStatus.AVAILABLE,
      documents: [
        {
          docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA,
          docNumber: 'ENACTA-2025-0912',
          issuedAt: '2025-04-10',
          expiresAt: scenario === 'ENACTA_EXPIRED' ? '2025-10-10' : '2027-04-10',
        },
        {
          docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT,
          docNumber: 'CAAR-POL-9921',
          issuedAt: '2026-01-01',
          expiresAt: '2027-01-01',
        },
        {
          docType: DocumentTypeDZ.VIGNETTE_AUTOMOBILE,
          docNumber: 'VIG-2026-16-092',
          issuedAt: '2026-03-01',
          expiresAt: '2027-03-01',
        },
      ],
      subsystemRuls: [],
      activeDtcs:
        scenario === 'CRITICAL_VHI'
          ? [{ code: 'SPN 110 FMI 0', severity: 'CRITICAL_STOP', description: 'Surchauffe culasse anormale' }]
          : [],
    },
    {
      vehicleId: 'veh-scania-r450',
      registrationPlate: '16-04218-00',
      makeModel: 'Scania R 450 (DC13 XPI)',
      category: IntelAssetCategory.TRACTOR_TRAILER,
      maxPayloadTons: 30.0,
      grossVehicleWeightTons: 40.0,
      fuelType: 'DIESEL',
      refConsumptionL100Km: 31.5,
      hasWorkingReefer: false,
      hasWorkingPto: false,
      currentWilayaCode: 16,
      currentLat: 36.71,
      currentLon: 3.15,
      currentOdometerKm: 92000,
      currentEngineHours: 2100,
      annualTargetKm: 120000,
      ytdDrivenKm: 85000,
      vehicleHealthIndex: 94,
      batterySohPct: 96,
      coolingEwmaResidualC: 0.4,
      dispatchStatus: DispatchStatus.AVAILABLE,
      documents: [
        { docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA, docNumber: 'ENACTA-2026-014', issuedAt: '2026-01-15', expiresAt: '2027-01-15' },
        { docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT, docNumber: 'SAA-2026-88', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
        { docType: DocumentTypeDZ.VIGNETTE_AUTOMOBILE, docNumber: 'VIG-2026-16-11', issuedAt: '2026-03-01', expiresAt: '2027-03-01' },
      ],
      subsystemRuls: [],
      activeDtcs: [],
    },
    {
      vehicleId: 'veh-man-tgs',
      registrationPlate: '31-08912-00',
      makeModel: 'MAN TGS 33.440 6x4',
      category: IntelAssetCategory.TRACTOR_TRAILER,
      maxPayloadTons: 32.0,
      grossVehicleWeightTons: 40.0,
      fuelType: 'DIESEL',
      refConsumptionL100Km: 36.0,
      hasWorkingReefer: false,
      hasWorkingPto: false,
      currentWilayaCode: 31,
      currentLat: 35.69,
      currentLon: -0.63,
      currentOdometerKm: 140000,
      currentEngineHours: 3500,
      annualTargetKm: 120000,
      ytdDrivenKm: 90000,
      vehicleHealthIndex: 82,
      batterySohPct: 91,
      coolingEwmaResidualC: 0.8,
      dispatchStatus: DispatchStatus.AVAILABLE,
      documents: [
        { docType: DocumentTypeDZ.CONTROLE_TECHNIQUE_ENACTA, docNumber: 'ENACTA-2026-088', issuedAt: '2026-02-10', expiresAt: '2027-02-10' },
        { docType: DocumentTypeDZ.ASSURANCE_RC_CATNAT, docNumber: 'CASH-2026-01', issuedAt: '2026-01-01', expiresAt: '2027-01-01' },
      ],
      subsystemRuls: [],
      activeDtcs: [],
    },
  ];
}

export const MOCK_SANDBOX_DISPATCH_DRIVERS: DispatchCandidateDriver[] = [
  {
    driverId: 'drv-ahmed',
    fullName: 'Ahmed Benali',
    phoneDz: '0550123456',
    licenseCategories: [LicenseCategoryDZ.C2, LicenseCategoryDZ.E],
    hasBrevetProfessionnel: true,
    hasAdrHazmatCert: false,
    currentWilayaCode: 16,
    continuousDrivingHours: 1.5,
    dailyDrivingHoursToday: 3.0,
    restHoursLast24h: 11.0,
    safetyScore: 92,
    isAvailable: true,
  },
  {
    driverId: 'drv-karim',
    fullName: 'Karim Ziani',
    phoneDz: '0661987654',
    licenseCategories: [LicenseCategoryDZ.C2, LicenseCategoryDZ.E],
    hasBrevetProfessionnel: true,
    hasAdrHazmatCert: false,
    currentWilayaCode: 16,
    continuousDrivingHours: 0.0,
    dailyDrivingHoursToday: 0.0,
    restHoursLast24h: 14.0,
    safetyScore: 95,
    isAvailable: true,
  },
];

export function getMockSandboxDispatchMission(scenario?: string) {
  const departureHour = scenario === 'WILAYA_RESTRICTION' ? '08:00:00Z' : '22:00:00Z';
  return {
    missionId: `MIS-DZ-${Date.now().toString().slice(-6)}`,
    tenantId: 'tenant-default',
    industrySector: IndustrySector.TRANSPORT,
    requestedVehicleId: 'veh-renault-t480',
    requestedDriverId: 'drv-ahmed',
    originName: 'Zone Industrielle Rouiba (Alger)',
    originWilayaCode: 16,
    originLat: 36.73,
    originLon: 3.18,
    destinationName: 'Base de Vie Sud (Hassi Messaoud)',
    destinationWilayaCode: 30,
    transitWilayaCodes: [16, 9, 26, 17, 30],
    plannedDepartureUtc: `2026-10-25T${departureHour}`,
    routeDistanceKm: 850,
    estimatedDrivingHours: 11.5,
    requiredPayloadTons: 24.0,
    targetClimateZone: ClimateZoneDZ.SAHARA_SOUTH,
    requiresReeferColdChain: false,
    requiresHazmatAdr: false,
    requiresPtoHydraulics: false,
  };
}
