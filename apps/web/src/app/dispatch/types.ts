import type {
  DispatchDecisionResult,
  RegulatoryMissionOrderData,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
} from '@/lib/api-fleet-intelligence';

import {
  IndustrySector,
  ClimateZoneDZ,
  AssetCategory,
  LicenseCategoryDZ,
  DispatchStatus,
} from '@/lib/api-fleet-intelligence';

export type {
  DispatchDecisionResult,
  RegulatoryMissionOrderData,
  VehicleStateDto,
  DriverStateDto,
  MissionRequestDto,
};

export {
  IndustrySector,
  ClimateZoneDZ,
  AssetCategory,
  LicenseCategoryDZ,
  DispatchStatus,
};

export interface OfflineVerificationOutput {
  isValid: boolean;
  reason?: string;
  decodedOrder?: {
    orderNumber: string;
    registrationPlate: string;
    validUntil: string;
    driverNin?: string;
    originWilaya?: number;
    destinationWilaya?: number;
    cargoCategory?: string;
    [key: string]: unknown;
  };
}

export interface DispatchMissionFormState {
  selectedSector: IndustrySector;
  selectedVehicleId: string;
  selectedDriverId: string;
  originName: string;
  originWilaya: number;
  destinationName: string;
  destinationWilaya: number;
  transitWilayas: string;
  cargoNature: string;
  payloadTons: number;
  routeKm: number;
  climateZone: ClimateZoneDZ;
  requiresHazmat: boolean;
  requiresReefer: boolean;
}
